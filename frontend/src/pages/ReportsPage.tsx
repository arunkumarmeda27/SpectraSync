// Reports page
import React, { useEffect, useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listJobs, type AnalysisJob } from '../api';
import { ModBadge, StatusBadge, fmtDate, Spinner, EmptyState } from '../components/Shared';
import { useStore } from '../store';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs()
      .then(j => setJobs(j.filter(job => job.status === 'completed')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadJson = (job: AnalysisJob) => {
    if (!job.result) return;
    const blob = new Blob([JSON.stringify(job.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spectrasync_job_${job.id}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', `Downloaded report for job #${job.id}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <Spinner size={24} /><span style={{ color: 'var(--text-secondary)' }}>Loading…</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Reports</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Download analysis reports for completed jobs. JSON format includes all DSP parameters, modulation data, bitstream, and stage telemetry.
        </p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="No completed analyses"
          description="Run an analysis to generate a report"
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Signal File</th>
                <th>Status</th>
                <th>Modulation</th>
                <th>Confidence</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td><span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{job.id}</span></td>
                  <td>
                    <span className="truncate" style={{ maxWidth: 200, display: 'block', fontSize: '0.85rem' }}>
                      {job.signal_file?.original_filename || `file_${job.signal_file_id}`}
                    </span>
                  </td>
                  <td><StatusBadge status={job.status} /></td>
                  <td>{job.result ? <ModBadge mod={job.result.primary_modulation} /> : '—'}</td>
                  <td>
                    {job.result
                      ? <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#00ff9d' }}>
                          {Math.round(job.result.confidence * 100)}%
                        </span>
                      : '—'
                    }
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {job.completed_at ? fmtDate(job.completed_at) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="View results"
                        onClick={() => navigate(`/results/${job.id}`)}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Download JSON report"
                        onClick={() => handleDownloadJson(job)}
                      >
                        <Download size={13} /> JSON
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-title" style={{ marginBottom: '0.75rem' }}>Report Schema</div>
        <div className="code-block" style={{ fontSize: '0.7rem' }}>{`{
  "primary_modulation": "BPSK",       // Detected modulation type
  "confidence": 0.91,                  // Classification confidence 0-1
  "parameters": {                      // Estimated signal parameters
    "sample_rate": 1000000,
    "carrier_frequency_hz": 0.0,
    "bandwidth_hz": 125000.0,
    "symbol_rate_baud": 50000.0,
    "snr_db": 18.3
  },
  "modulation_candidates": [...],      // All candidates with scores
  "synchronization_data": {...},       // Phase/timing recovery
  "demodulation_data": {...},          // Bits, hex, BER estimate
  "visualizations": {                  // Chart data arrays
    "fft_magnitude": [...],
    "constellation_points": [...]
  }
}`}</div>
      </div>
    </div>
  );
};

export default ReportsPage;
