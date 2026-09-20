"""Core configuration settings for SpectraSync platform."""

import os
from pathlib import Path
from typing import List
from pydantic import BaseModel, Field


class Settings(BaseModel):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SpectraSync")
    VERSION: str = "1.0.0"
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "spectrasync-super-secret-jwt-key-2026"))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", os.getenv("ALGORITHM", "HS256"))
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")))
    # Aliases for backward compatibility
    SECRET_KEY: str = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET", "spectrasync-super-secret-jwt-key-2026"))
    ALGORITHM: str = os.getenv("ALGORITHM", os.getenv("JWT_ALGORITHM", "HS256"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./spectrasync.db")

    # Queue & Worker
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    USE_IN_MEMORY_QUEUE: bool = os.getenv("USE_IN_MEMORY_QUEUE", "true").lower() == "true"

    # Storage
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")
    LOCAL_STORAGE_DIR: str = os.getenv("LOCAL_STORAGE_DIR", "./data/storage")
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET_NAME: str = os.getenv("MINIO_BUCKET_NAME", "spectrasync-artifacts")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]


settings = Settings()

# Ensure local storage directory exists
Path(settings.LOCAL_STORAGE_DIR).mkdir(parents=True, exist_ok=True)
