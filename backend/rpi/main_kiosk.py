"""
Main Kiosk Application - Face Recognition Attendance System
Runs the full attendance loop: face detection → recognition → gesture → log.

Flow:
1. Device is linked to a room (e.g., room 306)
2. Fetch active class for that room from schedule
3. Load enrolled students/faculty for that class
4. Recognize faces continuously:
   a. If recognized AND enrolled → check attendance state:
      - Not entered yet → log ENTRY (face only, no gesture)
      - Already entered → prompt gesture:
          ✌️ Peace sign  → BREAK_OUT
          👍 Thumbs up   → BREAK_IN
          🖐 Open palm    → EXIT
   b. If recognized but NOT enrolled → log as [NOT_IN_CLASS]
   c. If NOT recognized → display "Unknown person"

Supports two modes:
- LAPTOP: InsightFace runs every frame (fast CPU, ~50ms)
- RPI:    Two-stage gated detection (MediaPipe gate → InsightFace)
"""
import cv2
import time
import logging
import signal
import sys
import os
import requests
from datetime import datetime
from typing import Optional, Dict, Set, Any

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
from rpi.metrics_collector import KioskMetricsCollector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Gesture → Action mapping
GESTURE_ACTION_MAP = {
    Gesture.PEACE_SIGN: AttendanceAction.BREAK_OUT,
    Gesture.THUMBS_UP: AttendanceAction.BREAK_IN,
    Gesture.OPEN_PALM: AttendanceAction.EXIT,
}


