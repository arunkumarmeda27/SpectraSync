"""Integration tests for FastAPI backend and demo execution."""

import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def get_auth_token():
    """Helper to log in as analyst and return Bearer token headers."""
    resp = client.post("/api/auth/login", json={
        "email": "analyst@spectrasync.io",
        "password": "analyst123"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["platform"] == "SpectraSync"
    assert data["status"] == "operational"


def test_health_endpoints():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

    resp_services = client.get("/api/health/services")
    assert resp_services.status_code == 200
    services_data = resp_services.json()
    assert services_data["status"] == "operational"
    assert services_data["services"]["database"]["status"] == "healthy"


def test_demo_signals_list():
    resp = client.get("/api/demos/list")
    assert resp.status_code == 200
    demos = resp.json()
    assert len(demos) == 6
    keys = [d["key"] for d in demos]
    assert "golden_qpsk" in keys
    assert "golden_bpsk" in keys
    assert "golden_unknown" in keys


def test_upload_common_audio_file():
    headers = get_auth_token()
    audio_bytes = b"ID3" + (b"\x00" * 200)
    resp = client.post(
        "/api/files/upload",
        files={"file": ("demo_audio.mp3", audio_bytes, "audio/mpeg")},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["file"]["filename"] == "demo_audio.mp3"
    assert body["file"]["format"] in {"audio", "mp3"}


def test_demo_qpsk_execution():
    headers = get_auth_token()

    # Trigger demo QPSK job
    resp = client.post("/api/demos/golden_qpsk/load", headers=headers)
    assert resp.status_code == 200
    job_data = resp.json()
    job_id = job_data["id"]

    # Poll status until completed (worker runs in in-memory thread pool)
    timeout = 15.0
    start = time.time()
    final_status = None
    status_data = {}

    while time.time() - start < timeout:
        status_resp = client.get(f"/api/jobs/{job_id}/status", headers=headers)
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        if status_data["status"] in ["completed", "failed"]:
            final_status = status_data["status"]
            break
        time.sleep(0.3)

    assert final_status == "completed", f"Job failed or timed out: {status_data}"

    # Verify full analysis result
    analysis_resp = client.get(f"/api/jobs/{job_id}/analysis", headers=headers)
    assert analysis_resp.status_code == 200
    analysis = analysis_resp.json()
    assert analysis["primary_modulation"] == "QPSK"
    assert "parameters" in analysis
    assert "carrier_frequency" in analysis["parameters"]
    assert "symbol_rate" in analysis["parameters"]
    assert "snr" in analysis["parameters"]
    assert len(analysis["stages"]) == 13

    # Verify report generation
    report_resp = client.post(f"/api/jobs/{job_id}/report?export_format=json", headers=headers)
    assert report_resp.status_code == 200
    assert report_resp.json()["primary_modulation"] == "QPSK"
