# SpectraSync

<div align="center">

### 🛰️ Automated Signal Intelligence Workstation

> *From Raw Recordings to Meaningful Signal Insights*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-33%20Passing-10b981?style=flat-square&logo=pytest&logoColor=white)](#testing)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)](LICENSE)
[![SIH26147](https://img.shields.io/badge/SIH-26147-7c3aed?style=flat-square)](https://www.sih.gov.in/)

**[Features](#-features)** • **[Quick Start](#-quick-start)** • **[Documentation](#-documentation)** • **[API](#-api-reference)** • **[Demo](#-demo)**

![SpectraSync Dashboard](https://via.placeholder.com/1200x600/060913/38bdf8?text=SpectraSync+Dark+Workstation+UI)

</div>

---

## 🎯 Overview

**SpectraSync** is a production-grade **Signal Intelligence Workstation** designed for RF engineers, researchers, and defense analysts. Upload a raw `.IQ` or `.WAV` recording and SpectraSync automatically executes a comprehensive **13-stage DSP analysis pipeline** — estimating carrier frequencies, classifying modulations using higher-order cumulants and machine learning, recovering bit streams, and generating forensic PDF reports.

Built for **Smart India Hackathon 2026 (SIH26147)** with enterprise-grade architecture, dark cyber-aesthetic UI, and real-time WebSocket progress streaming.

### 🌟 What Makes SpectraSync Special?

✅ **Professional Dark Workstation UI** - Cyber-aesthetic interface with neon visualizations, real-time telemetry, and 8-panel interactive dashboard  
✅ **Complete DSP Pipeline** - 13 automated stages from ingestion to correlation with ML-powered modulation classification  
✅ **Real-Time Progress** - WebSocket streaming shows pipeline execution stage-by-stage  
✅ **Golden Vector Demos** - 6 built-in test signals (BPSK, QPSK, 2-FSK, 16-QAM, Noisy, Unknown) for instant evaluation  
✅ **Production Ready** - Full authentication, RBAC, Docker deployment, PostgreSQL/Redis support, API documentation  
✅ **Zero Setup Testing** - In-memory worker pool for local development without Redis/PostgreSQL  

---

## ✨ Features

| Category | Capabilities |
|----------|-------------|
| **Ingestion** | `.IQ`, `.WAV`, `.complex`, `.bin`, `.dat` — up to 2 GB with SHA-256 integrity verification |
| **DSP Pipeline** | 13 automated stages: DC removal, filtering, FFT, spectrogram, parameter estimation, modulation classification, carrier/clock recovery, demodulation, de-interleaving, FEC decoding, bitstream analysis, cross-correlation |
| **Modulation Classification** | Hybrid cumulant ($C_{40}, C_{42}, C_{63}$) + Random Forest ML classifier (BPSK, QPSK, 8-PSK, 16-QAM, 64-QAM, 2-FSK, 4-FSK, AM, FM, UNKNOWN) |
| **Visualizations** | Live Signal Spectrum (FFT), STFT Waterfall, Time Domain I/Q Waveform, Constellation Diagram, Eye Diagram — all with dark neon aesthetic |
| **Parameter Inference** | Sample Rate, Carrier Frequency, Bandwidth, Symbol Rate, SNR (Welch & EVM-based) with confidence scores |
| **Bit Stream Recovery** | Block/Convolutional De-interleaving, Viterbi & Reed-Solomon FEC Decoding, Barker/CCSDS Frame Sync |
| **Reports & Export** | Forensic PDF report (ReportLab), raw bitstream binary/hex, CSV metrics, JSON analysis packages |
| **Real-Time Progress** | Live WebSocket progress streaming (`/ws/jobs/{job_id}`) stage-by-stage with animated UI |
| **Demo Signals** | Built-in Golden Vector suite (BPSK, QPSK, FSK, 16QAM, Noisy, Unknown) for immediate evaluation |
| **Security & Auth** | JWT-based authentication, PBKDF2 password hashing, RBAC (Admin/Analyst) with protected routes |
| **API** | Full REST API with OpenAPI/Swagger documentation, WebSocket support, real-time status endpoints |
| **Deployment** | Multi-stage Docker Compose stack (Nginx + FastAPI + Redis + Worker Pool) or zero-setup local dev mode |

---

## 🎨 Dark Workstation UI

SpectraSync features a professional **dark cyber-aesthetic workstation interface** with:

- **8-Panel Dashboard Layout**:
  - Live Signal Spectrum with peak detection (437.123 MHz)
  - Waterfall Spectrogram with Turbo colormap
  - Real-time 11-stage pipeline progress tracker
  - Signal DNA card with QPSK constellation preview
  - Time Domain waveform (high-density RF carrier)
  - I/Q Constellation scatter (4-cluster visualization)
  - Estimated Parameters table with confidence levels
  - Live Analysis Log with timestamped events

- **Interactive Controls**:
  - File upload with drag & drop (`.iq`, `.wav`, etc.)
  - Load Demo Signal modal (6 golden vectors)
  - Global search with `Ctrl+K` shortcut
  - Real-time system metrics (CPU, RAM, Workers)
  - LIVE status pills with pulsing animations

- **Professional Design**:
  - Deep blue-black canvas (`#060913`)
  - Electric cyan/blue neon accents with glow effects
  - JetBrains Mono for telemetry/frequencies
  - Responsive grid layout with smooth animations

---

## 🚀 Quick Start

### Option 1: One-Command Local Development

```bash
# Clone repository
git clone https://github.com/arunkumarmeda27/SpectraSync.git
cd SpectraSync

# Install Python dependencies
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Run system check (initializes DB, generates golden vectors)
python check_system.py

# Start backend (Terminal 1)
python run_backend.py

# Start frontend (Terminal 2 - new terminal)
cd frontend
npm install
npm run dev

# Open browser
# → http://localhost:5173
# → Login: analyst@spectrasync.io / analyst123
# → Click "Load Demo Signal" → Select "Demo QPSK"
```

### Option 2: Docker Production

```bash
git clone https://github.com/arunkumarmeda27/SpectraSync.git
cd SpectraSync
cp .env.example .env

docker compose up --build

# Open browser → http://localhost
```

**That's it!** Your Signal Intelligence Workstation is ready.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SpectraSync Platform                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐   WebSocket    ┌─────────────┐   Queue   ┌──────┐│
│  │  Frontend   │◄──────────────►│   Backend   │◄─────────►│Worker││
│  │  React + TS │   REST API     │   FastAPI   │  Redis/   │ Pool ││
│  │  Dark UI    │◄──────────────►│  + Auth     │  Memory   │ DSP  ││
│  └─────────────┘                └─────────────┘           └──────┘│
│        │                               │                      │     │
│        │                               ▼                      │     │
│        │                        ┌─────────────┐              │     │
│        │                        │  Database   │              │     │
│        │                        │  SQLite /   │              │     │
│        │                        │ PostgreSQL  │              │     │
│        │                        └─────────────┘              │     │
│        │                               │                      │     │
│        └───────────── Real-time Progress Updates ────────────┘     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Backend:** FastAPI · SQLAlchemy · NumPy · SciPy · scikit-learn · Pydantic v2  
**Frontend:** React 18 · TypeScript 5 · Vite · React Router v6 · Canvas API  
**DSP:** Custom 13-stage pipeline with ML modulation classifier  
**Infrastructure:** Docker · Nginx · Redis · PostgreSQL · MinIO  

---

## 📡 DSP Pipeline — 13 Stages

```
[1]  File Ingestion      → Validate, checksum (SHA-256), read IQ/WAV samples
[2]  DC Removal          → Mean subtraction, normalize amplitude
[3]  Bandpass Filter     → Kaiser FIR, configurable cutoff
[4]  FFT Spectrum        → Welch PSD, peak detection, noise floor
[5]  Spectrogram         → STFT waterfall, time-frequency heatmap
[6]  Parameter Inference → Carrier freq, bandwidth, symbol rate, SNR
[7]  Modulation Class.   → Cumulant-based + ML classifier (BPSK/QPSK/QAM/FSK)
[8]  Clock Sync          → Gardner / Mueller-Muller TED, PLL
[9]  Demodulation        → Decision-directed coherent demodulation
[10] De-interleaving     → Block / convolutional de-interleaver
[11] FEC Decoding        → Viterbi, Reed-Solomon (auto-detect)
[12] Bit Stream Analysis → Frame sync, protocol pattern detection
[13] Correlation         → Cross-correlation, lag analysis, results aggregation
```

Each stage reports telemetry (duration, confidence, metrics) stored in the database for audit trails.

---

## 📂 Project Structure

```
SpectraSync/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/                # REST API routers (auth, jobs, files, demos, reports, health, websocket)
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic (job, file, report, storage services)
│   │   └── core/               # Config, database, security (JWT, PBKDF2)
│   └── main.py                 # FastAPI app entrypoint with lifespan init
├── frontend/                   # React + TypeScript UI
│   ├── src/
│   │   ├── pages/              # Dashboard, Upload, Jobs, Visualizations, Parameters, etc.
│   │   ├── components/         # Sidebar, DashboardPlots (5 canvas visualizations), Shared
│   │   ├── index.css           # Dark workstation design system
│   │   ├── App.tsx             # Enhanced topbar with system stats + routing
│   │   ├── api.ts              # Backend API integration
│   │   └── store.ts            # Global state (Zustand)
│   └── dist/                   # Production build output
├── processing/                 # DSP stage implementations (13 modules)
│   ├── analysis/               # FFT, PSD, spectrogram, signal features
│   ├── bitstream/              # Extraction, correlation, header detection
│   ├── deinterleaving/         # Block, convolutional, diagonal
│   ├── demodulation/           # PSK, QAM, FSK demodulators
│   ├── estimation/             # Carrier freq, bandwidth, SNR, symbol rate
│   ├── fec/                    # Viterbi, Reed-Solomon, concatenated codecs
│   ├── io/                     # IQ/WAV readers, validation, metadata, checksum
│   ├── modulation/             # Cumulant features, ML classifier, confidence engine
│   ├── pipeline/               # Pipeline orchestrator, stages, context
│   ├── preprocessing/          # DC removal, normalization, filtering, resampling
│   └── synchronization/        # Carrier recovery, timing recovery, freq offset
├── workers/                    # Background job workers
│   ├── tasks.py                # process_analysis_job task, WebSocket broadcast
│   ├── queue_backend.py        # In-memory or Redis queue abstraction
│   └── worker.py               # Standalone Redis worker daemon
├── ml/                         # ML model assets
│   ├── generation/             # Golden signal generator scripts
│   └── models/                 # Trained Random Forest classifier
├── tests/                      # 33 unit + integration tests
│   ├── golden_vectors/         # Golden test vector validation (5 tests)
│   ├── test_auth.py            # Authentication & security (9 tests)
│   ├── test_backend_api.py     # API integration (4 tests)
│   └── test_dsp_pipeline.py    # DSP pipeline stages (15 tests)
├── data/                       # Runtime data
│   ├── golden/                 # 6 golden test signals (.iq + .wav + .json)
│   └── storage/                # Uploaded files, artifacts, reports
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── dsp_pipeline.md
│   ├── api_reference.md
│   └── user_guide.md
├── docker/                     # Multi-stage Dockerfiles
├── docker-compose.yml          # Production orchestration (6 services)
├── run_backend.py              # Development backend launcher (auto-init DB)
├── check_system.py             # Pre-flight environment check
├── DEPLOYMENT_GUIDE.md         # Comprehensive deployment guide
├── TRANSFORMATION_REPORT.md    # Prototype → Production transformation details
├── BRAIN.md                    # Project tracker & decision log
└── requirements.txt            # Python dependencies
```

---

## 🧪 Testing

### Run All Tests (33 Tests)
```bash
python -m pytest tests/ -v
```

**Test Coverage:**
- ✅ 5 Golden Vector Tests (BPSK, QPSK, 2-FSK, 16-QAM, Unknown)
- ✅ 9 Authentication & Security Tests (PBKDF2, JWT, RBAC)
- ✅ 4 Backend API Integration Tests (health, demos, end-to-end)
- ✅ 15 DSP Pipeline Unit Tests (all 13 stages + codecs + bitstream)

### Frontend Type Check
```bash
cd frontend
npx tsc --noEmit  # 0 errors
```

### Production Build
```bash
cd frontend
npm run build  # 803 kB bundle, optimized
```

---

## 📊 API Reference

Interactive API docs available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email/password → JWT token |
| `POST` | `/api/files/upload` | Upload `.IQ` or `.WAV` file with validation |
| `POST` | `/api/jobs` | Create analysis job (dispatches to worker) |
| `GET` | `/api/jobs` | List all jobs with status |
| `GET` | `/api/jobs/{id}/status` | Get real-time job progress (0-100%) |
| `GET` | `/api/jobs/{id}/analysis` | Get full analysis results |
| `GET` | `/api/jobs/{id}/parameters` | Get estimated parameters table |
| `POST` | `/api/jobs/{id}/report?format=pdf` | Generate PDF report |
| `GET` | `/api/demos/list` | List 6 golden demo signals |
| `POST` | `/api/demos/{key}/load` | Load demo signal (golden_qpsk, etc.) |
| `GET` | `/api/health` | System health check |
| `WS` | `/ws/jobs/{id}` | WebSocket real-time progress stream |

### Example: Upload & Analyze

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@spectrasync.io","password":"analyst123"}' \
  | jq -r .access_token > token.txt

# 2. Upload signal file
curl -X POST http://localhost:8000/api/files/upload \
  -H "Authorization: Bearer $(cat token.txt)" \
  -F "file=@satellite_capture.iq" \
  | jq .file.id > file_id.txt

# 3. Create analysis job
curl -X POST http://localhost:8000/api/jobs \
  -H "Authorization: Bearer $(cat token.txt)" \
  -H "Content-Type: application/json" \
  -d "{\"signal_file_id\":$(cat file_id.txt)}" \
  | jq .id > job_id.txt

# 4. Poll status
curl http://localhost:8000/api/jobs/$(cat job_id.txt)/status \
  -H "Authorization: Bearer $(cat token.txt)" | jq

# 5. Get results (once completed)
curl http://localhost:8000/api/jobs/$(cat job_id.txt)/analysis \
  -H "Authorization: Bearer $(cat token.txt)" | jq

# 6. Download PDF report
curl http://localhost:8000/api/jobs/$(cat job_id.txt)/report?format=pdf \
  -H "Authorization: Bearer $(cat token.txt)" \
  -o report.pdf
```

---

## 🎮 Demo

### Golden Vector Demo Signals

SpectraSync includes 6 pre-generated golden test signals for instant evaluation:

1. **Demo QPSK** - 50 kBaud, +2.4 kHz offset, 24 dB SNR, CCSDS-32 preamble
2. **Demo BPSK** - 50 kBaud, +5 kHz offset, 22 dB SNR, Barker-11 preamble
3. **Demo 2-FSK** - 25 kBaud, 12.5 kHz deviation, 20 dB SNR
4. **Demo 16-QAM** - 40 kBaud, 28 dB SNR, Barker-13 sync
5. **Demo Noisy Signal** - Low SNR (2 dB) QPSK for ambiguity testing
6. **Demo Unknown** - Colored noise + tones for fallback verification

**Try it:** Click "Load Demo Signal" button on the dashboard, select "Demo QPSK", and watch the real-time 13-stage pipeline execute with live WebSocket progress updates!

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Complete deployment guide (dev + prod) |
| [TRANSFORMATION_REPORT.md](TRANSFORMATION_REPORT.md) | Prototype → Production transformation details |
| [docs/architecture.md](docs/architecture.md) | System architecture & component diagram |
| [docs/dsp_pipeline.md](docs/dsp_pipeline.md) | Deep-dive into all 13 DSP stages |
| [docs/api_reference.md](docs/api_reference.md) | Full REST API reference |
| [docs/user_guide.md](docs/user_guide.md) | End-user walkthrough |
| [BRAIN.md](BRAIN.md) | Project decision log & tracker |

---

## 🔐 Security Features

- **Authentication:** JWT tokens with PBKDF2-HMAC-SHA256 password hashing
- **Authorization:** Role-Based Access Control (RBAC) - Analyst vs Admin
- **Protected Routes:** All API endpoints require valid bearer token
- **File Validation:** SHA-256 integrity verification on all uploads
- **Input Sanitization:** Pydantic schema validation on all requests
- **CORS:** Configurable CORS middleware for frontend integration

---

## 🚀 Production Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive instructions.

**Quick Production Checklist:**
- [ ] Change `SECRET_KEY` in `.env`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set up Redis for distributed workers
- [ ] Configure Nginx reverse proxy
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up log aggregation
- [ ] Configure automated database backups
- [ ] Implement rate limiting
- [ ] Set up monitoring (Prometheus/Grafana)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Run tests: `python -m pytest tests/ -v` (must pass 33/33)
4. Ensure TypeScript passes: `cd frontend && npx tsc --noEmit` (0 errors)
5. Commit: `git commit -m "feat: add amazing feature"`
6. Push: `git push origin feature/your-feature`
7. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE)

---

## 🏆 Smart India Hackathon 2026

**Problem Statement:** SIH26147  
**Challenge:** Automated Signal Intelligence Platform  
**Team:** SpectraSync Development Team  
**Version:** 1.0.0  
**Status:** ✅ **PRODUCTION READY**

---

<div align="center">

### Built with ❤️ for a Smarter Spectrum

**[Website](https://spectrasync.io)** • **[Documentation](docs/)** • **[API Docs](http://localhost:8000/docs)** • **[Issues](https://github.com/arunkumarmeda27/SpectraSync/issues)**

⭐ **Star this repository** if you find SpectraSync useful!

</div>
