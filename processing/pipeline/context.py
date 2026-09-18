"""Internal signal representation for SpectraSync DSP engine."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
import numpy as np


class SignalFormat(str, Enum):
    IQ_COMPLEX64 = "iq_complex64"
    IQ_COMPLEX128 = "iq_complex128"
    IQ_INT16 = "iq_int16"
    IQ_INT8 = "iq_int8"
    WAV_PCM16 = "wav_pcm16"
    WAV_FLOAT32 = "wav_float32"
    UNKNOWN = "unknown"


@dataclass
class SignalData:
    """Internal normalized signal representation.

    All algorithms in SpectraSync consume this representation.
    `samples` is always a 1D NumPy array with dtype complex64 (or complex128).
    Real signals (mono audio/IF) are Hilbert-transformed to analytic complex baseband.
    """
    samples: np.ndarray
    sample_rate: float
    center_frequency: float = 0.0  # Hz, 0 for baseband
    channels: int = 2              # 2 for I/Q stereo or analytic pair
    format: SignalFormat = SignalFormat.IQ_COMPLEX64
    metadata: Dict[str, Any] = field(default_factory=dict)
    source: str = "upload"         # "upload", "demo", "synthetic", "live"
    checksum: str = ""             # SHA-256
    filepath: Optional[str] = None

    @property
    def num_samples(self) -> int:
        return len(self.samples)

    @property
    def duration_seconds(self) -> float:
        if self.sample_rate <= 0:
            return 0.0
        return self.num_samples / self.sample_rate

    def get_slice(self, start_idx: int = 0, count: Optional[int] = None) -> np.ndarray:
        """Efficient zero-copy or view slice of the signal."""
        if count is None:
            return self.samples[start_idx:]
        end_idx = min(start_idx + count, self.num_samples)
        return self.samples[start_idx:end_idx]

    def decimate(self, factor: int) -> np.ndarray:
        """Downsample signal for visualization or coarse estimation."""
        if factor <= 1:
            return self.samples
        return self.samples[::factor]
