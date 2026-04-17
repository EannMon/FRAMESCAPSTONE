# FRAMES System Architecture — Full Audit

## System Components & Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRAMES Architecture                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│  │  React SPA   │◄──►│  FastAPI      │◄──►│  PostgreSQL (Aiven)  │ │
│  │  (Frontend)  │    │  (Backend)    │    │  16 tables           │ │
│  │  Vite + MUI  │    │  Uvicorn      │    └───────────────────────┘ │
│  └──────────────┘    └──────┬───────┘                               │
│         ▲                   │                                       │
│         │                   │ REST API                              │
│         │                   ▼                                       │
│  ┌──────────────┐    ┌──────────────┐                               │
│  │  Kiosk React │◄──►│  Kiosk Server│    ┌───────────────────────┐ │
│  │  (Browser UI)│    │  (RPi/Laptop)│◄──►│  Local Cache Files    │ │
│  │  WebSocket   │    │  FastAPI+     │    │  - embeddings.json   │ │
│  │  MJPEG feed  │    │  Threading    │    │  - schedule.json     │ │
│  └──────────────┘    └──────────────┘    │  - offline_queue.json │ │
│                           │               └───────────────────────┘ │
│                      ┌────┴────┐                                    │
│                      │ Camera  │                                    │
│                      │ USB/CSI │                                    │
│                      └─────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File-by-File Audit Summary

### RPi / Kiosk Layer

| File | Lines | Purpose | Issues Found |
|------|-------|---------|-------------|
| `rpi/config.py` | 182 | Platform config with auto-detection | ✅ Well-structured. Environment-driven defaults. |
| `rpi/camera.py` | 191 | Camera abstraction (OpenCV + picamera2) | ⚠️ No reconnection logic after disconnect |
| `rpi/face_detector.py` | ~100 | MediaPipe BlazeFace wrapper | ✅ Clean, focused |
| `rpi/face_recognizer.py` | 168 | InsightFace embedding extraction | ⚠️ Lazy init blocks recognition thread on first frame |
| `rpi/gesture_detector.py` | 435 | MediaPipe Hands gesture detection | ⚠️ Thumbs up detection too strict (all 4 fingers must be curled) |
| `rpi/embedding_cache.py` | 237 | In-memory face matching (batch cosine similarity) | ✅ Efficient O(n) batch matching |
| `rpi/schedule_resolver.py` | 267 | Active class resolution with API + cache fallback | ⚠️ Does NOT check session_exceptions table |
| `rpi/attendance_logger.py` | 198 | Attendance logging with offline queue | ✅ Good offline resilience |
| `rpi/metrics_collector.py` | 206 | Performance metrics collection | ⚠️ Logs only to console, never writes to system_metrics table |
| `rpi/main_kiosk.py` | 838 | Standalone kiosk (cv2.imshow mode) | ⚠️ Single-threaded, gesture blocks camera |
| `rpi/kiosk_server.py` | 894 | Streaming kiosk (FastAPI + MJPEG + WebSocket) | ⚠️ Thread startup race causes initial freeze |

### Backend API Layer

| File | Purpose | Issues Found |
|------|---------|-------------|
| `api/routers/kiosk.py` | Kiosk endpoints (active-class, attendance, embeddings) | ⚠️ Room matching uses simple lower/trim, not canonical normalization |
| `api/routers/faculty.py` | Faculty endpoints (schedule, classes) | ⚠️ Some N+1 patterns may exist in complex endpoints |
| `api/routers/student.py` | Student endpoints (dashboard, history) | ✅ Uses service layer |
| `api/routers/admin.py` | Admin endpoints (user management) | ⚠️ No audit logging when approving/rejecting users |
| `api/routers/reports.py` | Report generation | ✅ Well-optimized with caching |
| `api/routers/auth.py` | JWT authentication | ✅ Implemented with role-based access |

### Data Models

