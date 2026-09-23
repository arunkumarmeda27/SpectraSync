"""Demo Mode API router for instant turnkey demonstration with golden signals."""

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.schemas.job import AnalysisJobOut
from backend.app.services.file_service import FileService, _ensure_demo_library_exists
from backend.app.services.job_service import JobService
from processing.pipeline.pipeline import DspPipeline

router = APIRouter(prefix="/demos", tags=["demos"])

DEMO_PRESETS = [
    {
        "key": "golden_bpsk",
        "name": "Demo BPSK",
        "filename": "golden_bpsk.iq",
        "description": "BPSK baseband recording (50 kBaud, +5 kHz carrier offset, 22 dB SNR, Barker-11 preamble)",
        "modulation": "BPSK"
    },
    {
        "key": "golden_qpsk",
        "name": "Demo QPSK",
        "filename": "golden_qpsk.iq",
        "description": "QPSK baseband recording (50 kBaud, +2.4 kHz offset, 24 dB SNR, CCSDS-32 preamble)",
        "modulation": "QPSK"
    },
    {
        "key": "golden_2fsk",
        "name": "Demo FSK",
        "filename": "golden_2fsk.iq",
        "description": "Continuous-Phase 2-FSK recording (25 kBaud, 12.5 kHz deviation, 20 dB SNR)",
        "modulation": "2FSK"
    },
    {
        "key": "golden_16qam",
        "name": "Demo 16-QAM",
        "filename": "golden_16qam.iq",
        "description": "16-QAM constellation recording (40 kBaud, 28 dB SNR, Barker-13 sync)",
        "modulation": "16QAM"
    },
    {
        "key": "golden_noisy",
        "name": "Demo Noisy Signal",
        "filename": "golden_noisy.iq",
        "description": "Degraded low-SNR QPSK signal (2 dB SNR, +15 kHz offset) demonstrating ambiguity handling",
        "modulation": "QPSK"
    },
    {
        "key": "golden_unknown",
        "name": "Demo Unknown Signal",
        "filename": "golden_unknown.iq",
        "description": "Colored Gaussian noise and unmodulated tones testing UNKNOWN fallback without forced classification",
        "modulation": "UNKNOWN"
    }
]

_preview_cache: Optional[Dict[str, Any]] = None


@router.get("/list")
def list_demo_signals():
    """List available demo signals for turnkey demonstration."""
    return DEMO_PRESETS


@router.get("/preview")
def get_demo_preview():
    """Return a read-only analysis of the built-in golden QPSK signal for the public homepage."""
    global _preview_cache
    if _preview_cache is not None:
        return _preview_cache

    golden_dir = Path("data/golden").resolve()
    _ensure_demo_library_exists(golden_dir)
    signal_path = golden_dir / "golden_qpsk.iq"
    if not signal_path.is_file():
        raise HTTPException(status_code=404, detail="Built-in golden QPSK signal is not available")

    result = DspPipeline().execute(signal_path, config={"max_samples": 100_000})
    if result.get("status") != "completed":
        raise HTTPException(status_code=503, detail="Built-in golden demo analysis is not available")

    bit_views = result.get("bitstream", {})
    hex_dump = bit_views.get("hex_dump", [])
    result["primary_modulation"] = result.get("modulation", {}).get("primary_modulation", "UNKNOWN")
    result["confidence"] = result.get("modulation", {}).get("primary_confidence", 0.0)
    result["bitstream"] = {
        **bit_views,
        "length": bit_views.get("total_bits", 0),
        "hex_stream": " ".join(row.get("hex", "") for row in hex_dump),
        "ascii_stream": bit_views.get("ascii_preview", ""),
        "headers": result.get("headers", []),
        "payload_frames": result.get("payloads", []),
        "correlation_score": result.get("correlation", {}).get("correlation_score", 0.0),
        "bit_rate_bps": result.get("demodulation", {}).get("bit_rate_bps", 0),
    }

    _preview_cache = result
    return result


@router.post("/{demo_key}/load", response_model=AnalysisJobOut)
def load_and_analyze_demo(
    demo_key: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Load a demo signal, create an analysis job, and queue it for DSP processing."""
    preset = next((p for p in DEMO_PRESETS if p["key"] == demo_key), None)
    if not preset:
        valid_keys = [p["key"] for p in DEMO_PRESETS]
        raise HTTPException(
            status_code=404,
            detail=f"Demo key '{demo_key}' not recognized. Valid keys: {valid_keys}"
        )

    try:
        sig_file = FileService.load_demo_file(db, demo_name=demo_key)
        job = JobService.create_job(db, signal_file_id=sig_file.id, pipeline_config={"demo_key": demo_key})
        return job
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo signal: {str(e)}")
