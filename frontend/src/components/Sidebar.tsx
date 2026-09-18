import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Clock,
  BarChart2,
  SlidersHorizontal,
  Binary,
  FileText,
  Settings,
  Activity
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={17} />, path: '/' },
  { label: 'Upload & Analyze', icon: <Upload size={17} />, path: '/upload' },
  { label: 'Job History', icon: <Clock size={17} />, path: '/jobs' },
  { label: 'Signal Visualizations', icon: <BarChart2 size={17} />, path: '/visualizations' },
  { label: 'Parameter Results', icon: <SlidersHorizontal size={17} />, path: '/parameters' },
  { label: 'Bit Stream Analysis', icon: <Binary size={17} />, path: '/bitstream' },
  { label: 'Reports', icon: <FileText size={17} />, path: '/reports' },
  { label: 'Settings', icon: <Settings size={17} />, path: '/settings' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Activity size={20} />
        </div>
        <div>
          <div className="brand-title">SpectraSync</div>
          <div className="brand-subtitle">Signal Analysis Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
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
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div>v1.0.0</div>
        <div className="sidebar-footer-brand">SpectraSync</div>
        <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: '2px' }}>
          Built for a smarter spectrum
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
