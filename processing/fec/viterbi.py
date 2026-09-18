"""Convolutional encoder and Viterbi decoder for NASA/CCSDS standard (K=7, Rate=1/2)."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np


class ViterbiCodec:
    """Rate 1/2, Constraint Length K=7 Convolutional Codec (Generators: 171_o, 133_o)."""

    # NASA/CCSDS standard generator polynomials
    G1 = 0b1111001  # 171 octal = 121 decimal
    G2 = 0b1011011  # 133 octal = 91 decimal
    K = 7
    NUM_STATES = 64  # 2^(K-1)

    @classmethod
    def encode(cls, info_bits: List[int]) -> List[int]:
        """Convolutionally encode input information bits."""
        state = 0
        encoded = []
        for bit in info_bits:
            # Shift in bit
            state = ((state << 1) | (bit & 1)) & 0b1111111
            # Parity for G1 and G2
            p1 = bin(state & cls.G1).count('1') % 2
            p2 = bin(state & cls.G2).count('1') % 2
            encoded.extend([p1, p2])
        return encoded

    @classmethod
    def decode(
        cls,
        encoded_bits: List[int],
        traceback_depth: int = 35
    ) -> Dict[str, Any]:
        """Hard-decision Viterbi decoder with trellis branch metric and path memory."""
        if len(encoded_bits) < 4:
            return {
                "status": "failed",
                "decoded_bits": [],
                "confidence": 0.0,
                "error": "Insufficient bits for Viterbi decoding"
            }

        num_symbols = len(encoded_bits) // 2
        # State path metrics: initialize state 0 to 0, others to infinity
        path_metrics = np.full(cls.NUM_STATES, 1e6, dtype=np.float32)
        path_metrics[0] = 0.0

        # Trellis history: history[step, state] = (prev_state, input_bit)
        history = np.zeros((num_symbols, cls.NUM_STATES, 2), dtype=np.int32)

        for step in range(num_symbols):
            r0 = encoded_bits[2 * step]
            r1 = encoded_bits[2 * step + 1]

            new_metrics = np.full(cls.NUM_STATES, 1e6, dtype=np.float32)

            for state in range(cls.NUM_STATES):
                if path_metrics[state] >= 1e5:
                    continue

                for input_bit in [0, 1]:
                    # Full 7-bit register
                    full_reg = ((state << 1) | input_bit) & 0b1111111
                    next_state = full_reg & 0b0111111  # Lowest 6 bits form next state

                    exp_p1 = bin(full_reg & cls.G1).count('1') % 2
                    exp_p2 = bin(full_reg & cls.G2).count('1') % 2

                    # Hamming branch metric
                    branch_metric = (r0 ^ exp_p1) + (r1 ^ exp_p2)
                    total_metric = path_metrics[state] + branch_metric

                    if total_metric < new_metrics[next_state]:
                        new_metrics[next_state] = total_metric
                        history[step, next_state] = [state, input_bit]

            path_metrics = new_metrics

        # Traceback from minimum metric state
        best_state = int(np.argmin(path_metrics))
        decoded_bits = []
        curr_state = best_state

        for step in range(num_symbols - 1, -1, -1):
            prev_state, bit = history[step, curr_state]
            decoded_bits.append(int(bit))
            curr_state = prev_state

        decoded_bits.reverse()

        # Re-encode to estimate BER before and after
        re_encoded = cls.encode(decoded_bits)
        n_eval = min(len(encoded_bits), len(re_encoded))
        bit_errors = sum(b != r for b, r in zip(encoded_bits[:n_eval], re_encoded[:n_eval]))
        channel_ber = bit_errors / n_eval if n_eval > 0 else 0.0

        status = "decoded" if channel_ber < 0.25 else "uncorrected_errors"
        confidence = max(0.2, min(0.99, 1.0 - 2.0 * channel_ber))

        return {
            "status": status,
            "algorithm": "Viterbi (NASA/CCSDS K=7 Rate 1/2)",
            "polynomials": ["171_o", "133_o"],
            "input_bits_count": len(encoded_bits),
            "decoded_bits_count": len(decoded_bits),
            "decoded_bits": decoded_bits,
            "hex_output": np.packbits(np.array(decoded_bits, dtype=np.uint8)).tobytes().hex(),
            "channel_bit_errors": bit_errors,
            "estimated_channel_ber": round(float(channel_ber), 5),
            "confidence": round(float(confidence), 3)
        }
