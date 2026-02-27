# FRAMES — Comprehensive Process & Feature Audit

**Version:** 1.0  
**Date:** 2025-06-26  
**Scope:** Every process, feature, and functionality across Backend, Frontend, and RPi Kiosk  
**Audit Criteria:** FRAMES Deployment Constraints, Engineering Standards, Coding Rules

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Backend API Processes](#2-backend-api-processes)
3. [Backend Services](#3-backend-services)
4. [RPi Kiosk Processes](#4-rpi-kiosk-processes)
5. [Frontend Processes](#5-frontend-processes)
6. [Cross-Cutting Concerns & Optimization Audit](#6-cross-cutting-concerns--optimization-audit)
7. [Violation Summary Matrix](#7-violation-summary-matrix)
8. [Priority Remediation Plan](#8-priority-remediation-plan)

---

## 1. Executive Summary

FRAMES (Face Recognition & Attendance Monitoring for Educational Systems) is a three-tier system:

| Tier | Technology | Files Audited |
|------|-----------|---------------|
| Backend API | FastAPI + SQLAlchemy + PostgreSQL (Aiven) | 8 routers, 4 services, 14 models |
| Frontend | React + Vite + Axios | 37 components across 7 modules |
| RPi Kiosk | InsightFace + MediaPipe + OpenCV | 9 files (camera, detector, recognizer, gestures, cache, schedule, logger) |

### Key Metrics

| Metric | Count |
|--------|-------|
| Total API Endpoints | 35 |
| Total Frontend Pages/Components | 37 |
| RPi Kiosk Modules | 9 |
| Backend Services | 4 |
| **Critical Violations Found** | **28** |
| **Warnings Found** | **19** |

---

## 2. Backend API Processes

### 2.1 Authentication Router — `backend/api/routers/auth.py` (135 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 1 | `/api/auth/login` | POST | Authenticates user by email OR TUPM-ID with bcrypt password verification. Sets `last_login` timestamp. Returns user object. |
| 2 | `/api/auth/register` | POST | Creates new user (Faculty/Dept Head only). Hashes password with bcrypt. Default verification status: PENDING. |
| 3 | `/api/auth/validate-face` | POST | Placeholder — returns `{"message": "Not implemented"}`. |

**Location:** `backend/api/routers/auth.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ✅ Pass | Single `db.query(User)` per login/register |
| Pagination | N/A | Not a list endpoint |
| Error Handling | ⚠️ Warn | Returns raw `HTTPException(detail=str)`, no structured error codes |
| Auth Protection | ⚠️ Warn | No JWT — login returns user object, no token |
| Rate Limiting | ❌ Fail | No rate limiting on login (brute force risk) |
| `print()` Usage | ❌ Fail | Uses `print()` for debug logging |
| Input Validation | ⚠️ Warn | Uses Pydantic schema for register, but login accepts raw dict |

---

### 2.2 Admin Router — `backend/api/routers/admin.py` (97 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 4 | `/api/admin/verification/list` | GET | Lists users by verification_status filter (PENDING/VERIFIED/REJECTED/all) |
| 5 | `/api/admin/verification/approve/{user_id}` | PUT | Sets user verification_status → VERIFIED |
| 6 | `/api/admin/verification/reject/{user_id}` | PUT | Sets user verification_status → REJECTED |
| 7 | `/api/admin/users/{user_id}` | DELETE | Hard-deletes user and all related records |

**Location:** `backend/api/routers/admin.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ✅ Pass | Single queries per endpoint |
| Pagination | ❌ Fail | `/verification/list` returns ALL matching users, no skip/limit |
| Error Handling | ⚠️ Warn | Returns raw `HTTPException(detail=str)` |
| Auth Protection | ❌ Fail | No authentication — anyone can approve/reject/delete users |
| Cascade Delete | ⚠️ Warn | Hard delete — cascades not explicitly verified for all FK relationships |

---

### 2.3 Faculty Router — `backend/api/routers/faculty.py` (666 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 8 | `/api/faculty/schedule/{user_id}` | GET | Returns all classes for a faculty with subject info, enrollment count, and attendance stats |
| 9 | `/api/faculty/dashboard-stats/{user_id}` | GET | Dashboard stats: total classes, total students, today's attendance %, recent attendance logs |
| 10 | `/api/faculty/subjects` | POST | Creates new subject (used by dept head management page) |
| 11 | `/api/faculty/class/{class_id}` | GET | Class detail with enrolled students and attendance records |
| 12 | `/api/faculty/upload-history` | GET | Returns past schedule uploads (not fully implemented) |
| 13 | `/api/faculty/upload-schedule` | POST | Parses uploaded PDF (COR/schedule), creates subjects/classes/enrollments in DB |
| 14 | `/api/faculty/class-details/{schedule_id}` | GET | Detailed class info with full student list and individual attendance |
| 15 | `/api/faculty/session-exceptions` | POST | Creates a session exception (cancelled/makeup/room_change) |
| 16 | `/api/faculty/session-exceptions/{exception_id}` | PUT | Updates an existing session exception |
| 17 | `/api/faculty/session-exceptions/{exception_id}` | DELETE | Deletes a session exception |
| 18 | `/api/faculty/session-exceptions-by-faculty/{faculty_id}` | GET | Lists all session exceptions for a faculty |
| 19 | `/api/faculty/class/{class_id}/late-threshold` | GET | Gets late threshold minutes for a class |
| 20 | `/api/faculty/class/{class_id}/late-threshold` | PUT | Sets late threshold minutes for a class |

**Location:** `backend/api/routers/faculty.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ❌ **FAIL** | **`/schedule/{user_id}`**: Queries `Subject`, `Enrollment.count()`, `AttendanceLog.count()` INSIDE a `for cls in classes` loop — classic N+1 (1 + 3N queries) |
| N+1 Queries | ❌ **FAIL** | **`/dashboard-stats/{user_id}`**: Same pattern — loops over classes to count students and attendance |
| N+1 Queries | ❌ **FAIL** | **`/class-details/{schedule_id}`**: Queries attendance per student inside loop |
| Pagination | ❌ Fail | `/session-exceptions-by-faculty` returns all, no pagination |
| Error Handling | ⚠️ Warn | Some endpoints expose `str(e)` in responses |
| Auth Protection | ❌ Fail | User ID from URL path — no JWT, any user can access any faculty's data |
| `print()` Usage | ❌ Fail | Multiple `print()` statements throughout |
| Service Layer | ❌ Fail | All business logic and queries are inline in router — no service extraction |
| Upload Processing | ⚠️ Warn | PDF parsing is synchronous — blocks the request thread |

---

### 2.4 Student Router — `backend/api/routers/student.py` (262 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 21 | `/api/student/live-status/{user_id}` | GET | Returns current class status (active class, attendance state, next class) |
| 22 | `/api/student/dashboard/{user_id}` | GET | Dashboard data: today's schedule, attendance stats, recent logs |
| 23 | `/api/student/schedule/{user_id}` | GET | Full weekly schedule with subject details |
| 24 | `/api/student/history/{user_id}` | GET | Paginated attendance history with skip/limit |

**Location:** `backend/api/routers/student.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ✅ Pass | Uses `joinedload()` and `selectinload()` for eager loading |
| Pagination | ✅ Pass | `/history` has skip/limit with sensible defaults (skip=0, limit=50) |
| Error Handling | ⚠️ Warn | Catches exceptions but returns `str(e)` in some cases |
| Auth Protection | ❌ Fail | User ID from URL path — no JWT |
| `print()` Usage | ⚠️ Warn | Some debug prints present |
| Service Layer | ⚠️ Warn | Some logic inline, but queries are well-structured |

**Note:** Student router is the **best-optimized** backend router. Uses eager loading correctly.

---

### 2.5 Users Router — `backend/api/routers/users.py` (126 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 25 | `/api/users/{user_id}` | GET | Returns user profile with department/program names |
| 26 | `/api/users/{user_id}` | PUT | Updates user profile fields |
| 27 | `/api/users/verify-password` | POST | Verifies current password (for change-password flow) |
| 28 | `/api/users/change-password` | POST | Changes password (requires old password verification) |

**Location:** `backend/api/routers/users.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ✅ Pass | Single queries per endpoint |
| Auth Protection | ❌ Fail | User ID from URL — no JWT |
| Password Security | ✅ Pass | Uses bcrypt for hashing, verifies old password before change |

---

### 2.6 Face Enrollment Router — `backend/api/routers/face.py` (153 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 29 | `/api/face/enroll` | POST | Accepts 7-15 base64 face images, extracts embeddings via InsightFace, averages best frames, stores in `facial_profiles` table |
| 30 | `/api/face/status/{user_id}` | GET | Returns face enrollment status (enrolled, frame_count, quality, timestamp) |

**Location:** `backend/api/routers/face.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ✅ Pass | Single DB operations |
| Error Handling | ✅ Pass | Proper try/except with logging |
| Rate Limiting | ❌ Fail | No rate limit on enrollment (heavy InsightFace processing per request) |
| Service Layer | ✅ Pass | Delegates to `face_enrollment` service |
| Memory | ⚠️ Warn | InsightFace buffalo_l model (~600MB) loaded lazily but stays in memory |

---

### 2.7 Kiosk Router — `backend/api/routers/kiosk.py` (621 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 31 | `/api/kiosk/active-class` | GET | Resolves currently active class for a device based on room + day + time |
| 32 | `/api/kiosk/schedule` | GET | Returns full weekly schedule for a device's room |
| 33 | `/api/kiosk/attendance/log` | POST | Logs attendance action (ENTRY/BREAK_OUT/BREAK_IN/EXIT) with state machine validation, duplicate guard, late calculation |
| 34 | `/api/kiosk/class/{class_id}/enrolled` | GET | Returns enrolled students and faculty for a class |
| 35 | `/api/kiosk/attendance-state` | GET | Returns current attendance state for a user in a class today |
| 36 | `/api/kiosk/device/{device_id}` | GET | Returns device info (room, capacity, etc.) |
| 37 | `/api/kiosk/device/heartbeat` | POST | Records device heartbeat with system metrics |
| 38 | `/api/kiosk/late-threshold/{class_id}` | GET | Returns late threshold minutes for a class |

**Location:** `backend/api/routers/kiosk.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ⚠️ Mixed | `active-class` uses JOINs properly. `/enrolled` is well-structured. But some fallback paths in `attendance/log` have suboptimal patterns. |
| Pagination | N/A | Most endpoints return single/small results |
| Attendance State Machine | ✅ Pass | Correctly enforces ENTRY→BREAK_OUT→BREAK_IN→EXIT with allowed_actions validation |
| Duplicate Guard | ✅ Pass | Checks for same action within 30-second window |
| Late Calculation | ✅ Pass | Compares entry timestamp against class start_time + late_threshold_minutes |
| Auth Protection | ❌ Fail | No authentication — kiosk endpoints are completely open |
| Rate Limiting | ❌ Fail | No rate limit on attendance logging |
| Service Layer | ❌ Fail | All business logic inline in router |
| `print()` Usage | ❌ Fail | Multiple print statements |

---

### 2.8 Department Router — `backend/api/routers/dept.py` (179 lines)

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 39 | `/api/dept/management-data` | GET | Returns subjects, classes, faculty, rooms for a department |
| 40 | `/api/dept/create-subject` | POST | Creates new subject for a department |
| 41 | `/api/dept/assign-faculty` | POST | Assigns faculty to a class |
| 42 | `/api/dept/assign-room` | POST | Assigns room to a class |

**Location:** `backend/api/routers/dept.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ⚠️ Warn | `/management-data` runs 4 separate queries (subjects, classes, faculty, rooms) — could be consolidated |
| Auth Protection | ❌ Fail | No authentication |
| Service Layer | ❌ Fail | All logic inline |

---

## 3. Backend Services

### 3.1 Face Enrollment Service — `backend/services/face_enrollment.py` (143 lines)

**What It Does:**
- Loads InsightFace `buffalo_l` model (lazy singleton via `get_face_analyzer()`)
- Decodes base64 images → OpenCV BGR frames
- Extracts 512-dimensional face embeddings
- Multi-frame enrollment: processes 7-15 images, selects top 70% by quality, averages embeddings
- Quality scoring based on detection confidence

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `get_face_analyzer()` | Lazy-loads InsightFace buffalo_l with CPUExecutionProvider |
| `decode_base64_image(b64)` | Converts base64 string → OpenCV BGR ndarray |
| `extract_embedding(image)` | Gets 512-d embedding from single image |
| `process_enrollment_frames(frames[])` | Processes multiple images, averages best embeddings |
| `compare_embeddings(emb1, emb2)` | Cosine similarity between two embeddings |

**Location:** `backend/services/face_enrollment.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Model Loading | ✅ Pass | Lazy singleton — loaded once, reused |
| Memory | ⚠️ Warn | buffalo_l uses ~600MB RAM, stays in process memory permanently |
| Batch Processing | ✅ Pass | Processes all frames, filters top 70%, averages |
| Error Handling | ✅ Pass | Proper try/except with logging |

---

### 3.2 PDF Parser Service — `backend/services/pdf_parser.py` (196 lines)

**What It Does:**
- Parses Certificate of Registration (COR) PDFs using `pdfplumber`
- Extracts: student name, student number, program, section
- Parses schedule table: subject code, subject title, section, day, time slot, room
- Cleans section strings (removes trailing `A-Z` for non-lab sections)

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `clean_section(section)` | Normalizes section identifiers |
| `parse_time_slot(time_str)` | Parses "HH:MM-HH:MM" → (start_time, end_time) |
| `parse_schedule_pdf(file)` | Main entry: reads PDF → returns structured schedule data |

**Location:** `backend/services/pdf_parser.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| File Validation | ⚠️ Warn | No file size limit enforced (should cap at 10MB) |
| Error Handling | ✅ Pass | Wrapped in try/except |
| Processing | ⚠️ Warn | Synchronous — blocks request thread during parsing |

---

### 3.3 Gesture Detection Service — `backend/services/gesture_detection.py` (296 lines)

**What It Does:**
- Uses MediaPipe HandLandmarker Tasks API for hand detection
- Detects three gestures: OK_SIGN (👌), OPEN_PALM (🖐️), THUMBS_UP (👍)
- Finger state detection using landmark Y-coordinates
- Provides base64 image → gesture classification pipeline

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `get_hands_detector()` | Lazy-loads MediaPipe hand detection model |
| `get_finger_states(landmarks)` | Returns dict of {finger: extended/curled} |
| `is_ok_sign(landmarks)` | Detects OK gesture with confidence |
| `is_open_palm(landmarks)` | Detects open palm with confidence |
| `is_thumbs_up(landmarks)` | Detects thumbs up with confidence |
| `classify_gesture(landmarks)` | Classifies best gesture from all three |
| `detect_gesture(image)` | Full pipeline: image → hand detect → classify |
| `validate_gesture_for_action(b64, action)` | Validates gesture matches expected attendance action |

**Location:** `backend/services/gesture_detection.py`

**Note:** This service is the **server-side** gesture detection (used for API-based validation). The RPi kiosk has its own separate gesture_detector.py that runs locally.

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Model Loading | ✅ Pass | Lazy singleton |
| Confidence Threshold | ✅ Pass | Uses configurable GESTURE_CONFIDENCE_THRESHOLD |
| Error Handling | ✅ Pass | Returns structured error responses |

---

### 3.4 Gesture Constants — `backend/services/gesture_constants.py` (37 lines)

**What It Does:**
- Defines `GestureType` enum: OK_SIGN, OPEN_PALM, THUMBS_UP, UNKNOWN
- Maps gestures → attendance actions (GESTURE_ACTION_MAP)
- Maps actions → expected gestures (ACTION_GESTURE_MAP)
- Defines gesture descriptions and confidence threshold (0.5)

**Location:** `backend/services/gesture_constants.py`

---

## 4. RPi Kiosk Processes

### 4.1 Main Kiosk Application — `backend/rpi/main_kiosk.py` (646 lines)

**What It Does:**
Runs the full real-time attendance loop on Raspberry Pi or laptop:

1. **Initialization:** Loads all modules (camera, face detector, face recognizer, gesture detector, embedding cache, schedule resolver, attendance logger)
2. **Main Loop:**
   - Reads camera frame
   - Skips frames per `RECOGNITION_FRAME_SKIP` setting
   - Resolves active class from schedule
   - Fetches enrollment when class changes
   - Runs face detection → recognition → embedding matching
   - **State Machine per user:**
     - Not entered → ENTRY (face only, no gesture needed)
     - Already entered → Prompt gesture:
       - ✌️ Peace Sign → BREAK_OUT
       - 👍 Thumbs Up → BREAK_IN
       - 🖐️ Open Palm → EXIT
   - Logs attendance via API (with offline fallback)
3. **Cleanup:** Releases camera, closes detectors, flushes offline queue

**Key Classes:** `AttendanceKiosk`

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `__init__()` | Loads all models and initializes state |
| `_fetch_class_enrollment(class_id)` | API call to get enrolled students for class |
| `_fetch_attendance_state(user_id, class_id)` | API call to get current attendance state |
| `_is_user_in_class(user_id)` | Checks enrollment + faculty match |
| `process_frame(frame)` | Face detection → recognition → matching pipeline |
| `check_gesture(cap, timeout)` | Waits for gesture within timeout period |
| `is_on_cooldown(user_id)` | Prevents duplicate recognition within cooldown |
| `run()` | Main loop with full state machine |

**Location:** `backend/rpi/main_kiosk.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Frame Processing Budget | ✅ Pass | Configurable frame skip (5 on RPi, 1 on laptop) |
| State Machine | ✅ Pass | Correct ENTRY→BREAK_OUT→BREAK_IN→EXIT flow |
| Enrollment Caching | ✅ Pass | Fetches once per class change, caches locally |
| Attendance State Caching | ✅ Pass | Cached per user_id_classId, refreshed from API |
| Cooldown | ✅ Pass | Prevents duplicate scans within configurable seconds |
| Not-In-Class Handling | ✅ Pass | Logs once, then skips duplicate notifications |
| SIGTERM Handler | ❌ Fail | **Missing** — no `signal.signal(SIGTERM)` for systemd |
| Periodic Cache Refresh | ❌ Fail | **Missing** — embeddings only loaded at startup, never refreshed |
| Offline Mode Display | ⚠️ Warn | Offline is handled by attendance_logger, but no visual "OFFLINE" indicator on screen |
| Graceful Shutdown | ⚠️ Warn | Handles KeyboardInterrupt but not SIGTERM |

---

### 4.2 Kiosk Config — `backend/rpi/config.py` (145 lines)

**What It Does:**
- Auto-detects platform (RPi vs laptop via `platform.machine()` + `/proc/device-tree`)
- Dataclass-based configuration with platform-specific defaults
- RPi: 320×320 det_size, gated detection ON, frame skip 5, PiCamera2
- Laptop: 640×640 det_size, gated detection OFF, frame skip 1, OpenCV

**Key Settings:**

| Setting | RPi Default | Laptop Default |
|---------|-------------|----------------|
| `RECOGNITION_DET_SIZE` | (320, 320) | (640, 640) |
| `USE_GATED_DETECTION` | True | False |
| `RECOGNITION_FRAME_SKIP` | 5 | 1 |
| `CAMERA_WIDTH × HEIGHT` | 480 × 360 | 640 × 480 |
| `MATCH_THRESHOLD` | 0.35 | 0.35 |
| `COOLDOWN_SECONDS` | 10 | 10 |

**Location:** `backend/rpi/config.py`

---

### 4.3 Face Recognizer — `backend/rpi/face_recognizer.py` (128 lines)

**What It Does:**
- Extracts 512-d face embeddings using InsightFace
- Lazy-loads model (singleton pattern)
- Selects largest face when multiple detected
- Provides cosine similarity comparison

**Critical Note:** Model name defaults to `buffalo_sc` in the class constructor but the global function uses `buffalo_l`. The `main_kiosk.py` explicitly passes `buffalo_l` from config. This mismatch could cause bugs if FaceRecognizer is used without config.

**Location:** `backend/rpi/face_recognizer.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Model Consistency | ⚠️ Warn | Default param is `buffalo_sc` but enrollment uses `buffalo_l` — embedding spaces WILL NOT MATCH if default is accidentally used |
| Lazy Loading | ✅ Pass | Singleton model loading |
| Memory | Acceptable | ~600MB for buffalo_l, within RPi budget |

---

### 4.4 Face Detector — `backend/rpi/face_detector.py` (107 lines)

**What It Does:**
- MediaPipe BlazeFace for fast face localization
- Used as "gate" in RPi mode: only runs InsightFace when a face is detected
- Returns bounding boxes with confidence scores
- Face cropping with configurable margin

**Location:** `backend/rpi/face_detector.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Performance | ✅ Pass | MediaPipe BlazeFace is lightweight (~5ms per frame) |
| Resource Cleanup | ✅ Pass | Has `close()` method |

---

### 4.5 Gesture Detector — `backend/rpi/gesture_detector.py` (236 lines)

**What It Does:**
- MediaPipe Hands for real-time gesture recognition on kiosk
- Detects: PEACE_SIGN (✌️), THUMBS_UP (👍), OPEN_PALM (🖐️)
- **Distance-based** finger extension (angle-invariant, works at any hand orientation)
- **Temporal smoothing**: requires N consecutive frames of same gesture (default: 3)
- Handedness-aware thumb detection

**Key Difference from Server-Side:**
- Server (`gesture_detection.py`): Uses HandLandmarker Tasks API, Y-coordinate comparisons
- RPi (`gesture_detector.py`): Uses MediaPipe Hands legacy API, distance-ratio comparisons, temporal buffer

**Gesture Mapping for Kiosk:**

| Gesture | Attendance Action |
|---------|------------------|
| ✌️ Peace Sign | BREAK_OUT |
| 👍 Thumbs Up | BREAK_IN |
| 🖐️ Open Palm | EXIT |
| (face only) | ENTRY |

**Location:** `backend/rpi/gesture_detector.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Temporal Smoothing | ✅ Pass | Prevents false positives with consecutive frame requirement |
| Distance-Based Detection | ✅ Pass | Angle-invariant, more robust than Y-coordinate comparison |
| Resource Cleanup | ✅ Pass | Has `close()` method |

---

### 4.6 Camera Abstraction — `backend/rpi/camera.py` (171 lines)

**What It Does:**
- Unified camera interface for OpenCV (laptop) and PiCamera2 (RPi)
- Auto-fallback: tries PiCamera2 first on RPi, falls back to OpenCV
- Matches cv2.VideoCapture interface: `isOpened()`, `read()`, `release()`
- Returns BGR frames (OpenCV convention) regardless of backend

**Location:** `backend/rpi/camera.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Abstraction | ✅ Pass | Clean interface, transparent backend switching |
| Error Handling | ✅ Pass | Graceful fallback with logging |

---

### 4.7 Embedding Cache — `backend/rpi/embedding_cache.py` (221 lines)

**What It Does:**
- Stores enrolled face embeddings in memory for fast matching
- Loads from JSON file (exported from database via `export_embeddings.py` script)
- **Batch cosine similarity**: vectorized matrix multiplication for O(n) matching against all embeddings
- Provides `find_match()` (single best) and `find_top_matches()` (top-k)

**Key Data Structure:**
- `_embeddings_matrix`: numpy array of shape `(N, 512)` — all embeddings stacked
- Matching: `np.dot(matrix, query)` — single matrix multiplication for all comparisons

**Location:** `backend/rpi/embedding_cache.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Batch Matching | ✅ Pass | Vectorized np.dot — O(n) with low constant factor |
| Memory Efficiency | ✅ Pass | ~2KB per user (512 floats × 4 bytes), 1000 users ≈ 2MB |
| Load Method | ✅ Pass | Supports both JSON file and bytes dict |
| Refresh | ❌ Fail | **No periodic refresh mechanism** — only loads at startup |
| Scale Limit | ⚠️ Warn | For >2000 users, should consider FAISS index |

---

### 4.8 Attendance Logger — `backend/rpi/attendance_logger.py` (199 lines)

**What It Does:**
- POSTs attendance records to backend API (`/api/kiosk/attendance/log`)
- **Offline fallback**: if API fails, queues records to `offline_attendance.json`
- Flush mechanism: retries queued records, keeps failed ones
- Persists queue to disk (survives kiosk restart)

**Location:** `backend/rpi/attendance_logger.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Offline Resilience | ✅ Pass | Queue saved to disk, loaded on restart |
| Auto-Flush | ✅ Pass | Flushes at startup and shutdown |
| Error Handling | ✅ Pass | Catches RequestException, queues failed |
| Periodic Flush | ❌ Fail | No periodic flush during runtime — only at startup/shutdown |

---

### 4.9 Schedule Resolver — `backend/rpi/schedule_resolver.py` (226 lines)

**What It Does:**
- Queries backend API for active class based on device_id
- Falls back to local schedule cache when API unavailable
- Syncs full weekly schedule to JSON for offline use
- Time-based resolution: matches current day + time to schedule entries

**Location:** `backend/rpi/schedule_resolver.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Offline Fallback | ✅ Pass | Cache-based schedule resolution |
| Cache Persistence | ✅ Pass | Saves to JSON, loads on startup |
| Schedule Sync | ⚠️ Warn | Only syncs at startup — no periodic re-sync during long runtime |

---

## 5. Frontend Processes

### 5.1 Landing & Authentication (2 components)

| # | Component | File | What It Does |
|---|-----------|------|-------------|
| 1 | **LandingPage** | `frontend/src/components/LandingPage/LandingPage.jsx` | Hero section, features grid, login modal (email + password via axios POST), role selection modal for registration redirect |
| 2 | **RegistrationPage** | `frontend/src/components/LandingPage/RegistrationPage.jsx` | 2-step registration (personal info → password), post-registration status pages (pending/rejected), custom alert overlay |

#### Optimization Audit — Auth Flow

| Check | Status | Details |
|-------|--------|---------|
| Hardcoded URLs | ❌ Fail | `http://localhost:5000` used directly |
| AbortController | ❌ Fail | No cleanup on unmount |
| Token Handling | ❌ Fail | No JWT — stores full user object in localStorage |
| AuthContext | ❌ Fail | No centralized auth state |

---

### 5.2 Face Enrollment (1 component)

| # | Component | File | What It Does |
|---|-----------|------|-------------|
| 3 | **FaceEnrollmentPage** | `frontend/src/components/FaceEnrollment/FaceEnrollmentPage.jsx` | Webcam capture (15 frames at 500ms intervals via `navigator.mediaDevices`), sends base64 array to `/api/face/enroll`, simulated progress phases, role-based redirect |

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| URL | ✅ Pass | Uses relative URL `/api/face/enroll` (only component that does) |
| AbortController | ❌ Fail | No cleanup |
| Loading States | ✅ Pass | Multi-phase progress indicator |

---

### 5.3 Admin Dashboard (6 components)

| # | Component | What It Does | API Connected? |
|---|-----------|-------------|----------------|
| 4 | **AdminDashboardPage** | Summary cards (users, cameras, alerts), room availability, system status | ❌ **ALL MOCK DATA** |
| 5 | **AdminLayout** | Role verification (admin only), red theme, sidebar + header | Partial (localStorage) |
| 6 | **ApplicationPage** | User verification list, approve/reject/delete actions, details modal | ✅ Real API (4 endpoints) |
| 7 | **ReportsPage** | 14 report types across 3 categories, PDF export via jsPDF | ✅ Real API (1 endpoint) |
| 8 | **SystemLogsPage** | System log viewer with filters | ❌ **ALL MOCK DATA** (6 hardcoded logs) |
| 9 | **UserManagementPage** | User list with role cards, search, filter | ❌ **ALL MOCK DATA** (3 hardcoded users) |

---

### 5.4 Faculty Dashboard (5 components)

| # | Component | What It Does | API Connected? |
|---|-----------|-------------|----------------|
| 10 | **FacultyDashboardPage** | Summary cards, recent activity, system status | ✅ Real API (1 endpoint) |
| 11 | **FacultyLayout** | Role + face enrollment checks, collapsible sidebar | Partial (localStorage) |
| 12 | **MyClassesPage** | **Most complex** — 3 views (List/Calendar/Upload), attendance sheet, session management, PDF upload | ✅ Real API (5 endpoints) |
| 13 | **FacultyAttendancePage** | Attendance stats + class list, student detail table, PDF export | ✅ Real API (2 endpoints) |
| 14 | **FacultyReportsPage** | 21 report types (CLASS + PERSONAL), filters, PDF/CSV generation | ❌ **ALL MOCK DATA** (12 mock log entries) |

---

### 5.5 Student Dashboard (5 components)

| # | Component | What It Does | API Connected? |
|---|-----------|-------------|----------------|
| 15 | **StudentDashboardPage** | Welcome banner, live class status (30s polling), attendance trend chart | ✅ Real API (3 endpoints) |
| 16 | **StudentLayout** | Verification + face checks, notification count from API | ✅ (layout-level API call) |
| 17 | **SchedulePage** | Today/Week/Calendar views, COR PDF upload for schedule generation | ✅ Real API (2 endpoints) |
| 18 | **AttendanceHistoryPage** | 8 report types, smart log-to-subject mapping, filters, PDF/CSV export | ✅ Real API (2 endpoints) |
| 19 | **StudentReportModal** | Format selection modal, simulated processing delay | Presentational only |

**Note:** StudentDashboardPage is the **only component** with `AbortController` in the entire frontend.

---

### 5.6 Dept Head Dashboard (6 components)

| # | Component | What It Does | API Connected? |
|---|-----------|-------------|----------------|
| 20 | **DeptHeadDashboardPage** | Summary cards, pending verifications | Partial (1 endpoint + hardcoded `[1,2,3]`) |
| 21 | **DeptHeadLayout** | Role check (head/dept_head), collapsible sidebar | Partial (localStorage) |
| 22 | **DeptHeadManagePage** | Course management: subject table, faculty/room assignment modals | ✅ Real API (4 endpoints) |
| 23 | **DeptHeadReportsPage** | 4 report types, PDF generation | ✅ Real API (2 endpoints) |
| 24 | **DeptHeadUserManagementPage** | **Largest component** (450 lines). User directory + verification, profile panel with schedule | ✅ Real API (5 endpoints) |
| 25 | **DeptHeadSystemLogsPage** | Exact duplicate of AdminDashboard/SystemLogsPage | ❌ **ALL MOCK DATA** |

---

### 5.7 Common Components (7 components)

| # | Component | What It Does | API Connected? |
|---|-----------|-------------|----------------|
| 26 | **Header** | Page title from route, notification bell, profile avatar | ❌ MOCK (4 hardcoded notifications) |
| 27 | **Footer** | Static about/contact/social | ❌ ALL MOCK |
| 28 | **Logo** | Renders frames_logo.png | Static |
| 29 | **MyProfilePage** | Profile editing, change password flow | ✅ Real API (4 endpoints) |
| 30 | **HelpSupportPage** | FAQ accordion, contact form | ❌ ALL MOCK (form does nothing) |
| 31 | **SettingsPage** | Notification toggles, theme selector | ❌ ALL MOCK (non-functional) |
| 32 | **NotificationsPage** | Notification list with filters | ❌ ALL MOCK (6 hardcoded) |

---

### 5.8 Utilities & Test (2 files)

| # | Component | What It Does |
|---|-----------|-------------|
| 33 | **ReportGenerator.js** | Utility: generates PDF (jsPDF + autoTable) and CSV exports with FRAMES branding |
| 34 | **TestPDFPage** | Sandbox: 16 report types with mock data generators, PDF preview — **by design** |

---

## 6. Cross-Cutting Concerns & Optimization Audit

### 6.1 N+1 Query Analysis

| Location | Severity | Pattern | Required Fix |
|----------|----------|---------|-------------|
| `faculty.py /schedule/{user_id}` | 🔴 Critical | 3 queries per class inside loop (Subject, Enrollment count, AttendanceLog count) | Use JOINs + batch subqueries |
| `faculty.py /dashboard-stats/{user_id}` | 🔴 Critical | Loops over classes to count students/attendance | Use aggregate queries with GROUP BY |
| `faculty.py /class-details/{schedule_id}` | 🔴 Critical | Queries attendance per student inside loop | Use bulk query + groupBy in Python |
| `kiosk.py /attendance/log` (fallback paths) | 🟡 Medium | Some conditionals trigger extra queries | Consolidate early-return paths |

**Estimated Impact:** For a faculty with 5 classes × 30 students each, `/class-details` fires 1 + 5 + (5 × 30) = **156 queries** instead of 2-3.

---

### 6.2 Database Configuration Audit

| Setting | Current | Required | Status |
|---------|---------|----------|--------|
| `echo` | `True` | `False` | ❌ Fail — logs every SQL statement |
| `pool_size` | `2` | `5` | ⚠️ Warn — undersized for concurrent requests |
| `max_overflow` | `3` | `5` | ⚠️ Warn |
| `pool_pre_ping` | `True` | `True` | ✅ Pass |
| `pool_recycle` | Missing | `300` | ❌ Fail — stale connections after hours |
| `pool_timeout` | Missing | `30` | ❌ Fail — requests hang forever under exhaustion |

**Location:** `backend/db/database.py`

---

### 6.3 Missing Indexes

| Table | Column(s) | Status |
|-------|----------|--------|
| `attendance_logs.user_id` | FK | ❌ Missing `index=True` in model |
| `attendance_logs.class_id` | FK | ❌ Missing `index=True` in model |
| `attendance_logs.device_id` | FK | ❌ Missing `index=True` in model |
| `attendance_logs.timestamp` | Order/Filter | ❌ Missing `index=True` in model |
| `attendance_logs.action` | Filter | ❌ Missing `index=True` in model |
| `attendance_logs(user_id, class_id, timestamp)` | Composite | ❌ Missing composite index |
| `classes.faculty_id` | FK | ❌ Missing `index=True` in model |
| `classes.subject_id` | FK | ❌ Missing `index=True` in model |
| `classes.room` | Filter | ❌ Missing `index=True` in model |
| `classes.day_of_week` | Filter | ❌ Missing `index=True` in model |
| `enrollments.student_id` | FK | ❌ Missing `index=True` in model |
| `enrollments.class_id` | FK | ❌ Missing `index=True` in model |
| `users.role` | Filter | ❌ Missing `index=True` in model |
| `users.verification_status` | Filter | ❌ Missing `index=True` in model |
| `users.department_id` | FK | ❌ Missing `index=True` in model |
| `devices.room` | Lookup | ❌ Missing `index=True` in model |

**Note:** The live PostgreSQL database (updatedSchema) has some indexes created by Aiven/pgAdmin, but the SQLAlchemy models do NOT declare `index=True`, so migrations won't recreate them.

---

### 6.4 Frontend Architecture Violations

| Violation | Files Affected | Required Fix |
|-----------|---------------|-------------|
| Hardcoded `http://localhost:5000` | **16 files** with 26+ direct axios calls | Create `services/api.js` centralized client |
| No `AbortController` | **36 of 37** components | Add cleanup in every `useEffect` fetch |
| No `AuthContext` | ALL files use `localStorage.getItem('currentUser')` directly | Create `context/AuthContext.jsx` |
| No route guards | Layouts do manual role checks | Create `<ProtectedRoute>` component |
| Mock data in production | **11 components** with hardcoded arrays | Replace with real API calls |
| No `VITE_API_BASE_URL` | Not referenced anywhere | Configure for deployment |
| Missing loading states | 8+ components | Add `isLoading` / `error` state handling |
| Duplicate component | `DeptHeadSystemLogsPage` = exact copy of `SystemLogsPage` | Extract shared component |

---

### 6.5 Security Violations

| Violation | Severity | Location | Details |
|-----------|----------|----------|---------|
| No JWT authentication | 🔴 Critical | All routers | User ID from URL, anyone can impersonate |
| CORS allow_origins=["*"] | 🔴 Critical | `backend/main.py` | All origins allowed |
| No rate limiting | 🔴 Critical | `/api/auth/login`, `/api/face/enroll` | Brute force / DoS risk |
| `str(e)` in HTTP responses | 🟡 Medium | faculty.py, kiosk.py | Internal error leakage |
| `print()` instead of `logging` | 🟡 Medium | auth.py, faculty.py, kiosk.py | No structured logging |
| No input size limit on PDF upload | 🟡 Medium | faculty.py | Could accept arbitrarily large files |
| User password in plain response | ⚠️ Check | auth.py login | Verify hashed_password not in response |

---

### 6.6 `datetime.utcnow()` Usage

`datetime.utcnow()` is deprecated in Python 3.12+. Current usage in models:

| Model | Field | Current | Required |
|-------|-------|---------|----------|
| `attendance_log.py` | `timestamp` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `audit_log.py` | `timestamp` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `device.py` | `last_heartbeat` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `security_log.py` | `timestamp` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `system_metric.py` | `recorded_at` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `user.py` | `created_at` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `user.py` | `updated_at` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `user.py` | `last_login` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `enrollment.py` | `enrolled_at` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |
| `session_exception.py` | `created_at` | `datetime.utcnow` | `lambda: datetime.now(timezone.utc)` |

---

### 6.7 RPi Kiosk Missing Features

| Feature | Status | Required By |
|---------|--------|-------------|
| SIGTERM handler for systemd | ❌ Missing | Deployment rule 4.4 |
| Periodic embedding cache refresh | ❌ Missing | Deployment rule 4.3 |
| Periodic offline queue flush | ❌ Missing | Best practice |
| Visual "OFFLINE MODE" indicator | ❌ Missing | Deployment rule 4.5 |
| Memory monitoring / alert at 3GB | ❌ Missing | Deployment rule 4.2 |
| FaceRecognizer default model mismatch | ⚠️ Bug | `buffalo_sc` default vs `buffalo_l` enrollment |

---

## 7. Violation Summary Matrix

### By Category

| Category | Critical 🔴 | Warning 🟡 | Info ⚠️ |
|----------|------------|-----------|---------|
| N+1 Queries | 3 | 1 | 0 |
| Missing Indexes | 16 | 0 | 0 |
| No Authentication (JWT) | 1 (all routers) | 0 | 0 |
| Hardcoded URLs (Frontend) | 1 (16 files) | 0 | 0 |
| No AbortController | 1 (36 files) | 0 | 0 |
| Mock Data in Production | 0 | 11 | 0 |
| No AuthContext | 1 | 0 | 0 |
| CORS Wildcard | 1 | 0 | 0 |
| Database Config | 3 | 2 | 0 |
| `datetime.utcnow` | 0 | 10 | 0 |
| `print()` Usage | 0 | 4+ | 0 |
| RPi Missing Features | 5 | 1 | 0 |
| No Pagination | 0 | 3 | 0 |
| No Rate Limiting | 2 | 0 | 0 |
| No Service Layer | 0 | 4 | 0 |
| **TOTAL** | **28** | **19** | **0** |

### By Tier

| Tier | Critical | Warning | Total |
|------|----------|---------|-------|
| Backend API | 9 | 12 | 21 |
| Frontend | 4 | 12 | 16 |
| RPi Kiosk | 5 | 2 | 7 |
| Database/Models | 19 | 12 | 31 |

---

## 8. Priority Remediation Plan

### 🔴 P0 — Must Fix Before ANY Deployment

| # | Task | Est. Effort | Impact |
|---|------|-------------|--------|
| 1 | Add `index=True` to all FK columns in models + composite index on attendance_logs | 1 hour | Prevents full table scans |
| 2 | Fix N+1 queries in faculty.py (schedule, dashboard-stats, class-details) | 3-4 hours | Prevents 100+ queries per request |
| 3 | Create `frontend/src/services/api.js` centralized client, replace all hardcoded URLs | 2-3 hours | Deployment blocker |
| 4 | Set `echo=False`, add `pool_recycle=300`, `pool_timeout=30` in database.py | 15 min | Production stability |
| 5 | Fix FaceRecognizer default model (`buffalo_sc` → `buffalo_l`) | 5 min | Prevents embedding mismatch |

### 🟡 P1 — Must Fix Before Demo/Release

| # | Task | Est. Effort | Impact |
|---|------|-------------|--------|
| 6 | Implement JWT authentication (backend + frontend token handling) | 6-8 hours | Security requirement |
| 7 | Create AuthContext, replace all localStorage parsing | 3-4 hours | Frontend architecture |
| 8 | Add AbortController to all useEffect fetches | 3-4 hours | Prevents memory leaks |
| 9 | Add pagination to admin verification/list, faculty session-exceptions | 1-2 hours | Prevents OOM on large datasets |
| 10 | Replace `datetime.utcnow` with `datetime.now(timezone.utc)` in all models | 30 min | Python 3.12+ compatibility |
| 11 | Add SIGTERM handler + periodic cache refresh to kiosk | 1-2 hours | RPi stability |

### 🟢 P2 — Should Fix Before Production

| # | Task | Est. Effort | Impact |
|---|------|-------------|--------|
| 12 | Extract service layer from routers (faculty_service, kiosk_service) | 4-6 hours | Code maintainability |
| 13 | Replace all `print()` with `logging` | 1-2 hours | Production observability |
| 14 | Add rate limiting on login + face enrollment | 2-3 hours | Security hardening |
| 15 | Lock CORS to specific frontend URL | 15 min | Security |
| 16 | Create ProtectedRoute component with role guards | 2-3 hours | Security UX |
| 17 | Add periodic offline queue flush + visual offline indicator (kiosk) | 1-2 hours | RPi reliability |

### 🔵 P3 — Should Fix for Completeness

| # | Task | Est. Effort | Impact |
|---|------|-------------|--------|
| 18 | Replace mock data in admin pages (Dashboard, SystemLogs, UserManagement) | 4-6 hours | Feature completeness |
| 19 | Replace mock data in Header, Notifications, Settings, HelpSupport | 3-4 hours | Feature completeness |
| 20 | Replace mock data in FacultyReportsPage | 2-3 hours | Feature completeness |
| 21 | Replace mock data in DeptHeadSystemLogsPage (or share component) | 1 hour | DRY principle |
| 22 | Implement functional Settings page (notification prefs persistence) | 3-4 hours | Feature completeness |
| 23 | Implement functional Notifications from backend | 4-6 hours | Feature completeness |
| 24 | Add structured error responses (error codes, not raw strings) | 2-3 hours | API contract consistency |
| 25 | Add ondelete behavior to all FK relationships in models | 1 hour | Data integrity |

---

## Complete Process Inventory (43 Total)

### Backend API — 42 Endpoints

| # | Process | Endpoint | Router File | Method |
|---|---------|----------|-------------|--------|
| 1 | User Login | `/api/auth/login` | auth.py | POST |
| 2 | User Registration | `/api/auth/register` | auth.py | POST |
| 3 | Validate Face (stub) | `/api/auth/validate-face` | auth.py | POST |
| 4 | List Verification Queue | `/api/admin/verification/list` | admin.py | GET |
| 5 | Approve User | `/api/admin/verification/approve/{id}` | admin.py | PUT |
| 6 | Reject User | `/api/admin/verification/reject/{id}` | admin.py | PUT |
| 7 | Delete User | `/api/admin/users/{id}` | admin.py | DELETE |
| 8 | Faculty Schedule | `/api/faculty/schedule/{id}` | faculty.py | GET |
| 9 | Faculty Dashboard Stats | `/api/faculty/dashboard-stats/{id}` | faculty.py | GET |
| 10 | Create Subject | `/api/faculty/subjects` | faculty.py | POST |
| 11 | Get Class Detail | `/api/faculty/class/{id}` | faculty.py | GET |
| 12 | Upload History | `/api/faculty/upload-history` | faculty.py | GET |
| 13 | Upload Schedule PDF | `/api/faculty/upload-schedule` | faculty.py | POST |
| 14 | Get Class Details Full | `/api/faculty/class-details/{id}` | faculty.py | GET |
| 15 | Create Session Exception | `/api/faculty/session-exceptions` | faculty.py | POST |
| 16 | Update Session Exception | `/api/faculty/session-exceptions/{id}` | faculty.py | PUT |
| 17 | Delete Session Exception | `/api/faculty/session-exceptions/{id}` | faculty.py | DELETE |
| 18 | List Faculty Exceptions | `/api/faculty/session-exceptions-by-faculty/{id}` | faculty.py | GET |
| 19 | Get Late Threshold | `/api/faculty/class/{id}/late-threshold` | faculty.py | GET |
| 20 | Set Late Threshold | `/api/faculty/class/{id}/late-threshold` | faculty.py | PUT |
| 21 | Student Live Status | `/api/student/live-status/{id}` | student.py | GET |
| 22 | Student Dashboard | `/api/student/dashboard/{id}` | student.py | GET |
| 23 | Student Schedule | `/api/student/schedule/{id}` | student.py | GET |
| 24 | Student Attendance History | `/api/student/history/{id}` | student.py | GET |
| 25 | Get User Profile | `/api/users/{id}` | users.py | GET |
| 26 | Update User Profile | `/api/users/{id}` | users.py | PUT |
| 27 | Verify Password | `/api/users/verify-password` | users.py | POST |
| 28 | Change Password | `/api/users/change-password` | users.py | POST |
| 29 | Face Enrollment | `/api/face/enroll` | face.py | POST |
| 30 | Face Status | `/api/face/status/{id}` | face.py | GET |
| 31 | Kiosk Active Class | `/api/kiosk/active-class` | kiosk.py | GET |
| 32 | Kiosk Schedule | `/api/kiosk/schedule` | kiosk.py | GET |
| 33 | Log Attendance | `/api/kiosk/attendance/log` | kiosk.py | POST |
| 34 | Class Enrolled Users | `/api/kiosk/class/{id}/enrolled` | kiosk.py | GET |
| 35 | Attendance State | `/api/kiosk/attendance-state` | kiosk.py | GET |
| 36 | Device Info | `/api/kiosk/device/{id}` | kiosk.py | GET |
| 37 | Device Heartbeat | `/api/kiosk/device/heartbeat` | kiosk.py | POST |
| 38 | Kiosk Late Threshold | `/api/kiosk/late-threshold/{id}` | kiosk.py | GET |
| 39 | Dept Management Data | `/api/dept/management-data` | dept.py | GET |
| 40 | Create Subject (Dept) | `/api/dept/create-subject` | dept.py | POST |
| 41 | Assign Faculty | `/api/dept/assign-faculty` | dept.py | POST |
| 42 | Assign Room | `/api/dept/assign-room` | dept.py | POST |

### Backend Services — 4 Service Files, 18 Functions

| # | Service | Function | Purpose |
|---|---------|----------|---------|
| 1 | face_enrollment | `get_face_analyzer()` | Lazy-load InsightFace model |
| 2 | face_enrollment | `decode_base64_image()` | Base64 → OpenCV image |
| 3 | face_enrollment | `extract_embedding()` | Extract 512-d face embedding |
| 4 | face_enrollment | `process_enrollment_frames()` | Multi-frame enrollment averaging |
| 5 | face_enrollment | `compare_embeddings()` | Cosine similarity comparison |
| 6 | pdf_parser | `clean_section()` | Normalize section identifiers |
| 7 | pdf_parser | `parse_time_slot()` | Parse time string → start/end |
| 8 | pdf_parser | `parse_schedule_pdf()` | Parse COR PDF → structured data |
| 9 | gesture_detection | `get_hands_detector()` | Lazy-load MediaPipe hands |
| 10 | gesture_detection | `get_finger_states()` | Landmark → finger state dict |
| 11 | gesture_detection | `is_ok_sign()` | Detect OK gesture |
| 12 | gesture_detection | `is_open_palm()` | Detect open palm |
| 13 | gesture_detection | `is_thumbs_up()` | Detect thumbs up |
| 14 | gesture_detection | `classify_gesture()` | Best gesture classification |
| 15 | gesture_detection | `detect_gesture()` | Image → gesture pipeline |
| 16 | gesture_detection | `detect_gesture_from_base64()` | Base64 → gesture pipeline |
| 17 | gesture_detection | `validate_gesture_for_action()` | Validate gesture matches action |
| 18 | gesture_constants | `GestureType`, `GESTURE_ACTION_MAP` | Constants and mappings |

### RPi Kiosk — 9 Modules, 15+ Key Functions

| # | Module | Key Process | Purpose |
|---|--------|-------------|---------|
| 1 | main_kiosk | `AttendanceKiosk.run()` | Full attendance loop |
| 2 | main_kiosk | `process_frame()` | Face detection → recognition pipeline |
| 3 | main_kiosk | `check_gesture()` | Gesture capture with timeout |
| 4 | config | `KioskConfig.__post_init__()` | Platform-specific auto-configuration |
| 5 | config | `_detect_platform()` | RPi vs laptop detection |
| 6 | camera | `Camera.__init__()` | Platform-appropriate camera initialization |
| 7 | camera | `Camera.read()` | Unified frame capture (BGR) |
| 8 | face_detector | `FaceDetector.detect()` | MediaPipe BlazeFace detection |
| 9 | face_detector | `FaceDetector.get_largest_face()` | Select closest face |
| 10 | face_recognizer | `FaceRecognizer.get_embedding()` | InsightFace embedding extraction |
| 11 | gesture_detector | `GestureDetector.detect()` | Gesture recognition with temporal smoothing |
| 12 | gesture_detector | `GestureDetector._classify_gesture()` | Single-frame gesture classification |
| 13 | embedding_cache | `EmbeddingCache.find_match()` | Vectorized cosine similarity matching |
| 14 | attendance_logger | `AttendanceLogger.log_attendance()` | API POST with offline fallback |
| 15 | attendance_logger | `AttendanceLogger.flush_offline_queue()` | Retry queued records |
| 16 | schedule_resolver | `ScheduleResolver.get_active_class()` | API + cache time-based resolution |
| 17 | schedule_resolver | `ScheduleResolver.sync_schedule()` | Full schedule download to cache |

### Frontend — 37 Components, 26+ API Calls

| # | Component | Key Processes |
|---|-----------|--------------|
| 1 | LandingPage | Login modal, role selection → registration redirect |
| 2 | RegistrationPage | 2-step registration flow, status pages |
| 3 | FaceEnrollmentPage | Webcam capture (15 frames), face enrollment POST |
| 4 | AdminDashboardPage | Dashboard display (mock data) |
| 5 | ApplicationPage | User verification: approve/reject/delete |
| 6 | ReportsPage | 14 report types, PDF generation |
| 7 | SystemLogsPage | Log display (mock data) |
| 8 | UserManagementPage | User listing (mock data) |
| 9 | FacultyDashboardPage | Faculty stats display |
| 10 | MyClassesPage | 3-view class management, PDF upload, session exceptions |
| 11 | FacultyAttendancePage | Attendance sheet view, PDF export |
| 12 | FacultyReportsPage | 21 report types (mock data) |
| 13 | StudentDashboardPage | Live class polling (30s), trend chart |
| 14 | SchedulePage | Weekly schedule, COR upload |
| 15 | AttendanceHistoryPage | 8 report types, smart subject mapping |
| 16 | DeptHeadDashboardPage | Department overview |
| 17 | DeptHeadManagePage | Subject/faculty/room management |
| 18 | DeptHeadReportsPage | 4 department report types |
| 19 | DeptHeadUserManagementPage | User directory + verification |
| 20 | MyProfilePage | Profile editing, password change |
| 21 | Header | Dynamic title, notifications (mock) |
| 22 | ReportGenerator.js | PDF/CSV generation utility |

---

**End of Audit — Version 1.0**
