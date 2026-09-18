"""Fast Fourier Transform (FFT) analysis and spectral visualization data generator."""

from typing import Any, Dict, List, Optional
import numpy as np


class FftAnalyzer:
    """Computes windowed, centered, and scaled FFT spectra for RF signals."""

    WINDOWS = {
        "hann": np.hanning,
        "hamming": np.hamming,
        "blackman": np.blackman,
        "rectangular": np.ones
    }

    @classmethod
    def compute_fft(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        fft_size: int = 2048,
        window_name: str = "hann",
        center_frequency: float = 0.0,
        max_points_for_ui: int = 1024
    ) -> Dict[str, Any]:
        """Compute windowed FFT and return frequency axis (Hz) and magnitude spectrum (dBFS)."""
        if len(samples) == 0:
            return {"frequencies": [], "magnitudes_db": [], "fft_size": fft_size}

        # Slice or pad to fft_size
        n = min(len(samples), fft_size)
        data_chunk = samples[:n]
        if n < fft_size:
            data_chunk = np.pad(data_chunk, (0, fft_size - n))

        # Windowing
        win_func = cls.WINDOWS.get(window_name.lower(), np.hanning)
        win = win_func(fft_size)
        windowed = data_chunk * win

        # Coherent gain compensation
        coherent_gain = np.sum(win) / fft_size

        # FFT computation & shift
        fft_raw = np.fft.fft(windowed, n=fft_size)
        fft_shifted = np.fft.fftshift(fft_raw)

        # Magnitudes in dBFS (normalized to full scale 1.0)
        mag = np.abs(fft_shifted) / (fft_size * coherent_gain + 1e-12)
        mag_db = 20.0 * np.log10(np.maximum(mag, 1e-9))

        # Frequency axis centered at center_frequency
        freqs = np.fft.fftshift(np.fft.fftfreq(fft_size, d=1.0 / sample_rate)) + center_frequency

        # Subsample/decimate if UI requested fewer points
        if max_points_for_ui and fft_size > max_points_for_ui:
            step = fft_size // max_points_for_ui
            freqs = freqs[::step]
            mag_db = mag_db[::step]

        peak_idx = int(np.argmax(mag_db))
        peak_freq = float(freqs[peak_idx])
        peak_power = float(mag_db[peak_idx])

        return {
            "frequencies": [round(float(f), 2) for f in freqs],
            "magnitudes_db": [round(float(m), 2) for m in mag_db],
            "fft_size": fft_size,
            "window": window_name,
            "sample_rate": sample_rate,
            "peak_frequency_hz": peak_freq,
            "peak_power_dbfs": peak_power
        }
