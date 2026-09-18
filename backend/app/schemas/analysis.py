"""Comprehensive analysis response schema."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AnalysisSummaryResponse(BaseModel):
    job_id: int
    status: str
    primary_modulation: str
    confidence: float
    parameters: Dict[str, Any]
    visualizations: Dict[str, Any]
    demodulation: Dict[str, Any]
    synchronization: Dict[str, Any]
    bitstream_summary: Dict[str, Any]
    correlation: Dict[str, Any]
    stages: List[Dict[str, Any]]
