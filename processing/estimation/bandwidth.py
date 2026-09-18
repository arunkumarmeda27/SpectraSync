"""Signal bandwidth estimation (99% Occupied Bandwidth, -3dB, -20dB)."""

from typing import Any, Dict
import numpy as np


class BandwidthEstimator:
    """Estimates occupied signal bandwidth (OBW) and power cutoff widths."""

    @classmethod
    def estimate(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        fft_size: int = 4096
    ) -> Dict[str, Any]:
        """Calculate 99% occupied bandwidth and -3dB power bandwidth."""
        if len(samples) == 0:
            return {
                "parameter": "bandwidth",
                "value": 0.0,
                "unit": "Hz",
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

        win = np.hanning(fft_size)
        psd = np.abs(np.fft.fftshift(np.fft.fft(chunk * win)))**2
        bin_spacing = sample_rate / fft_size

        total_power = np.sum(psd)
        if total_power <= 1e-15:
            return {
                "parameter": "bandwidth",
                "value": 0.0,
                "unit": "Hz",
                "confidence": 0.1,
                "confidence_label": "Low",
                "source": "dsp_estimate",
                "method": "zero_power",
                "uncertainty": sample_rate / 2.0
            }

        # 99% Occupied Bandwidth (0.5% in lower tail, 0.5% in upper tail)
        cum_power = np.cumsum(psd) / total_power
        lower_idx = int(np.searchsorted(cum_power, 0.005))
        upper_idx = int(np.searchsorted(cum_power, 0.995))

        lower_idx = max(0, min(fft_size - 1, lower_idx))
        upper_idx = max(lower_idx, min(fft_size - 1, upper_idx))

        obw_hz = (upper_idx - lower_idx) * bin_spacing

        # -3dB Bandwidth around peak
        peak_idx = int(np.argmax(psd))
        peak_val = psd[peak_idx]
        half_power = peak_val / 2.0

        # Scan left
        left_3db = peak_idx
        while left_3db > 0 and psd[left_3db] > half_power:
            left_3db -= 1

        # Scan right
        right_3db = peak_idx
        while right_3db < fft_size - 1 and psd[right_3db] > half_power:
            right_3db += 1

        bw_3db_hz = (right_3db - left_3db) * bin_spacing

        # Uncertainty based on bin resolution
        uncertainty_hz = 2.0 * bin_spacing

        # Confidence: High if clear power concentration, Medium if noisy
        in_band_ratio = np.sum(psd[lower_idx:upper_idx]) / total_power
        confidence = 0.92 if in_band_ratio > 0.95 else 0.65
        label = "High" if confidence >= 0.8 else "Medium"

        return {
            "parameter": "bandwidth",
            "value": round(float(obw_hz), 2),
            "unit": "Hz",
            "confidence": round(float(confidence), 3),
            "confidence_label": label,
            "source": "dsp_estimate",
            "method": "cumulative_power_integral_99pct",
            "uncertainty": round(float(uncertainty_hz), 1),
            "bandwidth_3db_hz": round(float(bw_3db_hz), 2),
            "bin_resolution_hz": round(float(bin_spacing), 2)
        }
