"""System observability and health check endpoints."""

import os
import time
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.services.storage_service import storage_service

router = APIRouter(prefix="/health", tags=["health"])
SYSTEM_BOOT_TIME = time.time()

# Path to golden demo signals
_GOLDEN_DIR = Path("data/golden").resolve()


def _gather_health_data(db: Session) -> dict:
    """Internal helper — gather all health data once."""
    # 1. Database
    db_status = "healthy"
    db_latency_ms = 0.0
    try:
        t0 = time.time()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000.0, 2)
    except Exception as e:
        db_status = f"unhealthy: {e}"

    # 2. Storage
    storage_status = "healthy"
    try:
        _ = storage_service.local_root
    except Exception as e:
        storage_status = f"unhealthy: {e}"

    # 3. Queue
    queue_mode = "in_memory" if settings.USE_IN_MEMORY_QUEUE else "redis"

    # 4. Golden signal files
    golden_count = 0
    if _GOLDEN_DIR.is_dir():
        golden_count = len([f for f in _GOLDEN_DIR.iterdir() if f.suffix == ".iq"])

    # 5. ML model
    ml_status = "unknown"
    ml_model_name = "rf_modulation_classifier.pkl"
    try:
        from processing.modulation.ml_classifier import DEFAULT_MODEL_PATH
        ml_status = "ready" if DEFAULT_MODEL_PATH.is_file() else "model_missing"
        ml_model_name = DEFAULT_MODEL_PATH.name
    except Exception:
        pass

    overall = "healthy" if db_status == "healthy" else "degraded"

    return {
        "overall": overall,
        "db_status": db_status,
        "db_latency_ms": db_latency_ms,
        "storage_status": storage_status,
        "queue_mode": queue_mode,
        "golden_count": golden_count,
        "ml_status": ml_status,
        "ml_model_name": ml_model_name,
    }


@router.get("")
def health_check(db: Session = Depends(get_db)):
    """Liveness + readiness probe — returns all subsystem statuses.

    Response matches frontend HealthStatus interface:
      status, version, db, storage, worker, golden_signals
    """
    h = _gather_health_data(db)
    return {
        "status": h["overall"],
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptime_seconds": round(time.time() - SYSTEM_BOOT_TIME, 1),
        # Fields matched by frontend HealthStatus interface
        "db": h["db_status"],
        "storage": h["storage_status"],
        "worker": f"{h['queue_mode']}:ok",
        "golden_signals": h["golden_count"],
        # Extended diagnostics
        "db_latency_ms": h["db_latency_ms"],
        "queue_backend": h["queue_mode"],
        "ml_engine": h["ml_status"],
    }


@router.get("/services")
def services_health(db: Session = Depends(get_db)):
    """Detailed readiness probe with nested service breakdown."""
    h = _gather_health_data(db)
    return {
        "status": "operational" if h["overall"] == "healthy" else "degraded",
        "timestamp": time.time(),
        "version": settings.VERSION,
        "services": {
            "database": {
                "status": h["db_status"],
                "engine": settings.DATABASE_URL.split(":")[0],
                "latency_ms": h["db_latency_ms"],
            },
            "storage": {
                "status": h["storage_status"],
                "backend": settings.STORAGE_BACKEND,
            },
            "queue": {
                "status": "ok",
                "backend": h["queue_mode"],
            },
            "ml_engine": {
                "status": h["ml_status"],
                "model_artifact": h["ml_model_name"],
            },
            "golden_signals": {
                "count": h["golden_count"],
                "status": "ok" if h["golden_count"] > 0 else "missing",
            },
        },
    }
