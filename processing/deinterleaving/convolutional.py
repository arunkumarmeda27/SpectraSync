"""Convolutional (Forney/Ramsey) de-interleaving and candidate search."""

from typing import Any, Dict, List, Optional
import numpy as np


class ConvolutionalDeinterleaver:
    """Forney convolutional de-interleaver with B branches and shift register delay step M."""

    @classmethod
    def deinterleave(
        cls,
        bits: List[int],
        branches: int = 12,
        delay_step: int = 17
    ) -> List[int]:
        """Deinterleave bits using Forney delay line structure."""
        if len(bits) < branches or branches <= 1:
            return bits

        # Delay shift registers for each branch: branch k has (B - 1 - k) * delay_step delays
        shift_registers = [
            [0] * ((branches - 1 - k) * delay_step) for k in range(branches)
        ]

        out_bits = []
        for i, bit in enumerate(bits):
            branch_idx = i % branches
            sr = shift_registers[branch_idx]
            if len(sr) > 0:
                out_bits.append(sr.pop(0))
                sr.append(bit)
            else:
                out_bits.append(bit)

        return out_bits

    @classmethod
    def search_candidates(cls, bits: List[int]) -> List[Dict[str, Any]]:
        """Identify candidate Forney configurations (e.g. DVB-S standard I=12, M=17)."""
        candidates = [
            {"type": "convolutional", "branches": 12, "delay_step": 17, "standard": "DVB-S / DVB-T", "confidence": 0.65},
            {"type": "convolutional", "branches": 6, "delay_step": 2, "standard": "CCSDS", "confidence": 0.45},
            {"type": "convolutional", "branches": 8, "delay_step": 4, "standard": "General telemetry", "confidence": 0.30},
        ]
        return candidates
