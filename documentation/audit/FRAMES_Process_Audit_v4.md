# FRAMES — Comprehensive Process & Feature Audit v4.0

**Version:** 4.0  
**Date:** 2026-02-27  
**Previous Versions:**  
- v1.0 — Full baseline audit (`FRAMES_Process_Audit.md`)  
- v2.0 — Optimization-focused delta (`FRAMES_Process_Audit_v2.md`)  
- v3.0 — Kiosk improvements + polishing backlog (`FRAMES_Process_Audit_v3.md`)  

**Scope:** Full re-audit after 70-task polishing sprint. Measured against:  
- `codingRules.instructions.md`  
- `ENGINEERING_STANDARDS_FRAMES.md.instructions.md`  
- `FRAMES_DEPLOYMENT_CONSTRAINTS.instructions.md`  
- `FRAMES_SECURITY_RULES.instructions.md`  
- `FRAMES_OBSERVABILITY_RULES.instructions.md`  
- `FRAMES_TESTING_RULES.instructions.md`  

---

## 1. High-Level Status — v3.0 → v4.0

| Aspect | v3.0 Status | v4.0 Status | Delta |
|--------|------------|------------|-------|
| **Performance Optimization** | 🟢 ~80% | 🟢 ~90% | Real attendance metrics, batch queries, DB indexes |
| **Security** (JWT, auth, rate limiting) | 🔴 0% | 🟢 ~75% | JWT implemented, rate limiting active, api_error adopted |
| **Architecture & Code Quality** | 🟡 ~20% | 🟡 ~55% | Service layer started, centralized API client, AuthContext |
| **Error Handling & Robustness** | 🟡 ~35% | 🟡 ~65% | api_error in use, structured responses, AbortControllers |
| **Frontend Engineering** | 🔴 ~5% | 🟡 ~60% | api.js, AuthContext, ProtectedRoute, AbortControllers, real data |
| **Observability & Logging** | 🟡 ~20% | 🟢 ~70% | logging.basicConfig, /api/health, module loggers, no print() |
| **Testing & Verification** | 🔴 ~5% | 🔴 ~5% | Still scaffolding only — no actual tests |

**Summary:**  
The 70-task polishing sprint addressed the **majority of critical infrastructure gaps** identified in v3.0. Security went from 0% to ~75%, frontend from ~5% to ~60%, and observability from ~20% to ~70%. The remaining blockers are **testing** (unchanged) and **full adoption** of existing infrastructure (AuthContext, service layer).

---

## 2. Backend API — What Changed Since v3.0

### 2.1 JWT Authentication ✅ NEW

**v3 Finding:** "No JWT_SECRET_KEY usage, no get_current_user, no require_role"  
**v4 Status:** **IMPLEMENTED**

`backend/core/auth.py` now provides:
- `create_access_token(user)` — 24h, claims: sub, role, dept, iat, exp, type
- `create_refresh_token(user)` — 7d
- `verify_token(token, expected_type)` — decodes + validates
- `get_current_user()` — FastAPI dependency extracting user from JWT
- `require_role(*allowed_roles)` — Role-based authorization factory

**Residual Issue:** `get_current_user()` falls back to `None` if no token is present (for migration compatibility). Routers that don't explicitly check for `None` will allow unauthenticated access. Recommend removing fallback before production deployment.

**Residual Issue:** A development fallback secret exists in auth.py. Must be removed for production.

### 2.2 Rate Limiting ✅ NEW

**v3 Finding:** "No slowapi or equivalent"  
**v4 Status:** **IMPLEMENTED**

