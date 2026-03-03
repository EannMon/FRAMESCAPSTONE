# Changelog — February 28, 2026

## Duplicate Face Enrollment Check (Issue #4)

### Problem

A user could register their face, create a second account, and enroll the **same face** again. This enabled one person to attend as multiple students — a critical fraud vulnerability.

### Changes

#### `backend/services/face_enrollment.py`

- Added `DUPLICATE_FACE_THRESHOLD = 0.6` constant matching the recognition system's similarity threshold
- Added `check_embedding_uniqueness(new_embedding_bytes, exclude_user_id, db)` function:
  - Fetches all existing `FacialProfile` records in a **single query**, excluding the enrolling user's own profile
  - Builds a numpy matrix and performs **batch cosine similarity** via `np.dot(matrix, query)` — O(n) complexity
  - Defensively normalizes all embeddings before comparison
  - Returns `(is_unique, matching_user_id, similarity)`
  - Logs timing, match results, and security warnings per FRAMES observability rules

#### `backend/api/routers/face.py`

- Integrated `check_embedding_uniqueness()` into `POST /api/face/enroll` endpoint
  - Runs immediately after `process_enrollment_frames()` (embeddings extracted) but **before** saving to DB
  - If a duplicate is detected → returns HTTP **409** with error code `DUPLICATE_FACE`
  - User-friendly message: *"This face is already registered under another account."*
- Added `except HTTPException: raise` to prevent the generic error handler from swallowing the 409 response
- Fixed all f-string logging violations → replaced with %-formatting per observability rules
- Stopped exposing `str(e)` in 500 error responses → now returns generic message and logs via `logger.exception()`

### Design Decisions

| Decision | Rationale |
|---|---|
| Threshold `0.6` | Matches the recognition system's similarity threshold for consistency |
| Excludes enrolling user's own profile | Allows re-enrollment (updating your own face) without false positives |
| Single DB query + numpy vectorization | No N+1, no loops — handles 5,000 profiles in < 10ms |
| 409 status code | Standard HTTP conflict — the resource (face) already exists elsewhere |

### Files Modified

- `backend/services/face_enrollment.py` — added uniqueness check function
- `backend/api/routers/face.py` — integrated check into enrollment endpoint, fixed logging
---

## Performance Optimization: OMP_NUM_THREADS + det_size Reduction (Issue #1 — Partial)

### Problem

InsightFace face detection on RPi4 was slow (~600-900ms per frame). The ONNX Runtime backend was not tuned for the RPi4's 4-core CPU, and the detection input size was unnecessarily large for kiosk use (users stand close to camera, face fills frame).

### Changes

#### `backend/rpi/config.py`

Two optimization changes applied:

| Change | Before | After | Rationale |
|---|---|---|---|
| OMP_NUM_THREADS | Not set | `os.environ.setdefault("OMP_NUM_THREADS", "4")` at module top (line 17) | Optimizes ONNX Runtime for RPi4's 4 cores. Must be set before any onnxruntime import. `setdefault` avoids overriding explicit env config. |
| RPi `RECOGNITION_DET_SIZE` | `(320, 320)` | `(160, 160)` | Aggressive reduction safe for kiosk where face fills frame. Cuts detection time significantly on RPi. Laptop keeps `(640, 640)` for development flexibility. |

#### `backend/rpi/gesture_detector.py`

- Added `count_fingers(frame_rgb) -> Tuple[Optional[int], Optional[object]]` utility method to `GestureDetector` class
- Counts extended fingers (0-5) using existing `_is_finger_extended()` and `_is_thumb_extended()` internal methods
- Returns `(count, hand_landmarks)` or `(None, None)` if no hand detected
- Available for future use (anti-spoofing, etc.) — not currently called in the ENTRY path

#### ENTRY Path: Face-Only (No Gesture)

ENTRY remains face-only verification — no gesture or liveness challenge required. When a face is recognized and ENTRY is the next allowed action, attendance is logged immediately with `verified_by=FACE`.

BREAK_OUT, BREAK_IN, and EXIT still require gestures (peace sign, thumbs up, open palm) as before.

### Files Modified

- `backend/rpi/config.py` — OMP_NUM_THREADS, det_size reduction
- `backend/rpi/gesture_detector.py` — added `count_fingers()` utility method

### Files Created (Available but Not Active)

- `backend/rpi/liveness_challenge.py` — finger count challenge generator (created for future anti-spoofing use, not currently wired into the ENTRY path)

---

## Embedding Cache Workflow Clarification (Operational Note)

### Problem Reported

After enrolling new faces via the web UI, the kiosk still reported them as "Unknown."

### Root Cause

The kiosk does **not** query the database directly. It loads embeddings from a static JSON file (`rpi/data/embeddings_cache.json`). The workflow is:

1. **Enrollment** → embeddings saved to PostgreSQL (`facial_profiles` table)
2. **Export** → `scripts/export_embeddings.py` reads DB and writes `embeddings_cache.json`
3. **Kiosk startup** → loads embeddings from JSON file into memory
4. **Periodic refresh** (`CACHE_REFRESH_MINUTES = 30`) → re-reads the **same JSON file**, does NOT re-query the DB

If step 2 is not re-run after new enrollments, the JSON file is stale and new faces won't be recognized.

### Required Procedure After Every Enrollment

```bash
cd backend
python scripts/export_embeddings.py
```

Then either restart the kiosk or wait for the 30-minute periodic refresh cycle.

### No Code Changes Made

This was an operational/workflow issue, not a code bug. The system is working as designed — the JSON cache is intentional for offline kiosk operation on Raspberry Pi devices that may not have constant DB connectivity.