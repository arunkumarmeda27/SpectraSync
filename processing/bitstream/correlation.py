"""Bit stream cross-correlation analysis and correlation graph data generator."""

from typing import Any, Dict, List, Optional
import numpy as np


class BitStreamCorrelator:
    """Computes cross-correlation between recovered bit streams and reference bit patterns."""

    @classmethod
    def correlate(
        cls,
        recovered_bits: List[int],
        reference_bits: List[int],
        max_lags_for_plot: int = 500
    ) -> Dict[str, Any]:
        """Cross-correlate recovered bits with reference sequence (bipolar +1/-1 representation)."""
        if not recovered_bits or not reference_bits:
            return {
                "correlation_score": 0.0,
                "peak_position": 0,
                "match_length": 0,
                "confidence": 0.0,
                "lags": [],
                "correlation_curve": []
            }

        r_bipolar = 1.0 - 2.0 * np.array(recovered_bits, dtype=np.float32)
        ref_bipolar = 1.0 - 2.0 * np.array(reference_bits, dtype=np.float32)

        # Cross-correlation: ref sliding over recovered
        corr_raw = np.correlate(r_bipolar, ref_bipolar, mode='valid')
        # Normalize by length of reference
        corr_norm = corr_raw / float(len(ref_bipolar))

        peak_idx = int(np.argmax(corr_norm))
        peak_score = float(corr_norm[peak_idx])

        # Negative correlation peak check (inverted bits)
        min_idx = int(np.argmin(corr_norm))
        min_score = float(corr_norm[min_idx])

        inverted = False
        if abs(min_score) > peak_score:
            peak_idx = min_idx
            peak_score = abs(min_score)
            inverted = True

        # Calculate bit errors at peak position
        n_match = min(len(reference_bits), len(recovered_bits) - peak_idx)
        sub_recovered = recovered_bits[peak_idx : peak_idx + n_match]
        sub_reference = reference_bits[:n_match]

        if inverted:
            sub_recovered = [1 - b for b in sub_recovered]

        bit_errors = sum(b != r for b, r in zip(sub_recovered, sub_reference))
        match_accuracy = 1.0 - (bit_errors / n_match) if n_match > 0 else 0.0

        confidence = max(0.1, min(0.99, peak_score))

        # Downsample correlation curve for UI plotting
        n_points = len(corr_norm)
        step = max(1, n_points // max_lags_for_plot)
        sampled_lags = list(range(0, n_points, step))
        sampled_curve = [round(float(corr_norm[i]), 4) for i in sampled_lags]

        return {
            "correlation_score": round(peak_score, 4),
            "peak_position": peak_idx,
            "match_length": n_match,
            "bit_errors": bit_errors,
            "match_accuracy": round(match_accuracy, 4),
            "is_inverted": inverted,
            "confidence": round(confidence, 3),
            "confidence_label": "High" if confidence > 0.8 else ("Medium" if confidence > 0.5 else "Low"),
            "lags": sampled_lags,
            "correlation_curve": sampled_curve
        }
