"""Standard RF sync word and packet header detection."""

from typing import Any, Dict, List
import numpy as np
from processing.bitstream.pattern_search import PatternSearcher


class HeaderDetector:
    """Detects standard preambles and packet headers in recovered bit streams."""

    KNOWN_PREAMBLES = {
        "Barker-7": [1, 1, 1, 0, 0, 1, 0],
        "Barker-11": [1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0],
        "Barker-13": [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1],
        "CCSDS-32": [
            0, 0, 0, 1, 1, 0, 1, 0,
            1, 1, 0, 0, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 0, 0,
            0, 0, 0, 1, 1, 1, 0, 1
        ],
        "AX.25-Flag (0x7E)": [0, 1, 1, 1, 1, 1, 1, 0],
        "Ethernet-SFD (0xD5)": [1, 1, 0, 1, 0, 1, 0, 1],
        "Sync-AA55": [1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1]
    }

    @classmethod
    def scan_headers(
        cls,
        bits: List[int],
        max_errors: int = 1,
        max_scan_bits: int = 65536,
        max_matches_per_header: int = 32
    ) -> List[Dict[str, Any]]:
        """Scan bit stream for all known standard headers and frame markers."""
        detected = []
        scan_bits = bits[:max_scan_bits]

        for name, pattern in cls.KNOWN_PREAMBLES.items():
            matches = PatternSearcher.search_pattern(
                scan_bits,
                pattern,
                max_errors=max_errors
            )[:max_matches_per_header]
            for m in matches:
                detected.append({
                    "header_type": name,
                    "bit_offset": m["bit_offset"],
                    "byte_offset": m["byte_offset"],
                    "pattern_length": m["length"],
                    "errors": m["errors"],
                    "confidence": m["confidence"],
                    "confidence_label": "High" if m["confidence"] > 0.85 else "Medium"
                })

        # Sort by offset then confidence
        detected.sort(key=lambda x: (x["bit_offset"], -x["confidence"]))
        return detected
