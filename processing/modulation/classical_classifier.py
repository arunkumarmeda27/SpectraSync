"""Classical rule-based decision tree for modulation classification using Higher-Order Cumulants."""

from typing import Dict, List, Tuple, Any
from processing.modulation.features import ModulationFeatureExtractor


class ClassicalModulationClassifier:
    """Decision-tree baseline modulation classifier based on theoretical cumulant boundaries."""

    @classmethod
    def classify(cls, features: Dict[str, float]) -> List[Dict[str, Any]]:
        """Return candidate modulation types ranked by heuristic score."""
        abs_c20 = features.get("abs_c20", 0.0)
        abs_c40 = features.get("abs_c40", 0.0)
        abs_c42 = features.get("abs_c42", 0.0)
        c42_signed = features.get("c42_signed", 0.0)
        var_env = features.get("var_env", 0.0)
        sigma_af = features.get("sigma_af", 0.0)

        candidates: List[Tuple[str, float, str]] = []

        # 1. BPSK Check: Large |C20| (~0.7-1.0) and large |C40| (~1.2-2.0)
        if abs_c20 > 0.45 and abs_c40 > 0.8:
            score = min(0.96, 0.5 + 0.3 * abs_c20 + 0.2 * min(abs_c40 / 2.0, 1.0))
            candidates.append(
                (
                    "BPSK",
                    score,
                    "High |C20| and large |C40| consistent with antipodal BPSK",
                )
            )
        else:
            candidates.append(("BPSK", max(0.05, 0.4 * abs_c20), "Low |C20|"))

        # 2. QPSK Check: Small |C20| (<0.35) and significant |C40| (~0.6-1.2) with constant/near-constant modulus
        if abs_c20 < 0.4 and 0.4 <= abs_c40 <= 1.4 and abs_c42 > 0.6:
            score = min(0.95, 0.6 + 0.3 * (1.0 - abs_c20) * min(abs_c40, 1.0))
            candidates.append(
                (
                    "QPSK",
                    score,
                    "Low |C20|, moderate |C40|, and high |C42| matches 4-phase constellation",
                )
            )
        else:
            candidates.append(
                ("QPSK", 0.15, "Cumulant pattern outside typical QPSK boundaries")
            )

        # 3. 8-PSK Check: Small |C20|, very small |C40| (<0.4), and |C42| ~ 1.0
        if abs_c20 < 0.25 and abs_c40 < 0.35 and abs_c42 > 0.7:
            score = 0.85
            candidates.append(
                (
                    "8-PSK",
                    score,
                    "Suppressed |C20| and |C40| with unit |C42| indicates 8-PSK",
                )
            )
        else:
            candidates.append(
                ("8-PSK", 0.10, "Non-zero |C40| weakens 8-PSK hypothesis")
            )

        # 4. 16-QAM Check: Multi-amplitude signal. var_env > 0.12, |C42| between 0.5 and 0.85, moderate |C40|
        if var_env > 0.10 and 0.4 <= abs_c42 <= 0.9 and abs_c20 < 0.4:
            score = min(0.92, 0.5 + 2.0 * min(var_env, 0.2) + 0.2 * abs_c42)
            candidates.append(
                (
                    "16-QAM",
                    score,
                    "Multi-level amplitude variance and C42 kurtosis matches rectangular 16-QAM",
                )
            )
        else:
            candidates.append(
                (
                    "16-QAM",
                    max(0.05, var_env * 0.8),
                    "Envelope variance too low for multi-amplitude QAM",
                )
            )

        # 5. 64-QAM Check: Higher amplitude variance and smaller C42
        if var_env > 0.18 and 0.35 <= abs_c42 <= 0.75:
            score = 0.75
            candidates.append(
                (
                    "64-QAM",
                    score,
                    "Substantial amplitude variation consistent with dense QAM grid",
                )
            )
        else:
            candidates.append(("64-QAM", 0.05, "Low likelihood"))

        # 6. 2-FSK / 4-FSK Check: Very low envelope variance, distinct frequency variance
        if var_env < 0.08 and sigma_af > 0.02:
            score = min(0.94, 0.6 + 2.0 * (0.08 - var_env) + 2.0 * min(sigma_af, 0.1))
            candidates.append(
                (
                    "2-FSK",
                    score,
                    "Constant envelope with distinct frequency modulation profile",
                )
            )
            candidates.append(
                ("4-FSK", score * 0.85, "Constant envelope multi-tone FSK candidate")
            )
        else:
            candidates.append(
                ("2-FSK", 0.08, "Envelope variance indicates amplitude modulation")
            )
            candidates.append(
                ("4-FSK", 0.05, "Envelope variance indicates amplitude modulation")
            )

        # Sort candidates descending
        candidates.sort(key=lambda x: x[1], reverse=True)

        return [
            {
                "modulation": cand[0],
                "confidence": round(cand[1], 3),
                "reasoning": cand[2],
                "method": "classical_cumulants",
            }
            for cand in candidates
        ]
