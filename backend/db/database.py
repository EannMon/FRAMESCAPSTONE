"""
SQLAlchemy Database Configuration for FRAMES
PostgreSQL on Aiven
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

# Create SQLAlchemy engine with SSL requirement for Aiven
# NOTE: Aiven free tier has ~20 connection limit. Keep pool small.
engine = create_engine(
    DATABASE_URL,
    echo=False,              # NEVER True in production
    pool_pre_ping=True,      # Verify connections before use (detects stale connections)
    pool_size=3,             # Keep small — Aiven free tier has ~20 connection limit
    max_overflow=3,          # Allow up to 3 extra connections briefly
    pool_recycle=300,        # Recycle connections every 5 minutes
    pool_timeout=10,         # Fail fast after 10s (was 30s — caused long blank screens)
    connect_args={
        "connect_timeout": 8  # PostgreSQL TCP connect timeout (fail before pool_timeout)
    }
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function for FastAPI/Flask routes.
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
    from models import user, department, program, facial_profile, subject, class_, enrollment, device, attendance_log
    
    print("🗄️ Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
