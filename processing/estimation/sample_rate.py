"""Sample rate parameter estimation with provenance and uncertainty."""

from typing import Any, Dict, Optional
from processing.pipeline.context import SignalData


class SampleRateEstimator:
    """Infers sample rate from metadata or marks as unknown when unspecified."""

    @staticmethod
    def estimate(signal_data: SignalData) -> Dict[str, Any]:
        """Estimate sample rate preserving provenance and confidence."""
        # 1. Check if derived from file metadata
        if signal_data.sample_rate and signal_data.sample_rate > 0:
            return {
                "parameter": "sample_rate",
                "value": float(signal_data.sample_rate),
                "unit": "Hz",
                "confidence": 0.99,
                "confidence_label": "High",
                "source": "metadata",
                "method": "header_inspection",
                "uncertainty": 0.0,
                "description": "Extracted directly from recording container header or sidecar metadata."
            }

        # If raw IQ without explicit rate
        return {
            "parameter": "sample_rate",
            "value": 1_000_000.0,  # Nominal fallback
            "unit": "Hz",
            "confidence": 0.20,
            "confidence_label": "Low",
            "source": "dsp_estimate",
            "method": "default_fallback",
            "uncertainty": 500_000.0,
            "description": "UNKNOWN / AMBIGUOUS: Sample rate missing in raw IQ recording. Default assumed."
        }
