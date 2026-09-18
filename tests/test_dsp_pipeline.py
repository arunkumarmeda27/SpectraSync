"""Unit tests for SpectraSync DSP modules."""

import numpy as np
import pytest

from processing.io.checksum import calculate_sha256
from processing.io.validation import FileValidator
from processing.preprocessing.dc_removal import DcRemover
from processing.preprocessing.normalization import Normalizer
from processing.preprocessing.filtering import SignalFilter
from processing.estimation.carrier_frequency import CarrierFrequencyEstimator
from processing.estimation.bandwidth import BandwidthEstimator
from processing.estimation.symbol_rate import SymbolRateEstimator
from processing.estimation.snr import SnrEstimator
from processing.modulation.features import ModulationFeatureExtractor
from processing.demodulation.psk import PskDemodulator
from processing.demodulation.fsk import FskDemodulator
from processing.demodulation.qam import QamDemodulator
from processing.fec.viterbi import ViterbiCodec
from processing.fec.reed_solomon import ReedSolomonCodec
from processing.bitstream.extraction import BitStreamExtractor
from processing.bitstream.header_detection import HeaderDetector
from processing.bitstream.correlation import BitStreamCorrelator


def test_dc_removal():
    t = np.linspace(0, 1, 1000, endpoint=False)
    sig = np.exp(2j * np.pi * 50 * t) + (5.0 + 3.0j)  # Large DC offset
    cleaned, config = DcRemover.remove_dc(sig, method="mean_subtraction")
    assert np.abs(np.mean(cleaned)) < 1e-10
    assert config["operation"] == "dc_removal"


def test_normalization():
    sig = (np.random.randn(1000) + 1j * np.random.randn(1000)) * 50.0
    rms_sig, rms_cfg = Normalizer.normalize(sig, target_mode="rms", target_level=1.0)
    actual_power = np.mean(np.abs(rms_sig) ** 2)
    assert np.isclose(actual_power, 1.0, atol=1e-2)

    peak_sig, peak_cfg = Normalizer.normalize(sig, target_mode="peak", target_level=1.0)
    assert np.max(np.abs(peak_sig)) <= 1.0 + 1e-6


def test_filtering():
    fs = 10000.0
    t = np.arange(2000) / fs
    # 500 Hz carrier + 4000 Hz noise
    sig = np.exp(2j * np.pi * 500 * t) + 0.5 * np.exp(2j * np.pi * 4000 * t)
    filtered, f_cfg = SignalFilter.filter_signal(sig, sample_rate=fs, filter_type="lowpass", cutoff_high=1000.0)
    assert len(filtered) == len(sig)
    assert np.mean(np.abs(filtered) ** 2) < np.mean(np.abs(sig) ** 2)


def test_carrier_frequency_estimation():
    fs = 100000.0
    fc = 15000.0
    t = np.arange(10000) / fs
    sig = np.exp(2j * np.pi * fc * t)
    res = CarrierFrequencyEstimator.estimate(sig, sample_rate=fs)
    assert res["value"] is not None
    assert np.isclose(res["value"], fc, atol=fs / 8192 * 2)
    assert res["confidence"] >= 0.7


def test_bandwidth_estimation():
    fs = 100000.0
    t = np.arange(10000) / fs
    noise = (np.random.randn(10000) + 1j * np.random.randn(10000))
    band_sig, _ = SignalFilter.filter_signal(noise, sample_rate=fs, filter_type="lowpass", cutoff_high=10000.0)
    res = BandwidthEstimator.estimate(band_sig, sample_rate=fs)
    assert res["value"] is not None
    assert res["value"] > 5000.0


def test_snr_estimation():
    t = np.arange(10000)
    signal = np.exp(2j * np.pi * 0.1 * t)
    clean_res = SnrEstimator.estimate(signal, sample_rate=100000.0)
    assert clean_res["value"] > 10.0

    noisy = signal + (np.random.randn(10000) + 1j * np.random.randn(10000)) * 0.7
    noisy_res = SnrEstimator.estimate(noisy, sample_rate=100000.0)
    assert noisy_res["value"] < clean_res["value"]


