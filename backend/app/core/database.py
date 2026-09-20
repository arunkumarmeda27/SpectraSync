"""SQLAlchemy database engine and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings

# Database engine configuration with enterprise connection pooling for PostgreSQL
engine_kwargs = {"echo": False}

if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL connection pooling for high-concurrency production deployments
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600
    })

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables if they do not exist and seed default accounts."""
    # Import all models to register with Base
    from backend.app.models.user import User
    import backend.app.models.signal_file
    import backend.app.models.analysis_job
    import backend.app.models.analysis_result
    import backend.app.models.bitstream
    import backend.app.models.artifact
    import backend.app.models.processing_stage
    Base.metadata.create_all(bind=engine)

    # Seed default analyst and admin accounts if missing
    from backend.app.core.security import hash_password
    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "analyst@spectrasync.io").first():
            db.add(User(
                email="analyst@spectrasync.io",
                password_hash=hash_password("analyst123"),
                role="analyst"
            ))
        if not db.query(User).filter(User.email == "admin@spectrasync.io").first():
            db.add(User(
                email="admin@spectrasync.io",
                password_hash=hash_password("admin123"),
                role="admin"
            ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
