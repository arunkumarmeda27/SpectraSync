"""Coarse carrier frequency offset estimation using power-of-M non-linear transformation."""

from typing import Dict, Any, Tuple
import numpy as np


class CoarseFrequencyOffsetEstimator:
    """Estimates coarse carrier frequency offset prior to PLL acquisition."""

    @classmethod
    def estimate_and_correct(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        modulation: str = "QPSK",
        fft_size: int = 8192
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Estimate carrier offset using M-th power non-linear method and mix down to baseband."""
        if len(samples) == 0:
            return samples, {"offset_hz": 0.0, "confidence": 0.0}

        mod = modulation.upper()
        if mod == "BPSK":
            m_power = 2
        elif mod in ["QPSK", "16QAM"]:
            m_power = 4
        elif mod == "8PSK":
            m_power = 8
        else:
            m_power = 2

        n = min(len(samples), fft_size)
        chunk = samples[:n]
        if n < fft_size:
            chunk = np.pad(chunk, (0, fft_size - n))

        # Raise signal to M-th power to strip modulation
        # r[n]^M creates a strong spectral line at M * Delta_f
        powered = chunk**m_power
        win = np.hanning(fft_size)
        spec = np.abs(np.fft.fftshift(np.fft.fft(powered * win)))**2
        freqs = np.fft.fftshift(np.fft.fftfreq(fft_size, d=1.0 / sample_rate))

        peak_idx = int(np.argmax(spec))
        raw_peak_freq = float(freqs[peak_idx])

        # Parabolic interpolation for fine peak
        bin_spacing = sample_rate / fft_size
        if 0 < peak_idx < fft_size - 1:
            y0 = float(np.log(spec[peak_idx - 1] + 1e-12))
            y1 = float(np.log(spec[peak_idx] + 1e-12))
            y2 = float(np.log(spec[peak_idx + 1] + 1e-12))
            denom = y0 - 2.0 * y1 + y2
            delta = 0.5 * (y0 - y2) / denom if abs(denom) > 1e-9 else 0.0
            delta = max(-1.0, min(1.0, delta))
        else:
            delta = 0.0

        refined_peak_freq = raw_peak_freq + delta * bin_spacing
        coarse_offset_hz = refined_peak_freq / m_power

        # Frequency correction: multiply by exp(-j * 2 * pi * f_off * t)
        t = np.arange(len(samples)) / sample_rate
        corrected = samples * np.exp(-1j * 2.0 * np.pi * coarse_offset_hz * t)

        mean_spec = np.mean(spec)
        peak_ratio = spec[peak_idx] / (mean_spec + 1e-12)
        confidence = min(0.95, 0.40 + 0.05 * min(peak_ratio, 11.0)) if peak_ratio > 3.0 else 0.25

        metadata = {
            "operation": "coarse_frequency_correction",
            "m_power": m_power,
            "estimated_offset_hz": round(float(coarse_offset_hz), 2),
            "confidence": round(float(confidence), 3),
            "peak_ratio": round(float(peak_ratio), 2),
            "uncertainty_hz": round(float(bin_spacing / (2.0 * m_power)), 2)
        }

        return corrected, metadata
