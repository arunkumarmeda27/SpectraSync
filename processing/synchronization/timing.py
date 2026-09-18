"""Timing synchronization using Gardner Timing Error Detector (TED) and interpolator."""

from typing import Any, Dict, List, Tuple
import numpy as np


class TimingRecovery:
    """Recovers optimal symbol sampling instants using Gardner Timing Error Detector."""

    @classmethod
    def recover(
        cls,
        samples: np.ndarray,
        sps: int,
        damping: float = 0.707,
        loop_bw: float = 0.01,
        max_symbols: int = 4000
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Synchronize symbol clock and extract 1 sample/symbol at optimal eye opening."""
        if len(samples) < 2 * sps or sps < 2:
            return samples, {
                "status": "bypassed",
                "reason": "Insufficient samples or SPS < 2",
                "timing_error_variance": 0.0,
                "confidence": 0.0
            }

        # Loop filter constants
        theta = loop_bw / (damping + 0.25 / damping)
        d = 1.0 + 2.0 * damping * theta + theta**2
        kp = (4.0 * damping * theta) / d
        ki = (4.0 * theta**2) / d

        n_samples = len(samples)
        symbols: List[complex] = []
        timing_errors: List[float] = []

        # State variables
        mu = 0.0        # Fractional timing delay [0, 1)
        integrator = 0.0
        sample_idx = 0

        # Run loop
        prev_sym = 0.0 + 0.0j
        prev_mid = 0.0 + 0.0j

        while sample_idx + sps + 2 < n_samples and len(symbols) < max_symbols:
            # Interpolate on-time symbol sample: y[k]
            idx_int = int(sample_idx)
            frac = sample_idx - idx_int

            # Linear/polynomial interpolation
            s0 = samples[idx_int]
            s1 = samples[idx_int + 1] if idx_int + 1 < n_samples else s0
            curr_sym = s0 + frac * (s1 - s0)
            symbols.append(curr_sym)

            # Half-symbol sample for Gardner TED
            mid_idx = sample_idx - sps / 2.0
            if mid_idx >= 0:
                mid_int = int(mid_idx)
                mid_frac = mid_idx - mid_int
                m0 = samples[mid_int]
                m1 = samples[mid_int + 1] if mid_int + 1 < n_samples else m0
                mid_sym = m0 + mid_frac * (m1 - m0)

                # Gardner TED: e = Re{(curr - prev) * mid*}
                diff = curr_sym - prev_sym
                error = float((diff.real * mid_sym.real + diff.imag * mid_sym.imag))
                timing_errors.append(round(error, 4))

                # Loop filter update
                integrator += ki * error
                step_adj = kp * error + integrator
            else:
                step_adj = 0.0

            prev_sym = curr_sym
            sample_idx += sps + step_adj

        symbols_arr = np.array(symbols, dtype=np.complex64)

        # Quality metrics
        tail_errors = timing_errors[-int(len(timing_errors)*0.5):] if len(timing_errors) > 20 else timing_errors
        err_var = float(np.var(tail_errors)) if tail_errors else 1.0
        status = "synchronized" if err_var < 0.15 and len(symbols_arr) > 50 else "unconverged"
        confidence = max(0.2, min(0.96, 1.0 - 2.5 * err_var)) if status == "synchronized" else 0.35

        metadata = {
            "status": status,
            "samples_per_symbol": sps,
            "recovered_symbols_count": len(symbols_arr),
            "timing_error_variance": round(err_var, 5),
            "confidence": round(confidence, 3),
            "confidence_label": "High" if confidence > 0.8 else ("Medium" if confidence > 0.5 else "Low"),
            "timing_errors_trace": timing_errors[::max(1, len(timing_errors) // 300)]
        }

        return symbols_arr, metadata
