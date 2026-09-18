"""Time-domain waveform, constellation scatter, eye diagram, and waterfall trace extractors."""

from typing import Any, Dict, List, Optional
import numpy as np


class SignalVisualizer:
    """Generates downsampled payloads optimized for UI charts."""

    @staticmethod
    def extract_waveform(
        samples: np.ndarray,
        sample_rate: float,
        max_points: int = 2000
    ) -> Dict[str, Any]:
        """Extract time-domain I and Q waveforms downsampled for fast charting."""
        n = len(samples)
        if n == 0:
            return {"time": [], "i_samples": [], "q_samples": []}

        step = max(1, n // max_points)
        indices = np.arange(0, n, step)
        t = indices / sample_rate
        sub_samples = samples[indices]

        return {
            "time": [round(float(ti), 6) for ti in t],
            "i_samples": [round(float(s.real), 4) for s in sub_samples],
            "q_samples": [round(float(s.imag), 4) for s in sub_samples],
            "total_samples": n,
            "sample_rate": sample_rate
        }

    @staticmethod
    def extract_constellation(
        samples: np.ndarray,
        max_points: int = 1500
    ) -> Dict[str, Any]:
        """Subsample I/Q points for 2D constellation scatter plot."""
        n = len(samples)
        if n == 0:
            return {"i": [], "q": []}

        # Take points from steady-state middle section
        start_idx = min(n // 10, n)
        end_idx = max(start_idx + 1, n - n // 10)
        sliced = samples[start_idx:end_idx]

        step = max(1, len(sliced) // max_points)
        sub = sliced[::step][:max_points]

        return {
            "i": [round(float(pt.real), 4) for pt in sub],
            "q": [round(float(pt.imag), 4) for pt in sub],
            "num_points": len(sub)
        }

    @staticmethod
    def extract_eye_diagram(
        samples: np.ndarray,
        samples_per_symbol: int = 16,
        num_traces: int = 30
    ) -> Dict[str, Any]:
        """Fold baseband I/Q signal over 2 symbol periods to form an eye diagram."""
        if len(samples) == 0 or samples_per_symbol < 2:
            return {"traces_i": [], "traces_q": [], "time_axis": []}

        trace_len = samples_per_symbol * 2
        total_traces = len(samples) // trace_len
        if total_traces == 0:
            return {"traces_i": [], "traces_q": [], "time_axis": []}

        # Select evenly spaced traces
        step = max(1, total_traces // num_traces)
        traces_i: List[List[float]] = []
        traces_q: List[List[float]] = []

        for trace_idx in range(0, total_traces, step):
            if len(traces_i) >= num_traces:
                break
            offset = trace_idx * trace_len
            chunk = samples[offset:offset + trace_len]
            if len(chunk) == trace_len:
                traces_i.append([round(float(v.real), 4) for v in chunk])
                traces_q.append([round(float(v.imag), 4) for v in chunk])

        time_axis = [round(float(i / samples_per_symbol), 3) for i in range(trace_len)]

        return {
            "traces_i": traces_i,
            "traces_q": traces_q,
            "time_axis": time_axis,
            "samples_per_symbol": samples_per_symbol,
            "num_traces": len(traces_i)
        }
