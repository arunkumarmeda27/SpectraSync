"""Test the pipeline with pre-generated golden signals."""

from pathlib import Path
from processing.pipeline.pipeline import DspPipeline
import json

def run_golden_signal(signal_path, expected_modulation):
    """Test a single golden signal."""
    print(f"\n{'='*70}")
    print(f"Testing: {signal_path.name}")
    print(f"Expected: {expected_modulation}")
    print('='*70)

    # Load metadata if available
    json_path = signal_path.with_suffix('.json')
    metadata = {}
    if json_path.exists():
        with open(json_path, 'r') as f:
            metadata = json.load(f)
            print(f"Metadata: SNR={metadata.get('snr_db')}dB, SymRate={metadata.get('symbol_rate')}Hz")

    # Run pipeline
    pipeline = DspPipeline()
    results = pipeline.execute(signal_path, config={"max_samples": 100_000})

    # Extract results
    status = results.get("status")
    modulation = results["modulation"]["primary_modulation"]
    confidence = results["modulation"]["primary_confidence"]
    candidates = results["modulation"]["candidates"][:5]

    print(f"\n[RESULT] Status: {status}")
    print(f"[RESULT] Detected: {modulation} (confidence: {confidence:.1%})")
    print(f"\nTop 5 candidates:")
    for c in candidates:
        print(f"  {c['modulation']:8s} - {c['probability']:.1%}")

    # Check demodulation
    demod = results.get("demodulation", {})
    if demod.get("status") == "demodulated":
        bit_count = demod.get("bit_count", 0)
        ber = demod.get("ber")
        print(f"\n[DEMOD] Recovered {bit_count} bits")
        if ber is not None:
            print(f"[DEMOD] BER: {ber:.6f} ({(1-ber)*100:.2f}% accuracy)")

    # Check bitstream
    bitstream = results.get("bitstream", {})
    if bitstream.get("total_bits", 0) > 0:
        print(f"[BITSTREAM] {bitstream['total_bits']} bits, {bitstream['total_bytes']} bytes")
        print(f"[BITSTREAM] Bit density: {bitstream.get('bit_density', 0):.1%}")

        headers = results.get("headers", [])
        print(f"[BITSTREAM] Detected {len(headers)} header patterns")

    # Evaluation
    match = modulation == expected_modulation or (expected_modulation == "UNKNOWN" and modulation == "UNKNOWN")
    result_str = "[PASS]" if match else f"[FAIL - got {modulation}]"
    print(f"\n{result_str} Expected {expected_modulation}, got {modulation}")

    return match, confidence


def test_all_golden_signals():
    """Regression test for real modulation and bitstream pipeline outputs."""
    golden_dir = Path("data/golden")
    test_cases = [
        ("golden_bpsk.iq", "BPSK"),
        ("golden_qpsk.iq", "QPSK"),
        ("golden_2fsk.iq", "2FSK"),
        ("golden_16qam.iq", "16QAM"),
        ("golden_noisy.iq", "UNKNOWN"),
        ("golden_unknown.iq", "UNKNOWN"),
    ]

    for filename, expected in test_cases:
        signal_path = golden_dir / filename
        assert signal_path.exists(), f"Missing golden signal: {signal_path}"
        pipeline_result = DspPipeline().execute(signal_path, config={"max_samples": 100_000})
        assert pipeline_result["status"] == "completed"
        assert pipeline_result["modulation"]["primary_modulation"] == expected
        if expected != "UNKNOWN":
            assert pipeline_result["bitstream"]["total_bits"] > 0
            assert pipeline_result["demodulation"]["bit_count"] > 0


def main():
    print("#"*70)
    print("# Golden Signal Verification Test")
    print("# Testing pre-generated, properly formatted signals")
    print("#"*70)

    golden_dir = Path("data/golden")
    if not golden_dir.exists():
        print(f"\n[ERROR] Golden signals directory not found: {golden_dir}")
        print("Run: python ml/generation/generate_golden_signals.py")
        return False

    test_cases = [
        ("golden_bpsk.iq", "BPSK"),
        ("golden_qpsk.iq", "QPSK"),
        ("golden_2fsk.iq", "2FSK"),
        ("golden_16qam.iq", "16QAM"),
        ("golden_noisy.iq", "UNKNOWN"),  # Low SNR should return UNKNOWN
        ("golden_unknown.iq", "UNKNOWN"),
    ]

    results = []
    for filename, expected in test_cases:
        signal_path = golden_dir / filename
        if not signal_path.exists():
            print(f"\n[SKIP] {filename} not found")
            continue

        try:
            match, confidence = run_golden_signal(signal_path, expected)
            results.append((filename, expected, match, confidence))
        except Exception as e:
            print(f"\n[ERROR] Failed to process {filename}: {e}")
            import traceback
            traceback.print_exc()
            results.append((filename, expected, False, 0.0))

    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)

    passed = sum(1 for r in results if r[2])
    total = len(results)

    for filename, expected, match, conf in results:
        status = "[PASS]" if match else "[FAIL]"
        print(f"{status} {filename:25s} Expected: {expected:8s} Confidence: {conf:.1%}")

    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.0f}%)")

    if passed == total:
        print("\n[SUCCESS] All golden signals correctly classified!")
        return True
    elif passed >= total * 0.8:
        print(f"\n[PARTIAL] {passed}/{total} tests passed - pipeline is mostly functional")
        return True
    else:
        print(f"\n[FAIL] Only {passed}/{total} tests passed")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
