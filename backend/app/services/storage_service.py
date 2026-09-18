"""Object storage abstraction supporting Local Filesystem and MinIO/S3."""

import os
import shutil
from pathlib import Path
from typing import BinaryIO, Optional, Union
from backend.app.core.config import settings


class StorageService:
    """Provides unified object storage interface for raw recordings, plots, and reports."""

    def __init__(self):
        self.backend = settings.STORAGE_BACKEND.lower()
        self.local_root = Path(settings.LOCAL_STORAGE_DIR).resolve()
        self.local_root.mkdir(parents=True, exist_ok=True)

    def save_file(
        self,
        filename: str,
        content: Union[bytes, BinaryIO],
        subfolder: str = "recordings"
    ) -> str:
        """Save file content and return persistent storage path identifier."""
        target_dir = self.local_root / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        safe_name = Path(filename).name
        target_path = target_dir / safe_name

        # Avoid overwriting by appending timestamp or index if already exists
        counter = 1
        stem = target_path.stem
        suffix = target_path.suffix
        while target_path.exists():
            target_path = target_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        if isinstance(content, bytes):
            with open(target_path, "wb") as f:
                f.write(content)
        else:
            with open(target_path, "wb") as f:
                shutil.copyfileobj(content, f)

        # Return relative storage identifier
        rel_path = str(target_path.relative_to(self.local_root)).replace("\\", "/")
        return rel_path

    def get_file_path(self, storage_path: str) -> Path:
        """Resolve storage identifier to local absolute filesystem path."""
        # Clean relative path
        clean_path = storage_path.lstrip("/\\")
        abs_path = (self.local_root / clean_path).resolve()
        return abs_path

    def read_bytes(self, storage_path: str) -> bytes:
        """Read bytes of stored object."""
        path = self.get_file_path(storage_path)
        if not path.is_file():
            raise FileNotFoundError(f"Storage path not found: {storage_path}")
        with open(path, "rb") as f:
            return f.read()

    def delete_file(self, storage_path: str) -> bool:
        """Delete stored object."""
        try:
            path = self.get_file_path(storage_path)
            if path.is_file():
                path.unlink()
                return True
        except Exception:
            pass
        return False


storage_service = StorageService()
