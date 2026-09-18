"""Digital filtering for baseband complex IQ signals."""

from typing import Dict, Any, Tuple, Optional
import numpy as np
from scipy import signal


class SignalFilter:
    """Applies digital IIR/FIR filters to complex IQ signals."""

    @staticmethod
    def filter_signal(
        samples: np.ndarray,
        sample_rate: float,
        filter_type: str = "lowpass",  # "lowpass", "highpass", "bandpass", "bandstop"
        cutoff_low: Optional[float] = None,
        cutoff_high: Optional[float] = None,
        filter_order: int = 4,
        filter_design: str = "butterworth"  # "butterworth" or "chebyshev"
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Apply Butterworth IIR filter to complex IQ data (separately filtering I and Q or complex SOS)."""
        if len(samples) == 0:
            return samples, {"operation": "filtering", "status": "empty"}

        nyquist = sample_rate / 2.0
        filter_type = filter_type.lower()

        # Validate frequencies
        if filter_type in ["lowpass", "highpass"]:
            cutoff = cutoff_high if filter_type == "lowpass" else cutoff_low
            if cutoff is None or cutoff <= 0 or cutoff >= nyquist:
                cutoff = nyquist * 0.45  # safe fallback
            wn = cutoff / nyquist
            b, a = signal.butter(filter_order, wn, btype=filter_type)
        elif filter_type in ["bandpass", "bandstop"]:
            f_low = cutoff_low if cutoff_low and cutoff_low > 0 else nyquist * 0.1
            f_high = cutoff_high if cutoff_high and cutoff_high < nyquist else nyquist * 0.4
            if f_low >= f_high:
                f_low, f_high = nyquist * 0.1, nyquist * 0.4
            wn = [f_low / nyquist, f_high / nyquist]
            b, a = signal.butter(filter_order, wn, btype=filter_type)
        else:
            raise ValueError(f"Unknown filter type: {filter_type}")

        # Filter real and imaginary channels separately to maintain linearity
        filtered_i = signal.filtfilt(b, a, samples.real)
        filtered_q = signal.filtfilt(b, a, samples.imag)
        filtered = (filtered_i + 1j * filtered_q).astype(samples.dtype)

        config = {
            "operation": "filtering",
            "filter_type": filter_type,
            "filter_design": filter_design,
            "filter_order": filter_order,
            "sample_rate": sample_rate,
            "cutoff_low": cutoff_low,
            "cutoff_high": cutoff_high,
            "nyquist": nyquist
        }

        return filtered, config
