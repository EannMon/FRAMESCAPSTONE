## FRAMES — Comprehensive Process & Feature Audit  

**Version:** 3.0  
**Date:** 2026-02-26  
**Previous Versions:**  
- v1.0 — full baseline audit (see `FRAMES_Process_Audit.md`)  
- v2.0 — optimization-focused delta (see `FRAMES_Process_Audit_v2.md`)  
**Related Doc:** `FRAMES_Engineering_Aspects.md` (7-aspect rubric)  

**Scope:** Re‑audit of Backend, Frontend, and RPi Kiosk with focus on changes since v2.0, measured against:  
- `codingRules.instructions.md`  
- `ENGINEERING_STANDARDS_FRAMES.md.instructions.md`  
- `FRAMES_DEPLOYMENT_CONSTRAINTS.instructions.md`  
- `FRAMES_SECURITY_RULES.instructions.md`  
- `FRAMES_OBSERVABILITY_RULES.instructions.md`  
- `FRAMES_TESTING_RULES.instructions.md`  

This document is **delta‑oriented**. For full endpoint/component inventories and v1→v2 changes, refer to v1.0 and v2.0 audits.

---

## 1. High‑Level Status vs v2.0

| Aspect (from `FRAMES_Engineering_Aspects.md`) | v2.0 Status | v3.0 Status | Delta |
|----------------------------------------------|------------|------------|-------|
| **Performance Optimization**                 | 🟢 ~75%    | 🟢 ~80%    | Minor kiosk optimization improvements |
| **Security** (JWT, auth, rate limiting)      | 🔴 0%      | 🔴 0%      | **No code‑level change** |
| **Architecture & Code Quality**              | 🟡 ~20%    | 🟡 ~20%    | No structural refactors since v2 |
| **Error Handling & Robustness**              | 🟡 ~30%    | 🟡 ~35%    | Kiosk now handles SIGTERM + periodic flush/refresh |
| **Frontend Engineering**                     | 🔴 ~5%     | 🔴 ~5%     | Frontend unchanged (still localhost‑bound) |
| **Observability & Logging**                  | 🔴 0%      | 🟡 ~20%    | New kiosk metrics collector + perf timings |
| **Testing & Verification**                   | 🔴 0%      | 🔴 ~5%     | Tests folder scaffolded, but no real tests yet |

**Summary:**  
- Backend performance and DB behavior remain in the **good** state established in v2.  
- **Kiosk** has taken a clear step toward compliance with deployment + observability rules.  
- **Security, frontend architecture, and automated testing remain the main blockers** for a polished, demo‑ready and deployable FRAMES.

---

## 2. Backend API — Changes Since v2.0

For full endpoint inventory and previous findings, see v1.0/v2.0. Below are only new or changed aspects.

### 2.1 Structured Error Helper (`backend/core/errors.py`)

- **New in code (was only specified in rules before):**
  - `core/errors.py` defines `api_error(status_code, code, message, details=None)` that returns the standardized error envelope required by `FRAMES_SECURITY_RULES` and `FRAMES_DEPLOYMENT_CONSTRAINTS` §1.3.
  - Shape matches the rulebook exactly:
    ```json
    {
      "success": false,
      "error": {
        "code": "SOME_CODE",
        "message": "Human-readable message",
        "details": null
      }
    }
    ```

**Audit vs rules:**
- **✅ Positive:** Infrastructure for compliant error responses now exists in the codebase.
- **❌ Still missing:** Routers (`auth.py`, `admin.py`, `faculty.py`, `student.py`, `users.py`, `kiosk.py`, `dept.py`, `face.py`) still primarily raise raw `HTTPException(detail="...")` and often `str(e)`. The helper is **not yet wired in**, so production behavior is unchanged vs v2.

**Status:**  
- **Error contract helper implemented, but not adopted.**  
- v3 recommendation: treat adoption of `api_error` in all routers as part of the security/error‑handling polish backlog (see Section 8).

### 2.2 Security, Auth, and Rate Limiting

Target rules: `FRAMES_SECURITY_RULES`, `FRAMES_DEPLOYMENT_CONSTRAINTS` §1.4, §5.1–5.4.

**Findings (unchanged from v2.0):**
- **JWT authentication:** no `JWT_SECRET_KEY` usage, no `get_current_user`, no `require_role` dependency. User IDs are still taken from URL parameters in major routers.
- **Role‑based authorization:** no role guards; students/faculty/admin separation is not enforced in backend.
- **Rate limiting:** no `slowapi` or equivalent; endpoints like `/api/auth/login`, `/api/face/enroll`, `/api/kiosk/attendance/log` are still unlimited.
- **CORS:** rule docs still require locked‑down origins; code still needs to be aligned (per v2 finding).
- **Input validation & error opacity:** login still accepts raw dict; several endpoints still return `str(e)` to clients.

