"""Job orchestration service."""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.analysis_job import AnalysisJob
from backend.app.models.signal_file import SignalFile
from workers.queue_backend import job_queue


class JobService:
    """Creates, queues, and tracks analysis jobs."""

    @classmethod
    def create_job(
        cls,
        db: Session,
        signal_file_id: int,
        pipeline_config: Optional[Dict[str, Any]] = None
    ) -> AnalysisJob:
        """Create a new job, commit to DB, and dispatch to worker queue."""
        signal_file = db.query(SignalFile).filter(SignalFile.id == signal_file_id).first()
        if not signal_file:
            raise ValueError(f"Signal file #{signal_file_id} not found")

        job = AnalysisJob(
            signal_file_id=signal_file_id,
            status="queued",
            progress=0,
            current_stage="queued",
            pipeline_config=pipeline_config or {}
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Enqueue for asynchronous worker processing
        job_queue.enqueue("process_analysis_job", {"job_id": job.id})

        return job

    @classmethod
    def retry_job(cls, db: Session, job_id: int) -> AnalysisJob:
        """Reset failed job and re-enqueue."""
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            raise ValueError(f"Job #{job_id} not found")

        job.status = "queued"
        job.progress = 0
        job.current_stage = "queued"
        job.error = None
        job.started_at = None
        job.completed_at = None
        db.commit()
        db.refresh(job)

        job_queue.enqueue("process_analysis_job", {"job_id": job.id})
        return job
