"""Recovered bitstream model."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, JSON, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Bitstream(Base):
    __tablename__ = "bitstreams"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("analysis_jobs.id"), unique=True, nullable=False)
    length = Column(Integer, default=0)
    artifact_reference = Column(String, nullable=True)
    correlation_score = Column(Float, default=0.0)
    header_offsets = Column(JSON, default=list)
    payload_frames = Column(JSON, default=list)
    hex_stream = Column(Text, default="")
    ascii_stream = Column(Text, default="")
    bit_density = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("AnalysisJob", back_populates="bitstream")
