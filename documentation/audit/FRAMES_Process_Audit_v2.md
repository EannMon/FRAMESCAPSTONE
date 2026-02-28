# FRAMES — Comprehensive Process & Feature Audit

**Version:** 2.0  
**Date:** 2025-06-27  
**Previous Version:** 1.0 (2025-06-26)  
**Scope:** Every process, feature, and functionality across Backend, Frontend, and RPi Kiosk  
**Audit Criteria:** FRAMES Deployment Constraints, Engineering Standards, Coding Rules  
**Change Trigger:** PR #26 `feature/backend-optimization` merged to main (commit `014337c` by hasu621)

---

## Changelog Since v1.0

| Item | v1.0 Status | v2.0 Status | What Changed |
|------|-------------|-------------|-------------|
| P0 #1 — Missing Indexes (16 columns) | ❌ Critical | ✅ **RESOLVED** | All FK + filter columns now have `index=True`, composite index added |
| P0 #2 — N+1 Queries in faculty.py (3 patterns) | ❌ Critical | ✅ **RESOLVED** | `joinedload()` + batch `GROUP BY` queries |
| P0 #4 — database.py config (echo, pool) | ❌ Critical | ✅ **RESOLVED** | `echo=False`, `pool_recycle=300`, `pool_timeout=30` |
| P1 #10 — `datetime.utcnow` (10 locations) | ⚠️ Warning | ✅ **RESOLVED** | All 13 models updated to `datetime.now(timezone.utc)` |
| Admin approve/reject contract | ❌ Mismatch | ✅ **FIXED** | Backend changed from PUT+URL param to POST+JSON body (now matches frontend) |
| Dept faculty filter | No filter | ✅ **Improved** | Faculty list now filters for VERIFIED status only |
| Dept assign-faculty | No verification check | ✅ **Improved** | Now validates faculty is VERIFIED before assignment |
| New endpoint `/api/dept/user-schedule/{user_id}` | N/A | 🆕 **Added** | Returns schedule for a faculty (student TODO) |
| P0 #3 — Centralized API client | ❌ Critical | ✅ **RESOLVED** | Created `services/api.js` (63 lines) — centralized axios client with Vite proxy fallback, request interceptor (X-User-Id, JWT-ready), response interceptor (structured errors). 11 components migrated: LandingPage, RegistrationPage, Header, StudentLayout, FaceEnrollmentPage, ApplicationPage, ReportsPage, UserVerificationPage, AdminDashboardPage, SystemLogsPage, UserManagementPage. |
| P0 #5 — FaceRecognizer `buffalo_sc` default | ⚠️ Bug | ⚠️ **UNCHANGED** | Still defaults to `buffalo_sc` at line 58 |
| P1 — AuthContext | ❌ Open | ✅ **RESOLVED** | Created `context/AuthContext.jsx` (106 lines) — `user`, `login()`, `logout()`, `updateUser()`, `hasRole()`. 16 components migrated from `localStorage.getItem('currentUser')` to `useAuth()`. Zero direct localStorage reads remain in components. |
| P1 — Token Handling | ❌ Open | ✅ **RESOLVED** | All localStorage writes centralized in AuthContext. `api.js` interceptor attaches `X-User-Id` header. JWT-ready (swap one line when backend adds tokens). |
| All remaining frontend violations | ❌ Open | ⚠️ **PARTIAL** | Auth flow (5.1) + Face Enrollment (5.2) + Admin Dashboard (5.3, incl. mock→real API) + Faculty Dashboard (5.4, incl. mock→real API + decomposition) + Student Dashboard (5.5, decomposition + AbortController) fully fixed. 7 new backend endpoints added across 2 routers. 4 files decomposed → 9 extracted components. Sections 5.6–5.8 still have hardcoded URLs, missing AbortController. |
| All RPi kiosk gaps | ❌ Open | ❌ **UNCHANGED** | Zero RPi files changed |

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
| Backend API | FastAPI + SQLAlchemy + PostgreSQL (Aiven) | 8 routers, 4 services, 13 models |
| Frontend | React + Vite + Axios | 38 components across 8 modules + utils |
| RPi Kiosk | InsightFace + MediaPipe + OpenCV | 9 files (camera, detector, recognizer, gestures, cache, schedule, logger) |

### Key Metrics

| Metric | v1.0 | v2.0 | Delta |
|--------|------|------|-------|
| Total API Endpoints | 42 | **43** | +1 (new dept endpoint) |
| Total Frontend Pages/Components | 37 | **38** | +1 (KioskDashboardPage, UserVerificationPage, FacultyReportModal, DeptHeadReportModal discovered; renumbered) |
| RPi Kiosk Modules | 9 | 9 | — |
| Backend Services | 4 | 4 | — |
| **Critical Violations** | **28** | **7** | **-21 resolved** |
| **Warnings** | **19** | **16** | **-3 resolved** |

### What Was Fixed (PR #26 — Backend Optimization)

The optimization PR addressed **performance only** — not security, not frontend, not RPi:

