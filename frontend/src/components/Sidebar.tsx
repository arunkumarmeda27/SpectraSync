import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Clock,
  Activity,
  SlidersHorizontal,
  Radio,
  Binary,
  FileText,
  Settings,
  Heart,
  Waves,
  TrendingUp
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'ANALYSIS',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={15} />, path: '/' },
      { label: 'Upload & Analyze', icon: <Upload size={15} />, path: '/upload' },
      { label: 'Job History', icon: <Clock size={15} />, path: '/jobs' },
      { label: 'Signal Lab', icon: <Activity size={15} />, path: '/visualizations' },
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { label: 'Parameter Results', icon: <SlidersHorizontal size={15} />, path: '/parameters' },
      { label: 'Modulation Analysis', icon: <Radio size={15} />, path: '/modulation' },
      { label: 'Demodulation', icon: <TrendingUp size={15} />, path: '/results' },
      { label: 'Bit Stream Analysis', icon: <Binary size={15} />, path: '/bitstream' },
    ]
  },
  {
    title: 'REPORTING',
    items: [
      { label: 'Reports', icon: <FileText size={15} />, path: '/reports' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', icon: <Settings size={15} />, path: '/settings' },
      { label: 'System Health', icon: <Heart size={15} />, path: '/health' },
    ]
  }
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Waves size={18} />
        </div>
        <div>
          <div className="brand-title">SpectraSync</div>
          <div className="brand-subtitle">Workstation v1.0</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: '0.5rem' }}>
        {navSections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: '0.35rem' }}>
            <div className="sidebar-nav-section-title">{sec.title}</div>
            {sec.items.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                >
                  <span style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.85 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        background: 'rgba(0, 229, 255, 0.15)',
                        color: '#00e5ff'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div
          style={{
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #2563eb 50%, #00e5ff 75%, transparent 100%)',
            marginBottom: '0.6rem',
            borderRadius: '99px',
            boxShadow: '0 0 8px rgba(0, 229, 255, 0.5)'
          }}
        />
        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.2rem', lineHeight: 1.2 }}>
          Signal Intelligence & Demodulation
        </div>
        <div
          style={{
            fontSize: '0.68rem',
            color: '#475569',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981' }} />
          SIH26147 · OPERATIONAL
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
