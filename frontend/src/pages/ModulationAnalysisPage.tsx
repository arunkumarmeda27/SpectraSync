// Modulation Analysis Page - Real-time modulation classification results
import React, { useEffect, useState, useRef } from 'react';
import { Radio, RefreshCw, AlertCircle, TrendingUp, Layers } from 'lucide-react';
import { listJobs, getAnalysisResult, type AnalysisJob, type AnalysisResult } from '../api';
import { useStore } from '../store';

const ModulationAnalysisPage: React.FC = () => {
  const { addToast, activeJobId } = useStore();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadJobs = async () => {
    try {
      const jobsList = await listJobs();
      const availableJobs = jobsList.filter(j => j.status !== 'failed');
      setJobs(availableJobs);

      // Auto-select active job or most recent non-failed job
      if (activeJobId && availableJobs.find(j => j.id === activeJobId)) {
        setSelectedJobId(activeJobId);
      } else if (availableJobs.length > 0) {
        setSelectedJobId(availableJobs[0].id);
      }
    } catch (err) {
      addToast('error', 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (jobId: number) => {
    try {
      const analysisResult = await getAnalysisResult(jobId);
      setResult(analysisResult);
    } catch (err) {
      addToast('error', 'Failed to load analysis result');
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadAnalysis(selectedJobId);
    }
  }, [selectedJobId]);

  // Draw constellation diagram
  useEffect(() => {
    if (!canvasRef.current || !result?.visualizations?.constellation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    const padL = 50;
    const padB = 50;
    const padR = 20;
    const padT = 20;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Grid
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;

    // Axes
    const yLabels = ['2', '1', '0', '-1', '-2'];
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label, padL - 6, y + 4);
    });

    ctx.textAlign = 'center';
    yLabels.forEach((label, idx) => {
      const x = padL + (idx / (yLabels.length - 1)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(label, x, height - padB + 20);
    });

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('In-Phase (I)', padL + plotW / 2, height - 10);
    ctx.save();
    ctx.translate(15, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Quadrature (Q)', 0, 0);
    ctx.restore();

    // Draw constellation points
    const constellationData = result.visualizations.constellation as { i: number[]; q: number[] };
    const iVals = constellationData.i || [];
    const qVals = constellationData.q || [];

    for (let idx = 0; idx < Math.min(iVals.length, qVals.length); idx++) {
      const iVal = iVals[idx];
      const qVal = qVals[idx];

      const xCanvas = padL + ((iVal + 2) / 4) * plotW;
      const yCanvas = padT + ((-qVal + 2) / 4) * plotH;

      ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.beginPath();
      ctx.arc(xCanvas, yCanvas, 2, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [result]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <RefreshCw size={24} className="spin" />
        <span style={{ color: '#94a3b8' }}>Loading analysis jobs...</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: '#64748b' }} />
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>No completed analysis jobs found.</p>
        <p style={{ color: '#475569', fontSize: '0.85rem' }}>
          Upload a signal file from the <b>Upload & Analyze</b> page to see modulation analysis results here.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: '#64748b' }} />
        <p style={{ color: '#64748b' }}>Unable to load analysis for the selected job.</p>
      </div>
    );
  }

  const modulation = result.primary_modulation || 'UNKNOWN';
  const confidence = result.confidence || 0.0;
  const candidates = result.modulation_candidates || [];

  // Extract features if available
  const visualizations = result.visualizations as Record<string, any> || {};
  const hasConstellation = visualizations.constellation &&
    Array.isArray((visualizations.constellation as any).i) &&
    Array.isArray((visualizations.constellation as any).q);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Radio size={20} className="card-title-icon" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
              Modulation Classification & Analysis
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Automatic modulation recognition using ML classifier and higher-order cumulants
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Job Selector */}
          <select
            className="input-control"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', minWidth: '200px' }}
            value={selectedJobId || ''}
            onChange={(e) => setSelectedJobId(Number(e.target.value))}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                Job #{j.id} - {j.signal_file?.filename || 'Unknown'}
              </option>
            ))}
          </select>

          <button
            className="btn btn-ghost btn-sm"
            onClick={loadJobs}
            title="Refresh jobs list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem' }}>

        {/* Left: Detected Modulation & Candidates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Primary Modulation */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Detected Modulation
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#2563eb',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              {modulation}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              background: confidence > 0.9 ? 'rgba(16, 185, 129, 0.15)' : confidence > 0.7 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: confidence > 0.9 ? '#10b981' : confidence > 0.7 ? '#fbbf24' : '#ef4444',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              {Math.round(confidence * 100)}% Confidence
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Classification Method</div>
              <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                Random Forest + Higher-Order Cumulants
              </div>
            </div>
          </div>

          {/* Candidate Modulations */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} />
              Classification Candidates
            </div>

            {candidates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {candidates.slice(0, 5).map((c: { modulation: string; confidence: number }, idx: number) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: idx === 0 ? '#2563eb' : '#475569' }}>{c.modulation}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: idx === 0 ? '#2563eb' : '#64748b' }}>
                        {Math.round(c.confidence * 100)}%
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${c.confidence * 100}%`,
                        background: idx === 0 ? 'linear-gradient(90deg, #2563eb, #3b82f6)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                No candidate modulations available
              </div>
            )}
          </div>

          {/* Classification Features */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} />
              Feature Summary
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Classifier</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Random Forest</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Feature Set</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>HOC + Envelope</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Model Version</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>v1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: '#64748b' }}>Training Dataset</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Golden Vectors</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Constellation Diagram */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            I/Q Constellation Diagram
          </div>

          <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
            Symbol decision planes with carrier and timing synchronization applied
          </div>

          {hasConstellation ? (
            <>
              <canvas
                ref={canvasRef}
                width={700}
                height={500}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
              />

              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Points Plotted</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2563eb', fontFamily: 'JetBrains Mono, monospace' }}>
                    {((visualizations.constellation as any).i || []).length.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Expected Clusters</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                    {modulation === 'BPSK' ? '2' : modulation === 'QPSK' ? '4' : modulation === '8PSK' ? '8' : modulation === '16QAM' ? '16' : modulation === '64QAM' ? '64' : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 }}>
                  <b style={{ color: '#2563eb' }}>Analysis:</b> Constellation shows {modulation} characteristics with {confidence > 0.9 ? 'distinct' : confidence > 0.7 ? 'visible' : 'ambiguous'} symbol clustering.
                  {confidence > 0.9 ? ' High confidence classification.' : confidence > 0.7 ? ' Moderate confidence - consider SNR and synchronization quality.' : ' Low confidence - signal may be noisy or modulation type unusual.'}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Radio size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Constellation data not available for this analysis.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ModulationAnalysisPage;
