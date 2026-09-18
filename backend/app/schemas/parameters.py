"""Parameter estimation schemas with confidence and provenance."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ParameterItem(BaseModel):
    parameter: str
    value: float
    unit: str
    confidence: float
    confidence_label: str  # "High", "Medium", "Low"
    source: str           # "metadata", "dsp_estimate", "ml_predicted", "combined_inference"
    method: str
    uncertainty: float
    description: Optional[str] = None
    extra_metrics: Dict[str, Any] = {}


class ParametersResponse(BaseModel):
    job_id: int
    parameters: Dict[str, ParameterItem]
    overall_confidence: float