**Status:**  
- **Security posture is effectively identical to v2.0** — FRAMES remains **not safe to expose beyond a controlled demo environment**.

---

## 3. RPi Kiosk — Changes Since v2.0

Core file audited: `backend/rpi/main_kiosk.py` (plus `embedding_cache.py`).  
Baseline issues and state machine correctness remain as described in v1.0/v2.0.

### 3.1 Deployment Constraint Compliance (RPi Section) — **Improved**

Compared to v2.0, the kiosk now aligns significantly better with `FRAMES_DEPLOYMENT_CONSTRAINTS` §4 and `FRAMES_OBSERVABILITY_RULES`:

- **SIGTERM handling (Deployment §4.4) — now implemented ✅**
  - `main_kiosk.py` registers a SIGTERM handler:
    - Sets an internal `_shutdown_requested` flag.
    - Main loop checks this flag and exits cleanly.
  - This satisfies the requirement that systemd can stop the kiosk gracefully without hard‑killing the process.

- **Periodic embedding cache refresh (Deployment §4.3) — now implemented ✅**
  - `AttendanceKiosk` tracks `_last_cache_refresh` and periodically calls `EmbeddingCache.load_from_json(...)` based on `CACHE_REFRESH_MINUTES` in config.
  - Aligns with the rule that embeddings must **not** be loaded only once at startup.

- **Periodic offline queue flush — now implemented ✅**
  - In the main loop, the kiosk periodically calls `attendance_logger.flush_offline_queue()` (e.g., every 5 minutes) when there are queued records.
  - This is in addition to the startup/shutdown flush from v1/v2.

- **Periodic schedule re‑sync — now implemented ✅**
  - Kiosk periodically re‑syncs the schedule from the backend (e.g., every 30 minutes), rather than only once at startup.

**Residual kiosk gaps (unchanged from v2.0):**
- Visual **“OFFLINE MODE”** banner is still not obviously present on the kiosk UI when backend is unreachable (rule §4.5).
- Auth model for kiosk→backend (device‑level auth) still needs to be verified when JWT and security rules are implemented globally.

### 3.2 Observability & Metrics — **Substantially Improved**

Target rules: `FRAMES_OBSERVABILITY_RULES`, `FRAMES_DEPLOYMENT_CONSTRAINTS` §6.

New behavior detected in `main_kiosk.py` and `embedding_cache.py`:

- **Per‑frame performance metrics:**
  - The kiosk now records:
    - Per‑frame processing time (ms)
    - Recognition time (InsightFace)
    - Matching time (embedding cache `np.dot` call)
    - Whether a match occurred and how many faces were seen
  - Metrics are fed into a `KioskMetricsCollector` which periodically logs aggregated statistics and can apply thresholds (e.g., p95 frame time, memory usage).

- **Memory monitoring:**
  - Kiosk periodically samples RSS memory via `psutil.Process().memory_info().rss` and passes it into the metrics collector.
  - This supports the memory ceiling rules in `FRAMES_DEPLOYMENT_CONSTRAINTS` §4.2.

- **EmbeddingCache remains efficient:**
  - Still uses normalized embeddings and vectorized `np.dot` for O(n) cosine similarity.
  - No regressions versus v1/v2; now better instrumented via the kiosk metrics pipeline.

**Status:**  
- Kiosk now meaningfully implements the observability rules on the edge device.  
- Backend‑side observability (logging, slow query warnings, `/api/health`) is still pending (see v2.0 and Section 6 below).

---

## 4. Frontend — Status vs v2.0

Target rules: `FRAMES_DEPLOYMENT_CONSTRAINTS` §3, `codingRules` §3–4.

Based on repository search and comparison with v2.0 findings:

- **Centralized API client:**  
  - No `frontend/src/services/api.js` or equivalent found.  
  - Multiple components still reference `http://localhost:5000` directly.  
  - **Result:** Frontend remains tightly coupled to localhost; deployment to any other backend URL will break calls.

- **AuthContext / route guards:**  
  - No `AuthContext` or centralized auth provider discovered.  
  - Components continue to directly parse `localStorage.getItem('currentUser')`.  
  - No dedicated `<ProtectedRoute>` implementation found.

- **AbortController usage:**  
  - `StudentDashboardPage.jsx` still appears to be the **only** component that uses `AbortController` correctly.  
  - Other data‑fetching components remain unprotected against unmount race conditions.

