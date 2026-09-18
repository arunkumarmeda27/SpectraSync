"""Payload boundary detection and packet segmentation."""

from typing import Any, Dict, List
from processing.bitstream.header_detection import HeaderDetector


class PayloadDetector:
    """Estimates payload boundaries based on detected sync markers and frame lengths."""

    @classmethod
    def segment_payloads(
        cls,
        bits: List[int],
        headers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify candidate payload frames between detected sync markers."""
        if not headers or len(bits) < 16:
            return []

        frames = []
        total_bits = len(bits)

        for i in range(len(headers)):
            curr_h = headers[i]
            payload_start = curr_h["bit_offset"] + curr_h["pattern_length"]

            if i + 1 < len(headers):
                next_h = headers[i + 1]
                payload_end = next_h["bit_offset"]
            else:
                payload_end = total_bits

            payload_len = max(0, payload_end - payload_start)

            if payload_len > 0:
                payload_bits = bits[payload_start:payload_end]
                frames.append({
                    "frame_index": i + 1,
                    "header_type": curr_h["header_type"],
                    "header_offset": curr_h["bit_offset"],
                    "payload_start_bit": payload_start,
                    "payload_end_bit": payload_end,
                    "payload_bits_count": payload_len,
                    "payload_bytes_count": payload_len // 8,
                    "confidence": curr_h["confidence"]
                })

        return frames
