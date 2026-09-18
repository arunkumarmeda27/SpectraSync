"""Script to train and export scikit-learn modulation classifier model."""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

from ml.generation.generator import SyntheticSignalGenerator
from processing.modulation.features import ModulationFeatureExtractor


def train_and_save_model(model_path: Path) -> None:
    """Generate training dataset of RF features and train Random Forest classifier."""
    print("Generating synthetic modulation dataset for ML classifier training...")
    gen = SyntheticSignalGenerator(sample_rate=1_000_000.0, seed=42)

    modulations = ["BPSK", "QPSK", "8PSK", "2FSK", "4FSK", "16QAM"]
    snr_range = [8.0, 14.0, 20.0, 26.0, 32.0]
    freq_offsets = [-8000.0, -2000.0, 0.0, 3500.0, 7500.0]

    X: list = []
    y: list = []

    feature_keys = [
        "abs_c20", "abs_c40", "abs_c41", "abs_c42",
        "c42_signed", "var_env", "gamma_max",
        "sigma_dp", "sigma_af", "spectral_symmetry"
    ]

    for mod in modulations:
        for snr in snr_range:
            for f_off in freq_offsets:
                for rep in range(8):  # Multiple realizations with different random bits
                    iq, _ = gen.generate(
                        modulation=mod,
                        num_payload_symbols=1500,
                        symbol_rate=50_000.0 if mod != "2FSK" else 25_000.0,
                        carrier_offset_hz=f_off,
                        snr_db=snr
                    )
                    feats = ModulationFeatureExtractor.extract_features(iq)
                    feat_vector = [feats[k] for k in feature_keys]
                    X.append(feat_vector)
                    y.append(mod)

    # Add UNKNOWN class (colored Gaussian noise and unmodulated tones)
    rng = np.random.default_rng(1234)
    for snr in snr_range:
        for rep in range(15):
            noise = rng.normal(0, 1.0, 30000) + 1j * rng.normal(0, 1.0, 30000)
            feats = ModulationFeatureExtractor.extract_features(noise)
            feat_vector = [feats[k] for k in feature_keys]
            X.append(feat_vector)
            y.append("UNKNOWN")

    X_arr = np.array(X, dtype=np.float32)
    y_arr = np.array(y)

    print(f"Dataset generated: {len(X_arr)} samples across {len(set(y_arr))} classes.")

    X_train, X_test, y_train, y_test = train_test_split(
        X_arr, y_arr, test_size=0.2, random_state=42, stratify=y_arr
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("\nModel Evaluation Results:")
    print(classification_report(y_test, y_pred))

    model_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "model": clf,
        "classes": clf.classes_.tolist(),
        "feature_keys": feature_keys,
        "version": "1.0.0",
        "description": "Random Forest trained on Higher-Order Cumulants and envelope statistics"
    }
    joblib.dump(payload, model_path)
    print(f"Trained model saved to {model_path}")


if __name__ == "__main__":
    out_file = PROJECT_ROOT / "ml" / "models" / "modulation_rf.joblib"
    train_and_save_model(out_file)
