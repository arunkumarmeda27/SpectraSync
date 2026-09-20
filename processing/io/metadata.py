"""Metadata extraction and sidecar JSON inspection for signal files."""

import json
import wave
from pathlib import Path
from typing import Any, Dict, Optional, Union


class MetadataExtractor:
    """Extracts hardware, recording, and sample metadata from WAV headers and sidecar files."""

    @staticmethod
    def extract_from_wav(filepath: Union[str, Path]) -> Dict[str, Any]:
        """Extract metadata from standard WAV RIFF chunks."""
        path = Path(filepath)
        metadata: Dict[str, Any] = {
            "format": "wav",
            "channels": 1,
            "sample_rate": 0.0,
            "bit_depth": 16,
            "num_samples": 0,
            "duration_seconds": 0.0,
            "is_stereo_iq": False,
        }

        try:
            with wave.open(str(path), "rb") as wf:
                channels = wf.getnchannels()
                sample_rate = float(wf.getframerate())
                sample_width = wf.getsampwidth()
                num_frames = wf.getnframes()

                metadata["channels"] = channels
                metadata["sample_rate"] = sample_rate
                metadata["bit_depth"] = sample_width * 8
                metadata["num_samples"] = num_frames
                metadata["duration_seconds"] = num_frames / sample_rate if sample_rate > 0 else 0.0
                metadata["is_stereo_iq"] = channels == 2
        except Exception as e:
            metadata["error"] = f"Failed to extract WAV metadata: {str(e)}"

        return metadata

    @staticmethod
    def extract_from_sidecar(filepath: Union[str, Path]) -> Optional[Dict[str, Any]]:
        """Look for an adjacent sidecar metadata JSON file or SigMF metadata."""
        path = Path(filepath)
        candidates = [
            path.with_suffix(".sigmf-meta"),
            Path(str(path).replace(".sigmf-data", ".sigmf-meta")),
            path.parent / f"{path.stem}.sigmf-meta",
            path.with_suffix(".json"),
            path.parent / f"{path.name}.json"
        ]

        for cand in candidates:
            if cand.is_file():
                try:
                    with open(cand, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if isinstance(data, dict):
                        return data
                except Exception:
                    pass
        return None

    @staticmethod
    def extract_from_sigmf(sigmf_meta: Dict[str, Any]) -> Dict[str, Any]:
        """Map standard SigMF v1.0 schema (global, captures, annotations) to SpectraSync metadata."""
        out: Dict[str, Any] = {"format": "sigmf", "is_stereo_iq": True}
        global_block = sigmf_meta.get("global", {})
        if "core:sample_rate" in global_block:
            out["sample_rate"] = float(global_block["core:sample_rate"])
        if "core:datatype" in global_block:
            out["datatype"] = str(global_block["core:datatype"])
        if "core:version" in global_block:
            out["sigmf_version"] = str(global_block["core:version"])
        if "core:description" in global_block:
            out["description"] = str(global_block["core:description"])

        captures = sigmf_meta.get("captures", [])
        if captures and isinstance(captures, list) and len(captures) > 0:
            cap0 = captures[0]
            if "core:frequency" in cap0:
                out["center_frequency"] = float(cap0["core:frequency"])
            if "core:datetime" in cap0:
                out["recording_timestamp"] = str(cap0["core:datetime"])

        return out

    @classmethod
    def get_metadata(cls, filepath: Union[str, Path]) -> Dict[str, Any]:
        """Extract combined metadata from file header, SigMF meta, or sidecar JSON."""
        path = Path(filepath)
        suffix = path.suffix.lower()

        if suffix == ".wav":
            meta = cls.extract_from_wav(path)
        else:
            fmt = "sigmf" if (suffix in [".sigmf", ".sigmf-data"] or path.name.endswith(".sigmf-data")) else "iq"
            meta = {
                "format": fmt,
                "channels": 2,
                "sample_rate": 1_000_000.0,  # Default nominal baseband 1 MHz
                "bit_depth": 32,     # Assuming float32 I, float32 Q
                "num_samples": path.stat().st_size // 8 if path.exists() else 0,
                "duration_seconds": 0.0,
                "is_stereo_iq": True
            }

        sidecar = cls.extract_from_sidecar(path)
        if sidecar:
            meta["sidecar"] = sidecar
            # Check for SigMF standard structures
            if "global" in sidecar or "captures" in sidecar:
                sigmf_fields = cls.extract_from_sigmf(sidecar)
                meta.update(sigmf_fields)

            # Direct sidecar keys override
            if "sample_rate" in sidecar:
                meta["sample_rate"] = float(sidecar["sample_rate"])
            if "center_frequency" in sidecar:
                meta["center_frequency"] = float(sidecar["center_frequency"])
            if "modulation" in sidecar:
                meta["ground_truth_modulation"] = sidecar["modulation"]

            if meta["sample_rate"] > 0 and meta["num_samples"] > 0:
                meta["duration_seconds"] = meta["num_samples"] / meta["sample_rate"]

        return meta
