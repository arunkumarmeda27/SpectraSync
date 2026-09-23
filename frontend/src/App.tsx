import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  LogOut,
  Cpu,
  HardDrive,
  Users,
  Activity,
  Radio,
  Sliders,
  Shield,
  FileCode,
  CheckCircle2,
  X
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import { ToastContainer } from './components/Shared';
import ProtectedRoute from './components/ProtectedRoute';

import { lazy, Suspense } from 'react';

// Lazy Loaded Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const JobQueue = lazy(() => import('./pages/JobQueue'));
const SignalLabPage = lazy(() => import('./pages/SignalLabPage'));
const ParametersPage = lazy(() => import('./pages/ParametersPage'));
const BitstreamPage = lazy(() => import('./pages/BitstreamPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ResultsViewer = lazy(() => import('./pages/ResultsViewer'));
const ResultsList = lazy(() => import('./pages/ResultsList'));
const DemosPage = lazy(() => import('./pages/DemosPage'));
const ModulationAnalysisPage = lazy(() => import('./pages/ModulationAnalysisPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
import { useStore } from './store';
import { logoutUser, listJobs, type AnalysisJob } from './api';
import './index.css';

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth, addToast, activeJobId, setActiveJobId } = useStore();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentJobs, setRecentJobs] = useState<AnalysisJob[]>([]);

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // listJobs is now cache-backed — if Dashboard already loaded jobs within
    // the last 10 s this returns instantly from memory.
    listJobs()
      .then((jobs) => setRecentJobs(jobs))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    clearAuth();
    addToast('info', 'Logged out successfully');
    navigate('/login');
  };

  const activeJob = recentJobs.find((j) => j.id === activeJobId) || recentJobs[0];
  const userRole = user?.role === 'admin' ? 'Lead Analyst' : 'SIGINT Analyst';
  const userEmail = user?.email || 'analyst@spectrasync.io';
  const userInitial = (userEmail[0] || 'A').toUpperCase();

  const filteredJobs = recentJobs.filter((j) => {
    const term = searchQuery.toLowerCase();
    const idMatch = String(j.id).includes(term);
    const fileMatch = j.signal_file?.filename?.toLowerCase().includes(term);
    const modMatch = j.result?.primary_modulation?.toLowerCase().includes(term);
    return idMatch || fileMatch || modMatch;
  });

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Workstation TopBar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: 0 }}>
            {/* Workstation Badge / Brand Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(13, 22, 44, 0.9)',
                  border: '1px solid #1a2645',
                  borderRadius: '6px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.72rem'
                }}
              >
                <Shield size={13} color="#00e5ff" />
                <span style={{ fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.02em' }}>
                  SPECTRA<span style={{ color: '#00e5ff' }}>SYNC</span>
                </span>
                <span style={{ color: '#64748b' }}>|</span>
                <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem' }}>
                  SIH26147
                </span>
              </div>
            </div>

            {/* Active Session Info Pill */}
            {activeJob && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(10, 17, 34, 0.8)',
                  border: '1px solid #162445',
                  borderRadius: '6px',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.72rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
                  <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>
                    ACTIVE SESSION
                  </span>
                </div>
                <span style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  SIG-#{activeJob.id}
                </span>
                {activeJob.result?.primary_modulation && (
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      padding: '0.05rem 0.35rem',
                      borderRadius: '3px',
                      fontSize: '0.65rem',
                      fontWeight: 700
                    }}
                  >
                    {activeJob.result.primary_modulation}
                  </span>
                )}
              </div>
            )}

            {/* Global Search Bar */}
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
                minWidth: '220px',
                maxWidth: '320px',
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
              <Search size={13} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Search signals, jobs, telemetry...
              </span>
              <kbd
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.35rem',
                  background: '#0a0f1e',
                  border: '1px solid #1a2645',
                  borderRadius: '3px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#94a3b8'
                }}
              >
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Telemetry + User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* System Status Pill */}
            <div className="pill-live">OPERATIONAL</div>

            {/* Resource Gauges */}
            <div className="pill-metric" title="DSP Engine Core Load">
              <Cpu size={13} color="#38bdf8" />
              <span className="pill-metric-val">32%</span>
            </div>
            <div className="pill-metric" title="Signal Buffer Storage">
              <HardDrive size={13} color="#a855f7" />
              <span className="pill-metric-val">4.1 GB</span>
            </div>
            <div className="pill-metric" title="Active Analysis Workers">
              <Users size={13} color="#10b981" />
              <span className="pill-metric-val">3/3</span>
            </div>

            {/* User Profile & Logout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                paddingLeft: '0.75rem',
                borderLeft: '1px solid #1a2645'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    background:
                      user?.role === 'admin'
                        ? 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)'
                        : 'linear-gradient(135deg, #1d4ed8 0%, #00e5ff 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
                  }}
                >
                  {userInitial}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#f1f5f9',
                      lineHeight: 1.1
                    }}
                  >
                    {userRole}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    {userEmail}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Sign out of SpectraSync"
                className="btn-icon-xs"
                style={{ padding: '0.35rem 0.5rem', color: '#94a3b8' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Suspense fallback={
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '1rem',
              color: '#334155'
            }}>
              <div style={{
                width: 36,
                height: 36,
                border: '3px solid #1a2645',
                borderTopColor: '#00e5ff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite'
              }} />
              <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
                LOADING MODULE
              </span>
            </div>
          }>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/jobs" element={<JobQueue />} />
              <Route path="/visualizations" element={<SignalLabPage />} />
              <Route path="/parameters" element={<ParametersPage />} />
              <Route path="/modulation" element={<ModulationAnalysisPage />} />
              <Route path="/results" element={<ResultsList />} />
              <Route path="/results/:jobId" element={<ResultsViewer />} />
              <Route path="/bitstream" element={<BitstreamPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/demos" element={<DemosPage />} />
              <Route
                path="*"
                element={
                  <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#64748b' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: '#1e3563', marginBottom: '0.5rem' }}>
                      404
                    </div>
                    <h3 style={{ color: '#f1f5f9', marginBottom: '0.5rem' }}>Signal Target Not Found</h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
                      The requested route or telemetry view does not exist in this workstation build.
                    </p>
                    <button className="btn-workstation-primary" onClick={() => navigate('/')}>
                      Return to Dashboard
                    </button>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
      <ToastContainer />

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="modal-backdrop" onClick={() => setShowSearchModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px' }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #162445' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Search size={18} color="#00e5ff" />
                <input
                  type="text"
                  placeholder="Search jobs by ID, filename, modulation, or parameters..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#091022',
                    border: '1px solid #1a2645',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button
                  className="btn-icon-xs"
                  onClick={() => setShowSearchModal(false)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
                {searchQuery ? `Search Results (${filteredJobs.length})` : 'Recent Analysis Jobs'}
              </div>

              {filteredJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {filteredJobs.slice(0, 8).map((job) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setActiveJobId(job.id);
                        setShowSearchModal(false);
                        navigate(`/results/${job.id}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: '#091022',
                        border: '1px solid #162445',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.background = '#0d1a38';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#162445';
                        e.currentTarget.style.background = '#091022';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <FileCode size={16} color="#38bdf8" />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>
                            {job.signal_file?.filename || `Job #${job.id}`}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Job ID #{job.id} · {job.signal_file?.format || 'RAW'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {job.result?.primary_modulation && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px'
                            }}
                          >
                            {job.result.primary_modulation}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: job.status === 'completed' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.78rem' }}>
                  No matching signal analysis jobs found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '1rem',
    background: '#060913',
    color: '#334155'
  }}>
    <div style={{
      width: 36,
      height: 36,
      border: '3px solid #1a2645',
      borderTopColor: '#00e5ff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
    <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
      LOADING MODULE
    </span>
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>} />
      <Route path="/" element={<Suspense fallback={<LoadingFallback />}><HomePage /></Suspense>} />
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
