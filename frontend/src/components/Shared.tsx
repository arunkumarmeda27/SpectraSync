// Shared UI Component Suite for SpectraSync Signal Intelligence Workstation
import React from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Download,
  Maximize2,
  RefreshCw,
  Radio,
  Sliders,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useStore } from '../store';

// ─── Toast Container ──────────────────────────────────────────────────────────
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={16} color="#10b981" />}
          {t.type === 'error' && <AlertCircle size={16} color="#ef4444" />}
          {t.type === 'info' && <Info size={16} color="#38bdf8" />}
          <span style={{ flex: 1, fontWeight: 500 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'var(--primary)' }) => (
  <div
    className="spinner"
    style={{
      width: size,
      height: size,
      borderTopColor: color,
      display: 'inline-block'
    }}
  />
);

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────
export const SkeletonCard: React.FC<{ height?: number | string }> = ({ height = '140px' }) => (
  <div
    style={{
      height,
      background: 'linear-gradient(90deg, #0c1426 25%, #152445 50%, #0c1426 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite',
      borderRadius: '8px',
      border: '1px solid #152445'
    }}
  />
);

export const SkeletonText: React.FC<{ width?: string; height?: string }> = ({ width = '100%', height = '14px' }) => (
  <div
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, #101c36 25%, #1e3563 50%, #101c36 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite',
      borderRadius: '4px',
      margin: '4px 0'
    }}
  />
);

// ─── Status Badges ────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const norm = status?.toLowerCase() || 'unknown';
  let badgeClass = 'badge-muted';
  let label = status;

  if (norm === 'completed' || norm === 'success' || norm === 'operational' || norm === 'online') {
    badgeClass = 'badge-green';
  } else if (norm === 'running' || norm === 'processing' || norm === 'validating') {
    badgeClass = 'badge-cyan';
  } else if (norm === 'queued' || norm === 'waiting' || norm === 'pending') {
    badgeClass = 'badge-muted';
  } else if (norm === 'failed' || norm === 'error' || norm === 'offline' || norm === 'critical') {
    badgeClass = 'badge-danger';
  } else if (norm === 'degraded' || norm === 'warning') {
    badgeClass = 'badge-warning';
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
};

// ─── Confidence Badge ─────────────────────────────────────────────────────────
export const ConfidenceBadge: React.FC<{ confidence: number; label?: string }> = ({ confidence, label }) => {
  const pct = Math.round(confidence * 100);
  let badgeClass = 'badge-muted';
  let text = label || (confidence >= 0.85 ? 'HIGH' : confidence >= 0.6 ? 'MED' : confidence > 0 ? 'LOW' : 'N/A');

  if (confidence >= 0.85) {
    badgeClass = 'badge-high';
  } else if (confidence >= 0.6) {
    badgeClass = 'badge-medium';
  } else if (confidence > 0) {
    badgeClass = 'badge-low';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {text} {confidence > 0 ? `(${pct}%)` : ''}
    </span>
  );
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
  return <span className={`badge ${colorMap[mod] || 'badge-cyan'}`}>{mod}</span>;
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({
  value,
  color,
  height = 6
}) => (
  <div className="progress-bar" style={{ height }}>
    <div
      className="progress-fill"
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color || undefined
      }}
    />
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tag?: string;
}> = ({ title, subtitle, icon, actions, tag }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1rem',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      {icon && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(0, 229, 255, 0.15) 100%)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00e5ff'
          }}
        >
          {icon}
        </div>
      )}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
            {title}
          </h2>
          {tag && <span className="pill-live">{tag}</span>}
        </div>
        {subtitle && (
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '2px 0 0' }}>{subtitle}</p>
        )}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{actions}</div>}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div
    className="empty-state animate-fade-in"
    style={{
      background: 'rgba(12, 20, 38, 0.6)',
      border: '1px dashed #1a2a4f',
      borderRadius: '12px',
      padding: '3rem 2rem'
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'rgba(30, 58, 107, 0.2)',
        border: '1px solid #1a2a4f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        color: '#64748b'
      }}
    >
      {icon || <Radio size={24} />}
    </div>
    <h3 style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
      {title}
    </h3>
    {description && (
      <p style={{ color: '#64748b', fontSize: '0.78rem', maxWidth: '420px', marginBottom: '1.25rem', lineHeight: 1.4 }}>
        {description}
      </p>
    )}
    {action}
  </div>
);

