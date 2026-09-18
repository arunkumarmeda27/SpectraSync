"""Signal amplitude and power normalization module."""

from typing import Dict, Any, Tuple
import numpy as np


class Normalizer:
    """Normalizes signal amplitude or average power."""

    @staticmethod
    def normalize(
        samples: np.ndarray,
        target_mode: str = "peak",  # "peak" or "rms"
        target_level: float = 1.0
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Normalize signal amplitude to target peak or unit RMS power."""
        if len(samples) == 0:
            return samples, {"operation": "normalization", "status": "empty"}

        initial_peak = float(np.max(np.abs(samples)))
        initial_rms = float(np.sqrt(np.mean(np.abs(samples)**2)))

        if target_mode == "rms":
            scale_factor = target_level / (initial_rms + 1e-12)
        else:  # "peak"
            scale_factor = target_level / (initial_peak + 1e-12)

        normalized = samples * scale_factor
        final_peak = float(np.max(np.abs(normalized)))
        final_rms = float(np.sqrt(np.mean(np.abs(normalized)**2)))

        config = {
            "operation": "normalization",
            "mode": target_mode,
            "target_level": target_level,
            "scale_factor": scale_factor,
            "initial_peak": initial_peak,
            "final_peak": final_peak,
            "initial_rms": initial_rms,
            "final_rms": final_rms
        }

        return normalized, config
