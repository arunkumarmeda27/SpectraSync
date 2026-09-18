"""Carrier phase and frequency synchronization using Costas Loop and decision-directed PLL."""

from typing import Any, Dict, List, Tuple
import numpy as np


class CarrierRecovery:
    """Costas Loop and decision-directed carrier tracking for PSK and QAM symbols."""

    @classmethod
    def recover(
        cls,
        symbols: np.ndarray,
        modulation: str = "QPSK",
        symbol_rate: float = 50_000.0,
        loop_bw: float = 0.02,
        damping: float = 0.707
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Lock carrier phase and eliminate residual frequency offset."""
        if len(symbols) == 0:
            return symbols, {"status": "empty", "confidence": 0.0}

        mod = modulation.upper()

        # 2nd-order loop filter coefficients
        theta = loop_bw / (damping + 0.25 / damping)
        d = 1.0 + 2.0 * damping * theta + theta**2
        alpha = (4.0 * damping * theta) / d
        beta = (4.0 * theta**2) / d

        n = len(symbols)
        corrected = np.zeros(n, dtype=np.complex64)
        phase_errors: List[float] = []

        phase = 0.0
        freq = 0.0

        for i in range(n):
            # Rotate symbol by current NCO phase
            curr_sym = symbols[i] * np.exp(-1j * phase)
            corrected[i] = curr_sym

            # Phase Error Detector (PED)
            i_val = curr_sym.real
            q_val = curr_sym.imag

            if mod == "BPSK":
                # BPSK Costas: e = sign(I) * Q
                error = np.sign(i_val) * q_val
            elif mod == "QPSK":
                # QPSK Costas: e = sign(I)*Q - sign(Q)*I
                error = np.sign(i_val) * q_val - np.sign(q_val) * i_val
            elif mod == "16QAM":
                # Sliced decision directed error
                # Nearest slice levels: -3, -1, +1, +3 scaled
                scale = np.sqrt(10.0)
                i_dec = np.clip(np.round((i_val * scale + 3.0) / 2.0) * 2.0 - 3.0, -3.0, 3.0) / scale
                q_dec = np.clip(np.round((q_val * scale + 3.0) / 2.0) * 2.0 - 3.0, -3.0, 3.0) / scale
                error = (curr_sym * np.conj(i_dec + 1j * q_dec)).imag
            else:
                # General M-th power / QPSK fallback
                error = np.sign(i_val) * q_val - np.sign(q_val) * i_val

            error = float(np.clip(error, -2.0, 2.0))
            phase_errors.append(round(error, 4))

            # Loop filter update
            freq += beta * error
            phase += freq + alpha * error

            # Keep phase in [-pi, pi]
            phase = (phase + np.pi) % (2.0 * np.pi) - np.pi

        # Check convergence quality on last 40% of symbols
        tail_errors = phase_errors[-int(len(phase_errors)*0.4):] if len(phase_errors) > 50 else phase_errors
        err_var = float(np.var(tail_errors)) if tail_errors else 1.0

        is_locked = err_var < 0.20 and len(symbols) > 50
        status = "locked" if is_locked else "unlocked"
        confidence = max(0.25, min(0.98, 1.0 - 3.0 * err_var)) if is_locked else 0.40

        residual_freq_hz = (freq / (2.0 * np.pi)) * symbol_rate

        metadata = {
            "status": status,
            "modulation": mod,
            "phase_error_variance": round(err_var, 5),
            "residual_frequency_offset_hz": round(float(residual_freq_hz), 2),
            "final_phase_rad": round(float(phase), 4),
            "confidence": round(confidence, 3),
            "confidence_label": "High" if confidence > 0.8 else ("Medium" if confidence > 0.5 else "Low"),
            "phase_errors_trace": phase_errors[::max(1, len(phase_errors) // 300)]
        }

        return corrected, metadata
