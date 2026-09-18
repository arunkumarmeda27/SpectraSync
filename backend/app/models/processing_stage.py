"""Processing stage execution telemetry model."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class ProcessingStage(Base):
    __tablename__ = "processing_stages"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("analysis_jobs.id"), nullable=False)
    stage_name = Column(String, nullable=False)
    status = Column(String, default="pending")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Float, default=0.0)
    configuration = Column(JSON, default=dict)
    metrics = Column(JSON, default=dict)
    error = Column(JSON, nullable=True)

    job = relationship("AnalysisJob", back_populates="stages")
