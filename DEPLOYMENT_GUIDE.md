# 🚀 SpectraSync Production Deployment Guide

## Quick Start (3 Commands)

### Option 1: Development Mode
```bash
# Terminal 1 - Backend
python run_backend.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```
Then open: http://localhost:5173

### Option 2: Docker Production
```bash
docker compose up --build
```
Then open: http://localhost

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SpectraSync Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │◄──►│   Backend    │◄──►│   Workers    │  │
│  │  React + TS  │    │   FastAPI    │    │  DSP Pipeline │  │
│  │  Port 5173   │    │   Port 8000  │    │  Thread Pool  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    ▼                    │          │
│         │            ┌──────────────┐             │          │
│         │            │   Database   │             │          │
│         │            │   SQLite /   │             │          │
│         │            │  PostgreSQL  │             │          │
│         │            └──────────────┘             │          │
│         │                                         │          │
│         └────────── WebSocket (Real-time) ───────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Required
- **Python 3.11+** (3.11.7 recommended)
- **Node.js 18+** (for frontend)
- **npm 9+**

### Optional (Production)
- **Docker & Docker Compose**
- **PostgreSQL 14+** (replaces SQLite)
- **Redis 7+** (for distributed workers)
- **Nginx** (reverse proxy)

---

## 🔧 Installation

### 1. Clone & Setup Backend
```bash
git clone https://github.com/arunkumarmeda27/SpectraSync.git
cd SpectraSync

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Initialize database & generate golden vectors
python check_system.py
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run build  # Production build
npm run dev    # Development mode
```

---

## 🎯 Running the Platform

### Development Mode

#### Start Backend (Terminal 1)
```bash
python run_backend.py
```
**Outputs:**
- API Server: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- WebSocket: ws://localhost:8000/ws/jobs/{job_id}

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
**Outputs:**
- Frontend: http://localhost:5173

### Production Mode (Docker)
```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Services:**
- Frontend (Nginx): http://localhost
- Backend API: http://localhost/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO: localhost:9000

---

## 🔐 Default Credentials

### Login Accounts (Auto-seeded)
| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Analyst** | analyst@spectrasync.io | analyst123 | Standard analysis access |
| **Admin** | admin@spectrasync.io | admin123 | Full system access + management |

### First Login
1. Navigate to http://localhost:5173 (dev) or http://localhost (prod)
2. Use analyst credentials
3. Click "Load Demo Signal" to test with golden QPSK

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout

### Signal Upload
- `POST /api/files/upload` - Upload .IQ/.WAV file
- `GET /api/files` - List all signal files
- `GET /api/files/{id}` - Get file metadata
- `GET /api/files/{id}/content` - Download file

### Analysis Jobs
- `POST /api/jobs` - Create analysis job
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/{id}` - Get job details
- `GET /api/jobs/{id}/status` - Get real-time status
- `GET /api/jobs/{id}/stages` - Get pipeline stage telemetry
- `POST /api/jobs/{id}/retry` - Retry failed job

### Results & Analysis
- `GET /api/jobs/{id}/analysis` - Get full analysis results
- `GET /api/jobs/{id}/parameters` - Get estimated parameters
- `GET /api/jobs/{id}/modulation` - Get modulation classification
- `GET /api/jobs/{id}/synchronization` - Get sync metrics
- `GET /api/jobs/{id}/demodulation` - Get demodulation data

### Reports
- `POST /api/jobs/{id}/report?format=pdf` - Generate PDF report
- `POST /api/jobs/{id}/report?format=csv` - Generate CSV export
- `POST /api/jobs/{id}/report?format=html` - Generate HTML report
- `GET /api/reports` - List available reports

### Demo Signals
- `GET /api/demos/list` - List 6 golden vector demos
- `POST /api/demos/{key}/load` - Load demo signal (QPSK, BPSK, FSK, 16QAM, Noisy, Unknown)

### Health & Status
- `GET /api/health` - System health check
- `GET /api/health/services` - Check all services

### WebSocket (Real-time Progress)
- `WS /ws/jobs/{job_id}` - Subscribe to live job progress updates

---

## 🧪 Testing

### Backend Tests (33 Tests)
```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test categories
python -m pytest tests/test_auth.py -v          # Authentication (9 tests)
python -m pytest tests/test_backend_api.py -v   # API Integration (4 tests)
python -m pytest tests/test_dsp_pipeline.py -v  # DSP Pipeline (15 tests)
python -m pytest tests/golden_vectors/ -v       # Golden Vectors (5 tests)

# With coverage
python -m pytest tests/ --cov=backend --cov=processing
```

