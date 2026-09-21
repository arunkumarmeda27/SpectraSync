"""Signal file management service."""

from pathlib import Path
from typing import BinaryIO, Optional
from sqlalchemy.orm import Session

from backend.app.models.signal_file import SignalFile
from backend.app.services.storage_service import storage_service
from processing.io.checksum import calculate_sha256
from processing.io.metadata import MetadataExtractor
from processing.io.validation import FileValidator


def _ensure_demo_library_exists(golden_dir: Path) -> None:
    """Generate the built-in demo signals if the golden library is missing."""
    golden_dir.mkdir(parents=True, exist_ok=True)
    if any(golden_dir.iterdir()):
        return

    from ml.generation.generate_golden_signals import generate_all_golden_signals

    generate_all_golden_signals(golden_dir)


class FileService:
    """Manages signal file uploads, storage persistence, and DB records."""

    @classmethod
    def upload_file(
        cls,
        db: Session,
        filename: str,
        content: bytes,
        sample_rate_override: Optional[float] = None,
        center_frequency_override: Optional[float] = None
    ) -> SignalFile:
        """Store uploaded recording and persist metadata record."""
        # Quick validation BEFORE writing to disk
        import hashlib
        suffix = Path(filename).suffix.lower()
        file_size = len(content)

        # Fast pre-checks
        if file_size < 64:
            raise ValueError(f"File too small ({file_size} bytes). Minimum required is 64 bytes.")
        if file_size > 2 * 1024 * 1024 * 1024:
            raise ValueError(f"File exceeds maximum size (2 GB).")

        supported = {".iq", ".wav", ".bin", ".raw", ".sigmf-data", ".sigmf", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".oga", ".opus"}
        if suffix not in supported:
            raise ValueError(f"Unsupported file extension '{suffix}'.")

        # Calculate checksum from in-memory content (avoid re-reading from disk)
        checksum = hashlib.sha256(content).hexdigest()

        # Quick format detection
        if suffix == ".wav" and (len(content) < 12 or content[0:4] != b"RIFF" or content[8:12] != b"WAVE"):
            raise ValueError("Malformed WAV file: Missing 'RIFF' or 'WAVE' container marker.")

        # Determine format
        audio_exts = {".mp3", ".m4a", ".aac", ".flac", ".ogg", ".oga", ".opus"}
        if suffix in audio_exts:
            detected_format = "audio"
        elif suffix == ".wav":
            detected_format = "wav"
        elif suffix in [".sigmf-data", ".sigmf"]:
            detected_format = "sigmf"
        else:
            detected_format = "iq"

        # 1. Save to storage
        storage_rel_path = storage_service.save_file(filename, content, subfolder="recordings")
        abs_path = storage_service.get_file_path(storage_rel_path)

        # 2. Extract metadata (lightweight, only if needed)
        meta = MetadataExtractor.get_metadata(abs_path)

        sample_rate = sample_rate_override or meta.get("sample_rate", 1_000_000.0)
        center_freq = center_frequency_override or meta.get("center_frequency", 0.0)
        channels = meta.get("channels", 2)
        if detected_format in {"wav", "audio"}:
            sample_fmt = "pcm16"
        else:
            sample_fmt = "complex64"

        # 3. Save to database
        db_file = SignalFile(
            filename=filename,
            format=detected_format,
            size=file_size,
            sample_rate=sample_rate,
            channels=channels,
            sample_format=sample_fmt,
            center_frequency=center_freq,
            storage_path=storage_rel_path,
            checksum=checksum
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        return db_file

    @classmethod
    def load_demo_file(
        cls,
        db: Session,
        demo_name: str
    ) -> SignalFile:
        """Load a pre-generated golden demo file into storage and database."""
        golden_dir = Path("data/golden").resolve()
        _ensure_demo_library_exists(golden_dir)

        candidate = golden_dir / f"{demo_name}.iq"
        if not candidate.is_file():
            candidate = golden_dir / f"{demo_name}.wav"
        if not candidate.is_file():
            raise FileNotFoundError(f"Demo file '{demo_name}' not found in golden library.")

        with open(candidate, "rb") as f:
            content = f.read()

        db_file = cls.upload_file(db, filename=candidate.name, content=content)

        # Also copy sidecar json if exists
        sidecar_cand = candidate.with_suffix(".json")
        if sidecar_cand.is_file():
            with open(sidecar_cand, "rb") as f:
                storage_service.save_file(f"{Path(db_file.storage_path).name}.json", f.read(), subfolder="recordings")

        return db_file
