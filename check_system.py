import os
import sys
import subprocess
import time
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent

def check_environment():
    print("=" * 70)
    print("  SpectraSync Signal Intelligence Workstation")
    print("  Pre-flight Environment Check")
    print("=" * 70)

    # 1. Check Python dependencies
    print("\n[1/4] Checking Python environment...")
    try:
        import fastapi
        import sqlalchemy
        import scipy
        import numpy
        import sklearn
        import reportlab
        print("     ✓ Python dependencies verified")
    except ImportError as e:
        print(f"     ✗ Missing dependency: {e}")
        print("     Please run: pip install -r requirements.txt")
        return False

    # 2. Check Database
    print("\n[2/4] Checking database...")
    try:
        from backend.app.core.database import init_db
        init_db()
        print("     ✓ Database initialized with seed accounts")
    except Exception as e:
        print(f"     ✗ Database error: {e}")
        return False

    # 3. Check Golden Vectors
    print("\n[3/4] Checking golden vector test signals...")
    golden_dir = PROJECT_ROOT / "data" / "golden"
    if not golden_dir.exists() or not list(golden_dir.glob("*.iq")):
        print("     Generating golden test vectors...")
        try:
            from ml.generation.generate_golden_signals import generate_all_golden_signals
            generate_all_golden_signals(golden_dir)
            print("     ✓ Golden signals generated successfully")
        except Exception as e:
            print(f"     ✗ Failed to generate golden signals: {e}")
            return False
    else:
        print(f"     ✓ Found {len(list(golden_dir.glob('*.iq')))} golden test signals")

    # 4. Check Frontend
    print("\n[4/4] Checking frontend...")
    frontend_dist = PROJECT_ROOT / "frontend" / "dist"
    if not frontend_dist.exists():
        print("     Building frontend for production...")
        try:
            subprocess.run(["npm", "run", "build"], cwd=PROJECT_ROOT / "frontend", shell=True, check=True)
            print("     ✓ Frontend build completed")
        except Exception as e:
            print(f"     ✗ Frontend build failed: {e}")
            return False
    else:
        print("     ✓ Frontend build verified")

    print("\n" + "=" * 70)
    print("  ✓ All pre-flight checks PASSED!")
    print("=" * 70)
    print("\nTo start the platform:")
    print("  1. Start Backend:  python run_backend.py")
    print("  2. Start Frontend: cd frontend && npm run dev")
    print("  3. Or with Docker: docker compose up --build")
    print("=" * 70)
    return True

if __name__ == "__main__":
    check_environment()
