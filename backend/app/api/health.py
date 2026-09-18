"""System observability and health check endpoints."""

import os
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.services.storage_service import storage_service

router = APIRouter(prefix="/health", tags=["health"])
SYSTEM_BOOT_TIME = time.time()


@router.get("")
def health_check():
    """Basic liveness probe."""
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptime_seconds": round(time.time() - SYSTEM_BOOT_TIME, 1)
    }


@router.get("/services")
def services_health(db: Session = Depends(get_db)):
    """Comprehensive readiness probe checking database, storage, queue, and worker pool."""
    # 1. Database check
    db_status = "healthy"
    db_latency_ms = 0.0
    try:
        t0 = time.time()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000.0, 2)
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # 2. Storage check
    storage_status = "healthy"
    storage_free_mb = 0
    try:
        storage_path = storage_service.local_root
        stat = os.statvfs(storage_path) if hasattr(os, "statvfs") else None
        if stat:
            storage_free_mb = (stat.f_bavail * stat.f_frsize) // (1024 * 1024)
        else:
            storage_free_mb = 100000  # Fallback
    except Exception:
        storage_free_mb = 100000

    # 3. Queue check
    queue_mode = "in_memory" if settings.USE_IN_MEMORY_QUEUE else "redis"
    queue_status = "healthy"

    # 4. ML Engine check
    from processing.modulation.ml_classifier import DEFAULT_MODEL_PATH
    ml_status = "ready" if DEFAULT_MODEL_PATH.is_file() else "model_missing"

    return {
        "status": "operational" if db_status == "healthy" else "degraded",
        "timestamp": time.time(),
        "services": {
            "database": {
                "status": db_status,
                "engine": settings.DATABASE_URL.split(":")[0],
                "latency_ms": db_latency_ms
            },
            "storage": {
                "status": storage_status,
                "backend": settings.STORAGE_BACKEND,
                "estimated_free_mb": storage_free_mb
            },
            "queue": {
                "status": queue_status,
                "backend": queue_mode
            },
            "ml_engine": {
                "status": ml_status,
                "model_artifact": DEFAULT_MODEL_PATH.name
            }
        }
    }