`backend/core/limiter.py` uses `slowapi` with `get_remote_address`. Applied to 9 endpoints:

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/login` | 5/min per IP |
| `POST /api/auth/register` | 3/min per IP |
| `POST /api/auth/refresh` | 5/min per IP |
| `POST /api/face/enroll` | 3/min per user |
| `POST /api/faculty/upload-schedule` | 5/min per user |
| `POST /api/kiosk/attendance/log` | 6/min per device |

### 2.3 Structured Error Responses ✅ ADOPTED

**v3 Finding:** "api_error helper exists but is unused"  
**v4 Status:** **ADOPTED** — `api_error()` from `core/errors.py` is used across student.py, faculty.py, and other routers. Routers no longer expose `str(e)` in responses for endpoints that have been updated.

### 2.4 Logging & Observability ✅ NEW

**v3 Finding:** "print() statements in routers, no basicConfig"  
**v4 Status:** **IMPLEMENTED**

- `backend/main.py` configures `logging.basicConfig()` with standard format before router imports
- Third-party loggers (uvicorn, sqlalchemy) silenced to WARNING
- **Zero `print()` statements** in `backend/api/routers/` and `backend/services/`
- Module-level loggers (`logger = logging.getLogger(__name__)`) used throughout
- `/api/health` endpoint checks DB connectivity, returns healthy/degraded status

### 2.5 Database Configuration ✅ COMPLIANT

Already compliant in v3; confirmed unchanged:
- `echo=False`, `pool_pre_ping=True`, `pool_size=3`, `max_overflow=3`
- `pool_recycle=300`, `pool_timeout=10`

### 2.6 New Endpoints Added Since v3

| Endpoint | Purpose |
|----------|---------|
| `GET /api/student/metrics/{user_id}` | Real attendance rate + punctuality rate with tier classification |
| `GET /api/faculty/live-room-status/{user_id}` | Classroom live status for faculty rooms |
| `GET /api/faculty/live-room-status-dept/{dept_id}` | Department-wide classroom live status |
| `GET /api/faculty/personal-live-status/{user_id}` | Faculty personal attendance status |
| `GET /api/faculty/reports/data/{user_id}` | Faculty report data generation |
| `GET /api/dept/reports/data` | Department report data generation |
| `GET /api/dept/system-logs` | System log retrieval for dept heads |
| Various dept.py endpoints | Subject management, device management, AY filtering |

### 2.7 Real Attendance Metrics ✅ NEW

The student dashboard previously had a **fake** attendance rate calculation (`min(total_attendance * 10, 100)%`). This has been replaced with:

- **Attendance Rate** = distinct(class_id, date) sessions attended / total sessions available × 100
- **Punctuality Rate** = on-time ENTRY logs / total attended sessions × 100
- **Tier Classification**: ≥95% Compliant, 85-94% Acceptable, 75-84% Warning, <75% Probation

All calculations use batch queries with no N+1 patterns.

---

## 3. Frontend — What Changed Since v3.0

### 3.1 Centralized API Client ✅ NEW

**v3 Finding:** "No services/api.js, multiple components reference localhost:5000"  
**v4 Status:** **IMPLEMENTED**

`frontend/src/services/api.js` provides:
- Axios instance with `baseURL` from `VITE_API_BASE_URL`
- Request interceptor attaches JWT Bearer token
- Response interceptor handles 401 globally (clear auth, redirect)
- 15s timeout

**Zero `http://localhost:5000` strings** remain in frontend source.

**Residual Issue:** `KioskDashboardPage.jsx` has `http://localhost:8000` hardcoded as fallback for `VITE_API_URL`. This is a separate kiosk-specific page and should use environment configuration.

### 3.2 AuthContext & Protected Routes ✅ NEW

**v3 Finding:** "No AuthContext, components parse localStorage directly"  
**v4 Status:** **IMPLEMENTED** (infrastructure exists, adoption incomplete)

- `frontend/src/context/AuthContext.jsx` — Full implementation with login, logout, updateUser
- `frontend/src/components/Common/ProtectedRoute.jsx` — Role-based route guard

**Residual Issue:** ~24 components still read `localStorage.getItem('currentUser')` directly instead of using `useAuth()`. While the infrastructure exists and works, full adoption requires updating:
- All Layout components (AdminLayout, FacultyLayout, StudentLayout, DeptHeadLayout)
- All Dashboard pages
- Common pages (Profile, Settings, Help, Notifications)

### 3.3 AbortController Coverage ✅ IMPROVED

**v3 Finding:** "Only StudentDashboardPage uses AbortController"  
**v4 Status:** **~60% coverage** — 17+ components now use AbortController

Components WITH AbortController:
- StudentDashboard: Layout, DashboardPage, SchedulePage, AttendanceHistoryPage
- FacultyDashboard: DashboardPage, ReportsPage, MyClassesPage, AttendancePage
- DeptHeadDashboard: All management and report pages
- Common: NotificationsPage, MyProfilePage, Header, RegistrationPage

