// Demo signals loader page
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, Zap } from 'lucide-react';
import { listDemos, loadDemo, type DemoSignal } from '../api';
import { ModBadge, Spinner } from '../components/Shared';
import { useStore } from '../store';

const MODULATION_DESCRIPTIONS: Record<string, { color: string; desc: string; bits: number }> = {
  BPSK: { color: '#00d4ff', desc: 'Binary Phase Shift Keying — 1 bit/symbol, highly robust, used in GNSS and deep-space', bits: 1 },
  QPSK: { color: '#a855f7', desc: 'Quadrature PSK — 2 bits/symbol, used in satellite comms, DVB, 802.11', bits: 2 },
  '2FSK': { color: '#00ff9d', desc: 'Binary Frequency Shift Keying — frequency deviation modulation, IoT/LoRa class', bits: 1 },
  '16QAM': { color: '#f59e0b', desc: '16-QAM — 4 bits/symbol, higher throughput, requires better SNR, used in LTE/WiFi', bits: 4 },
  NOISY: { color: '#ef4444', desc: 'Noisy BPSK at low SNR — tests classifier robustness under interference', bits: 1 },
  UNKNOWN: { color: '#475569', desc: 'Wideband noise signal — no modulation, tests unknown signal handling', bits: 0 },
};

const DemosPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, setActiveJobId } = useStore();
  const [demos, setDemos] = useState<DemoSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);

  useEffect(() => {
    listDemos()
      .then(setDemos)
      .catch(() => addToast('error', 'Failed to load demo signals — is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleLoad = async (demo: DemoSignal) => {
    setLaunching(demo.filename);
    try {
      const { job } = await loadDemo(demo.filename);
      setActiveJobId(job.id);
      addToast('success', `Demo '${demo.name}' loaded — Job #${job.id} queued`);
      navigate(`/results/${job.id}`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load demo');
    } finally {
      setLaunching(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <Spinner size={24} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading demo signals…</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Demo Signals</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Pre-generated synthetic signals with known ground truth — run the full 13-stage DSP pipeline instantly.
        </p>
      </div>

      {/* Pipeline intro */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.05), rgba(0,212,255,0.05))',
        border: '1px solid rgba(0,212,255,0.12)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <Zap size={20} color="var(--accent-primary)" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Each demo runs: <b style={{ color: 'var(--text-primary)' }}>Validation → Ingestion → Preprocessing → FFT/PSD/Spectrogram → Parameter Estimation → Modulation Classification → Synchronization → Demodulation → Bitstream → Correlation → Header Detection → FEC → Report</b>
        </div>
      </div>

      {demos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Radio size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            No demo signals found. Run <code className="mono">python ml/generation/generate_golden_signals.py</code> to generate them.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {demos.map(demo => {
            const key = demo.modulation.toUpperCase().replace('-', '').replace('FSK', 'FSK').replace('QAM', 'QAM');
            const meta = MODULATION_DESCRIPTIONS[key] || MODULATION_DESCRIPTIONS[demo.modulation.toUpperCase()] || { color: '#00d4ff', desc: demo.description, bits: 1 };
            const isLoading = launching === demo.filename;

            return (
              <div
                key={demo.filename}
                className="card"
                style={{
                  border: `1px solid ${meta.color}20`,
                  background: `linear-gradient(135deg, ${meta.color}06 0%, transparent 60%)`,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => !isLoading && handleLoad(demo)}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${meta.color}15`,
                      border: `1px solid ${meta.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Radio size={18} color={meta.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{demo.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{demo.filename}</div>
                    </div>
                  </div>
                  <ModBadge mod={demo.modulation} />
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {meta.desc}
                </p>

                {/* Info chips */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {meta.bits > 0 && (
                    <span className="badge badge-muted">{meta.bits} bit{meta.bits !== 1 ? 's' : ''}/symbol</span>
                  )}
                  <span className="badge badge-muted">RRC filtered</span>
                  <span className="badge badge-muted">Barker preamble</span>
                  <span className="badge badge-muted">AWGN noise</span>
                </div>

                {/* Launch button */}
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', background: `linear-gradient(135deg, ${meta.color}dd, ${meta.color})`, color: '#000' }}
                  disabled={!!launching}
                  onClick={e => { e.stopPropagation(); handleLoad(demo); }}
                >
                  {isLoading ? <Spinner size={13} /> : <Play size={13} />}
                  {isLoading ? 'Launching pipeline…' : 'Run Analysis Pipeline'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Signal generation info */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-title" style={{ marginBottom: '0.75rem' }}>About Demo Signals</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>Generation</div>
            Golden signals are synthetically generated using the SpectraSync signal generator with RRC pulse shaping, Barker-13 preamble, configurable carrier and timing offsets, and AWGN noise.
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>Verification</div>
            Each demo provides ground-truth labels. The pipeline's modulation classification confidence can be directly compared against the known modulation type for validation.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemosPage;
