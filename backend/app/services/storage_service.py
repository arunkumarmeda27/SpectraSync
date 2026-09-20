"""Object storage abstraction supporting Local Filesystem and MinIO / AWS S3."""

import io
import logging
import os
import shutil
from pathlib import Path
from typing import BinaryIO, Optional, Union
from backend.app.core.config import settings

logger = logging.getLogger("storage")


class StorageService:
    """Provides unified object storage interface for raw recordings, plots, and reports."""

    def __init__(self):
        self.backend = settings.STORAGE_BACKEND.lower()
        self.local_root = Path(settings.LOCAL_STORAGE_DIR).resolve()
        self.local_root.mkdir(parents=True, exist_ok=True)
        self.minio_client = None
        self.s3_client = None

        if self.backend in ["minio", "s3"]:
            self._init_remote_client()

    def _init_remote_client(self):
        """Initialize MinIO or Boto3 S3 client with graceful fallback."""
        try:
            from minio import Minio
            endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
            self.minio_client = Minio(
                endpoint=endpoint,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            # Ensure target bucket exists
            bucket = settings.MINIO_BUCKET_NAME
            if not self.minio_client.bucket_exists(bucket):
                self.minio_client.make_bucket(bucket)
            logger.info(f"Initialized MinIO storage client connected to {endpoint}, bucket={bucket}")
        except ImportError:
            try:
                import boto3
                endpoint_url = f"{'https' if settings.MINIO_SECURE else 'http'}://{settings.MINIO_ENDPOINT}"
                self.s3_client = boto3.client(
                    "s3",
                    endpoint_url=endpoint_url,
                    aws_access_key_id=settings.MINIO_ACCESS_KEY,
                    aws_secret_access_key=settings.MINIO_SECRET_KEY
                )
                logger.info("Initialized Boto3 S3 storage client")
            except Exception as ex:
                logger.warning(f"S3/MinIO client unavailable ({ex}). Operating in local fallback mode.")
        except Exception as e:
            logger.warning(f"Failed to connect to MinIO ({e}). Falling back to local filesystem storage.")

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

        raw_bytes: Optional[bytes] = None
        if isinstance(content, bytes):
            raw_bytes = content
            with open(target_path, "wb") as f:
                f.write(content)
        else:
            with open(target_path, "wb") as f:
                shutil.copyfileobj(content, f)

        rel_path = str(target_path.relative_to(self.local_root)).replace("\\", "/")

        # Sync to MinIO/S3 if remote client is configured
        if self.minio_client:
            try:
                bucket = settings.MINIO_BUCKET_NAME
                file_size = target_path.stat().st_size
                with open(target_path, "rb") as file_data:
                    self.minio_client.put_object(
                        bucket,
                        rel_path,
                        file_data,
                        length=file_size
                    )
            except Exception as e:
                logger.warning(f"Failed to upload to MinIO ({e}); retained in local storage.")
        elif self.s3_client:
            try:
                bucket = settings.MINIO_BUCKET_NAME
                with open(target_path, "rb") as file_data:
                    self.s3_client.upload_fileobj(file_data, bucket, rel_path)
            except Exception as e:
                logger.warning(f"Failed to upload to S3 ({e}); retained in local storage.")

        return rel_path

    def get_file_path(self, storage_path: str) -> Path:
        """Resolve storage identifier to local absolute filesystem path."""
        clean_path = storage_path.lstrip("/\\")
        abs_path = (self.local_root / clean_path).resolve()

        # If file missing locally but remote client active, fetch from remote
        if not abs_path.is_file():
            if self.minio_client:
                try:
                    abs_path.parent.mkdir(parents=True, exist_ok=True)
                    self.minio_client.fget_object(settings.MINIO_BUCKET_NAME, clean_path, str(abs_path))
                except Exception:
                    pass
            elif self.s3_client:
                try:
                    abs_path.parent.mkdir(parents=True, exist_ok=True)
                    self.s3_client.download_file(settings.MINIO_BUCKET_NAME, clean_path, str(abs_path))
                except Exception:
                    pass

        return abs_path

    def read_bytes(self, storage_path: str) -> bytes:
        """Read bytes of stored object."""
        path = self.get_file_path(storage_path)
        if not path.is_file():
            raise FileNotFoundError(f"Storage path not found: {storage_path}")
        with open(path, "rb") as f:
            return f.read()

    def delete_file(self, storage_path: str) -> bool:
        """Delete stored object from both local and remote object storage."""
        clean_path = storage_path.lstrip("/\\")
        if self.minio_client:
            try:
                self.minio_client.remove_object(settings.MINIO_BUCKET_NAME, clean_path)
            except Exception:
                pass
        elif self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=settings.MINIO_BUCKET_NAME, Key=clean_path)
            except Exception:
                pass

        try:
            path = (self.local_root / clean_path).resolve()
            if path.is_file():
                path.unlink()
                return True
        except Exception:
            pass
        return False


storage_service = StorageService()
