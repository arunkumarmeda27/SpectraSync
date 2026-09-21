import React, { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, AlertCircle } from 'lucide-react';
import {
  TimeDomainWaveform,
  LiveSignalSpectrum,
  WaterfallSpectrogram,
  ConstellationDiagram
} from '../components/DashboardPlots';
import { listJobs, getAnalysisResult, type AnalysisJob, type AnalysisResult } from '../api';
import { useStore } from '../store';

const VisualizationsPage: React.FC = () => {
  const { addToast, activeJobId } = useStore();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'waveform' | 'fft' | 'waterfall' | 'constellation'>('all');

  const loadJobs = async () => {
    try {
      const jobsList = await listJobs();
      const completedJobs = jobsList.filter(j => j.status === 'completed');
      setJobs(completedJobs);

      // Auto-select active job or most recent completed job
      if (activeJobId && completedJobs.find(j => j.id === activeJobId)) {
        setSelectedJobId(activeJobId);
      } else if (completedJobs.length > 0) {
        setSelectedJobId(completedJobs[0].id);
      }
    } catch (err) {
      addToast('error', 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (jobId: number) => {
    setLoadingAnalysis(true);
    try {
      const analysisResult = await getAnalysisResult(jobId);
      setResult(analysisResult);
    } catch (err) {
      addToast('error', 'Failed to load analysis result');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadAnalysis(selectedJobId);
    }
  }, [selectedJobId]);

  if (loading || loadingAnalysis) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '4rem' }}>
        <RefreshCw size={24} className="spin" style={{ color: '#3b82f6' }} />
        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading visualizations...</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: '#64748b' }} />
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>No completed analysis jobs found.</p>
        <p style={{ color: '#475569', fontSize: '0.85rem' }}>
          Upload a signal file from the <b>Upload & Analyze</b> page to see visualizations here.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: '#64748b' }} />
        <p style={{ color: '#64748b' }}>No visualization data available for this job yet.</p>
      </div>
    );
  }

  const params = (result?.parameters || {}) as Record<string, any>;
  const visualizations = result?.visualizations || {};
  const sampleRate = (params.sample_rate as any)?.value || params.sample_rate || 2000000;
  const snr = (params.snr as any)?.value || params.snr || 0;
  const modulation = result?.primary_modulation || 'Unknown';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Filter & Controls Card */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} className="card-title-icon" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
              Signal Visual Studio
            </span>
          </div>

          <div style={{ height: 20, width: 1, background: '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Active Signal:</span>
            <select
              className="input-control"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto', minWidth: '200px' }}
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  #{j.id} - {j.signal_file?.filename || 'Job'} ({j.status})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={loadJobs}
            title="Refresh jobs list"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            {(['all', 'waveform', 'fft', 'waterfall', 'constellation'] as const).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  background: activeView === view ? '#ffffff' : 'transparent',
                  color: activeView === view ? '#2563eb' : '#64748b',
                  boxShadow: activeView === view ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Visualizers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeView === 'all' ? '1fr 1fr' : '1fr',
        gap: '1.25rem'
      }}>
        {/* 1. Time Domain Waveform */}
        {(activeView === 'all' || activeView === 'waveform') && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                  Time Domain Waveform
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Baseband complex I/Q instantaneous envelope and phase variations
                </div>
              </div>
              <span className="badge badge-blue">Sampling: {(sampleRate / 1e6).toFixed(3)} MSps</span>
            </div>
            <div style={{ height: activeView === 'waveform' ? 360 : 200, width: '100%' }}>
              <TimeDomainWaveform data={visualizations.waveform as any} />
            </div>
          </div>
        )}

        {/* 2. Frequency Spectrum (FFT) */}
        {(activeView === 'all' || activeView === 'fft') && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                  Frequency Spectrum (FFT)
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Hann-windowed decimated power spectrum with carrier peak detection
                </div>
              </div>
              <span className="badge badge-high">SNR: {snr > 0 ? snr.toFixed(1) : 'N/A'} dB</span>
            </div>
            <div style={{ height: activeView === 'fft' ? 360 : 200, width: '100%' }}>
              <LiveSignalSpectrum data={visualizations.fft as any} />
            </div>
          </div>
        )}

        {/* 3. Spectrogram / Waterfall */}
        {(activeView === 'all' || activeView === 'waterfall') && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                  Spectrogram / Waterfall Display
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Short-Time Fourier Transform (STFT) spectral density over time
                </div>
              </div>
              <span className="badge badge-neutral">Colormap: Turbo</span>
            </div>
            <div style={{ height: activeView === 'waterfall' ? 360 : 200, width: '100%' }}>
              <WaterfallSpectrogram data={visualizations.spectrogram as any} />
            </div>
          </div>
        )}

        {/* 4. Constellation Diagram */}
        {(activeView === 'all' || activeView === 'constellation') && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                  I/Q Constellation Diagram
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Symbol decision planes with carrier and timing synchronization applied
                </div>
              </div>
              <span className="badge badge-blue">Modulation: {modulation}</span>
            </div>
            <div style={{ height: activeView === 'constellation' ? 360 : 200, width: '100%' }}>
              <ConstellationDiagram data={visualizations.constellation as any} modulation={modulation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationsPage;
