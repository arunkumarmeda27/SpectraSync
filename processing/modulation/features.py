"""Feature extraction for modulation classification (cumulants, envelope, spectral symmetry)."""

from typing import Dict, Any
import numpy as np


class ModulationFeatureExtractor:
    """Extracts Higher-Order Cumulants and statistical shape features from complex baseband signals."""

    @classmethod
    def extract_features(cls, samples: np.ndarray, max_samples: int = 32768) -> Dict[str, float]:
        """Extract statistical and cumulant features from complex baseband signal.

        Args:
            samples: Complex baseband signal
            max_samples: Maximum number of samples to process (default 32768 for speed)
        """
        n = len(samples)
        if n < 128:
            return {f"c_{k}": 0.0 for k in ["20", "21", "40", "41", "42"]}

        # Downsample if too large for faster feature extraction
        if n > max_samples:
            step = n // max_samples
            samples = samples[::step][:max_samples]
            n = len(samples)

        # Normalize signal to unit energy: E[|r|^2] = 1
        mean_power = np.mean(np.abs(samples)**2)
        if mean_power <= 1e-12:
            norm_samples = samples
        else:
            norm_samples = samples / np.sqrt(mean_power)

        r = norm_samples

        # Precompute powers for reuse
        r_squared = r**2
        r_abs_squared = np.abs(r)**2  # Should be ~1.0

        # Moments (vectorized)
        m20 = np.mean(r_squared)
        m21 = np.mean(r_abs_squared)
        m40 = np.mean(r**4)
        m41 = np.mean((r**3) * np.conj(r))
        m42 = np.mean(r_abs_squared**2)

        # Higher-Order Cumulants
        c20 = m20
        c21 = m21
        c40 = m40 - 3.0 * (c20**2)
        c41 = m41 - 3.0 * c20 * c21
        c42 = m42 - np.abs(c20)**2 - 2.0 * (c21**2)

        # Magnitudes of cumulants
        abs_c20 = float(np.abs(c20))
        abs_c40 = float(np.abs(c40))
        abs_c41 = float(np.abs(c41))
        abs_c42 = float(np.abs(c42))

        # Instantaneous envelope features (reuse r_abs_squared)
        env = np.sqrt(r_abs_squared)
        mean_env = np.mean(env)
        var_env = float(np.var(env))

        # Gamma_max: Maximum spectral power of normalized centered instantaneous amplitude
        a_cn = (env / (mean_env + 1e-12)) - 1.0
        n_fft = min(len(a_cn), 2048)
        fft_a = np.fft.fft(a_cn[:n_fft])
        gamma_max = float(np.max(np.abs(fft_a)**2) / n_fft)

        # Instantaneous phase & frequency features (on 4096-sample window for ultra-fast calculation)
        sub_n = min(len(r), 4096)
        r_sub = r[:sub_n]
        phase = np.unwrap(np.angle(r_sub))
        sigma_dp = float(np.std(phase))

        # Instantaneous frequency: phase derivative
        inst_freq = np.diff(phase) / (2.0 * np.pi)
        sigma_af = float(np.std(inst_freq))

        # Spectral symmetry (P_sym) - reuse single FFT
        fft_r = np.abs(np.fft.fftshift(np.fft.fft(r[:n_fft])))**2
        half_n = n_fft // 2
        p_lower = np.sum(fft_r[:half_n])
        p_upper = np.sum(fft_r[half_n:])
        p_sym = float(abs(p_upper - p_lower) / (p_upper + p_lower + 1e-12))

        return {
            "abs_c20": round(abs_c20, 4),
            "abs_c40": round(abs_c40, 4),
            "abs_c41": round(abs_c41, 4),
            "abs_c42": round(abs_c42, 4),
            "c42_signed": round(float(c42.real), 4),
            "var_env": round(var_env, 4),
            "gamma_max": round(gamma_max, 4),
            "sigma_dp": round(sigma_dp, 4),
            "sigma_af": round(sigma_af, 4),
            "spectral_symmetry": round(p_sym, 4)
        }
