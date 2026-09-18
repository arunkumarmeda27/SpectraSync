"""Artifact model for generated plots, binary bits, and reports."""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("analysis_jobs.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "plot", "bitstream", "report_json", "report_csv"
    storage_path = Column(String, nullable=False)
    size = Column(BigInteger, default=0)
    checksum = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("AnalysisJob", back_populates="artifacts")
