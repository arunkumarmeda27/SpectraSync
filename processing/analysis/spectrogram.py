"""Time-Frequency Spectrogram and Waterfall data generator."""

from typing import Any, Dict, Optional
import numpy as np
from scipy import signal


class SpectrogramAnalyzer:
    """Computes Short-Time Fourier Transform (STFT) spectrogram matrices."""

    @classmethod
    def compute_spectrogram(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        nperseg: int = 512,
        noverlap: Optional[int] = None,
        window: str = "hann",
        center_frequency: float = 0.0,
        max_time_bins: int = 128,
        max_freq_bins: int = 128
    ) -> Dict[str, Any]:
        """Compute STFT spectrogram with optional 2D spatial downsampling for frontend display."""
        if len(samples) == 0:
            return {"times": [], "frequencies": [], "power_matrix_db": []}

        if noverlap is None:
            noverlap = nperseg // 2

        nperseg = min(nperseg, len(samples))
        noverlap = min(noverlap, nperseg - 1)

        f, t, sxx = signal.spectrogram(
            samples,
            fs=sample_rate,
            window=window,
            nperseg=nperseg,
            noverlap=noverlap,
            return_onesided=False,
            mode="psd"
        )

        # FFT shift along frequency axis
        f = np.fft.fftshift(f) + center_frequency
        sxx = np.fft.fftshift(sxx, axes=0)

        # Convert to dB
        sxx_db = 10.0 * np.log10(np.maximum(sxx, 1e-15))

        # Downsample time and frequency dimensions if matrix is too large for UI transfer
        n_freqs, n_times = sxx_db.shape
        step_f = max(1, n_freqs // max_freq_bins)
        step_t = max(1, n_times // max_time_bins)

        f_down = f[::step_f]
        t_down = t[::step_t]
        sxx_down = sxx_db[::step_f, ::step_t]

        return {
            "times": [round(float(ti), 4) for ti in t_down],
            "frequencies": [round(float(fi), 2) for fi in f_down],
            "power_matrix_db": [[round(float(val), 1) for val in row] for row in sxx_down],
            "min_db": float(np.min(sxx_down)),
            "max_db": float(np.max(sxx_down)),
            "nperseg": nperseg,
            "noverlap": noverlap,
            "window": window
        }
