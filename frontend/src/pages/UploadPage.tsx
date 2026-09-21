// Upload & Analyze Page - Professional Signal Ingestion Workstation
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileAudio,
  X,
  CheckCircle,
  Play,
  Settings2,
  AlertCircle,
  Radio,
  FileCode,
  Database,
  Activity,
  Info
} from 'lucide-react';
import { uploadFile, createJob, type SignalFile } from '../api';
import { useStore } from '../store';
import { ProgressBar, fmtSize, Spinner, SectionHeader, EmptyState } from '../components/Shared';

const ACCEPTED_EXTS = ['.iq', '.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.complex', '.bin', '.dat'];

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
      const sf = await uploadFile(selectedFile, (p) => setUploadProgress(p));
      setUploadedFile(sf);
      addToast('success', `File validated (SHA-256 verified). Ready for analysis.`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
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
      addToast('success', `Analysis job #${job.id} dispatched to DSP pipeline`);
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
    <div className="animate-fade-in">
      <SectionHeader
        title="Upload & Analyze Signal Recording"
        subtitle="Professional signal ingestion, validation, and automated DSP analysis pipeline dispatch"
        icon={<Upload size={18} />}
        tag="UPLOAD STATION"
      />

      <div style={{ display: 'grid', gridTemplateColumns: uploadedFile ? '1.2fr 1fr' : '1fr', gap: '1.25rem', maxWidth: '1200px' }}>
        {/* Left Column: Upload Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!uploadedFile && (
            <>
              {/* Drop Zone */}
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileRef.current?.click()}
                style={{
                  cursor: selectedFile ? 'default' : 'pointer',
                  minHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".iq,.wav,.mp3,.m4a,.aac,.flac,.ogg,.opus,.complex,.bin,.dat"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                {!selectedFile ? (
                  <>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(0, 229, 255, 0.1) 100%)',
                        border: '2px solid rgba(0, 229, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.25rem'
                      }}
                    >
                      <Upload size={32} color="#00e5ff" />
                    </div>
                    <h3 style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>
                      Drop Signal Recording Here
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.25rem', textAlign: 'center', maxWidth: '380px' }}>
                      Drag and drop your .IQ, .WAV, or raw I/Q recording file, or click to browse your file system
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {ACCEPTED_EXTS.map((ext) => (
                        <span key={ext} className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                          {ext}
                        </span>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: '1rem',
                        fontSize: '0.7rem',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Info size={12} />
                      Maximum file size: 500 MB
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', padding: '1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.25rem',
                        padding: '1rem',
                        background: 'rgba(13, 22, 44, 0.6)',
                        border: '1px solid #1a2645',
                        borderRadius: '8px'
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(0, 229, 255, 0.15) 100%)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FileAudio size={24} color="#38bdf8" />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            marginBottom: '0.2rem',
                            fontSize: '0.9rem',
                            color: '#f8fafc',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmtSize(selectedFile.size)} · {selectedFile.type || 'Binary Signal Data'}
                        </div>
                      </div>
                      <button className="btn-icon-xs" onClick={(e) => { e.stopPropagation(); reset(); }} title="Remove file">
                        <X size={14} />
                      </button>
                    </div>

                    {uploading && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            fontWeight: 600
                          }}
                        >
                          <span>Uploading & Validating...</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8' }}>{uploadProgress}%</span>
                        </div>
                        <ProgressBar value={uploadProgress} />
                      </div>
                    )}

                    {!uploading && (
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn-workstation-primary" onClick={handleUpload} style={{ flex: 1 }}>
                          <Upload size={14} /> Upload & Validate
                        </button>
                        <button className="btn-workstation-secondary" onClick={() => setShowConfig(!showConfig)}>
                          <Settings2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* File Format Reference */}
              <div className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <FileCode size={15} />
                    <span>Supported Signal Recording Formats</span>
                  </div>
                </div>
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    {
                      fmt: '.iq / .complex',
                      desc: 'Raw interleaved float32 I/Q samples. Filename encodes sample rate (e.g., signal_2.048e6.iq = 2.048 MHz)',
                      icon: <Radio size={14} color="#38bdf8" />
                    },
                    {
                      fmt: '.wav',
                      desc: 'Standard WAV with I/Q in stereo (L=I, R=Q) or mono. Header contains sample rate and bit depth.',
                      icon: <Activity size={14} color="#10b981" />
                    },
                    {
                      fmt: '.bin / .dat',
                      desc: 'Binary float32 or int16 I/Q pairs. Endian-aware reader auto-detects format heuristically.',
                      icon: <Database size={14} color="#a855f7" />
                    }
                  ].map((row) => (
                    <div
                      key={row.fmt}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.65rem 0.75rem',
                        background: 'rgba(10, 17, 34, 0.6)',
                        border: '1px solid #162445',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>{row.icon}</div>
                      <div>
                        <code
                          className="mono"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            marginBottom: '0.25rem',
                            display: 'inline-block'
                          }}
                        >
                          {row.fmt}
                        </code>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>{row.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Uploaded - Ready to Analyze */}
          {uploadedFile && (
            <div
              className="panel-card animate-fade-in"
              style={{ border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }}
            >
              <div className="panel-header" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <div className="panel-title">
                  <CheckCircle size={15} color="#10b981" />
                  <span>File Validated & Ready for Analysis</span>
                </div>
                <span className="badge badge-green">VERIFIED</span>
              </div>

              <div style={{ padding: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    padding: '1rem',
                    background: 'rgba(10, 17, 34, 0.6)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px'
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircle size={24} color="#10b981" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                      Upload Complete
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{uploadedFile.filename}</div>
                  </div>
                </div>

                {/* File Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Format', val: uploadedFile.format.toUpperCase() },
                    { label: 'Size', val: fmtSize(uploadedFile.size) },
                    {
                      label: 'Sample Rate',
                      val: uploadedFile.sample_rate ? `${(uploadedFile.sample_rate / 1e6).toFixed(3)} MHz` : 'Auto-detect'
                    },
                    { label: 'Channels', val: uploadedFile.channels ?? 'TBD' },
                    { label: 'Sample Format', val: uploadedFile.sample_format ?? 'float32' },
                    { label: 'SHA-256', val: uploadedFile.checksum.slice(0, 12) + '...' }
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        background: 'rgba(10, 17, 34, 0.5)',
                        border: '1px solid #162445',
                        borderRadius: '6px',
                        padding: '0.6rem 0.75rem'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 700,
                          marginBottom: '0.2rem'
                        }}
                      >
                        {row.label}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.78rem',
                          color: '#f8fafc'
                        }}
                      >
                        {row.val}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn-workstation-primary"
                    onClick={handleLaunch}
                    disabled={launching}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {launching ? (
                      <>
                        <Spinner size={14} /> Dispatching...
                      </>
                    ) : (
                      <>
                        <Play size={14} /> Launch DSP Analysis Pipeline
                      </>
                    )}
                  </button>
                  <button className="btn-workstation-secondary" onClick={reset}>
                    <Upload size={14} /> New File
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pipeline Config (when file uploaded) */}
        {uploadedFile && (
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Settings2 size={15} />
                <span>DSP Pipeline Configuration</span>
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    marginBottom: '0.45rem',
                    display: 'block',
                    fontWeight: 600
                  }}
                >
                  Analysis Window Size (samples)
                </label>
                <select
                  className="input-control"
                  value={config.max_samples}
                  onChange={(e) => setConfig((c) => ({ ...c, max_samples: +e.target.value }))}
                  style={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  <option value={65536}>65,536 (64k)</option>
                  <option value={131072}>131,072 (128k)</option>
                  <option value={262144}>262,144 (256k)</option>
                  <option value={524288}>524,288 (512k) — default</option>
                  <option value={1048576}>1,048,576 (1M)</option>
                </select>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.3 }}>
                  Number of I/Q samples to process. Larger windows improve frequency resolution but increase processing time.
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.3rem' }}>
                  ℹ Pipeline Stages
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  The DSP pipeline will execute: FFT → PSD → Spectrogram → Parameter Estimation → Modulation Classification →
                  Synchronization → Demodulation → Bit Stream Extraction.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
