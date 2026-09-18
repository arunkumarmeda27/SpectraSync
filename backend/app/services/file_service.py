"""Signal file management service."""

from pathlib import Path
from typing import BinaryIO, Optional
from sqlalchemy.orm import Session

from backend.app.models.signal_file import SignalFile
from backend.app.services.storage_service import storage_service
from processing.io.checksum import calculate_sha256
from processing.io.metadata import MetadataExtractor
from processing.io.validation import FileValidator


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
        # 1. Save to storage
        storage_rel_path = storage_service.save_file(filename, content, subfolder="recordings")
        abs_path = storage_service.get_file_path(storage_rel_path)

        # 2. Validate
        val_res = FileValidator.validate(abs_path)
        if not val_res.is_valid:
            storage_service.delete_file(storage_rel_path)
            raise ValueError(val_res.error_message or "Invalid file format")

        # 3. Calculate checksum & extract metadata
        checksum = calculate_sha256(abs_path)
        meta = MetadataExtractor.get_metadata(abs_path)

        sample_rate = sample_rate_override or meta.get("sample_rate", 1_000_000.0)
        center_freq = center_frequency_override or meta.get("center_frequency", 0.0)
        channels = meta.get("channels", 2)
        sample_fmt = "pcm16" if val_res.detected_format == "wav" else "complex64"

        # 4. Save to database
        db_file = SignalFile(
            filename=filename,
            format=val_res.detected_format,
            size=len(content),
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
