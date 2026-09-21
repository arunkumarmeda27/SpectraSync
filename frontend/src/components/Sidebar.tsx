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
}

const analysisItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, path: '/' },
  { label: 'Upload & Analyze', icon: <Upload size={16} />, path: '/upload' },
  { label: 'Job History', icon: <Clock size={16} />, path: '/jobs' },
  { label: 'Signal Lab', icon: <Activity size={16} />, path: '/visualizations' },
  { label: 'Parameter Results', icon: <SlidersHorizontal size={16} />, path: '/parameters' },
  { label: 'Modulation Analysis', icon: <Radio size={16} />, path: '/demos' },
  { label: 'Demodulation', icon: <TrendingUp size={16} />, path: '/results' },
  { label: 'Bit Stream Analysis', icon: <Binary size={16} />, path: '/bitstream' },
  { label: 'Reports', icon: <FileText size={16} />, path: '/reports' },
];

const systemItems: NavItem[] = [
  { label: 'Settings', icon: <Settings size={16} />, path: '/settings' },
  { label: 'System Health', icon: <Heart size={16} />, path: '/health' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Waves size={18} />
        </div>
        <div>
          <div className="brand-title">SpectraSync</div>
          <div className="brand-subtitle">Signal Intelligence</div>
        </div>
      </div>

      {/* Navigation - Analysis Section */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: '0.5rem' }}>
        <div className="sidebar-nav-section-title">Analysis</div>
        {analysisItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* System Section */}
        <div className="sidebar-nav-section-title" style={{ marginTop: '0.75rem' }}>System</div>
        {systemItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Glowing wave decoration */}
        <div style={{
          width: '100%',
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%)',
          marginBottom: '0.5rem',
          borderRadius: '99px',
          boxShadow: '0 0 8px rgba(37, 99, 235, 0.6)'
        }} />
        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.15rem' }}>
          From Raw Recordings to Meaningful Signal Insights
        </div>
        <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
          SIH26147 · v1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
