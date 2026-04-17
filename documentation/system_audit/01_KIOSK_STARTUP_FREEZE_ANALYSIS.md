# Kiosk Startup Freeze Analysis

## Issue Reported
After boot, the kiosk takes 2-5 minutes to initialize, then the camera feed shows **one frozen frame** — the clock continues but the video and schedule status do not update. A restart resolves it.

---

## Root Cause Analysis

### Why Initialization Takes 2-5 Minutes

The startup sequence in `kiosk_server.py` → `startup_event()` performs these **blocking** operations sequentially on a single thread:

1. **Embedding export/download** (`export_embeddings()`) — If using API mode (RPi pointing at remote backend), this downloads ALL enrolled face embeddings over the network. With slow internet or many users, this alone can take 30s-2min.
2. **InsightFace model loading** (`FaceRecognizer.__init__` → lazy but triggered on first frame) — Loading `buffalo_sc` ONNX model into memory takes ~10-30s on RPi4.
3. **MediaPipe loading** (FaceDetector + GestureDetector) — Another 5-10s.
4. **Schedule sync** (`schedule_resolver.sync_schedule()`) — Network call.
5. **Offline queue flush** — Network calls for each queued record.

**Total on RPi with slow network: 2-5 minutes is expected.**

### Why the Frame Freezes After Initialization

**Root cause: Thread startup race condition in `kiosk_server.py`**

```
startup_event()
  → kiosk_instance = StreamingAttendanceKiosk(config)  # Loads models
  → kiosk_thread = threading.Thread(target=kiosk_instance.run)
  → kiosk_thread.start()
    → run() starts camera_loop() and recognition_loop() as daemon threads
```

The **camera_loop** thread reads frames and pushes JPEG bytes to `latest_frame_bytes`. The **recognition_loop** reads `self._latest_frame` and does heavy processing.

**The freeze happens because:**

1. `camera_loop()` starts reading frames and encoding them to MJPEG.
2. On the **very first frame**, `recognition_loop()` triggers InsightFace lazy initialization (`self.initialize()` inside `get_embedding` or `get_embedding_from_crop`). This blocks the recognition thread for **10-30 seconds** while the ONNX model loads.
3. During this time, `camera_loop` continues reading frames, BUT: the MJPEG stream (`latest_frame_bytes`) IS being updated — however, the `recognition_loop` is stuck, so:
   - `self._latest_frame` gets overwritten every camera frame (not a problem)
   - The **overlay** (`self._overlay`) never gets updated (recognition thread is blocked)
   - `broadcast_state()` never gets called (recognition thread is blocked)
4. The **WebSocket state** sent to the React UI stays frozen at the initial state.
5. On the MJPEG stream side, frames ARE flowing — but since the React UI likely uses the WebSocket state to determine what to display, the UI appears frozen.

**Why restart fixes it:** On restart, if the InsightFace model is already cached in the OS page cache (RAM), loading is near-instant. The recognition thread starts immediately and begins broadcasting state updates.

### Additional Contributing Factor: `time.sleep(0.01)` in camera_loop

The camera loop has no error recovery. If `cap.read()` returns `False` (camera momentarily unavailable), it just sleeps 10ms and retries — but never logs the failure or attempts reconnection.

---

## Evidence From Code

### `kiosk_server.py` lines ~86-94 — StreamingAttendanceKiosk.__init__
```python
self.face_detector = FaceDetector(...)      # MediaPipe init (5-10s)
self.face_recognizer = FaceRecognizer(...)  # Lazy — but allocated
self.gesture_detector = GestureDetector(...)# MediaPipe Hands init (5-10s)
```

### `face_recognizer.py` lines 90-93 — Lazy initialization
```python
def initialize(self):
    if not self._initialized:
        self.analyzer = get_face_analyzer(...)  # 10-30s on RPi first run
        self._initialized = True
```

### `kiosk_server.py` camera_loop — No reconnection
```python
def camera_loop():
    while self.running:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.01)  # Just retries forever, no recovery
            continue
```

---

## Recommended Fixes

### Fix 1: Pre-warm InsightFace Before Starting Threads (HIGH PRIORITY)
Add a dummy inference call during initialization, BEFORE threads start:

```python
# In StreamingAttendanceKiosk.__init__ or run(), before starting threads:
logger.info("Pre-warming InsightFace model...")
dummy = np.zeros((112, 112, 3), dtype=np.uint8)
self.face_recognizer.initialize()  # Force load now
```

This makes the 10-30s model load happen during the "Initializing..." phase rather than after the UI has already shown a frame.

### Fix 2: Broadcast "Initializing" State While Recognition Thread Warms Up
Before the recognition loop starts heavy processing, broadcast a clear status:

```python
def recognition_loop():
    # Force model initialization before entering main loop
    logger.info("RECOGNITION | Pre-loading models...")
    self.broadcast_state({"status": "initializing", "message": "Loading AI models..."})
    self.face_recognizer.initialize()
    self.broadcast_state({"status": "ready", "message": "System ready"})
    # ... now enter normal loop
```

### Fix 3: Camera Thread Resilience (see `03_CAMERA_RECONNECTION_ANALYSIS.md`)

---

## Impact
- **Severity:** Medium (workaround: restart)
- **Frequency:** Every cold boot
- **Affected:** Both `main_kiosk.py` (cv2 mode) and `kiosk_server.py` (streaming mode)