### Frontend Type Check
```bash
cd frontend
npx tsc --noEmit  # Should pass with 0 errors
```

### End-to-End Test
```bash
# 1. Start backend
python run_backend.py

# 2. In another terminal, test API
curl http://localhost:8000/api/health
curl http://localhost:8000/api/demos/list

# 3. Login and create job
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@spectrasync.io","password":"analyst123"}'

# Use returned token for authenticated requests
```

---

## 🐳 Docker Configuration

### Services in docker-compose.yml
1. **Frontend** - Nginx serving React app
2. **Backend** - FastAPI server
3. **Worker** - DSP pipeline processor
4. **PostgreSQL** - Production database
5. **Redis** - Distributed job queue
6. **MinIO** - Object storage

### Environment Variables (.env)
```env
# Database
DATABASE_URL=postgresql://spectrasync:spectrasync_secret@postgres:5432/spectrasync

# Redis Queue
REDIS_URL=redis://redis:6379/0
USE_IN_MEMORY_QUEUE=false

# Storage
UPLOAD_DIR=/app/data/uploads
MAX_UPLOAD_SIZE_MB=2048

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# MinIO (Optional)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

---

## 📊 Monitoring & Logs

### Backend Logs
```bash
# Development
# Logs appear in terminal running run_backend.py

# Docker
docker compose logs -f backend
docker compose logs -f worker
```

### Database Inspection
```bash
# SQLite (Development)
sqlite3 spectrasync.db
.tables
SELECT * FROM analysis_jobs ORDER BY id DESC LIMIT 5;

# PostgreSQL (Production)
docker compose exec postgres psql -U spectrasync -d spectrasync
\dt
SELECT * FROM analysis_jobs ORDER BY id DESC LIMIT 5;
```

### Job Status Monitoring
```bash
# Via API
curl http://localhost:8000/api/jobs | jq

# Via Database
sqlite3 spectrasync.db "SELECT id, status, progress, current_stage FROM analysis_jobs;"
```

---

## 🔥 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Reset database
rm spectrasync.db
python -c "from backend.app.core.database import init_db; init_db()"
```

### Frontend build fails
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Golden vectors missing
```bash
python ml/generation/generate_golden_signals.py
# Should create 6 files in data/golden/
```

### WebSocket connection fails
- Check CORS settings in `backend/app/main.py`
- Verify WebSocket endpoint: `ws://localhost:8000/ws/jobs/{job_id}`
- Use browser dev tools Network tab to debug

### Worker not processing jobs
```bash
# Check worker logs
docker compose logs -f worker

# Verify Redis connection (if using Redis)
docker compose exec redis redis-cli PING

# Check job queue
docker compose exec redis redis-cli LLEN spectrasync:jobs
```

---

## 🚀 Performance Optimization

### Backend
- Use PostgreSQL instead of SQLite for concurrent access
- Enable Redis for distributed workers
- Configure connection pooling in `backend/app/core/database.py`
- Add Redis caching for frequently accessed results

### Frontend
- Bundle splitting: `npm run build` already optimized
- Enable gzip compression in Nginx
- Use CDN for static assets
- Implement lazy loading for routes

### DSP Pipeline
- Adjust `max_samples` in job config to reduce processing time
- Use GPU acceleration for FFT operations (requires CUDA)
- Increase worker pool size in `workers/queue_backend.py`

---

## 📦 Production Deployment Checklist

- [ ] Change `SECRET_KEY` in environment variables
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set up Redis for worker queue
- [ ] Configure Nginx reverse proxy
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up log aggregation (ELK Stack, Datadog)
- [ ] Configure automated backups for database
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Implement rate limiting on API endpoints
- [ ] Configure firewall rules
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Document custom deployment procedures

---

## 🎓 Learning Resources

### Project Documentation
- `BRAIN.md` - Project tracker & decision log
- `docs/architecture.md` - System architecture
- `docs/dsp_pipeline.md` - DSP stage deep-dive
- `docs/api_reference.md` - Full API reference
- `TRANSFORMATION_REPORT.md` - Prototype → Production transformation details

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Run tests: `python -m pytest tests/ -v`
4. Ensure TypeScript passes: `cd frontend && npx tsc --noEmit`
5. Commit: `git commit -m "feat: add amazing feature"`
6. Push: `git push origin feature/your-feature`
7. Open Pull Request

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

---

## 🏆 Smart India Hackathon 2026

**Problem Statement:** SIH26147  
**Team:** SpectraSync Development Team  
**Version:** 1.0.0  
**Status:** Production Ready ✅

---

**Built with ❤️ for a Smarter Spectrum**
