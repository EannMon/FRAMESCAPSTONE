# FRAMES Project Changelog

All notable changes to the FRAMES (Facial Recognition Attendance and Monitoring System) project are documented here.

---

## [Unreleased — Planned for Next Session]

### 🔜 Upcoming: Data Minimization & Testing Sprint
- **Data Minimization** — Audit and delete all unnecessary/redundant data from database columns
  - Review `users` table for stale or unused profile fields
  - Remove placeholder/test records from production database
  - Identify columns that are consistently null and evaluate removal or deprecation
- **Testing & Improvement** — Expand test coverage and harden existing features
  - Write unit tests for attendance state machine (ENTRY → BREAK_OUT → BREAK_IN → EXIT)
  - Write integration tests for key API endpoints (student, faculty, admin routes)
  - Improve and stress-test the face recognition pipeline for edge cases
  - Validate student metrics (attendance rate, punctuality rate) against real data

---

## [Polishing Sprint — Pt. 2] — 2026-02-27 to 2026-03-04

**Branch:** `polishing`  
**Commits:** `868a3b7` (implemented MUSTFIXANDANALYZE.MD), `4721f1a` (fixed git ignore)

### Backend Changes

#### Student Metrics Endpoint (Task 60)
- Added `StudentMetricsResponse` Pydantic schema with 10 fields: attendance rate, punctuality rate, tiers, tier colors, and session counts
- Added `_classify_tier()` helper implementing the 4-tier system:
  - ≥95% → **Compliant** (`#2E7D32`)
  - 85–94% → **Acceptable** (`#1565C0`)
  - 75–84% → **Warning** (`#F9A825`)
  - <75% → **Probation** (`#C62828`)
- Added `GET /api/student/metrics/{user_id}` endpoint — calculates real attendance rate and punctuality rate using session-based (distinct date + class) deduplication (max 3 DB queries)
- Fixed `GET /api/student/dashboard/{user_id}` — replaced fake `min(total_attendance * 10, 100)%` formula with real session-based attendance rate calculation

#### New Models Added
- `College` model (`backend/models/college.py`) — academic college entity linking to departments
- `Notification` model (`backend/models/notification.py`) — user notifications with `NotificationType` enum (10 values: ATTENDANCE_ENTRY, ATTENDANCE_BREAK, ATTENDANCE_EXIT, LATE_ALERT, ABSENT_CONSECUTIVE, SESSION_EXCEPTION, VERIFICATION_APPROVED, VERIFICATION_REJECTED, SYSTEM_ALERT, GENERAL)
- `Department` model updated — added `college_id` FK, `semester_start_date`, `semester_end_date` columns
- `User` model updated — added `employee_id` for faculty/head users

### Frontend Changes

#### Student Dashboard (Task 60)
- `StudentSummaryCard` — added `subtitle`/`subtitleColor` props for tier badge display
- `StudentSummaryCards` — now shows real attendance rate and real punctuality rate with colored tier badges (replaces hardcoded "On Time")
- NEW `StudentMetricsPanel` component — progress bars, session counts (X / Y sessions), on-time/late breakdown, tier badges with color coding
- `AttendanceTrendChart` — changed filter from YEARLY to SEMESTRAL (5 occurrences updated)

#### Faculty Dashboard (Task 55 & 56)
- Added `LiveRoomStatus` component with 2-view dropdown (Personal / Classroom)
- Added 3 new backend endpoints: `GET /faculty/live-room-status/{user_id}`, `GET /faculty/live-room-status-dept/{dept_id}`, `GET /faculty/personal-live-status/{user_id}`
- `AttendanceTrendChart` — Semestral filter added

#### Department Head Dashboard (Task 31 & 32)
- Added `DeptHeadLiveStatus` component with 3-view dropdown (Department Overview / Room-by-Room / My Classes)
- `AttendanceTrendChart` — 4-option dropdown (Today / Weekly / Semestral / Comparative)
- Removed hardcoded room filters (326/322)

### Documentation Changes

