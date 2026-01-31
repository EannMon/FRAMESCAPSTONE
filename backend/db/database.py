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
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    pool_pre_ping=True,  # Verify connections before use
    pool_size=5,
    max_overflow=10
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
