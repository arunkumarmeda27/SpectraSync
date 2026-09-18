# SpectraSync: REST API & WebSocket Reference

The SpectraSync backend exposes a high-performance RESTful API and bi-directional WebSocket interface built on FastAPI.

Interactive OpenAPI documentation is available when running the server at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 1. Core Endpoints

### System Health
- **`GET /api/health`**: Quick ping checking API responsiveness.
- **`GET /api/health/services`**: Detailed status of Database, Object Storage, and Worker queues.

### Signal Ingestion
- **`POST /api/files/upload`**: Multipart file upload (`.iq`, `.wav`, `.complex`, `.bin`).
  - *Returns*: `SignalFileOut` metadata object with SHA-256 hash, format, and storage path.
- **`GET /api/files`**: List all uploaded signal files with pagination.
- **`GET /api/files/{id}`**: Retrieve file metadata and inspection summary.

### Analysis Jobs
- **`POST /api/jobs`**: Create and enqueue a new DSP analysis job.
  - *Body*: `{"file_id": 1, "config": {"max_samples": 524288}}`
  - *Returns*: `AnalysisJobOut` with initial status `queued`.
- **`GET /api/jobs`**: List jobs with status filters (`queued`, `running`, `completed`, `failed`).
- **`GET /api/jobs/{id}`**: Detailed job status and execution progress.
- **`GET /api/jobs/{id}/stages`**: Stage-by-stage execution timings and telemetry records.
- **`GET /api/jobs/{id}/analysis`**: Comprehensive output bundle including estimated parameters, classification candidates, constellation points, and recovered bit stream.

### Demo Signals
- **`GET /api/demos/list`**: List synthetic golden signals (BPSK, QPSK, 2-FSK, 16-QAM, Noisy, Unknown).
- **`POST /api/demos/{key}/load`**: One-click ingestion and automated execution of the selected golden vector.

### Reports
- **`POST /api/jobs/{id}/report?export_format={json|csv|html}`**: Generate and export downloadable analysis reports.

---

## 2. WebSocket Interface

### Live Job Progress
- **`WS /ws/jobs/{job_id}`**: Real-time broadcast channel emitting streaming telemetry for a running analysis job.

#### Payload Schema:
```json
{
  "job_id": 42,
  "stage": "demodulation",
  "progress": 78,
  "message": "Demodulating QPSK symbols to bit stream",
  "status": "running"
}
```
When analysis completes:
```json
{
  "job_id": 42,
  "stage": "result_packaging",
  "progress": 100,
  "status": "completed",
  "primary_modulation": "QPSK",
  "confidence": 0.965
}
```