def test_cumulants_feature_extraction():
    # Generate constant modulus QPSK-like points
    symbols = np.array([1+1j, 1-1j, -1+1j, -1-1j]) / np.sqrt(2)
    indices = np.random.randint(0, 4, 5000)
    samples = symbols[indices]
    features = ModulationFeatureExtractor.extract_features(samples)
    assert "abs_c20" in features
    assert "abs_c40" in features
    assert "abs_c42" in features
    assert "gamma_max" in features
    assert features["abs_c20"] < 0.2


def test_psk_demodulator():
    qpsk_symbols = np.array([
        (1 + 1j) / np.sqrt(2),
        (-1 + 1j) / np.sqrt(2),
        (-1 - 1j) / np.sqrt(2),
        (1 - 1j) / np.sqrt(2)
    ])
    res = PskDemodulator.demodulate(qpsk_symbols, modulation="QPSK")
    bits = res["recovered_bits"]
    assert len(bits) == 8  # 4 symbols * 2 bits/symbol


def test_qam_demodulator():
    grid = [-3, -1, 1, 3]
    points = []
    for i in grid:
        for q in grid:
            points.append(complex(i, q))
    points = np.array(points) / np.sqrt(10)
    res = QamDemodulator.demodulate(points)
    bits = res["recovered_bits"]
    assert len(bits) == 16 * 4  # 16 symbols * 4 bits/symbol


def test_fsk_demodulator():
    fs = 40000.0
    symbol_rate = 2000.0
    sps = int(fs / symbol_rate)
    f0 = 5000.0
    f1 = 9000.0

    t_sym = np.arange(sps) / fs
    sig_chunks = []
    for sym in [0, 1, 0, 1, 1, 0]:
        f = f1 if sym == 1 else f0
        sig_chunks.append(np.exp(2j * np.pi * f * t_sym))
    sig = np.concatenate(sig_chunks)

    res = FskDemodulator.demodulate(sig, sample_rate=fs, symbol_rate=symbol_rate, sps=sps, modulation="2FSK")
    assert "recovered_bits" in res
    assert len(res["recovered_bits"]) > 0


def test_viterbi_codec():
    msg_bits = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0]
    encoded = ViterbiCodec.encode(msg_bits)
    assert len(encoded) == len(msg_bits) * 2

    res = ViterbiCodec.decode(encoded)
    assert res["status"] == "decoded"
    decoded = res["decoded_bits"]
    assert decoded[:len(msg_bits) - 6] == msg_bits[:len(msg_bits) - 6]


def test_reed_solomon_codec():
    codec = ReedSolomonCodec(n=15, k=11)
    # Feed an arbitrary block of length 15
    block = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 0, 0, 0]
    corrected, err_count, success = codec.decode_block(block)
    assert len(corrected) == 11

    # Test decode_stream
    data = b"Hello world! This is a test message for Reed-Solomon." * 5
    res = ReedSolomonCodec.decode_stream(data, n=255, k=223)
    assert "status" in res


def test_bitstream_extractor():
    bits = [0, 1, 0, 0, 0, 0, 0, 1,  # 'A' = 0x41
            0, 1, 0, 0, 0, 0, 1, 0]  # 'B' = 0x42
    views = BitStreamExtractor.format_views(bits)
    assert views["total_bits"] == 16
    assert views["total_bytes"] == 2
    assert "41 42" in views["hex_dump"][0]["hex"]
    assert views["ascii_preview"] == "AB"


def test_header_detection():
    # Barker 11: 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0
    barker_11 = [1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0]
    stream = [0, 0, 1, 0] + barker_11 + [1, 0, 1, 1, 0, 0]
    matches = HeaderDetector.scan_headers(stream, max_errors=0)
    barker_matches = [m for m in matches if m["header_type"] == "Barker-11"]
    assert len(barker_matches) > 0
    assert barker_matches[0]["bit_offset"] == 4


def test_cross_correlator():
    pattern = [1, 0, 1, 1, 0, 0, 1, 1]
    stream = [0, 0, 0, 0] + pattern + [1, 1, 0, 0]
    res = BitStreamCorrelator.correlate(stream, pattern)
    assert res["peak_position"] == 4
    assert res["correlation_score"] == 1.0
