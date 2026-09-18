"""WAV file reader and converter to internal SignalData representation."""

import wave
from pathlib import Path
from typing import Optional, Union

import numpy as np
from scipy.signal import hilbert

from processing.io.checksum import calculate_sha256
from processing.io.metadata import MetadataExtractor
from processing.io.validation import FileValidator
from processing.pipeline.context import SignalData, SignalFormat


class WavReader:
    """Reads WAV files, converting stereo I/Q or mono audio into complex SignalData."""

    @classmethod
    def read(
        cls,
        filepath: Union[str, Path],
        max_samples: Optional[int] = None,
        offset_samples: int = 0,
        sample_rate_override: Optional[float] = None
    ) -> SignalData:
        path = Path(filepath)
        validation = FileValidator.validate(path)
        if not validation.is_valid:
            raise ValueError(f"WAV validation error: {validation.error_message}")

        checksum = calculate_sha256(path)
        meta = MetadataExtractor.get_metadata(path)

        with wave.open(str(path), "rb") as wf:
            channels = wf.getnchannels()
            sample_rate = float(wf.getframerate())
            sample_width = wf.getsampwidth()
            total_frames = wf.getnframes()

            if sample_rate_override and sample_rate_override > 0:
                sample_rate = sample_rate_override

            if offset_samples > 0:
                wf.setpos(min(offset_samples, total_frames))

            frames_to_read = total_frames - offset_samples
            if max_samples is not None and max_samples > 0:
                frames_to_read = min(frames_to_read, max_samples)

            raw_bytes = wf.readframes(frames_to_read)

        # Parse numeric samples according to sample_width
        if sample_width == 1:  # 8-bit unsigned
            raw_data = (np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
            sig_format = SignalFormat.WAV_PCM16
        elif sample_width == 2:  # 16-bit signed
            raw_data = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            sig_format = SignalFormat.WAV_PCM16
        elif sample_width == 3:  # 24-bit signed PCM
            # Unpack 3-byte signed integers
            b = np.frombuffer(raw_bytes, dtype=np.uint8)
            num_samples = len(b) // 3
            b = b[:num_samples * 3].reshape(-1, 3)
            # Pad with 4th byte for 32-bit int
            pad = np.where(b[:, 2] & 0x80, 0xFF, 0x00).astype(np.uint8)
            b4 = np.column_stack([b, pad]).tobytes()
            raw_data = np.frombuffer(b4, dtype=np.int32).astype(np.float32) / 2147483648.0
            sig_format = SignalFormat.WAV_FLOAT32
        elif sample_width == 4:  # 32-bit float or 32-bit PCM
            try:
                raw_data = np.frombuffer(raw_bytes, dtype=np.float32)
                sig_format = SignalFormat.WAV_FLOAT32
            except Exception:
                raw_data = np.frombuffer(raw_bytes, dtype=np.int32).astype(np.float32) / 2147483648.0
                sig_format = SignalFormat.WAV_FLOAT32
        else:
            raise ValueError(f"Unsupported WAV sample width: {sample_width} bytes")

        # Channel mapping
        if channels == 2:
            # Stereo: Channel 0 is I, Channel 1 is Q
            raw_data = raw_data.reshape(-1, 2)
            i_samples = raw_data[:, 0]
            q_samples = raw_data[:, 1]
            complex_samples = (i_samples + 1j * q_samples).astype(np.complex64)
        elif channels == 1:
            # Mono: Compute analytic complex signal via Hilbert transform
            real_samples = raw_data
            complex_samples = hilbert(real_samples).astype(np.complex64)
        else:
            # Multi-channel: Take first two channels as I/Q
            raw_data = raw_data.reshape(-1, channels)
            complex_samples = (raw_data[:, 0] + 1j * raw_data[:, 1]).astype(np.complex64)

        return SignalData(
            samples=complex_samples,
            sample_rate=sample_rate,
            center_frequency=meta.get("center_frequency", 0.0),
            channels=channels,
            format=sig_format,
            metadata=meta,
            source="wav_file",
            checksum=checksum,
            filepath=str(path)
        )
