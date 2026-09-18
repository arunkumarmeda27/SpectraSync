"""Power Spectral Density (PSD) analysis using Welch's averaged periodogram."""

from typing import Any, Dict, Optional
import numpy as np
from scipy import signal


class PsdAnalyzer:
    """Computes Welch Power Spectral Density."""

    @classmethod
    def compute_psd(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        nperseg: int = 1024,
        noverlap: Optional[int] = None,
        window: str = "hann",
        center_frequency: float = 0.0,
        max_points_for_ui: int = 1024
    ) -> Dict[str, Any]:
        """Compute Welch PSD in dB/Hz."""
        if len(samples) == 0:
            return {"frequencies": [], "psd_db_hz": []}

        if noverlap is None:
            noverlap = nperseg // 2

        nperseg = min(nperseg, len(samples))
        noverlap = min(noverlap, nperseg - 1)

        freqs, pxx = signal.welch(
            samples,
            fs=sample_rate,
            window=window,
            nperseg=nperseg,
            noverlap=noverlap,
            return_onesided=False,
            scaling="density"
        )

        # Shift to center 0 Hz
        freqs = np.fft.fftshift(freqs) + center_frequency
        pxx = np.fft.fftshift(pxx)

        # Convert to dB/Hz
        psd_db = 10.0 * np.log10(np.maximum(pxx, 1e-15))

        if max_points_for_ui and len(freqs) > max_points_for_ui:
            step = len(freqs) // max_points_for_ui
            freqs = freqs[::step]
            psd_db = psd_db[::step]

        return {
            "frequencies": [round(float(f), 2) for f in freqs],
            "psd_db_hz": [round(float(p), 2) for p in psd_db],
            "nperseg": nperseg,
            "noverlap": noverlap,
            "window": window,
            "mean_psd_db": float(np.mean(psd_db)),
            "peak_psd_db": float(np.max(psd_db))
        }
