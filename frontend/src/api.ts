// API client for SpectraSync backend
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SignalFile {
  id: number;
  filename: string;
  original_filename: string;
  file_format: string;
  size: number;
  checksum: string;
  sample_rate: number | null;
  sample_count: number | null;
  duration_sec: number | null;
  center_frequency: number | null;
  bit_depth: number | null;
  channels: number | null;
  storage_path: string;
  uploaded_at: string;
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
}

export interface ProcessingStage {
  id: number;
  job_id: number;
  stage_name: string;
  status: string;
  duration_ms: number;
  metrics: Record<string, unknown>;
  error: string | null;
}

export interface DemoSignal {
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
  const res = await api.post<SignalFile>('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return res.data;
};

export const listFiles = async () => (await api.get<SignalFile[]>('/files')).data;

export const deleteFile = async (id: number) => (await api.delete(`/files/${id}`)).data;

// ─── Job Endpoints ────────────────────────────────────────────────────────────

export const createJob = async (signalFileId: number, config?: Record<string, unknown>) =>
  (await api.post<AnalysisJob>('/jobs', { signal_file_id: signalFileId, pipeline_config: config || {} })).data;

export const listJobs = async () => (await api.get<AnalysisJob[]>('/jobs')).data;

export const getJob = async (id: number) => (await api.get<AnalysisJob>(`/jobs/${id}`)).data;

export const getJobStatus = async (id: number) =>
  (await api.get<{ job_id: number; status: string; progress: number; current_stage: string | null; error: string | null; completed_at: string | null }>(`/jobs/${id}/status`)).data;

export const retryJob = async (id: number) => (await api.post<AnalysisJob>(`/jobs/${id}/retry`)).data;

export const deleteJob = async (id: number) => (await api.delete(`/jobs/${id}`)).data;

// ─── Analysis Endpoints ───────────────────────────────────────────────────────

export const getAnalysisResult = async (jobId: number) =>
  (await api.get<AnalysisResult>(`/analysis/${jobId}`)).data;

export const getStages = async (jobId: number) =>
  (await api.get<ProcessingStage[]>(`/analysis/${jobId}/stages`)).data;

// ─── Demo Endpoints ───────────────────────────────────────────────────────────

export const listDemos = async () => (await api.get<DemoSignal[]>('/demos')).data;

export const loadDemo = async (filename: string) =>
  (await api.post<{ file: SignalFile; job: AnalysisJob }>('/demos/load', { filename })).data;

// ─── Report Endpoints ─────────────────────────────────────────────────────────

export const generateReport = async (jobId: number, format: 'json' | 'pdf' = 'json') =>
  (await api.post(`/reports/${jobId}/generate`, { format })).data;

// ─── Health ───────────────────────────────────────────────────────────────────

export const getHealth = async () => (await api.get<HealthStatus>('/health')).data;

export default api;
