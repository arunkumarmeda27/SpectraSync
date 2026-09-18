"""Analysis job execution state and metadata."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    signal_file_id = Column(Integer, ForeignKey("signal_files.id"), nullable=False)
    status = Column(String, default="queued", index=True)
    progress = Column(Integer, default=0)
    current_stage = Column(String, default="queued")
    pipeline_config = Column(JSON, default=dict)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error = Column(String, nullable=True)

    # Relationships
    signal_file = relationship("SignalFile")
    result = relationship("AnalysisResult", uselist=False, back_populates="job")
    bitstream = relationship("Bitstream", uselist=False, back_populates="job")
    artifacts = relationship("Artifact", back_populates="job")
    stages = relationship("ProcessingStage", back_populates="job")