- **Mock data:**  
  - Admin/Dept‑Head dashboards, system logs, user management, some reports still rely on hardcoded arrays, as documented in v2.0.  
  - No evidence that these components have been wired to real APIs since v2.

**Status:**  
- **Frontend remains effectively unchanged since v2.0.**  
- All major frontend action items from v1.0/v2.0 and from the rules are still open and are now clearly part of the **“polish backlog”** (Section 8).

---

## 5. Testing & Verification — Status vs v2.0

Target rules: `FRAMES_TESTING_RULES.instructions.md`, `FRAMES_DEPLOYMENT_CONSTRAINTS` §7.

### 5.1 Backend Tests

- **New artifact:** `backend/tests/README.md`
  - Describes desired pytest structure, fixtures (`conftest.py`), and example tests.
  - This is **documentation/scaffolding**, not actual tests.

- **Current code reality:**
  - No actual `test_*.py` files were identified in `backend/tests/` beyond the README.
  - No test runner configuration or coverage scripts are in place in code (only in docs).

### 5.2 Frontend Tests

- No `__tests__` folder or `*.test.jsx` / `*.test.js` files detected under `frontend/src/`.
- No Vitest/Jest configuration present in the codebase.

**Status:**  
- Compared to v2.0, **testing has only advanced at the documentation level**.  
- From the FRAMES rules’ perspective, **“untested code is still undeployable code.”**

---

## 6. Observability & Logging (Backend) — Status vs v2.0

Target rules: `FRAMES_OBSERVABILITY_RULES`, `FRAMES_DEPLOYMENT_CONSTRAINTS` §6.

**Findings (unchanged vs v2.0 on backend):**
- Routers still use `print()` in several places (auth, admin, faculty, kiosk) instead of module loggers.
- No standardized `logging.basicConfig(...)` was observed in `backend/main.py` per the observability rules (not re‑audited in full here, but no new code hints were found).
- No slow‑query timing wrappers or structured performance logs were identified around heavy DB operations.
- `/api/health` endpoint behavior should be implemented per observability rules; this remains to‑be‑done unless added in files not yet audited.

**New positive development (edge‑side only):**
- As described in Section 3.2, the kiosk now **does** implement performance/memory metrics logging and uses a dedicated metrics collector.

**Status:**  
- **Edge (RPi):** observability is now much closer to spec.  
- **Backend:** observability remains roughly at the v2.0 level and needs targeted implementation based on `FRAMES_OBSERVABILITY_RULES`.

---

## 7. NEW Findings in v3 (Not Explicitly Covered in v1/v2)

These are items that either did not exist when v1/v2 were written or were only mentioned in rule docs, not in actual code.

### 7.1 `api_error` Helper Exists but Is Unused (**NEW**)

- **What’s new:**  
  - `backend/core/errors.py` now implements the standardized `api_error(...)` helper defined in `FRAMES_SECURITY_RULES`.

- **Why it matters:**  
  - This is the missing building block to migrate **all** router error responses to a consistent, typed format.
  - Until routers adopt it, FRAMES still leaks inconsistent error shapes and sometimes raw `str(e)` values.

- **Action:**  
  - Add to polish backlog: **“Replace all raw `HTTPException` uses with `api_error` or a thin wrapper around it, and remove `str(e)` from all HTTP responses.”**

### 7.2 Kiosk Metrics & Periodic Maintenance Are Now Live (**NEW**)

- **What’s new (vs previous audits):**
  - Kiosk has:
    - SIGTERM handling.
    - Periodic embedding cache refresh.
    - Periodic offline queue flush.
    - Periodic schedule re‑sync.
    - Per‑frame performance & memory metrics collection.

- **Why it matters:**
  - These changes close a large portion of the **RPi‑specific deployment and observability rules**.
  - Kiosk is now much more robust for long‑running sessions and easier to diagnose in case of performance or memory issues.

---

## 8. Polishing Backlog (Numbered Changelog / Features Needed)

Below is a **numbered list** of the remaining high‑impact changes needed to “polish” FRAMES into a demo‑ready and deployment‑ready system. Items marked **[P0]** are blockers; **[P1]/[P2]/[P3]** match earlier audit priorities.

1. **[P0] Implement full JWT authentication and role‑based authorization.**  
   - Add `core/auth.py` with `create_access_token`, `create_refresh_token`, `get_current_user`, and `require_role` per `FRAMES_SECURITY_RULES`.  
   - Replace all `{user_id}` URL‑param identity usage with `current_user.id` from JWT across routers.  
   - Enforce role guards on admin, dept head, faculty, and student endpoints.

