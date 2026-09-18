"""Symbol rate (baud) estimation using cyclostationary non-linear power spectral analysis."""

from typing import Any, Dict
import numpy as np


class SymbolRateEstimator:
    """Estimates symbol rate (baud) and samples per symbol via non-linear envelope squaring."""

    @classmethod
    def estimate(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        fft_size: int = 8192
    ) -> Dict[str, Any]:
        """Estimate baud rate by finding spectral clock lines in squared magnitude."""
        if len(samples) < 128:
            return {
                "parameter": "symbol_rate",
                "value": 0.0,
                "unit": "Baud",
                "confidence": 0.0,
                "confidence_label": "Low",
                "source": "dsp_estimate",
                "method": "insufficient_samples",
                "uncertainty": 0.0
            }

        n = min(len(samples), fft_size)
        chunk = samples[:n]
        if n < fft_size:
            chunk = np.pad(chunk, (0, fft_size - n))

        # Non-linear transformation to extract clock tones:
        # Subtract mean and compute instantaneous power: p[n] = |r[n]|^2
        power_env = np.abs(chunk - np.mean(chunk))**2
        # Remove DC from envelope
        power_env -= np.mean(power_env)

        # FFT of envelope
        win = np.hanning(fft_size)
        env_fft = np.abs(np.fft.rfft(power_env * win))
        freqs = np.fft.rfftfreq(fft_size, d=1.0 / sample_rate)

        # Ignore DC and very low frequencies (< 1 kHz) and near Nyquist (> 0.45 * fs)
        min_freq = max(1000.0, sample_rate * 0.005)
        max_freq = sample_rate * 0.45

        valid_mask = (freqs >= min_freq) & (freqs <= max_freq)
        if not np.any(valid_mask):
            return {
                "parameter": "symbol_rate",
                "value": 0.0,
                "unit": "Baud",
                "confidence": 0.0,
                "confidence_label": "Low",
                "source": "dsp_estimate",
                "method": "invalid_frequency_range",
                "uncertainty": 0.0
            }

        masked_fft = np.copy(env_fft)
        masked_fft[~valid_mask] = 0.0

        peak_idx = int(np.argmax(masked_fft))
        peak_freq = float(freqs[peak_idx])

        # Parabolic interpolation for fine symbol frequency
        bin_spacing = sample_rate / (2.0 * (len(freqs) - 1))
        if 0 < peak_idx < len(freqs) - 1:
            y0 = float(masked_fft[peak_idx - 1])
            y1 = float(masked_fft[peak_idx])
            y2 = float(masked_fft[peak_idx + 1])
            denom = y0 - 2.0 * y1 + y2
            delta = 0.5 * (y0 - y2) / denom if abs(denom) > 1e-9 else 0.0
            delta = max(-1.0, min(1.0, delta))
        else:
            delta = 0.0

        estimated_baud = peak_freq + delta * bin_spacing

        # Quality / Confidence calculation: peak-to-median ratio in envelope spectrum
        median_floor = np.median(masked_fft[valid_mask]) + 1e-12
        peak_ratio = masked_fft[peak_idx] / median_floor

        sps = round(sample_rate / (estimated_baud + 1e-9))

        if peak_ratio > 4.0 and sps >= 2:
            confidence = min(0.95, 0.60 + 0.05 * min(peak_ratio, 7.0))
            label = "High"
        elif peak_ratio > 2.0 and sps >= 2:
            confidence = 0.55
            label = "Medium"
        else:
            confidence = 0.20
            label = "Low"

        uncertainty_baud = bin_spacing / 2.0

        return {
            "parameter": "symbol_rate",
            "value": round(float(estimated_baud), 1),
            "unit": "Baud",
            "confidence": round(float(confidence), 3),
            "confidence_label": label,
            "source": "dsp_estimate",
            "method": "envelope_squaring_cyclostationary",
            "uncertainty": round(float(uncertainty_baud), 1),
            "estimated_sps": int(sps),
            "clock_peak_ratio": round(float(peak_ratio), 2)
        }
