"""Signal file model for uploaded .IQ and .WAV recordings."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, BigInteger, DateTime
from backend.app.core.database import Base


class SignalFile(Base):
    __tablename__ = "signal_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    format = Column(String, nullable=False)  # "iq", "wav"
    size = Column(BigInteger, nullable=False)
    sample_rate = Column(Float, default=1_000_000.0)
    channels = Column(Integer, default=2)
    sample_format = Column(String, default="complex64")
    center_frequency = Column(Float, default=0.0)
    storage_path = Column(String, nullable=False)
    checksum = Column(String, nullable=False, index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
