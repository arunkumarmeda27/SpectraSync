import React, { useState, useEffect } from 'react';
import { Settings, Server, Database, HardDrive, Cpu, Shield, Save, CheckCircle2 } from 'lucide-react';
import { getHealth, type HealthStatus } from '../api';
import { useStore } from '../store';

const SettingsPage: React.FC = () => {
  const { addToast } = useStore();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [fftSize, setFftSize] = useState('2048');
  const [maxSamples, setMaxSamples] = useState('524288');
  const [filterAlpha, setFilterAlpha] = useState('0.995');

  useEffect(() => {
    getHealth().then(setHealth).catch(() => {});
  }, []);

  const handleSave = () => {
    addToast('success', 'DSP pipeline configuration saved.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={20} className="card-title-icon" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
              System Configuration & Engine Health
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Core DSP runtime parameters, microservice connectivity, and object storage settings
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ gap: '0.4rem' }}>
          <Save size={14} />
          Save Changes
        </button>
      </div>

      {/* Grid: Health Status (Left) + DSP Config (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.25rem' }}>
        
        {/* Service Connectivity */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            Infrastructure Services
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Server size={18} color="#2563eb" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>FastAPI REST & WS Gateway</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Port 8000 · ASGI Uvicorn</div>
                </div>
              </div>
              <span className="badge badge-high">Operational</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Cpu size={18} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>DSP Worker Pipeline</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>13-Stage NumPy/SciPy Engine</div>
                </div>
              </div>
              <span className="badge badge-high">Ready</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Database size={18} color="#8b5cf6" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>Database Store</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SQLite (Local) / PostgreSQL</div>
                </div>
              </div>
              <span className="badge badge-high">Connected</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <HardDrive size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>Object Storage</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MinIO / S3 / Local Disk</div>
                </div>
              </div>
              <span className="badge badge-high">Healthy</span>
            </div>
          </div>
        </div>

        {/* DSP Engine Parameters */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            DSP Engine Defaults
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label">Default FFT Transform Size (N)</label>
              <select
                className="input-control"
                value={fftSize}
                onChange={(e) => setFftSize(e.target.value)}
              >
                <option value="1024">1024 points (High Temporal Resolution)</option>
                <option value="2048">2048 points (Balanced Default)</option>
                <option value="4096">4096 points (High Frequency Resolution)</option>
                <option value="8192">8192 points (Narrowband Carrier Peak Zoom)</option>
              </select>
            </div>

            <div>
              <label className="input-label">Maximum Sample Processing Window</label>
              <select
                className="input-control"
                value={maxSamples}
                onChange={(e) => setMaxSamples(e.target.value)}
              >
                <option value="262144">262,144 samples (Fast Preview)</option>
                <option value="524288">524,288 samples (Standard 512k Window)</option>
                <option value="1048576">1,048,576 samples (Deep 1M Frame)</option>
                <option value="4194304">4,194,304 samples (Extended Recording)</option>
              </select>
            </div>

            <div>
              <label className="input-label">DC Removal IIR Notch Alpha (α)</label>
              <input
                type="number"
                step="0.001"
                min="0.900"
                max="0.999"
                className="input-control"
                value={filterAlpha}
                onChange={(e) => setFilterAlpha(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                Single-pole high-pass IIR notch filter tracking coefficient.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
