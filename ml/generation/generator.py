"""Signal generator for synthetic RF waveforms (BPSK, QPSK, 8-PSK, FSK, 16-QAM).

Generates deterministic baseband complex IQ waveforms with configurable:
- Symbol rate and sample rate (samples per symbol)
- Known sync preambles (Barker, CCSDS, AX.25) and payload bits
- Root-Raised Cosine (RRC) pulse shaping
- Carrier frequency offsets
- Fractional timing offsets
- Additive White Gaussian Noise (AWGN)
"""

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from scipy import signal


@dataclass
class SignalMetadata:
    modulation: str
    sample_rate: float
    symbol_rate: float
    samples_per_symbol: int
    carrier_offset: float
    snr_db: float
    timing_offset_samples: float
    num_symbols: int
    num_samples: int
    preamble_bits: List[int]
    payload_bits: List[int]
    total_bits_hex: str
    preamble_name: str
    sync_marker_bit_offset: int
    creation_timestamp: str = ""


class SyntheticSignalGenerator:
    """Generates synthetic modulated IQ signals for golden testing and demonstration."""

    # Well-known RF sync preambles
    PREAMBLES = {
        "barker11": [1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0],
        "barker13": [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1],
        "ccsds32": [
            0, 0, 0, 1, 1, 0, 1, 0,  # 0x1A
            1, 1, 0, 0, 1, 1, 1, 1,  # 0xCF
            1, 1, 1, 1, 1, 1, 0, 0,  # 0xFC
            0, 0, 0, 1, 1, 1, 0, 1   # 0x1D
        ],
        "ax25_flag": [0, 1, 1, 1, 1, 1, 1, 0] # 0x7E
    }

    def __init__(self, sample_rate: float = 1_000_000.0, seed: Optional[int] = 42):
        self.sample_rate = sample_rate
        self.rng = np.random.default_rng(seed)

    def _rrc_filter(self, num_taps: int, alpha: float, sps: int) -> np.ndarray:
        """Design a Root-Raised Cosine (RRC) pulse shaping filter."""
        t = np.arange(-num_taps // 2, num_taps // 2 + 1) / sps
        h = np.zeros(len(t), dtype=np.float64)

        for i, ti in enumerate(t):
            if np.isclose(ti, 0.0):
                h[i] = 1.0 - alpha + (4.0 * alpha / np.pi)
            elif np.isclose(np.abs(ti), 1.0 / (4.0 * alpha)):
                h[i] = (alpha / np.sqrt(2.0)) * (
                    ((1.0 + 2.0 / np.pi) * np.sin(np.pi / (4.0 * alpha)))
                    + ((1.0 - 2.0 / np.pi) * np.cos(np.pi / (4.0 * alpha)))
                )
            else:
                numerator = np.sin(np.pi * ti * (1.0 - alpha)) + 4.0 * alpha * ti * np.cos(np.pi * ti * (1.0 + alpha))
                denominator = np.pi * ti * (1.0 - (4.0 * alpha * ti) ** 2)
                h[i] = numerator / denominator

        # Energy normalize filter
        h = h / np.sqrt(np.sum(h**2))
        return h

    def _add_awgn(self, iq: np.ndarray, snr_db: float) -> np.ndarray:
        """Add complex Additive White Gaussian Noise for specified SNR."""
        if snr_db >= 100.0:
            return iq  # Effectively noiseless
        sig_power = np.mean(np.abs(iq) ** 2)
        snr_linear = 10.0 ** (snr_db / 10.0)
        noise_power = sig_power / snr_linear
        noise = (self.rng.normal(0, np.sqrt(noise_power / 2.0), len(iq)) +
                 1j * self.rng.normal(0, np.sqrt(noise_power / 2.0), len(iq)))
        return iq + noise

    def _apply_offsets(
        self,
        iq: np.ndarray,
        freq_offset_hz: float,
        timing_offset_samples: float
    ) -> np.ndarray:
        """Apply carrier frequency offset and fractional delay."""
        n = len(iq)
        t = np.arange(n) / self.sample_rate

        # Frequency shift: exp(j * 2 * pi * f_off * t)
        if abs(freq_offset_hz) > 1e-3:
            iq = iq * np.exp(1j * 2 * np.pi * freq_offset_hz * t)

        # Fractional timing offset using polyphase/sinc interpolation
        if abs(timing_offset_samples) > 1e-3:
            # Sinc filter kernel
            k = np.arange(-16, 17)
            sinc_kernel = np.sinc(k - timing_offset_samples)
            sinc_kernel = sinc_kernel * np.hamming(len(sinc_kernel))
            sinc_kernel /= np.sum(sinc_kernel)
            iq_real = signal.convolve(iq.real, sinc_kernel, mode='same')
            iq_imag = signal.convolve(iq.imag, sinc_kernel, mode='same')
            iq = iq_real + 1j * iq_imag

        return iq

    def generate(
        self,
        modulation: str = "QPSK",
        num_payload_symbols: int = 1000,
        symbol_rate: float = 50_000.0,
        carrier_offset_hz: float = 0.0,
        timing_offset_samples: float = 0.0,
        snr_db: float = 25.0,
        preamble: str = "barker11",
        rrc_alpha: float = 0.35,
        fsk_deviation_hz: float = 12_500.0
    ) -> Tuple[np.ndarray, SignalMetadata]:
        """Generate modulated complex IQ samples and metadata."""
        modulation = modulation.upper()
        sps = int(round(self.sample_rate / symbol_rate))
        if sps < 2:
            raise ValueError(f"Sample rate {self.sample_rate} must be at least 2x symbol rate {symbol_rate}")

        preamble_bits = self.PREAMBLES.get(preamble, self.PREAMBLES["barker11"]).copy()

        # Determine bits per symbol
        if modulation in ["BPSK", "2FSK", "FSK"]:
            bps = 1
        elif modulation in ["QPSK", "4FSK"]:
            bps = 2
        elif modulation == "8PSK":
            bps = 3
        elif modulation == "16QAM":
            bps = 4
        else:
            bps = 2

        # Pad preamble to multiple of bps
        remainder = len(preamble_bits) % bps
        if remainder != 0:
            preamble_bits.extend([0] * (bps - remainder))

        num_payload_bits = num_payload_symbols * bps
        payload_bits = self.rng.integers(0, 2, size=num_payload_bits).tolist()

        all_bits = preamble_bits + payload_bits
        total_symbols = len(all_bits) // bps

        # Map bits to symbols
        bits_array = np.array(all_bits, dtype=np.uint8)

        if modulation == "BPSK":
            # 0 -> +1, 1 -> -1
            symbols = 1.0 - 2.0 * bits_array.astype(np.float64)
            symbols = symbols.astype(np.complex128)

        elif modulation == "QPSK":
            # 2 bits per symbol, Gray mapped
            # 00 -> (1 + 1j)/sqrt(2), 01 -> (-1 + 1j)/sqrt(2), 11 -> (-1 - 1j)/sqrt(2), 10 -> (1 - 1j)/sqrt(2)
            b0 = bits_array[0::2]
            b1 = bits_array[1::2]
            i_val = 1.0 - 2.0 * b0
            q_val = 1.0 - 2.0 * b1
            symbols = (i_val + 1j * q_val) / np.sqrt(2.0)

        elif modulation == "8PSK":
            # 3 bits per symbol, Gray mapped
            b = bits_array.reshape(-1, 3)
            # Gray code mapping to angle
            gray_map = {
                (0, 0, 0): 0,
                (0, 0, 1): 1,
                (0, 1, 1): 2,
                (0, 1, 0): 3,
                (1, 1, 0): 4,
                (1, 1, 1): 5,
                (1, 0, 1): 6,
                (1, 0, 0): 7
            }
            angles = np.array([gray_map[tuple(row)] * (2.0 * np.pi / 8.0) for row in b])
            symbols = np.exp(1j * angles)

        elif modulation == "16QAM":
            # 4 bits per symbol Gray mapped (b0 b1 for I, b2 b3 for Q)
            # 00 -> -3, 01 -> -1, 11 -> +1, 10 -> +3 (normalized)
            qam_map = {
                (0, 0): -3.0,
                (0, 1): -1.0,
                (1, 1): 1.0,
                (1, 0): 3.0
            }
            b = bits_array.reshape(-1, 4)
            i_parts = np.array([qam_map[(row[0], row[1])] for row in b])
            q_parts = np.array([qam_map[(row[2], row[3])] for row in b])
            # Average power of 16-QAM with coordinates +/-1, +/-3 is 10. Normalize by sqrt(10).
            symbols = (i_parts + 1j * q_parts) / np.sqrt(10.0)

        elif modulation in ["2FSK", "FSK"]:
            # Continuous Phase Frequency Shift Keying (CPFSK)
            # 0 -> -f_dev, 1 -> +f_dev
            freq_dev = fsk_deviation_hz
            bit_seq = 1.0 - 2.0 * bits_array.astype(np.float64) # -1 or +1
            # Upsample
            freq_waveform = np.repeat(bit_seq * freq_dev, sps)
            phase = 2.0 * np.pi * np.cumsum(freq_waveform) / self.sample_rate
            iq = np.exp(1j * phase)
            symbols = np.array([], dtype=np.complex128) # Not discrete constellation

        elif modulation == "4FSK":
            # 4-ary FSK: 4 frequencies (-3, -1, +1, +3)*f_dev
            b = bits_array.reshape(-1, 2)
            fsk_map = {(0,0): -3.0, (0,1): -1.0, (1,1): 1.0, (1,0): 3.0}
            freq_levels = np.array([fsk_map[tuple(row)] for row in b])
            freq_dev = fsk_deviation_hz / 3.0
            freq_waveform = np.repeat(freq_levels * freq_dev, sps)
            phase = 2.0 * np.pi * np.cumsum(freq_waveform) / self.sample_rate
            iq = np.exp(1j * phase)
            symbols = np.array([], dtype=np.complex128)

        else:
            raise ValueError(f"Unsupported modulation type: {modulation}")

        # If PSK/QAM, perform pulse shaping
        if modulation not in ["2FSK", "FSK", "4FSK"]:
            # Upsample with zeros
            upsampled = np.zeros(len(symbols) * sps, dtype=np.complex128)
            upsampled[::sps] = symbols

            # RRC Filter
            rrc = self._rrc_filter(num_taps=11 * sps, alpha=rrc_alpha, sps=sps)
            iq = signal.convolve(upsampled, rrc, mode='same')

        # Apply carrier offset and fractional timing
        iq = self._apply_offsets(iq, carrier_offset_hz, timing_offset_samples)

        # Add AWGN noise
        iq = self._add_awgn(iq, snr_db)

        # Cast to standard complex64 for efficiency
        iq = iq.astype(np.complex64)

        # Pack bits into hex string for ground-truth reference
        byte_arr = np.packbits(bits_array)
        bits_hex = byte_arr.tobytes().hex()

        meta = SignalMetadata(
            modulation=modulation,
            sample_rate=self.sample_rate,
            symbol_rate=symbol_rate,
            samples_per_symbol=sps,
            carrier_offset=carrier_offset_hz,
            snr_db=snr_db,
            timing_offset_samples=timing_offset_samples,
            num_symbols=total_symbols,
            num_samples=len(iq),
            preamble_bits=preamble_bits,
            payload_bits=payload_bits,
            total_bits_hex=bits_hex,
            preamble_name=preamble,
            sync_marker_bit_offset=0
        )

        return iq, meta

    @staticmethod
    def save_iq(filepath: Path, iq: np.ndarray) -> None:
        """Save complex64 samples to raw .iq file."""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        iq.astype(np.complex64).tofile(str(filepath))

    @staticmethod
    def save_wav(filepath: Path, iq: np.ndarray, sample_rate: float) -> None:
        """Save complex IQ signal as stereo 16-bit PCM WAV (Channel 1: I, Channel 2: Q)."""
        import wave
        filepath.parent.mkdir(parents=True, exist_ok=True)
        # Normalize to +/- 1.0
        max_val = np.max(np.abs([iq.real, iq.imag]))
        if max_val > 0:
            scaled = (iq / max_val) * 0.95
        else:
            scaled = iq

        i_int = (scaled.real * 32767.0).astype(np.int16)
        q_int = (scaled.imag * 32767.0).astype(np.int16)

        # Interleave I and Q
        stereo = np.empty((len(iq), 2), dtype=np.int16)
        stereo[:, 0] = i_int
        stereo[:, 1] = q_int

        with wave.open(str(filepath), 'wb') as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2) # 16-bit
            wf.setframerate(int(sample_rate))
            wf.writeframes(stereo.tobytes())

    @staticmethod
    def save_metadata(filepath: Path, meta: SignalMetadata) -> None:
        """Save signal ground truth metadata as JSON."""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(asdict(meta), f, indent=2)