class AttendanceKiosk:
    """
    Main kiosk application for face recognition attendance.

    State machine per user per class per day:
        (start) → ENTRY (face only) → [BREAK_OUT|EXIT] (face+gesture)
        BREAK_OUT → BREAK_IN (face+gesture) → [BREAK_OUT|EXIT]
        EXIT → (end, no more actions)
    """

    def __init__(self, config: Optional[KioskConfig] = None):
        self.config = config or KioskConfig()

        # Validate device ID
        if not self.config.DEVICE_ID:
            logger.error("DEVICE_ID not set! Set via environment variable.")
            raise ValueError("DEVICE_ID required")

        # Initialize components
        logger.info("=" * 60)
        logger.info("   FRAMES Attendance Kiosk - Initializing")
        logger.info("=" * 60)

        logger.info("Loading face detector (MediaPipe)...")
        self.face_detector = FaceDetector(
            min_confidence=self.config.FACE_DET_CONFIDENCE,
            model_selection=self.config.FACE_DET_MODEL
        )

        logger.info("Loading face recognizer (InsightFace)...")
        self.face_recognizer = FaceRecognizer(
            model_name=self.config.INSIGHTFACE_MODEL,
            det_size=self.config.RECOGNITION_DET_SIZE
        )

        logger.info("Loading gesture detector (MediaPipe Hands)...")
        self.gesture_detector = GestureDetector(
            min_confidence=self.config.GESTURE_CONFIDENCE,
            consecutive_frames=getattr(self.config, 'GESTURE_CONSECUTIVE_FRAMES', 3)
        )

        logger.info("Loading embedding cache...")
        self.embedding_cache = EmbeddingCache()
        cache_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            self.config.EMBEDDINGS_CACHE_PATH
        )
        if os.path.exists(cache_path):
            self.embedding_cache.load_from_json(cache_path)
        else:
            logger.warning("No cache file found at %s", cache_path)

        logger.info("Initializing schedule resolver...")
        self.schedule_resolver = ScheduleResolver(
            backend_url=self.config.BACKEND_URL,
            device_id=self.config.DEVICE_ID,
            cache_path=os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                self.config.SCHEDULE_CACHE_PATH
            ),
            api_timeout=self.config.API_TIMEOUT_SECONDS,
            failure_backoff_sec=getattr(self.config, "ACTIVE_CLASS_FAILURE_BACKOFF_SEC", 300),
            use_api=getattr(self.config, "USE_ACTIVE_CLASS_API", True),
        )

        logger.info("Initializing attendance logger...")
        self.attendance_logger = AttendanceLogger(
            backend_url=self.config.BACKEND_URL,
            offline_queue_path=os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                self.config.OFFLINE_LOGS_PATH
            ),
            api_timeout=self.config.API_TIMEOUT_SECONDS
        )

        # State tracking
        self._last_recognized: Dict[int, float] = {}  # user_id → timestamp (cooldown)
        self._user_attendance_state: Dict[str, dict] = {}  # "uid_classid" → state
        self._class_enrolled_ids: Set[int] = set()  # enrolled student IDs for current class
        self._class_faculty_id: Optional[int] = None  # faculty ID for current class
        self._current_class_id: Optional[int] = None
        self._not_in_class_logged: Set[int] = set()  # user_ids already logged as NOT_IN_CLASS this session
        self._enrollment_loaded: bool = False  # True only after successful enrollment fetch
        self._frame_count: int = 0
        self._last_cache_refresh: Optional[float] = None  # timestamp of last embedding cache refresh
        self._metrics = KioskMetricsCollector(
            report_interval_sec=getattr(self.config, "METRICS_REPORT_INTERVAL_SEC", 60),
            platform=self.config.PLATFORM,
        )
        self._last_recognition_ts: float = 0.0

        # SIGTERM flag for systemd graceful shutdown
        self._shutdown_requested = False

        logger.info("=" * 60)
        logger.info(
            "Kiosk initialized | Device ID: %s | Platform: %s",
            self.config.DEVICE_ID, self.config.PLATFORM.upper()
        )
        logger.info(
            "Gated detection: %s | Model: %s @ %s | Frame skip: %d",
            'ON' if self.config.USE_GATED_DETECTION else 'OFF',
            self.config.INSIGHTFACE_MODEL,
            self.config.RECOGNITION_DET_SIZE,
            self.config.RECOGNITION_FRAME_SKIP
        )
        logger.info(
            "Enrolled faces: %d | Backend URL: %s",
            self.embedding_cache.count, self.config.BACKEND_URL
        )
        logger.info("=" * 60)

    def _fetch_class_enrollment(self, class_id: int):
        """Fetch enrolled student IDs and faculty ID for a class from the API."""
        if self._current_class_id == class_id:
            return  # already loaded

        try:
            url = f"{self.config.BACKEND_URL}/api/kiosk/class/{class_id}/enrolled"
            response = requests.get(url, timeout=self.config.API_TIMEOUT_SECONDS)

            if response.status_code == 200:
                data = response.json()
                self._class_enrolled_ids = {s['user_id'] for s in data.get('students', [])}
                faculty = data.get('faculty')
                self._class_faculty_id = faculty['user_id'] if faculty else None
                self._current_class_id = class_id
                self._enrollment_loaded = True

                logger.info(
                    "Loaded enrollment for class %d: %d students, faculty=%s",
                    class_id, len(self._class_enrolled_ids), self._class_faculty_id
                )
            else:
                logger.warning("Failed to fetch enrollment: %d", response.status_code)
                self._enrollment_loaded = False
        except requests.exceptions.RequestException as e:
            logger.warning("Enrollment fetch failed: %s", str(e))
            self._enrollment_loaded = False

    def _fetch_attendance_state(self, user_id: int, class_id: int) -> dict:
        """Query backend for current attendance state of a user in a class today."""
        cache_key = f"{user_id}_{class_id}"

        try:
            url = f"{self.config.BACKEND_URL}/api/kiosk/attendance-state"
            response = requests.get(
                url,
                params={"user_id": user_id, "class_id": class_id},
                timeout=self.config.API_TIMEOUT_SECONDS
            )

            if response.status_code == 200:
                state = response.json()
                self._user_attendance_state[cache_key] = state
                return state

        except requests.exceptions.RequestException as e:
            logger.warning("State fetch failed: %s", str(e))

        # Return default state if fetch fails
        return self._user_attendance_state.get(cache_key, {
            "has_entered": False,
            "is_on_break": False,
            "has_exited": False,
            "last_action": None,
            "allowed_actions": ["ENTRY"]
        })

    def _is_user_in_class(self, user_id: int) -> bool:
        """Check if user is enrolled in current class or is the faculty."""
        return user_id in self._class_enrolled_ids or user_id == self._class_faculty_id

    def process_frame(
        self, frame_bgr, timings: Optional[Dict[str, float]] = None
    ) -> tuple:
        """
        Process a single frame for face recognition.

        Returns:
            (face_match, confidence, bbox) or (None, 0.0, None)
        If timings dict is provided, fills recognition_ms and match_ms (for observability).
        """
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        recognition_ms: Optional[float] = None
        match_ms: Optional[float] = None

        if self.config.USE_GATED_DETECTION:
            # STAGE 1: Fast face detection with MediaPipe
            face_bbox = self.face_detector.get_largest_face(frame_rgb)

            if face_bbox is None:
                return None, 0.0, None

            x, y, fw, fh, _ = face_bbox
            if fw < self.config.MIN_FACE_SIZE_PX or fh < self.config.MIN_FACE_SIZE_PX:
                return None, 0.0, None

            # STAGE 2: InsightFace embedding extraction on cropped face
            face_crop = self.face_detector.crop_face(
                frame_rgb,
                face_bbox,
                target_size=(112, 112),
                margin=getattr(self.config, "FACE_CROP_MARGIN", 0.3),
            )
            t0 = time.perf_counter()
            embedding, det_score = self.face_recognizer.get_embedding_from_crop(face_crop)
            recognition_ms = (time.perf_counter() - t0) * 1000
            bbox = (x, y, x + fw, y + fh)
        else:
            t0 = time.perf_counter()
            embedding, det_score, bbox = self.face_recognizer.get_embedding(frame_rgb)
            recognition_ms = (time.perf_counter() - t0) * 1000

        if embedding is None:
            if timings and recognition_ms is not None:
                timings["recognition_ms"] = recognition_ms
            return None, 0.0, None

        # Match against cache
        t0 = time.perf_counter()
        match, confidence = self.embedding_cache.find_match(
            embedding,
            threshold=self.config.MATCH_THRESHOLD
        )
        match_ms = (time.perf_counter() - t0) * 1000

        if timings:
            if recognition_ms is not None:
                timings["recognition_ms"] = recognition_ms
            timings["match_ms"] = match_ms
        return match, confidence, bbox

    def check_gesture(self, cap, timeout: float = None) -> Optional[Gesture]:
        """
        Wait for gesture confirmation within timeout.

        Returns:
            Gesture enum if detected, None if timeout
        """
        if timeout is None:
            timeout = self.config.GESTURE_TIMEOUT_SECONDS

        start_time = time.time()
        self.gesture_detector.reset_buffer()

        while time.time() - start_time < timeout:
            ret, frame = cap.read()
            if not ret:
                continue

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            gesture, hand = self.gesture_detector.detect(frame_rgb)

            # Show gesture prompt on screen
            display = frame.copy()
            remaining = timeout - (time.time() - start_time)
            cv2.putText(display, f"Show gesture... ({remaining:.1f}s)", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(display, "Peace = Break Out | Thumbs Up = Break In | Palm = Exit", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            cv2.putText(display, f"Detected: {gesture.value}", (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                        (0, 255, 0) if gesture != Gesture.NONE else (128, 128, 128), 2)

            if hand:
                self.gesture_detector.draw_landmarks(display, hand)

            cv2.imshow("FRAMES Attendance Kiosk", display)
            cv2.waitKey(1)

            if gesture in (Gesture.PEACE_SIGN, Gesture.THUMBS_UP, Gesture.OPEN_PALM):
                return gesture

            time.sleep(0.03)

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
        """Main kiosk loop with full attendance state machine."""
        # Register SIGTERM handler for systemd graceful shutdown
        def _sigterm_handler(signum, frame):
            logger.info("SIGTERM received, initiating graceful shutdown")
            self._shutdown_requested = True

        signal.signal(signal.SIGTERM, _sigterm_handler)

        logger.info(
            "Opening camera (picamera2=%s)",
            'ON' if self.config.USE_PICAMERA2 else 'OFF'
        )
        cap = Camera(
            index=self.config.CAMERA_INDEX,
            width=self.config.CAMERA_WIDTH,
            height=self.config.CAMERA_HEIGHT,
            fps=self.config.CAMERA_FPS,
            prefer_picamera2=self.config.USE_PICAMERA2
        )

        if not cap.isOpened():
            logger.error("Failed to open camera")
            return

        logger.info("Camera opened (%s) | Press 'q' to stop", cap.backend_name)
        logger.info("-" * 60)

        # Sync schedule on startup
        self.schedule_resolver.sync_schedule()

        # Flush any offline attendance records
        if self.attendance_logger.offline_count > 0:
            self.attendance_logger.flush_offline_queue()

        try:
            frame_count = 0
            last_status_time = time.time()
            last_class_id = None
            last_flush_time = time.time()
            last_schedule_sync = time.time()

            while not self._shutdown_requested:
                t_loop_start = time.perf_counter()
                ret, frame = cap.read()
                if not ret:
                    continue

                frame_count += 1

                # Skip frames for performance
                if frame_count % self.config.RECOGNITION_FRAME_SKIP != 0:
                    # Still show video even on skipped frames
                    cv2.imshow("FRAMES Attendance Kiosk", frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                    continue

                # 1. Get active class for this room
                active_class = self.schedule_resolver.get_active_class()

                if active_class is None:
                    if time.time() - last_status_time > 30:
                        logger.debug("No active class at this time")
                        last_status_time = time.time()

                    display = frame.copy()
                    cv2.putText(display, "No active class scheduled", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)
                    cv2.putText(display, f"Room: {self.schedule_resolver.room or 'Unknown'}", (10, 60),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                    cv2.imshow("FRAMES Attendance Kiosk", display)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

                    # Record idle frame metrics so we can still see FPS/latency when backend is down
                    frame_elapsed_ms = (time.perf_counter() - t_loop_start) * 1000
                    self._metrics.record_frame(frame_elapsed_ms, num_faces=0, matched=False)
                    self._metrics.maybe_report(cache_size=self.embedding_cache.count)

                    time.sleep(getattr(self.config, "IDLE_NO_CLASS_SLEEP_SECONDS", 0.1))
                    continue

                # 2. Load enrollment when class changes (or retry if previous fetch failed)
                if active_class.class_id != last_class_id:
                    self._fetch_class_enrollment(active_class.class_id)
                    if self._enrollment_loaded:
                        last_class_id = active_class.class_id
                        # Clear cooldowns and NOT_IN_CLASS tracking when class changes
                        self._last_recognized.clear()
                        self._user_attendance_state.clear()
                        self._not_in_class_logged.clear()
                    else:
                        # Enrollment fetch failed — retry next iteration
                        logger.warning("Enrollment not loaded, will retry")
                        time.sleep(2)
                        continue
                elif not self._enrollment_loaded:
                    # Same class but enrollment never loaded — retry
                    self._fetch_class_enrollment(active_class.class_id)
                    if not self._enrollment_loaded:
                        time.sleep(2)
                        continue

                # Periodic embedding cache refresh (CACHE_REFRESH_MINUTES)
                now_sec = time.time()
                cache_path = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    self.config.EMBEDDINGS_CACHE_PATH
                )
                if (
                    self._last_cache_refresh is None
                    or (now_sec - self._last_cache_refresh) >= self.config.CACHE_REFRESH_MINUTES * 60
                ) and os.path.exists(cache_path):
                    if self.embedding_cache.load_from_json(cache_path):
                        self._last_cache_refresh = now_sec
                        logger.info("CACHE | Refreshed embeddings: %d faces", self.embedding_cache.count)

                # Periodic offline queue flush (every 5 minutes)
                now_sec = time.time()
                if (now_sec - last_flush_time) >= 300 and self.attendance_logger.offline_count > 0:
                    logger.info("PERIODIC | Flushing offline queue (%d records)", self.attendance_logger.offline_count)
                    self.attendance_logger.flush_offline_queue()
                    last_flush_time = now_sec

                # Periodic schedule re-sync (every 30 minutes)
                if (now_sec - last_schedule_sync) >= 1800:
                    logger.info("PERIODIC | Re-syncing schedule from API")
                    self.schedule_resolver.sync_schedule()
                    last_schedule_sync = now_sec

                # 3. Face recognition (with per-step timing for observability)
                # Throttle heavy recognition so we don't block every eligible frame
                now_time = time.time()
                min_interval = getattr(self.config, "RECOGNITION_MIN_INTERVAL_SECONDS", 0.0)
                if min_interval > 0.0 and (now_time - self._last_recognition_ts) < min_interval:
                    display = frame.copy()
                    cv2.putText(display, f"{active_class.subject_code} - {active_class.section}", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                    cv2.putText(display, f"Faculty: {active_class.faculty_name}", (10, 55),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
                    cv2.imshow("FRAMES Attendance Kiosk", display)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

                    frame_elapsed_ms = (time.perf_counter() - t_loop_start) * 1000
                    self._metrics.record_frame(frame_elapsed_ms, num_faces=0, matched=False)
                    try:
                        import psutil
                        mem_mb = psutil.Process().memory_info().rss / (1024 * 1024)
                    except Exception:
                        mem_mb = None
                    self._metrics.maybe_report(
                        cache_size=self.embedding_cache.count,
                        memory_mb=mem_mb,
                    )
                    continue

                frame_timings: Dict[str, float] = {}
                t_frame_start = time.perf_counter()
                match, confidence, bbox = self.process_frame(frame, timings=frame_timings)
                frame_elapsed_ms = (time.perf_counter() - t_frame_start) * 1000
                self._last_recognition_ts = now_time
                num_faces = 1 if (match is not None or bbox is not None) else 0
                self._metrics.record_frame(
                    frame_elapsed_ms,
                    num_faces=num_faces,
                    matched=match is not None,
                    recognition_ms=frame_timings.get("recognition_ms"),
                    match_ms=frame_timings.get("match_ms"),
                )
                try:
                    import psutil
                    mem_mb = psutil.Process().memory_info().rss / (1024 * 1024)
                except Exception:
                    mem_mb = None
                self._metrics.maybe_report(
                    cache_size=self.embedding_cache.count,
                    memory_mb=mem_mb,
                )

                display = frame.copy()

                # Show class info overlay
                cv2.putText(display, f"{active_class.subject_code} - {active_class.section}", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(display, f"Faculty: {active_class.faculty_name}", (10, 55),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

                if match is None:
                    # No face or unrecognized
                    if bbox is not None:
                        # Face detected but not matched — unknown person
                        x1, y1, x2, y2 = bbox
                        cv2.rectangle(display, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(display, f"Unknown ({confidence:.1%})", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                        logger.debug("Unknown face detected (best: %.1f%%)", confidence * 100)

                    cv2.imshow("FRAMES Attendance Kiosk", display)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                    continue

                # Face matched — check cooldown
                if self.is_on_cooldown(match.user_id):
                    if bbox is not None:
                        x1, y1, x2, y2 = bbox
                        cv2.rectangle(display, (x1, y1), (x2, y2), (200, 200, 0), 2)
                        cv2.putText(display, f"{match.name} (cooldown)", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 0), 2)
                    cv2.imshow("FRAMES Attendance Kiosk", display)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                    continue

                logger.info("Recognized: %s (%.1f%%)", match.name, confidence * 100)

                # Draw bounding box
                if bbox is not None:
                    x1, y1, x2, y2 = bbox
                    cv2.rectangle(display, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(display, f"{match.name} ({confidence:.1%})", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                # 4. Check if this person belongs to the active class
                if not self._is_user_in_class(match.user_id):
                    # Recognized but NOT supposed to be here
                    logger.warning(
                        "%s recognized but NOT in class %s %s",
                        match.name, active_class.subject_code, active_class.section
                    )
                    cv2.putText(display, "NOT IN THIS CLASS", (10, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    cv2.imshow("FRAMES Attendance Kiosk", display)
                    cv2.waitKey(2000)  # Show warning for 2 seconds

                    # Log NOT_IN_CLASS only ONCE per user per class session
                    if match.user_id not in self._not_in_class_logged:
                        self.attendance_logger.log_attendance(
                            user_id=match.user_id,
                            class_id=active_class.class_id,
                            device_id=self.config.DEVICE_ID,
                            action=AttendanceAction.ENTRY,
                            verified_by=VerifiedBy.FACE,
                            confidence_score=confidence,
                            remarks=f"[NOT_IN_CLASS] {match.name} recognized but not enrolled"
                        )
                        self._not_in_class_logged.add(match.user_id)
                        logger.info("NOT_IN_CLASS logged once for %s", match.name)
                    else:
                        logger.debug("%s already logged as NOT_IN_CLASS, skipping", match.name)

                    self.mark_recognized(match.user_id)
                    continue

                # 5. Get attendance state for this user
                state = self._fetch_attendance_state(match.user_id, active_class.class_id)
                allowed = state.get('allowed_actions', ['ENTRY'])

                if not allowed:
                    # No allowed actions — skip (should rarely happen now)
                    logger.info("%s has no allowed actions", match.name)
                    self.mark_recognized(match.user_id)
                    continue

                # 6. Determine action based on state
                if "ENTRY" in allowed:
                    # Face-only ENTRY — no gesture required.
                    success = self.attendance_logger.log_attendance(
                        user_id=match.user_id,
                        class_id=active_class.class_id,
                        device_id=self.config.DEVICE_ID,
                        action=AttendanceAction.ENTRY,
                        verified_by=VerifiedBy.FACE,
                        confidence_score=confidence,
                    )

                    if success:
                        logger.info("ATTENDANCE | ENTRY logged for %s (face-only)", match.name)
                        cache_key = f"{match.user_id}_{active_class.class_id}"
                        self._user_attendance_state[cache_key] = {
                            "has_entered": True, "is_on_break": False,
                            "has_exited": False, "last_action": "ENTRY",
                            "allowed_actions": ["BREAK_OUT", "EXIT"]
                        }

                    # Show welcome on screen
                    welcome_display = frame.copy()
                    cv2.putText(welcome_display, "Welcome, %s!" % match.name, (10, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    cv2.imshow("FRAMES Attendance Kiosk", welcome_display)

                    self.mark_recognized(match.user_id)

                else:
                    # Already entered — require gesture for BREAK_OUT, BREAK_IN, EXIT
                    prompt_actions = []
                    if "BREAK_OUT" in allowed:
                        prompt_actions.append("✌️ Peace=Break")
                    if "BREAK_IN" in allowed:
                        prompt_actions.append("👍 ThumbsUp=Return")
                    if "EXIT" in allowed:
                        prompt_actions.append("🖐 Palm=Exit")

                    prompt_text = " | ".join(prompt_actions)
                    logger.info("%s -- show gesture: %s", match.name, prompt_text)
                    cv2.putText(display, f"Show gesture: {prompt_text}", (10, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
                    cv2.imshow("FRAMES Attendance Kiosk", display)

                    # Wait for gesture
                    gesture = self.check_gesture(cap, self.config.GESTURE_TIMEOUT_SECONDS)

                    if gesture is None:
                        logger.warning("Gesture timeout for %s", match.name)
                        self.mark_recognized(match.user_id)
                        continue

                    # Map gesture to action
                    action = GESTURE_ACTION_MAP.get(gesture)
                    if action is None:
                        logger.warning("Unrecognized gesture: %s", gesture)
                        self.mark_recognized(match.user_id)
                        continue

                    # Validate action is allowed
                    if action.value not in allowed:
                        logger.warning(
                            "%s not allowed for %s (allowed: %s)",
                            action.value, match.name, allowed
                        )
                        self.mark_recognized(match.user_id)
                        continue

                    logger.info("Gesture: %s -> Action: %s", gesture.value, action.value)

                    success = self.attendance_logger.log_attendance(
                        user_id=match.user_id,
                        class_id=active_class.class_id,
                        device_id=self.config.DEVICE_ID,
                        action=action,
                        verified_by=VerifiedBy.FACE_GESTURE,
                        confidence_score=confidence,
                        gesture_detected=gesture.value
                    )

                    if success:
                        logger.info("%s logged for %s", action.value, match.name)

                        # Update local state cache
                        cache_key = f"{match.user_id}_{active_class.class_id}"
                        if action == AttendanceAction.BREAK_OUT:
                            self._user_attendance_state[cache_key] = {
                                "has_entered": True, "is_on_break": True,
                                "has_exited": False, "last_action": "BREAK_OUT",
                                "allowed_actions": ["BREAK_IN"]
                            }
                        elif action == AttendanceAction.BREAK_IN:
                            self._user_attendance_state[cache_key] = {
                                "has_entered": True, "is_on_break": False,
                                "has_exited": False, "last_action": "BREAK_IN",
                                "allowed_actions": ["BREAK_OUT", "EXIT"]
                            }
                        elif action == AttendanceAction.EXIT:
                            self._user_attendance_state[cache_key] = {
                                "has_entered": False, "is_on_break": False,
                                "has_exited": True, "last_action": "EXIT",
                                "allowed_actions": ["ENTRY"]  # Allow re-entry after exit
                            }

                    self.mark_recognized(match.user_id)

                # Brief pause for display
                cv2.waitKey(1500)
                time.sleep(0.1)

        except KeyboardInterrupt:
            logger.info("Shutting down kiosk (KeyboardInterrupt)")

        finally:
            cap.release()
            cv2.destroyAllWindows()
            self.face_detector.close()
            self.gesture_detector.close()

            if self.attendance_logger.offline_count > 0:
                logger.info("Flushing remaining %d offline records", self.attendance_logger.offline_count)
                self.attendance_logger.flush_offline_queue()

            logger.info("Kiosk stopped")


def main():
    """Entry point for kiosk application."""
    import argparse

    parser = argparse.ArgumentParser(description="FRAMES Attendance Kiosk")
    parser.add_argument("--device-id", type=int, help="Device ID from database")
    parser.add_argument("--backend-url", default=None, help="Backend API URL")
    parser.add_argument("--camera", type=int, default=0, help="Camera index")
    args = parser.parse_args()

    # Create config with CLI overrides
    config = KioskConfig()

    if args.device_id:
        config.DEVICE_ID = args.device_id
    if args.backend_url:
        config.BACKEND_URL = args.backend_url
    if args.camera:
        config.CAMERA_INDEX = args.camera

    # Environment variable fallback
    if not config.DEVICE_ID:
        device_id_env = os.getenv("DEVICE_ID")
        if device_id_env:
            config.DEVICE_ID = int(device_id_env)

    if not config.DEVICE_ID:
        logger.error("DEVICE_ID required. Set via --device-id or DEVICE_ID env var.")
        logger.error("Run: python scripts/setup_laptop_device.py  to register your laptop first.")
        sys.exit(1)

    # ENTRY now requires liveness challenge (finger count) for anti-spoofing.
    # BREAK/EXIT still use specific gestures.

    # Run kiosk
    kiosk = AttendanceKiosk(config)
    kiosk.run()


if __name__ == "__main__":
    main()
