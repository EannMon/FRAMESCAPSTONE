"""
FRAMES Kiosk Launcher with verbose diagnostics.
Run from the backend directory:
    python run_kiosk.py
"""
import os
import sys
import logging
from pathlib import Path

# ── BOM-safe .env loader ──────────────────────────────────────────────────────
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    with open(_env_path, encoding="utf-8-sig") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())

os.environ.setdefault("DEVICE_ID", "1")
os.environ.setdefault("BACKEND_URL", "http://localhost:5000")

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger("kiosk_launcher")

print("\n" + "=" * 65)
print("   FRAMES Kiosk — Local Diagnostic Launch")
print("=" * 65)
print(f"   DEVICE_ID  : {os.getenv('DEVICE_ID')}")
print(f"   BACKEND_URL: {os.getenv('BACKEND_URL')}")
print("=" * 65 + "\n")

sys.path.insert(0, str(Path(__file__).resolve().parent))

print("🔄 [1/4] Testing FaceDetector (MediaPipe BlazeFace)...")
try:
    from rpi.face_detector import FaceDetector
    fd = FaceDetector(min_confidence=0.7)
    fd.close()
    print("   ✅ FaceDetector OK")
except Exception as e:
    print(f"   ❌ FaceDetector FAILED: {e}")
    sys.exit(1)

print("🔄 [2/4] Testing GestureDetector (MediaPipe Hands)...")
try:
    from rpi.gesture_detector import GestureDetector
    gd = GestureDetector(min_confidence=0.5, consecutive_frames=3)
    gd.close()
    print("   ✅ GestureDetector OK")
except Exception as e:
    print(f"   ❌ GestureDetector FAILED: {e}")
    sys.exit(1)

print("🔄 [3/4] Loading embeddings cache...")
try:
    from rpi.embedding_cache import EmbeddingCache
    cache = EmbeddingCache()
    cache_path = Path(__file__).parent / "rpi" / "data" / "embeddings_cache.json"
    if cache_path.exists():
        cache.load_from_json(str(cache_path))
        print(f"   ✅ Cache loaded: {cache.count} enrolled faces")
        for f in cache.faces:
            print(f"      • {f.name} ({f.email})")
    else:
        print(f"   ⚠️  Cache not found at {cache_path}")
except Exception as e:
    print(f"   ❌ EmbeddingCache FAILED: {e}")
    sys.exit(1)

print("🔄 [4/4] Testing camera (OpenCV webcam index 0)...")
try:
    import cv2
    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        ret, frame = cap.read()
        cap.release()
        print(f"   ✅ Camera OK — frame shape: {frame.shape if ret else 'N/A'}")
    else:
        print("   ❌ Camera failed to open (index 0)")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Camera test FAILED: {e}")
    sys.exit(1)

# NOTE: We intentionally do NOT pre-test FaceRecognizer here.
# Pre-testing it would cache the wrong det_size in the global singleton
# before kiosk_server.py initializes it with the correct laptop det_size (640x640).
# InsightFace will be initialized on first frame in the recognition thread instead.
print("\n✅ Pre-flight checks passed!")
print("   InsightFace/buffalo_l will be loaded fresh on first recognition frame.")
print("\n   📺 Video feed : http://localhost:8000/video_feed")
print("   🔌 WebSocket  : ws://localhost:8000/ws/status")
print("   🖥️  Kiosk UI   : http://localhost:3000/kiosk")
print("\n   ⚠️  First recognition attempt will take 5-15s while buffalo_l loads.")
print("   Unknown faces → RED box on video feed")
print("   Known faces   → GREEN box + 'Welcome!' greeting")
print("\n   Press Ctrl+C to stop.\n")
print("-" * 65)

import uvicorn
uvicorn.run(
    "rpi.kiosk_server:app",
    host="0.0.0.0",
    port=8000,
    reload=False,
    log_level="info",
)