#### New Documents Created
- `documentation/FACE_RECOGNITION_THRESHOLD_ANALYSIS.md` (Task 68) — Analysis of current threshold (0.35), recommendation for production (0.40), tier system (Standard/Elevated/Strict), factors affecting accuracy, monitoring guidance
- `documentation/audit/FRAMES_Process_Audit_v4.md` (Task 69) — Comprehensive audit comparing v3→v4 status:
  - Security: 0% → 75% (JWT, rate limiting, CORS, input validation)
  - Frontend: 5% → 60% (API client, AuthContext, AbortController ~60% coverage)
  - Testing: still 0% (no test files yet — carried to next sprint)
  - Remaining backlog prioritized P0/P1/P2/P3

#### Data Dictionary (Task 70)
- Updated `documentation/database/FRAMES_Data_Dictionary.md` to **v3.0** (February 27, 2026):
  - Added `colleges` table documentation
  - Added `notifications` table documentation with full column/index details
  - Added `notificationtype` enum (10 values)
  - Added 3 missing `departments` columns: `college_id`, `semester_start_date`, `semester_end_date`
  - Added `users.employee_id` column
  - Fixed `users.email` and `users.tupm_id` nullable (No → Yes, aligned with model)
  - Removed `departments.active_academic_year`/`active_semester` incorrect defaults
  - Removed `support_tickets` and `user_settings` table sections (no ORM models exist)
  - Removed `ticketstatus` enum (unused)
  - Updated FK map (18 relationships), enum usage map, data volume estimates
  - Total documented tables: 16

---

## [Polishing Sprint — Pt. 1] — 2026-02-01 to 2026-02-26

**Branch:** `polishing`  
**Commit:** `868a3b7` (part of same branch)

### Summary
First major polishing sprint implementing Tasks 1, 3, 6, 8, 9, 10–22, 24–28, 29/54/65/67, 30, 32–39, 40–42, 43, 44–46, 47–49, 50–53, 57, 58, 59, 61, 62–64, 66 from `MUSTFIXANDANALYZE.MD`.

### Key Areas Completed
- **Authentication**: JWT dual-token system (access 24h / refresh 7d), `core/auth.py`, `get_current_user` dependency, `require_role()` factory, role-based route protection
- **Rate Limiting**: `slowapi` integration on 9 critical endpoints (login, register, enroll, kiosk attendance, schedule upload)
- **Structured Errors**: `core/errors.py` with `api_error()` helper and standardized JSON error shape
- **Frontend API Client**: Centralized `services/api.js` with JWT interceptor and 401 redirect; zero hardcoded `localhost` URLs
- **AuthContext**: `AuthContext.jsx` and `useAuth()` hook; `ProtectedRoute` component with role guards
- **AbortController**: Added to ~60% of `useEffect` fetch calls
- **Database**: `pool_recycle=300`, `pool_timeout=30`, `pool_pre_ping=True`, `echo=False`; all FK columns indexed; `datetime.utcnow` replaced with `datetime.now(timezone.utc)`
- **Logging**: `logging.basicConfig()` in `main.py`; all `print()` statements removed from routers; module-level loggers
- **Health Endpoint**: `GET /api/health` with DB connectivity check
- **New Models**: College, Notification, Department (extended), User (extended)
- **Admin Panel**: User verification, department management, real data endpoints
- **Reports**: PDF generation with jsPDF + autoTable for all 3 roles (student, faculty, dept head)
- **N+1 Fixes**: Faculty schedule, student dashboard, kiosk endpoints — all converted to batch/JOIN queries
- **Session Exception Management**: Faculty CRUD for marking online/cancelled/holiday sessions
- **Offline Kiosk Mode**: Attendance queued to `offline_attendance.json` when backend unreachable

---

## [Pre-Polishing] — Before 2026-02-01

**Branch:** `main`

### Commits of note (from `origin/main`)
- `425061e` — fix: camera thread crash + realistic laptop performance thresholds
- `8377f07` — fix: dept head user management — dept-scoped list + modal action buttons
- `633c491` — fix: increase face enrollment timeout to 120s, add helpful timeout error message

---

*Next planned work: Data minimization audit + test suite implementation (see Unreleased section above).*
