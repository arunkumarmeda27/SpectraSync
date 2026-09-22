// API client for SpectraSync backend
import axios from 'axios';
import { queryCache, TTL } from './queryCache';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for large file uploads
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spectrasync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('spectrasync_token');
      localStorage.removeItem('spectrasync_user');
      window.location.href = '/login';
    }
    const msg = err.response?.data?.detail || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SignalFile {
  id: number;
  filename: string;
  original_filename?: string | null;
  format: string;
  size: number;
  checksum: string;
  sample_rate: number;
  channels: number;
  sample_format: string;
  center_frequency: number;
  storage_path: string;
  uploaded_at: string;
}

export interface FileUploadResponse {
  file: SignalFile;
  validation_status: string;
  warnings: string[];
}

export interface AnalysisJob {
  id: number;
  signal_file_id: number;
  status: string;
  progress: number;
  current_stage: string | null;
  error: string | null;
  pipeline_config: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  signal_file?: SignalFile;
  result?: AnalysisResult;
}

export interface AnalysisResult {
  id: number;
  job_id: number;
  primary_modulation: string;
  confidence: number;
  parameters: Record<string, unknown>;
  modulation_candidates: Array<{ modulation: string; confidence: number }>;
  synchronization_data: Record<string, unknown>;
  demodulation_data: Record<string, unknown>;
  visualizations: Record<string, unknown>;
  modulation?: { primary_modulation: string; primary_confidence: number; candidates: Array<Record<string, unknown>> };
  modulation_evidence?: { features: Record<string, number>; consistency_notes: string[] };
  synchronization?: Record<string, unknown>;
  demodulation?: Record<string, unknown>;
}

// Import full analysis types
export type { FullAnalysisResult, AnalysisParameters, AnalysisVisualizationData } from './types/visualizations';

export interface ProcessingStage {
  id: number;
  job_id: number;
  stage_name: string;
  status: string;
  duration_ms: number;
  metrics: Record<string, unknown>;
  error: string | null;
}

export interface BitstreamAnalysis {
  job_id: number;
  length: number;
  symbol_count: number;
  bits_per_symbol: number;
  bit_rate_bps: number;
  bit_density: number;
  transition_density: number;
  ones_count: number;
  zeros_count: number;
  binary_preview: string;
  hex_dump: Array<{ offset: string; hex: string; ascii: string }>;
  ascii_preview: string;
  correlation_score: number;
  header_offsets: Array<number | { header_type?: string; bit_offset?: number; byte_offset?: number; confidence?: number; errors?: number }>;
  payload_frames: Array<Record<string, unknown>>;
  hex_stream: string;
  ascii_stream: string;
}

export interface DemoSignal {
  key: string;
  name: string;
  modulation: string;
  filename: string;
  description: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  db: string;
  storage: string;
  worker: string;
  golden_signals: number;
}

// ─── File Endpoints ───────────────────────────────────────────────────────────

export const uploadFile = async (file: File, onProgress?: (p: number) => void) => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<FileUploadResponse>('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  // Invalidate file list so next fetch shows the new file
  queryCache.invalidate('files/list');
  return res.data.file;
};

export const listFiles = async () => {
  const cached = queryCache.get<SignalFile[]>('files/list');
  if (cached) return cached;
  const data = (await api.get<SignalFile[]>('/files')).data;
  queryCache.set('files/list', data, TTL.FILES_LIST);
  return data;
};

export const deleteFile = async (id: number) => {
  const res = (await api.delete(`/files/${id}`)).data;
  queryCache.invalidate('files/list');
  return res;
};

// ─── Job Endpoints ────────────────────────────────────────────────────────────

export const createJob = async (signalFileId: number, config?: Record<string, unknown>) => {
  const job = (await api.post<AnalysisJob>('/jobs', { signal_file_id: signalFileId, pipeline_config: config || {} })).data;
  // Invalidate job list so next fetch shows the new job
  queryCache.invalidate('jobs/list');
  return job;
};

export const listJobs = async () => {
  const cached = queryCache.get<AnalysisJob[]>('jobs/list');
  if (cached) return cached;
  const data = (await api.get<AnalysisJob[]>('/jobs')).data;
  queryCache.set('jobs/list', data, TTL.JOBS_LIST);
  return data;
};

