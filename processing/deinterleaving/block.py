"""Block matrix de-interleaving and candidate dimension estimator."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np


class BlockDeinterleaver:
    """Performs matrix block de-interleaving (write by column, read by row)."""

    @classmethod
    def deinterleave(
        cls,
        bits: List[int],
        rows: int,
        cols: int
    ) -> List[int]:
        """De-interleave bits using an (rows x cols) matrix."""
        block_size = rows * cols
        if len(bits) < block_size or block_size <= 0:
            return bits

        output_bits = []
        num_blocks = len(bits) // block_size

        for b in range(num_blocks):
            block = bits[b * block_size : (b + 1) * block_size]
            # Write by columns: shape (rows, cols) in Fortran order
            matrix = np.array(block).reshape((rows, cols), order='F')
            # Read by rows: flatten in C order
            deinterleaved = matrix.flatten(order='C').tolist()
            output_bits.extend(deinterleaved)

        # Append any leftover bits
        remainder = bits[num_blocks * block_size:]
        output_bits.extend(remainder)
        return output_bits

    @classmethod
    def search_candidates(
        cls,
        bits: List[int],
        max_dim: int = 64
    ) -> List[Dict[str, Any]]:
        """Search for candidate block interleaver dimensions based on autocorrelation periodicity."""
        if len(bits) < 128:
            return []

        # Periodic autocorrelation of bits
        b_arr = 1.0 - 2.0 * np.array(bits[:2048], dtype=np.float32)
        n = len(b_arr)
        corr = np.correlate(b_arr, b_arr, mode='full')[n - 1 :]
        corr_norm = corr / (corr[0] + 1e-12)

        candidates = []
        # Common RF interleaver dimensions
        common_dims = [(8, 16), (16, 16), (12, 17), (16, 32), (32, 32)]

        for r, c in common_dims:
            period = r * c
            if period < len(corr_norm):
                score = float(corr_norm[period])
                confidence = max(0.1, min(0.85, 0.4 + 0.5 * score))
            else:
                confidence = 0.25

            candidates.append({
                "type": "block",
                "rows": r,
                "cols": c,
                "block_size": period,
                "confidence": round(confidence, 3),
                "confidence_label": "High" if confidence > 0.7 else ("Medium" if confidence > 0.4 else "Low")
            })

        candidates.sort(key=lambda x: x["confidence"], reverse=True)
        return candidates
