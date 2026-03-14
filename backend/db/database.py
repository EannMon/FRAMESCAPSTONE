"""
SQLAlchemy Database Configuration for FRAMES
PostgreSQL on Aiven.
Pool settings per FRAMES_DEPLOYMENT_CONSTRAINTS §1.5.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
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
# NOTE: Aiven tiers are connection-limited. Keep defaults conservative.
db_pool_mode = os.getenv("DB_POOL_MODE", "queue").strip().lower()
db_pool_size = int(os.getenv("DB_POOL_SIZE", "2"))
db_max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "1"))
db_pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "15"))
db_pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "300"))
db_connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT", "8"))

engine_kwargs = {
    "echo": False,                         # NEVER True in production
    "pool_pre_ping": True,                 # Verify connections before use
    "connect_args": {"connect_timeout": db_connect_timeout},
}

if db_pool_mode == "null":
    # Useful for local dev when connection slots are saturated.
    # Each DB use gets a fresh connection with no persistent pool.
    engine_kwargs["poolclass"] = NullPool
    logger.warning("DB pool mode is 'null'; persistent pooling is disabled")
else:
    engine_kwargs.update(
        {
            "pool_size": db_pool_size,
            "max_overflow": db_max_overflow,
            "pool_recycle": db_pool_recycle,
            "pool_timeout": db_pool_timeout,
            "pool_use_lifo": True,
        }
    )

engine = create_engine(DATABASE_URL, **engine_kwargs)

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
