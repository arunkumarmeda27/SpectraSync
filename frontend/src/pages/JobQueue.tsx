// Job History Page - Professional Analysis Job Queue & Management
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Trash2,
  RotateCcw,
  Eye,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Download,
  FileCode
} from 'lucide-react';
import { listJobs, deleteJob, retryJob, type AnalysisJob } from '../api';
import {
  StatusBadge,
  ModBadge,
  ProgressBar,
  fmtDate,
  fmtSize,
  Spinner,
  EmptyState,
  SectionHeader
} from '../components/Shared';
import { useStore } from '../store';

const JobQueue: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, setActiveJobId } = useStore();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const allJobs = await listJobs();
      setJobs(allJobs);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete job #${id}?`)) return;
    try {
      await deleteJob(id);
      setJobs((js) => js.filter((j) => j.id !== id));
      addToast('success', `Job #${id} deleted`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleRetry = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await retryJob(id);
      setJobs((js) => js.map((j) => (j.id === id ? updated : j)));
      addToast('info', `Job #${id} requeued`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Retry failed');
    }
  };

  const handleViewJob = (jobId: number) => {
    setActiveJobId(jobId);
    navigate(`/results/${jobId}`);
  };

  // Filter & search
  const filteredJobs = jobs.filter((job) => {
    const statusMatch = filterStatus === 'all' || job.status === filterStatus;
    const searchMatch =
      searchQuery === '' ||
      String(job.id).includes(searchQuery) ||
      job.signal_file?.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.result?.primary_modulation?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  // Stats
  const stats = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    processing: jobs.filter((j) => j.status === 'processing' || j.status === 'validating').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    queued: jobs.filter((j) => j.status === 'queued').length
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <Spinner size={24} />
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading analysis job queue...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Analysis Job History"
        subtitle="Manage and monitor signal analysis jobs across the DSP pipeline"
        icon={<Clock size={18} />}
        tag="JOB QUEUE"
        actions={
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              className="btn-workstation-secondary"
              onClick={() => load(true)}
              disabled={refreshing}
              style={{ minWidth: '90px' }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </button>
            <button className="btn-workstation-primary" onClick={() => navigate('/upload')}>
              <Upload size={14} /> New Job
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            background: 'rgba(12, 20, 38, 0.8)',
            border: '1px solid #162445',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
            {stats.total}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(12, 20, 38, 0.8)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
            {stats.completed}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(12, 20, 38, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Processing</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
            {stats.processing}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(12, 20, 38, 0.8)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Queued</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
            {stats.queued}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(12, 20, 38, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Failed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
            {stats.failed}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(12, 20, 38, 0.6)',
          border: '1px solid #162445',
          borderRadius: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} color="#64748b" />
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: '#091022',
              border: '1px solid #1a2645',
              color: '#f1f5f9',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="validating">Validating</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Search by job ID, filename, or modulation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: '#091022',
              border: '1px solid #1a2645',
              color: '#f1f5f9',
              padding: '0.3rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
          {filteredJobs.length} / {jobs.length} jobs
        </div>
      </div>

      {/* Jobs Table */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Clock size={32} />}
          title={searchQuery || filterStatus !== 'all' ? 'No matching jobs' : 'No analysis jobs'}
          description={
            searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Upload a signal file or load a demo to begin analysis'
          }
          action={
            <button className="btn-workstation-primary" onClick={() => navigate('/upload')}>
              <Upload size={14} /> Upload Signal
            </button>
          }
        />
      ) : (
        <div className="panel-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Job ID</th>
                  <th style={{ minWidth: '200px' }}>Signal File</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '140px' }}>Progress</th>
                  <th style={{ width: '100px' }}>Modulation</th>
                  <th style={{ width: '90px' }}>Confidence</th>
                  <th style={{ width: '150px' }}>Started</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                    onClick={() => handleViewJob(job.id)}
                  >
                    <td>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#38bdf8'
                        }}
                      >
                        #{job.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileCode size={16} color="#64748b" />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              color: '#f1f5f9',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {job.signal_file?.filename ?? `file_${job.signal_file_id}`}
                          </div>
                          {job.signal_file?.size && (
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtSize(job.signal_file.size)} · {job.signal_file.format?.toUpperCase() || 'RAW'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <StatusBadge status={job.status} />
                        {job.current_stage && job.status !== 'completed' && (
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{job.current_stage}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <ProgressBar value={job.progress} height={5} />
                        <span
                          style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
                        >
                          {job.progress}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {job.result?.primary_modulation ? (
                        <ModBadge mod={job.result.primary_modulation} />
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.72rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      {job.result?.confidence ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: job.result.confidence >= 0.85 ? '#10b981' : job.result.confidence >= 0.6 ? '#f59e0b' : '#ef4444',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.75rem'
                          }}
                        >
                          {Math.round(job.result.confidence * 100)}%
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.72rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {job.started_at ? fmtDate(job.started_at) : job.created_at ? fmtDate(job.created_at) : '—'}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-icon-xs"
                          onClick={() => handleViewJob(job.id)}
                          title="View analysis results"
                        >
                          <Eye size={13} />
                        </button>
                        {job.status === 'failed' && (
                          <button
                            className="btn-icon-xs"
                            onClick={(e) => handleRetry(job.id, e)}
                            title="Retry analysis"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                        <button
                          className="btn-icon-xs"
                          onClick={(e) => handleDelete(job.id, e)}
                          title="Delete job"
                          style={{ color: '#ef4444' }}
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
        </div>
      )}
    </div>
  );
};

export default JobQueue;
