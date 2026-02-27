# Recognition Pipeline Analysis & Improvement Plans

**Purpose:** Address pipeline slowness, lag, and lack of smoothness. Aligned with FRAMES rules: `codingRules`, `ENGINEERING_STANDARDS_FRAMES`, `FRAMES_DEPLOYMENT_CONSTRAINTS`, `FRAMES_OBSERVABILITY_RULES`, `FRAMES_TESTING_RULES`, `FRAMES_SECURITY_RULES`.

**Targets (from rules):**
- Frame processing: **< 100ms (laptop), < 250ms (RPi)**
- Face recognition inference: **> 200ms → WARNING**
- Embedding batch comparison: **> 50ms → WARNING**
- No DB/heavy work inside loops; preload and cache; batch comparisons.

---

## 1. Current Pipeline Summary

| Step | Where | What happens |
|------|--------|----------------|
| 1. Camera read | `cap.read()` | Blocking; typically fast |
| 2. Frame skip | `frame_count % RECOGNITION_FRAME_SKIP` | Laptop: every frame; RPi: every 5th |
| 3. Schedule | `schedule_resolver.get_active_class()` | In-memory; no per-frame DB |
| 4. Enrollment | `_fetch_class_enrollment()` | HTTP when class changes only ✅ |
| 5a. Gate (RPi) | `face_detector.get_largest_face(frame_rgb)` | MediaPipe BlazeFace (~20–40ms) |
| 5b. Recognition | `face_recognizer.get_embedding(frame_rgb)` | **InsightFace full frame** (~50–200ms) — main bottleneck |
| 6. Match | `embedding_cache.find_match(embedding)` | Numpy batch dot ✅ (fast) |
| 7. State/API | `_fetch_attendance_state()`, `log_attendance()` | **Synchronous HTTP** — can block 100–500ms+ |
| 8. Display/stream | `cv2.imshow` / `_update_mjpeg` | Same thread; blocked by above |

**Single-threaded:** Everything runs in one loop. When step 5b or 7 is slow, the whole pipeline (and video) stalls.

---

## 2. Root Causes of Slowness and Lag

### 2.1 Heavy work on the main thread (primary)

- **InsightFace `get_embedding(frame)`** runs detection + embedding on the **full frame** every processed frame. On RPi this can be 150–250ms+; on laptop 50–100ms. This dominates latency.
- **Gated mode** only skips InsightFace when MediaPipe finds *no* face. When a face *is* found, we still run InsightFace on the **full frame** (InsightFace does its own detection again). So we do **double detection** (MediaPipe + InsightFace) and still process a full-resolution image in InsightFace.
- **Synchronous HTTP:** `_fetch_attendance_state()` and `attendance_logger.log_attendance()` block the loop. If backend or network is slow, the camera freezes.

### 2.2 No visibility into where time goes

- There is **no per-step or per-frame timing** in the kiosk loop. We cannot see if the bottleneck is detection, embedding, match, or API.
- Observability rules require: frame processing time, face recognition inference time, embedding comparison time, and periodic metrics (avg/p95, FPS, memory). None of this is implemented in the pipeline.

### 2.3 Cache refresh not implemented

- `CACHE_REFRESH_MINUTES = 30` exists in config but is **never used**. Embeddings are loaded once at startup; no periodic refresh. Checklist item *"Implement periodic embedding cache refresh (every 30 min)"* is unchecked.

### 2.4 Redundant work and small inefficiencies

- **Color conversion:** Camera gives BGR → we convert to RGB for `process_frame` → inside `get_embedding` we convert back to BGR for InsightFace. Double conversion every processed frame.
- **Sleeps in loop:** On “no active class” or enrollment failure we `time.sleep(0.5)` or `time.sleep(2)`, which blocks the entire loop and increases perceived lag when schedule/enrollment is flaky.

### 2.5 Display/streaming tied to recognition

- Video update (`cv2.imshow` or `_update_mjpeg`) runs in the same thread after recognition. So any delay in recognition directly delays the next frame and makes the feed feel “not smooth.”

---

## 3. What Is Already Good (Compliance)

- **Embedding cache:** Loaded once at startup; batch comparison via `np.dot` (no Python loop over faces). ✅
- **Models:** Lazy-loaded once; not reloaded per frame. ✅
- **Frame skipping:** `RECOGNITION_FRAME_SKIP` reduces CPU (1 on laptop, 5 on RPi). ✅
- **No DB per face:** No database calls per detected face. ✅
- **Enrollment fetch:** Only on class change. ✅

---

## 4. Optimal Improvements (Prioritized)

### P0 — Must have (observability + rules compliance)

1. **Add per-step and per-frame timing**
   - In `main_kiosk.py` and `kiosk_server.py`: time (1) gate (if gated), (2) InsightFace `get_embedding`, (3) `find_match`, (4) full frame pipeline.
   - Log with `logger.debug` or `logger.info`; emit **WARNING** when:
     - Face recognition inference > 200ms (RPi) or > 100ms (laptop),
     - Frame processing > 250ms (RPi) or > 100ms (laptop).
   - Use `time.perf_counter()` and %-formatting (no f-strings in logs per observability rules).
   - **Deliverable:** See exactly which step dominates and by how much.

