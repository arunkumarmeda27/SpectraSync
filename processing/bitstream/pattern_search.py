"""Bit pattern searching and repeating periodicity detection."""

from typing import Any, Dict, List, Optional
import numpy as np


class PatternSearcher:
    """Searches for arbitrary bit sequences and analyzes repeating bit structures."""

    @classmethod
    def search_pattern(
        cls,
        bits: List[int],
        pattern: List[int],
        max_errors: int = 0
    ) -> List[Dict[str, Any]]:
        """Search for a target bit sequence with optional Hamming distance tolerance."""
        if not bits or not pattern or len(pattern) > len(bits):
            return []

        p_len = len(pattern)
        p_arr = np.array(pattern, dtype=np.uint8)
        matches = []

        for i in range(len(bits) - p_len + 1):
            window = np.array(bits[i : i + p_len], dtype=np.uint8)
            errors = int(np.sum(window != p_arr))

            if errors <= max_errors:
                confidence = max(0.4, 1.0 - (errors / p_len))
                matches.append({
                    "bit_offset": i,
                    "byte_offset": i // 8,
                    "bit_remainder": i % 8,
                    "length": p_len,
                    "errors": errors,
                    "confidence": round(confidence, 3)
                })

        return matches

    @classmethod
    def detect_repeating_patterns(
        cls,
        bits: List[int],
        min_period: int = 8,
        max_period: int = 512
    ) -> List[Dict[str, Any]]:
        """Detect periodicity and repeating frame structures using bit autocorrelation."""
        if len(bits) < max_period * 2:
            return []

        b_arr = 1.0 - 2.0 * np.array(bits[:4096], dtype=np.float32)
        n = len(b_arr)
        corr = np.correlate(b_arr, b_arr, mode='full')[n - 1 :]
        corr_norm = corr / (corr[0] + 1e-12)

        candidates = []
        for period in range(min_period, min(max_period, len(corr_norm) - 1)):
            # Check if local peak
            val = float(corr_norm[period])
            if val > 0.35 and val > corr_norm[period - 1] and val > corr_norm[period + 1]:
                confidence = min(0.98, val)
                candidates.append({
                    "period_bits": period,
                    "period_bytes": round(period / 8.0, 2),
                    "is_byte_aligned": (period % 8 == 0),
                    "autocorrelation_score": round(val, 3),
                    "confidence": round(confidence, 3)
                })

        candidates.sort(key=lambda x: x["autocorrelation_score"], reverse=True)
        return candidates[:5]
