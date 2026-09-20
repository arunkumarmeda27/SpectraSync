"""Demo Mode API router for instant turnkey demonstration with golden signals."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.schemas.job import AnalysisJobOut
from backend.app.services.file_service import FileService
from backend.app.services.job_service import JobService

router = APIRouter(prefix="/demos", tags=["demos"])

DEMO_PRESETS = [
    {
        "key": "golden_bpsk",
        "name": "Demo BPSK",
        "description": "BPSK baseband recording (50 kBaud, +5 kHz carrier offset, 22 dB SNR, Barker-11 preamble)",
        "modulation": "BPSK"
    },
    {
        "key": "golden_qpsk",
        "name": "Demo QPSK",
        "description": "QPSK baseband recording (50 kBaud, +2.4 kHz offset, 24 dB SNR, CCSDS-32 preamble)",
        "modulation": "QPSK"
    },
    {
        "key": "golden_2fsk",
        "name": "Demo FSK",
        "description": "Continuous-Phase 2-FSK recording (25 kBaud, 12.5 kHz deviation, 20 dB SNR)",
        "modulation": "2FSK"
    },
    {
        "key": "golden_16qam",
        "name": "Demo 16-QAM",
        "description": "16-QAM constellation recording (40 kBaud, 28 dB SNR, Barker-13 sync)",
        "modulation": "16QAM"
    },
    {
        "key": "golden_noisy",
        "name": "Demo Noisy Signal",
        "description": "Degraded low-SNR QPSK signal (2 dB SNR, +15 kHz offset) demonstrating ambiguity handling",
        "modulation": "QPSK / UNKNOWN"
    },
    {
        "key": "golden_unknown",
        "name": "Demo Unknown Signal",
        "description": "Colored Gaussian noise and unmodulated tones testing UNKNOWN fallback without forced classification",
        "modulation": "UNKNOWN"
    }
]


@router.get("/list")
def list_demo_signals():
    """List available demo signals for turnkey demonstration."""
    return DEMO_PRESETS


@router.post("/{demo_key}/load", response_model=AnalysisJobOut)
def load_and_analyze_demo(
    demo_key: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Load a demo signal, create an analysis job, and run asynchronously."""
    valid_keys = [p["key"] for p in DEMO_PRESETS]
    if demo_key not in valid_keys:
        raise HTTPException(status_code=404, detail=f"Demo key '{demo_key}' not recognized. Valid: {valid_keys}")

    try:
        sig_file = FileService.load_demo_file(db, demo_name=demo_key)
        job = JobService.create_job(db, signal_file_id=sig_file.id)
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo signal: {str(e)}")
