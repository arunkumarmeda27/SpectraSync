"""Phase Shift Keying (PSK) demodulator for BPSK, QPSK, and 8-PSK."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np


class PskDemodulator:
    """Demodulates BPSK, QPSK, and 8-PSK symbols into binary bit streams."""

    @classmethod
    def demodulate(
        cls,
        symbols: np.ndarray,
        modulation: str = "QPSK",
        symbol_rate: float = 50_000.0,
        reference_bits: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Demodulate synchronized PSK symbols to hard decision bits."""
        if len(symbols) == 0:
            return {"recovered_bits": [], "bit_count": 0, "status": "empty"}

        mod = modulation.upper()
        recovered_bits: List[int] = []

        if mod == "BPSK":
            # Real axis decision: I > 0 -> bit 0, I < 0 -> bit 1
            # (or inverse depending on phase reference; we evaluate best correlation if reference available)
            bits = (symbols.real < 0).astype(int).tolist()
            bits_inv = (symbols.real >= 0).astype(int).tolist()

            # Resolve 180-degree phase ambiguity if reference provided
            if reference_bits and len(reference_bits) > 10:
                n_check = min(len(reference_bits), len(bits))
                err1 = sum(b != r for b, r in zip(bits[:n_check], reference_bits[:n_check]))
                err2 = sum(b != r for b, r in zip(bits_inv[:n_check], reference_bits[:n_check]))
                recovered_bits = bits if err1 <= err2 else bits_inv
            else:
                recovered_bits = bits

            bps = 1

        elif mod == "QPSK":
            # Gray code mapping:
            # 00 -> (+, +), 01 -> (-, +), 11 -> (-, -), 10 -> (+, -)
            # Evaluate 4 possible 90-degree rotational ambiguities
            rotations = [1.0, 1j, -1.0, -1j]
            best_bits = None
            lowest_ber = 1.0

            for rot in rotations:
                rot_syms = symbols * rot
                # bit 0: sign of Real (0 if > 0, 1 if < 0)
                # bit 1: sign of Imag (0 if > 0, 1 if < 0)
                b0 = (rot_syms.real < 0).astype(int)
                b1 = (rot_syms.imag < 0).astype(int)
                cand_bits = np.empty(len(b0) * 2, dtype=int)
                cand_bits[0::2] = b0
                cand_bits[1::2] = b1
                cand_list = cand_bits.tolist()

                if reference_bits and len(reference_bits) > 10:
                    n_check = min(len(reference_bits), len(cand_list))
                    errs = sum(b != r for b, r in zip(cand_list[:n_check], reference_bits[:n_check]))
                    ber = errs / n_check
                    if ber < lowest_ber:
                        lowest_ber = ber
                        best_bits = cand_list
                else:
                    best_bits = cand_list
                    break

            recovered_bits = best_bits if best_bits is not None else []
            bps = 2

        elif mod == "8PSK":
            # 8 sectors of 45 degrees
            angles = (np.angle(symbols) + 2.0 * np.pi) % (2.0 * np.pi)
            sector = np.round(angles / (np.pi / 4.0)).astype(int) % 8
            gray_map = {
                0: [0, 0, 0],
                1: [0, 0, 1],
                2: [0, 1, 1],
                3: [0, 1, 0],
                4: [1, 1, 0],
                5: [1, 1, 1],
                6: [1, 0, 1],
                7: [1, 0, 0]
            }
            bits_list = []
            for s in sector:
                bits_list.extend(gray_map[s])
            recovered_bits = bits_list
            bps = 3
        else:
            raise ValueError(f"Unsupported PSK modulation: {mod}")

        # Compute Bit Error Rate (BER) if reference ground truth provided
        ber = None
        bit_errors = None
        if reference_bits and len(reference_bits) > 0:
            n_eval = min(len(reference_bits), len(recovered_bits))
            bit_errors = sum(b != r for b, r in zip(recovered_bits[:n_eval], reference_bits[:n_eval]))
            ber = round(bit_errors / n_eval, 6)

        bit_rate = symbol_rate * bps

        # Format hex string representation
        byte_arr = np.packbits(np.array(recovered_bits, dtype=np.uint8))
        hex_string = byte_arr.tobytes().hex()

        return {
            "status": "demodulated",
            "modulation": mod,
            "bits_per_symbol": bps,
            "symbol_count": len(symbols),
            "bit_count": len(recovered_bits),
            "recovered_bits": recovered_bits,
            "hex_stream": hex_string,
            "bit_rate_bps": round(float(bit_rate), 1),
            "ber": ber,
            "bit_errors": bit_errors,
            "confidence": 0.95 if (ber is not None and ber < 0.05) else 0.85
        }
