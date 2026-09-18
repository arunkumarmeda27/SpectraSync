"""Pipeline stage definitions and telemetry structures adhering to Section 2 of SpectraSync architecture."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
import time


class StageName(str, Enum):
    VALIDATION = "validation"
    METADATA_PARSING = "metadata_parsing"
    PREPROCESSING = "preprocessing"
    SIGNAL_ANALYSIS = "signal_analysis"
    PARAMETER_INFERENCE = "parameter_inference"
    MODULATION_CLASSIFICATION = "modulation_classification"
    SYNCHRONIZATION = "synchronization"
    DEMODULATION = "demodulation"
    DE_INTERLEAVING = "de_interleaving"
    FEC = "fec"
    BIT_STREAM_ANALYSIS = "bit_stream_analysis"
    CORRELATION = "correlation"
    RESULT_PACKAGING = "result_packaging"


class StageStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    WARNING = "warning"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class StageResult:
    """Execution telemetry for a single DSP stage.

    Guarantees every stage exposes:
    INPUT, OUTPUT, CONFIGURATION, CONFIDENCE, QUALITY METRICS, PROVENANCE, ERROR INFORMATION.
    """
    stage_name: StageName
    status: StageStatus = StageStatus.PENDING
    started_at: float = field(default_factory=time.time)
    completed_at: Optional[float] = None
    duration_ms: float = 0.0

    input_summary: Dict[str, Any] = field(default_factory=dict)
    output_summary: Dict[str, Any] = field(default_factory=dict)
    configuration: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    quality_metrics: Dict[str, Any] = field(default_factory=dict)
    provenance: Dict[str, Any] = field(default_factory=dict)
    error_info: Optional[Dict[str, Any]] = None

    def mark_completed(
        self,
        output_summary: Dict[str, Any],
        quality_metrics: Optional[Dict[str, Any]] = None,
        confidence: float = 1.0
    ) -> None:
        self.completed_at = time.time()
        self.duration_ms = round((self.completed_at - self.started_at) * 1000.0, 2)
        self.output_summary = output_summary
        if quality_metrics:
            self.quality_metrics = quality_metrics
        self.confidence = round(confidence, 3)
        self.status = StageStatus.COMPLETED

    def mark_failed(self, error: str, cause: str = "", suggested_action: str = "") -> None:
        self.completed_at = time.time()
        self.duration_ms = round((self.completed_at - self.started_at) * 1000.0, 2)
        self.status = StageStatus.FAILED
        self.confidence = 0.0
        self.error_info = {
            "error": error,
            "cause": cause,
            "suggested_action": suggested_action
        }
