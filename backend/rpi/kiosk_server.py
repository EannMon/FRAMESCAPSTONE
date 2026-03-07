"""
Streaming Kiosk Server - Face Recognition Attendance System
Uses FastAPI to expose an MJPEG stream and WebSockets for React UI integration.
"""
import cv2
import time
import logging
import sys
import os
import requests
import threading
import asyncio
from datetime import datetime
from typing import Optional, Dict, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

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

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)-8s | %(message)s')
logger = logging.getLogger(__name__)

GESTURE_ACTION_MAP = {
    Gesture.PEACE_SIGN: AttendanceAction.BREAK_OUT,
    Gesture.THUMBS_UP: AttendanceAction.BREAK_IN,
    Gesture.OPEN_PALM: AttendanceAction.EXIT,
}

app = FastAPI(title="FRAMES Kiosk Streaming Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for streaming and websocket
latest_frame_bytes = None
frame_lock = threading.Lock()
state_queue = None  # asyncio.Queue for broadcasting state updates
loop = None         # main event loop
kiosk_thread = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.active_connections.remove(connection)

manager = ConnectionManager()

def push_state_update(update_dict: dict):
    if loop and state_queue:
        asyncio.run_coroutine_threadsafe(state_queue.put(update_dict), loop)

class StreamingAttendanceKiosk:
    """Headless kiosk logic running in a background thread."""
    def __init__(self, config: Optional[KioskConfig] = None):
        self.config = config or KioskConfig()

        if not self.config.DEVICE_ID:
            logger.error("DEVICE_ID not set via config or env!")
            raise ValueError("DEVICE_ID required")

        logger.info("Initializing Streaming Kiosk components...")
        self.face_detector = FaceDetector(self.config.FACE_DET_CONFIDENCE, self.config.FACE_DET_MODEL)
        self.face_recognizer = FaceRecognizer(self.config.INSIGHTFACE_MODEL, self.config.RECOGNITION_DET_SIZE)
        self.gesture_detector = GestureDetector(self.config.GESTURE_CONFIDENCE, getattr(self.config, 'GESTURE_CONSECUTIVE_FRAMES', 3))
        
        self.embedding_cache = EmbeddingCache()
        cache_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), self.config.EMBEDDINGS_CACHE_PATH)
        if os.path.exists(cache_path):
            self.embedding_cache.load_from_json(cache_path)

        self.schedule_resolver = ScheduleResolver(
            backend_url=self.config.BACKEND_URL,
            device_id=self.config.DEVICE_ID,
            cache_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), self.config.SCHEDULE_CACHE_PATH),
            api_timeout=self.config.API_TIMEOUT_SECONDS,
            failure_backoff_sec=getattr(self.config, "ACTIVE_CLASS_FAILURE_BACKOFF_SEC", 300),
            use_api=getattr(self.config, "USE_ACTIVE_CLASS_API", True),
        )

        self.attendance_logger = AttendanceLogger(
            backend_url=self.config.BACKEND_URL,
            offline_queue_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), self.config.OFFLINE_LOGS_PATH),
            api_timeout=self.config.API_TIMEOUT_SECONDS
        )

        self._last_recognized: Dict[int, float] = {}
        self._user_attendance_state: Dict[str, dict] = {}
        self._class_enrolled_ids: Set[int] = set()
        self._class_faculty_id: Optional[int] = None
        self._current_class_id: Optional[int] = None
        self._not_in_class_logged: Set[int] = set()
        self._enrollment_loaded: bool = False
        self._last_cache_refresh: Optional[float] = None
        self._metrics = KioskMetricsCollector(
            report_interval_sec=getattr(self.config, "METRICS_REPORT_INTERVAL_SEC", 60),
            platform=self.config.PLATFORM,
        )
        # Shared frame buffer for producer (camera) and consumer (recognition)
        self._frame_lock = threading.Lock()
        self._latest_frame = None
        self._camera_thread: Optional[threading.Thread] = None
        self._recognition_thread: Optional[threading.Thread] = None
        # Shared overlay state drawn by camera thread so recognition does not block video
        self._overlay_lock = threading.Lock()
        self._overlay = {
            "bbox": None,          # (x1, y1, x2, y2)
            "label": None,         # text label
            "color": (0, 255, 0),  # BGR tuple for rectangle/text
            "expires_at": 0.0,     # timestamp when overlay should disappear
        }

        # State tracking for UI
        self.current_state = {
            "status": "idle",
            "active_class": None,
            "room": None,
            "recognized_user": None,
            "tupm_id": None,
            "greeting_type": None,  # "welcome" | "bye" when user just recognized
            "device_id": self.config.DEVICE_ID,
            "required_gestures": [],
            "recent_checkins": [],
            "message": ""
        }
        self.running = False
        
    def _fetch_class_enrollment(self, class_id: int):
        if self._current_class_id == class_id: return
        try:
            response = requests.get(f"{self.config.BACKEND_URL}/api/kiosk/class/{class_id}/enrolled", timeout=self.config.API_TIMEOUT_SECONDS)
            if response.status_code == 200:
                data = response.json()
                self._class_enrolled_ids = {s['user_id'] for s in data.get('students', [])}
                faculty = data.get('faculty')
                self._class_faculty_id = faculty['user_id'] if faculty else None
                self._current_class_id = class_id
                self._enrollment_loaded = True
            else:
                self._enrollment_loaded = False
        except requests.exceptions.RequestException:
            self._enrollment_loaded = False

    def _fetch_attendance_state(self, user_id: int, class_id: int) -> dict:
        cache_key = f"{user_id}_{class_id}"
        try:
            response = requests.get(
                f"{self.config.BACKEND_URL}/api/kiosk/attendance-state",
                params={"user_id": user_id, "class_id": class_id},
                timeout=self.config.API_TIMEOUT_SECONDS
            )
            if response.status_code == 200:
                state = response.json()
                self._user_attendance_state[cache_key] = state
                return state
        except requests.exceptions.RequestException:
            pass
        return self._user_attendance_state.get(cache_key, {"has_entered": False, "is_on_break": False, "has_exited": False, "last_action": None, "allowed_actions": ["ENTRY"]})

    def _is_user_in_class(self, user_id: int) -> bool:
        return user_id in self._class_enrolled_ids or user_id == self._class_faculty_id

    def add_checkin_event(self, name: str, status: str):
        # Notify UI of new check-in
        timestamp = datetime.now().strftime("%H:%M:%S")
        event = {"name": name, "timestamp": timestamp, "status": status}
        self.current_state["recent_checkins"].insert(0, event)
        if len(self.current_state["recent_checkins"]) > 10:
            self.current_state["recent_checkins"].pop()
        self.broadcast_state()

    def broadcast_state(self, overrides=None):
        if overrides:
            self.current_state.update(overrides)
        push_state_update(self.current_state.copy())

    def run(self):
        """
        Start camera and recognition threads.
        Camera thread (producer) updates MJPEG and latest_frame.
        Recognition thread (consumer) reads latest_frame and runs heavy InsightFace work.
        """
        self.running = True
        cap = Camera(
            self.config.CAMERA_INDEX,
            self.config.CAMERA_WIDTH,
            self.config.CAMERA_HEIGHT,
            self.config.CAMERA_FPS,
            self.config.USE_PICAMERA2,
        )
        if not cap.isOpened():
            logger.error("Failed to open camera")
            return

        # Initial sync and offline flush
        self.schedule_resolver.sync_schedule()
        if self.attendance_logger.offline_count > 0:
            self.attendance_logger.flush_offline_queue()

        def camera_loop():
            """Continuously read frames from camera and update MJPEG + latest_frame."""
            global latest_frame_bytes
            while self.running:
                ret, frame = cap.read()
                if not ret:
                    time.sleep(0.01)
                    continue

                # Copy for downstream use
                frame_to_send = frame.copy()

                # Apply latest overlay (bbox/label) if still valid
                now_ts = time.time()
                with self._overlay_lock:
                    overlay = self._overlay.copy()
                bbox = overlay.get("bbox")
                label = overlay.get("label")
                color = overlay.get("color") or (0, 255, 0)
                expires_at = overlay.get("expires_at") or 0.0
                # Use `is not None` — bbox may be a numpy array, which raises
                # ValueError if used directly in a boolean expression.
                if bbox is not None and now_ts < expires_at:
                    x1, y1, x2, y2 = bbox
                    cv2.rectangle(frame_to_send, (x1, y1), (x2, y2), color, 2)
                    if label:
                        cv2.putText(
                            frame_to_send,
                            label,
                            (x1, max(20, y1 - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            color,
                            2,
                        )

                # Update shared latest frame for recognition thread
                with self._frame_lock:
                    self._latest_frame = frame.copy()

                # Encode and push to MJPEG stream
                ret_enc, buffer = cv2.imencode(".jpg", frame_to_send)
                if ret_enc:
                    with frame_lock:
                        latest_frame_bytes = buffer.tobytes()

        def recognition_loop():
            """Run schedule/recognition/attendance logic on latest frames."""
            frame_count = 0
            last_status_time = time.time()
            last_class_id = None

            # Helper variables for gesture UI flow
            gesture_timeout_end = 0
            expected_gestures = []
            pending_match = None
            pending_confidence = 0
            pending_bbox = None
            pending_allowed = []
            last_recognition_ts = 0.0

            logger.info("RECOGNITION | thread started ✅")

            while self.running:
              try:

                # Get latest frame snapshot
                with self._frame_lock:
                    frame = None if self._latest_frame is None else self._latest_frame.copy()
                if frame is None:
                    time.sleep(0.01)
                    continue

                frame_count += 1
                t_frame_start = time.perf_counter()
                active_class = self.schedule_resolver.get_active_class()

                # No active class: update state only
                if active_class is None:
                    if time.time() - last_status_time > 30:
                        last_status_time = time.time()
                    self.broadcast_state({
                        "status": "idle",
                        "active_class": None,
                        "room": self.schedule_resolver.room or 'Unknown',
                        "recognized_user": None,
                        "required_gestures": [],
                        "message": "No active class scheduled",
                    })
                    frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                    self._metrics.record_frame(frame_elapsed, num_faces=0)
                    self._metrics.maybe_report(cache_size=self.embedding_cache.count)
                    time.sleep(0.1)
                    continue

                # Update class info in state
                class_info = f"{active_class.subject_code} - {active_class.section}"
                self.broadcast_state({
                    "status": "active",
                    "active_class": class_info,
                    "room": self.schedule_resolver.room or 'Unknown',
                    "message": "",
                })

                # Handle class loading
                if active_class.class_id != last_class_id:
                    self._fetch_class_enrollment(active_class.class_id)
                    if self._enrollment_loaded:
                        last_class_id = active_class.class_id
                        self._last_recognized.clear()
                        self._user_attendance_state.clear()
                        self._not_in_class_logged.clear()
                elif not self._enrollment_loaded:
                    self._fetch_class_enrollment(active_class.class_id)

                # Gesture handling using latest frame
                if pending_match is not None and time.time() < gesture_timeout_end:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    gesture, _ = self.gesture_detector.detect(frame_rgb)

                    tupm_id = getattr(pending_match, 'tupm_id', None)
                    self.broadcast_state({
                        "recognized_user": pending_match.name,
                        "tupm_id": tupm_id,
                        "greeting_type": None,
                        "device_id": self.config.DEVICE_ID,
                        "required_gestures": expected_gestures,
                        "message": "Please show required gesture",
                    })

                    if gesture in (Gesture.PEACE_SIGN, Gesture.THUMBS_UP, Gesture.OPEN_PALM):
                        action = GESTURE_ACTION_MAP.get(gesture)
                        if action and action.value in pending_allowed:
                            success = self.attendance_logger.log_attendance(
                                user_id=pending_match.user_id,
                                class_id=active_class.class_id,
                                device_id=self.config.DEVICE_ID,
                                action=action,
                                verified_by=VerifiedBy.FACE_GESTURE,
                                confidence_score=pending_confidence,
                                gesture_detected=gesture.value,
                            )
                            if success:
                                self.add_checkin_event(pending_match.name, action.value)
                                cache_key = f"{pending_match.user_id}_{active_class.class_id}"
                                tupm_id = getattr(pending_match, 'tupm_id', None)
                                if action == AttendanceAction.BREAK_OUT:
                                    self._user_attendance_state[cache_key]["allowed_actions"] = ["BREAK_IN"]
                                    self.broadcast_state({
                                        "recognized_user": None,
                                        "tupm_id": None,
                                        "greeting_type": None,
                                        "required_gestures": [],
                                        "message": "",
                                    })
                                elif action == AttendanceAction.BREAK_IN:
                                    self._user_attendance_state[cache_key]["allowed_actions"] = ["BREAK_OUT", "EXIT"]
                                    self.broadcast_state({
                                        "recognized_user": None,
                                        "tupm_id": None,
                                        "greeting_type": None,
                                        "required_gestures": [],
                                        "message": "",
                                    })
                                elif action == AttendanceAction.EXIT:
                                    self._user_attendance_state[cache_key]["allowed_actions"] = ["ENTRY"]
                                    self.broadcast_state({
                                        "recognized_user": pending_match.name,
                                        "tupm_id": tupm_id,
                                        "greeting_type": "bye",
                                        "required_gestures": [],
                                        "message": "Bye!",
                                    })

                            self._last_recognized[pending_match.user_id] = time.time()
                            pending_match = None
                            if success and action != AttendanceAction.EXIT:
                                self.broadcast_state({
                                    "recognized_user": None,
                                    "tupm_id": None,
                                    "greeting_type": None,
                                    "required_gestures": [],
                                    "message": "",
                                })

                    frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                    self._metrics.record_frame(frame_elapsed, num_faces=0)
                    self._metrics.maybe_report(cache_size=self.embedding_cache.count)
                    continue
                elif pending_match is not None:
                    # Gesture timeout expired
                    self._last_recognized[pending_match.user_id] = time.time()
                    pending_match = None
                    self.broadcast_state({
                        "recognized_user": None,
                        "tupm_id": None,
                        "greeting_type": None,
                        "required_gestures": [],
                        "message": "Gesture timeout",
                    })

                # Frame skipping for recognition
                if frame_count % self.config.RECOGNITION_FRAME_SKIP != 0:
                    frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                    self._metrics.record_frame(frame_elapsed, num_faces=0)
                    self._metrics.maybe_report(cache_size=self.embedding_cache.count)
                    time.sleep(0.01)
                    continue

                # Throttle heavy recognition
                now_time = time.time()
                min_interval = getattr(self.config, "RECOGNITION_MIN_INTERVAL_SECONDS", 0.0)
                if min_interval > 0.0 and (now_time - last_recognition_ts) < min_interval:
                    frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                    self._metrics.record_frame(frame_elapsed, num_faces=0)
                    self._metrics.maybe_report(cache_size=self.embedding_cache.count)
                    time.sleep(0.01)
                    continue

                # Periodic embedding cache refresh
                now_sec = time.time()
                cache_path_local = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    self.config.EMBEDDINGS_CACHE_PATH,
                )
                if (
                    self._last_cache_refresh is None
                    or (now_sec - self._last_cache_refresh) >= self.config.CACHE_REFRESH_MINUTES * 60
                ) and os.path.exists(cache_path_local):
                    if self.embedding_cache.load_from_json(cache_path_local):
                        self._last_cache_refresh = now_sec
                        logger.info("CACHE | Refreshed embeddings: %d faces", self.embedding_cache.count)

                # Process frame for Face Recognition (with timing for observability)
                recognition_ms = None
                match_ms = None
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                if self.config.USE_GATED_DETECTION:
                    face_bbox = self.face_detector.get_largest_face(frame_rgb)
                    if face_bbox is None:
                        frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                        self._metrics.record_frame(frame_elapsed, num_faces=0)
                        self._metrics.maybe_report(cache_size=self.embedding_cache.count)
                        continue

                    x, y, fw, fh, _ = face_bbox
                    if fw < self.config.MIN_FACE_SIZE_PX or fh < self.config.MIN_FACE_SIZE_PX:
                        frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                        self._metrics.record_frame(frame_elapsed, num_faces=0)
                        self._metrics.maybe_report(cache_size=self.embedding_cache.count)
                        continue

                    face_crop = self.face_detector.crop_face(
                        frame_rgb,
                        face_bbox,
                        target_size=(112, 112),
                        margin=getattr(self.config, "FACE_CROP_MARGIN", 0.3),
                    )
                    t_rec = time.perf_counter()
                    embedding, det_score = self.face_recognizer.get_embedding_from_crop(face_crop)
                    recognition_ms = (time.perf_counter() - t_rec) * 1000
                    bbox = (x, y, x + fw, y + fh)
                else:
                    t_rec = time.perf_counter()
                    embedding, det_score, bbox = self.face_recognizer.get_embedding(frame_rgb)
                    recognition_ms = (time.perf_counter() - t_rec) * 1000

                if embedding is None:
                    frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                    self._metrics.record_frame(
                        frame_elapsed,
                        num_faces=1,
                        recognition_ms=recognition_ms,
                    )
                    self._metrics.maybe_report(cache_size=self.embedding_cache.count)
                    continue

                # Only update last_recognition_ts after we have actually run recognition
                last_recognition_ts = now_time

                t_match_start = time.perf_counter()
                match, confidence = self.embedding_cache.find_match(
                    embedding, self.config.MATCH_THRESHOLD
                )
                match_ms = (time.perf_counter() - t_match_start) * 1000
                frame_elapsed = (time.perf_counter() - t_frame_start) * 1000
                self._metrics.record_frame(
                    frame_elapsed,
                    num_faces=1,
                    matched=match is not None,
                    recognition_ms=recognition_ms,
                    match_ms=match_ms,
                )
                try:
                    import psutil

                    mem_mb = psutil.Process().memory_info().rss / (1024 * 1024)
                except Exception:
                    mem_mb = None
                self._metrics.maybe_report(
                    cache_size=self.embedding_cache.count, memory_mb=mem_mb
                )

                if match is None:
                    # Show temporary red box for unknown face
                    if bbox is not None:
                        with self._overlay_lock:
                            self._overlay = {
                                "bbox": bbox,
                                "label": "Unknown",
                                "color": (0, 0, 255),
                                "expires_at": time.time() + 1.5,
                            }
                    continue

                # Check Cooldown
                if (
                    match.user_id in self._last_recognized
                    and (time.time() - self._last_recognized[match.user_id])
                    < self.config.COOLDOWN_SECONDS
                ):
                    # Show cooldown overlay in yellow
                    if bbox is not None:
                        with self._overlay_lock:
                            self._overlay = {
                                "bbox": bbox,
                                "label": f"{match.name} (cooldown)",
                                "color": (0, 255, 255),
                                "expires_at": time.time() + 1.0,
                            }
                    continue

                if not self._is_user_in_class(match.user_id):
                    if match.user_id not in self._not_in_class_logged:
                        self.attendance_logger.log_attendance(
                            user_id=match.user_id,
                            class_id=active_class.class_id,
                            device_id=self.config.DEVICE_ID,
                            action=AttendanceAction.ENTRY,
                            verified_by=VerifiedBy.FACE,
                            confidence_score=confidence,
                            remarks=f"[NOT_IN_CLASS] {match.name}",
                        )
                        self._not_in_class_logged.add(match.user_id)
                    self._last_recognized[match.user_id] = time.time()
                    # Mark as not-in-class in red
                    if bbox is not None:
                        with self._overlay_lock:
                            self._overlay = {
                                "bbox": bbox,
                                "label": f"{match.name} (NOT IN CLASS)",
                                "color": (0, 0, 255),
                                "expires_at": time.time() + 2.0,
                            }
                    continue

                state = self._fetch_attendance_state(
                    match.user_id, active_class.class_id
                )
                allowed = state.get("allowed_actions", ["ENTRY"])

                if not allowed:
                    self._last_recognized[match.user_id] = time.time()
                    continue

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
                        tupm_id = getattr(match, "tupm_id", None)
                        self.add_checkin_event(match.name, "PRESENT")
                        cache_key = f"{match.user_id}_{active_class.class_id}"
                        self._user_attendance_state[cache_key] = {
                            "has_entered": True, "is_on_break": False,
                            "has_exited": False, "last_action": "ENTRY",
                            "allowed_actions": ["BREAK_OUT", "EXIT"],
                        }
                        if bbox is not None:
                            with self._overlay_lock:
                                self._overlay = {
                                    "bbox": bbox,
                                    "label": f"{match.name} - Welcome!",
                                    "color": (0, 255, 0),
                                    "expires_at": time.time() + 2.0,
                                }
                        self.broadcast_state({
                            "recognized_user": match.name,
                            "tupm_id": tupm_id,
                            "greeting_type": "welcome",
                            "required_gestures": [],
                            "message": "Welcome!",
                        })

                    self._last_recognized[match.user_id] = time.time()

                else:
                    # Requires gesture
                    pending_match = match
                    pending_confidence = confidence
                    pending_bbox = bbox
                    pending_allowed = allowed

                    expected_gestures = []
                    if "BREAK_OUT" in allowed:
                        expected_gestures.append("BREAK_OUT")
                    if "BREAK_IN" in allowed:
                        expected_gestures.append("BREAK_IN")
                    if "EXIT" in allowed:
                        expected_gestures.append("EXIT")

                    # Start gesture wait
                    self.gesture_detector.reset_buffer()
                    gesture_timeout_end = (
                        time.time() + self.config.GESTURE_TIMEOUT_SECONDS
                    )

              except Exception as _rec_err:
                  logger.exception("RECOGNITION | frame error (thread continues): %s", _rec_err)
                  time.sleep(1.0)

        # Start threads
        self._camera_thread = threading.Thread(target=camera_loop, daemon=True)
        self._recognition_thread = threading.Thread(target=recognition_loop, daemon=True)
        self._camera_thread.start()
        self._recognition_thread.start()

        # Block until shutdown requested
        try:
            while self.running:
                time.sleep(0.1)
        finally:
            self.running = False
            if self._camera_thread is not None:
                self._camera_thread.join(timeout=2)
            if self._recognition_thread is not None:
                self._recognition_thread.join(timeout=2)
            cap.release()
            self.face_detector.close()
            self.gesture_detector.close()

    def _update_mjepg(self, frame):
        global latest_frame_bytes
        ret, buffer = cv2.imencode('.jpg', frame)
        if ret:
            with frame_lock:
                latest_frame_bytes = buffer.tobytes()

kiosk_instance = None

@app.on_event("startup")
async def startup_event():
    global state_queue, loop, kiosk_instance, kiosk_thread
    loop = asyncio.get_event_loop()
    state_queue = asyncio.Queue()
    
    # Auto-export embeddings from database before starting kiosk
    # This ensures the cache is always in sync with the DB (no stale recognitions)
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cache_output = os.path.join(backend_dir, "rpi", "data", "embeddings_cache.json")
        
        # Import here to avoid circular imports at module level
        sys.path.insert(0, backend_dir)
        from scripts.export_embeddings import export_embeddings
        
        logger.info("CACHE | Auto-exporting embeddings from database before kiosk start...")
        success = export_embeddings(cache_output, verbose=False)
        if success:
            logger.info("CACHE | Embeddings export completed successfully")
        else:
            logger.warning("CACHE | Embeddings export returned failure — kiosk will use existing cache if available")
    except Exception as e:
        logger.warning("CACHE | Auto-export failed (DB may be unreachable): %s — using existing cache file", str(e))
    
    # Initialize kiosk logic
    config = KioskConfig()
    config.DEVICE_ID = int(os.getenv("DEVICE_ID", "1")) # Assuming local test DEVICE_ID 1
    
    kiosk_instance = StreamingAttendanceKiosk(config)
    kiosk_thread = threading.Thread(target=kiosk_instance.run, daemon=True)
    kiosk_thread.start()

    # Background broadcast task
    asyncio.create_task(broadcast_worker())

@app.on_event("shutdown")
def shutdown_event():
    global kiosk_instance
    if kiosk_instance:
        kiosk_instance.running = False
        kiosk_thread.join(timeout=2)

async def broadcast_worker():
    global state_queue
    while True:
        try:
            update = await state_queue.get()
            await manager.broadcast(update)
        except Exception as e:
            logger.error("WebSocket broadcast error: %s", str(e))

@app.websocket("/ws/status")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    if kiosk_instance:
        await websocket.send_json(kiosk_instance.current_state)
    try:
        while True:
            await websocket.receive_text() # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def video_generator():
    global latest_frame_bytes
    while True:
        with frame_lock:
            frame = latest_frame_bytes
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        await asyncio.sleep(0.03) # ~30fps max

@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(video_generator(), media_type="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    uvicorn.run("rpi.kiosk_server:app", host="0.0.0.0", port=8000, reload=False)
