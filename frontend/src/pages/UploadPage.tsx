// Upload page with drag-and-drop and job launch
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileAudio, X, CheckCircle, Play, Settings2 } from 'lucide-react';
import { uploadFile, createJob, type SignalFile } from '../api';
import { useStore } from '../store';
import { ProgressBar, fmtSize, Spinner } from '../components/Shared';

const ACCEPTED_EXTS = ['.iq', '.wav', '.complex', '.bin', '.dat'];

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, setActiveJobId } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<SignalFile | null>(null);
  const [launching, setLaunching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({ max_samples: 524288 });

  const validate = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      addToast('error', `Unsupported file type: ${ext}. Accepted: ${ACCEPTED_EXTS.join(', ')}`);
      return false;
    }
    if (f.size > 500 * 1024 * 1024) {
      addToast('error', 'File exceeds 500 MB limit');
      return false;
    }
    return true;
  };

  const handleFileSelect = (f: File) => {
    if (!validate(f)) return;
    setSelectedFile(f);
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const sf = await uploadFile(selectedFile, p => setUploadProgress(p));
      setUploadedFile(sf);
      addToast('success', `Uploaded: ${sf.original_filename}`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLaunch = async () => {
    if (!uploadedFile) return;
    setLaunching(true);
    try {
      const job = await createJob(uploadedFile.id, config);
      setActiveJobId(job.id);
      addToast('success', `Analysis job #${job.id} queued`);
      navigate(`/results/${job.id}`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLaunching(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setUploadedFile(null);
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Upload Signal</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Supported formats: <code className="mono">.iq</code>, <code className="mono">.wav</code>, <code className="mono">.complex</code>, <code className="mono">.bin</code>, <code className="mono">.dat</code> — max 500 MB
        </p>
      </div>

      {/* Drop Zone */}
      {!uploadedFile && (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileRef.current?.click()}
          style={{ cursor: selectedFile ? 'default' : 'pointer' }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".iq,.wav,.complex,.bin,.dat"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          {!selectedFile ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <Upload size={48} color="var(--accent-primary)" style={{ opacity: 0.7 }} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Drop your signal file here</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                or click to browse
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {ACCEPTED_EXTS.map(ext => (
                  <span key={ext} className="badge badge-muted">{ext}</span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <FileAudio size={36} color="var(--accent-primary)" />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fmtSize(selectedFile.size)}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); reset(); }}
                >
                  <X size={14} />
                </button>
              </div>

              {uploading && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Uploading…</span><span>{uploadProgress}%</span>
                  </div>
                  <ProgressBar value={uploadProgress} />
                </div>
              )}

              {!uploading && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-primary" onClick={handleUpload}>
                    <Upload size={14} /> Upload File
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowConfig(!showConfig)}>
                    <Settings2 size={14} /> Config
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Uploaded — ready to analyze */}
      {uploadedFile && (
        <div className="card animate-fade-in" style={{ border: '1px solid rgba(0,255,157,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <CheckCircle size={28} color="#00ff9d" />
            <div>
              <div style={{ fontWeight: 700, color: '#00ff9d' }}>Upload complete!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{uploadedFile.original_filename}</div>
            </div>
          </div>

          {/* File metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Format', val: uploadedFile.file_format },
              { label: 'Size', val: fmtSize(uploadedFile.size) },
              { label: 'Sample Rate', val: uploadedFile.sample_rate ? `${(uploadedFile.sample_rate/1e6).toFixed(2)} MHz` : 'auto-detect' },
              { label: 'Duration', val: uploadedFile.duration_sec ? `${uploadedFile.duration_sec.toFixed(3)}s` : 'TBD' },
              { label: 'Samples', val: uploadedFile.sample_count?.toLocaleString() ?? 'TBD' },
              { label: 'Checksum', val: uploadedFile.checksum.slice(0, 10) + '…' },
            ].map(row => (
              <div key={row.label} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem'
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</div>
                <div style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{row.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleLaunch} disabled={launching} style={{ flex: 1 }}>
              {launching ? <Spinner size={14} /> : <Play size={14} />}
              {launching ? 'Launching…' : 'Run DSP Analysis Pipeline'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={reset}>
              <Upload size={14} /> New File
            </button>
          </div>
        </div>
      )}

      {/* Pipeline Config */}
      {showConfig && !uploadedFile && (
        <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
          <div className="card-header">
            <span className="card-title">Pipeline Configuration</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                Max Samples (analysis window)
              </label>
              <select
                className="input"
                value={config.max_samples}
                onChange={e => setConfig(c => ({ ...c, max_samples: +e.target.value }))}
              >
                <option value={65536}>65,536 (64k)</option>
                <option value={131072}>131,072 (128k)</option>
                <option value={262144}>262,144 (256k)</option>
                <option value={524288}>524,288 (512k) — default</option>
                <option value={1048576}>1,048,576 (1M)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div style={{ marginTop: '1.5rem' }} className="card">
        <div className="card-header">
          <span className="card-title">File Format Guide</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { fmt: '.iq / .complex', desc: 'Raw interleaved float32 I/Q samples. Filename may encode sample_rate as e.g. signal_100e6.iq' },
            { fmt: '.wav', desc: 'WAV file with I/Q data in stereo (L=I, R=Q) or mono float32. Standard audio WAV also accepted.' },
            { fmt: '.bin / .dat', desc: 'Binary float32 or int16 I/Q pairs. Endian-aware reader auto-detects format.' },
          ].map(row => (
            <div key={row.fmt} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <code className="mono badge badge-cyan" style={{ flexShrink: 0 }}>{row.fmt}</code>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
