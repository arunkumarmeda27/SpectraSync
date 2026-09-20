// Results viewer — shows full DSP analysis results for a job
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Download,
  XCircle, Activity, Cpu, Binary, GitBranch, Waves
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getJob, getAnalysisResult, getStages, downloadReport, type AnalysisJob, type AnalysisResult, type ProcessingStage } from '../api';
import {
  StatusBadge, ModBadge, ConfidenceMeter, ProgressBar,
  Spinner, fmtFreq
} from '../components/Shared';
import { useStore } from '../store';

// ─── WebSocket progress hook ──────────────────────────────────────────────────
function useJobWs(jobId: number, onUpdate: (d: Record<string, unknown>) => void) {
  const ws = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!jobId) return;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? `${window.location.hostname}:8000` : window.location.host;
      const sock = new WebSocket(`${protocol}//${host}/ws/jobs/${jobId}`);
      ws.current = sock;
      sock.onmessage = (e) => {
        try { onUpdate(JSON.parse(e.data)); } catch { /* ignore */ }
      };
      sock.onerror = () => {};
      return () => { sock.close(); };
    } catch {
      // ignore
    }
  }, [jobId, onUpdate]);
}

// ─── Spectrum chart (fake from FFT magnitude if not present) ──────────────────
const SpectrumChart: React.FC<{ data: number[]; sampleRate?: number }> = ({ data, sampleRate }) => {
  const N = data.length;
  const fs = sampleRate || 1e6;
  const chartData = data.map((mag, i) => ({
    freq: ((i - N / 2) * fs / N / 1e6).toFixed(3),
    mag: Math.max(-120, 20 * Math.log10(Math.abs(mag) + 1e-10)),
  })).filter((_, i) => i % Math.max(1, Math.floor(N / 512)) === 0);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
        <defs>
          <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="freq" tick={{ fontSize: 9, fill: '#475569' }} label={{ value: 'MHz', position: 'insideBottomRight', fill: '#475569', fontSize: 10 }} />
        <YAxis tick={{ fontSize: 9, fill: '#475569' }} label={{ value: 'dBm', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: 'var(--text-secondary)' }}
          itemStyle={{ color: '#00d4ff' }}
          formatter={(v: unknown) => [`${typeof v === 'number' ? v.toFixed(1) : v} dBm`, 'Power']}
        />
        <Area type="monotone" dataKey="mag" stroke="#00d4ff" strokeWidth={1.5} fill="url(#specGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ─── Constellation chart (IQ scatter) ────────────────────────────────────────
const ConstellationChart: React.FC<{ points: Array<{ i: number; q: number }> }> = ({ points }) => {
  const sampled = points.filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 300)) === 0).slice(0, 300);
  return (
    <div style={{ position: 'relative', width: '100%', height: 200, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
      <svg width="100%" height="100%" viewBox="-2 -2 4 4">
        <line x1="-2" y1="0" x2="2" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="0.02" />
        <line x1="0" y1="-2" x2="0" y2="2" stroke="rgba(255,255,255,0.1)" strokeWidth="0.02" />
        {[-1, 0, 1].map(v => (
          <React.Fragment key={v}>
            <line x1={v} y1="-2" x2={v} y2="2" stroke="rgba(255,255,255,0.05)" strokeWidth="0.01" />
            <line x1="-2" y1={v} x2="2" y2={v} stroke="rgba(255,255,255,0.05)" strokeWidth="0.01" />
          </React.Fragment>
        ))}
        {sampled.map((pt, i) => (
          <circle key={i} cx={pt.i} cy={-pt.q} r={0.04} fill="#00d4ff" fillOpacity={0.6} />
        ))}
      </svg>
      <div style={{ position: 'absolute', top: 4, left: 8, fontSize: '0.6rem', color: 'var(--text-muted)' }}>I/Q Constellation</div>
    </div>
  );
};

// ─── Stage timeline ───────────────────────────────────────────────────────────
const StageTimeline: React.FC<{ stages: ProcessingStage[] }> = ({ stages }) => (
  <div className="stage-list">
    {stages.map(s => (
      <div key={s.id} className="stage-item">
        <div className={`stage-dot ${s.status === 'completed' ? 'done' : s.status === 'failed' ? 'failed' : s.status === 'running' ? 'running' : 'pending'}`} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{s.stage_name.replace(/_/g, ' ').toUpperCase()}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              {s.duration_ms.toFixed(1)} ms
            </span>
          </div>
          {s.error && (
            <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.2rem' }}>{s.error}</div>
          )}
          {s.metrics && Object.keys(s.metrics).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem' }}>
              {Object.entries(s.metrics).slice(0, 4).map(([k, v]) => (
                <span key={k} style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {k.replace(/_/g, ' ')}: <b style={{ color: 'var(--text-secondary)' }}>{typeof v === 'number' ? v.toFixed(3) : String(v)}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Results Page ────────────────────────────────────────────────────────
const ResultsViewer: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const id = parseInt(jobId || '0');
  const navigate = useNavigate();
  const { addToast } = useStore();

  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'spectrum' | 'bitstream' | 'stages' | 'raw'>('overview');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'csv' | 'json') => {
    setDownloadingFormat(format);
    try {
      addToast('info', `Generating ${format.toUpperCase()} report...`);
      await downloadReport(id, format);
      addToast('success', `Downloaded ${format.toUpperCase()} report for Job #${id}`);
    } catch (err: unknown) {
      addToast('error', `Report download failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const load = async () => {
    try {
      const j = await getJob(id);
      setJob(j);
      if (j.status === 'completed') {
        try {
          const [r, st] = await Promise.all([getAnalysisResult(id), getStages(id)]);
          setResult(r);
          setStages(st);
        } catch { /* result may not exist yet */ }
      } else if (j.status !== 'failed') {
        try { setStages(await getStages(id)); } catch { /* ignore */ }
      }
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useJobWs(id, () => { load(); });

  // Poll while running
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [job?.status]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <Spinner size={24} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading results…</span>
      </div>
    );
  }

  if (!job) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Job not found.</div>;

  const params = result?.parameters || {};
  const vizData = result?.visualizations || {};
  const demod = result?.demodulation_data || {};
  const modCandidates = result?.modulation_candidates || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity size={13} /> },
    { id: 'spectrum', label: 'Spectrum', icon: <Waves size={13} /> },
    { id: 'bitstream', label: 'Bitstream', icon: <Binary size={13} /> },
    { id: 'stages', label: 'Stages', icon: <GitBranch size={13} /> },
    { id: 'raw', label: 'Raw JSON', icon: <Cpu size={13} /> },
  ] as const;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.15rem' }}>
            Job #{job.id} Results
          </h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {job.signal_file?.original_filename}
          </div>
        </div>
        <StatusBadge status={job.status} />

        {job.status === 'completed' && (
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: '#0284c7', fontSize: '0.75rem', gap: '0.3rem' }}
              disabled={downloadingFormat !== null}
              onClick={() => handleDownload('pdf')}
              title="Download publication-grade vector PDF report"
            >
              <Download size={13} /> PDF Report
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.3rem' }}
              disabled={downloadingFormat !== null}
              onClick={() => handleDownload('csv')}
              title="Download estimated parameters as CSV"
            >
              CSV
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.3rem' }}
              disabled={downloadingFormat !== null}
              onClick={() => handleDownload('json')}
              title="Download full analysis bundle JSON"
            >
              JSON
            </button>
          </div>
        )}

        <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Progress bar (running) */}
      {job.status !== 'completed' && job.status !== 'failed' && (
        <div className="card animate-fade-in" style={{ marginBottom: '1rem', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Spinner size={18} />
              <span style={{ fontWeight: 600 }}>DSP Pipeline Running</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-primary)', fontWeight: 700 }}>
              {job.progress}%
            </span>
          </div>
          <ProgressBar value={job.progress} />
          {job.current_stage && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Stage: <b style={{ color: 'var(--text-primary)' }}>{job.current_stage}</b>
            </div>
          )}
        </div>
      )}

      {/* Failed */}
      {job.status === 'failed' && (
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <XCircle size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444' }}>Analysis Failed</div>
              {job.error && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{job.error}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {result && (
        <>
          <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn btn-ghost btn-sm ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  borderRadius: '6px 6px 0 0',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  marginBottom: '-1px',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              {/* Top summary row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card" style={{ border: '1px solid rgba(0,212,255,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Modulation</div>
                  <div className="mod-display">{result.primary_modulation}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <ModBadge mod={result.primary_modulation} />
                  </div>
                </div>
                <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ConfidenceMeter value={result.confidence} label="Confidence" />
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Signal Parameters</div>
                  {[
                    { label: 'Sample Rate', val: fmtFreq((params.sample_rate as number) ?? null) },
                    { label: 'Carrier Freq', val: fmtFreq((params.carrier_frequency_hz as number) ?? null) },
                    { label: 'Bandwidth', val: fmtFreq((params.bandwidth_hz as number) ?? null) },
                    { label: 'Symbol Rate', val: (params.symbol_rate_baud as number) ? `${((params.symbol_rate_baud as number)/1e3).toFixed(2)} kBd` : '—' },
                    { label: 'SNR', val: (params.snr_db as number) != null ? `${(params.snr_db as number).toFixed(1)} dB` : '—' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modulation candidates */}
              {modCandidates.length > 1 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-title" style={{ marginBottom: '0.75rem' }}>Classification Candidates</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {modCandidates.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ModBadge mod={c.modulation} />
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${c.confidence * 100}%`, background: i === 0 ? 'linear-gradient(90deg,#00d4ff,#00ff9d)' : 'rgba(255,255,255,0.2)' }} />
                        </div>
                        <span className="font-mono" style={{ fontSize: '0.75rem', minWidth: 36, textAlign: 'right' }}>
                          {Math.round(c.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync data */}
              {result.synchronization_data && Object.keys(result.synchronization_data).length > 0 && (
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '0.75rem' }}>Synchronization</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                    {Object.entries(result.synchronization_data).map(([k, v]) => (
                      <div key={k} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</div>
                        <div className="font-mono" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          {typeof v === 'number' ? v.toFixed(4) : String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SPECTRUM TAB ── */}
          {activeTab === 'spectrum' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Boolean((vizData as Record<string, unknown>).fft_magnitude) && (
                <div className="viz-container">
                  <div className="viz-header">
                    <span className="viz-label">FFT Spectrum</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      fs = {fmtFreq(params.sample_rate as number)}
                    </span>
                  </div>
                  <div className="viz-body">
                    <SpectrumChart
                      data={(vizData as Record<string, number[]>).fft_magnitude}
                      sampleRate={params.sample_rate as number}
                    />
                  </div>
                </div>
              )}

              {Boolean((vizData as Record<string, unknown>).constellation_points) && (
                <div className="viz-container">
                  <div className="viz-header">
                    <span className="viz-label">I/Q Constellation</span>
                    <span className="badge badge-cyan">{result.primary_modulation}</span>
                  </div>
                  <div className="viz-body">
                    <ConstellationChart points={(vizData as Record<string, Array<{ i: number; q: number }>>).constellation_points} />
                  </div>
                </div>
              )}

              {!Boolean((vizData as Record<string, unknown>).fft_magnitude) && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <Waves size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Spectrum visualization data not available for this job.</p>
                </div>
              )}
            </div>
          )}

          {/* ── BITSTREAM TAB ── */}
          {activeTab === 'bitstream' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2">
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '0.75rem' }}>Demodulation</div>
                  {[
                    { label: 'Method', val: (demod as Record<string, string>).method },
                    { label: 'Total Bits', val: ((demod as Record<string, number>).total_bits || 0).toLocaleString() },
                    { label: 'Bit Rate', val: (demod as Record<string, number>).bit_rate_bps ? `${((demod as Record<string, number>).bit_rate_bps / 1e3).toFixed(2)} kbps` : '—' },
                    { label: 'BER Estimate', val: (demod as Record<string, number>).ber_estimate != null ? (demod as Record<string, number>).ber_estimate.toExponential(2) : '—' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{row.val || '—'}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '0.75rem' }}>FEC / Error Correction</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Viterbi (CCSDS K=7, r=1/2) and Reed-Solomon GF(256) decoded.
                  </div>
                </div>
              </div>
              {(demod as Record<string, string>).hex_stream && (
                <div className="viz-container">
                  <div className="viz-header">
                    <span className="viz-label">Hex Stream (first 512 bytes)</span>
                  </div>
                  <div className="viz-body">
                    <div className="hex-stream">
                      {(demod as Record<string, string>).hex_stream}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STAGES TAB ── */}
          {activeTab === 'stages' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>
                  13-Stage DSP Pipeline — {stages.length} stages recorded
                </div>
                <StageTimeline stages={stages} />
              </div>
            </div>
          )}

          {/* ── RAW JSON TAB ── */}
          {activeTab === 'raw' && (
            <div className="animate-fade-in">
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="viz-header">
                  <span className="viz-label">Raw Analysis JSON</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `job_${id}_result.json`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
                <pre className="code-block" style={{ margin: 0, borderRadius: 0, maxHeight: 500 }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stage timeline when running or queued */}
      {!result && stages.length > 0 && (
        <div className="card animate-fade-in">
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Processing Stages</div>
          <StageTimeline stages={stages} />
        </div>
      )}
    </div>
  );
};

export default ResultsViewer;