// ─── Premium Metric Card ──────────────────────────────────────────────────────
export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  change?: string;
  changePositive?: boolean;
  color?: string;
  highlight?: boolean;
}> = ({ label, value, icon, sub, change, changePositive, color = '#3b82f6', highlight = false }) => (
  <div
    style={{
      background: highlight
        ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(12, 20, 38, 0.9) 100%)'
        : 'rgba(12, 20, 38, 0.85)',
      border: highlight ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid #162445',
      borderRadius: '8px',
      padding: '0.85rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      boxShadow: highlight ? '0 0 16px rgba(37, 99, 235, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s ease'
    }}
  >
    {icon && (
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '8px',
          background: `rgba(${color.startsWith('#') ? '37, 99, 235' : '37, 99, 235'}, 0.15)`,
          border: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          flexShrink: 0
        }}
      >
        {icon}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.15rem' }}>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#f8fafc',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </span>
        {change && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: changePositive ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {changePositive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>{sub}</div>}
    </div>
  </div>
);

// ─── Radial Confidence Meter ──────────────────────────────────────────────────
export const ConfidenceMeter: React.FC<{ value: number; size?: number; label?: string }> = ({
  value,
  size = 90,
  label = 'Confidence'
}) => {
  const pct = Math.round(Math.min(100, Math.max(0, value * 100)));
  const color = pct >= 85 ? '#10b981' : pct >= 60 ? '#38bdf8' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              filter: `drop-shadow(0 0 6px ${color}60)`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <span
            style={{
              fontSize: size > 80 ? '1.25rem' : '1rem',
              fontWeight: 800,
              color: '#f8fafc',
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1
            }}
          >
            {pct}%
          </span>
        </div>
      </div>
      {label && (
        <span
          style={{
            fontSize: '0.65rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

// ─── Signal Parameter Card ────────────────────────────────────────────────────
export const SignalParameterCard: React.FC<{
  title: string;
  value: string;
  unit?: string;
  confidence?: number;
  confidenceLabel?: string;
  description?: string;
  icon?: React.ReactNode;
}> = ({ title, value, unit, confidence, confidenceLabel, description, icon }) => (
  <div
    style={{
      background: 'rgba(12, 20, 38, 0.8)',
      border: '1px solid #162445',
      borderRadius: '8px',
      padding: '0.85rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      transition: 'all 0.15s ease'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
        {icon}
        <span>{title}</span>
      </div>
      {typeof confidence === 'number' && (
        <ConfidenceBadge confidence={confidence} label={confidenceLabel} />
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
      <span
        style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: '#f8fafc',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </span>
      {unit && (
        <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
          {unit}
        </span>
      )}
    </div>
    {description && (
      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem', lineHeight: 1.3 }}>
        {description}
      </div>
    )}
  </div>
);

// ─── Format Helpers ───────────────────────────────────────────────────────────
export const fmtSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const fmtFreq = (hz: number | null | undefined): string => {
  if (hz === null || hz === undefined || Number.isNaN(hz)) return '—';
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1)} kHz`;
  return `${hz.toFixed(0)} Hz`;
};

export const fmtRate = (rate: number | null | undefined): string => {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return '—';
  if (rate >= 1e6) return `${(rate / 1e6).toFixed(3)} MSps`;
  if (rate >= 1e3) return `${(rate / 1e3).toFixed(1)} kSps`;
  return `${rate.toFixed(0)} Sps`;
};

export const fmtSymbolRate = (rate: number | null | undefined): string => {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return '—';
  if (rate >= 1e6) return `${(rate / 1e6).toFixed(3)} MSym/s`;
  if (rate >= 1e3) return `${(rate / 1e3).toFixed(1)} kSym/s`;
  return `${rate.toFixed(0)} Sym/s`;
};

export const fmtDuration = (sec: number | null | undefined): string => {
  if (sec === null || sec === undefined) return '—';
  if (sec < 0.001) return `${(sec * 1e6).toFixed(1)} μs`;
  if (sec < 1) return `${(sec * 1000).toFixed(2)} ms`;
  return `${sec.toFixed(3)} s`;
};

export const fmtDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return iso;
  }
};
