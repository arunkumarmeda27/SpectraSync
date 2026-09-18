"""Carrier frequency and center offset estimation with uncertainty."""

from typing import Any, Dict
import numpy as np


class CarrierFrequencyEstimator:
    """Estimates carrier center frequency and baseband offset using spectral analysis."""

    @classmethod
    def estimate(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        nominal_center_freq: float = 0.0,
        fft_size: int = 8192
    ) -> Dict[str, Any]:
        """Estimate carrier frequency offset with parabolic interpolation and uncertainty."""
        if len(samples) == 0:
            return {
                "parameter": "carrier_frequency",
                "value": nominal_center_freq,
                "unit": "Hz",
                "confidence": 0.0,
                "confidence_label": "Low",
                "source": "dsp_estimate",
                "method": "insufficient_samples",
                "uncertainty": sample_rate / 2.0
            }

        n = min(len(samples), fft_size)
        chunk = samples[:n]
        if n < fft_size:
            chunk = np.pad(chunk, (0, fft_size - n))

        # Hann window
        win = np.hanning(fft_size)
        spec = np.abs(np.fft.fftshift(np.fft.fft(chunk * win)))**2

        # Bin frequency spacing
        bin_spacing = sample_rate / fft_size
        freq_axis = np.fft.fftshift(np.fft.fftfreq(fft_size, d=1.0 / sample_rate))

        # Spectral peak detection
        peak_idx = int(np.argmax(spec))

        # 3-point parabolic interpolation for sub-bin accuracy
        if 0 < peak_idx < fft_size - 1:
            y0 = float(np.log(spec[peak_idx - 1] + 1e-12))
            y1 = float(np.log(spec[peak_idx] + 1e-12))
            y2 = float(np.log(spec[peak_idx + 1] + 1e-12))
            denom = y0 - 2.0 * y1 + y2
            delta = 0.5 * (y0 - y2) / denom if abs(denom) > 1e-9 else 0.0
            delta = max(-1.0, min(1.0, delta))
        else:
            delta = 0.0

        offset_hz = freq_axis[peak_idx] + delta * bin_spacing
        absolute_carrier_hz = nominal_center_freq + offset_hz

        # Confidence based on peak-to-average power ratio (PAPR)
        mean_spec = np.mean(spec)
        papr = spec[peak_idx] / (mean_spec + 1e-12)

        # Sigmoid mapping of PAPR to confidence
        # PAPR > 10 is high confidence, PAPR < 3 is low / ambiguous
        if papr >= 8.0:
            confidence = min(0.98, 0.70 + 0.02 * min(papr, 15.0))
            label = "High"
        elif papr >= 3.0:
            confidence = 0.40 + 0.05 * papr
            label = "Medium"
        else:
            confidence = 0.25
            label = "Low"

        uncertainty_hz = bin_spacing / 2.0

        return {
            "parameter": "carrier_frequency",
            "value": round(float(absolute_carrier_hz), 2),
            "offset_hz": round(float(offset_hz), 2),
            "unit": "Hz",
            "confidence": round(float(confidence), 3),
            "confidence_label": label,
            "source": "dsp_estimate",
            "method": "parabolic_spectral_peak",
            "uncertainty": round(float(uncertainty_hz), 1),
            "papr_db": round(float(10.0 * np.log10(papr + 1e-12)), 2),
            "bin_resolution_hz": round(float(bin_spacing), 2)
        }
