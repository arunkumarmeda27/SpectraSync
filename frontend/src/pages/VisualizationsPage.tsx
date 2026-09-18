import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Maximize2,
  RefreshCw,
  Layers,
  ZoomIn,
  Sliders,
  Eye,
  Activity
} from 'lucide-react';
import {
  TimeDomainWaveform,
  FrequencySpectrumPlot,
  SpectrogramWaterfall,
  ConstellationPlot
} from '../components/DashboardPlots';
import { listJobs, getAnalysisResult, type AnalysisJob } from '../api';

const VisualizationsPage: React.FC = () => {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'waveform' | 'fft' | 'waterfall' | 'constellation'>('all');
  const [colorScheme, setColorScheme] = useState('turbo');

  useEffect(() => {
    listJobs().then(j => {
      setJobs(j);
      if (j.length > 0) setSelectedJobId(j[0].id);
    }).catch(() => {});
  }, []);

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
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
            >
              <option value="">satellite_iq_01 (Pre-loaded Golden QPSK)</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  #{j.id} - {j.signal_file?.filename || 'Job'} ({j.status})
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
              <span className="badge badge-blue">Sampling: 2.000 MSps</span>
            </div>
            <div style={{ height: activeView === 'waveform' ? 360 : 200, width: '100%' }}>
              <TimeDomainWaveform color="#2563eb" />
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
              <span className="badge badge-high">SNR: 18.5 dB</span>
            </div>
            <div style={{ height: activeView === 'fft' ? 360 : 200, width: '100%' }}>
              <FrequencySpectrumPlot color="#2563eb" />
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
              <SpectrogramWaterfall />
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
              <span className="badge badge-blue">Modulation: QPSK</span>
            </div>
            <div style={{ height: activeView === 'constellation' ? 360 : 200, width: '100%' }}>
              <ConstellationPlot color="#2563eb" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationsPage;
