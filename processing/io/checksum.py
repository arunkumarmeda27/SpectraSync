"""Streaming SHA-256 checksum calculation for large signal recordings."""

import hashlib
from pathlib import Path
from typing import Union


def calculate_sha256(filepath: Union[str, Path], chunk_size: int = 65536) -> str:
    """Calculate the SHA-256 hash of a file using streaming chunks to conserve memory."""
    path = Path(filepath)
    if not path.is_file():
        raise FileNotFoundError(f"File not found for checksum calculation: {filepath}")

    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
    return hasher.hexdigest()
