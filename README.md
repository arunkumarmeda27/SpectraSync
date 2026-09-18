<div align="center">

# SpectraSync

### Automated .IQ / .WAV Signal Analysis Platform

> *From Raw Recordings to Meaningful Signal Insights*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Tests](https://img.shields.io/badge/Tests-24%20Passing-10b981?style=flat-square&logo=pytest&logoColor=white)](#testing)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)](LICENSE)

</div>

---

## Overview

**SpectraSync** is a production-grade Digital Signal Processing (DSP) platform designed for engineers, researchers, and signal intelligence analysts. Upload a raw `.IQ` or `.WAV` recording and SpectraSync automatically runs it through a 13-stage analysis pipeline — extracting carrier frequencies, identifying modulation schemes, recovering bit streams, and generating comprehensive reports.

Built for the **Smart India Hackathon 2026 (SIH26147)** with a focus on automated signal intelligence at scale.

---

## Features

| Category | Capability |
|---|---|
| **Ingestion** | `.IQ`, `.WAV`, `.complex`, `.bin`, `.dat` — up to 2 GB |
| **DSP Pipeline** | 13 automated stages from raw samples to recovered bits |
| **Modulation Detection** | BPSK, QPSK, 8-PSK, 16-QAM, 64-QAM, OFDM, FSK, AM, FM |
| **Visualizations** | Time Domain, FFT Spectrum, Spectrogram/Waterfall, Constellation Diagram |
| **Parameter Inference** | Sample Rate, Carrier Frequency, Bandwidth, Symbol Rate, SNR |
| **Bit Stream Recovery** | De-interleaving, FEC Decoding, BER estimation |
| **Reports** | PDF / HTML / CSV export with full analysis details |
| **Job Management** | Queue-based job dispatch, history, real-time progress tracking |
| **API** | Full REST API with OpenAPI/Swagger documentation |
| **Deployment** | Docker Compose production stack (Nginx + FastAPI + Redis + Workers) |

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
# 24 passed in ~11s
```

Coverage: file validation, all 13 DSP pipeline stages, REST API endpoints, end-to-end QPSK execution.

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
