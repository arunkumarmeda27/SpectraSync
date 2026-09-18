"""DC offset removal for complex IQ and real signals."""

from typing import Dict, Any, Tuple
import numpy as np


class DcRemover:
    """Removes DC bias from complex IQ recordings."""

    @staticmethod
    def remove_dc(
        samples: np.ndarray,
        method: str = "mean_subtraction",
        filter_alpha: float = 0.995
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Remove DC component and return processed samples with audit telemetry."""
        if len(samples) == 0:
            return samples, {"operation": "dc_removal", "status": "empty_input"}

        initial_dc = complex(np.mean(samples))
        initial_dc_power_db = float(10.0 * np.log10(np.abs(initial_dc)**2 + 1e-12))

        if method == "mean_subtraction":
            processed = samples - initial_dc
        elif method == "iir_notch":
            # IIR DC blocker: y[n] = x[n] - x[n-1] + alpha * y[n-1]
            processed = np.zeros_like(samples)
            prev_x = 0.0 + 0.0j
            prev_y = 0.0 + 0.0j
            for i in range(len(samples)):
                curr_x = samples[i]
                curr_y = curr_x - prev_x + filter_alpha * prev_y
                processed[i] = curr_y
                prev_x = curr_x
                prev_y = curr_y
        else:
            processed = samples - initial_dc
            method = "mean_subtraction"

        residual_dc = complex(np.mean(processed))
        residual_dc_power_db = float(10.0 * np.log10(np.abs(residual_dc)**2 + 1e-12))

        config = {
            "operation": "dc_removal",
            "method": method,
            "filter_alpha": filter_alpha if method == "iir_notch" else None,
            "initial_dc_i": float(initial_dc.real),
            "initial_dc_q": float(initial_dc.imag),
            "initial_dc_power_dbfs": initial_dc_power_db,
            "residual_dc_power_dbfs": residual_dc_power_db,
            "attenuation_db": initial_dc_power_db - residual_dc_power_db
        }

        return processed, config
