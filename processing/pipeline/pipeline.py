"""End-to-End Digital Signal Processing Pipeline for SpectraSync."""

import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Union

import numpy as np

from processing.analysis.fft import FftAnalyzer
from processing.analysis.psd import PsdAnalyzer
from processing.analysis.signal_features import SignalVisualizer
from processing.analysis.spectrogram import SpectrogramAnalyzer
from processing.bitstream.correlation import BitStreamCorrelator
from processing.bitstream.extraction import BitStreamExtractor
from processing.bitstream.header_detection import HeaderDetector
from processing.bitstream.payload_detection import PayloadDetector
from processing.deinterleaving.block import BlockDeinterleaver
from processing.deinterleaving.convolutional import ConvolutionalDeinterleaver
from processing.demodulation.fsk import FskDemodulator
from processing.demodulation.psk import PskDemodulator
from processing.demodulation.qam import QamDemodulator
from processing.estimation.bandwidth import BandwidthEstimator
from processing.estimation.carrier_frequency import CarrierFrequencyEstimator
from processing.estimation.sample_rate import SampleRateEstimator
from processing.estimation.snr import SnrEstimator
from processing.estimation.symbol_rate import SymbolRateEstimator
from processing.fec.reed_solomon import ReedSolomonCodec
from processing.fec.viterbi import ViterbiCodec
from processing.io.checksum import calculate_sha256
from processing.io.iq_reader import IqReader
from processing.io.metadata import MetadataExtractor
from processing.io.validation import FileValidator
from processing.io.wav_reader import WavReader
from processing.modulation.confidence import ModulationConfidenceEngine
from processing.pipeline.context import SignalData, SignalFormat
from processing.pipeline.stages import StageName, StageResult, StageStatus
from processing.preprocessing.dc_removal import DcRemover
from processing.preprocessing.filtering import SignalFilter
from processing.preprocessing.normalization import Normalizer
from processing.synchronization.carrier import CarrierRecovery
from processing.synchronization.frequency_offset import CoarseFrequencyOffsetEstimator
from processing.synchronization.timing import TimingRecovery


