"""Analysis job schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from backend.app.schemas.file import SignalFileOut


class AnalysisJobCreate(BaseModel):
    signal_file_id: int
    pipeline_config: Optional[Dict[str, Any]] = None


class ProcessingStageOut(BaseModel):
    id: int
    stage_name: str
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_ms: float
    configuration: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    error: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class AnalysisJobOut(BaseModel):
    id: int
    signal_file_id: int
    status: str
    progress: int
    current_stage: str
    pipeline_config: Dict[str, Any] = {}
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    signal_file: Optional[SignalFileOut] = None

    class Config:
        from_attributes = True


class JobStatusOut(BaseModel):
    job_id: int
    status: str
    progress: int
    current_stage: str
    error: Optional[str] = None
    completed_at: Optional[datetime] = None