2. **[P0] Create centralized frontend API client and remove all hardcoded URLs.**  
   - Add `frontend/src/services/api.js` (or TS equivalent) with baseURL from `VITE_API_BASE_URL`.  
   - Replace all `axios` calls and `http://localhost:5000` strings with this client.  
   - Wire in JWT access token via interceptors.

3. **[P0] Introduce AuthContext and route guards on the frontend.**  
   - Implement `AuthProvider`/`useAuth` to hold user + token state.  
   - Replace `localStorage.getItem('currentUser')` usage with `useAuth()`.  
   - Implement `<ProtectedRoute allowedRoles={...}>` and protect all dashboards accordingly.

4. **[P1] Replace `print()` with structured logging everywhere.**  
   - Backend: configure `logging.basicConfig(...)` in `main.py` per observability rules.  
   - Replace all `print()` statements in `auth.py`, `admin.py`, `faculty.py`, `kiosk.py`, `main_kiosk.py`, etc. with module‑level loggers (`logger = logging.getLogger(__name__)`).  

5. **[P1] Adopt `api_error` in all routers and remove `str(e)` from responses.**  
   - Update error paths in all routers to use `api_error(status, code, message, details)` with stable error codes.  
   - Ensure unexpected exceptions are logged server‑side (`logger.exception(...)`) and surfaced as generic `"INTERNAL_ERROR"` to clients.

6. **[P1] Add rate limiting to sensitive endpoints.**  
   - Use `slowapi` or equivalent:  
     - `/api/auth/login` ~ 5/min/IP.  
     - `/api/auth/register` and `/api/face/enroll` per rules.  
     - `/api/kiosk/attendance/log` per user/device constraints.  

7. **[P1] Implement CORS lockdown and security env vars.**  
   - Restrict `allow_origins` to `FRONTEND_URL`.  
   - Ensure `.env` includes `JWT_SECRET_KEY`, `FRONTEND_URL`, and any kiosk keys as per `FRAMES_SECURITY_RULES`.

8. **[P1] Complete frontend AbortController + loading/error/success states.**  
   - Ensure every `useEffect` that fetches data uses `AbortController` correctly.  
   - For each data‑fetching component, implement visible loading and error states, not just `console.error`.

9. **[P1] Replace mock data in production components with real APIs.**  
   - Admin + Dept‑head dashboards, logs, user management, and reports.  
   - Settings, notifications, and help/support pages.  
   - Keep `TestPDFPage` as a sandbox only.

10. **[P2] Extract service layers from large routers.**  
    - Move business logic from `faculty.py`, `kiosk.py`, and `dept.py` into `services/` modules (e.g., `faculty_service.py`, `kiosk_service.py`).  
    - Keep routers focused on HTTP concerns and delegation only.

11. **[P2] Implement backend observability per `FRAMES_OBSERVABILITY_RULES`.**  
    - Add `/api/health` endpoint with DB connectivity check.  
    - Add slow‑query and slow‑endpoint timing logs.  
    - Standardize log formats and levels for all modules.

12. **[P2] Finalize kiosk UX polish for offline mode.**  
    - Add explicit “OFFLINE MODE” banner when backend is unreachable but kiosk is using cached schedule/embeddings.  
    - Ensure metrics + logs clearly indicate offline/online transitions.

13. **[P2] Introduce automated backend test suite.**  
    - Implement `conftest.py` and core tests (`test_auth.py`, `test_student.py`, `test_faculty.py`, `test_kiosk_routes.py`, `test_pdf_parser.py`) per `FRAMES_TESTING_RULES`.  
    - Cover at least: auth, attendance state machine, PDF parsing, and key routers.

14. **[P3] Add frontend test coverage for critical flows.**  
    - Login, protected routes, dashboard data loading, and error states.  
    - Use Vitest + React Testing Library per testing rules.

15. **[P3] Clean up duplication and large files.**  
    - Factor out shared SystemLogs component for admin/dept‑head.  
    - Split very large React components (`DeptHeadUserManagementPage`, etc.) into smaller presentational and container pieces.  
    - Consider splitting `main_kiosk.py` and large routers once service extraction is in place.

---

**End of Audit — Version 3.0**  
For detailed historical context and the original deep‑dive tables, see `FRAMES_Process_Audit.md` (v1.0) and `FRAMES_Process_Audit_v2.md` (v2.0). This v3 focuses on the **current delta** and the **remaining polish backlog** needed to align FRAMES fully with its own rules.

