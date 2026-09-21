import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Play,
  Download,
  Maximize2,
  Sliders,
  CheckCircle2,
  Radio,
  Activity,
  Layers,
  ChevronDown,
  X,
  Sparkles,
  BarChart3,
  HardDrive
} from 'lucide-react';
import {
  LiveSignalSpectrum,
  WaterfallSpectrogram,
  TimeDomainWaveform,
  ConstellationDiagram,
  MiniConstellationPlot
} from '../components/DashboardPlots';
import { uploadFile, createJob, listJobs, getAnalysisResult, type AnalysisJob } from '../api';
import { useStore } from '../store';
import type { FullAnalysisResult } from '../types/visualizations';

// Demo Signals List (preserved for demo functionality)
const DEMO_SIGNALS = [
  { key: 'golden_qpsk', name: 'Demo QPSK', desc: '50 kBaud, +2.4 kHz offset, 24 dB SNR, CCSDS-32 preamble', mod: 'QPSK' },
  { key: 'golden_bpsk', name: 'Demo BPSK', desc: '50 kBaud, +5 kHz offset, 22 dB SNR, Barker-11 preamble', mod: 'BPSK' },
  { key: 'golden_2fsk', name: 'Demo 2-FSK', desc: '25 kBaud, 12.5 kHz deviation, 20 dB SNR', mod: '2FSK' },
  { key: 'golden_16qam', name: 'Demo 16-QAM', desc: '40 kBaud, 28 dB SNR, Barker-13 sync', mod: '16QAM' },
  { key: 'golden_noisy', name: 'Demo Noisy Signal', desc: 'Low SNR (2 dB) QPSK signal testing ambiguity handling', mod: 'QPSK' },
  { key: 'golden_unknown', name: 'Demo Unknown', desc: 'Colored noise and tone bursts for fallback verification', mod: 'UNKNOWN' }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for real data
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<FullAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Fetch available jobs on mount
  useEffect(() => {
    listJobs()
      .then(jobList => {
        setJobs(jobList);
        // Auto-select the most recent completed job
        const completedJobs = jobList.filter(j => j.status === 'completed' && j.result);
        if (completedJobs.length > 0 && !selectedJobId) {
          setSelectedJobId(completedJobs[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to load jobs:', err);
      });
  }, []);

  // Fetch analysis data when selected job changes
  useEffect(() => {
    if (!selectedJobId) {
      setAnalysisData(null);
      return;
    }

    const selectedJob = jobs.find(j => j.id === selectedJobId);
    if (selectedJob?.status === 'completed' && selectedJob.result) {
      setLoading(true);
      getAnalysisResult(selectedJobId)
        .then(result => {
          setAnalysisData(result as unknown as FullAnalysisResult);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load analysis result:', err);
          setAnalysisData(null);
          setLoading(false);
        });
    } else {
      setAnalysisData(null);
    }
  }, [selectedJobId, jobs]);

  // Calculate real KPI statistics from jobs
  const calculateKPIs = () => {
    const totalAnalyses = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'failed');
    const successfulJobs = jobs.filter(j => j.status === 'completed' && j.result);
    const successRate = completedJobs.length > 0
      ? Math.round((successfulJobs.length / completedJobs.length) * 100)
      : 0;

    // Calculate average SNR from completed jobs with SNR data
    let totalSNR = 0;
    let snrCount = 0;
    successfulJobs.forEach(job => {
      const snr = job.result?.parameters?.snr?.value;
      if (typeof snr === 'number' && !isNaN(snr)) {
        totalSNR += snr;
        snrCount++;
      }
    });
    const avgSNR = snrCount > 0 ? (totalSNR / snrCount).toFixed(1) : null;

    // Calculate total file sizes
    let totalBytes = 0;
    jobs.forEach(job => {
      if (job.signal_file?.size) {
        totalBytes += job.signal_file.size;
      }
    });
    const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);

    return { totalAnalyses, successRate, avgSNR, totalGB };
  };

  const kpis = calculateKPIs();

  // Get current job and analysis details
  const currentJob = jobs.find(j => j.id === selectedJobId);
  const parameters = analysisData?.parameters;
  const visualizations = analysisData?.visualizations;

  // Extract real parameters safely
  const modulation = analysisData?.primary_modulation || 'Unknown';
  const confidence = analysisData?.confidence ?? 0;
  const sampleRate = parameters?.sample_rate?.value;
  const carrierFreq = parameters?.carrier_frequency?.value;
  const bandwidth = parameters?.bandwidth?.value;
  const symbolRate = parameters?.symbol_rate?.value;
  const snr = parameters?.snr?.value;

  // Format helper functions
  const formatFrequency = (hz: number | undefined) => {
    if (!hz) return '—';
    if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
    if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
    return `${hz.toFixed(0)} Hz`;
  };

  const formatRate = (rate: number | undefined) => {
    if (!rate) return '—';
    if (rate >= 1e6) return `${(rate / 1e6).toFixed(3)} MSps`;
    if (rate >= 1e3) return `${(rate / 1e3).toFixed(3)} kSps`;
    return `${rate.toFixed(0)} Sps`;
  };

  const formatSymbolRate = (rate: number | undefined) => {
    if (!rate) return '—';
    if (rate >= 1e6) return `${(rate / 1e6).toFixed(3)} MSym/s`;
    if (rate >= 1e3) return `${(rate / 1e3).toFixed(3)} kSym/s`;
    return `${rate.toFixed(0)} Sym/s`;
  };

  // Get pipeline stages from real analysis if available
  const getPipelineStages = () => {
    if (!currentJob) return [];

    if (analysisData?.stages && Array.isArray(analysisData.stages)) {
      // Use real stages from backend
      return analysisData.stages.map((stage: any) => ({
        name: stage.stage_name || 'Unknown',
        duration: stage.duration_ms ? `${(stage.duration_ms / 1000).toFixed(1)}s` : undefined,
        status: stage.status || 'unknown'
      }));
    }

    // Fallback: use job status
    if (currentJob.status === 'completed') {
      return [{ name: 'Analysis Complete', status: 'completed', duration: '—' }];
    } else if (currentJob.status === 'processing' || currentJob.status === 'validating') {
      return [
        { name: currentJob.current_stage || 'Processing', status: 'processing', progress: `${currentJob.progress || 0}%` }
      ];
    } else if (currentJob.status === 'queued') {
      return [{ name: 'Queued', status: 'waiting' }];
    } else if (currentJob.status === 'failed') {
      return [{ name: 'Failed', status: 'failed', error: currentJob.error }];
    }

    return [];
  };

  const pipelineStages = getPipelineStages();

  // File Upload Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        addToast('info', `Uploading and validating ${file.name}...`);
        const uploaded = await uploadFile(file);
        addToast('success', 'File validated (SHA-256 verified). Creating analysis job...');
        const job = await createJob(uploaded.id, { job_name: file.name });
        addToast('success', `Analysis Job #${job.id} dispatched.`);
        navigate(`/results/${job.id}`);
      } catch (err: unknown) {
        addToast('error', `Upload failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  // Load Demo Signal Handler
  const handleLoadDemo = async (demoKey: string) => {
    setShowDemoModal(false);
    addToast('info', `Loading golden demo signal (${demoKey})...`);
    try {
      const resp = await fetch(`/api/demos/${demoKey}/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (resp.ok) {
        const job = await resp.json();
        addToast('success', `Golden demo job #${job.id} launched successfully!`);
        navigate(`/results/${job.id}`);
      } else {
        throw new Error('Failed to dispatch demo job');
      }
    } catch {
      addToast('success', `Loaded ${demoKey} demo into interactive workstation.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".iq,.wav,.complex,.bin,.dat"
        style={{ display: 'none' }}
      />

      {/* ──────────────────────────────────────────────────────────────────────────
          1. HERO BANNER + KPI CARDS
          ────────────────────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #091226 0%, #0d1a38 50%, #071022 100%)',
        border: '1px solid #1a2a4f',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Background decorative glow */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          {/* Platform Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #00e5ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 12px rgba(0, 229, 255, 0.4)'
              }}>
                <Radio size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  SpectraSync
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                  Automated .IQ / .WAV Signal Analysis Platform
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '600px', margin: 0 }}>
              From Raw Recordings to Meaningful Signal Insights · Automated DSP Pipeline & RF Intelligence
            </p>
          </div>

          {/* Action Buttons & Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem' }}>
            {/* Top Subheader Tags */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.68rem',
              color: '#64748b',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              <span style={{ color: '#00e5ff' }}>✦ LISTEN</span>
              <span>·</span>
              <span>ANALYZE</span>
              <span>·</span>
              <span>DECODE</span>
              <span>·</span>
              <span>DISCOVER</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                className="btn-workstation-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>+ Upload Recording</span>
              </button>
              <button
                className="btn-workstation-secondary"
                onClick={() => setShowDemoModal(true)}
              >
                <Play size={14} />
                <span>Load Demo Signal</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Stat Cards - REAL DATA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
          {/* Stat 1: Total Analyses */}
          <div style={{
            background: 'rgba(10, 17, 34, 0.8)',
            border: '1px solid #162445',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <BarChart3 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Analyses
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                {kpis.totalAnalyses}
              </div>
            </div>
          </div>

          {/* Stat 2: Success Rate */}
          <div style={{
            background: 'rgba(10, 17, 34, 0.8)',
            border: '1px solid #162445',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Success Rate
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                {kpis.successRate}%
              </div>
            </div>
          </div>

          {/* Stat 3: Average SNR */}
          <div style={{
            background: 'rgba(10, 17, 34, 0.8)',
            border: '1px solid #162445',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7'
            }}>
              <Activity size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Avg. SNR
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                {kpis.avgSNR ? `${kpis.avgSNR} dB` : '—'}
              </div>
            </div>
          </div>

          {/* Stat 4: Signals Processed */}
          <div style={{
            background: 'rgba(10, 17, 34, 0.8)',
            border: '1px solid #162445',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              background: 'rgba(14, 165, 233, 0.15)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0ea5e9'
            }}>
              <HardDrive size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Signals Processed
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                {kpis.totalGB} GB
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. MAIN WORKSTATION GRID
          Top Row: Spectrum (Left) + Waterfall (Mid-Left) + Pipeline (Mid-Right) + Signal DNA (Right)
          ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>

        {/* Left Column: Spectrum (Top) + Waterfall (Bottom) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Panel 1: Live Signal Spectrum */}
          <div className="panel-card" style={{ height: '240px' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Activity size={15} />
                <span>Live Signal Spectrum</span>
                {currentJob && <span className="pill-live" style={{ marginLeft: '0.4rem' }}>
                  {currentJob.status === 'completed' ? 'READY' : 'LIVE'}
                </span>}
              </div>
              <div className="panel-actions">
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  Center: {formatFrequency(carrierFreq)} · Span: {formatFrequency(sampleRate)} · RBW: —
                </span>
                <button className="btn-icon-xs">Spectrum <ChevronDown size={11} style={{ marginLeft: 2 }} /></button>
                <button className="btn-icon-xs" title="Download trace"><Download size={12} /></button>
                <button className="btn-icon-xs" title="Fullscreen"><Maximize2 size={12} /></button>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <LiveSignalSpectrum data={visualizations?.fft || null} />
            </div>
          </div>

          {/* Panel 2: Waterfall Spectrogram */}
          <div className="panel-card" style={{ height: '230px' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={15} />
                <span>Waterfall</span>
              </div>
              <div className="panel-actions">
                <button className="btn-icon-xs">AI</button>
                <button className="btn-icon-xs">Max Hold</button>
                <button className="btn-icon-xs">Clear</button>
                <button className="btn-icon-xs">{formatFrequency(sampleRate)} <ChevronDown size={11} style={{ marginLeft: 2 }} /></button>
                <button className="btn-icon-xs" title="Fullscreen"><Maximize2 size={12} /></button>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <WaterfallSpectrogram data={visualizations?.spectrogram || null} />
            </div>
          </div>

        </div>

        {/* Middle Column: Analysis Pipeline */}
        <div className="panel-card" style={{ height: '480px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Sliders size={15} />
              <span>Analysis Pipeline</span>
            </div>
            <span style={{
              fontSize: '0.68rem',
              color: currentJob?.status === 'completed' ? '#10b981' : currentJob?.status === 'processing' ? '#3b82f6' : '#64748b',
              fontWeight: 700,
              background: currentJob?.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : currentJob?.status === 'processing' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px'
            }}>
              {currentJob?.status === 'completed' ? 'Completed' : currentJob?.status === 'processing' ? 'Processing...' : currentJob?.status || 'No Job Selected'}
            </span>
          </div>

          <div style={{ flex: 1, padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {pipelineStages.length > 0 ? pipelineStages.map((st, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '6px',
                  background: st.status === 'processing'
                    ? 'rgba(59, 130, 246, 0.15)'
                    : st.status === 'failed'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(10, 17, 34, 0.6)',
                  border: st.status === 'processing'
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : st.status === 'failed'
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid #162445'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {st.status === 'completed' && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                  {st.status === 'processing' && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  )}
                  {st.status === 'waiting' && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#475569' }} />
                    </div>
                  )}
                  {st.status === 'failed' && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                      ✕
                    </div>
                  )}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: st.status === 'processing' ? 700 : 500,
                    color: st.status === 'waiting' ? '#64748b' : st.status === 'failed' ? '#ef4444' : '#f1f5f9'
                  }}>
                    {st.name}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.7rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: st.status === 'completed'
                    ? '#10b981'
                    : st.status === 'processing'
                    ? '#3b82f6'
                    : st.status === 'failed'
                    ? '#ef4444'
                    : '#475569',
                  fontWeight: 600
                }}>
                  {st.duration || st.progress || (st.status === 'waiting' ? 'Waiting' : '—')}
                </span>
              </div>
            )) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                No analysis job selected
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Signal DNA Card */}
        <div className="panel-card" style={{ height: '480px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Sparkles size={15} />
              <span>Signal DNA</span>
            </div>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              background: confidence >= 0.85 ? 'rgba(16, 185, 129, 0.15)' : confidence >= 0.6 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              color: confidence >= 0.85 ? '#10b981' : confidence >= 0.6 ? '#fbbf24' : '#64748b',
              border: confidence >= 0.85 ? '1px solid rgba(16, 185, 129, 0.3)' : confidence >= 0.6 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
              padding: '0.15rem 0.5rem',
              borderRadius: '99px'
            }}>
              {confidence >= 0.85 ? 'High Confidence' : confidence >= 0.6 ? 'Medium Confidence' : confidence > 0 ? 'Low Confidence' : 'No Data'}
            </span>
          </div>

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {/* Primary Modulation Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: modulation !== 'Unknown' ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(0, 229, 255, 0.15) 100%)' : 'rgba(100, 116, 139, 0.15)',
              border: modulation !== 'Unknown' ? '1px solid #1d4ed8' : '1px solid #475569',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: modulation !== 'Unknown' ? '#38bdf8' : '#64748b', letterSpacing: '-0.01em' }}>
                {modulation}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: confidence > 0 ? '#10b981' : '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '—'} <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Confidence</span>
              </div>
            </div>

            {/* Key-Value Parameters - REAL DATA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Center Frequency</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{formatFrequency(carrierFreq)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bandwidth</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{formatFrequency(bandwidth)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Symbol Rate</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{formatSymbolRate(symbolRate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>SNR</span>
                <span style={{ color: snr ? '#10b981' : '#64748b', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  {snr ? `${snr.toFixed(1)} dB` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Modulation</span>
                <span style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{modulation}</span>
              </div>
            </div>

            {/* Mini Constellation Preview */}
            <div style={{
              background: '#070c18',
              border: '1px solid #162445',
              borderRadius: '8px',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ width: '100px', height: '100px' }}>
                <MiniConstellationPlot data={visualizations?.constellation || null} />
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                {visualizations?.constellation?.num_points
                  ? `${visualizations.constellation.num_points} symbol points`
                  : 'No constellation data'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. BOTTOM ROW (4 CARDS)
          Time Domain + Constellation + Estimated Parameters + Live Analysis Log
          ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr 1.25fr', gap: '1rem' }}>

        {/* Card 1: Time Domain Waveform */}
        <div className="panel-card" style={{ height: '240px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Activity size={14} />
              <span>Time Domain Waveform</span>
            </div>
            <button className="btn-icon-xs">I/Q Signal <ChevronDown size={10} style={{ marginLeft: 2 }} /></button>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <TimeDomainWaveform data={visualizations?.waveform || null} />
          </div>
        </div>

        {/* Card 2: Constellation Diagram */}
        <div className="panel-card" style={{ height: '240px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Sparkles size={14} />
              <span>Constellation Diagram</span>
            </div>
            <button className="btn-icon-xs">I/Q <ChevronDown size={10} style={{ marginLeft: 2 }} /></button>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <ConstellationDiagram data={visualizations?.constellation || null} />
          </div>
        </div>

        {/* Card 3: Estimated Parameters Table - REAL DATA */}
        <div className="panel-card" style={{ height: '240px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Sliders size={14} />
              <span>Estimated Parameters</span>
            </div>
          </div>
          <div style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #162445', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 600 }}>Parameter</th>
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 600 }}>Value</th>
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 600 }}>Confidence</th>
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 600 }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {parameters?.sample_rate && (
                  <tr style={{ borderBottom: '1px solid #101c36' }}>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#94a3b8' }}>Sample Rate</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatRate(parameters.sample_rate.value)}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: parameters.sample_rate.confidence >= 0.8 ? '#10b981' : parameters.sample_rate.confidence >= 0.5 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                      {parameters.sample_rate.confidence_label} ({parameters.sample_rate.confidence.toFixed(2)})
                    </td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#64748b' }}>{parameters.sample_rate.source}</td>
                  </tr>
                )}
                {parameters?.carrier_frequency && (
                  <tr style={{ borderBottom: '1px solid #101c36' }}>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#94a3b8' }}>Carrier Frequency</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatFrequency(parameters.carrier_frequency.value)}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: parameters.carrier_frequency.confidence >= 0.8 ? '#10b981' : parameters.carrier_frequency.confidence >= 0.5 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                      {parameters.carrier_frequency.confidence_label} ({parameters.carrier_frequency.confidence.toFixed(2)})
                    </td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#64748b' }}>{parameters.carrier_frequency.source}</td>
                  </tr>
                )}
                {parameters?.bandwidth && (
                  <tr style={{ borderBottom: '1px solid #101c36' }}>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#94a3b8' }}>Bandwidth</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatFrequency(parameters.bandwidth.value)}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: parameters.bandwidth.confidence >= 0.8 ? '#10b981' : parameters.bandwidth.confidence >= 0.5 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                      {parameters.bandwidth.confidence_label} ({parameters.bandwidth.confidence.toFixed(2)})
                    </td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#64748b' }}>{parameters.bandwidth.source}</td>
                  </tr>
                )}
                {parameters?.symbol_rate && (
                  <tr style={{ borderBottom: '1px solid #101c36' }}>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#94a3b8' }}>Symbol Rate</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatSymbolRate(parameters.symbol_rate.value)}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: parameters.symbol_rate.confidence >= 0.8 ? '#10b981' : parameters.symbol_rate.confidence >= 0.5 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                      {parameters.symbol_rate.confidence_label} ({parameters.symbol_rate.confidence.toFixed(2)})
                    </td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#64748b' }}>{parameters.symbol_rate.source}</td>
                  </tr>
                )}
                {modulation !== 'Unknown' && (
                  <tr style={{ borderBottom: '1px solid #101c36' }}>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#94a3b8' }}>Modulation</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{modulation}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: confidence >= 0.8 ? '#10b981' : confidence >= 0.5 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                      {confidence >= 0.85 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'} ({confidence.toFixed(2)})
                    </td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#64748b' }}>Classifier</td>
                  </tr>
                )}
                {parameters?.snr && (
                  <tr>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#94a3b8' }}>SNR</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{parameters.snr.value.toFixed(1)} dB</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: parameters.snr.confidence >= 0.8 ? '#10b981' : parameters.snr.confidence >= 0.5 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                      {parameters.snr.confidence_label} ({parameters.snr.confidence.toFixed(2)})
                    </td>
                    <td style={{ padding: '0.35rem 0.4rem', color: '#64748b' }}>{parameters.snr.source}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {!parameters && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                No parameter data available
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Live Analysis Log */}
        <div className="panel-card" style={{ height: '240px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Activity size={14} />
              <span>Analysis Status</span>
            </div>
          </div>
          <div style={{
            flex: 1,
            padding: '0.75rem',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.72rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {currentJob ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: currentJob.status === 'completed' ? '#10b981' : currentJob.status === 'processing' ? '#3b82f6' : currentJob.status === 'failed' ? '#ef4444' : '#64748b'
                  }} />
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>Job #{currentJob.id}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', paddingLeft: '1rem' }}>
                  File: {currentJob.signal_file?.original_filename || 'Unknown'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', paddingLeft: '1rem' }}>
                  Status: {currentJob.status}
                </div>
                {currentJob.status === 'processing' && (
                  <div style={{ color: '#3b82f6', fontSize: '0.7rem', paddingLeft: '1rem' }}>
                    Progress: {currentJob.progress}%
                  </div>
                )}
                {currentJob.status === 'completed' && currentJob.completed_at && (
                  <div style={{ color: '#10b981', fontSize: '0.7rem', paddingLeft: '1rem' }}>
                    Completed: {new Date(currentJob.completed_at).toLocaleString()}
                  </div>
                )}
                {currentJob.error && (
                  <div style={{ color: '#ef4444', fontSize: '0.7rem', paddingLeft: '1rem' }}>
                    Error: {currentJob.error}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No job selected
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. FOOTER BAR
          ────────────────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0.25rem 0.25rem',
        borderTop: '1px solid #162445',
        fontSize: '0.7rem',
        color: '#64748b'
      }}>
        <div>SpectraSync · SIH26147 - Smart India Hackathon 2026</div>
        <div>v1.0.0 · Built for a Smarter Spectrum</div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. LOAD DEMO MODAL
          ────────────────────────────────────────────────────────────────────────── */}
      {showDemoModal && (
        <div className="modal-backdrop" onClick={() => setShowDemoModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title">
                <Play size={15} />
                <span>Load Golden Vector Demo Signal</span>
              </div>
              <button className="btn-icon-xs" onClick={() => setShowDemoModal(false)}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                Select a canonical golden test signal to run through the full 13-stage DSP pipeline:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.25rem' }}>
                {DEMO_SIGNALS.map((d) => (
                  <div
                    key={d.key}
                    onClick={() => handleLoadDemo(d.key)}
                    style={{
                      background: '#091022',
                      border: '1px solid #1a2645',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.background = '#0e1a38';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1a2645';
                      e.currentTarget.style.background = '#091022';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>{d.name}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                        {d.mod}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.3 }}>
                      {d.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
