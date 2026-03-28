"""
Kiosk Configuration
Edit these settings for your deployment environment.

Supports two modes:
- LAPTOP mode:  buffalo_sc @ (640,640) — high accuracy, ~50ms/frame
- RPI mode:     buffalo_sc @ (320,320) — optimized for RPi4, ~300-500ms/frame
                Uses two-stage gated detection (MediaPipe gate → InsightFace only when face found)
"""
import os
import platform
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

# Set ONNX Runtime thread count BEFORE onnxruntime is imported.
# RPi4 has 4 cores — using all of them for inference gives ~15-25% speedup.
os.environ.setdefault("OMP_NUM_THREADS", "4")


def _load_env_defaults():
    """Load env defaults from common kiosk env files without overriding existing vars."""
    backend_dir = Path(__file__).resolve().parents[1]
    candidate_files = [
        backend_dir / ".env",
        backend_dir / "rpi" / ".env",
        backend_dir / "rpi" / ".env.rpi",
    ]

    for env_path in candidate_files:
        if not env_path.exists():
            continue

        with open(env_path, encoding="utf-8-sig") as env_file:
            for line in env_file:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())


_load_env_defaults()


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
    # On RPi Bookworm, the Pi Camera V2 requires picamera2 (libcamera stack).
    # OpenCV's cv2.VideoCapture cannot read from the CSI camera on Bookworm.
    # Set USE_PICAMERA2=0 in .env.rpi to force USB webcam via OpenCV.
    USE_PICAMERA2: bool = field(default_factory=lambda: None if os.getenv("USE_PICAMERA2") is None else os.getenv("USE_PICAMERA2") not in ("0", "false", "False", "no"))
    
    # ===========================================
    # Face Detection (MediaPipe BlazeFace)
    # ===========================================
    # Used as fast pre-filter on RPi (gate before heavy InsightFace)
    FACE_DET_CONFIDENCE: float = 0.7
    FACE_DET_MODEL: int = 0  # 0=short-range (2m), 1=long-range (5m)
    
    # ===========================================
    # Face Recognition (InsightFace)
    # ===========================================
    # MUST use buffalo_sc to match enrollment embeddings.
    # On RPi, use smaller det_size for speed (recognition model stays the same).
    # buffalo_sc uses MobileNet backbone — ~7-10x faster than buffalo_l on RPi CPU.
    INSIGHTFACE_MODEL: str = "buffalo_sc"
    RECOGNITION_DET_SIZE: tuple = field(default=None)  # Auto-set in __post_init__
    
    # ===========================================
    # Two-Stage Gated Detection (RPi optimization)
    # ===========================================
    # When True: MediaPipe detects face first (~30ms), only then runs InsightFace (~200ms)
    # When False: InsightFace runs every processed frame (fine for laptop)
    USE_GATED_DETECTION: bool = field(default=None)  # Auto-set in __post_init__
    # Minimum face size (pixels) from MediaPipe gate before triggering InsightFace
    # NOTE: Raised from 80 to 100 — ensures face crop quality before running InsightFace
    MIN_FACE_SIZE_PX: int = 100
    # On RPi, skip N frames between recognition attempts to save CPU
    RECOGNITION_FRAME_SKIP: int = field(default=None)  # Auto-set in __post_init__
    
    # ===========================================
    # Matching Thresholds
    # ===========================================
    # Cosine similarity thresholds (InsightFace same-model embeddings: 0.25-0.50)
    # With matching models (buffalo_sc ↔ buffalo_sc), genuine pairs typically score 0.3-0.6
    # buffalo_sc thresholds are slightly lower than buffalo_l due to MobileNet backbone.
    # NOTE: 0.30 was too permissive and caused wrong-user matches during testing.
    MATCH_THRESHOLD: float = 0.40  # Raised from 0.30 — prevents cross-user false matches
    MATCH_THRESHOLD_STRICT: float = 0.45  # For high-security scenarios
    
    # ===========================================
    # Gesture Detection (MediaPipe Hands)
    # ===========================================
    GESTURE_CONFIDENCE: float = 0.65  # Raised from 0.35 — low threshold caused false-positive gestures
    # ENTRY uses face-only verification (no gesture required).
    # BREAK/EXIT still use specific gestures (peace/thumbs/palm).
    REQUIRE_GESTURE_FOR_ENTRY: bool = False
    REQUIRE_GESTURE_FOR_EXIT: bool = True
    GESTURE_TIMEOUT_SECONDS: float = 8.0  # Comfortable window; gesture loop is fast now
    GESTURE_CONSECUTIVE_FRAMES: int = 3  # Require 3 consecutive matching frames — prevents false triggers
    
    # ===========================================
    # Attendance Rules
    # ===========================================
    COOLDOWN_SECONDS: int = 10  # Prevent duplicate scans
    LATE_THRESHOLD_MINUTES: int = 15  # Mark as late after this
    EARLY_ENTRY_MINUTES: int = 10  # Allow recognition N minutes before class starts
    AUTO_EXIT_ENABLED: bool = True  # Auto-log EXIT at class end time for users who forgot
    AUTO_EXIT_GRACE_MINUTES: int = 0  # Extra minutes after end_time before auto-exit fires
    
    # ===========================================
    # Backend API
    # ===========================================
    BACKEND_URL: str = field(default_factory=lambda: os.getenv("BACKEND_URL", "http://localhost:5000"))
    API_TIMEOUT_SECONDS: int = field(default_factory=lambda: int(os.getenv("API_TIMEOUT_SECONDS", "10")))
    ACTIVE_CLASS_FAILURE_BACKOFF_SEC: int = field(default_factory=lambda: int(os.getenv("ACTIVE_CLASS_FAILURE_BACKOFF_SEC", "30")))
    USE_ACTIVE_CLASS_API: bool = field(default_factory=lambda: os.getenv("USE_ACTIVE_CLASS_API", "1") not in ("0", "false", "False", "no"))
    
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
                self.RECOGNITION_DET_SIZE = (160, 160)  # Aggressive but safe for kiosk (face fills frame)
            if self.USE_GATED_DETECTION is None:
                self.USE_GATED_DETECTION = True  # Gate InsightFace behind MediaPipe
            if self.RECOGNITION_FRAME_SKIP is None:
                self.RECOGNITION_FRAME_SKIP = 5  # Process every 5th frame
            if self.USE_PICAMERA2 is None:
                self.USE_PICAMERA2 = True  # Pi Camera V2 on Bookworm needs picamera2
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
            if self.USE_PICAMERA2 is None:
                self.USE_PICAMERA2 = False  # Laptop uses OpenCV


# Default configuration instance
config = KioskConfig()
