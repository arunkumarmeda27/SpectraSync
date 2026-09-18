"""SQLAlchemy database engine and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings

# If SQLite, ensure check_same_thread=False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

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
    """Create tables if they do not exist."""
    # Import all models to register with Base
    import backend.app.models.user
    import backend.app.models.signal_file
    import backend.app.models.analysis_job
    import backend.app.models.analysis_result
    import backend.app.models.bitstream
    import backend.app.models.artifact
    import backend.app.models.processing_stage
    Base.metadata.create_all(bind=engine)
