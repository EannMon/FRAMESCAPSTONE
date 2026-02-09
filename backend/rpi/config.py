"""
Kiosk Configuration
Edit these settings for your deployment environment.
"""
import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class KioskConfig:
    """Configuration for the attendance kiosk."""
    
    # ===========================================
    # Camera Settings
    # ===========================================
    CAMERA_INDEX: int = 0  # 0=default USB, change for Pi Camera
    CAMERA_WIDTH: int = 640
    CAMERA_HEIGHT: int = 480
    CAMERA_FPS: int = 30
    
    # ===========================================
    # Face Detection (MediaPipe BlazeFace)
    # ===========================================
    FACE_DET_CONFIDENCE: float = 0.7
    FACE_DET_MODEL: int = 0  # 0=short-range (2m), 1=long-range (5m)
    
    # ===========================================
    # Face Recognition (InsightFace buffalo_sc)
    # ===========================================
    # buffalo_sc is smaller/faster than buffalo_l but produces same 512-d embeddings
    INSIGHTFACE_MODEL: str = "buffalo_sc"
    RECOGNITION_DET_SIZE: tuple = (320, 320)  # Smaller for speed on RPi
    
    # ===========================================
    # Matching Thresholds
    # ===========================================
    # Cosine similarity thresholds (InsightFace embeddings typically use 0.3-0.5)
    MATCH_THRESHOLD: float = 0.40  # Balanced: low false accepts, low misses
    MATCH_THRESHOLD_STRICT: float = 0.50  # For high-security scenarios
    
    # ===========================================
    # Gesture Detection (MediaPipe Hands)
    # ===========================================
    GESTURE_CONFIDENCE: float = 0.7
    REQUIRE_GESTURE_FOR_ENTRY: bool = True
    REQUIRE_GESTURE_FOR_EXIT: bool = True
    GESTURE_TIMEOUT_SECONDS: float = 5.0
    
    # ===========================================
    # Attendance Rules
    # ===========================================
    COOLDOWN_SECONDS: int = 10  # Prevent duplicate scans
    LATE_THRESHOLD_MINUTES: int = 15  # Mark as late after this
    
    # ===========================================
    # Backend API
    # ===========================================
    BACKEND_URL: str = field(default_factory=lambda: os.getenv("BACKEND_URL", "http://localhost:8000"))
    API_TIMEOUT_SECONDS: int = 5
    
    # ===========================================
    # Device Identity
    # ===========================================
    # These are loaded from environment or database
    DEVICE_ID: Optional[int] = field(default_factory=lambda: int(os.getenv("DEVICE_ID", "0")) or None)
    DEVICE_ROOM: Optional[str] = field(default_factory=lambda: os.getenv("DEVICE_ROOM", None))
    
    # ===========================================
    # Local Cache
    # ===========================================
    EMBEDDINGS_CACHE_PATH: str = "rpi/data/embeddings_cache.json"
    SCHEDULE_CACHE_PATH: str = "rpi/data/schedule_cache.json"
    OFFLINE_LOGS_PATH: str = "rpi/data/offline_attendance.json"
    CACHE_REFRESH_MINUTES: int = 30  # Re-sync embeddings every N minutes
    
    # ===========================================
    # Logging & Debug
    # ===========================================
    LOG_LEVEL: str = "INFO"
    SAVE_RECOGNITION_FRAMES: bool = False  # Save frames for debugging
    RECOGNITION_FRAMES_PATH: str = "rpi/data/recognition_frames"


# Default configuration instance
config = KioskConfig()
