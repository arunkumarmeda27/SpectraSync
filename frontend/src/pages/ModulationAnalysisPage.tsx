// Modulation Analysis Page - Real-time modulation classification results
import React, { useEffect, useState, useRef } from 'react';
import { Radio, RefreshCw, AlertCircle, TrendingUp, Layers, Sparkles } from 'lucide-react';
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
  const demodulationStatus = (result.demodulation_data as { status?: string } | undefined)?.status;
  const isUnsupportedSignal = modulation === 'UNKNOWN' && demodulationStatus === 'unsupported_signal';
  const evidence = result.modulation_evidence;
  const evidenceRows = evidence?.features ? Object.entries(evidence.features).slice(0, 6) : [];

  // Extract features if available
  const visualizations = result.visualizations as Record<string, any> || {};
  const hasConstellation = visualizations.constellation &&
    Array.isArray((visualizations.constellation as any).i) &&
    Array.isArray((visualizations.constellation as any).q);

  const parameters = (result.parameters as any) || {};
  const snr = parameters.snr?.value;
  const symbolRate = parameters.symbol_rate?.value;
  const centerFreq = parameters.carrier_frequency?.value;
  const bandwidth = parameters.bandwidth?.value;
  const sigPower = parameters.signal_power?.value;
  const noisePower = parameters.noise_power?.value;

  const formatFreq = (val: any) => typeof val === 'number' ? (val >= 1e6 ? `${(val/1e6).toFixed(3)} MHz` : `${(val/1e3).toFixed(2)} kHz`) : 'N/A';
  const formatNum = (val: any, suffix: string = '') => typeof val === 'number' ? `${val.toFixed(2)}${suffix}` : 'N/A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Banner */}
      <div className="panel-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Radio size={20} color="#38bdf8" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              MODULATION ANALYSIS
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
              <span>Signal: <span style={{ color: '#f1f5f9' }}>{jobs.find(j => j.id === selectedJobId)?.signal_file?.filename || 'Unknown.iq'}</span></span>
              <span>Analysis ID: <span style={{ color: '#f1f5f9' }}>SIG-{selectedJobId}</span></span>
              <span>Status: <span style={{ color: '#10b981' }}>Analysis Complete</span></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            style={{ 
              padding: '0.4rem 0.75rem', fontSize: '0.75rem', minWidth: '200px',
              background: '#0a101f', border: '1px solid #1e293b', color: '#f8fafc', borderRadius: '4px'
            }}
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
            className="btn-icon-xs"
            onClick={loadJobs}
            title="Refresh jobs list"
            style={{ padding: '0.5rem' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="panel-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Detected Modulation</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{isUnsupportedSignal ? 'UNCLASSIFIED_AUDIO' : modulation}</div>
        </div>
        <div className="panel-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Confidence</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: confidence > 0.8 ? '#10b981' : confidence > 0.5 ? '#f59e0b' : '#ef4444' }}>
            {Math.round(confidence * 100)}%
          </div>
        </div>
        <div className="panel-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>SNR</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: snr ? '#f8fafc' : '#64748b' }}>{formatNum(snr, ' dB')}</div>
        </div>
        <div className="panel-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Symbol Rate</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: symbolRate ? '#f8fafc' : '#64748b' }}>{formatFreq(symbolRate)}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
        
        {/* Left: Constellation */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Sparkles size={14} />
              <span>Constellation Diagram</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {((visualizations?.constellation as any)?.i || []).length.toLocaleString()} symbols · {modulation}
            </div>
          </div>
          <div style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {hasConstellation ? (
              <div style={{ width: '100%', maxWidth: '600px', aspectRatio: '1', position: 'relative' }}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={600}
                  style={{ width: '100%', height: '100%', display: 'block', borderRadius: '8px' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <Radio size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto' }} />
                <p>Constellation data not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Classification & Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Classification Results */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <TrendingUp size={14} />
                <span>Classification Results</span>
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {candidates.length > 0 ? (
                candidates.slice(0, 5).map((c: any, idx: number) => {
                  const conf = c.confidence ?? c.probability ?? 0;
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: idx === 0 ? '#38bdf8' : '#cbd5e1', fontWeight: 700 }}>{c.modulation}</span>
                        <span style={{ color: idx === 0 ? '#38bdf8' : '#94a3b8', fontFamily: 'JetBrains Mono' }}>{Math.round(conf * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${conf * 100}%`, 
                          background: idx === 0 ? '#38bdf8' : '#475569',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>No candidates available</div>
              )}

              {/* Classification Evidence */}
              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Classification Evidence</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {evidence?.consistency_notes?.length ? evidence.consistency_notes.map((note: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                      <span style={{ color: '#10b981' }}>✓</span> {note}
                    </div>
                  )) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>No explicit evidence rules triggered.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="panel-card" style={{ flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={14} />
                <span>Signal Features</span>
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* SIGNAL GROUP */}
                <div style={{ background: '#0a101f', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>SIGNAL</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#94a3b8' }}>Center Freq</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatFreq(centerFreq)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#94a3b8' }}>Bandwidth</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatFreq(bandwidth)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: '#94a3b8' }}>Symbol Rate</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatFreq(symbolRate)}</span>
                  </div>
                </div>

                {/* QUALITY GROUP */}
                <div style={{ background: '#0a101f', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>QUALITY</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#94a3b8' }}>SNR</span>
                    <span style={{ color: snr ? '#10b981' : '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatNum(snr, ' dB')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#94a3b8' }}>Signal Power</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatNum(sigPower, ' dB')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: '#94a3b8' }}>Noise Power</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{formatNum(noisePower, ' dB')}</span>
                  </div>
                </div>
              </div>

              {/* MODULATION GROUP */}
              <div style={{ background: '#0a101f', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>MODULATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: '#94a3b8' }}>Type</span>
                    <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{modulation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: '#94a3b8' }}>Confidence</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{Math.round(confidence*100)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: '#94a3b8' }}>Constellation Points</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{((visualizations?.constellation as any)?.i || []).length || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: '#94a3b8' }}>Phase States</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{modulation === 'BPSK' ? 2 : modulation === 'QPSK' ? 4 : modulation === '8PSK' ? 8 : 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulationAnalysisPage;
