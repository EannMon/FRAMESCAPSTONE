"""
Kiosk Configuration
Edit these settings for your deployment environment.

Supports two modes:
- LAPTOP mode:  buffalo_l @ (640,640) — high accuracy, ~50ms/frame
- RPI mode:     buffalo_l @ (320,320) — optimized for RPi4, ~150-250ms/frame
                Uses two-stage gated detection (MediaPipe gate → InsightFace only when face found)
"""
import os
import platform
from dataclasses import dataclass, field
from typing import Optional


def _detect_platform() -> str:
    """Auto-detect if running on Raspberry Pi or laptop."""
    machine = platform.machine().lower()
    # RPi4 Model B reports 'aarch64' or 'armv7l'
    if machine in ('aarch64', 'armv7l', 'armv8l'):
        return "rpi"
    # Also check /proc/device-tree/model on Linux
    try:
        with open('/proc/device-tree/model', 'r') as f:
            model = f.read().lower()
            if 'raspberry pi' in model:
                return "rpi"
    except (FileNotFoundError, PermissionError):
        pass
    return "laptop"


# Auto-detect once at import time
DETECTED_PLATFORM = os.getenv("FRAMES_PLATFORM", _detect_platform())


@dataclass
class KioskConfig:
    """Configuration for the attendance kiosk."""
    
    # ===========================================
    # Platform (auto-detected or override via FRAMES_PLATFORM env)
    # ===========================================
    PLATFORM: str = field(default_factory=lambda: os.getenv("FRAMES_PLATFORM", _detect_platform()))
    
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
    # Used as fast pre-filter on RPi (gate before heavy InsightFace)
    FACE_DET_CONFIDENCE: float = 0.7
    FACE_DET_MODEL: int = 0  # 0=short-range (2m), 1=long-range (5m)
    
    # ===========================================
    # Face Recognition (InsightFace)
    # ===========================================
    # MUST use buffalo_l to match enrollment embeddings.
    # On RPi, use smaller det_size for speed (recognition model stays the same).
    INSIGHTFACE_MODEL: str = "buffalo_l"
    RECOGNITION_DET_SIZE: tuple = field(default=None)  # Auto-set in __post_init__
    
    # ===========================================
    # Two-Stage Gated Detection (RPi optimization)
    # ===========================================
    # When True: MediaPipe detects face first (~30ms), only then runs InsightFace (~200ms)
    # When False: InsightFace runs every processed frame (fine for laptop)
    USE_GATED_DETECTION: bool = field(default=None)  # Auto-set in __post_init__
    # Minimum face size (pixels) from MediaPipe gate before triggering InsightFace
    MIN_FACE_SIZE_PX: int = 80
    # On RPi, skip N frames between recognition attempts to save CPU
    RECOGNITION_FRAME_SKIP: int = field(default=None)  # Auto-set in __post_init__
    
    # ===========================================
    # Matching Thresholds
    # ===========================================
    # Cosine similarity thresholds (InsightFace same-model embeddings: 0.25-0.50)
    # With matching models (buffalo_l ↔ buffalo_l), genuine pairs typically score 0.4-0.7
    MATCH_THRESHOLD: float = 0.35  # Balanced: catches most genuine matches
    MATCH_THRESHOLD_STRICT: float = 0.50  # For high-security scenarios
    
    # ===========================================
    # Gesture Detection (MediaPipe Hands)
    # ===========================================
    GESTURE_CONFIDENCE: float = 0.5  # Lower for better hand detection rate
    REQUIRE_GESTURE_FOR_ENTRY: bool = True
    REQUIRE_GESTURE_FOR_EXIT: bool = True
    GESTURE_TIMEOUT_SECONDS: float = 8.0  # More time to show gesture
    GESTURE_CONSECUTIVE_FRAMES: int = 3  # Require gesture for N consecutive frames
    
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
    
    def __post_init__(self):
        """Auto-configure platform-specific defaults."""
        if self.PLATFORM == "rpi":
            # RPi4 optimizations
            if self.RECOGNITION_DET_SIZE is None:
                self.RECOGNITION_DET_SIZE = (320, 320)  # Faster detection on ARM
            if self.USE_GATED_DETECTION is None:
                self.USE_GATED_DETECTION = True  # Gate InsightFace behind MediaPipe
            if self.RECOGNITION_FRAME_SKIP is None:
                self.RECOGNITION_FRAME_SKIP = 5  # Process every 5th frame
            # Lower camera resolution for RPi
            self.CAMERA_WIDTH = 480
            self.CAMERA_HEIGHT = 360
            self.CAMERA_FPS = 15
        else:
            # Laptop defaults (full quality)
            if self.RECOGNITION_DET_SIZE is None:
                self.RECOGNITION_DET_SIZE = (640, 640)
            if self.USE_GATED_DETECTION is None:
                self.USE_GATED_DETECTION = False  # InsightFace is fast enough
            if self.RECOGNITION_FRAME_SKIP is None:
                self.RECOGNITION_FRAME_SKIP = 1  # Every frame


# Default configuration instance
config = KioskConfig()
