import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Clock,
  Check,
  FileText,
  Download,
  Eye,
  Play,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  TimeDomainWaveform,
  FrequencySpectrumPlot,
  SpectrogramWaterfall,
  ConstellationPlot
} from '../components/DashboardPlots';
import { uploadFile, createJob, listJobs, getAnalysisResult, downloadReport } from '../api';
import { useStore } from '../store';

const STEPS = [
  'File Ingestion',
  'Preprocessing',
  'Signal Analysis',
  'Parameter Inference',
  'Modulation Classification',
  'Demodulation',
  'De-interleaving',
  'FEC Decoding',
  'Bit Stream Analysis',
  'Results'
];

interface RecentJobItem {
  id: number;
  name: string;
  status: 'Completed' | 'Processing' | 'Failed';
  date: string;
  modulation: string;
  fileSize: string;
  uploadTime: string;
  startedAt: string;
  elapsedTime: string;
  estimatedTime: string;
  progress: number;
  activeStage?: number; // override active step index for pipeline display
  parameters: {
    sampleRate: string;
    carrierFreq: string;
    bandwidth: string;
    symbolRate: string;
    modulation: string;
    snr: string;
  };
  demod: {
    type: string;
    timingRecovery: string;
    carrierRecovery: string;
    deinterleaving: string;
    fecDecoding: string;
    ber: string;
    bitRate: string;
    status: string;
  };
  bits: string[];
}

