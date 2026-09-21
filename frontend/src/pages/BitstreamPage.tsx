import React, { useEffect, useMemo, useState } from 'react';
import { Binary, Copy, Download, FileText, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { getBitstream, listJobs, type AnalysisJob, type BitstreamAnalysis } from '../api';
import { useStore } from '../store';

type ViewMode = 'HEX' | 'BINARY' | 'ASCII' | 'DECIMAL';

const BitstreamPage: React.FC = () => {
  const { addToast, activeJobId } = useStore();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(activeJobId ?? null);
  const [data, setData] = useState<BitstreamAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('HEX');
  const [searchPattern, setSearchPattern] = useState('');
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    try {
      const result = await listJobs();
      const completed = result.filter(job => job.status === 'completed');
      setJobs(completed);
      if (!selectedJobId || !completed.some(job => job.id === selectedJobId)) {
        setSelectedJobId(activeJobId && completed.some(job => job.id === activeJobId) ? activeJobId : completed[0]?.id ?? null);
      }
    } catch {
      addToast('error', 'Unable to load completed analysis jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadBitstream = async (jobId: number) => {
    setLoading(true);
    try {
      setData(await getBitstream(jobId));
    } catch (error) {
      setData(null);
      addToast('error', error instanceof Error ? error.message : 'Bit stream is not available');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);
  useEffect(() => { if (selectedJobId) loadBitstream(selectedJobId); }, [selectedJobId]);

  const rows = useMemo(() => {
    if (!data) return [];
    const query = searchPattern.trim().toLowerCase();
    return data.hex_dump.filter(row => !query || `${row.offset} ${row.hex} ${row.ascii}`.toLowerCase().includes(query));
  }, [data, searchPattern]);

  const binaryRows = useMemo(() => data?.binary_preview ? data.binary_preview.split(' ') : [], [data]);

  const download = (format: 'bin' | 'hex' | 'json') => {
    if (!data) return;
    const content = format === 'json'
      ? JSON.stringify(data, null, 2)
      : format === 'hex' ? data.hex_stream : data.binary_preview.replaceAll(' ', '');
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `spectrasync_job_${data.job_id}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyBits = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.binary_preview.replaceAll(' ', ''));
    addToast('success', 'Recovered bit preview copied');
  };

  const headerMatches = (data?.header_offsets || []).map((header, index) => typeof header === 'number'
    ? { name: 'Known pattern', offset: header, confidence: null as number | null, errors: null as number | null, key: `${header}-${index}` }
    : { name: header.header_type || 'Known pattern', offset: header.bit_offset ?? 0, confidence: header.confidence ?? null, errors: header.errors ?? null, key: `${header.bit_offset}-${index}` });

  if (loading && !data) return <div style={{ padding: '3rem', color: '#94a3b8' }}><RefreshCw className="spin" /> Loading recovered bit stream...</div>;
  if (!data) return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><AlertCircle size={40} color="#64748b" /><p style={{ color: '#94a3b8' }}>No signal analysis available. Upload an IQ or WAV recording first.</p></div>;

  const metricCards = [
    ['TOTAL BITS', data.length.toLocaleString(), `${Math.ceil(data.length / 8).toLocaleString()} Bytes`, '#3b82f6'],
    ['BIT DENSITY', `${(data.bit_density * 100).toFixed(2)}%`, `${data.ones_count.toLocaleString()} ones`, '#10b981'],
    ['TRANSITION DENSITY', data.transition_density.toFixed(3), 'Recovered stream', '#f59e0b'],
    ['HEADERS DETECTED', String(headerMatches.length), headerMatches.length ? 'Evidence-backed matches' : 'No known pattern', '#10b981'],
    ['CORRELATION', data.correlation_score ? data.correlation_score.toFixed(3) : '—', data.correlation_score ? 'Measured score' : 'No reference match', '#10b981'],
    ['BIT RATE', data.bit_rate_bps ? `${(data.bit_rate_bps / 1000).toFixed(1)} kbps` : '—', `${data.bits_per_symbol || '—'} bits/symbol`, '#3b82f6'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid #334155', borderRadius: 8, padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div><h1 style={{ fontSize: '1.1rem', color: '#f1f5f9', margin: 0 }}>BIT STREAM ANALYSIS</h1><p style={{ fontSize: '.75rem', color: '#94a3b8', margin: '.25rem 0 0' }}>Recovered bits, byte views, synchronization evidence and payload boundaries</p></div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <select className="input-control" value={selectedJobId ?? ''} onChange={event => setSelectedJobId(Number(event.target.value))}>{jobs.map(job => <option key={job.id} value={job.id}>Job #{job.id} - {job.signal_file?.filename || 'Signal'}</option>)}</select>
            <button className="btn btn-outline btn-sm" onClick={copyBits} title="Copy recovered bits"><Copy size={12} /></button>
            <button className="btn btn-outline btn-sm" onClick={() => download('hex')}><Download size={12} /> HEX</button>
            <button className="btn btn-outline btn-sm" onClick={() => download('json')}><FileText size={12} /> JSON</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '.75rem' }}>{metricCards.map(([label, value, sub, color]) => <div key={label} style={{ background: 'rgba(15,23,42,.6)', border: '1px solid #1e293b', borderRadius: 6, padding: '.75rem' }}><div style={{ fontSize: '.65rem', color: '#64748b' }}>{label}</div><div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{value}</div><div style={{ fontSize: '.65rem', color }}>{sub}</div></div>)}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div style={{ background: 'rgba(15,23,42,.8)', border: '1px solid #1e293b', borderRadius: 6, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '.75rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', gap: '.75rem' }}><div style={{ display: 'flex', gap: '.25rem' }}>{(['HEX', 'BINARY', 'ASCII', 'DECIMAL'] as ViewMode[]).map(mode => <button key={mode} onClick={() => setViewMode(mode)} className="btn btn-ghost btn-sm" style={{ color: viewMode === mode ? '#38bdf8' : '#94a3b8' }}>{mode}</button>)}</div><label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Search size={12} color="#64748b" /><input value={searchPattern} onChange={event => setSearchPattern(event.target.value)} placeholder="Search recovered data" className="input-control" /></label></div>
          <div style={{ flex: 1, overflow: 'auto', padding: '.75rem', background: '#0a0f1e', fontFamily: 'JetBrains Mono', fontSize: '.72rem' }}>
            {viewMode === 'HEX' && rows.map(row => <div key={row.offset} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: '1rem', padding: '.25rem 0' }}><span style={{ color: '#38bdf8' }}>{row.offset}</span><span style={{ color: '#f8fafc' }}>{row.hex}</span><span style={{ color: '#a7f3d0', textAlign: 'right' }}>{row.ascii}</span></div>)}
            {viewMode === 'BINARY' && binaryRows.filter(bits => !searchPattern || bits.includes(searchPattern)).map((bits, index) => <div key={index} style={{ color: '#a7f3d0', padding: '.25rem 0' }}>{(index * 8).toString(16).padStart(8, '0').toUpperCase()}  {bits}</div>)}
            {viewMode === 'ASCII' && <pre style={{ whiteSpace: 'pre-wrap', color: '#a7f3d0', margin: 0 }}>{data.ascii_preview || 'Non-printable / binary payload'}</pre>}
            {viewMode === 'DECIMAL' && rows.map(row => <div key={row.offset} style={{ color: '#cbd5e1', padding: '.25rem 0' }}>{row.offset}  {row.hex.split(' ').filter(Boolean).map(value => parseInt(value, 16)).join(' ')}</div>)}
            {!rows.length && viewMode === 'HEX' && <div style={{ color: '#64748b', padding: '2rem' }}>No recovered bytes match the search.</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
          <div className="card" style={{ padding: '1rem', flex: 1, overflow: 'auto' }}><div className="card-title">Detected Synchronization Patterns</div>{headerMatches.length ? headerMatches.map(header => <div key={header.key} style={{ borderBottom: '1px solid #1e293b', padding: '.75rem 0' }}><div style={{ display: 'flex', justifyContent: 'space-between', color: '#f1f5f9', fontWeight: 700 }}>{header.name}<span style={{ color: '#10b981' }}>{header.confidence !== null ? `${Math.round(header.confidence * 100)}%` : 'MATCHED'}</span></div><div style={{ color: '#94a3b8', fontSize: '.75rem' }}>Bit {header.offset}{header.errors !== null ? ` · ${header.errors} errors` : ''}</div></div>) : <p style={{ color: '#64748b' }}>No header confidently identified.</p>}</div>
          <div className="card" style={{ padding: '1rem', maxHeight: 220, overflow: 'auto' }}><div className="card-title">Payload Evidence</div>{data.payload_frames.length ? data.payload_frames.map((frame, index) => <div key={index} style={{ padding: '.6rem 0', borderBottom: '1px solid #1e293b', color: '#cbd5e1', fontSize: '.75rem' }}>Frame {String(frame.frame_index ?? index + 1)} · {String(frame.payload_bytes_count ?? 0)} bytes · confidence {typeof frame.confidence === 'number' ? `${Math.round(frame.confidence * 100)}%` : '—'}</div>) : <p style={{ color: '#64748b' }}>Unknown / unstructured data. No payload boundary is supported by a detected header.</p>}</div>
        </div>
      </div>
    </div>
  );
};

export default BitstreamPage;
