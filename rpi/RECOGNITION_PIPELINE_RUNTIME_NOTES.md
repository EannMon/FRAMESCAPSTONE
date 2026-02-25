## FRAMES Recognition Runtime & Smoothness Notes

This document explains why the kiosk video feed could feel *laggy* and what changes were implemented to make it smoother, while still following the FRAMES performance and observability rules.

---

### 1. Root Causes Observed from Metrics

- **When backend was DOWN**:
  - Repeated `/api/kiosk/active-class` calls blocked each frame for ~4 seconds.
  - Metrics: `avg_ms≈4100ms`, `fps≈0.2`, `avg_faces=0`.
  - Effect: camera froze every few seconds even with no recognition.

- **When backend was UP and recognition active**:
  - InsightFace `buffalo_l` on CPU was the main bottleneck.
  - Warm-up: `recognition_avg_ms≈12_000ms`.
  - Steady state: `recognition_avg_ms≈800–1100ms`, `fps≈0.1–0.2`, `avg_faces=1.0`.
  - Effect: every frame with a face took ~1s to process; video felt frozen between recognitions.

Conclusion: **initially the active-class API caused stalls when offline; after fixing that, InsightFace CPU inference dominated runtime**.

---

### 2. Active-Class API Optimizations

Files:
- `backend/rpi/schedule_resolver.py`
- `backend/rpi/config.py`

Changes:

- **Config switches**:
  - `USE_ACTIVE_CLASS_API: bool`  
    - When `False`, `ScheduleResolver` never calls the backend and uses only the cached schedule.
  - `ACTIVE_CLASS_FAILURE_BACKOFF_SEC: int`  
    - After an API failure, skip further network calls for this many seconds and fall back to cache.

- **Backoff logic in `ScheduleResolver.get_active_class()`**:
  - Tracks `_last_api_failure`.
  - If the last failure is within the backoff window:
    - Logs a debug message and returns the cached result without touching the network.

Result:

- When the server is **not running**, the kiosk:
  - Tries the API once, records the failure, then relies on cache only.
  - Idle metrics show `avg_ms≈10–15ms`, `fps≈8–9` with no faces.
  - The camera feed stays smooth instead of freezing every few seconds.

---

### 3. Recognition Performance Tuning (Model & Gating)

Files:
- `backend/rpi/config.py`
- `backend/rpi/face_detector.py`
- `backend/rpi/face_recognizer.py`
- `backend/rpi/main_kiosk.py`
- `backend/rpi/kiosk_server.py`

Key adjustments:

- **Smaller detection size for InsightFace**:
  - Laptop default changed from `(640, 640)` to `(320, 320)`:
    - `RECOGNITION_DET_SIZE = (320, 320)` on laptop.

- **Gated detection ON even on laptop**:
  - `USE_GATED_DETECTION = True`:
    - MediaPipe first finds the largest face (fast).
    - We then **crop** around that face and call:
      - `FaceRecognizer.get_embedding_from_crop(face_crop_rgb)`  
      instead of running InsightFace on the full frame.

- **Frame skipping**:
  - On laptop: `RECOGNITION_FRAME_SKIP = 2`, so recognition runs on every 2nd frame, while the video still updates on all frames.

Result:

- InsightFace runs on a **small, cropped face region** rather than the full camera frame.
- Combined with a smaller `det_size` and frame skipping, this significantly reduces average recognition time per *attempt*.

---

### 4. Throttling Recognition Frequency (New Config)

Files:
- `backend/rpi/config.py`
- `backend/rpi/main_kiosk.py`
- `backend/rpi/kiosk_server.py`

New config field:

- `RECOGNITION_MIN_INTERVAL_SECONDS: float`
  - On **RPi**:
    - Defaults to `0.5` seconds (allow up to ~2 recognitions per second).
  - On **Laptop**:
    - Defaults to `0.7` seconds (cap to ≈1–1.5 recognitions per second).

Usage:

- **In `main_kiosk.py`**:
  - Adds `self._last_recognition_ts`.
  - Before calling `process_frame(...)`:
    - If `now - last_recognition_ts < RECOGNITION_MIN_INTERVAL_SECONDS`:
      - Just overlays class info, shows the current frame, records a lightweight metric, and **skips heavy recognition** for this loop iteration.
  - When recognition is actually run:
    - `self._last_recognition_ts` is updated.

- **In `kiosk_server.py` (streaming server)**:
  - Maintains `last_recognition_ts` inside the `StreamingAttendanceKiosk.run` loop.
  - After frame skipping but before heavy recognition:
    - If `now - last_recognition_ts < RECOGNITION_MIN_INTERVAL_SECONDS`:
      - Only updates MJPEG with the current frame and logs frame-time metrics.
      - Recognition (InsightFace) is **not** run for this frame.
  - When recognition does run successfully:
    - `last_recognition_ts` is set to `now`.

Effect:

- Even if many frames contain a face, **heavy InsightFace inference is capped**:
  - Laptop: at most ~1 recognition every 0.7 seconds.
  - RPi: at most ~2 recognitions per second (tunable).
- The camera/display loop keeps updating frames in between recognitions, improving perceived smoothness.

---

### 5. Metrics & How to Interpret Them

Metrics are emitted by `KioskMetricsCollector` and look like:

- `METRICS | frames=... avg_ms=... p95_ms=... avg_faces=... match_rate=... fps=... cache=...`
- `METRICS | recognition_avg_ms=...`
- `METRICS | match_avg_ms=...`

Interpretation:

- **Smoothness**:
  - `fps` close to camera FPS (e.g. `8–15` for laptop / RPi) → smooth video.
  - `avg_ms` and `p95_ms` should be well below the FRAMES budget:
    - Laptop target: `< 100ms`.
    - RPi target: `< 250ms`.
- **Recognition cost**:
  - `recognition_avg_ms` around:
    - `~1000ms` → very heavy (1 FPS recognition).
    - `< 300–400ms` → decent for RPi; excellent for laptop.
- **Matching**:
  - `match_avg_ms` is usually very small (`< 1–2ms`), since embedding comparison uses batched numpy dot products.

---

### 6. How to Tune for Your Machine

All the knobs live in `backend/rpi/config.py`:

- **If video is still laggy on laptop**:
  - Increase `RECOGNITION_MIN_INTERVAL_SECONDS` (e.g. `1.0` or `1.2`).
  - Increase `RECOGNITION_FRAME_SKIP` to `3`.
  - Optionally lower camera resolution:
    - `CAMERA_WIDTH = 480`, `CAMERA_HEIGHT = 360`.

- **If recognition feels too slow to react**:
  - Decrease `RECOGNITION_MIN_INTERVAL_SECONDS` slightly.
  - Decrease `RECOGNITION_FRAME_SKIP` (e.g. from `3` to `2`).

Trade-off:

- Higher recognition frequency → more CPU and lower FPS.
- Lower recognition frequency → smoother video but slower reaction to new faces.

---

### 7. Summary of Improvements

- **Active-class API** is now:
  - Optional (`USE_ACTIVE_CLASS_API`).
  - Backed off after failures to avoid blocking the main loop.
- **Recognition** is:
  - Running on smaller crops via MediaPipe gating.
  - Using smaller detection size (`(320, 320)` on laptop).
  - Throttled via `RECOGNITION_MIN_INTERVAL_SECONDS` and `RECOGNITION_FRAME_SKIP`.
- **Video Smoothness**:
  - Camera/display continues running at a higher FPS even when recognition and backend work are heavy.
  - Metrics confirm the impact and help you tune further per device.

