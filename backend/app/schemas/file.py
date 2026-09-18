"""File ingestion schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class SignalFileOut(BaseModel):
    id: int
    filename: str
    format: str
    size: int
    sample_rate: float
    channels: int
    sample_format: str
    center_frequency: float
    storage_path: str
    checksum: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    file: SignalFileOut
    validation_status: str
    warnings: List[str] = []