| Model | Table | Status |
|-------|-------|--------|
| `User` | `users` | ✅ Active, well-indexed |
| `FacialProfile` | `facial_profiles` | ✅ Active, CASCADE delete |
| `Class` | `classes` | ✅ Active, room + day indexed |
| `Subject` | `subjects` | ✅ Active |
| `Enrollment` | `enrollments` | ✅ Active, indexed |
| `AttendanceLog` | `attendance_logs` | ✅ Active, composite index present |
| `Device` | `devices` | ✅ Active |
| `Department` | `departments` | ✅ Active |
| `Program` | `programs` | ✅ Active |
| `College` | `colleges` | ✅ Active |
| `SessionException` | `session_exceptions` | ❌ Defined but NOT checked in active-class resolution |
| `SystemMetric` | `system_metrics` | ❌ Defined but NO code populates it |
| `SecurityLog` | `security_logs` | ❌ Defined but NO code populates it |
| `AuditLog` | `audit_logs` | ❌ Defined but NO middleware auto-logs |
| `Notification` | `notifications` | ⚠️ Partially used (overcrowding only) |
| `UserInvite` | `user_invites` | ⚠️ Partially used |

### Services

| File | Purpose | Status |
|------|---------|--------|
| `services/face_enrollment.py` | Face enrollment with duplicate detection | ✅ Solid with 0.55 duplicate threshold |
| `services/pdf_parser.py` | Schedule PDF extraction | ✅ Handles COR format |
| `services/gesture_detection.py` | Gesture detection (backend mirror) | ✅ |
| `services/report_service.py` | 40+ report types | ✅ Well-cached, comprehensive |

---

## Critical Issues (Sorted by Priority)

### 🔴 P0 — Affects Correctness

| # | Issue | Impact | Fix Effort |
|---|-------|--------|-----------|
| 1 | Session exceptions not checked in active-class query | Cancelled classes still trigger attendance | 2-4 hours |
| 2 | Embedding cache refresh only reloads local file, never downloads from API | New enrollments require kiosk restart | 2-3 hours |
| 3 | `_fetch_attendance_state()` called on EVERY recognition (synchronous) | Blocks recognition for 1-5s on slow networks | 4-6 hours |

### 🟡 P1 — Affects Reliability

| # | Issue | Impact | Fix Effort |
|---|-------|--------|-----------|
| 4 | Camera has no reconnection logic | USB disconnect requires full restart | 3-4 hours |
| 5 | InsightFace lazy init blocks recognition thread | First recognition freezes UI for 10-30s | 1-2 hours |
| 6 | Room name normalization inconsistent | Mismatched room names = missed schedules | 3-4 hours |
| 7 | Thumbs up gesture too strict | Users struggle with break-in action | 1-2 hours |

### 🟢 P2 — Affects Observability

| # | Issue | Impact | Fix Effort |
|---|-------|--------|-----------|
| 8 | System metrics never written to DB | No historical performance data | 4-6 hours |
| 9 | Security logs never written to DB | No security event tracking | 4-6 hours |
| 10 | Audit logs not auto-generated | No admin action trail | 6-8 hours |
| 11 | Emoji display on RPi screen | Cosmetic — thumbs up shows as box | 30 min |

---

## What Works Well

1. **Offline resilience** — Attendance queued to JSON when API is down, flushed on reconnect
2. **Two-stage gated detection** — MediaPipe gate before InsightFace on RPi saves significant CPU
3. **Batch cosine similarity** — O(n) matching with precomputed matrix is fast and efficient
4. **Auto-exit** — Users who forget to exit are auto-logged when class ends
5. **Dual-mode kiosk** — Both standalone (cv2) and streaming (FastAPI + React) modes
6. **Platform auto-detection** — Config adapts to RPi vs laptop automatically
7. **Schedule cache fallback** — Kiosk works even if backend is temporarily unreachable
8. **Cooldown system** — Prevents duplicate scans within 10 seconds
9. **NOT_IN_CLASS tracking** — Recognizes students not enrolled in the current class (logged once per session)
10. **Report system** — 40+ report types with caching, covers faculty, student, department, and admin views
