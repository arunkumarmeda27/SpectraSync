# BRAIN.md — SpectraSync Project Tracker

> Living document tracking all decisions, milestones, known issues, and future plans.  
> Last updated: 2026-09-19

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
| **Status** | Production Ready |
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
| Analysis Report banner | ✅ Done | PDF generate button |
| Upload & Analyze page | ✅ Done | |
| Job History / Queue page | ✅ Done | |
| Signal Visualizations page | ✅ Done | |
| Parameter Results page | ✅ Done | |
| Bit Stream Analysis page | ✅ Done | |
| Reports page | ✅ Done | |
| Settings page | ✅ Done | |
| Results Viewer page | ✅ Done | Full analysis output |

### M4 — Testing & Documentation ✅ COMPLETE

| Item | Status |
|---|---|
| 24 unit + integration tests | ✅ Passing |
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

**Total: 24 tests — 24 passing — 0 failing**

---

## Known Issues

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | `datetime.utcnow()` deprecation warning in Python 3.14 | Low | Open — cosmetic only, no impact |
| 2 | Pydantic v2 class-based config deprecation in `job.py` | Low | Open — needs migration to `model_config = ConfigDict(...)` |
| 3 | Vite config uses `__dirname` (native ESM warning) | Low | Open — replace with `import.meta.dirname` |
| 4 | `regex=` param in FastAPI Query deprecated (use `pattern=`) | Low | Open |

---

## Backlog

### High Priority

- [ ] Real-time WebSocket progress updates (replace polling)
- [ ] PostgreSQL migration guide + connection pooling config
- [ ] PDF report generation (currently triggers `window.print()`)
- [ ] User authentication (JWT + login page)

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

---

## Team Notes

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
