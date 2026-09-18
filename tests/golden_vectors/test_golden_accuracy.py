"""Golden Vector validation tests across all generated signal files."""

from pathlib import Path
import pytest
from processing.pipeline.pipeline import DspPipeline

GOLDEN_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "golden"


def test_golden_bpsk():
    sig_path = GOLDEN_DIR / "golden_bpsk.iq"
    if not sig_path.exists():
        pytest.skip("Golden BPSK file not generated")
    pipeline = DspPipeline()
    res = pipeline.execute(sig_path)
    assert res["status"] == "completed"
    assert res["modulation"]["primary_modulation"] == "BPSK"
    assert res["modulation"]["primary_confidence"] > 0.5
    assert len(res["stages"]) == 13
    assert len(res["demodulation"]["recovered_bits"]) > 0


def test_golden_qpsk():
    sig_path = GOLDEN_DIR / "golden_qpsk.iq"
    if not sig_path.exists():
        pytest.skip("Golden QPSK file not generated")
    pipeline = DspPipeline()
    res = pipeline.execute(sig_path)
    assert res["status"] == "completed"
    assert res["modulation"]["primary_modulation"] == "QPSK"
    assert res["modulation"]["primary_confidence"] > 0.5
    assert len(res["stages"]) == 13
    assert len(res["demodulation"]["recovered_bits"]) > 0


def test_golden_2fsk():
    sig_path = GOLDEN_DIR / "golden_2fsk.iq"
    if not sig_path.exists():
        pytest.skip("Golden 2-FSK file not generated")
    pipeline = DspPipeline()
    res = pipeline.execute(sig_path)
    assert res["status"] == "completed"
    assert "FSK" in res["modulation"]["primary_modulation"]
    assert len(res["stages"]) == 13


def test_golden_16qam():
    sig_path = GOLDEN_DIR / "golden_16qam.iq"
    if not sig_path.exists():
        pytest.skip("Golden 16-QAM file not generated")
    pipeline = DspPipeline()
    res = pipeline.execute(sig_path)
    assert res["status"] == "completed"
    assert res["modulation"]["primary_modulation"] in ["16QAM", "QPSK", "8PSK"]
    assert len(res["stages"]) == 13


def test_golden_unknown():
    sig_path = GOLDEN_DIR / "golden_unknown.iq"
    if not sig_path.exists():
        pytest.skip("Golden unknown file not generated")
    pipeline = DspPipeline()
    res = pipeline.execute(sig_path)
    assert res["status"] == "completed"
    assert "UNKNOWN" in res["modulation"]["primary_modulation"]
