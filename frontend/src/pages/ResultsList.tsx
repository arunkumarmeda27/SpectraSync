// Results listing page — browse all completed analysis results
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye } from 'lucide-react';
import { listJobs, type AnalysisJob } from '../api';
import { ModBadge, StatusBadge, ConfidenceMeter, fmtDate, EmptyState, Spinner, SectionHeader } from '../components/Shared';

const ResultsList: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('completed');

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => filter === 'all' ? true : j.status === filter);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <Spinner size={24} /><span style={{ color: 'var(--text-secondary)' }}>Loading…</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Analysis Results"
        subtitle="Browse completed DSP analysis results"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'completed', 'failed'] as const).map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Activity size={32} />}
          title="No results yet"
          description="Run an analysis job to see results here"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(job => (
            <div
              key={job.id}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.25rem' }}
              onClick={() => navigate(`/results/${job.id}`)}
            >
              {/* Job ID */}
              <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: 40 }}>
                #{job.id}
              </div>

              {/* File info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }} className="truncate">
                  {job.signal_file?.filename || `Signal File #${job.signal_file_id}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {fmtDate(job.created_at)}
                  {job.signal_file?.format && ` · ${job.signal_file.format.toUpperCase()}`}
                </div>
              </div>

              {/* Status */}
              <StatusBadge status={job.status} />

              {/* Modulation */}
              {job.result ? (
                <ModBadge mod={job.result.primary_modulation} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: 60, textAlign: 'center' }}>—</span>
              )}

              {/* Confidence ring */}
              {job.result ? (
                <ConfidenceMeter value={job.result.confidence} />
              ) : (
                <div style={{ width: 100, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</div>
              )}

              {/* Actions */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={e => { e.stopPropagation(); navigate(`/results/${job.id}`); }}
              >
                <Eye size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsList;
