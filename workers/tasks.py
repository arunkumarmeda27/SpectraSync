"""Worker task definitions and pipeline execution runner."""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict

from backend.app.core.database import SessionLocal
from backend.app.models.analysis_job import AnalysisJob
from backend.app.models.analysis_result import AnalysisResult
from backend.app.models.artifact import Artifact
from backend.app.models.bitstream import Bitstream
from backend.app.models.processing_stage import ProcessingStage
from backend.app.services.storage_service import storage_service
from processing.pipeline.pipeline import DspPipeline
from processing.pipeline.stages import StageName
from workers.queue_backend import InMemoryQueue, job_queue

# Global in-memory broadcast registry for WebSocket listeners
active_subscribers = {}


def register_ws_subscriber(job_id: int, callback):
    if job_id not in active_subscribers:
        active_subscribers[job_id] = []
    active_subscribers[job_id].append(callback)


def unregister_ws_subscriber(job_id: int, callback):
    if job_id in active_subscribers and callback in active_subscribers[job_id]:
        active_subscribers[job_id].remove(callback)


def broadcast_update(job_id: int, message: Dict[str, Any]):
    if job_id in active_subscribers:
        for cb in list(active_subscribers[job_id]):
            try:
                cb(message)
            except Exception:
                pass


def process_analysis_job(payload: Dict[str, Any]) -> None:
    """Execute DSP analysis pipeline for a queued job."""
    job_id = payload.get("job_id")
    if not job_id:
        return

    db = SessionLocal()
    try:
        job: AnalysisJob = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job or not job.signal_file:
            return

        job.status = "validating"
        job.progress = 5
        job.started_at = datetime.now(timezone.utc)
        db.commit()

        abs_file_path = storage_service.get_file_path(job.signal_file.storage_path)

        def progress_cb(stage: StageName, percent: int, msg: str):
            try:
                # Update DB
                job.status = stage.value
                job.current_stage = stage.value
                job.progress = percent
                db.commit()

                # Broadcast via WebSocket
                broadcast_update(job_id, {
                    "job_id": job_id,
                    "stage": stage.value,
                    "progress": percent,
                    "message": msg,
                    "status": "running"
                })
            except Exception:
                pass

        pipeline = DspPipeline(progress_callback=progress_cb)
        results = pipeline.execute(abs_file_path, config=job.pipeline_config)

        if results.get("status") == "failed":
            job.status = "failed"
            job.error = results.get("error", "DSP pipeline failed")
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
            broadcast_update(job_id, {"job_id": job_id, "status": "failed", "error": job.error})
            return

        # ---------------------------------------------------------
        # Persist Stage Telemetry
        # ---------------------------------------------------------
        for st in results.get("stages", []):
            stage_rec = ProcessingStage(
                job_id=job.id,
                stage_name=st.get("stage_name"),
                status=st.get("status"),
                duration_ms=st.get("duration_ms", 0.0),
                configuration=st.get("configuration", {}),
                metrics=st.get("quality_metrics", {}),
                error=st.get("error_info")
            )
            db.add(stage_rec)

        # ---------------------------------------------------------
        # Persist Analysis Result
        # ---------------------------------------------------------
        analysis_result = AnalysisResult(
            job_id=job.id,
            primary_modulation=results["modulation"]["primary_modulation"],
            confidence=results["modulation"]["primary_confidence"],
            parameters=results["parameters"],
            modulation_candidates=results["modulation"]["candidates"],
            synchronization_data=results["synchronization"],
            demodulation_data=results["demodulation"],
            visualizations=results["visualizations"],
            algorithm_versions={"pipeline": "1.0.0", "viterbi": "CCSDS_K7", "rs": "GF256"},
            model_versions={"modulation_rf": "1.0.0"}
        )
        db.add(analysis_result)

        # ---------------------------------------------------------
        # Persist Bitstream
        # ---------------------------------------------------------
        bit_data = results["bitstream"]
        bitstream_rec = Bitstream(
            job_id=job.id,
            length=bit_data.get("total_bits", 0),
            correlation_score=results["correlation"].get("correlation_score", 0.0),
            header_offsets=results["headers"],
            payload_frames=results.get("payloads", []),
            hex_stream=results["demodulation"].get("hex_stream", ""),
            ascii_stream=bit_data.get("ascii_preview", ""),
            bit_density=bit_data.get("bit_density", 0.0)
        )
        db.add(bitstream_rec)

        # ---------------------------------------------------------
        # Save Artifact: Full Analysis JSON
        # ---------------------------------------------------------
        json_bytes = json.dumps(results, indent=2).encode("utf-8")
        json_storage_path = storage_service.save_file(
            f"analysis_job_{job.id}.json",
            json_bytes,
            subfolder="artifacts"
        )
        json_checksum = hashlib.sha256(json_bytes).hexdigest()

        artifact_rec = Artifact(
            job_id=job.id,
            name=f"job_{job.id}_full_analysis.json",
            type="report_json",
            storage_path=json_storage_path,
            size=len(json_bytes),
            checksum=json_checksum
        )
        db.add(artifact_rec)

        # Finalize job
        job.status = "completed"
        job.progress = 100
        job.current_stage = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

        broadcast_update(job_id, {
            "job_id": job_id,
            "status": "completed",
            "progress": 100,
            "primary_modulation": results["modulation"]["primary_modulation"],
            "confidence": results["modulation"]["primary_confidence"]
        })

    except Exception as ex:
        db.rollback()
        try:
            job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error = str(ex)
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
            broadcast_update(job_id, {"job_id": job_id, "status": "failed", "error": str(ex)})
        except Exception:
            pass
    finally:
        db.close()


# Register with in-memory worker queue if active
if isinstance(job_queue, InMemoryQueue):
    job_queue.register_handler("process_analysis_job", process_analysis_job)
