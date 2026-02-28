"""
FRAMES API - FastAPI Main Application
Clean entry point with modular routers
"""
import sys
import os
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

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
from api.routers import auth, users, admin, faculty, student, face, kiosk, dept
from db.database import get_db

# --- Logging Configuration ---
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Silence noisy third-party loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="FRAMES API",
    description="Facial Recognition Attendance Management Educational System",
    version="2.0.0"
)

# Setup slowapi exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers after app and limiter are ready to avoid circular imports
from api.routers import auth, users, admin, faculty, student, face, kiosk, dept

# Include routers with prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["Faculty"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])
app.include_router(face.router)  # Already has /api/face prefix
app.include_router(kiosk.router)  # Already has /api/kiosk prefix
app.include_router(dept.router, prefix="/api/dept", tags=["Department"])


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
