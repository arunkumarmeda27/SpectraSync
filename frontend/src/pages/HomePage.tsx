import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Signal,
  BarChart3,
  Radar,
  Search,
  Globe,
  MonitorDot,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Intersection Observer hook for scroll-triggered fade-in */
function useFadeIn(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
}

const fadeStyle = (visible: boolean): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(24px)',
  transition: 'opacity 0.7s ease, transform 0.7s ease',
});

/** Smooth-scroll to an element by id */
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADING
   ═══════════════════════════════════════════════════════════════════════════ */
const SectionHeading: React.FC<{ eyebrow?: string; title: string; subtitle?: string }> = ({
  eyebrow,
  title,
  subtitle,
}) => (
  <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
    {eyebrow && (
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#38bdf8',
          marginBottom: '0.75rem',
        }}
      >
        {eyebrow}
      </div>
    )}
    <h2
      style={{
        fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
        fontWeight: 800,
        color: '#f1f5f9',
        lineHeight: 1.2,
        marginBottom: subtitle ? '0.75rem' : 0,
      }}
    >
      {title}
    </h2>
    {subtitle && (
      <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
        {subtitle}
      </p>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { label: 'Platform', target: 'platform' },
  { label: 'Pipeline', target: 'pipeline' },
  { label: 'Capabilities', target: 'capabilities' },
  { label: 'Demos', target: 'demos' },
  { label: 'Docs', href: 'https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs' },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="hp-navbar"
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
        padding: '0 clamp(1rem, 4vw, 3rem)',
        background: scrolled ? 'rgba(6,9,19,0.92)' : 'rgba(6,9,19,0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #152445' : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s',
      }}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        onClick={() => scrollTo('hero')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && scrollTo('hero')}
        aria-label="Scroll to top"
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #00e5ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0,229,255,0.4)',
          }}
        >
          <Waves size={17} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.01em' }}>
          SPECTRA<span style={{ color: '#00e5ff' }}>SYNC</span>
        </span>
      </div>

      {/* Desktop Links */}
      <div className="hp-nav-links">
        {NAV_LINKS.map((l) =>
          l.href ? (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 500,
                padding: '0.35rem 0.6rem',
                borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              {l.label}
            </a>
          ) : (
            <button
              key={l.label}
              onClick={() => scrollTo(l.target!)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 500,
                padding: '0.35rem 0.6rem',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              {l.label}
            </button>
          ),
        )}
      </div>

      {/* Desktop Right */}
      <div className="hp-nav-right">
        <a
          href="https://github.com/arunkumarmeda27/SpectraSync"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
          style={{
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            textDecoration: 'none',
            padding: '0.3rem 0.5rem',
            borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <Github size={16} />
          <span>GitHub</span>
        </a>
        <button className="btn-workstation-primary" onClick={() => navigate('/login')} style={{ fontSize: '0.78rem' }}>
          Open Workstation
        </button>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="hp-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        style={{
          background: 'none',
          border: 'none',
          color: '#f1f5f9',
          cursor: 'pointer',
          padding: 4,
        }}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="hp-mobile-menu"
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            right: 0,
            background: 'rgba(6,9,19,0.97)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #152445',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {NAV_LINKS.map((l) =>
            l.href ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', padding: '0.5rem 0' }}
              >
                {l.label}
              </a>
            ) : (
              <button
                key={l.label}
                onClick={() => {
                  scrollTo(l.target!);
                  setMenuOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                }}
              >
                {l.label}
              </button>
            ),
          )}
          <div style={{ borderTop: '1px solid #152445', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <a
              href="https://github.com/arunkumarmeda27/SpectraSync"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setMenuOpen(false)}
            >
              <Github size={15} /> GitHub
            </a>
            <button
              className="btn-workstation-primary"
              onClick={() => {
                setMenuOpen(false);
                navigate('/login');
              }}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              Open Workstation
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED SPECTRUM VISUALIZATION (Hero right side)
   ═══════════════════════════════════════════════════════════════════════════ */

const SpectrumVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef(0);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const W = cvs.width;
    const H = cvs.height;
    const t = Date.now() / 1000;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(21,36,69,0.6)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < H; y += H / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x < W; x += W / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Noise floor + signal spectrum
    ctx.beginPath();
    ctx.moveTo(0, H);

    for (let x = 0; x <= W; x++) {
      const nx = x / W;
      // Noise floor
      let y = H * 0.75 + Math.random() * 4 - 2;

      // Main signal peak around 0.55
      const p1 = Math.exp(-Math.pow((nx - 0.55) * 8, 2)) * H * 0.55;
      // Secondary peak around 0.3
      const p2 = Math.exp(-Math.pow((nx - 0.3) * 12, 2)) * H * 0.25;
      // Small peak around 0.78
      const p3 = Math.exp(-Math.pow((nx - 0.78) * 14, 2)) * H * 0.18;

      // Animate peaks subtly
      const anim = Math.sin(t * 1.5 + nx * 6) * 3;

      y -= p1 + p2 + p3 + anim;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(W, H);
    ctx.closePath();

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,229,255,0.25)');
    grad.addColorStop(0.5, 'rgba(0,229,255,0.08)');
    grad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke line
    ctx.beginPath();
    ctx.moveTo(0, H * 0.75);
    for (let x = 0; x <= W; x++) {
      const nx = x / W;
      let y = H * 0.75 + Math.random() * 2 - 1;
      const p1 = Math.exp(-Math.pow((nx - 0.55) * 8, 2)) * H * 0.55;
      const p2 = Math.exp(-Math.pow((nx - 0.3) * 12, 2)) * H * 0.25;
      const p3 = Math.exp(-Math.pow((nx - 0.78) * 14, 2)) * H * 0.18;
      const anim = Math.sin(t * 1.5 + nx * 6) * 3;
      y -= p1 + p2 + p3 + anim;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Peak marker
    const peakX = W * 0.55;
    const peakY = H * 0.75 - H * 0.55 + Math.sin(t * 1.5 + 0.55 * 6) * 3;
    ctx.beginPath();
    ctx.arc(peakX, peakY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();

    // Frequency label
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('437.5 MHz', peakX + 8, peakY - 6);

    // Axes labels
    ctx.fillStyle = '#475569';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText('FREQUENCY (MHz)', W / 2 - 44, H - 4);
    ctx.save();
    ctx.translate(10, H / 2 + 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('POWER (dBm)', 0, 0);
    ctx.restore();

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Draw once
      draw();
      cancelAnimationFrame(animRef.current);
      return;
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const paramCards = [
    { label: 'CENTER FREQ', value: '437.5 MHz' },
    { label: 'BANDWIDTH', value: '25.0 kHz' },
    { label: 'SNR', value: '24.2 dB' },
    { label: 'MODULATION', value: 'QPSK' },
  ];

  return (
    <div
      className="hp-spectrum-card"
      style={{
        background: '#0c1426',
        border: '1px solid #152445',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,229,255,0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid #152445',
          background: 'rgba(13,22,44,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Activity size={14} color="#00e5ff" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>SIGNAL ANALYSIS</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '0.15rem 0.5rem',
            borderRadius: 99,
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#10b981',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          ANALYSIS COMPLETE
        </div>
      </div>

      {/* Canvas */}
      <div style={{ padding: '0.75rem', paddingBottom: 0 }}>
        <canvas
          ref={canvasRef}
          width={480}
          height={180}
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}
          aria-label="Animated spectrum analyzer visualization preview — demonstration data, not live analysis"
        />
      </div>

      {/* Parameter cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', padding: '0.75rem 0.75rem' }}>
        {paramCards.map((p) => (
          <div
            key={p.label}
            style={{
              background: '#091022',
              border: '1px solid #101c36',
              borderRadius: 6,
              padding: '0.4rem 0.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
              {p.label}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: p.label === 'MODULATION' ? '#38bdf8' : '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
              {p.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.58rem', color: '#475569', textAlign: 'center', padding: '0 0 0.5rem', fontStyle: 'italic' }}>
        Visualization preview — demonstration values
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const techBadges = ['React', 'TypeScript', 'FastAPI', 'Python', 'Docker Ready'];

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(5rem, 10vh, 7rem) clamp(1rem, 4vw, 3rem) clamp(2rem, 5vh, 4rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow background */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="hp-hero-grid" style={{ display: 'grid', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'center', width: '100%', maxWidth: 1280, margin: '0 auto' }}>
        {/* Left Content */}
        <div>
          {/* Eyebrow */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: '1px solid rgba(0,229,255,0.3)',
              background: 'rgba(0,229,255,0.06)',
              borderRadius: 99,
              padding: '0.3rem 0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <Shield size={12} color="#00e5ff" />
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              AUTOMATED SIGNAL INTELLIGENCE WORKSTATION
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#f1f5f9',
              marginBottom: '1.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            From Raw RF Recordings
            <br />
            to Meaningful{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #00e5ff, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Signal Insights
            </span>
            .
          </h1>

          {/* Subtext */}
          <p
            style={{
              fontSize: 'clamp(0.88rem, 1.1vw, 1.05rem)',
              color: '#94a3b8',
              lineHeight: 1.65,
              maxWidth: 540,
              marginBottom: '2rem',
            }}
          >
            Upload IQ or WAV recordings and run SpectraSync's automated 13‑stage DSP pipeline — analyze signals,
            estimate parameters, classify modulation, recover bitstreams, and generate forensic reports.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
            <button
              className="btn-workstation-primary"
              onClick={() => navigate('/login')}
              style={{ padding: '0.65rem 1.35rem', fontSize: '0.88rem' }}
            >
              Explore the Workstation <ChevronRight size={16} />
            </button>
            <a
              href="https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-workstation-secondary"
              style={{ padding: '0.65rem 1.35rem', fontSize: '0.88rem', textDecoration: 'none' }}
            >
              View Documentation <ExternalLink size={14} />
            </a>
          </div>

          {/* Tech badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {techBadges.map((b) => (
              <span
                key={b}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: '#64748b',
                  background: 'rgba(15,26,51,0.8)',
                  border: '1px solid #101c36',
                  borderRadius: 4,
                  padding: '0.2rem 0.5rem',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Spectrum Visualization */}
        <div className="hp-hero-viz">
          <SpectrumVisualization />
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CAPABILITY STRIP
   ═══════════════════════════════════════════════════════════════════════════ */

const CAPS = [
  { value: '13', label: 'DSP Pipeline Stages' },
  { value: '10+', label: 'Modulation Classes' },
  { value: '5', label: 'Signal Visualizations' },
  { value: '6', label: 'Golden Demo Signals' },
  { value: 'Real-Time', label: 'WebSocket Progress' },
];

const CapabilityStrip: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section ref={ref} style={{ ...fadeStyle(visible), padding: '2rem clamp(1rem,4vw,3rem)', borderTop: '1px solid #101c36', borderBottom: '1px solid #101c36' }}>
      <div className="hp-cap-grid" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {CAPS.map((c) => (
          <div
            key={c.label}
            style={{
              textAlign: 'center',
              padding: '1.25rem 0.5rem',
            }}
          >
            <div style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 800, color: '#00e5ff', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.25rem' }}>
              {c.value}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   WORKFLOW SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  { num: '01', title: 'INGEST', desc: 'Upload .IQ, .WAV, .complex, .bin, or .dat recordings with SHA-256 integrity verification', icon: Upload },
  { num: '02', title: 'PROCESS', desc: 'Execute the automated 13-stage DSP pipeline with real-time WebSocket progress', icon: Cpu },
  { num: '03', title: 'ANALYZE', desc: 'Generate spectrum, spectrogram, waveform, and constellation visualizations', icon: Activity },
  { num: '04', title: 'CLASSIFY', desc: 'Estimate signal parameters and classify modulation using cumulants + ML', icon: Radio },
  { num: '05', title: 'EXPORT', desc: 'Produce PDF forensic reports, CSV metrics, JSON packages, and bitstream artifacts', icon: FileText },
];

const WorkflowSection: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section id="pipeline" ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading title="From Raw RF IQ to Decoded Intelligence" subtitle="SpectraSync automates the complete signal analysis workflow" />

        <div className="hp-workflow-grid">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.num}>
                <div
                  style={{
                    background: '#0c1426',
                    border: '1px solid #152445',
                    borderRadius: 10,
                    padding: '1.5rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1e3563';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#152445';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#00e5ff', fontFamily: 'JetBrains Mono, monospace' }}>{s.num}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="#00e5ff" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{s.title}</h3>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                </div>
                {/* Connector arrow — hidden on mobile */}
                {i < STEPS.length - 1 && (
                  <div className="hp-workflow-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3563' }}>
                    <ArrowRight size={20} />
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
   ANALYSIS SHOWCASE
   ═══════════════════════════════════════════════════════════════════════════ */

/** Mini SVG spectrum */
const MiniSpectrum: React.FC = () => {
  const points: string[] = [];
  for (let x = 0; x <= 200; x += 2) {
    const nx = x / 200;
    let y = 70 + Math.random() * 4;
    y -= Math.exp(-Math.pow((nx - 0.5) * 7, 2)) * 50;
    y -= Math.exp(-Math.pow((nx - 0.3) * 10, 2)) * 20;
    points.push(`${x},${y}`);
  }
  return (
    <svg viewBox="0 0 200 90" style={{ width: '100%', height: '100%' }} aria-label="Simulated FFT spectrum">
      <polyline points={points.join(' ')} fill="none" stroke="#00e5ff" strokeWidth="1.2" opacity="0.9" />
      <polyline points={`0,90 ${points.join(' ')} 200,90`} fill="url(#specGrad)" stroke="none" opacity="0.3" />
      <defs>
        <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const MiniWaterfall: React.FC = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }} aria-label="Simulated STFT waterfall spectrogram">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        style={{
          flex: 1,
          borderRadius: 1,
          background: `linear-gradient(90deg,
            rgba(6,9,19,0.9) 0%,
            rgba(37,99,235,${0.1 + Math.random() * 0.2}) ${20 + Math.random() * 10}%,
            rgba(0,229,255,${0.3 + Math.random() * 0.3}) ${45 + Math.random() * 10}%,
            rgba(168,85,247,${0.15 + Math.random() * 0.15}) ${70 + Math.random() * 10}%,
            rgba(6,9,19,0.9) 100%)`,
        }}
      />
    ))}
  </div>
);

const MiniIQ: React.FC = () => {
  const points: string[] = [];
  for (let x = 0; x <= 200; x += 2) {
    const y = 45 + Math.sin(x * 0.15) * 25 + Math.sin(x * 0.3) * 8;
    points.push(`${x},${y}`);
  }
  return (
    <svg viewBox="0 0 200 90" style={{ width: '100%', height: '100%' }} aria-label="Simulated I/Q time domain waveform">
      <polyline points={points.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.85" />
    </svg>
  );
};

const MiniConstellation: React.FC = () => {
  const clusters = [
    { cx: 60, cy: 30 },
    { cx: 140, cy: 30 },
    { cx: 60, cy: 60 },
    { cx: 140, cy: 60 },
  ];
  return (
    <svg viewBox="0 0 200 90" style={{ width: '100%', height: '100%' }} aria-label="Simulated QPSK constellation diagram">
      {/* Grid */}
      <line x1="100" y1="5" x2="100" y2="85" stroke="#152445" strokeWidth="0.5" />
      <line x1="10" y1="45" x2="190" y2="45" stroke="#152445" strokeWidth="0.5" />
      {clusters.map((c, ci) =>
        Array.from({ length: 8 }).map((_, i) => (
          <circle
            key={`${ci}-${i}`}
            cx={c.cx + (Math.random() - 0.5) * 16}
            cy={c.cy + (Math.random() - 0.5) * 16}
            r={1.8}
            fill="#00e5ff"
            opacity={0.6 + Math.random() * 0.4}
          />
        )),
      )}
    </svg>
  );
};

const MiniEye: React.FC = () => {
  const traces: string[][] = [];
  for (let t = 0; t < 6; t++) {
    const pts: string[] = [];
    const phase = Math.random() * Math.PI;
    for (let x = 0; x <= 200; x += 3) {
      const y = 45 + Math.sin(x * 0.031 + phase) * (20 + Math.random() * 8) + (Math.random() - 0.5) * 4;
      pts.push(`${x},${y}`);
    }
    traces.push(pts);
  }
  return (
    <svg viewBox="0 0 200 90" style={{ width: '100%', height: '100%' }} aria-label="Simulated eye diagram">
      {traces.map((pts, i) => (
        <polyline key={i} points={pts.join(' ')} fill="none" stroke="#a855f7" strokeWidth="1" opacity={0.4 + i * 0.08} />
      ))}
    </svg>
  );
};

const vizPanels = [
  { title: 'Live Signal Spectrum', Viz: MiniSpectrum, span: 2 },
  { title: 'STFT Waterfall', Viz: MiniWaterfall, span: 1 },
  { title: 'Time Domain I/Q', Viz: MiniIQ, span: 1 },
  { title: 'I/Q Constellation', Viz: MiniConstellation, span: 1 },
  { title: 'Eye Diagram', Viz: MiniEye, span: 1 },
];

const sigParams = [
  { label: 'Carrier Frequency', value: '437.500 MHz' },
  { label: 'Bandwidth', value: '25.0 kHz' },
  { label: 'Symbol Rate', value: '50.0 kBaud' },
  { label: 'SNR', value: '24.2 dB' },
];

const AnalysisShowcase: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section id="capabilities" ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)', background: 'rgba(8,13,26,0.5)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading
          title="Multi-Domain Signal Analysis Environment"
          subtitle="Five integrated visualization panels for comprehensive RF signal characterization"
        />

        <div className="hp-showcase-grid">
          {/* Dashboard mockup */}
          <div
            style={{
              background: '#0c1426',
              border: '1px solid #152445',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', borderBottom: '1px solid #101c36', background: 'rgba(13,22,44,0.7)' }}>
              <MonitorDot size={14} color="#00e5ff" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>ANALYSIS DASHBOARD</span>
              <span className="pill-live" style={{ marginLeft: 'auto', fontSize: '0.58rem' }}>LIVE</span>
            </div>
            <div className="hp-viz-grid" style={{ padding: '0.75rem', gap: '0.5rem' }}>
              {vizPanels.map((p) => {
                const Viz = p.Viz;
                return (
                  <div
                    key={p.title}
                    className={p.span === 2 ? 'hp-viz-span2' : ''}
                    style={{
                      background: '#091022',
                      border: '1px solid #101c36',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', borderBottom: '1px solid #0d162c', fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {p.title}
                    </div>
                    <div style={{ height: 90, padding: '0.25rem' }}>
                      <Viz />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signal parameters panel */}
          <div
            style={{
              background: '#0c1426',
              border: '1px solid #152445',
              borderRadius: 12,
              overflow: 'hidden',
              alignSelf: 'start',
            }}
          >
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #101c36', background: 'rgba(13,22,44,0.7)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BarChart3 size={14} color="#00e5ff" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>SIGNAL PARAMETERS</span>
            </div>
            <div style={{ padding: '0.75rem' }}>
              {sigParams.map((p) => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #101c36' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{p.value}</span>
                </div>
              ))}
              {/* Modulation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #101c36' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Modulation</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>QPSK</span>
                  <span className="badge-success" style={{ fontSize: '0.58rem' }}>HIGH</span>
                </div>
              </div>
              <div style={{ fontSize: '0.6rem', color: '#475569', fontStyle: 'italic', marginTop: '0.75rem', textAlign: 'center' }}>Demonstration values</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MODULATION CLASSIFICATION
   ═══════════════════════════════════════════════════════════════════════════ */

const MOD_TYPES = [
  { name: 'BPSK', color: '#38bdf8' },
  { name: 'QPSK', color: '#00e5ff' },
  { name: '8-PSK', color: '#3b82f6' },
  { name: '16-QAM', color: '#10b981' },
  { name: '64-QAM', color: '#34d399' },
  { name: '2-FSK', color: '#f59e0b' },
  { name: '4-FSK', color: '#f97316' },
  { name: 'AM', color: '#a855f7' },
  { name: 'FM', color: '#8b5cf6' },
  { name: 'UNKNOWN', color: '#64748b' },
];

/** Tiny constellation dots pattern unique to each modulation type */
function modDots(name: string): React.ReactNode {
  const s = 28;
  switch (name) {
    case 'BPSK':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <circle cx="8" cy="14" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="20" cy="14" r="3" fill="currentColor" opacity="0.8" />
        </svg>
      );
    case 'QPSK':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.8" />
          <circle cx="20" cy="8" r="2.5" fill="currentColor" opacity="0.8" />
          <circle cx="8" cy="20" r="2.5" fill="currentColor" opacity="0.8" />
          <circle cx="20" cy="20" r="2.5" fill="currentColor" opacity="0.8" />
        </svg>
      );
    case '8-PSK':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <circle key={i} cx={14 + Math.cos((i * Math.PI) / 4) * 9} cy={14 + Math.sin((i * Math.PI) / 4) * 9} r="2" fill="currentColor" opacity="0.8" />
          ))}
        </svg>
      );
    case '16-QAM':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3].map((c) => <circle key={`${r}-${c}`} cx={5 + c * 6} cy={5 + r * 6} r="1.5" fill="currentColor" opacity="0.7" />),
          )}
        </svg>
      );
    case '64-QAM':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((r) =>
            [0, 1, 2, 3, 4, 5, 6, 7].map((c) => <circle key={`${r}-${c}`} cx={2 + c * 3.4} cy={2 + r * 3.4} r="0.9" fill="currentColor" opacity="0.6" />),
          )}
        </svg>
      );
    case '2-FSK':
    case '4-FSK':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <path d="M2 20 Q7 4, 14 14 T26 8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
        </svg>
      );
    case 'AM':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <path d="M2 14 Q7 4, 14 14 T26 14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
          <path d="M2 14 Q7 24, 14 14 T26 14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
    case 'FM':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <path d="M2 14 Q5 2, 8 14 T14 14 T20 14 T26 14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <text x="14" y="18" textAnchor="middle" fill="currentColor" fontSize="14" opacity="0.6">
            ?
          </text>
        </svg>
      );
  }
}

const ModulationSection: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading
          title="Automatic Modulation Classification"
          subtitle="Hybrid higher-order cumulant analysis with Random Forest ML classifier"
        />
        <div className="hp-mod-grid">
          {/* Left explanation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.65 }}>
              SpectraSync classifies modulation using a hybrid approach combining <strong style={{ color: '#f1f5f9' }}>higher-order cumulants</strong> (C<sub>40</sub>,
              C<sub>42</sub>, C<sub>63</sub>) with a trained <strong style={{ color: '#f1f5f9' }}>Random Forest ML classifier</strong>.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.65 }}>
              The cumulant-based feature extraction provides robust discrimination between modulation families,
              while the ML classifier refines classification across 10 supported modulation types with confidence scoring.
            </p>
            <div style={{ background: '#0c1426', border: '1px solid #152445', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Feature Extraction</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['C₄₀', 'C₄₂', 'C₆₃', 'σ²ₐ', 'κₐ'].map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#38bdf8',
                      background: 'rgba(56,189,248,0.08)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      borderRadius: 4,
                      padding: '0.2rem 0.5rem',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right modulation grid */}
          <div className="hp-mod-type-grid">
            {MOD_TYPES.map((m) => (
              <div
                key={m.name}
                style={{
                  background: '#0c1426',
                  border: '1px solid #152445',
                  borderRadius: 8,
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'border-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = m.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#152445')}
              >
                <div style={{ color: m.color }}>{modDots(m.name)}</div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: m.color, fontFamily: 'JetBrains Mono, monospace' }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   BITSTREAM PROCESSING
   ═══════════════════════════════════════════════════════════════════════════ */

const PIPELINE_STAGES = ['SIGNAL', 'CLOCK SYNC', 'DEMODULATION', 'DE-INTERLEAVING', 'FEC DECODING', 'BITSTREAM', 'CORRELATION'];

const stageDescs: Record<string, string> = {
  'CLOCK SYNC': 'Gardner / Mueller-Muller TED with PLL',
  'DEMODULATION': 'Decision-directed coherent demodulation',
  'DE-INTERLEAVING': 'Block and convolutional de-interleaver',
  'FEC DECODING': 'Viterbi and Reed-Solomon (auto-detect)',
  'BITSTREAM': 'Frame sync, Barker/CCSDS pattern detection',
  'CORRELATION': 'Cross-correlation, lag analysis',
};

const BitstreamSection: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)', background: 'rgba(8,13,26,0.5)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading
          title="Bitstream Recovery & Frame Synchronization"
          subtitle="End-to-end signal demodulation pipeline from synchronized samples to correlated bitstreams"
        />

        {/* Horizontal pipeline */}
        <div className="hp-pipeline-flow" style={{ margin: '0 auto 2.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 'max-content', justifyContent: 'center' }}>
            {PIPELINE_STAGES.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  style={{
                    background: i === 0 ? 'rgba(0,229,255,0.1)' : i === PIPELINE_STAGES.length - 1 ? 'rgba(16,185,129,0.1)' : '#0c1426',
                    border: `1px solid ${i === 0 ? 'rgba(0,229,255,0.3)' : i === PIPELINE_STAGES.length - 1 ? 'rgba(16,185,129,0.3)' : '#152445'}`,
                    borderRadius: 6,
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: i === 0 ? '#00e5ff' : i === PIPELINE_STAGES.length - 1 ? '#10b981' : '#f1f5f9',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.02em',
                  }}
                >
                  {s}
                </div>
                {i < PIPELINE_STAGES.length - 1 && <ChevronRight size={14} color="#1e3563" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Stage descriptions */}
        <div className="hp-stage-desc-grid">
          {Object.entries(stageDescs).map(([stage, desc]) => (
            <div key={stage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{stage}</span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>— {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   REPORTS SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

const REPORT_ROWS = [
  { file: 'analysis_report.pdf', status: 'COMPLETE', format: 'PDF' },
  { file: 'signal_metrics.csv', status: 'COMPLETE', format: 'CSV' },
  { file: 'analysis_package.json', status: 'COMPLETE', format: 'JSON' },
  { file: 'bitstream_output.bin', status: 'COMPLETE', format: 'BIN' },
];

const ReportsSection: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionHeading title="Automated Signal Reports & Export" subtitle="Generate comprehensive analysis artifacts in multiple formats" />

        <div style={{ background: '#0c1426', border: '1px solid #152445', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', borderBottom: '1px solid #101c36', background: 'rgba(13,22,44,0.7)' }}>
            <FileText size={14} color="#00e5ff" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>EXPORT ARTIFACTS</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th>Format</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_ROWS.map((r) => (
                  <tr key={r.file}>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#f1f5f9' }}>{r.file}</span>
                    </td>
                    <td>
                      <span className="badge-success" style={{ fontSize: '0.65rem' }}>{r.status}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#94a3b8' }}>{r.format}</span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                        <CheckCircle2 size={13} /> READY
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#475569', fontStyle: 'italic', padding: '0.5rem 1rem', textAlign: 'center' }}>
            Visual preview — export artifacts are generated per analysis job
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   GOLDEN DEMOS
   ═══════════════════════════════════════════════════════════════════════════ */

const DEMOS = [
  { name: 'Demo QPSK', desc: '50 kBaud, +2.4 kHz offset, 24 dB SNR', color: '#00e5ff', tag: 'QPSK' },
  { name: 'Demo BPSK', desc: '50 kBaud, +5 kHz offset, 22 dB SNR', color: '#38bdf8', tag: 'BPSK' },
  { name: 'Demo 2-FSK', desc: '25 kBaud, 12.5 kHz deviation, 20 dB SNR', color: '#f59e0b', tag: '2-FSK' },
  { name: 'Demo 16-QAM', desc: '40 kBaud, 28 dB SNR, Barker-13', color: '#10b981', tag: '16-QAM' },
  { name: 'Demo Noisy', desc: 'Low SNR (2 dB) QPSK, ambiguity testing', color: '#ef4444', tag: 'NOISY' },
  { name: 'Demo Unknown', desc: 'Colored noise + tones, fallback verification', color: '#64748b', tag: 'UNKNOWN' },
];

const DemosSection: React.FC = () => {
  const navigate = useNavigate();
  const [ref, visible] = useFadeIn();
  return (
    <section id="demos" ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)', background: 'rgba(8,13,26,0.5)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading
          eyebrow="Built-in Test Suite"
          title="Golden Vector Demo Suite"
          subtitle="Six pre-generated test signals for instant evaluation"
        />

        <div className="hp-demos-grid">
          {DEMOS.map((d) => (
            <div
              key={d.name}
              style={{
                background: '#0c1426',
                border: '1px solid #152445',
                borderRadius: 10,
                padding: '1.25rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = d.color;
                e.currentTarget.style.boxShadow = `0 0 20px ${d.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#152445';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: d.color,
                    background: `${d.color}18`,
                    border: `1px solid ${d.color}40`,
                    borderRadius: 4,
                    padding: '0.15rem 0.45rem',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {d.tag}
                </span>
                <Signal size={14} color={d.color} />
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.35rem' }}>{d.name}</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{d.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn-workstation-primary" onClick={() => navigate('/login')} style={{ padding: '0.6rem 1.4rem' }}>
            Explore Demo Signals <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const APPS = [
  { title: 'RF Signal Analysis', desc: 'Automated analysis of captured RF recordings with parameter estimation and modulation classification', icon: Radar },
  { title: 'Spectrum Research', desc: 'Multi-domain visualization and spectral characterization for academic and commercial research', icon: Search },
  { title: 'Communication Systems', desc: 'Demodulation, bitstream recovery, and protocol analysis for communication system evaluation', icon: Globe },
  { title: 'Signal Intelligence', desc: 'Structured SIGINT workflows with forensic reporting and audit trails', icon: Shield },
];

const ApplicationsSection: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading title="Operational Environments" subtitle="Built for RF engineers, researchers, and defense analysts" />

        <div className="hp-apps-grid">
          {APPS.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                style={{
                  background: '#0c1426',
                  border: '1px solid #152445',
                  borderRadius: 10,
                  padding: '1.5rem',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1e3563')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#152445')}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(0,229,255,0.06)',
                    border: '1px solid rgba(0,229,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Icon size={20} color="#00e5ff" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.5rem' }}>{a.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECURITY & ARCHITECTURE
   ═══════════════════════════════════════════════════════════════════════════ */

const ARCH_LAYERS = [
  { label: 'React + TypeScript', sub: 'Dark Workstation UI', icon: Layers },
  { label: 'FastAPI', sub: 'REST API + WebSocket', icon: Server },
  { label: 'Worker Pool', sub: 'Redis / In-Memory Queue', icon: Cpu },
  { label: 'DSP Pipeline', sub: '13 Automated Stages', icon: Activity },
  { label: 'Database / Storage', sub: 'SQLite / PostgreSQL', icon: Database },
];

const SECURITY_ITEMS = [
  'JWT Authentication',
  'PBKDF2-HMAC-SHA256',
  'Role-Based Access (RBAC)',
  'SHA-256 File Integrity',
  'Protected API Routes',
  'Pydantic Validation',
  'OpenAPI / Swagger Docs',
  'Docker Deployment',
];

const ArchitectureSection: React.FC = () => {
  const [ref, visible] = useFadeIn();
  return (
    <section id="platform" ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)', background: 'rgba(8,13,26,0.5)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading title="Production-Grade Architecture" />

        <div className="hp-arch-grid">
          {/* Left — architecture diagram */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              {ARCH_LAYERS.map((l, i) => {
                const Icon = l.icon;
                return (
                  <React.Fragment key={l.label}>
                    <div
                      style={{
                        background: '#0c1426',
                        border: '1px solid #152445',
                        borderRadius: 10,
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        maxWidth: 360,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'rgba(0,229,255,0.08)',
                          border: '1px solid rgba(0,229,255,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} color="#00e5ff" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>{l.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{l.sub}</div>
                      </div>
                    </div>
                    {i < ARCH_LAYERS.length - 1 && (
                      <div style={{ width: 1, height: 16, background: '#152445', margin: '-0.25rem 0' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right — security features */}
          <div
            style={{
              background: '#0c1426',
              border: '1px solid #152445',
              borderRadius: 12,
              overflow: 'hidden',
              alignSelf: 'start',
            }}
          >
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #101c36', background: 'rgba(13,22,44,0.7)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Lock size={14} color="#00e5ff" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>SECURITY ARCHITECTURE</span>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              {SECURITY_ITEMS.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.6rem 1rem',
                    borderBottom: '1px solid #101c36',
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                  }}
                >
                  <CheckCircle2 size={14} color="#10b981" />
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
  const [ref, visible] = useFadeIn();
  return (
    <section ref={ref} style={{ ...fadeStyle(visible), padding: 'clamp(3rem,6vh,5rem) clamp(1rem,4vw,3rem)' }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(29,78,216,0.12) 0%, rgba(168,85,247,0.06) 100%)',
          border: '1px solid rgba(37,99,235,0.25)',
          borderRadius: 16,
          padding: 'clamp(2rem, 4vw, 3.5rem)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.75rem' }}>
          Ready to Analyze Your Signals?
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: 520, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Explore the SpectraSync workstation — from raw RF recordings to structured signal intelligence.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button className="btn-workstation-primary" onClick={() => navigate('/login')} style={{ padding: '0.7rem 1.6rem', fontSize: '0.9rem' }}>
            Open Workstation
          </button>
          <a
            href="https://github.com/arunkumarmeda27/SpectraSync"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-workstation-secondary"
            style={{ padding: '0.7rem 1.6rem', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Github size={16} /> View on GitHub
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
  <footer
    style={{
      borderTop: '1px solid #101c36',
      padding: 'clamp(2rem, 4vw, 3rem) clamp(1rem, 4vw, 3rem) 1.5rem',
      background: '#060913',
    }}
  >
    <div className="hp-footer-grid" style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Brand column */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Waves size={16} color="#00e5ff" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9' }}>
            SPECTRA<span style={{ color: '#00e5ff' }}>SYNC</span>
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5, maxWidth: 260 }}>
          Automated Signal Intelligence Workstation.
          <br />
          Built for SIH26147.
        </p>
      </div>

      {/* Links column */}
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>NAVIGATION</div>
        {[
          { label: 'Platform', action: () => scrollTo('platform') },
          { label: 'Pipeline', action: () => scrollTo('pipeline') },
          { label: 'Capabilities', action: () => scrollTo('capabilities') },
          { label: 'Demos', action: () => scrollTo('demos') },
          { label: 'Documentation', href: 'https://github.com/arunkumarmeda27/SpectraSync/tree/main/docs' },
          { label: 'GitHub', href: 'https://github.com/arunkumarmeda27/SpectraSync' },
        ].map((l) =>
          l.href ? (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'none', padding: '0.2rem 0', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              {l.label}
            </a>
          ) : (
            <button
              key={l.label}
              onClick={l.action}
              style={{ display: 'block', background: 'none', border: 'none', fontSize: '0.78rem', color: '#94a3b8', padding: '0.2rem 0', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              {l.label}
            </button>
          ),
        )}
      </div>

      {/* Tech stack */}
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>TECH STACK</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {['React', 'TypeScript', 'Vite', 'FastAPI', 'SQLAlchemy', 'NumPy', 'SciPy', 'scikit-learn', 'Docker', 'Redis'].map((t) => (
            <span
              key={t}
              style={{
                fontSize: '0.62rem',
                fontWeight: 600,
                color: '#64748b',
                background: 'rgba(15,26,51,0.8)',
                border: '1px solid #101c36',
                borderRadius: 3,
                padding: '0.15rem 0.4rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      style={{
        maxWidth: 1280,
        margin: '2rem auto 0',
        paddingTop: '1rem',
        borderTop: '1px solid #101c36',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <span style={{ fontSize: '0.68rem', color: '#475569' }}>© 2026 SpectraSync · MIT License · Smart India Hackathon</span>
      <span style={{ fontSize: '0.62rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>SIH26147 · v1.0.0</span>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const HOMEPAGE_STYLES = `
/* ── Navbar ────────────────────────────────────────────────────────── */
.hp-nav-links { display: flex; align-items: center; gap: 0.25rem; }
.hp-nav-right { display: flex; align-items: center; gap: 0.75rem; }
.hp-hamburger { display: none; }

/* ── Hero ──────────────────────────────────────────────────────────── */
.hp-hero-grid { grid-template-columns: 1fr 1fr; }
.hp-hero-viz { display: block; }

/* ── Capability strip ─────────────────────────────────────────────── */
.hp-cap-grid { display: grid; grid-template-columns: repeat(5, 1fr); }

/* ── Workflow ─────────────────────────────────────────────────────── */
.hp-workflow-grid { display: flex; align-items: stretch; gap: 0; justify-content: center; }
.hp-workflow-grid > div:not(.hp-workflow-arrow) { flex: 1; max-width: 240px; }
.hp-workflow-arrow { flex: 0 0 auto; }

/* ── Showcase ─────────────────────────────────────────────────────── */
.hp-showcase-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
.hp-viz-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.hp-viz-span2 { grid-column: span 2; }

/* ── Modulation ───────────────────────────────────────────────────── */
.hp-mod-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; align-items: start; }
.hp-mod-type-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }

/* ── Stage descriptions ───────────────────────────────────────────── */
.hp-stage-desc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem 2rem; max-width: 900px; margin: 0 auto; }

/* ── Demos ─────────────────────────────────────────────────────────── */
.hp-demos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }

/* ── Applications ─────────────────────────────────────────────────── */
.hp-apps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

/* ── Architecture ─────────────────────────────────────────────────── */
.hp-arch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; align-items: start; }

/* ── Footer ───────────────────────────────────────────────────────── */
.hp-footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 2rem; }

/* ── Focus states ─────────────────────────────────────────────────── */
.hp-navbar button:focus-visible,
.hp-navbar a:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ═══════════════════════════════════════════════════════════════════
   TABLET ( ≤ 1024px )
   ═══════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .hp-hero-grid { grid-template-columns: 1fr; }
  .hp-hero-viz { margin-top: 2rem; }
  .hp-cap-grid { grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .hp-workflow-grid { flex-wrap: wrap; gap: 0.75rem; }
  .hp-workflow-grid > div:not(.hp-workflow-arrow) { flex: 1 1 200px; max-width: none; }
  .hp-workflow-arrow { display: none !important; }
  .hp-showcase-grid { grid-template-columns: 1fr; }
  .hp-mod-grid { grid-template-columns: 1fr; }
  .hp-mod-type-grid { grid-template-columns: repeat(5, 1fr); }
  .hp-demos-grid { grid-template-columns: repeat(2, 1fr); }
  .hp-apps-grid { grid-template-columns: repeat(2, 1fr); }
  .hp-arch-grid { grid-template-columns: 1fr; }
  .hp-footer-grid { grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .hp-stage-desc-grid { grid-template-columns: 1fr; }
}

/* ═══════════════════════════════════════════════════════════════════
   MOBILE ( ≤ 640px )
   ═══════════════════════════════════════════════════════════════════ */
@media (max-width: 640px) {
  .hp-nav-links { display: none; }
  .hp-nav-right { display: none; }
  .hp-hamburger { display: flex !important; }
  .hp-cap-grid { grid-template-columns: repeat(2, 1fr); }
  .hp-mod-type-grid { grid-template-columns: repeat(3, 1fr); }
  .hp-demos-grid { grid-template-columns: 1fr; }
  .hp-apps-grid { grid-template-columns: 1fr; }
  .hp-footer-grid { grid-template-columns: 1fr; gap: 1.5rem; }
  .hp-viz-grid { grid-template-columns: 1fr; }
  .hp-viz-span2 { grid-column: span 1; }
}

/* ═══════════════════════════════════════════════════════════════════
   REDUCED MOTION
   ═══════════════════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE — ROOT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const HomePage: React.FC = () => (
  <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh', color: 'var(--text-primary)', overflowX: 'hidden' }}>
    <style>{HOMEPAGE_STYLES}</style>
    <Navbar />
    <main>
      <HeroSection />
      <CapabilityStrip />
      <WorkflowSection />
      <AnalysisShowcase />
      <ModulationSection />
      <BitstreamSection />
      <ReportsSection />
      <DemosSection />
      <ApplicationsSection />
      <ArchitectureSection />
      <FinalCTA />
    </main>
    <Footer />
  </div>
);

export default HomePage;
