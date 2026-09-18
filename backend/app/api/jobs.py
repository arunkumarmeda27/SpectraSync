"""Analysis job management API router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.analysis_job import AnalysisJob
from backend.app.schemas.job import AnalysisJobCreate, AnalysisJobOut, JobStatusOut
from backend.app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=AnalysisJobOut)
def create_job(job_in: AnalysisJobCreate, db: Session = Depends(get_db)):
    """Create and queue a new asynchronous DSP analysis job."""
    try:
        job = JobService.create_job(
            db,
            signal_file_id=job_in.signal_file_id,
            pipeline_config=job_in.pipeline_config
        )
        return job
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[AnalysisJobOut])
def list_jobs(db: Session = Depends(get_db)):
    """List all analysis jobs with status, modulation, and timestamps."""
    return db.query(AnalysisJob).order_by(AnalysisJob.id.desc()).all()


@router.get("/{job_id}", response_model=AnalysisJobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific analysis job."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{job_id}/status", response_model=JobStatusOut)
def get_job_status(job_id: int, db: Session = Depends(get_db)):
    """Retrieve real-time status and progress percentage."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusOut(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        current_stage=job.current_stage,
        error=job.error,
        completed_at=job.completed_at
    )


@router.post("/{job_id}/retry", response_model=AnalysisJobOut)
def retry_job(job_id: int, db: Session = Depends(get_db)):
    """Retry a failed analysis job."""
    try:
        job = JobService.retry_job(db, job_id)
        return job
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete an analysis job and associated artifacts."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Cascade delete child records
    if job.result:
        db.delete(job.result)
    if job.bitstream:
        db.delete(job.bitstream)
    for st in job.stages:
        db.delete(st)
    for art in job.artifacts:
        db.delete(art)

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