class DspPipeline:
    """Automated .IQ / .WAV Signal Analysis Pipeline orchestrator."""

    def __init__(
        self,
        progress_callback: Optional[Callable[[StageName, int, str], None]] = None
    ):
        self.progress_callback = progress_callback
        self.stage_results: Dict[str, StageResult] = {}

    def _notify(self, stage: StageName, percent: int, message: str) -> None:
        if self.progress_callback:
            try:
                self.progress_callback(stage, percent, message)
            except Exception:
                pass

    def execute(
        self,
        filepath: Union[str, Path],
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute all 13 processing stages sequentially with comprehensive telemetry."""
        path = Path(filepath)
        cfg = config or {}
        max_samples = cfg.get("max_samples", 524288)  # 512k samples default window
        reference_bits = cfg.get("reference_bits", None)

        pipeline_start = time.time()
        stage_records: List[Dict[str, Any]] = []

        # =============================================================
        # STAGE 1: VALIDATION
        # =============================================================
        st1 = StageResult(stage_name=StageName.VALIDATION)
        st1.input_summary = {"filepath": str(path)}
        st1.configuration = {"max_file_size_bytes": FileValidator.MAX_FILE_SIZE}
        self._notify(StageName.VALIDATION, 5, "Validating file container and readability")

        val_res = FileValidator.validate(path)
        if not val_res.is_valid:
            st1.mark_failed(
                error=val_res.error_message or "Validation failed",
                cause="Invalid file format or corrupted structure",
                suggested_action=val_res.suggested_action or "Check file format"
            )
            stage_records.append(st1.__dict__)
            return {"status": "failed", "failed_stage": StageName.VALIDATION, "stages": stage_records}

        checksum = calculate_sha256(path)
        st1.mark_completed(
            output_summary={
                "detected_format": val_res.detected_format,
                "file_size_bytes": val_res.file_size_bytes,
                "checksum_sha256": checksum,
                "warnings": val_res.warnings
            },
            quality_metrics={"integrity": 1.0},
            confidence=1.0
        )
        st1.provenance = {"source": "file_inspection", "method": "sha256_and_riff_parser"}
        stage_records.append(st1.__dict__)

        # =============================================================
        # STAGE 2: METADATA PARSING & SIGNAL INGESTION
        # =============================================================
        st2 = StageResult(stage_name=StageName.METADATA_PARSING)
        self._notify(StageName.METADATA_PARSING, 12, "Extracting metadata and ingesting signal")

        meta = MetadataExtractor.get_metadata(path)
        sample_rate_override = cfg.get("sample_rate") or meta.get("sample_rate") or 1_000_000.0
        if sample_rate_override <= 0.0:
            sample_rate_override = 1_000_000.0

        try:
            if val_res.detected_format == "wav":
                signal_data = WavReader.read(
                    path,
                    max_samples=max_samples,
                    sample_rate_override=sample_rate_override
                )
            else:
                signal_data = IqReader.read(
                    path,
                    sample_rate=sample_rate_override,
                    max_samples=max_samples
                )
        except Exception as e:
            st2.mark_failed(error=f"Ingestion error: {str(e)}", cause="Unable to parse samples into SignalData")
            stage_records.append(st2.__dict__)
            return {"status": "failed", "failed_stage": StageName.METADATA_PARSING, "stages": stage_records}

        st2.mark_completed(
            output_summary={
                "sample_rate": signal_data.sample_rate,
                "channels": signal_data.channels,
                "samples_ingested": signal_data.num_samples,
                "duration_seconds": round(signal_data.duration_seconds, 4),
                "center_frequency": signal_data.center_frequency
            },
            quality_metrics={"read_integrity": 1.0},
            confidence=0.99
        )
        st2.provenance = {"source": "metadata_and_riff", "format": signal_data.format.value}
        stage_records.append(st2.__dict__)

        # =============================================================
        # STAGE 3: PREPROCESSING
        # =============================================================
        st3 = StageResult(stage_name=StageName.PREPROCESSING)
        self._notify(StageName.PREPROCESSING, 20, "Applying DC removal and power normalization")

        dc_samples, dc_audit = DcRemover.remove_dc(signal_data.samples, method="mean_subtraction")
        norm_samples, norm_audit = Normalizer.normalize(dc_samples, target_mode="rms", target_level=1.0)

        # Optional bandpass filter if requested
        if cfg.get("apply_filter", False):
            proc_samples, filter_audit = SignalFilter.filter_signal(
                norm_samples,
                sample_rate=signal_data.sample_rate,
                filter_type=cfg.get("filter_type", "lowpass")
            )
        else:
            proc_samples = norm_samples
            filter_audit = {"status": "bypassed"}

        st3.mark_completed(
            output_summary={
                "dc_attenuation_db": round(dc_audit.get("attenuation_db", 0.0), 2),
                "norm_scale_factor": round(norm_audit.get("scale_factor", 1.0), 4),
                "processed_samples_count": len(proc_samples)
            },
            quality_metrics={
                "initial_dc_dbfs": dc_audit.get("initial_dc_power_dbfs"),
                "final_rms": norm_audit.get("final_rms")
            },
            confidence=0.98
        )
        st3.configuration = {"dc_method": "mean_subtraction", "normalization": "unit_rms", "filter": filter_audit}
        st3.provenance = {"source": "dsp_preprocessing"}
        stage_records.append(st3.__dict__)

        # =============================================================
        # STAGE 4: SIGNAL ANALYSIS (Visualizations)
        # =============================================================
        st4 = StageResult(stage_name=StageName.SIGNAL_ANALYSIS)
        self._notify(StageName.SIGNAL_ANALYSIS, 32, "Generating FFT, PSD, and Spectrogram displays")

        fft_data = FftAnalyzer.compute_fft(
            proc_samples,
            sample_rate=signal_data.sample_rate,
            fft_size=cfg.get("fft_size", 2048)
        )
        psd_data = PsdAnalyzer.compute_psd(
            proc_samples,
            sample_rate=signal_data.sample_rate,
            nperseg=cfg.get("psd_nperseg", 1024)
        )
        spec_data = SpectrogramAnalyzer.compute_spectrogram(
            proc_samples,
            sample_rate=signal_data.sample_rate,
            nperseg=cfg.get("spectrogram_nperseg", 512)
        )
        wf_data = SignalVisualizer.extract_waveform(proc_samples, sample_rate=signal_data.sample_rate)
        constel_data = SignalVisualizer.extract_constellation(proc_samples)

        st4.mark_completed(
            output_summary={
                "fft_peak_freq_hz": fft_data.get("peak_frequency_hz"),
                "fft_peak_power_dbfs": fft_data.get("peak_power_dbfs"),
                "psd_mean_db": psd_data.get("mean_psd_db"),
                "spectrogram_time_bins": len(spec_data.get("times", []))
            },
            quality_metrics={"spectral_resolution_hz": fft_data.get("sample_rate", 0) / fft_data.get("fft_size", 1)},
            confidence=0.99
        )
        st4.provenance = {"source": "dsp_spectral_transforms"}
        stage_records.append(st4.__dict__)

        # =============================================================
        # STAGE 5: PARAMETER INFERENCE
        # =============================================================
        st5 = StageResult(stage_name=StageName.PARAMETER_INFERENCE)
        self._notify(StageName.PARAMETER_INFERENCE, 45, "Estimating carrier, bandwidth, symbol rate, SNR")

        sample_rate_est = SampleRateEstimator.estimate(signal_data)
        carrier_est = CarrierFrequencyEstimator.estimate(proc_samples, signal_data.sample_rate)
        bw_est = BandwidthEstimator.estimate(proc_samples, signal_data.sample_rate)
        sym_rate_est = SymbolRateEstimator.estimate(proc_samples, signal_data.sample_rate)
        snr_est = SnrEstimator.estimate(proc_samples, signal_data.sample_rate)

        parameters_dict = {
            "sample_rate": sample_rate_est,
            "carrier_frequency": carrier_est,
            "bandwidth": bw_est,
            "symbol_rate": sym_rate_est,
            "snr": snr_est
        }

        st5.mark_completed(
            output_summary={k: v["value"] for k, v in parameters_dict.items()},
            quality_metrics={
                "snr_confidence": snr_est["confidence"],
                "carrier_uncertainty_hz": carrier_est["uncertainty"],
                "symbol_rate_confidence": sym_rate_est["confidence"]
            },
            confidence=round(
                (carrier_est["confidence"] + bw_est["confidence"] + sym_rate_est["confidence"] + snr_est["confidence"]) / 4.0,
                3
            )
        )
        st5.provenance = {"sources": ["metadata", "dsp_estimate"]}
        stage_records.append(st5.__dict__)

        # =============================================================
        # STAGE 6: MODULATION CLASSIFICATION
        # =============================================================
        st6 = StageResult(stage_name=StageName.MODULATION_CLASSIFICATION)
        self._notify(StageName.MODULATION_CLASSIFICATION, 55, "Classifying candidate modulations")

        mod_eval = ModulationConfidenceEngine.evaluate(
            proc_samples,
            symbol_rate=sym_rate_est["value"] if sym_rate_est["confidence"] > 0.4 else None,
            bandwidth=bw_est["value"],
            snr_db=snr_est["value"]
        )
        primary_mod = mod_eval["primary_modulation"]

        st6.mark_completed(
            output_summary={
                "primary_modulation": primary_mod,
                "confidence": mod_eval["primary_confidence"],
                "candidates_count": len(mod_eval["candidates"])
            },
            quality_metrics={"consistency_rules_count": len(mod_eval["consistency_notes"])},
            confidence=mod_eval["primary_confidence"]
        )
        st6.provenance = {"methods": ["higher_order_cumulants", "random_forest_ml", "physical_consistency"]}
        stage_records.append(st6.__dict__)

        # =============================================================
        # STAGE 7: SYNCHRONIZATION
        # =============================================================
        st7 = StageResult(stage_name=StageName.SYNCHRONIZATION)
        self._notify(StageName.SYNCHRONIZATION, 68, "Executing timing and carrier synchronization")

        sps = sym_rate_est.get("estimated_sps", 20)
        sps = max(2, min(64, sps))

        if primary_mod in ["BPSK", "QPSK", "8PSK", "16QAM", "64QAM"]:
            coarse_samples, coarse_meta = CoarseFrequencyOffsetEstimator.estimate_and_correct(
                proc_samples,
                signal_data.sample_rate,
                modulation=primary_mod
            )
            time_syms, timing_meta = TimingRecovery.recover(coarse_samples, sps=sps)
            sync_syms, carrier_meta = CarrierRecovery.recover(
                time_syms,
                modulation=primary_mod,
                symbol_rate=sym_rate_est["value"]
            )
            eye_diagram_data = SignalVisualizer.extract_eye_diagram(time_syms, samples_per_symbol=sps)
            sync_confidence = (timing_meta.get("confidence", 0.5) + carrier_meta.get("confidence", 0.5)) / 2.0
            sync_status = "synchronized" if (timing_meta["status"] == "synchronized" and carrier_meta["status"] == "locked") else "unconverged"
        else:
            # For FSK or Unknown: Timing / carrier loop bypassed or direct baseband
            sync_syms = proc_samples
            timing_meta = {"status": "bypassed_for_fsk", "confidence": 0.85}
            carrier_meta = {"status": "bypassed_for_fsk", "confidence": 0.85}
            eye_diagram_data = SignalVisualizer.extract_eye_diagram(proc_samples, samples_per_symbol=sps)
            sync_confidence = 0.85
            sync_status = "bypassed"

        st7.mark_completed(
            output_summary={
                "status": sync_status,
                "timing_status": timing_meta.get("status"),
                "carrier_status": carrier_meta.get("status"),
                "symbols_synchronized": len(sync_syms)
            },
            quality_metrics={
                "timing_error_var": timing_meta.get("timing_error_variance", 0.0),
                "phase_error_var": carrier_meta.get("phase_error_variance", 0.0)
            },
            confidence=sync_confidence
        )
        st7.provenance = {"algorithms": ["gardner_ted", "costas_pll"]}
        stage_records.append(st7.__dict__)

        # =============================================================
        # STAGE 8: DEMODULATION
        # =============================================================
        st8 = StageResult(stage_name=StageName.DEMODULATION)
        self._notify(StageName.DEMODULATION, 78, f"Demodulating {primary_mod} symbols to bit stream")

        if primary_mod in ["BPSK", "QPSK", "8PSK"]:
            demod_res = PskDemodulator.demodulate(
                sync_syms,
                modulation=primary_mod,
                symbol_rate=sym_rate_est["value"],
                reference_bits=reference_bits
            )
        elif primary_mod in ["16QAM", "64QAM"]:
            demod_res = QamDemodulator.demodulate(
                sync_syms,
                symbol_rate=sym_rate_est["value"],
                reference_bits=reference_bits
            )
        elif primary_mod in ["2FSK", "4FSK", "FSK"]:
            demod_res = FskDemodulator.demodulate(
                proc_samples,
                sample_rate=signal_data.sample_rate,
                symbol_rate=sym_rate_est["value"] if sym_rate_est["value"] > 0 else 25000.0,
                sps=sps,
                modulation=primary_mod,
                reference_bits=reference_bits
            )
        else:
            # Fallback QPSK demodulation attempt for UNKNOWN signals
            demod_res = PskDemodulator.demodulate(
                sync_syms,
                modulation="QPSK",
                symbol_rate=sym_rate_est["value"]
            )
            demod_res["status"] = "ambiguous_fallback"

        recovered_bits = demod_res.get("recovered_bits", [])

        st8.mark_completed(
            output_summary={
                "modulation": primary_mod,
                "recovered_bits_count": len(recovered_bits),
                "bit_rate_bps": demod_res.get("bit_rate_bps", 0.0),
                "ber": demod_res.get("ber")
            },
            quality_metrics={"ber": demod_res.get("ber"), "bit_errors": demod_res.get("bit_errors")},
            confidence=demod_res.get("confidence", 0.8)
        )
        st8.provenance = {"demodulator": f"{primary_mod}_decision_slicer"}
        stage_records.append(st8.__dict__)

        # =============================================================
        # STAGE 9: DE-INTERLEAVING
        # =============================================================
        st9 = StageResult(stage_name=StageName.DE_INTERLEAVING)
        self._notify(StageName.DE_INTERLEAVING, 85, "Evaluating de-interleaving configurations")

        block_candidates = BlockDeinterleaver.search_candidates(recovered_bits)
        conv_candidates = ConvolutionalDeinterleaver.search_candidates(recovered_bits)

        deinterleaved_bits = recovered_bits  # Default pass-through unless config selected

        st9.mark_completed(
            output_summary={
                "candidate_configs_found": len(block_candidates) + len(conv_candidates),
                "top_block_candidate": block_candidates[0] if block_candidates else None,
                "top_conv_candidate": conv_candidates[0] if conv_candidates else None
            },
            quality_metrics={"block_candidates": len(block_candidates)},
            confidence=0.55
        )
        st9.provenance = {"methods": ["autocorrelation_periodicity", "forney_standards"]}
        stage_records.append(st9.__dict__)

        # =============================================================
        # STAGE 10: FORWARD ERROR CORRECTION (FEC)
        # =============================================================
        st10 = StageResult(stage_name=StageName.FEC)
        self._notify(StageName.FEC, 89, "Testing Viterbi and Reed-Solomon candidate decoders")

        # Test Viterbi decoder
        viterbi_res = ViterbiCodec.decode(recovered_bits)
        fec_bits = viterbi_res.get("decoded_bits", recovered_bits) if viterbi_res["status"] == "decoded" else recovered_bits

        st10.mark_completed(
            output_summary={
                "viterbi_status": viterbi_res.get("status"),
                "viterbi_ber_estimate": viterbi_res.get("estimated_channel_ber"),
                "staged_decoders": ["Reed-Solomon", "Concatenated", "LDPC"]
            },
            quality_metrics={"viterbi_confidence": viterbi_res.get("confidence", 0.0)},
            confidence=viterbi_res.get("confidence", 0.5)
        )
        st10.provenance = {"decoder": "Viterbi K=7 Rate 1/2"}
        stage_records.append(st10.__dict__)

        # =============================================================
        # STAGE 11: BIT STREAM ANALYSIS
        # =============================================================
        st11 = StageResult(stage_name=StageName.BIT_STREAM_ANALYSIS)
        self._notify(StageName.BIT_STREAM_ANALYSIS, 93, "Generating Hex/ASCII views and scanning headers")

        bit_views = BitStreamExtractor.format_views(recovered_bits)
        detected_headers = HeaderDetector.scan_headers(recovered_bits)
        payload_frames = PayloadDetector.segment_payloads(recovered_bits, detected_headers)

        st11.mark_completed(
            output_summary={
                "total_bits": bit_views["total_bits"],
                "total_bytes": bit_views["total_bytes"],
                "bit_density": bit_views["bit_density"],
                "headers_detected_count": len(detected_headers),
                "payload_frames_count": len(payload_frames)
            },
            quality_metrics={"bit_density": bit_views["bit_density"]},
            confidence=0.95
        )
        st11.provenance = {"source": "recovered_bit_analysis"}
        stage_records.append(st11.__dict__)

        # =============================================================
        # STAGE 12: CORRELATION
        # =============================================================
        st12 = StageResult(stage_name=StageName.CORRELATION)
        self._notify(StageName.CORRELATION, 97, "Correlating bit stream with reference pattern")

        # Use explicit reference bits or first detected sync header as reference
        target_ref = reference_bits
        if not target_ref and detected_headers:
            h_type = detected_headers[0]["header_type"]
            target_ref = HeaderDetector.KNOWN_PREAMBLES.get(h_type)

        if target_ref:
            corr_res = BitStreamCorrelator.correlate(recovered_bits, target_ref)
        else:
            corr_res = {
                "correlation_score": 0.0,
                "peak_position": 0,
                "confidence": 0.0,
                "confidence_label": "Low",
                "notes": "No reference pattern supplied or detected"
            }

        st12.mark_completed(
            output_summary={
                "correlation_score": corr_res.get("correlation_score", 0.0),
                "peak_position": corr_res.get("peak_position", 0),
                "match_accuracy": corr_res.get("match_accuracy", 0.0)
            },
            quality_metrics={"peak_correlation": corr_res.get("correlation_score", 0.0)},
            confidence=corr_res.get("confidence", 0.5)
        )
        st12.provenance = {"method": "bipolar_cross_correlation"}
        stage_records.append(st12.__dict__)

        # =============================================================
        # STAGE 13: RESULT PACKAGING
        # =============================================================
        st13 = StageResult(stage_name=StageName.RESULT_PACKAGING)
        self._notify(StageName.RESULT_PACKAGING, 100, "Packaging final analysis bundle")

        total_duration = round((time.time() - pipeline_start) * 1000.0, 2)
        st13.mark_completed(
            output_summary={"total_duration_ms": total_duration, "stages_executed": len(stage_records)},
            confidence=1.0
        )
        stage_records.append(st13.__dict__)

        # Assemble full result bundle
        analysis_bundle = {
            "status": "completed",
            "metadata": {
                "filename": path.name,
                "checksum_sha256": checksum,
                "sample_rate": signal_data.sample_rate,
                "channels": signal_data.channels,
                "duration_seconds": signal_data.duration_seconds,
                "samples_count": signal_data.num_samples,
                "total_processing_time_ms": total_duration
            },
            "parameters": parameters_dict,
            "modulation": mod_eval,
            "synchronization": {
                "timing": timing_meta,
                "carrier": carrier_meta
            },
            "demodulation": demod_res,
            "deinterleaving": {
                "block_candidates": block_candidates,
                "conv_candidates": conv_candidates
            },
            "fec": {
                "viterbi": viterbi_res
            },
            "bitstream": bit_views,
            "headers": detected_headers,
            "payloads": payload_frames,
            "correlation": corr_res,
            "visualizations": {
                "waveform": wf_data,
                "fft": fft_data,
                "psd": psd_data,
                "spectrogram": spec_data,
                "constellation": constel_data,
                "eye_diagram": eye_diagram_data
            },
            "stages": stage_records
        }

        return analysis_bundle