Components MISSING AbortController (~10):
- AdminDashboard: UserManagementPage, UserVerificationPage, AdminLayout
- FacultyDashboard: FacultyLayout, FacultyReportModal
- StudentDashboard: StudentReportModal
- DeptHeadDashboard: DeptHeadLayout
- KioskDashboard, FaceEnrollmentPage, LandingPage

### 3.4 Mock Data Replacement ✅ SIGNIFICANT PROGRESS

**v3 Finding:** "Admin/DeptHead dashboards rely on hardcoded arrays"  
**v4 Status:** Most production components now fetch real data.

Components converted to real API data:
- Faculty: Dashboard, Reports (with report_service.py), MyClasses, Attendance, Live Status
- DeptHead: Dashboard, Reports, MyClasses, ManagePage, UserManagement, SystemLogs
- Student: Dashboard (real metrics), Schedule, Attendance History
- Common: Notifications (real API + localStorage persistence)

Components still using mock/hardcoded data:
- Admin dashboard summary cards (partially)
- Some Settings page options
- Help/Support content (static by nature)

### 3.5 Dashboard Enhancements ✅ NEW

Major UI improvements implemented across all role dashboards:

**Faculty Dashboard:**
- Live Room Status with Personal/Classroom dropdown views
- Attendance Trends with Personal/Classroom dropdown + Semestral filter
- Real-time polling (10s) for both room status and personal status

**DeptHead Dashboard:**
- Live Status with 3-view dropdown: Personal, Classroom, Department
- Attendance Trends with 4-option dropdown: Department, Faculty, Personal, Classroom
- Semestral filter replacing yearly
- Dynamic room display (removed hardcoded room 326/322 filter)

**Student Dashboard:**
- Real attendance rate from session-based calculation (replacing fake `total * 10`)
- Real punctuality rate with on-time/late breakdown
- Performance Metrics panel with progress bars and tier badges
- Tier system: Compliant / Acceptable / Warning / Probation with color coding
- Semestral trend filter

### 3.6 Reporting System ✅ NEW

- `backend/services/report_service.py` — Centralized report generation with batch queries
- `backend/api/routers/reports.py` — Report endpoints for faculty and dept heads
- `FacultyReportsPage.jsx` — Working report generation with filters, PDF export
- `DeptHeadReportsPage.jsx` — Department-level reports with system logs

---

## 4. RPi Kiosk — Status Unchanged from v3.0

The kiosk improvements documented in v3.0 remain in place:
- ✅ SIGTERM handling
- ✅ Periodic embedding cache refresh
- ✅ Periodic offline queue flush
- ✅ Per-frame metrics collection
- ✅ Memory monitoring

No additional kiosk-specific changes were made in the v3→v4 period (focus was on backend + frontend polishing).

---

## 5. Testing — Status Unchanged ⚠️

**v3 Finding:** "Tests folder scaffolded, but no real tests"  
**v4 Status:** **UNCHANGED** — `backend/tests/` still contains only `README.md`

This remains the **largest gap** in FRAMES readiness. No `test_*.py` files, no `conftest.py`, no coverage reports.

**Impact:** Without tests, the 70+ code changes from the polishing sprint lack automated verification. Manual testing is the only validation method.

**Recommendation:** Prioritize at minimum:
1. `conftest.py` with test DB setup
2. `test_auth.py` — login, register, token refresh, role guards
3. `test_student_routes.py` — dashboard, metrics, schedule
4. `test_attendance_service.py` — state machine (ENTRY→BREAK_OUT→BREAK_IN→EXIT)

---

## 6. Remaining Work — Prioritized Backlog

### 🔴 P0 — Deployment Blockers

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 1 | Remove JWT dev fallback secret in `core/auth.py` | 5 min | Security critical |
| 2 | Remove `get_current_user` None fallback | 30 min | Requires router audit |
| 3 | Fix `KioskDashboardPage.jsx` hardcoded `localhost:8000` | 5 min | Use env var |
| 4 | CORS lockdown — verify `allow_origins` is not `["*"]` | 10 min | Check main.py |

