"""Raw binary .IQ file reader with memory-aware streaming support."""

from pathlib import Path
from typing import Optional, Union

import numpy as np

from processing.io.checksum import calculate_sha256
from processing.io.metadata import MetadataExtractor
from processing.io.validation import FileValidator
from processing.pipeline.context import SignalData, SignalFormat


class IqReader:
    """Reads raw .IQ binary recordings in complex64, int16, or int8 formats."""

    @classmethod
    def read(
        cls,
        filepath: Union[str, Path],
        sample_format: SignalFormat = SignalFormat.IQ_COMPLEX64,
        sample_rate: float = 1_000_000.0,
        center_frequency: float = 0.0,
        max_samples: Optional[int] = None,
        offset_samples: int = 0
    ) -> SignalData:
        path = Path(filepath)
        validation = FileValidator.validate(path)
        if not validation.is_valid:
            raise ValueError(f"IQ validation error: {validation.error_message}")

        checksum = calculate_sha256(path)
        meta = MetadataExtractor.get_metadata(path)

        # Allow sidecar or parameter overrides
        if sample_rate <= 0 and meta.get("sample_rate", 0) > 0:
            sample_rate = float(meta["sample_rate"])
        if center_frequency == 0.0 and meta.get("center_frequency", 0) > 0:
            center_frequency = float(meta["center_frequency"])

        # Determine element byte sizes and dtypes
        if sample_format == SignalFormat.IQ_COMPLEX64:
            dtype = np.float32
            bytes_per_sample = 8  # 4 bytes I + 4 bytes Q
            scale = 1.0
        elif sample_format == SignalFormat.IQ_COMPLEX128:
            dtype = np.float64
            bytes_per_sample = 16 # 8 bytes I + 8 bytes Q
            scale = 1.0
        elif sample_format == SignalFormat.IQ_INT16:
            dtype = np.int16
            bytes_per_sample = 4  # 2 bytes I + 2 bytes Q
            scale = 32768.0
        elif sample_format == SignalFormat.IQ_INT8:
            dtype = np.int8
            bytes_per_sample = 2  # 1 byte I + 1 byte Q
            scale = 128.0
        else:
            # Default to complex64
            dtype = np.float32
            bytes_per_sample = 8
            scale = 1.0

        byte_offset = offset_samples * bytes_per_sample
        count_elements = max_samples * 2 if max_samples is not None else -1

        with open(path, "rb") as f:
            if byte_offset > 0:
                f.seek(byte_offset)
            raw = np.fromfile(f, dtype=dtype, count=count_elements)

        # If odd number of components, trim last component
        if len(raw) % 2 != 0:
            raw = raw[:-1]

        # Reshape to I and Q
        raw = raw.reshape(-1, 2)
        i_parts = raw[:, 0].astype(np.float32) / scale
        q_parts = raw[:, 1].astype(np.float32) / scale
        complex_samples = (i_parts + 1j * q_parts).astype(np.complex64)

        return SignalData(
            samples=complex_samples,
            sample_rate=sample_rate,
            center_frequency=center_frequency,
            channels=2,
            format=sample_format,
            metadata=meta,
            source="iq_file",
            checksum=checksum,
            filepath=str(path)
        )
