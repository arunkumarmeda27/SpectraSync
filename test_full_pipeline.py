"""Deterministic end-to-end regression for supported signal types."""

from pathlib import Path

from processing.pipeline.pipeline import DspPipeline


GOLDEN_CASES = {
    "golden_bpsk.iq": "BPSK",
    "golden_qpsk.iq": "QPSK",
    "golden_2fsk.iq": "2FSK",
    "golden_16qam.iq": "16QAM",
}


def test_supported_signal_pipeline():
    """Each supported golden signal must produce modulation and recovered bits."""
    golden_dir = Path("data/golden")
    for filename, expected_modulation in GOLDEN_CASES.items():
        result = DspPipeline().execute(golden_dir / filename, config={"max_samples": 100_000})
        assert result["status"] == "completed"
        assert result["modulation"]["primary_modulation"] == expected_modulation
        assert result["demodulation"]["bit_count"] > 0
        assert result["bitstream"]["total_bits"] > 0
        assert result["bitstream"]["total_bytes"] > 0
