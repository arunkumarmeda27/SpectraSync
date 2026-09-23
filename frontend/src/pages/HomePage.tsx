import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { getDemoPreview } from '../api';
import type { FullAnalysisResult, ParameterEstimate } from '../types/visualizations';
import {
  Waves,
  Shield,
  Upload,
  Cpu,
  Activity,
  Radio,
  FileText,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  Lock,
  Database,
  Server,
  Layers,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Radar,
  Search,
  Globe,
  MonitorDot,
  Binary,
} from 'lucide-react';
import {
  LiveSignalSpectrum,
  WaterfallSpectrogram,
  TimeDomainWaveform,
  ConstellationDiagram,
} from '../components/DashboardPlots';

const formatPreviewParameter = (parameter?: ParameterEstimate) => {
  if (!parameter || typeof parameter.value !== 'number') return '—';
  return `${parameter.value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${parameter.unit}`;
};

const useDemoPreview = () => {
  const [preview, setPreview] = useState<FullAnalysisResult | null>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    getDemoPreview().then(setPreview).catch(() => setPreviewError(true));
  }, []);

  return { preview, previewError };
};

/* ═══════════════════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════════════════ */

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const workstationPath = isAuthenticated ? '/dashboard' : '/login';

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(1.5rem, 5vw, 4rem)',
        background: scrolled ? 'rgba(6,9,19,0.95)' : 'rgba(6,9,19,0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid rgba(21,36,69,0.6)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #00e5ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0,229,255,0.35)',
          }}
        >
          <Waves size={17} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          SPECTRA<span style={{ color: '#00e5ff' }}>SYNC</span>
        </span>
      </div>

      <div className="hp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {[
          { label: 'Platform', id: 'platform' },
          { label: 'Pipeline', id: 'pipeline' },
          { label: 'Capabilities', id: 'capabilities' },
          { label: 'Docs', href: 'https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs' },
        ].map((link) => (
          <button
            key={link.label}
            onClick={() => {
              if ('href' in link) window.open(link.href, '_blank');
              else document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.4rem 0.75rem',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            {link.label}
          </button>
        ))}
        <a
          href="https://github.com/arunkumarmeda27/SpectraSync"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem',
            textDecoration: 'none',
            padding: '0.4rem 0.75rem',
            borderRadius: 6,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ExternalLink size={15} />
          GitHub
        </a>
        <button
          className="btn-workstation-primary"
          onClick={() => navigate(workstationPath)}
          style={{ fontSize: '0.875rem', marginLeft: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          Open Workstation
        </button>
      </div>

      <button
        className="hp-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ display: 'none', background: 'none', border: 'none', color: '#f1f5f9', cursor: 'pointer', padding: 4 }}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            right: 0,
            background: 'rgba(6,9,19,0.98)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(21,36,69,0.6)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <button
            className="btn-workstation-primary"
            onClick={() => {
              setMenuOpen(false);
              navigate(workstationPath);
            }}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Open Workstation
          </button>
        </div>
      )}
    </nav>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const workstationPath = isAuthenticated ? '/dashboard' : '/login';
  const { preview, previewError } = useDemoPreview();
  const previewModulation = preview?.primary_modulation || preview?.modulation?.primary_modulation || '—';

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(6rem, 12vh, 8rem) clamp(1.5rem, 5vw, 4rem) clamp(3rem, 8vh, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '15%', left: '25%', width: '50%', height: '50%', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(2.5rem, 6vw, 5rem)', alignItems: 'center', width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ maxWidth: 600 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(0,229,255,0.25)',
              background: 'rgba(0,229,255,0.05)',
              borderRadius: 99,
              padding: '0.35rem 1rem',
              marginBottom: '1.75rem',
            }}
          >
            <Shield size={13} color="#00e5ff" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AUTOMATED SIGNAL INTELLIGENCE WORKSTATION
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.08, color: '#f1f5f9', marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>
            From Raw Recordings to
            <br />
            <span style={{ background: 'linear-gradient(135deg, #00e5ff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Meaningful Signal Insights
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 1.15vw, 1.1rem)', color: '#94a3b8', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            SpectraSync analyzes IQ/WAV recordings through an automated DSP pipeline, estimates signal parameters, classifies modulation, performs synchronization/demodulation and bitstream analysis, and generates analysis reports.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <button
              className="btn-workstation-primary"
              onClick={() => navigate(workstationPath)}
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Open Workstation <ChevronRight size={18} />
            </button>
            <a
              href="https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-workstation-secondary"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              View Documentation <ExternalLink size={16} />
            </a>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['React 18', 'TypeScript 5', 'FastAPI', 'Python 3.11+', 'Docker'].map((tech) => (
              <span
                key={tech}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#64748b',
                  background: 'rgba(15,26,51,0.7)',
                  border: '1px solid #162445',
                  borderRadius: 5,
                  padding: '0.25rem 0.65rem',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(12,20,38,0.8)',
            border: '1px solid rgba(21,36,69,0.6)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,229,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(21,36,69,0.5)', background: 'rgba(8,15,31,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={15} color="#00e5ff" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>LIVE SIGNAL SPECTRUM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, color: '#10b981' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              LIVE
            </div>
          </div>
          <div style={{ padding: '1rem', height: 220, background: '#0a0f1e' }}>
            {preview ? <LiveSignalSpectrum data={preview.visualizations.fft} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: previewError ? '#f59e0b' : '#64748b', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>{previewError ? 'BACKEND REQUIRED FOR GOLDEN SIGNAL' : 'LOADING GOLDEN_QPSK ANALYSIS'}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', padding: '1rem', background: 'rgba(8,15,31,0.4)' }}>
            {[
              { label: 'CENTER FREQ', value: formatPreviewParameter(preview?.parameters.carrier_frequency), sublabel: 'golden_qpsk.iq' },
              { label: 'BANDWIDTH', value: formatPreviewParameter(preview?.parameters.bandwidth), sublabel: 'estimated' },
              { label: 'SNR', value: formatPreviewParameter(preview?.parameters.snr), sublabel: 'estimated' },
              { label: 'MODULATION', value: previewModulation, sublabel: 'classified', highlight: true },
            ].map((param) => (
              <div key={param.label} style={{ background: '#0a101f', border: '1px solid #162445', borderRadius: 6, padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  {param.label}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: param.highlight ? '#38bdf8' : '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.15rem' }}>
                  {param.value}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#475569', fontStyle: 'italic' }}>{param.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CAPABILITY STRIP
   ═══════════════════════════════════════════════════════════════════════════ */

const CapabilityStrip: React.FC = () => (
  <section style={{ padding: '2.5rem clamp(1.5rem,5vw,4rem)', borderTop: '1px solid rgba(16,28,54,0.6)', borderBottom: '1px solid rgba(16,28,54,0.6)', background: 'rgba(8,13,26,0.3)' }}>
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
      {[
        { value: '13', label: 'DSP Pipeline Stages' },
        { value: '6', label: 'Golden Demo Signals' },
        { value: '33', label: 'Tests Passing' },
        { value: '5', label: 'Core Visualization Types' },
      ].map((capability) => (
        <div key={capability.label} style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <div style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 800, color: '#00e5ff', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.4rem' }}>
            {capability.value}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {capability.label}
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   WORKFLOW SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

const WorkflowSection: React.FC = () => {
  const steps = [
    { num: '01', title: 'SIGNAL INGESTION', desc: 'Upload and validate IQ/WAV signal recordings', icon: Upload },
    { num: '02', title: 'DSP PROCESSING', desc: 'Run the automated signal-processing pipeline', icon: Cpu },
    { num: '03', title: 'PARAMETER + MODULATION ANALYSIS', desc: 'Estimate carrier frequency, bandwidth, symbol rate, SNR and classify modulation', icon: Radio },
    { num: '04', title: 'DEMODULATION + BITSTREAM', desc: 'Perform synchronization, demodulation, de-interleaving, FEC and bitstream analysis', icon: Activity },
    { num: '05', title: 'CORRELATION + REPORTING', desc: 'Aggregate results and generate analysis artifacts', icon: FileText },
  ];

  return (
    <section id="pipeline" style={{ padding: 'clamp(4rem,8vh,6rem) clamp(1.5rem,5vw,4rem)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: 700, margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, marginBottom: '1rem' }}>
            From Raw RF IQ to Decoded Intelligence
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.65 }}>
            SpectraSync automates the complete signal analysis workflow
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.num}>
                <div
                  style={{
                    background: 'rgba(12,20,38,0.6)',
                    border: '1px solid rgba(21,36,69,0.5)',
                    borderRadius: 10,
                    padding: '1.75rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    flex: '1 1 220px',
                    maxWidth: 280,
                    minWidth: 220,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00e5ff', fontFamily: 'JetBrains Mono, monospace' }}>{step.num}</span>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color="#00e5ff" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0, lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', color: '#1e3563', paddingTop: '2rem' }}>
                    <ArrowRight size={22} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MULTI-DOMAIN ANALYTICAL ENVIRONMENT
   ═══════════════════════════════════════════════════════════════════════════ */

const PreviewLoading: React.FC = () => (
  <div style={{ height: '100%', minHeight: 110, display: 'grid', placeItems: 'center', color: '#64748b', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>
    LOADING GOLDEN_QPSK ANALYSIS
  </div>
);

const AnalysisShowcase: React.FC = () => {
  const { preview, previewError } = useDemoPreview();
  const visualizations = preview?.visualizations;
  const parameters = preview?.parameters;
  const previewModulation = preview?.primary_modulation || preview?.modulation?.primary_modulation || '—';
  const parameterRows: Array<[string, ParameterEstimate | undefined]> = [
    ['Sample Rate', parameters?.sample_rate],
    ['Carrier Frequency', parameters?.carrier_frequency],
    ['Bandwidth', parameters?.bandwidth],
    ['Symbol Rate', parameters?.symbol_rate],
    ['SNR', parameters?.snr],
  ];

  return (
    <section id="capabilities" style={{ padding: 'clamp(4rem,8vh,6rem) clamp(1.5rem,5vw,4rem)', background: 'rgba(8,13,26,0.4)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: 700, margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, marginBottom: '1rem' }}>
            Multi-Domain Signal Analysis Environment
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.65 }}>
            Real FFT, STFT, waveform, and constellation output from the built-in golden QPSK signal
          </p>
        </div>

        <div className="hp-analysis-layout">
          <div className="hp-analysis-graphs" style={{ background: 'rgba(12,20,38,0.8)', border: '1px solid rgba(21,36,69,0.5)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(16,28,54,0.5)', background: 'rgba(8,15,31,0.6)' }}>
              <MonitorDot size={15} color="#00e5ff" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>ANALYSIS DASHBOARD</span>
              <span style={{ marginLeft: 'auto', color: preview ? '#10b981' : '#f59e0b', fontSize: '0.6rem', fontWeight: 700 }}>{preview ? 'GOLDEN_QPSK · COMPLETE' : previewError ? 'BACKEND REQUIRED' : 'LOADING'}</span>
            </div>
            <div className="hp-analysis-panels" style={{ padding: '1rem', background: '#0a0f1e' }}>
              <div className="hp-analysis-panel hp-spectrum-panel" style={{ background: '#0a101f', border: '1px solid #162445', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid #101c36', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>LIVE SIGNAL SPECTRUM · FFT</div>
                <div style={{ height: 260, padding: '0.5rem' }}>{visualizations ? <LiveSignalSpectrum data={visualizations.fft} /> : <PreviewLoading />}</div>
              </div>
              <div className="hp-analysis-panel hp-waterfall-panel" style={{ background: '#0a101f', border: '1px solid #162445', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid #101c36', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>STFT WATERFALL</div>
                <div style={{ height: 230, padding: '0.5rem' }}>{visualizations ? <WaterfallSpectrogram data={visualizations.spectrogram} /> : <PreviewLoading />}</div>
              </div>
              <div className="hp-analysis-panel hp-waveform-panel" style={{ background: '#0a101f', border: '1px solid #162445', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid #101c36', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>TIME DOMAIN I/Q</div>
                <div style={{ height: 230, padding: '0.5rem' }}>{visualizations ? <TimeDomainWaveform data={visualizations.waveform} /> : <PreviewLoading />}</div>
              </div>
              <div className="hp-analysis-panel hp-constellation-panel" style={{ background: '#0a101f', border: '1px solid #162445', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid #101c36', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>I/Q CONSTELLATION · {previewModulation === '—' ? 'GOLDEN SIGNAL' : previewModulation}</div>
                <div style={{ height: 260, padding: '0.5rem' }}>{visualizations ? <ConstellationDiagram data={visualizations.constellation} modulation={previewModulation === '—' ? undefined : previewModulation} /> : <PreviewLoading />}</div>
              </div>
            </div>
          </div>

          <div className="hp-analysis-parameters" style={{ background: 'rgba(12,20,38,0.8)', border: '1px solid rgba(21,36,69,0.5)', borderRadius: 12, overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(16,28,54,0.5)', background: 'rgba(8,15,31,0.6)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={15} color="#00e5ff" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>SIGNAL PARAMETERS</span>
            </div>
            <div style={{ padding: '1rem' }}>
              {parameterRows.map(([label, parameter]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: '1px solid #101c36', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{formatPreviewParameter(parameter)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Modulation</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>{previewModulation}</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>SOURCE: data/golden/golden_qpsk.iq</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   BITSTREAM SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

const BitstreamSection: React.FC = () => {
  const { preview, previewError } = useDemoPreview();
  const bitstream = (preview?.bitstream || {}) as Record<string, unknown>;
  const hexStream = typeof bitstream.hex_stream === 'string' ? bitstream.hex_stream : '';
  const asciiStream = typeof bitstream.ascii_stream === 'string' ? bitstream.ascii_stream : '';
  const headers = Array.isArray(bitstream.headers) ? bitstream.headers : [];
  const hexRows = hexStream.match(/.{1,48}/g) || [];
  const bitCount = Number(bitstream.length || bitstream.total_bits || 0);
  const bitDensity = Number(bitstream.bit_density || 0);
  const correlationScore = Number(bitstream.correlation_score || 0);
  const bitRate = Number(bitstream.bit_rate_bps || 0);

  return (
    <section style={{ padding: 'clamp(4rem,8vh,6rem) clamp(1.5rem,5vw,4rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: 700, margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, marginBottom: '1rem' }}>
            Bitstream Parsing & Frame Synchronization
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.65 }}>
            Recovered output from the same golden QPSK analysis: offsets, hex/ASCII streams, and detected headers.
          </p>
        </div>

        <div style={{ background: 'rgba(12,20,38,0.8)', border: '1px solid rgba(21,36,69,0.5)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(16,28,54,0.5)', background: 'rgba(8,15,31,0.6)' }}>
            <Binary size={15} color="#00e5ff" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>BIT STREAM ANALYSIS</span>
            <span style={{ marginLeft: 'auto', color: preview ? '#10b981' : '#f59e0b', fontSize: '0.6rem', fontWeight: 700 }}>{preview ? 'GOLDEN_QPSK' : previewError ? 'BACKEND REQUIRED' : 'LOADING'}</span>
          </div>
          <div className="hp-bitstream-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', padding: '0.8rem 1.25rem', background: '#0b1220', borderBottom: '1px solid #101c36' }}>
            {[
              ['RECOVERED BITS', bitCount.toLocaleString()],
              ['BIT DENSITY', `${(bitDensity * 100).toFixed(2)}%`],
              ['CORRELATION', correlationScore.toFixed(3)],
              ['HEADERS', headers.length.toString()],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ color: '#64748b', fontSize: '0.58rem' }}>{label}</div>
                <div style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '1.25rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', lineHeight: 1.8, background: '#0a0f1e' }}>
            {preview ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', color: '#64748b', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  <span>OFFSET</span><span>HEX STREAM</span>
                </div>
                {hexRows.slice(0, 6).map((row, index) => (
                  <div key={`${row}-${index}`} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', padding: '0.25rem 0' }}>
                    <span style={{ color: '#38bdf8' }}>{(index * 24).toString(16).padStart(8, '0').toUpperCase()}</span>
                    <span style={{ color: '#f8fafc', overflowWrap: 'anywhere' }}>{row}</span>
                  </div>
                ))}
                <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#94a3b8' }}>
                  <span>ASCII: <strong style={{ color: '#a7f3d0', overflowWrap: 'anywhere' }}>{asciiStream || 'No printable ASCII recovered'}</strong></span>
                  <span>BIT RATE: <strong style={{ color: '#10b981' }}>{bitRate ? `${bitRate.toLocaleString()} bps` : 'Not reported'}</strong></span>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #101c36', color: '#94a3b8' }}>
                  <div style={{ color: '#64748b', marginBottom: '0.45rem' }}>DETECTED SYNCHRONIZATION PATTERNS</div>
                  {headers.slice(0, 4).map((header, index) => {
                    const item = typeof header === 'object' && header !== null ? header as Record<string, unknown> : {};
                    return <div key={`${String(item.header_type || 'header')}-${index}`} style={{ color: '#a7f3d0' }}>{String(item.header_type || 'Known pattern')} · bit {String(item.bit_offset ?? 0)} · {String(item.confidence ?? 'matched')}</div>;
                  })}
                </div>
              </>
            ) : <PreviewLoading />}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   REPORTS SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

const ReportsSection: React.FC = () => {
  const { preview, previewError } = useDemoPreview();
  const formats = ['PDF', 'CSV', 'JSON'];

  return (
    <section style={{ padding: 'clamp(4rem,8vh,6rem) clamp(1.5rem,5vw,4rem)', background: 'rgba(8,13,26,0.4)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: 700, margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, marginBottom: '1rem' }}>Automated Signal Reports & Export</h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.65 }}>The same completed analysis can be exported from the authenticated Reports workspace.</p>
        </div>

        <div style={{ background: 'rgba(12,20,38,0.8)', border: '1px solid rgba(21,36,69,0.5)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(16,28,54,0.5)', background: 'rgba(8,15,31,0.6)' }}>
            <FileText size={15} color="#00e5ff" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>SUPPORTED EXPORT FORMATS</span>
            <span style={{ marginLeft: 'auto', color: preview ? '#10b981' : '#f59e0b', fontSize: '0.6rem', fontWeight: 700 }}>{preview ? `${preview.primary_modulation} ANALYSIS READY` : previewError ? 'BACKEND REQUIRED' : 'LOADING'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '1rem', background: '#0a0f1e' }}>
            {formats.map(format => (
              <div key={format} style={{ border: '1px solid #162445', background: '#0a101f', borderRadius: 6, padding: '1rem' }}>
                <div style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.35rem' }}>{format}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.5 }}>{format === 'PDF' ? 'Forensic report' : format === 'CSV' ? 'Parameter metrics' : 'Full analysis telemetry'}</div>
                <div style={{ color: '#64748b', fontSize: '0.62rem', marginTop: '0.75rem' }}>Available for completed jobs</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const ApplicationsSection: React.FC = () => {
  const apps = [
    { title: 'RF Signal Analysis', desc: 'Automated analysis of captured RF recordings with parameter estimation', icon: Radar },
    { title: 'Spectrum Research', desc: 'Multi-domain visualization for academic and commercial research', icon: Search },
    { title: 'Communication Systems', desc: 'Demodulation, bitstream recovery, and protocol analysis', icon: Globe },
    { title: 'Signal Intelligence', desc: 'Structured SIGINT workflows with forensic reporting', icon: Shield },
  ];

  return (
    <section style={{ padding: 'clamp(4rem,8vh,6rem) clamp(1.5rem,5vw,4rem)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: 700, margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, marginBottom: '1rem' }}>
            Operational Environments
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.65 }}>
            Built for RF engineers, researchers, and defense analysts
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.title}
                style={{
                  background: 'rgba(12,20,38,0.6)',
                  border: '1px solid rgba(21,36,69,0.5)',
                  borderRadius: 10,
                  padding: '1.75rem 1.5rem',
                  transition: 'border-color 0.25s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(21,36,69,0.5)')}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(0,229,255,0.06)',
                    border: '1px solid rgba(0,229,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <Icon size={22} color="#00e5ff" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.65rem', lineHeight: 1.3 }}>{app.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{app.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ARCHITECTURE
   ═══════════════════════════════════════════════════════════════════════════ */

const ArchitectureSection: React.FC = () => {
  const layers = [
    { label: 'React + TypeScript', sub: 'Dark Workstation UI', icon: Layers },
    { label: 'FastAPI', sub: 'REST API + WebSocket', icon: Server },
    { label: 'Worker Pool', sub: 'Redis / In-Memory Queue', icon: Cpu },
    { label: 'DSP Pipeline', sub: '13 Automated Stages', icon: Activity },
    { label: 'Database / Storage', sub: 'SQLite / PostgreSQL', icon: Database },
  ];

  const security = ['JWT Authentication', 'PBKDF2-HMAC-SHA256', 'Role-Based Access (RBAC)', 'SHA-256 File Integrity', 'Protected API Routes', 'Pydantic Validation'];

  return (
    <section id="platform" style={{ padding: 'clamp(4rem,8vh,6rem) clamp(1.5rem,5vw,4rem)', background: 'rgba(8,13,26,0.4)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15 }}>
            Production-Grade Architecture
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              {layers.map((layer, i) => {
                const Icon = layer.icon;
                return (
                  <React.Fragment key={layer.label}>
                    <div
                      style={{
                        background: 'rgba(12,20,38,0.6)',
                        border: '1px solid rgba(21,36,69,0.5)',
                        borderRadius: 10,
                        padding: '1.25rem 1.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        width: '100%',
                        maxWidth: 400,
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} color="#00e5ff" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>{layer.label}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{layer.sub}</div>
                      </div>
                    </div>
                    {i < layers.length - 1 && <div style={{ width: 1, height: 20, background: 'rgba(21,36,69,0.6)' }} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'rgba(12,20,38,0.8)', border: '1px solid rgba(21,36,69,0.5)', borderRadius: 12, overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(16,28,54,0.5)', background: 'rgba(8,15,31,0.6)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={15} color="#00e5ff" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>SECURITY ARCHITECTURE</span>
            </div>
            <div style={{ padding: '0.75rem 0', background: '#0a0f1e' }}>
              {security.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid #101c36', fontSize: '0.9rem', color: '#94a3b8' }}>
                  <CheckCircle2 size={15} color="#10b981" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════════════════════════════════ */

const FinalCTA: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const workstationPath = isAuthenticated ? '/dashboard' : '/login';

  return (
    <section style={{ padding: 'clamp(4rem,8vh,6rem) clamp(1.5rem,5vw,4rem)' }}>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(168,85,247,0.08) 100%)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 16,
          padding: 'clamp(2.5rem, 5vw, 4rem)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: '1rem', lineHeight: 1.2 }}>
          Ready to Analyze Your Signals?
        </h2>
        <p style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: 580, margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
          Explore the SpectraSync workstation — from raw RF recordings to structured signal intelligence.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn-workstation-primary" onClick={() => navigate(workstationPath)} style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            Open Workstation
          </button>
          <a
            href="https://github.com/arunkumarmeda27/SpectraSync"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-workstation-secondary"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ExternalLink size={18} /> View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

const Footer: React.FC = () => (
  <footer style={{ borderTop: '1px solid rgba(16,28,54,0.6)', padding: 'clamp(2.5rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 4rem) 2rem', background: '#060913' }}>
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '2.5rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Waves size={18} color="#00e5ff" />
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9' }}>
            SPECTRA<span style={{ color: '#00e5ff' }}>SYNC</span>
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, maxWidth: 280 }}>
          Automated Signal Intelligence Workstation.
          <br />
          Built for SIH26147.
        </p>
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>DOCUMENTATION</div>
        {[
          { label: 'API Reference', href: 'https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs/api_reference.md' },
          { label: 'DSP Pipeline', href: 'https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs/dsp_pipeline.md' },
          { label: 'Architecture', href: 'https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs/architecture.md' },
          { label: 'GitHub', href: 'https://github.com/arunkumarmeda27/SpectraSync' },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'none', padding: '0.3rem 0', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>TECH STACK</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {['React', 'TypeScript', 'FastAPI', 'NumPy', 'SciPy', 'scikit-learn', 'Docker'].map((tech) => (
            <span
              key={tech}
              style={{
                fontSize: '0.675rem',
                fontWeight: 600,
                color: '#64748b',
                background: 'rgba(15,26,51,0.7)',
                border: '1px solid #162445',
                borderRadius: 4,
                padding: '0.2rem 0.5rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div style={{ maxWidth: 1400, margin: '2.5rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(16,28,54,0.6)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.75rem', color: '#475569' }}>© 2026 SpectraSync · MIT License · Smart India Hackathon</span>
      <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>SIH26147 · v1.0.0</span>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const styles = `
.hp-analysis-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(270px, 1fr);
  gap: 1.5rem;
  align-items: start;
}
.hp-analysis-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.hp-spectrum-panel,
.hp-constellation-panel { grid-column: 1 / -1; }
.hp-analysis-panel { min-width: 0; }
.hp-analysis-panel canvas { max-width: 100%; }
.hp-bitstream-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }

@media (max-width: 1280px) {
  .hp-nav-links { gap: 0.5rem !important; }
}

@media (max-width: 1024px) {
  .hp-nav-links { display: none !important; }
  .hp-hamburger { display: flex !important; }
}

@media (max-width: 900px) {
  section#hero > div > div { grid-template-columns: 1fr !important; }
  section#capabilities > div > div { grid-template-columns: 1fr 1fr !important; }
  section#platform > div > div { grid-template-columns: 1fr !important; }
  .hp-analysis-layout { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  section#capabilities > div > div { grid-template-columns: 1fr !important; }
  .hp-analysis-panels { grid-template-columns: 1fr; }
  .hp-spectrum-panel,
  .hp-constellation-panel { grid-column: auto; }
  .hp-bitstream-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
}

html {
  scroll-behavior: smooth;
}

body {
  overflow-x: hidden;
  max-width: 100vw;
}
`;

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const HomePage: React.FC = () => (
  <div style={{ background: '#060913', minHeight: '100vh', color: '#f1f5f9', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
    <style>{styles}</style>
    <Navbar />
    <main>
      <HeroSection />
      <CapabilityStrip />
      <WorkflowSection />
      <AnalysisShowcase />
      <BitstreamSection />
      <ReportsSection />
      <ApplicationsSection />
      <ArchitectureSection />
      <FinalCTA />
    </main>
    <Footer />
  </div>
);

export default HomePage;