1. **All 13 SQLAlchemy models**: Added `index=True` to every FK and frequently-queried column, replaced all `datetime.utcnow` with `datetime.now(timezone.utc)`
2. **`database.py`**: Set `echo=False`, `pool_size=5`, `max_overflow=5`, `pool_recycle=300`, `pool_timeout=30`
3. **`faculty.py`**: Eliminated all 3 N+1 query patterns using `joinedload()` and batch `GROUP BY` queries
4. **`admin.py`**: Changed approve/reject from PUT+URL param to POST+JSON body (aligned with frontend's existing contract)
5. **`dept.py`**: Added VERIFIED filter for faculty, verification check on faculty assignment, new `/user-schedule/{user_id}` endpoint

### What Was NOT Touched

- **Frontend** (34 files changed post-audit) — ✅ AuthContext created + 16 components migrated, ✅ `services/api.js` created + 11 components migrated, ✅ Faculty Dashboard (5.4) fully fixed: 4 components migrated to api.js + AbortController, MyClassesPage decomposed (617→289 lines + 2 extracted components), FacultyReportsPage mock data replaced with real API (552→299 lines + reportConfig extracted). ✅ Student Dashboard (5.5) fully fixed: StudentDashboardPage decomposed (574→170 lines + LiveClassStatus 125 lines + AttendanceTrendChart 284 lines), AttendanceHistoryPage decomposed (500→214 lines + AttendanceTableView 159 lines + attendanceReportConfig 143 lines), SchedulePage migrated to api.js + AbortController + refreshTrigger pattern, random dummy data removed from chart. ⚠️ Sections 5.6–5.8 still have hardcoded URLs, missing AbortController.
- **Backend** (2 new files) — `admin_dashboard.py` (297 lines) added with 4 endpoints for admin. `faculty_reports.py` (246 lines) added with 3 endpoints for faculty report data (class-logs, personal-logs, subjects).
- **RPi Kiosk** (0 files changed) — No SIGTERM, no cache refresh, `buffalo_sc` default still present
- **Security** (0 items) — No JWT, no rate limiting, no CORS lockdown
- **Service layer extraction** — All logic still inline in routers

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

### 2.2 Admin Router — `backend/api/routers/admin.py` (107 lines)

> **🔄 CHANGED in PR #26**: Approve/reject endpoints changed from `PUT` with URL path param `{user_id}` to `POST` with Pydantic `VerificationRequest` JSON body. This **aligns backend with the existing frontend** (`ApplicationPage.jsx` already sent POST with `{user_id}` in body). The v1.0 audit incorrectly listed these as PUT — the backend was out of sync with the frontend, now fixed.

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 4 | `/api/admin/verification/list` | GET | Lists ALL users ordered by registration date (no filter param, no pagination) |
| 5 | `/api/admin/verification/approve` | **POST** _(was PUT+{id})_ | Accepts `VerificationRequest` body → sets user verification_status → VERIFIED |
| 6 | `/api/admin/verification/reject` | **POST** _(was PUT+{id})_ | Accepts `VerificationRequest` body → sets user verification_status → REJECTED |
| 7 | `/api/admin/user/{user_id}` | DELETE | Hard-deletes user and all related records |

**Location:** `backend/api/routers/admin.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ⚠️ Warn | `/verification/list` loops over all users to build response instead of using Pydantic `from_attributes` directly |
| Pagination | ❌ Fail | `/verification/list` returns ALL users, no skip/limit |
| Error Handling | ⚠️ Warn | Returns raw `HTTPException(detail=str)` |
| Auth Protection | ❌ Fail | No authentication — anyone can approve/reject/delete users |
| `print()` Usage | ❌ Fail | 4 `print()` statements (list, approve, reject, delete) |
| Cascade Delete | ⚠️ Warn | Hard delete — cascades not explicitly verified for all FK relationships |
| Contract Alignment | ✅ **FIXED** | POST+body now matches frontend's `axios.post()` with `{user_id}` body |

---

### 2.3 Faculty Router — `backend/api/routers/faculty.py` (694 lines)

> **🔄 CHANGED in PR #26**: All 3 N+1 query patterns eliminated. `get_faculty_schedule()` now uses `joinedload(Class.subject)` + batch `GROUP BY` for enrollment/attendance counts. `get_class_details()` uses `joinedload(Enrollment.student)`. `get_class_details_by_schedule_id()` uses batch attendance query with `in_()` clause + O(1) dict lookup.

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
| N+1 Queries | ✅ **FIXED** | `/schedule/{user_id}`: `joinedload(Class.subject)` + batch enrollment/attendance counts via `GROUP BY` |
| N+1 Queries | ⚠️ Improved | `/dashboard-stats/{user_id}`: Uses `Class.faculty_id` filter + `in_()` for enrollment count. Still has a TODO for average_attendance (hardcoded 85.0) |
| N+1 Queries | ✅ **FIXED** | `/class-details/{schedule_id}`: Batch attendance query with `in_()` + dict lookup |
| N+1 Queries | ✅ **FIXED** | `/class/{class_id}`: `joinedload(Enrollment.student)` eliminates per-student User query |
| Pagination | ❌ Fail | `/session-exceptions-by-faculty` returns all, no pagination |
| Error Handling | ⚠️ Warn | Some endpoints expose `str(e)` in responses |
| Auth Protection | ❌ Fail | User ID from URL path — no JWT, any user can access any faculty's data |
| `print()` Usage | ❌ Fail | Multiple `print()` statements remain |
| Service Layer | ❌ Fail | All business logic and queries still inline in router (694 lines) |
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

**Note:** Student router remains the **best-optimized** backend router.

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

### 2.8 Department Router — `backend/api/routers/dept.py` (~240 lines)

> **🔄 CHANGED in PR #26**: Faculty list now filters for `VerificationStatus.VERIFIED` only (previously returned all faculty). `assign-faculty` now validates that the target faculty is VERIFIED before assignment. New endpoint `/user-schedule/{user_id}` added for viewing a user's schedule.

| # | Endpoint | Method | What It Does |
|---|----------|--------|-------------|
| 39 | `/api/dept/management-data` | GET | Returns subjects, classes (with faculty via `joinedload`), VERIFIED faculty, rooms for a department |
| 40 | `/api/dept/create-subject` | POST | Creates new subject for a department |
| 41 | `/api/dept/assign-faculty` | POST | Assigns VERIFIED faculty to a class (now validates verification status) |
| 42 | `/api/dept/assign-room` | POST | Assigns room to a class |
| **43** | **`/api/dept/user-schedule/{user_id}`** | **GET** | 🆕 **NEW** — Returns schedule for a faculty member (student schedule TODO) |

**Location:** `backend/api/routers/dept.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| N+1 Queries | ⚠️ Warn | `/management-data` still runs separate queries per subject for classes, but uses `joinedload(Class.faculty)` now |
| Faculty Verification | ✅ **NEW** | Faculty list now correctly filters for VERIFIED only |
| Assign Validation | ✅ **NEW** | `assign-faculty` validates faculty is VERIFIED |
| New Endpoint | ✅ Added | `/user-schedule/{user_id}` uses `joinedload(Class.subject)` — no N+1 |
| Auth Protection | ❌ Fail | No authentication |
| Service Layer | ❌ Fail | All logic inline |
| Student Schedule | ⚠️ TODO | `/user-schedule` only handles FACULTY role — student schedule marked TODO |

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

**Location:** `backend/services/gesture_detection.py`

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

> **No changes in PR #26 — this entire section is unchanged from v1.0**

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

**⚠️ STILL UNFIXED (P0 #5):** Model name defaults to `buffalo_sc` in the class constructor (`def __init__(self, model_name: str = "buffalo_sc")` at line 58) but the global function uses `buffalo_l`. The `main_kiosk.py` explicitly passes `buffalo_l` from config. This mismatch could cause bugs if `FaceRecognizer()` is instantiated without arguments — the enrollment uses `buffalo_l` (512-d ResNet-100) but the recognizer would use `buffalo_sc` (512-d MobileFaceNet), producing **incompatible embedding spaces** despite the same dimensionality.

**Location:** `backend/rpi/face_recognizer.py`

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Model Consistency | ⚠️ **STILL BUG** | Default param is `buffalo_sc` but enrollment uses `buffalo_l` — embedding spaces WILL NOT MATCH if default is accidentally used |
| Lazy Loading | ✅ Pass | Singleton model loading |
| Memory | Acceptable | ~600MB for buffalo_l, within RPi budget |

---

### 4.4 Face Detector — `backend/rpi/face_detector.py` (107 lines)

**What It Does:** MediaPipe BlazeFace for fast face localization (gate for InsightFace).

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Performance | ✅ Pass | MediaPipe BlazeFace is lightweight (~5ms per frame) |
| Resource Cleanup | ✅ Pass | Has `close()` method |

---

### 4.5 Gesture Detector — `backend/rpi/gesture_detector.py` (236 lines)

**What It Does:** MediaPipe Hands for real-time gesture recognition with temporal smoothing (3 consecutive frames). Distance-based finger extension detection (angle-invariant).

**Gesture Mapping for Kiosk:**

| Gesture | Attendance Action |
|---------|------------------|
| ✌️ Peace Sign | BREAK_OUT |
| 👍 Thumbs Up | BREAK_IN |
| 🖐️ Open Palm | EXIT |
| (face only) | ENTRY |

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Temporal Smoothing | ✅ Pass | Prevents false positives with consecutive frame requirement |
| Distance-Based Detection | ✅ Pass | Angle-invariant, more robust than Y-coordinate comparison |
| Resource Cleanup | ✅ Pass | Has `close()` method |

---

### 4.6 Camera Abstraction — `backend/rpi/camera.py` (171 lines)

Unified camera interface for OpenCV (laptop) and PiCamera2 (RPi). Returns BGR frames.

#### Optimization Audit: ✅ All Pass

---

### 4.7 Embedding Cache — `backend/rpi/embedding_cache.py` (221 lines)

**What It Does:** In-memory embedding store with vectorized `np.dot()` batch matching.

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Batch Matching | ✅ Pass | Vectorized np.dot — O(n) with low constant factor |
| Memory Efficiency | ✅ Pass | ~2KB per user, 1000 users ≈ 2MB |
| **Refresh** | ❌ Fail | **No periodic refresh mechanism** — only loads at startup |
| Scale Limit | ⚠️ Warn | For >2000 users, should consider FAISS index |

---

### 4.8 Attendance Logger — `backend/rpi/attendance_logger.py` (199 lines)

Offline-first attendance POST with queue-to-disk failover.

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Offline Resilience | ✅ Pass | Queue saved to disk, loaded on restart |
| Auto-Flush | ✅ Pass | Flushes at startup and shutdown |
| Periodic Flush | ❌ Fail | No periodic flush during runtime |

---

### 4.9 Schedule Resolver — `backend/rpi/schedule_resolver.py` (226 lines)

API-based schedule resolution with local JSON cache fallback.

#### Optimization Audit

| Check | Status | Details |
|-------|--------|---------|
| Offline Fallback | ✅ Pass | Cache-based schedule resolution |
| Schedule Sync | ⚠️ Warn | Only syncs at startup — no periodic re-sync |

---

## 5. Frontend Processes

> **No frontend changes in PR #26.** Section 5.1 auth flow and Section 5.2 face enrollment were remediated post-audit (AuthContext + api.js). Sections 5.3–5.8 remain unchanged from v1.0.

### 5.1 Landing & Authentication (2 components + 2 services)

| # | Component | File | What It Does |
|---|-----------|------|-------------|
| 0a | **AuthContext.jsx** (context) | `frontend/src/context/AuthContext.jsx` (106 lines) | Centralized auth state — `user`, `login(data)` (persists + returns role-path), `logout()`, `updateUser(partial)`, `isAuthenticated`, `hasRole(...roles)`. Wraps entire app via `<AuthProvider>`. localStorage is persistence layer, AuthContext is runtime source of truth. |
| 0b | **api.js** (service) | `frontend/src/services/api.js` (63 lines) | Centralized axios client — `VITE_API_URL` env var or Vite proxy fallback, request interceptor (reads `X-User-Id` from localStorage, JWT-ready), response interceptor (structured error extraction → `error.userMessage`, `ERR_CANCELED` swallowed) |
| 1 | **LandingPage** | `frontend/src/components/LandingPage/LandingPage.jsx` (263 lines) | 4 inner components: `HeroSection` (CTA + background), `FeaturesSection` (4-card grid), `LoginPanel` (email/password → `useAuth().login()` → role-based nav), `RoleSelectionModal` (Faculty/Student) |
| 2 | **RegistrationPage** | `frontend/src/components/LandingPage/RegistrationPage.jsx` (359 lines) | 2-step form (Step 1: name + email + TUPM ID, Step 2: password + summary), custom alert overlay, post-registration status pages (pending/rejected/invalid) |

#### API Calls

| Component | Line | Endpoint | Method | What It Does |
|-----------|------|----------|--------|-------------|
| LandingPage → LoginPanel | L43 | `/api/auth/login` | POST | Sends `{email, password}` via `api.js`, calls `useAuth().login(userData)` which persists to context + localStorage, returns role path for `navigate()` |
| RegistrationPage | L120 | `/api/auth/register` | POST | Sends `{email, password, tupm_id, role, first_name, last_name, middle_name}` via `api.js`, redirects to pending status |

#### Optimization Audit — Auth Flow (post-fix, verified 2026-02-27)

| Check | Status | Details |
|-------|--------|---------|
| Hardcoded URLs | ✅ Pass | Both components import `api` from `services/api.js` — relative URLs `/api/auth/login` and `/api/auth/register`, resolved via Vite proxy in dev or `VITE_API_URL` in prod |
| AbortController | ✅ N/A | Both API calls are user-triggered POSTs (form submit / button click) — no polling or `useEffect`-based fetches to clean up; `api.js` handles `ERR_CANCELED` silently. Per coding rules, AbortController is required for `useEffect` fetches only. |
| Token Handling | ✅ Pass | `api.js` request interceptor reads user from localStorage and attaches `X-User-Id` header; JWT-ready placeholder (swap one line when backend adds real tokens). All localStorage writes centralized in `AuthContext.jsx` — zero direct writes in any component |
| AuthContext | ✅ Pass | `AuthContext.jsx` provides `user`, `login()`, `logout()`, `updateUser()`, `hasRole()`. App.jsx wrapped in `<AuthProvider>`. **16 components migrated** from `localStorage.getItem('currentUser')` to `useAuth()`. All 4 Layouts, Header, 4 Common pages, FaceEnrollment, 3 Faculty pages, 3 Student pages — zero direct localStorage reads remain in components |
| Error Handling | ✅ Pass | `error.userMessage` from `api.js` response interceptor — extracts `detail` (string/array/object) and `error` field; LandingPage L59, RegistrationPage L126 |
| Input Validation | ✅ Pass | `isValidEmail()` regex in both components; empty-field checks + password ≥ 6 chars; no password strength meter yet |
| Loading States | ✅ Pass | `isLoading` / `disabled={isLoading}` + text toggle "Logging in…" (LandingPage); `isSubmitting` / `disabled={isSubmitting}` + "Registering…" (RegistrationPage) |

---

### 5.2 Face Enrollment (1 component)

| # | Component | File | What It Does |
|---|-----------|------|-------------|
| 3 | **FaceEnrollmentPage** | `frontend/src/components/FaceEnrollment/FaceEnrollmentPage.jsx` (301 lines) | Webcam capture (15 frames at 500ms intervals via `captureIntervalRef`), multi-phase progress animation, sends base64 array to `/api/face/enroll` via `api.js`, updates `useAuth().updateUser({ face_registered: true })` on success |

#### API Calls

| Component | Line | Endpoint | Method | What It Does |
|-----------|------|----------|--------|-------------|
| FaceEnrollmentPage | L165 | `/api/face/enroll` | POST | Sends `{user_id, frames[]}` via `api.js` — relative URL resolved by Vite proxy. Multi-phase status animation during processing. On success, updates AuthContext and redirects by role. |

#### Optimization Audit — Face Enrollment (post-fix, verified 2026-02-27)

| Check | Status | Details |
|-------|--------|---------|
| Hardcoded URLs | ✅ Pass | Uses `api` from `services/api.js` — relative URL `/api/face/enroll`, resolved via Vite proxy in dev or `VITE_API_URL` in prod |
| AbortController | ✅ N/A | The enrollment POST is user-triggered (button click) — no `useEffect`-based API fetches to clean up. Per coding rules, AbortController is required for `useEffect` fetches only. |
| Cleanup | ✅ Pass | Camera stream stopped on unmount via `streamRef` (L56). Capture interval tracked via `captureIntervalRef` and cleared on unmount (L59). Phase animation timeout tracked via `phaseTimeoutRef` and cleared on unmount (L62). |
| AuthContext | ✅ Pass | Uses `useAuth()` for `user` and `updateUser({ face_registered: true })` (L26) — no direct `localStorage` access |
| Error Handling | ✅ Pass | Uses `err.userMessage` from `api.js` response interceptor (L198) — consistent with LandingPage/RegistrationPage pattern. Eliminates duplicated error extraction logic. |
| Loading States | ✅ Pass | `isEnrolling` state disables button + shows "⏳ Processing…". Multi-phase progress indicator (`phases[]`) with simulated status updates during AI processing. |

---

### 5.3 Admin Dashboard (7 components)

| # | Component | File (lines) | What It Does | API Connected? |
|---|-----------|-------------|-------------|----------------|
| 4 | **AdminDashboardPage** | `AdminDashboardPage.jsx` (258) | Fetches real summary stats (user counts by role, device status, attendance today) from `/api/admin/dashboard-summary` + device list from `/api/admin/devices`. Cards, room grid, alerts, system status — all live data. | ✅ Real API (2 endpoints) via `api.js` |
| 5 | **AdminLayout** | `AdminLayout.jsx` (120) | Role guard (`role !== 'ADMIN'` → redirect), red theme, collapsible sidebar, Header + Outlet | ✅ `useAuth()` |
| 6 | **ApplicationPage** | `ApplicationPage.jsx` (308) | Fetches verification list via `api.js`, status-based tabs (Pending/Verified/Rejected), approve/reject/delete with confirmation | ✅ Real API (4 endpoints) via `api.js` |
| 7 | **ReportsPage** | `ReportsPage.jsx` (405) | 4 report categories with 14 sub-types, `ReportGeneratorModal` with date/filter config, PDF generation via `ReportGenerator.js` | ✅ Real API (1 endpoint) via `api.js` |
| 8 | **SystemLogsPage** | `SystemLogsPage.jsx` (171) | Fetches combined audit + security logs from `/api/admin/system-logs`. Level/service filters + search. Dynamic service dropdown derived from data. | ✅ Real API (1 endpoint) via `api.js` |
| 9 | **UserManagementPage** | `UserManagementPage.jsx` (219) | Fetches all users from `/api/admin/users` with server-side role filter + search. Role summary cards, department names, face status — all live data. Add User routes to registration. | ✅ Real API (1 endpoint) via `api.js` |
| 10 | **UserVerificationPage** | `UserVerificationPage.jsx` (119) | Legacy verification page migrated from `fetch()` to `api.js`, AbortController on load, audit logging per action | ✅ Real API (3 endpoints) via `api.js` |

#### API Calls

| Component | Line | Endpoint | Method | What It Does |
|-----------|------|----------|--------|-------------|
| AdminDashboardPage | L92 | `/api/admin/dashboard-summary` | GET | ✅ **NEW** — Fetches user counts by role, pending verifications, device stats, today's attendance |
| AdminDashboardPage | L93 | `/api/admin/devices` | GET | ✅ **NEW** — Fetches all registered devices with room/status for Room Availability grid |
| ApplicationPage | L35 | `/api/admin/verification/list` | GET | ✅ **MIGRATED to `api.js`** — Fetches all users for verification tabs, with `AbortController` signal |
| ApplicationPage | L80 | `/api/admin/verification/approve` or `/reject` | POST | ✅ **MIGRATED to `api.js`** — Sends `{user_id, verification_status}` to approve or reject |
| ApplicationPage | L110 | `/api/admin/user/${id}` | DELETE | ✅ **MIGRATED to `api.js`** — Hard-deletes user |
| ReportsPage | L167 | `/api/admin/reports/generate` | POST | ✅ **MIGRATED to `api.js`** — Sends `{report_type, date_from, date_to}` for report generation |
| SystemLogsPage | L38 | `/api/admin/system-logs` | GET | ✅ **NEW** — Fetches combined audit + security logs (limit=200), with `AbortController` signal |
| UserManagementPage | L32 | `/api/admin/users` | GET | ✅ **NEW** — Fetches paginated user list with optional `role` + `search` params, with `AbortController` signal |
| UserVerificationPage | L14 | `/api/admin/users/pending` | GET | ✅ **MIGRATED to `api.js`** — Fetches pending users, with `AbortController` signal |
| UserVerificationPage | L40 | `/api/admin/users/verify` | POST | ✅ **MIGRATED to `api.js`** — Approve/reject with `{userId, status}` |
| UserVerificationPage | L43 | `/api/admin/audit` | POST | ✅ **MIGRATED to `api.js`** — Logs admin action to audit trail |

#### Backend Endpoints Added (admin_dashboard.py — 297 lines)

| Endpoint | Method | What It Does |
|----------|--------|-------------|
| `/api/admin/dashboard-summary` | GET | Aggregated stats: user counts by role, pending verifications, device active/offline/maintenance, today's attendance entries + late count |
| `/api/admin/devices` | GET | All devices with room, status, capacity, last heartbeat — from `devices` table |
| `/api/admin/system-logs` | GET | Combined audit + security logs, normalised to `{id, timestamp, level, service, message}`. Supports `log_type`, `limit`, `skip` query params |
| `/api/admin/users` | GET | Paginated user list with `joinedload` for department/program names. Supports `role` and `search` query params |

#### Optimization Audit — Admin Dashboard (post-fix, verified 2026-02-27)

| Check | Status | Details |
|-------|--------|--------|
| Hardcoded URLs | ✅ **FIXED** | All 6 API-connected components use `api.js` with relative URLs. Zero `http://localhost:5000` or `http://127.0.0.1:5000` references remain. |
| AbortController | ✅ **FIXED** | AdminDashboardPage (L83), SystemLogsPage (L32), UserManagementPage (L47+L55), ApplicationPage (L64), UserVerificationPage (L27) — all `useEffect` fetches have `AbortController` with cleanup. ReportsPage is user-triggered (N/A). |
| Mock Data | ✅ **FIXED** | All 3 previously-mock components (Dashboard, SystemLogs, UserManagement) now fetch from real backend endpoints. New `admin_dashboard.py` router (297 lines) added with 4 endpoints querying `users`, `devices`, `audit_logs`, `security_logs`, `attendance_logs` tables. |
| AuthContext | ✅ **FIXED** | AdminLayout migrated to `useAuth()`. Child pages receive user via props / `useOutletContext()`. Zero `localStorage.getItem('currentUser')` calls remain. |
| Error Handling | ✅ Pass | All 6 API components use `error.userMessage` from `api.js` interceptor for user-facing alerts |
| Loading States | ✅ **FIXED** | AdminDashboardPage has `loading` + `error` states with early-return feedback. SystemLogsPage has `loading` + `error` states. UserManagementPage has `loading` + `error` states. ApplicationPage, ReportsPage, UserVerificationPage also have loading states. |
| Duplicate Logic | ⚠️ Warn | UserVerificationPage duplicates ApplicationPage's verify functionality with different API endpoints (`/admin/users/verify` vs `/admin/verification/approve`) — should be consolidated |

---

### 5.4 Faculty Dashboard (8 components — 6 original + 2 extracted)

| # | Component | File (lines) | What It Does | API Connected? |
|---|-----------|-------------|-------------|----------------|
| 11 | **FacultyDashboardPage** | `FacultyDashboardPage.jsx` (165) | Summary cards (total classes, students, today's attendance %), recent activity list | ✅ Real API (1 endpoint) |
| 12 | **FacultyLayout** | `FacultyLayout.jsx` (199) | Role guard + face enrollment redirect, collapsible sidebar, notification count | ✅ `useAuth()` |
| 13 | **MyClassesPage** | `MyClassesPage.jsx` (289) | Orchestrator: 3 views (List/Calendar/Upload), per-class attendance sheet, student profile — delegates Calendar + Upload to extracted components | ✅ Real API (2 endpoints) |
| 13a | **ClassCalendarView** | `ClassCalendarView.jsx` (173) | ✅ **NEW** — Monthly calendar grid + session exception bulk update modal (extracted from MyClassesPage) | ✅ Real API (1 endpoint) |
| 13b | **ScheduleUploadView** | `ScheduleUploadView.jsx` (167) | ✅ **NEW** — COR PDF upload form + upload history table (extracted from MyClassesPage) | ✅ Real API (2 endpoints) |
| 14 | **FacultyAttendancePage** | `FacultyAttendancePage.jsx` (290) | Class list → attendance details, per-student records, PDF export via ReportGenerator | ✅ Real API (2 endpoints) |
| 15 | **FacultyReportsPage** | `FacultyReportsPage.jsx` (299) | 21 report types across 2 categories, date range + status filters, PDF/CSV generation — **data from real API** | ✅ Real API (3 endpoints) |
| 15a | **reportConfig** | `reportConfig.js` (38) | ✅ **NEW** — Static report type definitions (21 report options) extracted from FacultyReportsPage |  Config only |
| 16 | **FacultyReportModal** | `FacultyReportModal.jsx` (114) | Format selection modal (PDF/CSV), report config summary, simulated processing delay | Presentational only |

#### API Calls

| Component | Line | Endpoint | Method | What It Does |
|-----------|------|----------|--------|-------------|
| FacultyDashboardPage | L51 | `/api/faculty/dashboard-stats/${userId}` | GET | ✅ **MIGRATED to `api.js`** — Fetches total classes, students, attendance %, recent logs (with `AbortController`) |
| MyClassesPage | L47 | `/api/faculty/schedule/${userId}` | GET | ✅ **MIGRATED to `api.js`** — Fetches all classes for faculty (with `AbortController`) |
| MyClassesPage | L61 | `/api/faculty/class-details/${cls.id}` | GET | ✅ **MIGRATED to `api.js`** — Fetches full student list + attendance for a class |
| ScheduleUploadView | L35 | `/api/faculty/upload-history/${userId}` | GET | ✅ **MIGRATED to `api.js`** — Fetches past COR upload records (with `AbortController`) |
| ScheduleUploadView | L59 | `/api/faculty/upload-schedule` | POST | ✅ **MIGRATED to `api.js`** — Uploads COR PDF (FormData) |
| ClassCalendarView | L48 | `/api/faculty/session-exceptions` | POST | ✅ **MIGRATED to `api.js`** — Creates session exception (cancelled/makeup/room_change) |
| FacultyAttendancePage | L31 | `/api/faculty/schedule/${userId}` | GET | ✅ **MIGRATED to `api.js`** — Fetches class list for attendance view (with `AbortController`) |
| FacultyAttendancePage | L49 | `/api/faculty/class-details/${cls.id}` | GET | ✅ **MIGRATED to `api.js`** — Fetches attendance records per class |
| FacultyReportsPage | L42-44 | `/api/faculty/reports/class-logs/${userId}` | GET | ✅ **NEW** — Fetches student attendance logs for all faculty classes (with `AbortController`) |
| FacultyReportsPage | L43 | `/api/faculty/reports/personal-logs/${userId}` | GET | ✅ **NEW** — Fetches faculty's own attendance logs (with `AbortController`) |
| FacultyReportsPage | L44 | `/api/faculty/reports/subjects/${userId}` | GET | ✅ **NEW** — Fetches faculty's taught subjects for filter dropdown (with `AbortController`) |

#### Backend Endpoints Added (faculty_reports.py — 246 lines)

| Endpoint | Method | What It Does |
|----------|--------|-------------|
| `/api/faculty/reports/class-logs/{user_id}` | GET | Student attendance logs for all classes taught by faculty. Supports `class_id`, `date_from`, `date_to`, `section`, `status` query params. Default: last 30 days. |
| `/api/faculty/reports/personal-logs/{user_id}` | GET | Faculty's own attendance logs. Supports `date_from`, `date_to`, `status` query params. Default: last 30 days. |
| `/api/faculty/reports/subjects/{user_id}` | GET | Deduplicated list of subjects taught by faculty (code, title, class_id, section) for filter dropdowns. |

#### Optimization Audit — Faculty Dashboard (post-fix, verified 2026-02-27)

| Check | Status | Details |
|-------|--------|--------|
| Hardcoded URLs | ✅ **FIXED** | All 8 API calls across 6 components migrated to `api.js` with relative URLs. Zero `http://localhost:5000` references remain. |
| AbortController | ✅ **FIXED** | FacultyDashboardPage (L33), FacultyAttendancePage (L27), MyClassesPage (L31), ScheduleUploadView (L24), FacultyReportsPage (L33) — all `useEffect` fetches have `AbortController` with cleanup. User-triggered POSTs (upload, session-exception) use `error.code === 'ERR_CANCELED'` guard. |
| Mock Data | ✅ **FIXED** | FacultyReportsPage completely rewritten: `mockClassLogs[]` and `mockPersonalLogs[]` removed. Now fetches from 3 new real endpoints via `Promise.all`. New `faculty_reports.py` router (246 lines) queries `attendance_logs`, `classes`, `subjects`, `users` tables. Subject dropdown populated dynamically. |
| AuthContext | ✅ **FIXED** | FacultyLayout, FacultyDashboardPage, FacultyAttendancePage, MyClassesPage, FacultyReportsPage all use `useAuth()`. Zero `localStorage.getItem('currentUser')` calls remain. |
| Loading States | ✅ **FIXED** | FacultyDashboardPage has `loading` state. MyClassesPage has per-section loading. FacultyReportsPage now has `loading` state with early-return feedback. |
| Error Handling | ✅ Pass | All API components use `error.userMessage` from `api.js` interceptor. `ERR_CANCELED` swallowed silently. |
| Service Layer (frontend) | ✅ **FIXED** | MyClassesPage decomposed from 617→289 lines: Calendar view extracted to `ClassCalendarView.jsx` (173 lines), Upload view extracted to `ScheduleUploadView.jsx` (167 lines). FacultyReportsPage decomposed from 552→299 lines: report config extracted to `reportConfig.js` (38 lines). All files under 300-line limit. |

---

### 5.5 Student Dashboard (5 → 9 components after decomposition)

| # | Component | File (lines) | What It Does | API Connected? |
|---|-----------|-------------|-------------|----------------|
| 17 | **StudentDashboardPage** | `StudentDashboardPage.jsx` (170) | Welcome banner, summary cards, recent activity, composes LiveClassStatus + AttendanceTrendChart. Dashboard stats + history via parallel `Promise.all` | ✅ Real API (2 endpoints) |
| 17a | **LiveClassStatus** | `LiveClassStatus.jsx` (125) | *(extracted)* Real-time class/room status with 30s `setInterval` polling + AbortController cleanup | ✅ Real API (1 endpoint) |
| 17b | **AttendanceTrendChart** | `AttendanceTrendChart.jsx` (284) | *(extracted)* SVG line chart with weekly/monthly/yearly filters, hover tooltips, area gradients | Presentational (receives `logs` prop) |
| 18 | **StudentLayout** | `StudentLayout.jsx` (223) | Verification + face enrollment guard, collapsible sidebar, dashboard data fetch for notification count | ✅ Real API (1 endpoint) |
| 19 | **SchedulePage** | `SchedulePage.jsx` (232) | Today/Week/Calendar views, COR PDF upload via FormData. AbortController cleanup + `refreshTrigger` pattern for post-upload re-fetch | ✅ Real API (2 endpoints) |
| 20 | **AttendanceHistoryPage** | `AttendanceHistoryPage.jsx` (214) | Composes date filters + AttendanceTableView. Data fetch with AbortController, smart log-to-subject mapping | ✅ Real API (2 endpoints) |
| 20a | **AttendanceTableView** | `AttendanceTableView.jsx` (159) | *(extracted)* Records table with subject filter, export button, LogStatusTag, PDF/CSV generation via StudentReportModal | Presentational (receives props) |
| 20b | **attendanceReportConfig** | `attendanceReportConfig.js` (143) | *(extracted)* `reportTypes` config, `parseTimeStr()`, `getFilteredData()`, `getDateRangeString()` — pure utilities | Config/utility |
| 21 | **StudentReportModal** | `StudentReportModal.jsx` (131) | Format selection modal (PDF/CSV), report config summary, simulated processing delay | Presentational only |

#### API Calls (post-fix — all migrated to `api.js` with relative URLs)

| Component | Line | Endpoint | Method | What It Does |
|-----------|------|----------|--------|-------------|
| LiveClassStatus | L24-26 | `/api/student/live-status/${userId}` | GET | ✅ **MIGRATED** — 30s polling with AbortController signal |
| StudentDashboardPage | L116-117 | `/api/student/dashboard/${uid}`, `/api/student/history/${uid}` | GET | ✅ **MIGRATED** — `Promise.all` with AbortController signal |
| StudentLayout | L167 | `/api/student/dashboard/${userId}` | GET | ✅ **MIGRATED** (prior fix) |
| SchedulePage | L41 | `/api/student/schedule/${userId}` | GET | ✅ **MIGRATED** — AbortController + `refreshTrigger` dep |
| SchedulePage | L88 | `/api/student/upload-cor` | POST | ✅ **MIGRATED** — `multipart/form-data` header, `error.userMessage` |
| AttendanceHistoryPage | L44 | `/api/student/schedule/${userId}` | GET | ✅ **MIGRATED** — AbortController signal |
| AttendanceHistoryPage | L62 | `/api/student/history/${userId}` | GET | ✅ **MIGRATED** — AbortController signal |

#### Optimization Audit — Student Dashboard (post-fix, verified 2026-02-27)

| Check | Status | Details |
|-------|--------|--------|
| Hardcoded URLs | ✅ **FIXED** | All 7 API calls across 4 components migrated to `api.js` with relative URLs. Zero `http://localhost:5000` references remain. |
| AbortController | ✅ **FIXED** | LiveClassStatus (L16, polling+cleanup), StudentDashboardPage (L104), SchedulePage (L34, with `refreshTrigger` dep), AttendanceHistoryPage (L31) — all `useEffect` fetches have AbortController with cleanup. User-triggered POST (upload-cor) correctly excluded. |
| Mock Data | ✅ **FIXED** | AttendanceTrendChart: removed random dummy data fallback — now shows zero-value placeholders when no logs exist instead of `Math.random()` noise. |
| Loading States | ✅ Pass | StudentDashboardPage has multi-state loading. SchedulePage + AttendanceHistoryPage have loading states + error display. |
| Error Handling | ✅ **FIXED** | All API components use `error.userMessage` from `api.js` interceptor. `ERR_CANCELED` swallowed silently. SchedulePage upload uses `error.userMessage` fallback. |
| AuthContext | ✅ Pass | All components use `useAuth()`. Zero `localStorage.getItem('currentUser')` calls. |
| Polling | ⚠️ Warn | 30s `setInterval` for live-status — uses AbortController but no exponential backoff on failure (acceptable for MVP) |
| Data Fetching | ✅ Pass | `Promise.all` for parallel dashboard + history fetch — efficient |
| Service Layer (frontend) | ✅ **FIXED** | StudentDashboardPage decomposed from 574→170 lines: LiveClassStatus extracted (125 lines), AttendanceTrendChart extracted (284 lines). AttendanceHistoryPage decomposed from 500→214 lines: config extracted to `attendanceReportConfig.js` (143 lines), table extracted to `AttendanceTableView.jsx` (159 lines). All files under 300-line limit. |

---

### 5.6 Dept Head Dashboard (7 components)

| # | Component | File (lines) | What It Does | API Connected? |
|---|-----------|-------------|-------------|----------------|
| 22 | **DeptHeadDashboardPage** | `DeptHeadDashboardPage.jsx` (253) | Summary cards (computed from user list), pending verification table with `ReviewModal`, approve/reject inline | ✅ Real API (2 endpoints) |
| 23 | **DeptHeadLayout** | `DeptHeadLayout.jsx` (164) | Role guard (`HEAD`/`DEPT_HEAD`), collapsible sidebar, Header + Outlet | ✅ `useAuth()` |
| 24 | **DeptHeadManagePage** | `DeptHeadManagePage.jsx` (373) | Subject table, create subject form, assign faculty + room modals, 3 POST operations | ✅ Real API (4 endpoints) |
| 25 | **DeptHeadReportsPage** | `DeptHeadReportsPage.jsx` (248) | 4 report types, dynamic endpoint from report config, PDF generation via ReportGenerator | ✅ Real API (dynamic endpoint) |
| 26 | **DeptHeadUserManagementPage** | `DeptHeadUserManagementPage.jsx` (588) | Full user directory with search/filter, expandable profile panel with schedule, verify/reject/delete actions | ✅ Real API (5 endpoints) |
| 27 | **DeptHeadSystemLogsPage** | `DeptHeadSystemLogsPage.jsx` (116) | Exact **copy-paste** of `AdminDashboard/SystemLogsPage` — same hardcoded mock data | ❌ **ALL MOCK DATA** |
| 28 | **DeptHeadReportModal** | `DeptHeadReportModal.jsx` (114) | Format selection modal (PDF/CSV), report config summary, simulated processing delay — identical structure to FacultyReportModal | Presentational only |

#### API Calls

| Component | Line | Endpoint | Method | What It Does |
|-----------|------|----------|--------|-------------|
| DeptHeadDashboardPage | L102 | `http://localhost:5000/api/admin/verification/list` | GET | Fetches all users → computes dept stats + pending list |
| DeptHeadDashboardPage | L129 | `http://localhost:5000/api/admin/verification/${action}` | POST | Approve/reject from ReviewModal |
| DeptHeadManagePage | L41 | `http://localhost:5000/api/dept/management-data` | GET | Fetches subjects, classes, faculty, rooms for department |
| DeptHeadManagePage | L79 | `http://localhost:5000/api/dept/create-subject` | POST | Creates new subject |
| DeptHeadManagePage | L98 | `http://localhost:5000/api/dept/assign-faculty` | POST | Assigns faculty to class |
| DeptHeadManagePage | L123 | `http://localhost:5000/api/dept/assign-room` | POST | Assigns room to class |
| DeptHeadReportsPage | L34 | `http://localhost:5000${currentReport.endpoint}` | GET | Dynamic endpoint from report type config |
| DeptHeadUserManagementPage | L74 | `http://localhost:5000/api/admin/verification/list` | GET | Fetches all users for directory |
| DeptHeadUserManagementPage | L135 | `http://localhost:5000/api/dept/user-schedule/${uid}` | GET | Fetches schedule for selected user's profile panel |
| DeptHeadUserManagementPage | L161-162 | `http://localhost:5000/api/admin/verification/approve` or `/reject` | POST | Verify/reject user |
| DeptHeadUserManagementPage | L196 | `http://localhost:5000/api/admin/user/${id}` | DELETE | Hard-deletes user |

#### Optimization Audit

| Check | Status | Details |
|-------|--------|--------|
| Hardcoded URLs | ✅ **FIXED** | All 11 instances migrated to `api.js` with relative URLs via Vite proxy |
| AbortController | ✅ **FIXED** | All `useEffect` fetches (DeptHeadDashboardPage, DeptHeadManagePage, DeptHeadReportsPage, DeptHeadUserManagementPage ×2) now have `AbortController` + cleanup |
| Mock Data | ✅ **FIXED** | DeptHeadSystemLogsPage rewritten from hardcoded mock to real `/api/admin/system-logs` with loading/error states |
| AuthContext | ✅ **FIXED** | DeptHeadLayout migrated to `useAuth()` with `onLogout` prop to sidebar. Child pages receive user via props / `useOutletContext()`. Zero `localStorage.getItem('currentUser')` calls remain. |
| Duplicate Logic | ⚠️ Warn | DeptHeadUserManagementPage still reuses same admin endpoints (by design — dept heads share admin verification workflow) |
| Duplicate Modal | ⚠️ Warn | DeptHeadReportModal is structurally identical to FacultyReportModal — could be shared |
| Loading States | ✅ **FIXED** | All components have loading/error states |
| Component Size | ✅ **FIXED** | DeptHeadUserManagementPage decomposed 588→298 lines. Extracted: `UserVerificationTab.jsx` (134), `UserDirectoryTab.jsx` (130), `UserProfilePanel.jsx` (132). DeptHeadManagePage decomposed 373→294 lines. Extracted: `DeptHeadManageModals.jsx` (117). |
| Error Handling | ✅ **FIXED** | All catch blocks use `error.userMessage` from api.js interceptor |
| Debug Statements | ✅ **FIXED** | Removed `console.log` debug statements from DeptHeadUserManagementPage |

---

### 5.7 Common Components (7 components)

| # | Component | File (lines) | What It Does | API Connected? |
|---|-----------|-------------|-------------|----------------|
| 29 | **Header** | `Header.jsx` (206) | Dynamic page title, notification bell with 60s polling, profile dropdown, outside-click detection via `useRef` | ✅ Real API — `/api/users/notifications/{id}` (endpoint in `user_features.py`) |
| 30 | **Footer** | `Footer.jsx` (52) | Static about/contact/social links | Static |
| 31 | **Logo** | `Logo.jsx` (48) | Renders `frames_logo.png` asset | Static |
| 32 | **MyProfilePage** | `MyProfilePage.jsx` (217) | Profile view/edit with toggle, password change (verify old → set new), avatar display, role-colored badges | ✅ Real API (4 endpoints) |
| 33 | **HelpSupportPage** | `HelpSupportPage.jsx` (275) | FAQ accordion (role-based static content), contact form → real `POST /api/users/support-ticket` | ✅ Real API (support ticket) + Static FAQ (by design) |
| 34 | **SettingsPage** | `SettingsPage.jsx` (221) | Notification toggles, theme selector — persisted via `GET/PUT /api/users/settings/{id}` | ✅ Real API (2 endpoints) |
| 35 | **NotificationsPage** | `NotificationsPage.jsx` (132) | Notification list with type filters from real `/api/users/notifications/{id}` endpoint | ✅ Real API |

#### API Calls

| Component | Line | Endpoint | Method | What It Does |
|-----------|------|----------|--------|-------------|
| Header | L24 | `/api/users/notifications/${user.id}` | GET | ✅ **MIGRATED to `api.js`** — 60s polling with `AbortController` for notification count — **endpoint EXISTS in `user_features.py`** (returns real role-based notifications) |
| MyProfilePage | L189 | `/api/users/${user.id}` | GET | ✅ **MIGRATED** — Fetches fresh user profile on mount |
| MyProfilePage | L209 | `/api/users/${user.id}` | PUT | ✅ **MIGRATED** — Saves edited profile fields |
| MyProfilePage | L65 | `/api/users/verify-password` | POST | ✅ **MIGRATED** — Verifies current password before change |
| MyProfilePage | L91 | `/api/users/change-password` | PUT | ✅ **MIGRATED** — Sets new password |
| NotificationsPage | NEW | `/api/users/notifications/${user.id}` | GET | ✅ **NEW** — Fetches real notifications with AbortController + loading/error states |
| HelpSupportPage | NEW | `/api/users/support-ticket` | POST | ✅ **NEW** — Submits contact form to backend with loading/error states |
| SettingsPage | NEW | `/api/users/settings/${user.id}` | GET | ✅ **NEW** — Loads persisted user preferences with AbortController |
| SettingsPage | NEW | `/api/users/settings/${user.id}` | PUT | ✅ **NEW** — Saves notification toggles + theme to backend |

#### Optimization Audit

| Check | Status | Details |
|-------|--------|--------|
| Hardcoded URLs | ✅ **FIXED** | MyProfilePage + PasswordModal migrated to `api.js` with relative URLs. Header already migrated. |
| AbortController | ✅ **FIXED** | MyProfilePage profile-fetch `useEffect` now has `AbortController` + cleanup. Header already had it. |
| Ghost Endpoint | ✅ **FIXED** | Header calls `/api/users/notifications/{id}` — endpoint **EXISTS** in `user_features.py` router (extracted from `users.py`). Returns real role-based notifications from DB (pending verifications for HEAD, attendance logs for FACULTY/STUDENT). |
| Mock Data | ✅ **FIXED** | All 4 previously-mock components now use real API: **NotificationsPage** → `GET /api/users/notifications/{id}` with AbortController + loading/error states. **HelpSupportPage** → FAQ is static role-based content (by design), contact form → `POST /api/users/support-ticket` with real backend persistence. **SettingsPage** → `GET/PUT /api/users/settings/{id}` with real backend persistence (UserSetting model + auto-created defaults). 2 new backend models: `SupportTicket`, `UserSetting`. 4 new endpoints in `user_features.py`. |
| AuthContext | ✅ **FIXED** | Header, MyProfilePage, SettingsPage, NotificationsPage, HelpSupportPage all migrated to `useAuth()`. Zero `localStorage.getItem('currentUser')` calls remain in components. |
| Method Mismatch | ✅ **VERIFIED** | Backend `/api/users/change-password` is `PUT` — PasswordModal correctly uses `api.put()` |
| Loading States | ✅ **FIXED** | MyProfilePage has loading for profile fetch. |
| Component Size | ✅ **FIXED** | MyProfilePage decomposed 357→217 lines. Extracted: `PasswordModal.jsx` (151 lines). |
| Error Handling | ✅ **FIXED** | All catch blocks use `error.userMessage` from api.js interceptor |

---

### 5.8 Kiosk Dashboard (1 component)

| # | Component | File (lines) | What It Does | API Connected? |
|---|-----------|-------------|-------------|----------------|
| 36 | **KioskDashboardPage** | `KioskDashboardPage.jsx` (198) | Full-screen kiosk UI: live video feed via `<img>` stream, WebSocket for real-time state updates, gesture indicator grid (✌️/👍/✋), recent check-ins list, clock, room/subject panel | ✅ WebSocket + Video Stream |

#### Connection Details

| Type | Line | URL | What It Does |
|------|------|-----|-------------|
| Base URL | L21 | `import.meta.env.VITE_API_URL \|\| 'http://localhost:8000'` | **Only component** using `VITE_API_URL` env var (note: port 8000, not 5000) |
| WebSocket | L22 | `${BACKEND_URL}/ws/status` | Real-time kiosk state (active class, recognized user, gestures, check-ins) |
| Video Stream | L23 | `${BACKEND_URL}/video_feed` | MJPEG stream from RPi camera |

#### Optimization Audit

| Check | Status | Details |
|-------|--------|--------|
| Hardcoded URLs | ⚠️ Partial | Uses `VITE_API_URL` env var with `localhost:8000` fallback — **different port** than rest of frontend (`5000`) |
| WebSocket Cleanup | ✅ Pass | Proper cleanup: `clearTimeout(reconnectTimeout)` + `ws.close()` in useEffect return (L68-70) |
| Auto-Reconnect | ✅ Pass | 3-second reconnect on WebSocket close (L59) |
| Offline Indicator | ✅ Pass | Shows `⚠️ OFFLINE - System is disconnected` banner when WebSocket is down |
| AbortController | N/A | No REST API calls — WebSocket-based |
| AuthContext | N/A | Kiosk is unauthenticated display — no user login |

---

### 5.9 Utilities & Test (2 files)

| # | Component | File (lines) | What It Does |
|---|-----------|-------------|-------------|
| 37 | **ReportGenerator.js** | `frontend/src/utils/ReportGenerator.js` (225) | PDF/CSV generation utility with FRAMES branding, header/footer, multi-section layout via jsPDF |
| 38 | **TestPDFPage** | `frontend/src/components/TestPDFPage.jsx` (203) | Sandbox with mock data generators — **by design** (development/testing tool) |

---

## 6. Cross-Cutting Concerns & Optimization Audit

### 6.1 N+1 Query Analysis

| Location | v1.0 | v2.0 | Details |
|----------|------|------|---------|
| `faculty.py /schedule/{user_id}` | 🔴 Critical | ✅ **RESOLVED** | Batch `GROUP BY` for enrollment + attendance counts |
| `faculty.py /dashboard-stats/{user_id}` | 🔴 Critical | ✅ **RESOLVED** | Uses `in_()` for enrollment count. `average_attendance` still hardcoded TODO |
| `faculty.py /class-details/{schedule_id}` | 🔴 Critical | ✅ **RESOLVED** | Batch attendance query + dict lookup |
| `faculty.py /class/{class_id}` | (uncounted) | ✅ **RESOLVED** | `joinedload(Enrollment.student)` |
| `kiosk.py /attendance/log` (fallback paths) | 🟡 Medium | 🟡 Medium | Some conditionals still trigger extra queries |
| `dept.py /management-data` | ⚠️ Warn | ⚠️ Improved | Uses `joinedload(Class.faculty)` but still queries classes per subject in loop |

**Impact of Fix:** For a faculty with 5 classes × 30 students:
- **Before (v1.0):** `/class-details` fired 1 + 5 + (5 × 30) = **156 queries**
- **After (v2.0):** `/class-details` fires **3 queries** (class + enrollments batch + attendance batch)

---

### 6.2 Database Configuration Audit

| Setting | v1.0 | v2.0 | Required | Status |
|---------|------|------|----------|--------|
| `echo` | `True` | **`False`** | `False` | ✅ **FIXED** |
| `pool_size` | `2` | **`5`** | `5` | ✅ **FIXED** |
| `max_overflow` | `3` | **`5`** | `5` | ✅ **FIXED** |
| `pool_pre_ping` | `True` | `True` | `True` | ✅ Pass |
| `pool_recycle` | Missing | **`300`** | `300` | ✅ **FIXED** |
| `pool_timeout` | Missing | **`30`** | `30` | ✅ **FIXED** |

**Location:** `backend/db/database.py` — **ALL ITEMS RESOLVED** ✅

---

### 6.3 Index Audit

| Table.Column | v1.0 | v2.0 |
|-------------|------|------|
| `attendance_logs.user_id` | ❌ Missing | ✅ **FIXED** |
| `attendance_logs.class_id` | ❌ Missing | ✅ **FIXED** |
| `attendance_logs.device_id` | ❌ Missing | ✅ **FIXED** |
| `attendance_logs.timestamp` | ❌ Missing | ✅ **FIXED** |
| `attendance_logs.action` | ❌ Missing | ✅ **FIXED** |
| `attendance_logs.is_late` | N/A | ✅ **ADDED** |
| `attendance_logs(user_id, class_id, timestamp)` composite | ❌ Missing | ✅ **FIXED** |
| `classes.faculty_id` | ❌ Missing | ✅ **FIXED** |
| `classes.subject_id` | ❌ Missing | ✅ **FIXED** |
| `classes.room` | ❌ Missing | ✅ **FIXED** |
| `classes.day_of_week` | ❌ Missing | ✅ **FIXED** |
| `enrollments.student_id` | ❌ Missing | ✅ **FIXED** |
| `enrollments.class_id` | ❌ Missing | ✅ **FIXED** |
| `users.role` | ❌ Missing | ✅ **FIXED** |
| `users.verification_status` | ❌ Missing | ✅ **FIXED** |
| `users.department_id` | ❌ Missing | ✅ **FIXED** |
| `devices.room` | ❌ Missing | ✅ **FIXED** |
| `audit_log.user_id` | N/A | ✅ **ADDED** |
| `audit_log.event_type` | N/A | ✅ **ADDED** |
| `security_log.user_id` | N/A | ✅ **ADDED** |
| `security_log.event_type` | N/A | ✅ **ADDED** |
| `system_metric.metric_type` | N/A | ✅ **ADDED** |
| `session_exception.class_id` | N/A | ✅ **ADDED** |
| `session_exception.exception_type` | N/A | ✅ **ADDED** |
| `session_exception.session_date` | N/A | ✅ **ADDED** |

**ALL 16 original missing indexes RESOLVED + 8 additional indexes added** ✅

---

### 6.4 Frontend Architecture Violations

> **PARTIALLY RESOLVED — 21 frontend files changed (AuthContext + centralized API client)**

| Violation | v1.0 Status | v2.0 Status | Details |
|-----------|-------------|-------------|--------|
| No `AuthContext` | ❌ ALL files use `localStorage` directly | ✅ **RESOLVED** | `context/AuthContext.jsx` created (106 lines). 16 components migrated to `useAuth()`. Zero direct `localStorage.getItem('currentUser')` calls remain in components. |
| Hardcoded `http://localhost:5000` | ❌ **16 files** with 26+ calls | ✅ **RESOLVED** | `services/api.js` created (63 lines). All components migrated. Sections 5.1–5.7 fully fixed. Zero `http://localhost:5000` remains in components. 7 new backend endpoints added (`admin_dashboard.py` + `faculty_reports.py`). |
| No `AbortController` | ❌ **36 of 37** components | ✅ **RESOLVED** | Added to all `useEffect`-based data fetches across Sections 5.1–5.7: Header, ApplicationPage, UserVerificationPage, AdminDashboardPage, SystemLogsPage, UserManagementPage, FacultyDashboardPage, FacultyAttendancePage, MyClassesPage, ScheduleUploadView, FacultyReportsPage, StudentDashboardPage, LiveClassStatus, SchedulePage, AttendanceHistoryPage, DeptHeadDashboardPage, DeptHeadManagePage, DeptHeadReportsPage, DeptHeadUserManagementPage (×2), DeptHeadSystemLogsPage, MyProfilePage. FaceEnrollmentPage uses ref-based cleanup. KioskDashboardPage uses WebSocket cleanup (N/A for AbortController). |
| No route guards | ❌ Layouts do manual role checks | ❌ **UNCHANGED** | `hasRole()` available via `useAuth()` but no `<ProtectedRoute>` component yet |
| Mock data in production | ❌ **11 components** | ✅ **RESOLVED** | Fixed: AdminDashboardPage, SystemLogsPage, UserManagementPage, FacultyReportsPage, AttendanceTrendChart, DeptHeadSystemLogsPage → real API. NotificationsPage → `/api/users/notifications/{id}`. HelpSupportPage contact form → `/api/users/support-ticket`. SettingsPage → `/api/users/settings/{id}`. **0 mock-data components remain** (TestPDFPage is by design). |
| No `VITE_API_BASE_URL` | ❌ Not referenced | ❌ **UNCHANGED** | `api.js` uses relative `/api` which works via Vite proxy in dev; needs env var for prod |
| Missing loading states | ❌ 8+ components | ✅ **RESOLVED** | All data-fetching components now have loading/error states |
| Duplicate component | ❌ `DeptHeadSystemLogsPage` | ✅ **RESOLVED** | Rewritten to use real API (same endpoint as AdminDashboard/SystemLogsPage) with its own loading/error states |

---

### 6.5 Security Violations

> **UNCHANGED from v1.0 — no security work in PR #26**

| Violation | Severity | Location | Details |
|-----------|----------|----------|---------|
| No JWT authentication | 🔴 Critical | All routers | User ID from URL, anyone can impersonate |
| CORS allow_origins=["*"] | 🔴 Critical | `backend/main.py` | All origins allowed |
| No rate limiting | 🔴 Critical | `/api/auth/login`, `/api/face/enroll` | Brute force / DoS risk |
| `str(e)` in HTTP responses | 🟡 Medium | faculty.py, kiosk.py | Internal error leakage |
| `print()` instead of `logging` | 🟡 Medium | auth.py, admin.py, faculty.py, kiosk.py | No structured logging |
| No input size limit on PDF upload | 🟡 Medium | faculty.py | Could accept arbitrarily large files |
| User password in plain response | ⚠️ Check | auth.py login | Verify hashed_password not in response |

---

### 6.6 `datetime.utcnow()` Usage

> **ALL RESOLVED in PR #26** ✅

| Model | Field | v1.0 | v2.0 |
|-------|-------|------|------|
| `attendance_log.py` | `timestamp` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `audit_log.py` | `timestamp` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `device.py` | `last_heartbeat` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `security_log.py` | `timestamp` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `system_metric.py` | `recorded_at` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `user.py` | `created_at` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `user.py` | `updated_at` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `user.py` | `last_login` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `enrollment.py` | `enrolled_at` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |
| `session_exception.py` | `created_at` | ❌ `datetime.utcnow` | ✅ `datetime.now(timezone.utc)` |

---

### 6.7 RPi Kiosk Missing Features

> **UNCHANGED from v1.0 — zero RPi files modified in PR #26**

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

### By Category — v1.0 → v2.0 Comparison

| Category | v1.0 Critical 🔴 | v2.0 Critical 🔴 | v1.0 Warning 🟡 | v2.0 Warning 🟡 | Change |
|----------|------------------|------------------|-----------------|-----------------|--------|
| N+1 Queries | 3 | **0** | 1 | 1 | **-3 critical resolved** |
| Missing Indexes | 16 | **0** | 0 | 0 | **-16 critical resolved** |
| Database Config | 3 | **0** | 2 | 0 | **-3 critical, -2 warn resolved** |
| `datetime.utcnow` | 0 | 0 | 10 | **0** | **-10 warnings resolved** |
| No Authentication (JWT) | 1 | 1 | 0 | 0 | — |
| Hardcoded URLs (Frontend) | 1 | **0** | 0 | 0 | **-1 crit resolved (api.js created, all components migrated, sections 5.1–5.7 complete)** |
| No AbortController | 1 | **0** | 0 | 0 | **-1 crit resolved (all useEffect fetches across sections 5.1–5.7 have cleanup)** |
| No AuthContext | 1 | **0** | 0 | 0 | **-1 critical resolved (AuthContext + 16 components)** |
| CORS Wildcard | 1 | 1 | 0 | 0 | — |
| No Rate Limiting | 2 | 2 | 0 | 0 | — |
| Mock Data in Production | 0 | 0 | 11 | **0** | **-11 warnings resolved (AdminDashboard 3 + FacultyReports 1 + StudentChart 1 + DeptHeadSystemLogs 1 + Notifications 1 + HelpSupport 1 + Settings 1 + Header already real + MyProfile already real)** |
| `print()` Usage | 0 | 0 | 4+ | 4+ | — |
| RPi Missing Features | 5 | 5 | 1 | 1 | — |
| No Pagination | 0 | 0 | 3 | 3 | — |
| No Service Layer | 0 | 0 | 4 | 4 | — |
| **TOTAL** | **28** | **4** | **19** | **12** | **-24 crit, -7 warn net** |

### By Tier — v2.0

| Tier | Critical | Warning | Total |
|------|----------|---------|-------|
| Backend API | 4 | 9 | 13 |
| Frontend | 0 | 7 | 7 |
| RPi Kiosk | 5 | 2 | 7 |
| Database/Models | 0 | 0 | **0** ← all resolved |

---

## 8. Priority Remediation Plan

### ✅ COMPLETED (PR #26 — Backend Optimization)

| # | Task | Status | Resolved By |
|---|------|--------|-------------|
| P0 #1 | Add `index=True` to all FK columns + composite index on attendance_logs | ✅ **DONE** | All 13 model files updated, 16 original + 8 additional indexes |
| P0 #2 | Fix N+1 queries in faculty.py (schedule, dashboard-stats, class-details) | ✅ **DONE** | `joinedload()` + batch `GROUP BY` + dict lookup |
| P0 #4 | Set `echo=False`, add `pool_recycle=300`, `pool_timeout=30` in database.py | ✅ **DONE** | All 6 config values correct |
| P1 #10 | Replace `datetime.utcnow` with `datetime.now(timezone.utc)` in all models | ✅ **DONE** | All 10 locations in all 13 model files |
| — | Fix admin approve/reject contract (PUT→POST to match frontend) | ✅ **DONE** | `VerificationRequest` Pydantic body model |

---

### 🔴 P0 — Must Fix Before ANY Deployment (Remaining)

| # | Task | Est. Effort | Impact |
|---|------|-------------|--------|
| 3 | Create `frontend/src/services/api.js` centralized client, replace all hardcoded URLs | 2-3 hours | Deployment blocker — `http://localhost:5000` in 16 files |
| 5 | Fix FaceRecognizer default model (`buffalo_sc` → `buffalo_l`) | 5 min | Prevents embedding mismatch — silent recognition failure if default used |

### 🟡 P1 — Must Fix Before Demo/Release

| # | Task | Est. Effort | Impact |
|---|------|-------------|--------|
| 6 | Implement JWT authentication (backend + frontend token handling) | 6-8 hours | Security requirement — anyone can impersonate any user |
| 7 | Create AuthContext, replace all localStorage parsing | 3-4 hours | Frontend architecture — fragile state management |
| 8 | Add AbortController to all useEffect fetches | 3-4 hours | Prevents memory leaks — 36 of 37 components affected |
| 9 | Add pagination to admin verification/list, faculty session-exceptions | 1-2 hours | Prevents OOM on large datasets |
| 11 | Add SIGTERM handler + periodic cache refresh to kiosk | 1-2 hours | RPi stability for systemd deployment |

### 🟢 P2 — Should Fix Before Production

| # | Task | Est. Effort | Impact |
|---|------|-------------|--------|
| 12 | Extract service layer from routers (faculty_service, kiosk_service) | 4-6 hours | Code maintainability — faculty.py is 694 lines |
| 13 | Replace all `print()` with `logging` | 1-2 hours | Production observability — affects auth.py, admin.py, faculty.py, kiosk.py |
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
| 22 | Implement functional Settings page | 3-4 hours | Feature completeness |
| 23 | Implement functional Notifications from backend | 4-6 hours | Feature completeness |
| 24 | Add structured error responses (error codes, not raw strings) | 2-3 hours | API contract consistency |
| 25 | Add ondelete behavior to all FK relationships in models | 1 hour | Data integrity |

---

## Complete Process Inventory (43 Total)

### Backend API — 43 Endpoints

| # | Process | Endpoint | Router File | Method | Changed in v2? |
|---|---------|----------|-------------|--------|----------------|
| 1 | User Login | `/api/auth/login` | auth.py | POST | — |
| 2 | User Registration | `/api/auth/register` | auth.py | POST | — |
| 3 | Validate Face (stub) | `/api/auth/validate-face` | auth.py | POST | — |
| 4 | List Verification Queue | `/api/admin/verification/list` | admin.py | GET | — |
| 5 | Approve User | `/api/admin/verification/approve` | admin.py | **POST** | 🔄 Was PUT+{id}, now POST+body |
| 6 | Reject User | `/api/admin/verification/reject` | admin.py | **POST** | 🔄 Was PUT+{id}, now POST+body |
| 7 | Delete User | `/api/admin/user/{user_id}` | admin.py | DELETE | — |
| 8 | Faculty Schedule | `/api/faculty/schedule/{id}` | faculty.py | GET | 🔄 N+1 fixed |
| 9 | Faculty Dashboard Stats | `/api/faculty/dashboard-stats/{id}` | faculty.py | GET | 🔄 Improved |
| 10 | Create Subject | `/api/faculty/subjects` | faculty.py | POST | — |
| 11 | Get Class Detail | `/api/faculty/class/{id}` | faculty.py | GET | 🔄 N+1 fixed |
| 12 | Upload History | `/api/faculty/upload-history` | faculty.py | GET | — |
| 13 | Upload Schedule PDF | `/api/faculty/upload-schedule` | faculty.py | POST | — |
| 14 | Get Class Details Full | `/api/faculty/class-details/{id}` | faculty.py | GET | 🔄 N+1 fixed |
| 15 | Create Session Exception | `/api/faculty/session-exceptions` | faculty.py | POST | — |
| 16 | Update Session Exception | `/api/faculty/session-exceptions/{id}` | faculty.py | PUT | — |
| 17 | Delete Session Exception | `/api/faculty/session-exceptions/{id}` | faculty.py | DELETE | — |
| 18 | List Faculty Exceptions | `/api/faculty/session-exceptions-by-faculty/{id}` | faculty.py | GET | — |
| 19 | Get Late Threshold | `/api/faculty/class/{id}/late-threshold` | faculty.py | GET | — |
| 20 | Set Late Threshold | `/api/faculty/class/{id}/late-threshold` | faculty.py | PUT | — |
| 21 | Student Live Status | `/api/student/live-status/{id}` | student.py | GET | — |
| 22 | Student Dashboard | `/api/student/dashboard/{id}` | student.py | GET | — |
| 23 | Student Schedule | `/api/student/schedule/{id}` | student.py | GET | — |
| 24 | Student Attendance History | `/api/student/history/{id}` | student.py | GET | — |
| 25 | Get User Profile | `/api/users/{id}` | users.py | GET | — |
| 26 | Update User Profile | `/api/users/{id}` | users.py | PUT | — |
| 27 | Verify Password | `/api/users/verify-password` | users.py | POST | — |
| 28 | Change Password | `/api/users/change-password` | users.py | POST | — |
| 29 | Face Enrollment | `/api/face/enroll` | face.py | POST | — |
| 30 | Face Status | `/api/face/status/{id}` | face.py | GET | — |
| 31 | Kiosk Active Class | `/api/kiosk/active-class` | kiosk.py | GET | — |
| 32 | Kiosk Schedule | `/api/kiosk/schedule` | kiosk.py | GET | — |
| 33 | Log Attendance | `/api/kiosk/attendance/log` | kiosk.py | POST | — |
| 34 | Class Enrolled Users | `/api/kiosk/class/{id}/enrolled` | kiosk.py | GET | — |
| 35 | Attendance State | `/api/kiosk/attendance-state` | kiosk.py | GET | — |
| 36 | Device Info | `/api/kiosk/device/{id}` | kiosk.py | GET | — |
| 37 | Device Heartbeat | `/api/kiosk/device/heartbeat` | kiosk.py | POST | — |
| 38 | Kiosk Late Threshold | `/api/kiosk/late-threshold/{id}` | kiosk.py | GET | — |
| 39 | Dept Management Data | `/api/dept/management-data` | dept.py | GET | 🔄 VERIFIED filter |
| 40 | Create Subject (Dept) | `/api/dept/create-subject` | dept.py | POST | — |
| 41 | Assign Faculty | `/api/dept/assign-faculty` | dept.py | POST | 🔄 Verification check |
| 42 | Assign Room | `/api/dept/assign-room` | dept.py | POST | — |
| **43** | **User Schedule** | **`/api/dept/user-schedule/{user_id}`** | **dept.py** | **GET** | **🆕 NEW** |

### Backend Services — 4 Service Files, 18 Functions

_(Unchanged from v1.0 — no service files were modified)_

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

### RPi Kiosk — 9 Modules, 17 Key Functions

_(Unchanged from v1.0 — no RPi files were modified)_

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

### Frontend — 38 Components, 35+ API Calls

_(Unchanged from v1.0 — no frontend files were modified)_

| # | Component | Key Processes |
|---|-----------|--------------|
| 1 | LandingPage | Login modal (L24: POST `/auth/login`), role selection → registration redirect |
| 2 | RegistrationPage | 2-step registration flow (L110: POST `/auth/register`), status pages |
| 3 | FaceEnrollmentPage | Webcam capture (15 frames), POST `/api/face/enroll` via `api.js`, ref-based cleanup |
| 4 | AdminDashboardPage | Dashboard display (mock data) |
| 5 | AdminLayout | Role guard, red theme, sidebar |
| 6 | ApplicationPage | User verification: approve/reject/delete (4 API calls) |
| 7 | ReportsPage | 14 report types, PDF generation (1 API call) |
| 8 | SystemLogsPage | Log display (mock data) |
| 9 | UserManagementPage | User listing (mock data) |
| 10 | UserVerificationPage | Legacy verification page (3 fetch() calls to `127.0.0.1:5000`) |
| 11 | FacultyDashboardPage | Faculty stats display (1 API call) |
| 12 | FacultyLayout | Role + face enrollment guard, sidebar |
| 13 | MyClassesPage | 3-view class management, PDF upload, session exceptions (5 API calls) |
| 14 | FacultyAttendancePage | Attendance sheet view, PDF export (2 API calls) |
| 15 | FacultyReportsPage | 21 report types (mock data) |
| 16 | FacultyReportModal | Format selection modal (presentational) |
| 17 | StudentDashboardPage | Live class polling (30s) with AbortController, trend chart (3 API calls) |
| 18 | StudentLayout | Verification + face guard, notification count (1 API call) |
| 19 | SchedulePage | Weekly schedule, COR upload (2 API calls) |
| 20 | AttendanceHistoryPage | 8 report types, smart subject mapping (2 API calls) |
| 21 | StudentReportModal | Format selection modal (presentational) |
| 22 | DeptHeadDashboardPage | Department overview + pending verifications (2 API calls) |
| 23 | DeptHeadLayout | Role guard, sidebar |
| 24 | DeptHeadManagePage | Subject/faculty/room management (4 API calls) |
| 25 | DeptHeadReportsPage | 4 department report types (1 API call) |
| 26 | DeptHeadUserManagementPage | User directory + verification (5 API calls) |
| 27 | DeptHeadSystemLogsPage | Exact copy of SystemLogsPage (mock data) |
| 28 | DeptHeadReportModal | Format selection modal (presentational) |
| 29 | Header | Dynamic title, notification polling (1 API call — ghost endpoint) |
| 30 | Footer | Static content |
| 31 | Logo | Renders frames_logo.png |
| 32 | MyProfilePage | Profile editing, password change (4 API calls) |
| 33 | HelpSupportPage | FAQ accordion (mock data) |
| 34 | SettingsPage | Notification toggles (mock, no persistence) |
| 35 | NotificationsPage | Notification list (mock data) |
| 36 | KioskDashboardPage | WebSocket kiosk UI, video stream, gesture grid |
| 37 | ReportGenerator.js | PDF/CSV generation utility |
| 38 | TestPDFPage | Sandbox with mock data generators — by design |

---

**End of Audit — Version 2.0**
