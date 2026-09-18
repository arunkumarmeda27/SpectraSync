// System health page
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Database, HardDrive, Cpu, Radio } from 'lucide-react';
import { getHealth, type HealthStatus } from '../api';
import { Spinner } from '../components/Shared';

const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await getHealth());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Backend offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const checks = health ? [
    { label: 'Database', icon: <Database size={18} />, status: health.db, detail: 'SQLite / PostgreSQL' },
    { label: 'Storage', icon: <HardDrive size={18} />, status: health.storage, detail: 'Local / S3-compatible' },
    { label: 'Worker Queue', icon: <Cpu size={18} />, status: health.worker, detail: 'In-memory / Redis' },
    { label: 'Golden Signals', icon: <Radio size={18} />, status: health.golden_signals > 0 ? 'ok' : 'missing', detail: `${health.golden_signals} files` },
  ] : [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>System Health</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Real-time status of all SpectraSync subsystems</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && !health && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
          <Spinner size={24} />
          <span style={{ color: 'var(--text-secondary)' }}>Checking health…</span>
        </div>
      )}

      {error && (
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <XCircle size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444' }}>Backend Unreachable</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{error}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Start the backend: <code className="mono">python -m uvicorn backend.app.main:app --port 8000 --reload</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {health && (
        <>
          {/* Overall */}
          <div className="card" style={{
            border: health.status === 'healthy' ? '1px solid rgba(0,255,157,0.25)' : '1px solid rgba(239,68,68,0.25)',
            background: health.status === 'healthy' ? 'rgba(0,255,157,0.04)' : 'rgba(239,68,68,0.04)',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {health.status === 'healthy'
                ? <CheckCircle size={28} color="#00ff9d" />
                : <XCircle size={28} color="#ef4444" />
              }
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: health.status === 'healthy' ? '#00ff9d' : '#ef4444' }}>
                  System {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  SpectraSync v{health.version} · DSP Engine operational
                </div>
              </div>
            </div>
          </div>

          {/* Service checks */}
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            {checks.map(c => (
              <div key={c.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: c.status === 'ok' ? 'rgba(0,255,157,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${c.status === 'ok' ? 'rgba(0,255,157,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.status === 'ok' ? '#00ff9d' : '#ef4444',
                }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.detail}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {c.status === 'ok'
                    ? <CheckCircle size={16} color="#00ff9d" />
                    : <XCircle size={16} color="#ef4444" />
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline capabilities */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '0.75rem' }}>DSP Pipeline Capabilities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.5rem' }}>
              {[
                { cat: 'File Formats', items: '.IQ, .WAV, .complex, .bin, .dat' },
                { cat: 'Modulations', items: 'BPSK, QPSK, 8-PSK, 16-QAM, 64-QAM, 2-FSK, 4-FSK' },
                { cat: 'Estimation', items: 'SNR, BW, Carrier Freq, Sample Rate, Symbol Rate' },
                { cat: 'Synchronization', items: 'Carrier recovery, Timing recovery, Frequency offset' },
                { cat: 'FEC', items: 'Viterbi (CCSDS K=7, r=1/2), Reed-Solomon GF(256)' },
                { cat: 'Bitstream', items: 'Extraction, Correlation, Header/payload detection' },
                { cat: 'Classification', items: 'Classical (statistical) + ML feature ensemble' },
                { cat: 'Output', items: 'JSON report, Hex stream, ASCII preview, Visualizations' },
              ].map(row => (
                <div key={row.cat} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{row.cat}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.items}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HealthPage;
