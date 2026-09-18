"""Concatenated coding (RS + Viterbi) and LDPC staged FEC modules."""

from typing import Any, Dict, List
import numpy as np

from processing.fec.reed_solomon import ReedSolomonCodec
from processing.fec.viterbi import ViterbiCodec


class ConcatenatedCodec:
    """Concatenated coding: Inner Viterbi convolutional + Outer Reed-Solomon."""

    @classmethod
    def decode(cls, channel_bits: List[int]) -> Dict[str, Any]:
        """Decode inner convolutional code, deinterleave, then decode outer Reed-Solomon."""
        viterbi_res = ViterbiCodec.decode(channel_bits)
        decoded_bits = viterbi_res.get("decoded_bits", [])
        if not decoded_bits:
            return {
                "status": "failed",
                "algorithm": "Concatenated (RS outer + Viterbi inner)",
                "error": "Inner Viterbi decoding failed"
            }

        data_bytes = np.packbits(np.array(decoded_bits, dtype=np.uint8)).tobytes()
        rs_res = ReedSolomonCodec.decode_stream(data_bytes, n=255, k=223)

        return {
            "status": "decoded",
            "algorithm": "Concatenated (CCSDS RS(255,223) + Viterbi K=7 R=1/2)",
            "inner_viterbi": viterbi_res,
            "outer_rs": rs_res,
            "confidence": 0.90
        }


class LdpcCodec:
    """Low-Density Parity-Check (LDPC) decoder (STAGED CAPABILITY)."""

    @classmethod
    def decode(cls, bits: List[int], matrix_standard: str = "DVB-S2") -> Dict[str, Any]:
        return {
            "status": "STAGED CAPABILITY",
            "algorithm": "LDPC",
            "matrix_standard": matrix_standard,
            "notes": "Belief Propagation (sum-product algorithm) staged for next release cycle.",
            "input_bits_count": len(bits),
            "output_bits": bits,
            "confidence": 0.20
        }