export const getJob = async (id: number) => {
  const key = `jobs/${id}`;
  const cached = queryCache.get<AnalysisJob>(key);
  if (cached) return cached;
  const data = (await api.get<AnalysisJob>(`/jobs/${id}`)).data;
  // Only cache completed/failed jobs — active jobs must stay fresh
  if (data.status === 'completed' || data.status === 'failed') {
    queryCache.set(key, data, TTL.ANALYSIS_RESULT);
  }
  return data;
};

export const getJobStatus = async (id: number) =>
  (await api.get<{ job_id: number; status: string; progress: number; current_stage: string | null; error: string | null; completed_at: string | null }>(`/jobs/${id}/status`)).data;

export const retryJob = async (id: number) => {
  const job = (await api.post<AnalysisJob>(`/jobs/${id}/retry`)).data;
  queryCache.invalidate('jobs/list');
  queryCache.invalidate(`jobs/${id}`);
  return job;
};

export const deleteJob = async (id: number) => {
  const res = (await api.delete(`/jobs/${id}`)).data;
  queryCache.invalidate('jobs/list');
  queryCache.invalidate(`jobs/${id}`);
  queryCache.invalidatePrefix(`analysis/${id}`);
  return res;
};

// ─── Analysis Endpoints ───────────────────────────────────────────────────────

export const getAnalysisResult = async (jobId: number) => {
  const key = `analysis/${jobId}/result`;
  const cached = queryCache.get<AnalysisResult>(key);
  if (cached) return cached;
  const data = (await api.get<AnalysisResult>(`/jobs/${jobId}/analysis`)).data;
  queryCache.set(key, data, TTL.ANALYSIS_RESULT);
  return data;
};

export const getStages = async (jobId: number) => {
  const key = `analysis/${jobId}/stages`;
  const cached = queryCache.get<ProcessingStage[]>(key);
  if (cached) return cached;
  const data = (await api.get<ProcessingStage[]>(`/jobs/${jobId}/stages`)).data;
  queryCache.set(key, data, TTL.STAGES);
  return data;
};

export const getBitstream = async (jobId: number) => {
  const key = `analysis/${jobId}/bitstream`;
  const cached = queryCache.get<BitstreamAnalysis>(key);
  if (cached) return cached;
  const data = (await api.get<BitstreamAnalysis>(`/jobs/${jobId}/bitstream`)).data;
  queryCache.set(key, data, TTL.ANALYSIS_RESULT);
  return data;
};

// ─── Demo Endpoints ───────────────────────────────────────────────────────────

export const listDemos = async () => {
  const cached = queryCache.get<DemoSignal[]>('demos/list');
  if (cached) return cached;
  const data = (await api.get<DemoSignal[]>('/demos/list')).data;
  queryCache.set('demos/list', data, TTL.DEMOS_LIST);
  return data;
};

export const loadDemo = async (demoKey: string) => {
  const job = (await api.post<AnalysisJob>(`/demos/${demoKey}/load`)).data;
  queryCache.invalidate('jobs/list');
  return job;
};

// ─── Report Endpoints ─────────────────────────────────────────────────────────

export const generateReport = async (jobId: number, format: 'json' | 'pdf' | 'csv' | 'html' = 'json') =>
  (await api.post(`/jobs/${jobId}/report?export_format=${format}`)).data;

export const downloadReport = async (jobId: number, format: 'json' | 'pdf' | 'csv' | 'html' = 'pdf') => {
  const res = await api.post(`/jobs/${jobId}/report?export_format=${format}`, null, {
    responseType: format === 'json' ? 'json' : 'blob',
  });

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spectrasync_job_${jobId}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    html: 'text/html'
  };

  const blob = new Blob([res.data], { type: mimeMap[format] || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spectrasync_job_${jobId}_report.${format}`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    role: string;
    created_at: string;
  };
}

export const loginUser = async (email: string, password: string): Promise<AuthResponse> =>
  (await api.post<AuthResponse>('/auth/login', { email, password })).data;

export const getMe = async () =>
  (await api.get<{ id: number; email: string; role: string; created_at: string }>('/auth/me')).data;

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore error on logout
  } finally {
    localStorage.removeItem('spectrasync_token');
    localStorage.removeItem('spectrasync_user');
  }
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const getHealth = async () => {
  const cached = queryCache.get<HealthStatus>('health');
  if (cached) return cached;
  const data = (await api.get<HealthStatus>('/health')).data;
  queryCache.set('health', data, TTL.HEALTH);
  return data;
};

export default api;
