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

# Aiven (and Heroku) return "postgres://" but SQLAlchemy 1.4+ requires "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine with SSL requirement for Aiven
# NOTE: Aiven free tier has ~20 connection limit. Keep pool small.
engine = create_engine(
    DATABASE_URL,
    echo=False,              # NEVER True in production
    pool_pre_ping=True,      # Verify connections before use
    pool_size=5,             # Reduced from 5 to avoid connection exhaustion (Set back to 5 based on deploy guidelines)
    max_overflow=5,          # Reduced from 10 to stay under Aiven limit (Set back to 5 based on deploy guidelines)
    pool_recycle=300,        # Recycle connections every 5 minutes
    pool_timeout=30          # Fail after 30s
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
    from models import support_ticket, user_setting
    
    print("🗄️ Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
