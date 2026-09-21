// Job Queue page — lists all jobs with polling
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trash2, RotateCcw, Eye, Upload } from 'lucide-react';
import { listJobs, deleteJob, retryJob, type AnalysisJob } from '../api';
import { StatusBadge, ModBadge, ProgressBar, fmtDate, fmtSize, Spinner, EmptyState, SectionHeader } from '../components/Shared';
import { useStore } from '../store';

const JobQueue: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      setJobs(await listJobs());
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteJob(id);
      setJobs(js => js.filter(j => j.id !== id));
      addToast('success', `Job #${id} deleted`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleRetry = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await retryJob(id);
      setJobs(js => js.map(j => j.id === id ? updated : j));
      addToast('info', `Job #${id} requeued`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Retry failed');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <Spinner size={24} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading jobs…</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Analysis Job Queue"
        subtitle={`${jobs.length} total jobs`}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
              <Upload size={14} /> New Job
            </button>
          </div>
        }
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={<RefreshCw size={32} />}
          title="No analysis jobs"
          description="Upload a signal file or load a demo to begin"
          action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}><Upload size={12} /> Upload</button>}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>File</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Modulation</th>
                <th>Confidence</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr
                  key={job.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/results/${job.id}`)}
                >
                  <td>
                    <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      #{job.id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem', maxWidth: 200 }} className="truncate">
                        {job.signal_file?.filename ?? `file_${job.signal_file_id}`}
                      </div>
                      {job.signal_file?.size && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {fmtSize(job.signal_file.size)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <StatusBadge status={job.status} />
                      {job.current_stage && job.status !== 'completed' && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {job.current_stage}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <div>
                      <ProgressBar value={job.progress} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{job.progress}%</span>
                    </div>
                  </td>
                  <td>
                    {job.result?.primary_modulation
                      ? <ModBadge mod={job.result.primary_modulation} />
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td>
                    {job.result?.confidence
                      ? <span style={{ fontWeight: 700, color: '#00ff9d', fontFamily: 'JetBrains Mono' }}>
                          {Math.round(job.result.confidence * 100)}%
                        </span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {job.started_at ? fmtDate(job.started_at) : fmtDate(job.created_at)}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="View results"
                        onClick={() => navigate(`/results/${job.id}`)}
                      >
                        <Eye size={13} />
                      </button>
                      {job.status === 'failed' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Retry"
                          onClick={(e) => handleRetry(job.id, e)}
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Delete"
                        style={{ color: 'var(--accent-danger)' }}
                        onClick={(e) => handleDelete(job.id, e)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JobQueue;
