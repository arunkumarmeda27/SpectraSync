"""Physical consistency validation and ensemble confidence arbiter."""

from typing import Any, Dict, List, Optional
import numpy as np

from processing.modulation.classical_classifier import ClassicalModulationClassifier
from processing.modulation.features import ModulationFeatureExtractor
from processing.modulation.ml_classifier import MlModulationClassifier


class ModulationConfidenceEngine:
    """Ensembles classical DSP rules, ML probabilities, and physical consistency constraints."""

    @classmethod
    def evaluate(
        cls,
        samples: np.ndarray,
        symbol_rate: Optional[float] = None,
        bandwidth: Optional[float] = None,
        snr_db: Optional[float] = None
    ) -> Dict[str, Any]:
        """Produce ranked modulation candidates with physical consistency verification."""
        features = ModulationFeatureExtractor.extract_features(samples)
        classical_candidates = ClassicalModulationClassifier.classify(features)
        ml_candidates = MlModulationClassifier.classify(features)

        # Build candidate score map
        combined_scores: Dict[str, float] = {}
        candidate_classes = ["BPSK", "QPSK", "8PSK", "2FSK", "4FSK", "16QAM", "64QAM", "UNKNOWN"]

        for c in candidate_classes:
            combined_scores[c] = 0.0

        # Weights: 60% ML, 40% DSP classical
        has_ml = any(cand["method"] == "ml_random_forest" for cand in ml_candidates)
        w_ml = 0.60 if has_ml else 0.0
        w_dsp = 0.40 if has_ml else 1.0

        for cand in classical_candidates:
            m = cand["modulation"]
            if m in combined_scores:
                combined_scores[m] += w_dsp * cand["confidence"]

        if has_ml:
            for cand in ml_candidates:
                m = cand["modulation"]
                if m in combined_scores:
                    combined_scores[m] += w_ml * cand["confidence"]

        # -------------------------------------------------------------
        # Physical Consistency Validation
        # -------------------------------------------------------------
        consistency_notes = []
        var_env = features.get("var_env", 0.0)

        # Rule 1: Constant envelope check
        if var_env < 0.04:
            # Physically incompatible with multi-amplitude QAM
            combined_scores["16QAM"] *= 0.05
            combined_scores["64QAM"] *= 0.01
            consistency_notes.append("Constant envelope detected: QAM candidates heavily penalized.")

        # Rule 2: Bandwidth vs Symbol rate consistency
        if symbol_rate and bandwidth and symbol_rate > 0 and bandwidth > 0:
            bw_sym_ratio = bandwidth / symbol_rate
            if bw_sym_ratio < 0.8:
                # Under-Nyquist: severe filtering or incorrect symbol rate
                consistency_notes.append(f"Bandwidth/Symbol rate ratio ({bw_sym_ratio:.2f}) is below Nyquist minimum.")
            elif bw_sym_ratio > 4.0:
                # Wideband: favors FSK or spread spectrum
                combined_scores["2FSK"] *= 1.2
                combined_scores["4FSK"] *= 1.2
                consistency_notes.append(f"Wide occupied bandwidth ratio ({bw_sym_ratio:.2f}) favors FSK over PSK.")

        # Rule 3: Low SNR degradation
        if snr_db is not None and snr_db < 4.0:
            combined_scores["8PSK"] *= 0.2
            combined_scores["16QAM"] *= 0.1
            combined_scores["64QAM"] *= 0.05
            combined_scores["UNKNOWN"] += 0.45
            consistency_notes.append(f"Low SNR ({snr_db:.1f} dB) induces severe ambiguity; UNKNOWN elevated.")

        # If max score is too low, promote UNKNOWN
        max_score = max(combined_scores.values()) if combined_scores else 0.0
        if max_score < 0.35:
            combined_scores["UNKNOWN"] = max(combined_scores.get("UNKNOWN", 0.0), 0.70)
            consistency_notes.append("No modulation hypothesis met minimal confidence threshold (UNKNOWN).")

        # Normalize probabilities across candidates
        total_score = sum(combined_scores.values()) + 1e-12
        ranked_candidates = []
        for mod, score in combined_scores.items():
            norm_prob = round(float(score / total_score), 4)
            if norm_prob > 0.01:
                ranked_candidates.append({
                    "modulation": mod,
                    "probability": norm_prob,
                    "confidence_percentage": round(norm_prob * 100.0, 1)
                })

        ranked_candidates.sort(key=lambda x: x["probability"], reverse=True)
        primary = ranked_candidates[0] if ranked_candidates else {"modulation": "UNKNOWN", "probability": 1.0}

        return {
            "primary_modulation": primary["modulation"],
            "primary_confidence": primary["probability"],
            "candidates": ranked_candidates,
            "features": features,
            "consistency_notes": consistency_notes,
            "classical_candidates": classical_candidates[:3],
            "ml_candidates": ml_candidates[:3] if has_ml else []
        }
