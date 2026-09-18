"""Signal-to-Noise Ratio (SNR) estimation using spectral noise floor and M2M4 moments."""

from typing import Any, Dict
import numpy as np


class SnrEstimator:
    """Estimates in-band SNR using combined spectral noise floor and M2M4 kurtosis estimation."""

    @classmethod
    def estimate(
        cls,
        samples: np.ndarray,
        sample_rate: float,
        fft_size: int = 4096
    ) -> Dict[str, Any]:
        """Estimate SNR in dB with uncertainty bounds."""
        if len(samples) < 128:
            return {
                "parameter": "snr",
                "value": 0.0,
                "unit": "dB",
                "confidence": 0.0,
                "confidence_label": "Low",
                "source": "dsp_estimate",
                "method": "insufficient_samples",
                "uncertainty": 0.0
            }

        # 1. Spectral Method
        n = min(len(samples), fft_size)
        chunk = samples[:n]
        if n < fft_size:
            chunk = np.pad(chunk, (0, fft_size - n))

        win = np.hanning(fft_size)
        psd = np.abs(np.fft.fftshift(np.fft.fft(chunk * win)))**2

        # Sort PSD bins to separate signal bins from noise floor bins
        sorted_psd = np.sort(psd)
        # Lowest 30% of bins are almost purely noise floor
        noise_floor_power = np.mean(sorted_psd[:int(0.3 * len(sorted_psd))])
        total_power = np.mean(psd)

        signal_power = max(1e-12, total_power - noise_floor_power)
        spectral_snr_linear = signal_power / (noise_floor_power + 1e-12)
        spectral_snr_db = 10.0 * np.log10(max(1e-3, spectral_snr_linear))

        # 2. Moment-based M2M4 Estimator
        m2 = float(np.mean(np.abs(samples)**2))
        m4 = float(np.mean(np.abs(samples)**4))

        # For constant envelope / PSK: kurtosis factor ks = 1.0. For QAM: ~1.32
        # M2 = S + N
        # M4 = ks*S^2 + 4*S*N + 2*N^2
        # Solving discriminant:
        ks = 1.05  # Average assumption
        disc = (2.0 - ks) * m2**2 - (m4 - m2**2)
        if disc > 0 and (2.0 - ks) > 0:
            s_est = np.sqrt(disc / (2.0 - ks))
            n_est = max(1e-12, m2 - s_est)
            m2m4_snr_db = 10.0 * np.log10(max(1e-3, s_est / n_est))
        else:
            m2m4_snr_db = spectral_snr_db

        # Combine estimates
        snr_final_db = 0.6 * spectral_snr_db + 0.4 * m2m4_snr_db
        snr_final_db = max(-10.0, min(50.0, snr_final_db))

        # Discrepancy between methods provides natural uncertainty metric
        uncertainty_db = max(1.0, min(5.0, abs(spectral_snr_db - m2m4_snr_db) * 0.75 + 1.2))

        # Confidence: High if SNR > 12 dB with low method discrepancy
        if snr_final_db >= 12.0 and uncertainty_db <= 2.5:
            confidence = 0.94
            label = "High"
        elif snr_final_db >= 5.0:
            confidence = 0.72
            label = "Medium"
        else:
            confidence = 0.35
            label = "Low"

        return {
            "parameter": "snr",
            "value": round(float(snr_final_db), 1),
            "unit": "dB",
            "confidence": round(float(confidence), 3),
            "confidence_label": label,
            "source": "dsp_estimate",
            "method": "spectral_percentile_and_m2m4_moments",
            "uncertainty": round(float(uncertainty_db), 1),
            "spectral_snr_db": round(float(spectral_snr_db), 1),
            "m2m4_snr_db": round(float(m2m4_snr_db), 1)
        }
