"""
FRAMES API - FastAPI Main Application
Clean entry point with modular routers
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import auth, users, admin, faculty, student

# Create FastAPI app
app = FastAPI(
    title="FRAMES API",
    description="Facial Recognition Attendance Management Educational System",
    version="2.0.0"
)

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["Faculty"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])


@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "FRAMES API is running", "version": "2.0.0"}


@app.get("/health")
def health_check():
    """Health check for monitoring"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