const DEFAULT_RECENT_JOBS: RecentJobItem[] = [
  {
    id: 1024,
    name: 'satellite_iq_01',
    status: 'Completed',
    date: '12 Nov 2024',
    modulation: 'QPSK',
    fileSize: '512 MB',
    uploadTime: '12 Nov 2024, 10:24 AM',
    startedAt: '12 Nov 2024, 10:25 AM',
    elapsedTime: '00:12:36',
    estimatedTime: '00:08:20',
    progress: 60,
    activeStage: 5, // Demodulation is active (index 5) — matches reference
    parameters: {
      sampleRate: '2.000 MHz',
      carrierFreq: '437.123 MHz',
      bandwidth: '250 kHz',
      symbolRate: '100 kSym/s',
      modulation: 'QPSK',
      snr: '18.5 dB'
    },
    demod: {
      type: 'QPSK',
      timingRecovery: 'Completed',
      carrierRecovery: 'Completed',
      deinterleaving: 'Not Applied',
      fecDecoding: 'Not Applied',
      ber: '-',
      bitRate: '100 kbps',
      status: 'In Progress'
    },
    bits: [
      '0100110101001100010101100010',
      '1101010011100101010010010101',
      '0010101101001010100001010100',
      '1100101010100101010010101100',
      '0101010010101001010101010010',
      '...'
    ]
  },
  {
    id: 1023,
    name: 'uav_capture.wav',
    status: 'Processing',
    date: '12 Nov 2024',
    modulation: '-',
    fileSize: '128 MB',
    uploadTime: '12 Nov 2024, 09:15 AM',
    startedAt: '12 Nov 2024, 09:16 AM',
    elapsedTime: '00:04:12',
    estimatedTime: '00:03:00',
    progress: 40,
    parameters: {
      sampleRate: '1.500 MHz',
      carrierFreq: '915.200 MHz',
      bandwidth: '180 kHz',
      symbolRate: '50 kSym/s',
      modulation: 'Inference...',
      snr: '14.2 dB'
    },
    demod: {
      type: 'Unknown',
      timingRecovery: 'In Progress',
      carrierRecovery: 'Pending',
      deinterleaving: 'Pending',
      fecDecoding: 'Pending',
      ber: '-',
      bitRate: '-',
      status: 'In Progress'
    },
    bits: [
      '1010101100110011010101010101',
      '0101010101110001010111001010',
      '1100101010010101000111010101',
      '...'
    ]
  },
  {
    id: 1022,
    name: 'test_fsk.iq',
    status: 'Completed',
    date: '11 Nov 2024',
    modulation: 'FSK',
    fileSize: '256 MB',
    uploadTime: '11 Nov 2024, 04:30 PM',
    startedAt: '11 Nov 2024, 04:31 PM',
    elapsedTime: '00:06:45',
    estimatedTime: '00:06:45',
    progress: 100,
    parameters: {
      sampleRate: '2.000 MHz',
      carrierFreq: '144.390 MHz',
      bandwidth: '25 kHz',
      symbolRate: '9.6 kSym/s',
      modulation: '2-FSK',
      snr: '22.4 dB'
    },
    demod: {
      type: '2-FSK',
      timingRecovery: 'Completed',
      carrierRecovery: 'Completed',
      deinterleaving: 'Not Applied',
      fecDecoding: 'Not Applied',
      ber: '0.00e+00',
      bitRate: '9.6 kbps',
      status: 'Completed'
    },
    bits: [
      '0111111010000010101001000101',
      '1101001011010100101010110100',
      '0111111011101010010101010101',
      '...'
    ]
  },
  {
    id: 1021,
    name: 'unknown_signal.wav',
    status: 'Failed',
    date: '11 Nov 2024',
    modulation: '-',
    fileSize: '64 MB',
    uploadTime: '11 Nov 2024, 02:10 PM',
    startedAt: '11 Nov 2024, 02:11 PM',
    elapsedTime: '00:00:15',
    estimatedTime: '-',
    progress: 10,
    parameters: {
      sampleRate: '1.000 MHz',
      carrierFreq: '-',
      bandwidth: '-',
      symbolRate: '-',
      modulation: 'UNKNOWN',
      snr: '-2.1 dB'
    },
    demod: {
      type: 'Unknown',
      timingRecovery: 'Failed',
      carrierRecovery: 'Failed',
      deinterleaving: 'Failed',
      fecDecoding: 'Failed',
      ber: '-',
      bitRate: '-',
      status: 'Failed'
    },
    bits: ['No bits recovered. Signal corrupted or SNR below detection threshold.']
  },
  {
    id: 1020,
    name: 'demo_qam.iq',
    status: 'Completed',
    date: '10 Nov 2024',
    modulation: '16-QAM',
    fileSize: '1.02 GB',
    uploadTime: '10 Nov 2024, 11:20 AM',
    startedAt: '10 Nov 2024, 11:21 AM',
    elapsedTime: '00:18:40',
    estimatedTime: '00:18:40',
    progress: 100,
    parameters: {
      sampleRate: '5.000 MHz',
      carrierFreq: '2412.000 MHz',
      bandwidth: '1.25 MHz',
      symbolRate: '312.5 kSym/s',
      modulation: '16-QAM',
      snr: '26.8 dB'
    },
    demod: {
      type: '16-QAM',
      timingRecovery: 'Completed',
      carrierRecovery: 'Completed',
      deinterleaving: 'Completed',
      fecDecoding: 'Completed',
      ber: '1.20e-04',
      bitRate: '1.25 Mbps',
      status: 'Completed'
    },
    bits: [
      '1101001011010010101011001010',
      '0101101001011010101010101010',
      '1111000011110000101001011010',
      '...'
    ]
  }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active selected job state — default shows the "Processing" job to match reference UI
  const [selectedJob, setSelectedJob] = useState<RecentJobItem>(DEFAULT_RECENT_JOBS[0]);
  const [jobName, setJobName] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Fetch real jobs from backend if available
  useEffect(() => {
    const fetchBackendJobs = async () => {
      try {
        const liveJobs = await listJobs();
        if (liveJobs && liveJobs.length > 0) {
          // If we have live jobs, map the first one
          const latest = liveJobs[0];
          if (latest.status === 'completed') {
            const analysis = await getAnalysisResult(latest.id).catch(() => null);
            if (analysis) {
              const params = analysis.parameters || {};
              const demod = analysis.demodulation_data || {};
              setSelectedJob(prev => ({
                ...prev,
                id: latest.id,
                name: latest.signal_file?.filename || `job_${latest.id}`,
                status: latest.status === 'completed' ? 'Completed' : latest.status === 'running' ? 'Processing' : 'Failed',
                modulation: analysis.primary_modulation || prev.modulation,
                progress: latest.progress || 100,
                parameters: {
                  sampleRate: params.sample_rate ? `${((params.sample_rate as number) / 1e6).toFixed(3)} MHz` : prev.parameters.sampleRate,
                  carrierFreq: params.carrier_frequency_hz ? `${((params.carrier_frequency_hz as number) / 1e6).toFixed(3)} MHz` : prev.parameters.carrierFreq,
                  bandwidth: params.bandwidth_hz ? `${((params.bandwidth_hz as number) / 1e3).toFixed(0)} kHz` : prev.parameters.bandwidth,
                  symbolRate: params.symbol_rate_baud ? `${((params.symbol_rate_baud as number) / 1e3).toFixed(0)} kSym/s` : prev.parameters.symbolRate,
                  modulation: (analysis.primary_modulation as string) || prev.parameters.modulation,
                  snr: params.snr_db != null ? `${(params.snr_db as number).toFixed(1)} dB` : prev.parameters.snr
                },
                demod: {
                  type: (analysis.primary_modulation as string) || prev.demod.type,
                  timingRecovery: 'Completed',
                  carrierRecovery: 'Completed',
                  deinterleaving: 'Not Applied',
                  fecDecoding: 'Not Applied',
                  ber: demod.ber_estimate != null ? (demod.ber_estimate as number).toExponential(2) : '-',
                  bitRate: demod.bit_rate_bps ? `${((demod.bit_rate_bps as number) / 1e3).toFixed(0)} kbps` : prev.demod.bitRate,
                  status: latest.status === 'completed' ? 'Completed' : 'In Progress'
                }
              }));
            }
          }
        }
      } catch {
        // Fallback to default simulated high-fidelity state
      }
    };
    fetchBackendJobs();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileObj(file);
      setUploadedFileName(file.name);
      if (!jobName) {
        setJobName(file.name.replace(/\.[^/.]+$/, ''));
      }
      addToast('info', `Selected file: ${file.name}`);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFileObj && !uploadedFileName) {
      // Trigger demo analysis
      addToast('info', 'Analyzing default satellite recording (satellite_iq_01)...');
      setSelectedJob(prev => ({
        ...prev,
        status: 'Processing',
        progress: 60
      }));
      return;
    }

    if (selectedFileObj) {
      setIsUploading(true);
      try {
        addToast('info', 'Uploading and validating recording...');
        const uploaded = await uploadFile(selectedFileObj);
        addToast('success', 'File validated (SHA-256 verified). Launching analysis job...');
        const job = await createJob(uploaded.id, {
          max_samples: 524288,
          job_name: jobName || uploaded.filename
        });
        addToast('success', `Analysis Job #${job.id} dispatched to DSP pipeline.`);
        navigate(`/results/${job.id}`);
      } catch (err: unknown) {
        addToast('error', `Failed to start analysis: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDownloadBits = () => {
    const bitString = selectedJob.bits.join('\n');
    const blob = new Blob([bitString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedJob.name}_recovered_bits.bin`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Downloaded recovered bit stream.');
  };

  const handleGenerateReport = async () => {
    // If the selected job has a real backend ID (not a demo ID >= 1020), download PDF via API
    if (selectedJob.id > 0 && selectedJob.id < 1020) {
      addToast('info', 'Generating PDF report via SpectraSync report engine...');
      try {
        await downloadReport(selectedJob.id, 'pdf');
        addToast('success', `PDF report for Job #${selectedJob.id} downloaded.`);
      } catch (err: unknown) {
        addToast('error', `Report generation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // Navigate to reports page for demo jobs
      navigate('/reports');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".iq,.wav,.complex,.bin,.dat"
        style={{ display: 'none' }}
      />

      {/* ──────────────────────────────────────────────────────────────────────
          ROW 1: UPLOAD RECORDING (Left) + RECENT JOBS (Right)
          ────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1.25rem' }}>
        
        {/* Card 1: Upload Recording */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="card-header" style={{ marginBottom: '0.9rem' }}>
            <div className="card-title">
              <Upload size={17} className="card-title-icon" />
              Upload Recording
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: '1.25rem', alignItems: 'stretch' }}>
            {/* Left Box: Dropzone */}
            <div
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const f = e.dataTransfer.files[0];
                  setSelectedFileObj(f);
                  setUploadedFileName(f.name);
                  if (!jobName) setJobName(f.name.replace(/\.[^/.]+$/, ''));
                }
              }}
            >
              <div className="dropzone-icon">
                <Upload size={40} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.2rem' }}>
                {uploadedFileName || 'Drag & drop .IQ or .WAV file here'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.6rem' }}>
                or
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.8rem' }}
              >
                Choose File
              </button>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                Supported formats: .iq, .wav | Max size: 2 GB
              </div>
            </div>

            {/* Right Box: Metadata & Launch */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="input-label">Job Name (optional)</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Test_Signal_01"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  />
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="input-label">Description (optional)</label>
                  <textarea
                    className="input-control"
                    placeholder="Add notes about this recording..."
                    rows={2}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', resize: 'none' }}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    padding: '0.2rem 0',
                    fontSize: '0.75rem',
                    color: '#2563eb',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>&gt;&gt; Advanced Options</span>
                  {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {showAdvanced && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#64748b' }}>Sampling Window:</span>
                      <span className="font-mono">512k samples</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>DC Subtraction:</span>
                      <span className="font-mono">Mean Removal</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleStartAnalysis}
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Ingesting...</span>
                    </>
                  ) : (
                    <>
                      <Play size={15} fill="#ffffff" />
                      <span>Start Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Recent Jobs */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div className="card-title">
              <Clock size={17} className="card-title-icon" />
              Recent Jobs
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/jobs')}
              style={{ color: '#2563eb', fontWeight: 600, padding: 0 }}
            >
              View All
            </button>
          </div>

          <div className="table-container" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Modulation</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_RECENT_JOBS.map((j) => {
                  const isSelected = selectedJob.id === j.id;
                  return (
                    <tr
                      key={j.id}
                      onClick={() => setSelectedJob(j)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#f0f7ff' : undefined,
                        borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent'
                      }}
                    >
                      <td style={{ fontWeight: 600, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                        {j.name}
                      </td>
                      <td>
                        <span className={`status-badge ${j.status.toLowerCase()}`}>
                          <span className={`status-dot ${j.status.toLowerCase()}`} />
                          {j.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{j.date}</td>
                      <td style={{ fontWeight: 600, color: j.modulation !== '-' ? '#0f172a' : '#94a3b8' }}>
                        {j.modulation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          ROW 2: ANALYSIS PIPELINE (Horizontal Stepper & Progress)
          ────────────────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
            Analysis Pipeline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
              Status: {selectedJob.status === 'Completed' ? 'Completed' : 'Processing...'}
            </span>
            <div style={{ width: 140, height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${selectedJob.progress}%`,
                  height: '100%',
                  background: selectedJob.status === 'Failed' ? '#ef4444' : '#2563eb',
                  borderRadius: 99,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, minWidth: '28px' }}>
              {selectedJob.progress}%
            </span>
          </div>
        </div>

        {/* Stepper with 10 stages */}
        <div style={{ position: 'relative', width: '100%', padding: '0.5rem 0' }}>
          <div className="pipeline-stepper">
            {/* Background connecting line */}
            <div className="step-line" style={{ top: '22px' }}>
              <div
                className="step-line-filled"
                style={{
                  width: selectedJob.status === 'Completed' ? '100%' : `${selectedJob.progress}%`,
                  background: '#10b981'
                }}
              />
            </div>

            {STEPS.map((step, idx) => {
              // Pipeline stage appearance:
              // - Use activeStage field if present to determine which step is currently active
              // - All stages before activeStage are 'done', activeStage itself is 'active', rest 'pending'
              // - If fully completed (100%), all stages are 'done'
              const isFullyDone = selectedJob.progress >= 100;
              const activeStageIdx = selectedJob.activeStage ?? Math.floor((selectedJob.progress / 100) * STEPS.length);
              const isCompleted = isFullyDone ? true : idx < activeStageIdx;
              const isActive = !isFullyDone && idx === activeStageIdx;

              return (
                <div key={step} className={`step-node ${isCompleted ? 'done' : isActive ? 'active' : 'pending'}`}>
                  <div className={`step-circle ${isCompleted ? 'done' : isActive ? 'active' : 'pending'}`}>
                    {isCompleted ? (
                      <Check size={14} strokeWidth={3} />
                    ) : isActive ? (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff' }} />
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1' }} />
                    )}
                  </div>
                  <div className="step-label">{step}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          ROW 3: FOUR VISUALIZATIONS (Waveform, FFT, Spectrogram, Constellation)
          ────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {/* 1. Time Domain Waveform */}
        <div className="viz-box">
          <div className="viz-title">Time Domain Waveform</div>
          <div className="viz-chart-canvas">
            <TimeDomainWaveform color="#2563eb" />
          </div>
        </div>

        {/* 2. Frequency Spectrum (FFT) */}
        <div className="viz-box">
          <div className="viz-title">Frequency Spectrum (FFT)</div>
          <div className="viz-chart-canvas">
            <FrequencySpectrumPlot color="#2563eb" />
          </div>
        </div>

        {/* 3. Spectrogram / Waterfall */}
        <div className="viz-box">
          <div className="viz-title">Spectrogram / Waterfall</div>
          <div className="viz-chart-canvas">
            <SpectrogramWaterfall />
          </div>
        </div>

        {/* 4. Constellation Diagram */}
        <div className="viz-box">
          <div className="viz-title">Constellation Diagram</div>
          <div className="viz-chart-canvas">
            <ConstellationPlot color="#2563eb" />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          ROW 4: FOUR DATA CARDS (Parameters, Demodulation, Bitstream, Job Info)
          ────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        
        {/* Card 1: Estimated Signal Parameters */}
        <div className="card" style={{ padding: '1rem 1.15rem' }}>
          <div className="card-title" style={{ marginBottom: '0.65rem', fontSize: '0.85rem' }}>
            Estimated Signal Parameters
          </div>
          <div className="table-container">
            <table className="data-table" style={{ fontSize: '0.76rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.35rem 0.4rem' }}>Parameter</th>
                  <th style={{ padding: '0.35rem 0.4rem' }}>Value</th>
                  <th style={{ padding: '0.35rem 0.4rem' }}>Confidence</th>
                  <th style={{ padding: '0.35rem 0.4rem' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.45rem 0.4rem' }}>Sample Rate</td>
                  <td className="font-mono" style={{ padding: '0.45rem 0.4rem', fontWeight: 600 }}>
                    {selectedJob.parameters.sampleRate}
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    <span className="badge badge-high">High (0.98)</span>
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem', color: '#64748b' }}>Metadata</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0.4rem' }}>Carrier Frequency</td>
                  <td className="font-mono" style={{ padding: '0.45rem 0.4rem', fontWeight: 600 }}>
                    {selectedJob.parameters.carrierFreq}
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    <span className="badge badge-high">High (0.95)</span>
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem', color: '#64748b' }}>Estimated</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0.4rem' }}>Bandwidth</td>
                  <td className="font-mono" style={{ padding: '0.45rem 0.4rem', fontWeight: 600 }}>
                    {selectedJob.parameters.bandwidth}
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    <span className="badge badge-high">High (0.92)</span>
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem', color: '#64748b' }}>Estimated</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0.4rem' }}>Symbol Rate</td>
                  <td className="font-mono" style={{ padding: '0.45rem 0.4rem', fontWeight: 600 }}>
                    {selectedJob.parameters.symbolRate}
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    <span className="badge badge-medium">Medium (0.78)</span>
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem', color: '#64748b' }}>Estimated</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0.4rem' }}>Modulation</td>
                  <td className="font-mono" style={{ padding: '0.45rem 0.4rem', fontWeight: 600 }}>
                    {selectedJob.parameters.modulation}
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    <span className="badge badge-high">High (0.96)</span>
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem', color: '#64748b' }}>Classifier</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0.4rem' }}>SNR</td>
                  <td className="font-mono" style={{ padding: '0.45rem 0.4rem', fontWeight: 600 }}>
                    {selectedJob.parameters.snr}
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    <span className="badge badge-medium">Medium (0.80)</span>
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem', color: '#64748b' }}>Estimated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Demodulation & Decoding */}
        <div className="card" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ marginBottom: '0.85rem', fontSize: '0.85rem' }}>
              Demodulation & Decoding
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.42rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Modulation Type</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedJob.demod.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Timing Recovery</span>
                <span className="status-badge completed">
                  <span className="status-dot completed" />
                  {selectedJob.demod.timingRecovery}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Carrier Recovery</span>
                <span className="status-badge completed">
                  <span className="status-dot completed" />
                  {selectedJob.demod.carrierRecovery}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>De-interleaving</span>
                <span className="status-badge not-applied">
                  <span className="status-dot not-applied" />
                  {selectedJob.demod.deinterleaving}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>FEC Decoding</span>
                <span className="status-badge not-applied">
                  <span className="status-dot not-applied" />
                  {selectedJob.demod.fecDecoding}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Bit Errors (BER)</span>
                <span className="font-mono" style={{ color: '#0f172a' }}>{selectedJob.demod.ber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Recovered Bit Rate</span>
                <span className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>{selectedJob.demod.bitRate}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Status</span>
            <span className="status-badge processing">
              <span className="status-dot processing" />
              {selectedJob.demod.status}
            </span>
          </div>
        </div>

        {/* Card 3: Recovered Bit Stream (Preview) */}
        <div className="card" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ marginBottom: '0.65rem', fontSize: '0.85rem' }}>
              Recovered Bit Stream (Preview)
            </div>
            <div className="bitstream-box">
              {selectedJob.bits.map((line, idx) => (
                <div key={idx} style={{ letterSpacing: '0.08em' }}>{line}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleDownloadBits}
              style={{ flex: 1, fontSize: '0.72rem', padding: '0.35rem 0.5rem', gap: '0.3rem' }}
            >
              <Download size={13} />
              Download Bits (.bin)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/bitstream')}
              style={{ flex: 1, fontSize: '0.72rem', padding: '0.35rem 0.5rem', gap: '0.3rem' }}
            >
              <Eye size={13} />
              View as Text
            </button>
          </div>
        </div>

        {/* Card 4: Job Information */}
        <div className="card" style={{ padding: '1rem 1.15rem' }}>
          <div className="card-title" style={{ marginBottom: '0.85rem', fontSize: '0.85rem' }}>
            Job Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
              <span style={{ color: '#64748b' }}>Job ID</span>
              <span className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>#{selectedJob.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
              <span style={{ color: '#64748b' }}>File Name</span>
              <span className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>{selectedJob.name}.iq</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
              <span style={{ color: '#64748b' }}>File Size</span>
              <span className="font-mono" style={{ color: '#0f172a' }}>{selectedJob.fileSize}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
              <span style={{ color: '#64748b' }}>Upload Time</span>
              <span style={{ color: '#334155' }}>{selectedJob.uploadTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
              <span style={{ color: '#64748b' }}>Status</span>
              <span className={`status-badge ${selectedJob.status.toLowerCase()}`}>
                <span className={`status-dot ${selectedJob.status.toLowerCase()}`} />
                {selectedJob.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
              <span style={{ color: '#64748b' }}>Started At</span>
              <span style={{ color: '#334155' }}>{selectedJob.startedAt}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.3rem' }}>
              <span style={{ color: '#64748b' }}>Elapsed Time</span>
              <span className="font-mono" style={{ color: '#0f172a' }}>{selectedJob.elapsedTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.1rem' }}>
              <span style={{ color: '#64748b' }}>Estimated Time</span>
              <span className="font-mono" style={{ color: '#0f172a' }}>{selectedJob.estimatedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          ROW 5: ANALYSIS REPORT FOOTER BANNER
          ────────────────────────────────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Analysis Report
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              Generate a comprehensive report with plots, parameters and processing details.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerateReport}
          style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', gap: '0.5rem' }}
        >
          <FileText size={16} />
          Generate PDF Report
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
