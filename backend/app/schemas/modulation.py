"""Modulation classification and bitstream schemas."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ModulationCandidate(BaseModel):
    modulation: str
    probability: float
    confidence_percentage: float


class ModulationAnalysisResponse(BaseModel):
    job_id: int
    primary_modulation: str
    primary_confidence: float
    candidates: List[ModulationCandidate]
    dsp_features: Dict[str, float]
    consistency_notes: List[str]
    classical_candidates: List[Dict[str, Any]] = []
    ml_candidates: List[Dict[str, Any]] = []


class HexDumpRow(BaseModel):
    offset: str
    hex: str
    ascii: str


class BitstreamResponse(BaseModel):
    job_id: int
    length: int
    bit_density: float
    transition_density: float
    hex_stream_preview: str
    ascii_preview: str
    hex_dump: List[HexDumpRow]
    headers_detected: List[Dict[str, Any]] = []
    payload_frames: List[Dict[str, Any]] = []
