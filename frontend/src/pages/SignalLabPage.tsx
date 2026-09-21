import React, { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  RealTimeDomainWaveform,
  RealFrequencySpectrum,
  RealWaterfallSpectrogram,
  RealConstellationDiagram
} from '../components/SignalLabPlots';
import { listJobs, getAnalysisResult, type AnalysisJob } from '../api';
import { useStore } from '../store';
import type { FullAnalysisResult } from '../types/visualizations';

const SignalLabPage: React.FC = () => {
  const { activeJobId, setActiveJobId } = useStore();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(activeJobId ?? null);
  const [analysisData, setAnalysisData] = useState<FullAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'waveform' | 'fft' | 'waterfall' | 'constellation'>('all');

  useEffect(() => {
    if (selectedJobId !== null) {
      setActiveJobId(selectedJobId);
    }
  }, [selectedJobId, setActiveJobId]);

  // Fetch available jobs on mount
  useEffect(() => {
    const refreshJobs = async () => {
      try {
        const jobList = await listJobs();
        const filteredJobs = jobList.filter(j => j.status === 'completed' || j.result || j.status === 'processing' || j.status === 'queued' || j.status === 'validating');
        setJobs(filteredJobs);

        const preferred = activeJobId
          ? filteredJobs.find(j => j.id === activeJobId) ?? filteredJobs[0]
          : filteredJobs[0];
        if (preferred && !selectedJobId) {
          setSelectedJobId(preferred.id);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
        setError('Failed to load analysis jobs');
      }
    };

    refreshJobs();
  }, [activeJobId]);

  // Fetch analysis data when selected job changes
  useEffect(() => {
    if (!selectedJobId) {
      setAnalysisData(null);
      return;
    }

    setLoading(true);
    setError(null);

    getAnalysisResult(selectedJobId)
      .then(result => {
        setAnalysisData(result as unknown as FullAnalysisResult);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analysis result:', err);
        setError('Failed to load analysis data');
        setAnalysisData(null);
        setLoading(false);
      });
  }, [selectedJobId]);

  // Get current job details
  const currentJob = jobs.find(j => j.id === selectedJobId);

  // Extract metadata safely
  const samplingRate = analysisData?.parameters?.sample_rate?.value ?? null;
  const snr = analysisData?.parameters?.snr?.value ?? null;
  const snrUnit = analysisData?.parameters?.snr?.unit ?? 'dB';
  const modulation = analysisData?.primary_modulation ?? 'Unknown';
  const confidence = analysisData?.confidence ?? 0;

  // Format sampling rate for display
  const formatSamplingRate = () => {
    if (!samplingRate) return 'Unknown';
    const rate = samplingRate;
    if (rate >= 1e6) return `${(rate / 1e6).toFixed(3)} MSps`;
    if (rate >= 1e3) return `${(rate / 1e3).toFixed(3)} kSps`;
    return `${rate.toFixed(0)} Sps`;
  };

  // Format SNR for display
  const formatSnr = () => {
    if (snr === null) return 'Unknown';
    return `${snr.toFixed(1)} ${snrUnit}`;
  };

  // Render loading state
  if (loading && !analysisData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading signal analysis...</div>
        </div>
      </div>
    );
  }

  // Render no jobs state
  if (jobs.length === 0 && !loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
            No completed analysis jobs available
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
            Upload and analyze a signal file to view it in Signal Lab
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !analysisData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>
            {error}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
            Please select a different analysis job or try again
          </div>
        </div>
      </div>
    );
  }

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
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto', minWidth: '250px' }}
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  #{j.id} - {j.signal_file?.original_filename || j.signal_file?.filename || 'Analysis Job'} ({j.result?.primary_modulation || 'Unknown'})
                </option>
              ))}
            </select>
          </div>
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
              <span className="badge badge-blue">
                Sampling: {formatSamplingRate()}
              </span>
            </div>
            <div style={{ height: activeView === 'waveform' ? 360 : 200, width: '100%' }}>
              {loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Loading...
                </div>
              ) : (
                <RealTimeDomainWaveform
                  data={analysisData?.visualizations?.waveform || null}
                  height={activeView === 'waveform' ? 360 : 200}
                />
              )}
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
                  Windowed power spectrum with carrier peak detection
                </div>
              </div>
              <span className={`badge ${snr && snr >= 15 ? 'badge-high' : snr && snr >= 8 ? 'badge-medium' : 'badge-low'}`}>
                SNR: {formatSnr()}
              </span>
            </div>
            <div style={{ height: activeView === 'fft' ? 360 : 200, width: '100%' }}>
              {loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Loading...
                </div>
              ) : (
                <RealFrequencySpectrum
                  data={analysisData?.visualizations?.fft || null}
                  height={activeView === 'fft' ? 360 : 200}
                />
              )}
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
              {loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Loading...
                </div>
              ) : (
                <RealWaterfallSpectrogram
                  data={analysisData?.visualizations?.spectrogram || null}
                  height={activeView === 'waterfall' ? 360 : 200}
                />
              )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-blue">
                  {modulation}
                </span>
                {confidence > 0 && (
                  <span className={`badge ${confidence >= 0.85 ? 'badge-high' : confidence >= 0.6 ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '0.65rem' }}>
                    {(confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ height: activeView === 'constellation' ? 360 : 200, width: '100%' }}>
              {loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Loading...
                </div>
              ) : (
                <RealConstellationDiagram
                  data={analysisData?.visualizations?.constellation || null}
                  modulation={modulation}
                  height={activeView === 'constellation' ? 360 : 200}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Job Info Footer */}
      {currentJob && (
        <div style={{
          fontSize: '0.72rem',
          color: '#64748b',
          padding: '0.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>
            File: {currentJob.signal_file?.original_filename || currentJob.signal_file?.filename || 'Unknown'}
            {currentJob.signal_file?.size && ` (${(currentJob.signal_file.size / 1024 / 1024).toFixed(2)} MB)`}
          </span>
          <span>
            Job #{currentJob.id} · Completed: {currentJob.completed_at ? new Date(currentJob.completed_at).toLocaleString() : 'Unknown'}
          </span>
        </div>
      )}
    </div>
  );
};

export default SignalLabPage;
