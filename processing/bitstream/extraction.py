"""Bit stream representation generators (Binary, Hex Dump, ASCII) and statistical metrics."""

from typing import Any, Dict, List
import numpy as np


class BitStreamExtractor:
    """Formats recovered bits into binary, hex dump, and ASCII views with density metrics."""

    @classmethod
    def format_views(
        cls,
        bits: List[int],
        bytes_per_row: int = 16,
        max_bytes: int = 4096
    ) -> Dict[str, Any]:
        """Generate binary, formatted hex dump, and ASCII strings with offsets."""
        if not bits:
            return {
                "total_bits": 0,
                "total_bytes": 0,
                "binary_preview": "",
                "hex_dump": [],
                "ascii_preview": "",
                "bit_density": 0.0,
                "transition_density": 0.0
            }

        bits_arr = np.array(bits, dtype=np.uint8)
        total_bits = len(bits_arr)

        # Statistical metrics
        ones_count = int(np.sum(bits_arr))
        bit_density = round(ones_count / total_bits, 4) if total_bits > 0 else 0.0

        # Transition density: how often bit changes state
        if total_bits > 1:
            transitions = int(np.sum(bits_arr[1:] != bits_arr[:-1]))
            trans_density = round(transitions / (total_bits - 1), 4)
        else:
            trans_density = 0.0

        # Pack into bytes
        raw_bytes = np.packbits(bits_arr).tobytes()
        total_bytes = len(raw_bytes)

        # Slice for display
        display_bytes = raw_bytes[:max_bytes]

        # Hex dump table
        hex_dump_rows = []
        for offset in range(0, len(display_bytes), bytes_per_row):
            chunk = display_bytes[offset : offset + bytes_per_row]
            hex_part = " ".join(f"{b:02X}" for b in chunk)
            # Pad hex part to fixed column width
            hex_part = f"{hex_part:<{bytes_per_row * 3}}"

            # ASCII part
            ascii_part = "".join(chr(b) if 32 <= b <= 126 else "." for b in chunk)

            hex_dump_rows.append({
                "offset": f"{offset:08X}",
                "hex": hex_part.strip(),
                "ascii": ascii_part
            })

        # Binary preview: first 256 bits grouped in 8-bit octets
        preview_bits = bits[:256]
        octets = ["".join(map(str, preview_bits[i:i+8])) for i in range(0, len(preview_bits), 8)]
        binary_preview = " ".join(octets)

        # Full ASCII preview
        ascii_full = "".join(chr(b) if 32 <= b <= 126 else "." for b in display_bytes)

        return {
            "total_bits": total_bits,
            "total_bytes": total_bytes,
            "ones_count": ones_count,
            "zeros_count": total_bits - ones_count,
            "bit_density": bit_density,
            "transition_density": trans_density,
            "binary_preview": binary_preview,
            "hex_dump": hex_dump_rows,
            "ascii_preview": ascii_full[:500]
        }
