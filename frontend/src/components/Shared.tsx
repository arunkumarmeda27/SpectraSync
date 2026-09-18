// Shared utility components
import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../store';

// ─── Toast Container ──────────────────────────────────────────────────────────
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={16} />}
          {t.type === 'error' && <AlertCircle size={16} />}
          {t.type === 'info' && <Info size={16} />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div className="spinner" style={{ width: size, height: size }} />
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    completed: 'badge-green',
    running: 'badge-cyan',
    validating: 'badge-cyan',
    queued: 'badge-muted',
    failed: 'badge-danger',
    pending: 'badge-muted',
  };
  const cls = map[status] || 'badge-muted';
  return <span className={`badge ${cls}`}>{status}</span>;
};

// ─── Modulation Badge ─────────────────────────────────────────────────────────
export const ModBadge: React.FC<{ mod: string }> = ({ mod }) => {
  const colorMap: Record<string, string> = {
    BPSK: 'badge-cyan',
    QPSK: 'badge-purple',
    '8PSK': 'badge-purple',
    '16QAM': 'badge-warning',
    '64QAM': 'badge-warning',
    '2FSK': 'badge-green',
    '4FSK': 'badge-green',
    UNKNOWN: 'badge-muted',
  };
  return <span className={`badge ${colorMap[mod] || 'badge-muted'}`}>{mod}</span>;
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="progress-bar">
    <div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: subtitle ? '0.25rem' : 0 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }> = ({
  icon, title, description, action
}) => (
  <div className="empty-state animate-fade-in">
    {icon && <div className="empty-state-icon">{icon}</div>}
    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{title}</h3>
    {description && <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{description}</p>}
    {action}
  </div>
);

// ─── Confidence Meter ─────────────────────────────────────────────────────────
export const ConfidenceMeter: React.FC<{ value: number; label?: string }> = ({ value, label }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#00ff9d' : pct >= 60 ? '#00d4ff' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg width={100} height={100} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color, lineHeight: 1 }}>{pct}%</span>
        </div>
      </div>
      {label && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string; value: string | number; icon?: React.ReactNode;
  sub?: string; color?: string;
}> = ({ label, value, icon, sub, color }) => (
  <div className="stat-card animate-fade-in">
    <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
      <span className="stat-label">{label}</span>
      {icon && <span style={{ color: color || 'var(--accent-primary)', opacity: 0.7 }}>{icon}</span>}
    </div>
    <div className="stat-value" style={color ? { background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : {}}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
  </div>
);

// ─── File Size Formatter ──────────────────────────────────────────────────────
export const fmtSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const fmtFreq = (hz: number | null): string => {
  if (hz === null) return '—';
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1)} kHz`;
  return `${hz} Hz`;
};

export const fmtDuration = (sec: number | null): string => {
  if (sec === null) return '—';
  if (sec < 0.001) return `${(sec * 1e6).toFixed(1)} μs`;
  if (sec < 1) return `${(sec * 1000).toFixed(2)} ms`;
  return `${sec.toFixed(3)} s`;
};

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
