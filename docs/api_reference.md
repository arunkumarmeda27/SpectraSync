# SpectraSync: REST API & WebSocket Reference

The SpectraSync backend exposes a high-performance RESTful API and bi-directional WebSocket interface built on FastAPI.

Interactive OpenAPI documentation is available when running the server at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 1. Authentication & Security

All analysis, job, file, and report endpoints are protected and require a valid JSON Web Token (JWT). Unauthenticated requests receive `401 Unauthorized`.

### Endpoints

- **`POST /api/auth/login`**: Authenticate using email and password.
  - *Request Body*: `{"email": "analyst@spectrasync.io", "password": "analyst123"}`
  - *Returns*: `{"access_token": "...", "token_type": "bearer", "user": {...}}`
- **`POST /api/auth/logout`**: Terminate active session.
  - *Header*: `Authorization: Bearer <access_token>`
  - *Returns*: `{"message": "Successfully logged out"}`
- **`GET /api/auth/me`**: Retrieve authenticated user profile.
  - *Header*: `Authorization: Bearer <access_token>`
  - *Returns*: `{"id": 1, "email": "analyst@spectrasync.io", "role": "analyst", "created_at": "..."}`
- **`POST /api/auth/register`**: Register a new user account (roles: `analyst`, `admin`).

### Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| Analyst | `analyst@spectrasync.io` | `analyst123` |
| Administrator | `admin@spectrasync.io` | `admin123` |

---

## 2. Core Endpoints

### System Health (Public)
- **`GET /api/health`**: Quick ping checking API responsiveness.
- **`GET /api/health/services`**: Detailed status of Database, Object Storage, and Worker queues.

### Signal Ingestion (Protected)
- **`POST /api/files/upload`**: Multipart file upload (`.iq`, `.wav`, `.complex`, `.bin`).
  - *Returns*: `SignalFileOut` metadata object with SHA-256 hash, format, and storage path.
- **`GET /api/files`**: List all uploaded signal files.
- **`GET /api/files/{id}`**: Retrieve file metadata and inspection summary.
- **`GET /api/files/{id}/content`**: Stream raw file contents.
- **`DELETE /api/files/{id}`**: Delete signal file and associated artifacts.

### Analysis Jobs (Protected)
- **`POST /api/jobs`**: Create and enqueue a new DSP analysis job.
  - *Body*: `{"signal_file_id": 1, "pipeline_config": {"max_samples": 524288}}`
  - *Returns*: `AnalysisJobOut` with initial status `queued`.
- **`GET /api/jobs`**: List jobs with status filters (`queued`, `running`, `completed`, `failed`).
- **`GET /api/jobs/{id}`**: Detailed job status and execution progress.
- **`GET /api/jobs/{id}/status`**: Real-time progress percentage and active stage.
- **`POST /api/jobs/{id}/retry`**: Re-enqueue a failed analysis job.
- **`DELETE /api/jobs/{id}`**: Delete job record and child entities.

### Analysis Results (Protected)
- **`GET /api/jobs/{id}/analysis`**: Comprehensive output bundle including estimated parameters, classification candidates, constellation points, and recovered bit stream.
- **`GET /api/jobs/{id}/parameters`**: Estimated physical parameters with confidence badges and DSP provenance.
- **`GET /api/jobs/{id}/modulation`**: Modulation classification distribution and ML evidence.
- **`GET /api/jobs/{id}/synchronization`**: Timing recovery and carrier recovery metrics.
- **`GET /api/jobs/{id}/demodulation`**: Constellation symbol points and demodulator decisions.
- **`GET /api/jobs/{id}/recovery`**: De-interleaving and FEC decoding metrics.
- **`GET /api/jobs/{id}/bitstream`**: Recovered bit stream (Hex dump, ASCII, framing headers).
- **`GET /api/jobs/{id}/correlation`**: Preamble sync correlation score and peak offset.
- **`GET /api/jobs/{id}/artifacts`**: List stored analysis artifacts.

### Demo Signals
- **`GET /api/demos/list`**: List synthetic golden signals (Public).
- **`POST /api/demos/{key}/load`**: One-click ingestion and automated execution (Protected).

### Reports (Protected)
- **`POST /api/jobs/{id}/report?export_format={json|csv|html}`**: Generate and export downloadable analysis reports.
- **`GET /api/reports`**: List completed jobs available for report export.
- **`GET /api/reports/{id}`**: Retrieve detailed JSON report.

---

## 3. WebSocket Interface

### Live Job Progress
- **`WS /ws/jobs/{job_id}`**: Real-time broadcast channel emitting streaming telemetry for a running analysis job.

#### Payload Schema:
```json
{
  "job_id": 42,
  "stage": "demodulation",
  "status": "processing",
  "progress": 68,
  "message": "QPSK symbol recovery in progress",
  "timestamp": 1726723456.78
}
```
