"""Machine learning modulation classifier utilizing trained Random Forest model."""

from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np

from processing.modulation.features import ModulationFeatureExtractor

DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "models" / "modulation_rf.joblib"


class MlModulationClassifier:
    """Predicts candidate modulations using trained scikit-learn ensemble model."""

    _cached_model_data: Optional[Dict[str, Any]] = None

    @classmethod
    def load_model(cls, model_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
        path = model_path or DEFAULT_MODEL_PATH
        if cls._cached_model_data is not None:
            return cls._cached_model_data

        if path.is_file():
            try:
                cls._cached_model_data = joblib.load(path)
                return cls._cached_model_data
            except Exception as e:
                print(f"Warning: Failed to load ML model from {path}: {e}")
                return None
        return None

    @classmethod
    def classify(
        cls,
        features: Dict[str, float],
        model_path: Optional[Path] = None
    ) -> List[Dict[str, Any]]:
        """Predict modulation candidates with probabilities from feature dictionary."""
        model_data = cls.load_model(model_path)

        if not model_data or "model" not in model_data:
            return [
                {
                    "modulation": "UNKNOWN",
                    "confidence": 0.0,
                    "reasoning": "ML model artifact not yet available or failed to load",
                    "method": "ml_unavailable"
                }
            ]

        clf = model_data["model"]
        classes = model_data["classes"]
        feature_keys = model_data["feature_keys"]

        x_vec = np.array([[features.get(k, 0.0) for k in feature_keys]], dtype=np.float32)

        try:
            probs = clf.predict_proba(x_vec)[0]
        except Exception:
            return [
                {
                    "modulation": "UNKNOWN",
                    "confidence": 0.0,
                    "reasoning": "ML prediction exception",
                    "method": "ml_error"
                }
            ]

        candidates = []
        for class_name, prob in zip(classes, probs):
            candidates.append({
                "modulation": str(class_name),
                "confidence": round(float(prob), 4),
                "reasoning": f"ML Random Forest ensemble confidence: {float(prob):.1%}",
                "method": "ml_random_forest"
            })

        candidates.sort(key=lambda x: x["confidence"], reverse=True)
        return candidates
