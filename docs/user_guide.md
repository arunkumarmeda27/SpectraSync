# SpectraSync: User & Operator Guide

Welcome to **SpectraSync: Automated .IQ / .WAV Signal Analysis Platform**.

---

## 1. Quick Start Guide

### Option A: Local Development Mode (Zero Docker Setup)
SpectraSync includes embedded fallbacks (SQLite, in-memory queue, local disk storage) so you can run the full platform in seconds on any Windows, macOS, or Linux machine.

#### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Step 2: Launch the FastAPI Backend
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend initializes the local database (`spectrasync.db`) and registers all background DSP worker threads automatically.

#### Step 3: Launch the React UI
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### Option B: Production Mode via Docker Compose
For high-throughput multi-user deployment with PostgreSQL, Redis, and MinIO:
```bash
docker-compose up --build -d
```
Access points:
- **Web UI**: `http://localhost` (Port 80)
- **FastAPI API**: `http://localhost:8000`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin`, Pass: `minioadmin123`)

---

## 2. Using the Platform

### Running Demo Signals
1. Navigate to **Demo Signals** in the sidebar.
2. Select any synthetic preset card:
   - **BPSK**: Binary Phase Shift Keying with AWGN at 15 dB SNR.
   - **QPSK**: Quadrature Phase Shift Keying with carrier frequency offset and timing error.
   - **2-FSK**: Dual-tone frequency shift keying.
   - **16-QAM**: Multi-amplitude constellation with pulse shaping.
   - **Unknown**: Non-standard RF signal to test ambiguity handling.
3. Click **Analyze Signal**. The platform automatically loads the golden vector, dispatches the worker, streams live progress via WebSocket, and redirects to the **Results Viewer**.

### Uploading Custom Recordings
1. Click **Upload Signal** in the sidebar.
2. Drag and drop any `.iq` (complex64) or `.wav` (PCM) recording (up to 500 MB).
3. The platform computes a streaming SHA-256 hash and verifies header integrity.
4. Click **Launch Analysis**.

### Inspecting Results
- **Overview**: Primary modulation badge, confidence meter, estimated $f_c$, bandwidth, symbol rate, and SNR with physical provenance.
- **Spectrum**: Interactive FFT spectrum and I/Q constellation diagram.
- **Bitstream**: Recovered binary bit stream, hex dump table, detected preambles, and bit density metrics.
- **Stages**: 13-stage execution audit trail with millisecond timings.
- **Reports**: Instant one-click PDF, JSON, and CSV export.
