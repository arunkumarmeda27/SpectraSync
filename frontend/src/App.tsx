import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { ToastContainer } from './components/Shared';

// Pages
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
import './index.css';

const AppShell: React.FC = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Topbar matching user's screenshot */}
        <header className="topbar">
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              Automated .IQ / .WAV Signal Analysis Platform
            </h1>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>
              From raw recordings to meaningful insights
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={18} color="#64748b" />
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#2563eb'
                }}
              />
            </div>

            {/* Analyst User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                A
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
                  Analyst
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  analyst@domain.com
                </div>
              </div>
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
            <Route path="/results" element={<ResultsList />} />
            <Route path="/results/:jobId" element={<ResultsViewer />} />
            <Route path="/demos" element={<DemosPage />} />
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>404</div>
                <div style={{ fontWeight: 600 }}>Page not found</div>
              </div>
            } />
          </Routes>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