### 🟡 P1 — Quality & Robustness

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 5 | Migrate 24 components from `localStorage` to `useAuth()` | 2-3 hrs | Systematic find-replace |
| 6 | Add AbortController to ~10 missing components | 1-2 hrs | Template pattern exists |
| 7 | Create core backend tests (auth, metrics, state machine) | 4-6 hrs | Highest ROI testing |
| 8 | Service layer extraction for faculty.py + kiosk.py | 3-4 hrs | Code quality |

### 🟢 P2 — Polish

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 9 | Add "OFFLINE MODE" banner to kiosk UI | 1 hr | UX improvement |
| 10 | Frontend test setup (Vitest) + login flow tests | 2-3 hrs | Infrastructure |
| 11 | Slow query timing wrappers in backend services | 1-2 hrs | Observability |
| 12 | Split large components (DeptHeadUserManagement, etc.) | 2-3 hrs | Maintainability |

### 🔵 P3 — Nice-to-Have

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 13 | Admin dashboard real data (replace remaining mocks) | 2-3 hrs | Feature completeness |
| 14 | Input validation on all frontend forms | 2-3 hrs | UX + security |
| 15 | Data dictionary documentation update | 1-2 hrs | Documentation |

---

## 7. Metrics — Before vs After Polishing Sprint

### Backend Endpoint Count
- **v3.0:** ~25 endpoints across 8 routers
- **v4.0:** ~35+ endpoints across 9 routers (reports.py added)

### Frontend Component State
| Metric | v3.0 | v4.0 |
|--------|------|------|
| Components using centralized API client | 0 | ~20+ |
| Components with AbortController | 1 | 17+ |
| Components with loading/error states | ~3 | ~15+ |
| Hardcoded localhost URLs | 20+ | 1 (kiosk page) |
| Mock data in production components | ~12 | ~3 |

### Backend Code Quality
| Metric | v3.0 | v4.0 |
|--------|------|------|
| `print()` in routers | 10+ | 0 |
| N+1 queries | 5+ | 0 (verified in recent endpoints) |
| Endpoints with pagination | ~2 | ~8 |
| Rate-limited endpoints | 0 | 9 |
| Structured error responses | 0 | ~15+ |
| Module-level loggers | ~2 | All routers |

### Security Posture
| Metric | v3.0 | v4.0 |
|--------|------|------|
| JWT authentication | ❌ | ✅ |
| Role-based authorization | ❌ | ✅ (infrastructure) |
| Rate limiting | ❌ | ✅ |
| Structured errors (no str(e)) | ❌ | ✅ (most endpoints) |
| CORS configured | ❌ | Needs verification |
| Health endpoint | ❌ | ✅ |

---

## 8. Risk Assessment

### Low Risk (Acceptable for Demo)
- AuthContext not universally adopted (localStorage fallback works)
- Some components missing AbortController (causes console warnings, not crashes)
- No automated tests (manual testing compensates for demo)
- Service layer incomplete (code works, just harder to maintain)

### Medium Risk (Fix Before Wide Deployment)
- JWT None fallback allows unauthenticated access if not checked
- Dev fallback secret in auth.py
- Kiosk hardcoded localhost URL
- CORS configuration needs verification

### High Risk (Fix Before Production)
- Zero test coverage means regressions can go undetected
- No CI/CD pipeline to catch issues
- Rate limiting effectiveness untested under load

---

## 9. Conclusion

The 70-task polishing sprint transformed FRAMES from a **proof-of-concept with significant infrastructure gaps** to a **functional system with most critical architecture in place**. The jump from v3.0's assessment (Security: 0%, Frontend: 5%) to v4.0 (Security: ~75%, Frontend: ~60%) represents the most impactful development period in the project.

**Remaining work is primarily adoption and testing, not architecture.** The building blocks exist (JWT, AuthContext, API client, rate limiter, structured logging) — they need to be consistently applied across all components.

**Priority for next development phase:** Testing infrastructure → AuthContext migration → remaining AbortControllers → service layer extraction.

---

*FRAMES Process Audit v4.0 — Generated after 70-task polishing sprint*  
*Reference: `FRAMES_Process_Audit_v3.md`, `MUSTFIXANDANALYZE.MD`*
