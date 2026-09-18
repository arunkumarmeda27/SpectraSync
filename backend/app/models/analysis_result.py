"""Persisted signal analysis results, parameters, and visualizations."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("analysis_jobs.id"), unique=True, nullable=False)
    primary_modulation = Column(String, default="UNKNOWN")
    confidence = Column(Float, default=0.0)
    parameters = Column(JSON, default=dict)
    modulation_candidates = Column(JSON, default=list)
    synchronization_data = Column(JSON, default=dict)
    demodulation_data = Column(JSON, default=dict)
    visualizations = Column(JSON, default=dict)
    algorithm_versions = Column(JSON, default=dict)
    model_versions = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("AnalysisJob", back_populates="result")
