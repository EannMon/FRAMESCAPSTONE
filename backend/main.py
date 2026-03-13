"""
FRAMES API - FastAPI Main Application
Clean entry point with modular routers.
Logging configured per FRAMES_OBSERVABILITY_RULES before any router import.
"""
import sys
import os
import logging
from pathlib import Path

# Load .env using utf-8-sig to handle BOM-encoded files (python-dotenv silently fails on BOM)
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    with open(_env_path, encoding="utf-8-sig") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter

# Fix Windows console encoding for emoji characters (cp1252 -> utf-8)
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from db.database import get_db, SessionLocal

# --- Logging Configuration (FRAMES_OBSERVABILITY_RULES §1.1) ---
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Silence noisy third-party loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="FRAMES API",
    description="Facial Recognition Attendance Management Educational System",
    version="2.1.0"
)

# Setup slowapi exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — reads FRONTEND_URL from environment (comma-separated for multiple origins)
# On Render: set FRONTEND_URL=https://frames-smartattendance.vercel.app
# For local dev the default covers localhost Vite server
_raw_origins = os.getenv("FRONTEND_URL", "https://frames-smartattendance.vercel.app,http://localhost:3000,http://localhost:5173")
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Device-Key"],
)

# Import routers after app and limiter are ready to avoid circular imports
from api.routers import (
    auth, users, admin, faculty, student, face, kiosk, 
    invites, dept, reports, support
)

# Include routers with prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["Faculty"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])
app.include_router(invites.router)
app.include_router(face.router)  # Already has /api/face prefix
app.include_router(kiosk.router)  # Already has /api/kiosk prefix
app.include_router(dept.router, prefix="/api/dept", tags=["Department"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(support.router, prefix="/api", tags=["Support"])


@app.on_event("startup")
async def startup_warmup():
    """Warm up the DB connection pool on startup to avoid cold-start timeouts on first request."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection pool warmed up successfully")
    except Exception as e:
        logger.warning("Database warmup failed (will retry on first request): %s", str(e))


@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "FRAMES API is running", "version": "2.0.0"}


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for monitoring.
    Returns system status and component health.
    No authentication required.
    """
    health = {"status": "healthy", "components": {}}
    
    # Check database connectivity
    try:
        db.execute(text("SELECT 1"))
        health["components"]["database"] = "up"
    except Exception:
        health["status"] = "degraded"
        health["components"]["database"] = "down"
    
    # Check timestamp for uptime tracking
    health["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    return health


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
