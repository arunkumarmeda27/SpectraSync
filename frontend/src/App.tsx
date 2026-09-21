import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Cpu, HardDrive, Users } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { ToastContainer } from './components/Shared';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import JobQueue from './pages/JobQueue';
import VisualizationsPage from './pages/VisualizationsPage';
import ParametersPage from './pages/ParametersPage';
import BitstreamPage from './pages/BitstreamPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ResultsViewer from './pages/ResultsViewer';
import ResultsList from './pages/ResultsList';
import DemosPage from './pages/DemosPage';
import ModulationAnalysisPage from './pages/ModulationAnalysisPage';
import HealthPage from './pages/HealthPage';
import { useStore } from './store';
import { logoutUser } from './api';
import './index.css';

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth, addToast } = useStore();
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    clearAuth();
    addToast('info', 'Logged out successfully');
    navigate('/login');
  };

  const userRole = user?.role === 'admin' ? 'Administrator' : 'Analyst';
  const userEmail = user?.email || 'analyst@spectrasync.io';
  const userInitial = (userEmail[0] || 'A').toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Enhanced Dark Topbar with System Stats */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            {/* Brand */}
            <div>
              <h1 style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#f1f5f9',
                lineHeight: 1.2,
                letterSpacing: '-0.02em'
              }}>
                SpectraSync Signal Intelligence Workstation
              </h1>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                Automated .IQ / .WAV Signal Analysis Platform
              </div>
            </div>

            {/* Global Search */}
            <button
              onClick={() => setShowSearchModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(13, 22, 44, 0.8)',
                border: '1px solid #1a2645',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                color: '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                minWidth: '240px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.background = 'rgba(13, 22, 44, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1a2645';
                e.currentTarget.style.background = 'rgba(13, 22, 44, 0.8)';
              }}
            >
              <Search size={14} />
              <span>Search jobs, signals, reports...</span>
              <kbd style={{
                marginLeft: 'auto',
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                background: '#0a0f1e',
                border: '1px solid #1a2645',
                borderRadius: '3px',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: System Stats + User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* System Status Pill */}
            <div className="pill-live">
              System Operational
            </div>

            {/* System Metrics */}
            <div className="pill-metric">
              <Cpu size={13} />
              <span className="pill-metric-val">32%</span>
            </div>
            <div className="pill-metric">
              <HardDrive size={13} />
              <span className="pill-metric-val">4.1 GB</span>
            </div>
            <div className="pill-metric">
              <Users size={13} />
              <span className="pill-metric-val">3/3</span>
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={17} color="#64748b" />
              <div style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#3b82f6',
                boxShadow: '0 0 6px #3b82f6'
              }} />
            </div>

            {/* User Profile & Logout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid #1a2645'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: user?.role === 'admin'
                    ? 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  boxShadow: user?.role === 'admin'
                    ? '0 0 10px rgba(168, 85, 247, 0.4)'
                    : '0 0 10px rgba(37, 99, 235, 0.4)'
                }}>
                  {userInitial}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#f1f5f9',
                    lineHeight: 1.1
                  }}>
                    {userRole}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {userEmail}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Sign out of SpectraSync"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(15, 26, 51, 0.8)',
                  border: '1px solid #1a2645',
                  borderRadius: '5px',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 26, 51, 0.8)';
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = '#1a2645';
                }}
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/jobs" element={<JobQueue />} />
            <Route path="/visualizations" element={<VisualizationsPage />} />
            <Route path="/parameters" element={<ParametersPage />} />
            <Route path="/bitstream" element={<BitstreamPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/results" element={<ResultsList />} />
            <Route path="/results/:jobId" element={<ResultsViewer />} />
            <Route path="/demos" element={<DemosPage />} />
            <Route path="/modulation" element={<ModulationAnalysisPage />} />
            <Route path="*" element={
              <div style={{
                textAlign: 'center',
                padding: '4rem',
                color: '#64748b'
              }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '1rem',
                  opacity: 0.4,
                  fontWeight: 800
                }}>
                  404
                </div>
                <div style={{ fontWeight: 600 }}>Page not found</div>
              </div>
            } />
          </Routes>
        </main>
      </div>
      <ToastContainer />

      {/* Search Modal */}
      {showSearchModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '550px' }}
          >
            <div style={{ padding: '1.25rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginBottom: '1rem'
              }}>
                <Search size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search jobs, signals, reports..."
                  autoFocus
                  style={{
                    flex: 1,
                    background: '#0a0f1e',
                    border: '1px solid #1a2645',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{
                color: '#64748b',
                fontSize: '0.75rem',
                textAlign: 'center',
                padding: '1.5rem'
              }}>
                Search coming soon...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

export default App;
