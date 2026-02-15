"""
Main Kiosk Application - Face Recognition Attendance System
Runs the full attendance loop: face detection → recognition → gesture → log.

Supports two modes:
- LAPTOP: InsightFace runs every frame (fast CPU, ~50ms)
- RPI:    Two-stage gated detection:
          Stage 1: MediaPipe BlazeFace detects face (~30ms on RPi4)
          Stage 2: Only if face found → InsightFace extracts embedding (~150-250ms on RPi4)
          Net: Responsive UI + recognition within ~300ms when face appears
"""
import cv2
import time
import logging
import sys
import os
from datetime import datetime
from typing import Optional

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rpi.config import KioskConfig
from rpi.camera import Camera
from rpi.face_detector import FaceDetector
from rpi.face_recognizer import FaceRecognizer
from rpi.gesture_detector import GestureDetector, Gesture
from rpi.embedding_cache import EmbeddingCache
from rpi.schedule_resolver import ScheduleResolver
from rpi.attendance_logger import AttendanceLogger, AttendanceAction, VerifiedBy

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


class AttendanceKiosk:
    """
    Main kiosk application for face recognition attendance.
    
    Flow:
    1. Detect face in frame
    2. Extract embedding and match against cache
    3. If matched, prompt for gesture confirmation
    4. Log attendance to backend
    """
    
    def __init__(self, config: Optional[KioskConfig] = None):
        self.config = config or KioskConfig()
        
        # Validate device ID
        if not self.config.DEVICE_ID:
            logger.error("❌ DEVICE_ID not set! Set via environment variable.")
            raise ValueError("DEVICE_ID required")
        
        # Initialize components
        logger.info("=" * 60)
        logger.info("   FRAMES Attendance Kiosk - Initializing")
        logger.info("=" * 60)
        
        logger.info("🔄 Loading face detector (MediaPipe)...")
        self.face_detector = FaceDetector(
            min_confidence=self.config.FACE_DET_CONFIDENCE,
            model_selection=self.config.FACE_DET_MODEL
        )
        
        logger.info("🔄 Loading face recognizer (InsightFace)...")
        self.face_recognizer = FaceRecognizer(
            model_name=self.config.INSIGHTFACE_MODEL,
            det_size=self.config.RECOGNITION_DET_SIZE
        )
        
        logger.info("🔄 Loading gesture detector (MediaPipe Hands)...")
        self.gesture_detector = GestureDetector(
            min_confidence=self.config.GESTURE_CONFIDENCE,
            consecutive_frames=getattr(self.config, 'GESTURE_CONSECUTIVE_FRAMES', 3)
        )
        
        logger.info("📥 Loading embedding cache...")
        self.embedding_cache = EmbeddingCache()
        cache_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            self.config.EMBEDDINGS_CACHE_PATH
        )
        if os.path.exists(cache_path):
            self.embedding_cache.load_from_json(cache_path)
        else:
            logger.warning(f"⚠️ No cache file found at {cache_path}")
        
        logger.info("📅 Initializing schedule resolver...")
        self.schedule_resolver = ScheduleResolver(
            backend_url=self.config.BACKEND_URL,
            device_id=self.config.DEVICE_ID,
            cache_path=os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                self.config.SCHEDULE_CACHE_PATH
            ),
            api_timeout=self.config.API_TIMEOUT_SECONDS
        )
        
        logger.info("📤 Initializing attendance logger...")
        self.attendance_logger = AttendanceLogger(
            backend_url=self.config.BACKEND_URL,
            offline_queue_path=os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                self.config.OFFLINE_LOGS_PATH
            ),
            api_timeout=self.config.API_TIMEOUT_SECONDS
        )
        
        # State tracking
        self._last_recognized: dict = {}  # user_id -> timestamp (for cooldown)
        self._frame_count: int = 0
        
        logger.info("=" * 60)
        logger.info(f"✅ Kiosk initialized | Device ID: {self.config.DEVICE_ID}")
        logger.info(f"   Platform: {self.config.PLATFORM.upper()}")
        logger.info(f"   Gated detection: {'ON' if self.config.USE_GATED_DETECTION else 'OFF'}")
        logger.info(f"   Model: {self.config.INSIGHTFACE_MODEL} @ {self.config.RECOGNITION_DET_SIZE}")
        logger.info(f"   Frame skip: every {self.config.RECOGNITION_FRAME_SKIP} frame(s)")
        logger.info(f"   Enrolled faces: {self.embedding_cache.count}")
        logger.info(f"   Backend URL: {self.config.BACKEND_URL}")
        logger.info("=" * 60)
    
    def process_frame(self, frame_bgr):
        """
        Process a single frame for face recognition.
        
        Two modes:
        - Direct (laptop): InsightFace handles detection + embedding in one pass
        - Gated (RPi):     MediaPipe detects face first (fast), then InsightFace 
                           only runs on the full frame if a face is present
        
        Returns:
            (face_match, confidence, bbox) or (None, 0.0, None)
        """
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        
        if self.config.USE_GATED_DETECTION:
            # STAGE 1: Fast face detection with MediaPipe (~30ms on RPi4)
            face_bbox = self.face_detector.get_largest_face(frame_rgb)
            
            if face_bbox is None:
                return None, 0.0, None
            
            # Check minimum face size
            _, _, fw, fh, _ = face_bbox
            if fw < self.config.MIN_FACE_SIZE_PX or fh < self.config.MIN_FACE_SIZE_PX:
                return None, 0.0, None
            
            # STAGE 2: InsightFace embedding extraction (~150-250ms on RPi4)
            # Pass full frame — InsightFace does its own internal detection + alignment
            # which is more accurate than using a pre-crop
            embedding, det_score, bbox = self.face_recognizer.get_embedding(frame_rgb)
        else:
            # Direct mode (laptop): InsightFace handles everything
            embedding, det_score, bbox = self.face_recognizer.get_embedding(frame_rgb)
        
        if embedding is None:
            return None, 0.0, None
        
        # Match against cache
        match, confidence = self.embedding_cache.find_match(
            embedding,
            threshold=self.config.MATCH_THRESHOLD
        )
        
        return match, confidence, bbox
    
    def check_gesture(self, cap, timeout: float = 5.0) -> Optional[str]:
        """
        Wait for gesture confirmation within timeout.
        
        Returns:
            Gesture name if detected, None if timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            ret, frame = cap.read()
            if not ret:
                continue
            
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            gesture, _ = self.gesture_detector.detect(frame_rgb)
            
            if gesture == Gesture.PEACE_SIGN:
                return "PEACE_SIGN"
            elif gesture == Gesture.THUMBS_UP:
                return "THUMBS_UP"
            
            time.sleep(0.05)
        
        return None
    
    def is_on_cooldown(self, user_id: int) -> bool:
        """Check if user was recently recognized (prevent duplicates)."""
        if user_id not in self._last_recognized:
            return False
        
        elapsed = time.time() - self._last_recognized[user_id]
        return elapsed < self.config.COOLDOWN_SECONDS
    
    def mark_recognized(self, user_id: int):
        """Record recognition timestamp for cooldown."""
        self._last_recognized[user_id] = time.time()
    
    def run(self):
        """Main kiosk loop."""
        logger.info(f"📷 Opening camera (picamera2={'ON' if self.config.USE_PICAMERA2 else 'OFF'})...")
        cap = Camera(
            index=self.config.CAMERA_INDEX,
            width=self.config.CAMERA_WIDTH,
            height=self.config.CAMERA_HEIGHT,
            fps=self.config.CAMERA_FPS,
            prefer_picamera2=self.config.USE_PICAMERA2
        )
        
        if not cap.isOpened():
            logger.error("❌ Failed to open camera!")
            logger.error("   On RPi: sudo apt install python3-picamera2")
            return
        
        logger.info(f"✅ Camera opened ({cap.backend_name}) | Press Ctrl+C to stop")
        logger.info("-" * 60)
        
        # Sync schedule on startup
        self.schedule_resolver.sync_schedule()
        
        # Flush any offline attendance records
        if self.attendance_logger.offline_count > 0:
            self.attendance_logger.flush_offline_queue()
        
        try:
            frame_count = 0
            last_status_time = time.time()
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    continue
                
                frame_count += 1
                
                # Skip frames for performance (configurable per platform)
                if frame_count % self.config.RECOGNITION_FRAME_SKIP != 0:
                    continue
                
                # Get active class
                active_class = self.schedule_resolver.get_active_class()
                
                if active_class is None:
                    # Log status periodically
                    if time.time() - last_status_time > 60:
                        logger.info("ℹ️ No active class at this time")
                        last_status_time = time.time()
                    time.sleep(0.5)
                    continue
                
                # Face recognition
                match, confidence, bbox = self.process_frame(frame)
                
                if match is None:
                    continue
                
                # Cooldown check
                if self.is_on_cooldown(match.user_id):
                    continue
                
                logger.info(f"👤 Recognized: {match.name} ({confidence:.1%})")
                
                # Gesture gate
                gesture = None
                if self.config.REQUIRE_GESTURE_FOR_ENTRY:
                    logger.info("✋ Show peace sign to confirm...")
                    gesture = self.check_gesture(cap, self.config.GESTURE_TIMEOUT_SECONDS)
                    
                    if gesture is None:
                        logger.warning("⚠️ Gesture timeout - skipping")
                        continue
                    
                    logger.info(f"✓ Gesture detected: {gesture}")
                
                # Log attendance
                verified_by = VerifiedBy.FACE_GESTURE if gesture else VerifiedBy.FACE
                
                success = self.attendance_logger.log_attendance(
                    user_id=match.user_id,
                    class_id=active_class.class_id,
                    device_id=self.config.DEVICE_ID,
                    action=AttendanceAction.ENTRY,
                    verified_by=verified_by,
                    confidence_score=confidence,
                    gesture_detected=gesture
                )
                
                if success:
                    logger.info(f"✅ Attendance logged for {match.name}")
                    logger.info(f"   Class: {active_class.subject_code} - {active_class.section}")
                    self.mark_recognized(match.user_id)
                
                time.sleep(0.1)
        
        except KeyboardInterrupt:
            logger.info("\n👋 Shutting down kiosk...")
        
        finally:
            cap.release()
            self.face_detector.close()
            self.gesture_detector.close()
            
            # Final flush of offline queue
            if self.attendance_logger.offline_count > 0:
                logger.info("📤 Flushing remaining offline records...")
                self.attendance_logger.flush_offline_queue()
            
            logger.info("✅ Kiosk stopped")


def main():
    """Entry point for kiosk application."""
    import argparse
    
    parser = argparse.ArgumentParser(description="FRAMES Attendance Kiosk")
    parser.add_argument("--device-id", type=int, help="Device ID from database")
    parser.add_argument("--backend-url", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--no-gesture", action="store_true", help="Disable gesture requirement")
    parser.add_argument("--camera", type=int, default=0, help="Camera index")
    args = parser.parse_args()
    
    # Create config with CLI overrides
    config = KioskConfig()
    
    if args.device_id:
        config.DEVICE_ID = args.device_id
    if args.backend_url:
        config.BACKEND_URL = args.backend_url
    if args.no_gesture:
        config.REQUIRE_GESTURE_FOR_ENTRY = False
    if args.camera:
        config.CAMERA_INDEX = args.camera
    
    # Environment variable fallback
    if not config.DEVICE_ID:
        device_id_env = os.getenv("DEVICE_ID")
        if device_id_env:
            config.DEVICE_ID = int(device_id_env)
    
    if not config.DEVICE_ID:
        print("❌ Error: DEVICE_ID required. Set via --device-id or DEVICE_ID env var.")
        sys.exit(1)
    
    # Run kiosk
    kiosk = AttendanceKiosk(config)
    kiosk.run()


if __name__ == "__main__":
    main()