2. **Periodic metrics (FRAMES_OBSERVABILITY_RULES §5)**
   - Every 60s: report frame processing time (avg, p95), faces detected, match rate, camera FPS.
   - Every 5 min: cache size (embedding count), memory (RSS via psutil).
   - Log with a consistent prefix (e.g. `METRICS | ...`) and no sensitive data.

3. **Periodic embedding cache refresh**
   - Use `CACHE_REFRESH_MINUTES`: every N minutes (or on class change), reload embeddings from JSON (or backend) **outside** the hot path (e.g. after a recognition cycle or on a timer). Do not reload inside the per-frame loop.
   - Ensures checklist compliance and fresh data without adding per-frame cost.

### P1 — High impact (smoothness and latency)

4. **Offload API calls from the recognition thread**
   - **Option A:** Run `_fetch_attendance_state` and `log_attendance` in a **thread pool** (e.g. `concurrent.futures.ThreadPoolExecutor`). Main loop only submits work and checks result (non-blocking or short timeout). Prevents network latency from freezing the camera.
   - **Option B:** Keep a **local mirror** of attendance state per (user_id, class_id) and refresh in background; main loop reads local state and queues log requests for a worker thread. Reduces perceived lag when backend is slow.

5. **Gated mode: use crop for InsightFace when possible**
   - When `USE_GATED_DETECTION` is True: after MediaPipe returns a face bbox, **crop** the face (e.g. with `face_detector.crop_face()`), then call **`get_embedding_from_crop(crop)`** instead of `get_embedding(full_frame)`.
   - Effect: InsightFace runs on a small image (one face) instead of full frame; detection + embedding on crop is usually faster and avoids double full-frame detection.
   - Keep fallback to `get_embedding(frame_rgb)` if crop path fails or is disabled by config.

6. **Avoid redundant BGR↔RGB**
   - Either pass BGR from camera through to InsightFace (and only convert to RGB where MediaPipe needs it), or standardize on RGB and convert once at camera read. Removes one conversion per processed frame.

### P2 — Further gains (architecture)

7. **Separate camera/display from recognition**
   - **Producer–consumer:** One thread (or async) only reads camera and updates display/MJPEG at fixed FPS (e.g. 15–30). Another thread runs recognition on the **latest** frame (or every Nth frame) and updates state. Prevents slow recognition from directly blocking the video.
   - Requires thread-safe “latest frame” or a small queue; state (match, cooldown, etc.) updated from recognition thread.

8. **Tune frame skip and resolution**
   - On RPi: try `RECOGNITION_FRAME_SKIP = 3` or 4 if 5 is too sluggish; ensure `RECOGNITION_DET_SIZE = (320, 320)` (or smaller if accuracy allows).
   - Reduce camera resolution (e.g. 480x360) to lower cost of capture and any full-frame path.

9. **Reduce sleeps in main loop**
   - Replace `time.sleep(2)` on enrollment failure with “retry next iteration” and possibly exponential backoff logged once. For “no active class,” avoid long sleeps; e.g. short sleep (0.1s) or none, and log periodically instead of blocking.

---

## 5. Implementation Plan (Phased)

| Phase | Items | Outcome |
|-------|--------|--------|
| **Phase 1** | P0: Per-step timing, periodic metrics, cache refresh | Data to validate bottlenecks; rules-compliant observability; fresh embeddings. |
| **Phase 2** | P1: Non-blocking API (thread pool or queue), gated crop path, single color conversion | Smoother video, lower latency, less double work. |
| **Phase 3** | P2: Producer–consumer for camera vs recognition, frame skip/det_size tuning, reduce sleeps | Scalable design, better FPS and responsiveness. |

---

## 6. Files to Touch

- **`backend/rpi/config.py`** — Optional: `USE_CROP_IN_GATED_MODE` (default True for RPi).
- **`backend/rpi/main_kiosk.py`** — Timing, metrics, cache refresh; optional crop path and API offload.
- **`backend/rpi/kiosk_server.py`** — Same timing and metrics in the streaming loop; optional API offload.
- **`backend/rpi/face_recognizer.py`** — Optional: accept BGR to avoid extra conversion when called from a BGR path.
- **`backend/rpi/embedding_cache.py`** — Expose `load_from_json` / refresh so kiosk can call periodically (no change to `find_match`).
- **`rpi/RECOGNITION_PIPELINE_OPTIMIZATION_CHECKLIST.md`** — Update checkboxes as items are done.

---

## 7. References

- `rpi/RECOGNITION_PIPELINE_OPTIMIZATION_ANALYSIS.md`
- `rpi/RECOGNITION_PIPELINE_OPTIMIZATION_CHECKLIST.md`
- `.claude/rules/ENGINEERING_STANDARDS_FRAMES.md.instructions.md` (§5 Face Recognition, §12 Performance Targets)
- `.claude/rules/FRAMES_OBSERVABILITY_RULES.instructions.md` (§3 Performance Logging, §5 Kiosk Metrics)
- `.claude/rules/FRAMES_DEPLOYMENT_CONSTRAINTS.instructions.md`
- `.claude/rules/codingRules.instructions.md`

---

**Summary:** The pipeline is slow mainly because (1) InsightFace runs on the full frame every time (and in gated mode we still do double detection), (2) synchronous HTTP blocks the loop, and (3) there is no timing or metrics. Optimal path: add timing and metrics first (P0), then offload API and use crop in gated mode (P1), then consider producer–consumer and tuning (P2). All changes must keep preloaded embeddings, batch comparison, and no DB/heavy work per frame.
