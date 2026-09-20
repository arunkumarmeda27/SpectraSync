"""Validation utilities for uploaded RF and audio recordings."""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple, Union


@dataclass
class ValidationResult:
    is_valid: bool
    detected_format: str
    file_size_bytes: int
    error_message: Optional[str] = None
    suggested_action: Optional[str] = None
    warnings: List[str] = None

    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


class FileValidator:
    """Validates raw .IQ and .WAV recording integrity, formats, and headers."""

    SUPPORTED_EXTENSIONS = {".iq", ".wav", ".bin", ".raw", ".sigmf-data", ".sigmf"}
    MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2 GB default safe limit
    MIN_FILE_SIZE = 64  # Needs at least a few samples or header

    @classmethod
    def validate(cls, filepath: Union[str, Path]) -> ValidationResult:
        path = Path(filepath)
        if not path.exists():
            return ValidationResult(
                is_valid=False,
                detected_format="unknown",
                file_size_bytes=0,
                error_message="File does not exist on disk.",
                suggested_action="Verify the upload path or re-upload the recording."
            )

        file_size = path.stat().st_size
        if file_size < cls.MIN_FILE_SIZE:
            return ValidationResult(
                is_valid=False,
                detected_format="unknown",
                file_size_bytes=file_size,
                error_message=f"File too small ({file_size} bytes). Minimum required is {cls.MIN_FILE_SIZE} bytes.",
                suggested_action="Ensure the recording contains valid sample data and was not interrupted during recording."
            )

        if file_size > cls.MAX_FILE_SIZE:
            return ValidationResult(
                is_valid=False,
                detected_format="unknown",
                file_size_bytes=file_size,
                error_message=f"File exceeds maximum allowed upload size ({file_size} > {cls.MAX_FILE_SIZE} bytes).",
                suggested_action="Decimate, slice, or compress the recording prior to analysis."
            )

        suffix = path.suffix.lower()
        # Handle compound extensions like .sigmf-data
        if path.name.endswith(".sigmf-data"):
            suffix = ".sigmf-data"

        if suffix not in cls.SUPPORTED_EXTENSIONS:
            return ValidationResult(
                is_valid=False,
                detected_format="unsupported",
                file_size_bytes=file_size,
                error_message=f"Unsupported file extension '{suffix}'.",
                suggested_action=f"Provide a file with one of the supported extensions: {', '.join(cls.SUPPORTED_EXTENSIONS)}"
            )

        warnings: List[str] = []

        # Validate WAV RIFF header if .wav
        if suffix == ".wav":
            try:
                with open(path, "rb") as f:
                    header = f.read(12)
                if len(header) < 12 or header[0:4] != b"RIFF" or header[8:12] != b"WAVE":
                    return ValidationResult(
                        is_valid=False,
                        detected_format="corrupt_wav",
                        file_size_bytes=file_size,
                        error_message="Malformed WAV file: Missing 'RIFF' or 'WAVE' container marker.",
                        suggested_action="Check that the file is a standard RIFF WAV container or rename to .iq if it is raw binary."
                    )
                detected = "wav"
            except Exception as e:
                return ValidationResult(
                    is_valid=False,
                    detected_format="unreadable",
                    file_size_bytes=file_size,
                    error_message=f"Error reading WAV header: {str(e)}",
                    suggested_action="Verify disk permissions and file health."
                )
        elif suffix in [".sigmf-data", ".sigmf"]:
            # Check for companion .sigmf-meta file
            meta_cand = path.with_suffix(".sigmf-meta") if suffix != ".sigmf-data" else Path(str(path).replace(".sigmf-data", ".sigmf-meta"))
            if not meta_cand.is_file():
                meta_cand_alt = path.parent / f"{path.stem}.sigmf-meta"
                if not meta_cand_alt.is_file():
                    warnings.append("Companion .sigmf-meta metadata file not found; using nominal RF defaults.")
            detected = "sigmf"
        else:
            # Check raw binary readability and element alignment
            # Complex64 elements are 8 bytes each (float32 I, float32 Q)
            if file_size % 8 != 0:
                warnings.append(
                    f"File size ({file_size} bytes) is not a strict multiple of 8 (complex64). "
                    "Trailing bytes will be ignored or alternate sample format (int16/int8) should be verified."
                )
            detected = "iq"

        return ValidationResult(
            is_valid=True,
            detected_format=detected,
            file_size_bytes=file_size,
            warnings=warnings
        )
