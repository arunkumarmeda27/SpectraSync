"""CLI script to generate golden verification signals and demo vectors."""

import sys
from pathlib import Path
from datetime import datetime

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from ml.generation.generator import SyntheticSignalGenerator


def generate_all_golden_signals(output_dir: Path) -> None:
    """Generate canonical test vectors for BPSK, QPSK, 2-FSK, 16-QAM, Noisy, and Unknown signals."""
    output_dir.mkdir(parents=True, exist_ok=True)
    gen = SyntheticSignalGenerator(sample_rate=1_000_000.0, seed=1337)

    configs = [
        {
            "name": "golden_bpsk",
            "modulation": "BPSK",
            "symbol_rate": 50_000.0,
            "carrier_offset_hz": 5_000.0,
            "snr_db": 22.0,
            "num_symbols": 2000,
            "preamble": "barker11"
        },
        {
            "name": "golden_qpsk",
            "modulation": "QPSK",
            "symbol_rate": 50_000.0,
            "carrier_offset_hz": 2_400.0,
            "snr_db": 24.0,
            "num_symbols": 2500,
            "preamble": "ccsds32"
        },
        {
            "name": "golden_2fsk",
            "modulation": "2FSK",
            "symbol_rate": 25_000.0,
            "carrier_offset_hz": 1_000.0,
            "snr_db": 20.0,
            "num_symbols": 2000,
            "preamble": "barker11"
        },
        {
            "name": "golden_16qam",
            "modulation": "16QAM",
            "symbol_rate": 40_000.0,
            "carrier_offset_hz": 0.0,
            "snr_db": 28.0,
            "num_symbols": 2000,
            "preamble": "barker13"
        },
        {
            "name": "golden_noisy",
            "modulation": "QPSK",
            "symbol_rate": 50_000.0,
            "carrier_offset_hz": 15_000.0,
            "snr_db": 2.0,  # Very low SNR to test unknown/ambiguous fallback
            "num_symbols": 1500,
            "preamble": "barker11"
        }
    ]

    for cfg in configs:
        print(f"Generating {cfg['name']} ({cfg['modulation']})...")
        iq, meta = gen.generate(
            modulation=cfg["modulation"],
            num_payload_symbols=cfg["num_symbols"],
            symbol_rate=cfg["symbol_rate"],
            carrier_offset_hz=cfg["carrier_offset_hz"],
            snr_db=cfg["snr_db"],
            preamble=cfg["preamble"]
        )
        meta.creation_timestamp = datetime.now().isoformat()

        iq_path = output_dir / f"{cfg['name']}.iq"
        wav_path = output_dir / f"{cfg['name']}.wav"
        json_path = output_dir / f"{cfg['name']}.json"

        gen.save_iq(iq_path, iq)
        gen.save_wav(wav_path, iq, sample_rate=meta.sample_rate)
        gen.save_metadata(json_path, meta)
        print(f"  -> Saved {iq_path.name} ({len(iq)} samples, {iq_path.stat().st_size} bytes)")
        print(f"  -> Saved {wav_path.name} ({wav_path.stat().st_size} bytes)")

    # Also generate an "Unknown" synthetic signal (colored gaussian noise + random tone bursts)
    print("Generating golden_unknown...")
    num_samples = 50_000
    rng = np.random.default_rng(999)
    noise = rng.normal(0, 1.0, num_samples) + 1j * rng.normal(0, 1.0, num_samples)
    # Filter noise to make it colored
    b, a = [0.2, 0.5, 0.2], [1.0]
    from scipy.signal import lfilter
    unknown_iq = lfilter(b, a, noise).astype(np.complex64)

    iq_path = output_dir / "golden_unknown.iq"
    wav_path = output_dir / "golden_unknown.wav"
    json_path = output_dir / "golden_unknown.json"

    SyntheticSignalGenerator.save_iq(iq_path, unknown_iq)
    SyntheticSignalGenerator.save_wav(wav_path, unknown_iq, sample_rate=1_000_000.0)

    import json
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({
            "modulation": "UNKNOWN",
            "sample_rate": 1_000_000.0,
            "symbol_rate": 0.0,
            "snr_db": 0.0,
            "num_samples": num_samples,
            "notes": "Filtered noise / unmodulated spectrum for ambiguity testing"
        }, f, indent=2)

    print(f"  -> Saved {iq_path.name} and {wav_path.name}")
    print("All golden signals successfully created!")


if __name__ == "__main__":
    out = PROJECT_ROOT / "data" / "golden"
    generate_all_golden_signals(out)
