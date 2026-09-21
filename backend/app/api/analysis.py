"""Analysis result inspection endpoints matching Section 22."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.analysis_job import AnalysisJob
from backend.app.models.analysis_result import AnalysisResult
from backend.app.models.artifact import Artifact
from backend.app.models.bitstream import Bitstream
from processing.bitstream.extraction import BitStreamExtractor

router = APIRouter(prefix="/jobs/{job_id}", tags=["analysis"], dependencies=[Depends(get_current_user)])


def _get_job(db: Session, job_id: int) -> AnalysisJob:
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/analysis")
def get_full_analysis(job_id: int, db: Session = Depends(get_db)):
    """Retrieve full unified analysis payload."""
    job = _get_job(db, job_id)
    if not job.result:
        raise HTTPException(status_code=400, detail="Analysis results not yet available for this job")

    res = job.result
    bitstream = job.bitstream
    stages_data = [
        {
            "stage_name": st.stage_name,
            "status": st.status,
            "duration_ms": st.duration_ms,
            "metrics": st.metrics,
            "configuration": st.configuration,
            "error": st.error
        }
        for st in job.stages
    ]

    return {
        "job_id": job.id,
        "status": job.status,
        "primary_modulation": res.primary_modulation,
        "confidence": res.confidence,
        "parameters": res.parameters,
        "modulation": {
            "primary_modulation": res.primary_modulation,
            "primary_confidence": res.confidence,
            "candidates": res.modulation_candidates
        },
        "modulation_evidence": {
            "features": (res.visualizations or {}).get("modulation_features", {}),
            "consistency_notes": (res.visualizations or {}).get("modulation_notes", [])
        },
        "synchronization": res.synchronization_data,
        "demodulation": res.demodulation_data,
        "visualizations": res.visualizations,
        "bitstream": {
            "length": bitstream.length if bitstream else 0,
            "bit_density": bitstream.bit_density if bitstream else 0.0,
            "hex_stream": bitstream.hex_stream if bitstream else "",
            "ascii_stream": bitstream.ascii_stream if bitstream else "",
            "headers": bitstream.header_offsets if bitstream else []
        },
        "stages": stages_data
    }


@router.get("/parameters")
def get_parameters(job_id: int, db: Session = Depends(get_db)):
    """Retrieve estimated physical parameters with confidence and provenance."""
    job = _get_job(db, job_id)
    if not job.result:
        raise HTTPException(status_code=400, detail="Parameters not yet available")
    return {
        "job_id": job.id,
        "parameters": job.result.parameters,
        "overall_confidence": job.result.confidence
    }


@router.get("/modulation")
def get_modulation(job_id: int, db: Session = Depends(get_db)):
    """Retrieve modulation candidate distribution, DSP and ML evidence."""
    job = _get_job(db, job_id)
    if not job.result:
        raise HTTPException(status_code=400, detail="Modulation analysis not yet available")
    return {
        "job_id": job.id,
        "primary_modulation": job.result.primary_modulation,
        "primary_confidence": job.result.confidence,
        "candidates": job.result.modulation_candidates
    }


@router.get("/synchronization")
def get_synchronization(job_id: int, db: Session = Depends(get_db)):
    """Retrieve timing recovery and carrier recovery metrics."""
    job = _get_job(db, job_id)
    if not job.result:
        raise HTTPException(status_code=400, detail="Synchronization data not yet available")
    return {
        "job_id": job.id,
        "synchronization": job.result.synchronization_data
    }


@router.get("/demodulation")
def get_demodulation(job_id: int, db: Session = Depends(get_db)):
    """Retrieve demodulated symbols, decision metrics, and recovered bits."""
    job = _get_job(db, job_id)
    if not job.result:
        raise HTTPException(status_code=400, detail="Demodulation data not yet available")
    return {
        "job_id": job.id,
        "demodulation": job.result.demodulation_data
    }


@router.get("/recovery")
def get_recovery(job_id: int, db: Session = Depends(get_db)):
    """Retrieve de-interleaving and FEC decoding metrics."""
    job = _get_job(db, job_id)
    stages_metrics = {st.stage_name: st.metrics for st in job.stages}
    stages_config = {st.stage_name: st.configuration for st in job.stages}
    return {
        "job_id": job.id,
        "deinterleaving": {
            "metrics": stages_metrics.get("de_interleaving", {}),
            "configuration": stages_config.get("de_interleaving", {})
        },
        "fec": {
            "metrics": stages_metrics.get("fec", {}),
            "summary": stages_config.get("fec", {})
        }
    }


@router.get("/bitstream")
def get_bitstream(job_id: int, db: Session = Depends(get_db)):
    """Retrieve recovered bit stream views (Hex dump, ASCII, Binary, headers)."""
    job = _get_job(db, job_id)
    if not job.bitstream:
        raise HTTPException(status_code=400, detail="Bit stream not yet available")
    bs = job.bitstream
    recovered_bits = (job.result.demodulation_data or {}).get("recovered_bits", []) if job.result else []
    views = BitStreamExtractor.format_views(recovered_bits)
    return {
        "job_id": job.id,
        "length": bs.length,
        "symbol_count": (job.result.demodulation_data or {}).get("symbol_count", 0) if job.result else 0,
        "bits_per_symbol": (job.result.demodulation_data or {}).get("bits_per_symbol", 0) if job.result else 0,
        "bit_rate_bps": (job.result.demodulation_data or {}).get("bit_rate_bps", 0) if job.result else 0,
        "bit_density": bs.bit_density,
        "transition_density": views.get("transition_density", 0.0),
        "ones_count": views.get("ones_count", 0),
        "zeros_count": views.get("zeros_count", 0),
        "binary_preview": views.get("binary_preview", ""),
        "hex_dump": views.get("hex_dump", []),
        "ascii_preview": views.get("ascii_preview", ""),
        "correlation_score": bs.correlation_score,
        "header_offsets": bs.header_offsets,
        "payload_frames": bs.payload_frames,
        "hex_stream": bs.hex_stream,
        "ascii_stream": bs.ascii_stream
    }


@router.get("/correlation")
def get_correlation(job_id: int, db: Session = Depends(get_db)):
    """Retrieve correlation score, peak position, and cross-correlation curve."""
    job = _get_job(db, job_id)
    if not job.bitstream:
        raise HTTPException(status_code=400, detail="Correlation not yet available")
    return {
        "job_id": job.id,
        "correlation_score": job.bitstream.correlation_score,
        "header_offsets": job.bitstream.header_offsets
    }


@router.get("/artifacts")
def get_artifacts(job_id: int, db: Session = Depends(get_db)):
    """List all stored artifacts for this job."""
    job = _get_job(db, job_id)
    artifacts = db.query(Artifact).filter(Artifact.job_id == job_id).all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "type": a.type,
            "size": a.size,
            "checksum": a.checksum,
            "created_at": a.created_at
        }
        for a in artifacts
    ]


# Secondary alias router for /api/analysis/* path compatibility
alias_router = APIRouter(prefix="/analysis", tags=["analysis"], dependencies=[Depends(get_current_user)])


@alias_router.get("/{job_id}")
def get_analysis_by_job_alias(job_id: int, db: Session = Depends(get_db)):
    """Direct alias for /api/jobs/{job_id}/analysis."""
    return get_full_analysis(job_id, db)


@alias_router.get("/{job_id}/stages")
def get_analysis_stages_alias(job_id: int, db: Session = Depends(get_db)):
    """Direct alias for /api/jobs/{job_id}/stages."""
    job = _get_job(db, job_id)
    return [
        {
            "id": st.id,
            "job_id": st.job_id,
            "stage_name": st.stage_name,
            "status": st.status,
            "duration_ms": st.duration_ms,
            "metrics": st.metrics,
            "configuration": st.configuration,
            "error": st.error
        }
        for st in job.stages
    ]

