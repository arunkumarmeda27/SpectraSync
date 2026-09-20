<div align="center">

# SpectraSync

### Automated .IQ / .WAV Signal Analysis Platform

> *From Raw Recordings to Meaningful Signal Insights*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Tests](https://img.shields.io/badge/Tests-33%20Passing-10b981?style=flat-square&logo=pytest&logoColor=white)](#testing)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)](LICENSE)

</div>

---

## Overview

**SpectraSync** is a production-grade Digital Signal Processing (DSP) and automated signal intelligence platform designed for RF engineers, researchers, and defense analysts. Upload a raw `.IQ` or `.WAV` recording (or pick from the built-in Golden Vector Demo Suite) and SpectraSync automatically runs it through an end-to-end 13-stage analysis pipeline — estimating carrier frequencies, classifying modulations using higher-order cumulants and machine learning, recovering bit streams, and generating comprehensive forensic PDF reports.

Built for the **Smart India Hackathon 2026 (SIH26147)** with a focus on automated signal intelligence at scale.

---

## Features

| Category | Capability |
|---|---|
| **Ingestion** | `.IQ`, `.WAV`, `.complex`, `.bin`, `.dat` — up to 2 GB with SHA-256 integrity verification |
| **DSP Pipeline** | 13 automated stages: DC removal, filtering, FFT, spectrogram, parameter estimation, modulation classification, carrier/clock recovery, demodulation, de-interleaving, FEC decoding, bitstream analysis, cross-correlation |
| **Modulation Classification** | Hybrid cumulant ($C_{40}, C_{42}, C_{63}$) + Random Forest ML classifier (BPSK, QPSK, 8-PSK, 16-QAM, 64-QAM, 2-FSK, 4-FSK, AM, FM, UNKNOWN) |
| **Visualizations** | Time Domain (I/Q), Welch FFT Spectrum, STFT Spectrogram/Waterfall, Constellation Diagram, Eye Diagram |
| **Parameter Inference** | Sample Rate, Carrier Frequency, Bandwidth, Symbol Rate, SNR (Welch & EVM-based) |
| **Bit Stream Recovery** | Block/Convolutional De-interleaving, Viterbi & Reed-Solomon FEC Decoding, Barker/CCSDS Frame Sync |
| **Reports & Export** | Forensic PDF report (ReportLab), raw bitstream binary/hex, CSV metrics, and JSON analysis packages |
| **Real-Time Progress** | Live WebSocket progress streaming (`/ws/jobs/{job_id}`) stage-by-stage |
| **One-Click Demos** | Built-in Golden Vector demo signals (BPSK, QPSK, FSK, 16QAM, Noisy, Unknown) for immediate evaluation |
| **Security & Auth** | JWT-based authentication, PBKDF2 password hashing, RBAC (Admin/Analyst) |
| **API** | Full REST API with OpenAPI/Swagger documentation & WebSocket streaming |
| **Deployment** | Multi-stage Docker Compose stack (Nginx + FastAPI + Redis + Worker Pool) |

---

## Architecture

```
+----------------------------------------------------------------------+
|                        SpectraSync Platform                           |
|                                                                        |
|  +-------------+    +--------------+    +-----------------------+    |
|  |   Frontend   |    |   Backend    |    |    DSP Workers         |    |
|  |  React + TS  |<-->|  FastAPI     |<-->|  13-Stage Pipeline    |    |
|  |  Vite + HMR  |    |  SQLAlchemy  |    |  NumPy / SciPy        |    |
|  +-------------+    +------+-------+    +-----------------------+    |
|                             |                                           |
|                    +--------v--------+                                  |
|                    |   SQLite / DB   |                                  |
|                    |  Signal Files   |                                  |
|                    |  Job Results    |                                  |
|                    +-----------------+                                  |
+----------------------------------------------------------------------+
```

### DSP Pipeline — 13 Stages

```
[1]  File Ingestion      ->  Validate, checksum (SHA-256), read IQ/WAV samples
[2]  DC Removal          ->  Mean subtraction, normalize amplitude
[3]  Bandpass Filter     ->  Kaiser FIR, configurable cutoff
[4]  FFT Spectrum        ->  Welch PSD, peak detection, noise floor
[5]  Spectrogram         ->  STFT waterfall, time-frequency heatmap
[6]  Parameter Inference ->  Carrier freq, bandwidth, symbol rate, SNR
[7]  Modulation Class.   ->  Cumulant-based + ML classifier (BPSK/QPSK/QAM/FSK)
[8]  Clock Sync          ->  Gardner / Mueller-Muller TED, PLL
[9]  Demodulation        ->  Decision-directed coherent demodulation
[10] De-interleaving     ->  Block / convolutional de-interleaver
[11] FEC Decoding        ->  Viterbi, Reed-Solomon (auto-detect)
[12] Bit Stream Analysis ->  Frame sync, protocol pattern detection
[13] Correlation         ->  Cross-correlation, lag analysis, results aggregation
```

---

## Project Structure

```
SpectraSync/
+-- backend/                    # FastAPI application
|   +-- app/
|       +-- api/                # Routers: signals, jobs, results, reports, health
|       +-- models/             # SQLAlchemy ORM models
|       +-- schemas/            # Pydantic request/response schemas
|       +-- services/           # DSP orchestration, report generation
+-- frontend/                   # React + TypeScript UI
|   +-- src/
|       +-- pages/              # Dashboard, Upload, Jobs, Visualizations, ...
|       +-- components/         # Sidebar, DashboardPlots, Shared
|       +-- index.css           # SpectraSync design system
+-- processing/                 # DSP stage implementations (13 modules)
+-- workers/                    # Background job workers
+-- ml/                         # ML model assets
+-- tests/                      # 24 unit + integration tests
+-- docs/                       # Architecture, API reference, user guide
+-- docker/                     # Multi-stage Dockerfiles
+-- docker-compose.yml          # Production orchestration
+-- BRAIN.md                    # Project tracker & decision log
+-- requirements.txt
```

---

## Quick Start

### Option 1 — Docker (Recommended)

```bash
git clone https://github.com/arunkumarmeda27/SpectraSync.git
cd SpectraSync
cp .env.example .env
docker compose up --build
# Open http://localhost
```

### Option 2 — Local Development

**Backend:**

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./spectrasync.db` | Database connection string |
| `UPLOAD_DIR` | `./data/uploads` | File upload directory |
| `MAX_UPLOAD_SIZE_MB` | `2048` | Max file size in MB |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis for production job queue |
| `SECRET_KEY` | — | JWT secret key |

---

## API Reference

Interactive docs at **`http://localhost:8000/docs`** (Swagger UI)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signals/upload` | Upload a `.IQ` or `.WAV` file |
| `POST` | `/api/jobs/` | Create and dispatch analysis job |
| `GET` | `/api/jobs/` | List all jobs with status |
| `GET` | `/api/jobs/{job_id}` | Get job details & progress |
| `GET` | `/api/results/{job_id}` | Get full analysis results |
| `GET` | `/api/reports/{job_id}` | Export report (JSON/CSV/HTML) |
| `GET` | `/api/health` | System health check |

```bash
# Upload a signal file
curl -X POST http://localhost:8000/api/signals/upload \
  -F "file=@satellite_capture.iq"

# Start analysis job
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Content-Type: application/json" \
  -d '{"signal_id": 42, "job_name": "Satellite Analysis #1"}'

# Get results
curl http://localhost:8000/api/results/1024
```

---

## Testing

```bash
python -m pytest tests/ -v
# 33 passed in ~17s
```

**Test Coverage Highlights:**
- **Golden Test Vectors**: Known-ground-truth verification on synthetic recordings (BPSK, QPSK, 2-FSK, 16-QAM, Unknown fallback).
- **Authentication & Security**: PBKDF2 password hashing, JWT creation/validation, RBAC roles, protected endpoints.
- **DSP Pipeline Stages**: DC removal, power normalization, FIR filtering, carrier frequency, bandwidth, SNR, cumulant feature extraction, PSK/QAM/FSK demodulation, Viterbi/Reed-Solomon codecs, bitstream extractor, Barker/CCSDS header detection, cross-correlation.
- **Backend API & Workflows**: Health check probes, demo signal listing, end-to-end demo execution through the full pipeline.

---

## Tech Stack

**Backend:** FastAPI · SQLAlchemy · NumPy · SciPy · Pydantic v2  
**Frontend:** React 18 · TypeScript 5 · Vite · React Router v6 · Lucide React · HTML5 Canvas  
**Infrastructure:** Docker · Nginx · Redis  

---

## Documentation

| Document | Description |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System architecture & component diagram |
| [`docs/dsp_pipeline.md`](docs/dsp_pipeline.md) | Deep-dive into all 13 DSP stages |
| [`docs/api_reference.md`](docs/api_reference.md) | Full REST API reference |
| [`docs/user_guide.md`](docs/user_guide.md) | End-user walkthrough |
| [`BRAIN.md`](BRAIN.md) | Project decision log & tracker |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: add FM demodulator"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Requirements: `pytest tests/ -v` must pass · `npx tsc --noEmit` must return 0 errors.

---

## License

MIT License — see [LICENSE](LICENSE).

---

<div align="center">

Built with love for **Smart India Hackathon 2026 — Problem Statement SIH26147**

**SpectraSync** · *Built for a smarter spectrum*

</div>
