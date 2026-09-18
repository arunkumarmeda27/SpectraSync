"""Rational and polyphase resampling for digital signals."""

from math import gcd
from typing import Dict, Any, Tuple
import numpy as np
from scipy import signal


class Resampler:
    """Resamples signal to a new sampling frequency."""

    @staticmethod
    def resample(
        samples: np.ndarray,
        orig_sample_rate: float,
        target_sample_rate: float
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Resample complex IQ signal using polyphase filtering."""
        if len(samples) == 0:
            return samples, {"operation": "resampling", "status": "empty"}

        if np.isclose(orig_sample_rate, target_sample_rate, rtol=1e-4):
            return samples, {
                "operation": "resampling",
                "status": "unchanged",
                "orig_sample_rate": orig_sample_rate,
                "target_sample_rate": target_sample_rate
            }

        # Find rational approximation up / down
        rate_orig_int = int(round(orig_sample_rate))
        rate_target_int = int(round(target_sample_rate))
        common = gcd(rate_orig_int, rate_target_int)
        up = rate_target_int // common
        down = rate_orig_int // common

        # If ratio numbers are too large, clamp to reasonable integer ratio
        if up > 1000 or down > 1000:
            num_target_samples = int(round(len(samples) * (target_sample_rate / orig_sample_rate)))
            resampled = signal.resample(samples, num_target_samples)
            resampled = resampled.astype(samples.dtype)
            method = "fft_resample"
        else:
            resampled = signal.resample_poly(samples, up, down)
            resampled = resampled.astype(samples.dtype)
            method = "polyphase"

        config = {
            "operation": "resampling",
            "method": method,
            "orig_sample_rate": orig_sample_rate,
            "target_sample_rate": target_sample_rate,
            "up_factor": up if method == "polyphase" else None,
            "down_factor": down if method == "polyphase" else None,
            "input_samples": len(samples),
            "output_samples": len(resampled)
        }

        return resampled, config
