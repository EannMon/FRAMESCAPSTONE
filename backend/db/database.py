"""
SQLAlchemy Database Configuration for FRAMES
PostgreSQL on Aiven.
Pool settings per FRAMES_DEPLOYMENT_CONSTRAINTS §1.5.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load .env from the backend root using utf-8-sig to handle UTF-8 BOM files.
# python-dotenv does NOT strip BOMs, which causes the first key to be stored
# as '\ufeffDATABASE_URL' instead of 'DATABASE_URL'. We read manually to fix this.
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    with open(_env_path, encoding="utf-8-sig") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

# Create SQLAlchemy engine with SSL requirement for Aiven
# NOTE: Aiven free tier has ~20 connection limit. Keep pool small.
engine = create_engine(
    DATABASE_URL,
    echo=False,              # NEVER True in production
    pool_pre_ping=True,      # Verify connections before use (detects stale connections)
    pool_size=5,             # Increased slightly — Aiven free tier has ~20 connection limit
    max_overflow=10,         # Increased to handle bursts during schedule uploads
    pool_recycle=300,        # Recycle connections every 5 minutes
    pool_timeout=45,         # Increased from 10s to 45s to handle database "cold start" or slow response times
    connect_args={
        "connect_timeout": 30  # Increased TCP connect timeout (was 8)
    }
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function for FastAPI routes.
    Yields a database session and ensures cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Create all tables in the database.
    Call this once to initialize the schema.
    """
    # Import all models here to register them with Base
    from models import user, department, program, facial_profile, subject, class_, enrollment, device, attendance_log, user_invite
    
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("All tables created successfully")
