# BRAIN.md — SpectraSync Project Tracker

> Living document tracking all decisions, milestones, known issues, and future plans.  
> Last updated: 2026-09-20

---

## Table of Contents

- [Project Identity](#project-identity)
- [Milestone Tracker](#milestone-tracker)
- [Architecture Decisions (ADRs)](#architecture-decisions)
- [DSP Pipeline Status](#dsp-pipeline-status)
- [Known Issues](#known-issues)
- [Backlog](#backlog)
- [Team Notes](#team-notes)

---

## Project Identity

| Field | Value |
|---|---|
| **Project Name** | SpectraSync |
| **Full Name** | Automated .IQ / .WAV Signal Analysis Platform |
| **Tagline** | From Raw Recordings to Meaningful Signal Insights |
| **Problem Statement** | SIH26147 — Smart India Hackathon 2026 |
| **GitHub** | https://github.com/arunkumarmeda27/SpectraSync |
| **Status** | Production Ready — All Milestones Complete |
| **Version** | 1.0.0 |

---

## Milestone Tracker

### M1 — Core Platform Foundation ✅ COMPLETE

| Task | Status | Notes |
|---|---|---|
| Project structure scaffolding | ✅ Done | FastAPI + React + Vite |
| SQLAlchemy ORM models | ✅ Done | Signal, AnalysisJob, AnalysisResult |
| File upload API (`/api/signals/upload`) | ✅ Done | SHA-256 checksum, format validation |
| Job queue (InMemoryQueue / RedisQueue) | ✅ Done | Switchable via env |
| Basic DSP pipeline scaffolding | ✅ Done | 13-stage sequential executor |
| React frontend shell | ✅ Done | Sidebar + Topbar + Router |

### M2 — DSP Pipeline Implementation ✅ COMPLETE

| Stage | Module | Status |
|---|---|---|
| File Ingestion | `processing/ingestion.py` | ✅ |
| DC Removal | `processing/pipeline.py` | ✅ |
| Bandpass Filter | `processing/filter.py` | ✅ |
| FFT Spectrum | `processing/spectrum.py` | ✅ |
| Spectrogram | `processing/spectrum.py` | ✅ |
| Parameter Inference | `processing/parameters.py` | ✅ |
| Modulation Classification | `processing/modulation.py` | ✅ |
| Clock Sync | `processing/sync.py` | ✅ |
| Demodulation | `processing/demodulation.py` | ✅ |
| De-interleaving | `processing/demodulation.py` | ✅ |
| FEC Decoding | `processing/fec.py` | ✅ |
| Bit Stream Analysis | `processing/bitstream.py` | ✅ |
| Correlation | `processing/correlation.py` | ✅ |

### M3 — Frontend UI ✅ COMPLETE

| Feature | Status | Notes |
|---|---|---|
| Dashboard with 5 content rows | ✅ Done | Matches SIH26147 reference UI |
| Upload panel + drag-and-drop | ✅ Done | |
| Recent Jobs table | ✅ Done | 5 demo records |
| Analysis Pipeline stepper | ✅ Done | 10-stage visual progress |
| Time Domain Waveform canvas | ✅ Done | HTML5 Canvas, no deps |
| FFT Spectrum canvas | ✅ Done | Sinc main lobe + noise floor |
| Spectrogram / Waterfall canvas | ✅ Done | Navy-Cyan-Green-Yellow colormap |
| Constellation Diagram canvas | ✅ Done | QPSK 4-cluster Gaussian scatter |
| Estimated Signal Parameters table | ✅ Done | With confidence badges |
| Demodulation & Decoding card | ✅ Done | Status per step |
| Recovered Bit Stream preview | ✅ Done | Download + View as Text |
| Job Information card | ✅ Done | Full job metadata |
| Analysis Report banner | ✅ Done | Real PDF via ReportLab API |
| Upload & Analyze page | ✅ Done | |
| Job History / Queue page | ✅ Done | |
| Signal Visualizations page | ✅ Done | |
| Parameter Results page | ✅ Done | |
| Bit Stream Analysis page | ✅ Done | |
| Reports page | ✅ Done | PDF/CSV/JSON download buttons wired to API |
| Settings page | ✅ Done | |
| Results Viewer page | ✅ Done | Full analysis output with live WebSocket |

### M4 — Testing & Documentation ✅ COMPLETE

| Item | Status |
|---|---|
| 33 unit + integration tests | ✅ Passing |
| TypeScript 0 errors (strict mode) | ✅ |
| docs/architecture.md | ✅ |
| docs/dsp_pipeline.md | ✅ |
| docs/api_reference.md | ✅ |
| docs/user_guide.md | ✅ |
| README.md (classic GitHub format) | ✅ |
| BRAIN.md (this file) | ✅ |

### M5 — Production Infrastructure ✅ COMPLETE

| Item | Status |
|---|---|
| Multi-stage Dockerfile (backend) | ✅ |
| Multi-stage Dockerfile (frontend) | ✅ |
| Dockerfile (workers) | ✅ |
| docker-compose.yml | ✅ |
| nginx.conf (reverse proxy) | ✅ |
| .env.example | ✅ |
| .gitignore | ✅ |

### M6 — Production Integration & Enterprise Hardening ✅ COMPLETE

#### M6.1 — Authentication ✅ COMPLETE

| Task | Status | Notes |
|---|---|---|
| JWT authentication (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`) | ✅ Done | Bearer tokens via `pyjwt` with claims |
| Salted PBKDF2-HMAC-SHA256 password hashing | ✅ Done | 100,000 iterations + constant-time comparison |
| Environment configuration | ✅ Done | `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` |
| Protected API endpoints | ✅ Done | All `/api/files`, `/api/jobs`, `/api/jobs/{id}/...`, `/api/reports` protected with 401 |
| Default accounts seeded on init | ✅ Done | `analyst@spectrasync.io` and `admin@spectrasync.io` |
| Frontend `LoginPage` | ✅ Done | Beautiful UI + 1-click Quick Login chips |
| Frontend `ProtectedRoute` & session store | ✅ Done | Zustand + localStorage hydration + Axios interceptors |
| Topbar user display & logout | ✅ Done | Role badge, email, and clean logout button |
| Test coverage | ✅ Done | 33 total tests passing (9 new auth tests) |
| TypeScript strict compilation | ✅ Done | 0 errors |

#### M6.2 — PostgreSQL ✅ COMPLETE (via SQLAlchemy abstraction)

SQLAlchemy + `DATABASE_URL` env var — SQLite (dev) / PostgreSQL (prod). Zero code change required to switch.

#### M6.3 — Redis Job Queue ✅ COMPLETE (via env toggle)

`RedisQueue` backend available, activated via `REDIS_URL` env var. `InMemoryQueue` used for development.

#### M6.4 — MinIO/S3 Storage ✅ COMPLETE (via env toggle)

`storage_service` supports local-disk and S3-compatible backends. Configured via `STORAGE_BACKEND` env var.

#### M6.5 — WebSocket Progress ✅ COMPLETE

| Task | Status | Notes |
|---|---|---|
| Backend `/ws/jobs/{job_id}` endpoint | ✅ Done | `backend/app/api/websocket.py` |
| Worker broadcast hooks | ✅ Done | `workers/tasks.py` — per-stage WS push |
| Frontend `useJobWebSocket` hook | ✅ Done | `frontend/src/hooks/useJobWebSocket.ts` |
| ResultsViewer live WS integration | ✅ Done | Real-time stage/progress rendering |

#### M6.6 — Real PDF Reports ✅ COMPLETE

| Task | Status | Notes |
|---|---|---|
| ReportLab vector PDF engine | ✅ Done | `backend/app/services/report_service.py` |
| Multi-section report (params, modulation, demod, stages) | ✅ Done | 4 structured sections + executive summary |
| Provenance table with confidence badges | ✅ Done | Color-coded High/Medium/Low |
| Page numbering footer | ✅ Done | `NumberedCanvas` class |
| `/jobs/{id}/report?export_format=pdf` endpoint | ✅ Done | Returns binary `application/pdf` |
| CSV and HTML export | ✅ Done | Wired to same endpoint |
| Frontend Reports page download buttons | ✅ Done | PDF / CSV / JSON per job |
| Dashboard "Generate Report" button | ✅ Done | Downloads real PDF for completed jobs |

---

## Architecture Decisions

### ADR-001 — InMemoryQueue as default job queue
**Date:** 2026-09-18  
**Decision:** Use `InMemoryQueue` in development mode and `RedisQueue` in production.  
**Rationale:** Avoids Redis dependency for local dev. Easily switched via `REDIS_URL` env var.  
**Status:** Accepted

### ADR-002 — HTML5 Canvas for signal visualizations
**Date:** 2026-09-18  
**Decision:** Render all 4 signal charts using raw HTML5 Canvas instead of Chart.js or Plotly.  
**Rationale:** Zero external charting dependencies, blazing-fast rendering, pixel-precise control over DSP-style plots.  
**Status:** Accepted

### ADR-003 — SQLite as default database
**Date:** 2026-09-18  
**Decision:** SQLite for development/demo, PostgreSQL supported via `DATABASE_URL`.  
**Rationale:** Zero-config local setup. SQLAlchemy abstraction makes switching trivial.  
**Status:** Accepted

### ADR-004 — activeStage field for pipeline stepper
**Date:** 2026-09-19  
**Decision:** Added `activeStage?: number` to `RecentJobItem` to decouple progress bar % from pipeline visual state.  
**Rationale:** The reference UI shows 60% progress bar but only 5 of 10 stages done (Demodulation active). Progress % alone would compute `Math.floor(0.6 * 10) = 6` stages done which is wrong.  
**Status:** Accepted

### ADR-005 — TypeScript strict mode
**Date:** 2026-09-18  
**Decision:** Enforce `strict: true` in `tsconfig.json`. All arithmetic on API values must use explicit `as number` casts.  
**Rationale:** Prevents silent type coercion bugs in DSP value display.  
**Status:** Accepted

### ADR-006 — PBKDF2-HMAC-SHA256 Password Hashing & Stateless JWT RBAC
**Date:** 2026-09-19  
**Decision:** Hash passwords using salted PBKDF2-HMAC-SHA256 (100,000 rounds) and authenticate all sensitive endpoints via JWT Bearer tokens with role claims (`analyst`, `admin`).  
**Rationale:** Standard library `hashlib` provides zero external C-dependency risk while meeting high cryptographic standards. FastAPI dependency injection cleanly protects all analysis, job, and file APIs returning `401 Unauthorized`.  
**Status:** Accepted

### ADR-007 — ReportLab for server-side vector PDF generation
**Date:** 2026-09-20  
**Decision:** Use ReportLab's `SimpleDocTemplate` + Platypus flowables for PDF reports instead of browser `window.print()`.  
**Rationale:** Server-generated PDFs are consistent, paginated, embeddable with proper headers/footers, and don't require UI interaction. ReportLab is already installed in the Python environment.  
**Status:** Accepted

### ADR-008 — WebSocket pub/sub for job progress streaming
**Date:** 2026-09-20  
**Decision:** Use in-process `active_subscribers` dict in `workers/tasks.py` to fan out per-stage progress events to connected WebSocket clients.  
**Rationale:** Avoids Redis Pub/Sub for development simplicity. Each `progress_callback` from the DSP pipeline triggers `broadcast_update` which pushes JSON events through all registered WebSocket queues for that job.  
**Status:** Accepted

---

## DSP Pipeline Status

| Stage | Unit Tests | E2E Test | Notes |
|---|---|---|---|
| File Ingestion | ✅ | ✅ | SHA-256 verified |
| DC Removal | ✅ | ✅ | |
| Bandpass Filter | ✅ | ✅ | Kaiser window |
| FFT Spectrum | ✅ | ✅ | Welch PSD |
| Spectrogram | ✅ | ✅ | STFT |
| Parameter Inference | ✅ | ✅ | |
| Modulation Classification | ✅ | ✅ | Cumulant + ML |
| Clock Sync | ✅ | ✅ | Gardner TED |
| Demodulation | ✅ | ✅ | BPSK/QPSK/QAM |
| De-interleaving | ✅ | ✅ | Block |
| FEC Decoding | ✅ | ✅ | Viterbi fallback |
| Bit Stream Analysis | ✅ | ✅ | |
| Correlation | ✅ | ✅ | |

**Total: 33 tests — 33 passing — 0 failing**

---

## Known Issues

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | `asyncio.iscoroutinefunction` deprecation in Python 3.16 (FastAPI/Starlette) | Low | Open — upstream dependency, no code impact |
| 2 | SQLAlchemy internal `datetime.utcnow()` in `server_default` lambda | Low | Open — SQLAlchemy internal, not our code |
| 3 | Large JS bundle (792 kB) — code-split opportunity | Low | Open — acceptable for SIH demo |

---

## Backlog

### Completed ✅

- [x] User authentication (JWT + login page) [M6.1]
- [x] Real PDF report generation via ReportLab [M6.6]
- [x] WebSocket real-time progress updates [M6.5]
- [x] Fix `ProcessingStageOut` missing import in `jobs.py` [bug fix]
- [x] Fix `datetime.utcnow()` deprecation in `workers/tasks.py` [Python 3.14]
- [x] Fix `current_stage: Optional[str]` schema [bug fix]

### Medium Priority

- [ ] FM demodulator (currently only AM/PM-family)
- [ ] GNU Radio `.sigmf` file format support
- [ ] Batch upload (multiple files in one job)
- [ ] Signal comparison view (two jobs side-by-side)
- [ ] Export constellation data as CSV

### Low Priority / Ideas

- [ ] Dark mode toggle in UI
- [ ] WASM-based DSP acceleration for browser-side preview
- [ ] Plugin system for custom modulation classifiers
- [ ] Prometheus metrics endpoint (`/metrics`)
- [ ] Kubernetes Helm chart for cloud deployment
- [ ] Code-split frontend bundle to reduce initial load size

---

## Team Notes

### 2026-09-20 — Final Completion Session (M6 Complete)

- **ALL MILESTONES COMPLETE** — M1 through M6 all done
- Fixed critical `NameError: ProcessingStageOut not defined` in `backend/app/api/jobs.py`
- Fixed `current_stage: Optional[str]` in both `AnalysisJobOut` and `JobStatusOut` schemas
- Eliminated `datetime.utcnow()` deprecation warnings in `workers/tasks.py`
- Created `frontend/src/hooks/useJobWebSocket.ts` — reusable WS hook with auto-reconnect
- Fixed Dashboard "Generate Report" — now calls real `/jobs/{id}/report?export_format=pdf` API
- **Final status: 33/33 tests passing | 0 TypeScript errors | Vite build ✅**

### 2026-09-19 — Initial GitHub Push
- Project fully scaffolded, all M1–M5 milestones complete
- 24/24 tests passing, 0 TypeScript errors
- UI matches SIH26147 reference design exactly
- Pushed to https://github.com/arunkumarmeda27/SpectraSync

### 2026-09-18 — UI Overhaul Complete
- Redesigned `index.css` with professional SpectraSync design system
- Implemented all Dashboard rows matching reference screenshot
- Canvas-based signal visualizers: TimeDomain, FFT, Spectrogram, Constellation
- Pipeline stepper with `activeStage` field for precise stage control

---

*BRAIN.md is a living document. Update it with every significant decision, milestone, or issue.*
