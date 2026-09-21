#!/usr/bin/env python
"""
SpectraSync Backend Development Server
Starts FastAPI with hot reload, initializes database, and launches in-memory worker pool
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

def main():
    import uvicorn
    from backend.app.core.database import init_db

    print("=" * 70)
    print("  SpectraSync Signal Intelligence Workstation - Backend Server")
    print("  SIH26147 - Smart India Hackathon 2026")
    print("=" * 70)

    # Initialize database and seed default users
    print("\n[1/3] Initializing database and seeding default accounts...")
    try:
        init_db()
        print("     ✓ Database initialized")
        print("     ✓ Default users created:")
        print("       - analyst@spectrasync.io / analyst123")
        print("       - admin@spectrasync.io / admin123")
    except Exception as e:
        print(f"     ✗ Database initialization failed: {e}")
        return

    # Check if golden vectors exist
    print("\n[2/3] Checking golden test vectors...")
    golden_dir = PROJECT_ROOT / "data" / "golden"
    if golden_dir.exists() and list(golden_dir.glob("*.iq")):
        print(f"     ✓ Found {len(list(golden_dir.glob('*.iq')))} golden signals")
    else:
        print("     ⚠ Golden vectors not found. Run:")
        print("       python ml/generation/generate_golden_signals.py")

    # Start server
    print("\n[3/3] Starting FastAPI development server...")
    print("\n" + "=" * 70)
    print("  🚀 Server Status:")
    print("     • Backend API:     http://localhost:8000")
    print("     • API Docs:        http://localhost:8000/docs")
    print("     • ReDoc:           http://localhost:8000/redoc")
    print("     • WebSocket:       ws://localhost:8000/ws/jobs/{job_id}")
    print("     • Worker Pool:     In-Memory (4 threads)")
    print("=" * 70)
    print("\n💡 Default Login Credentials:")
    print("   Analyst: analyst@spectrasync.io / analyst123")
    print("   Admin:   admin@spectrasync.io / admin123")
    print("\n📡 Press Ctrl+C to stop the server\n")

    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
