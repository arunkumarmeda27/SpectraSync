"""Report generation and export endpoints supporting JSON, CSV, HTML, and PDF formats."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.analysis_job import AnalysisJob
from backend.app.services.report_service import ReportService

router = APIRouter(tags=["reports"], dependencies=[Depends(get_current_user)])


def _format_report_response(db: Session, job_id: int, export_format: str) -> Response:
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job or not job.result:
        raise HTTPException(status_code=400, detail="Job has not completed analysis yet")

    if export_format == "pdf":
        pdf_data = ReportService.generate_pdf_report(db, job_id)
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=spectrasync_job_{job_id}_report.pdf"}
        )
    elif export_format == "csv":
        csv_data = ReportService.generate_csv_parameters(db, job_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=spectrasync_job_{job_id}_parameters.csv"}
        )
    elif export_format == "html":
        html_data = ReportService.generate_html_report(db, job_id)
        return Response(
            content=html_data,
            media_type="text/html",
            headers={"Content-Disposition": f"inline; filename=spectrasync_job_{job_id}_report.html"}
        )
    else:  # json
        return ReportService.generate_json_report(db, job_id)


@router.post("/jobs/{job_id}/report")
def create_report(
    job_id: int,
    export_format: str = Query("json", pattern="^(json|csv|html|pdf)$"),
    db: Session = Depends(get_db)
):
    """Generate and return an analysis report in JSON, CSV, HTML, or PDF format."""
    return _format_report_response(db, job_id, export_format)


@router.post("/reports/{job_id}/generate")
def generate_report_alias(
    job_id: int,
    format: str = Query("json", pattern="^(json|csv|html|pdf)$"),
    db: Session = Depends(get_db)
):
    """Endpoint alias matching frontend client report generation."""
    return _format_report_response(db, job_id, format)


@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    """List completed jobs available for report export."""
    completed = db.query(AnalysisJob).filter(AnalysisJob.status == "completed").order_by(AnalysisJob.completed_at.desc()).all()
    return [
        {
            "job_id": job.id,
            "filename": job.signal_file.filename if job.signal_file else "unknown",
            "modulation": job.result.primary_modulation if job.result else "UNKNOWN",
            "confidence": job.result.confidence if job.result else 0.0,
            "completed_at": job.completed_at
        }
        for job in completed
    ]


@router.get("/reports/{job_id}")
def get_report(job_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed JSON report for a completed job."""
    try:
        return ReportService.generate_json_report(db, job_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.get("/reports/{job_id}/download")
def download_report_file(
    job_id: int,
    format: str = Query("pdf", pattern="^(json|csv|html|pdf)$"),
    db: Session = Depends(get_db)
):
    """Direct downloadable report endpoint for browser links."""
    return _format_report_response(db, job_id, format)
