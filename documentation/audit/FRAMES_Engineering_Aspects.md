# FRAMES — Engineering Aspects: What We Must Focus On

**Date:** 2026-02-23  
**Purpose:** Define every engineering aspect the team must address, explain what each means, show where it's mandated in our rules, and track FRAMES' current standing in each.

---

## Why This Document Exists

After PR #26 (backend optimization), the team completed **one** of several engineering aspects. This document answers: **"Optimization is done — what else is there?"**

The short answer: **7 distinct engineering aspects**, all explicitly required by our rules files.

---

## The 7 Engineering Aspects

| # | Aspect | One-Line Definition | Rule Source | FRAMES Status |
|---|--------|--------------------|-----------|----|
| 1 | **Performance Optimization** | Make it fast — eliminate slow queries, add indexes, tune resources | `ENGINEERING_STANDARDS_FRAMES.md` §1–8, `DEPLOYMENT_CONSTRAINTS.md` §1.1–1.5, §4.1–4.2 | 🟢 **75% done** (PR #26) |
| 2 | **Security** | Make it safe — authentication, authorization, input validation, secrets management | `DEPLOYMENT_CONSTRAINTS.md` §1.3–1.4, §5.1–5.4 | 🔴 **0% done** |
| 3 | **Architecture & Code Quality** | Make it maintainable — separation of concerns, service layers, naming conventions, DRY | `codingRules.md` §1–2, §8, `ENGINEERING_STANDARDS.md` §9, `DEPLOYMENT_CONSTRAINTS.md` §1.6 | 🟡 **20% done** |
| 4 | **Error Handling & Robustness** | Make it resilient — graceful failures, structured errors, loading/error/success states | `codingRules.md` §3–4, `DEPLOYMENT_CONSTRAINTS.md` §1.3, §3.3 | 🟡 **30% done** |
| 5 | **Frontend Engineering** | Make the UI production-ready — centralized API, auth context, abort controllers, no mock data | `DEPLOYMENT_CONSTRAINTS.md` §3.1–3.6 | 🔴 **5% done** |
| 6 | **Observability & Logging** | Make it debuggable — structured logging, performance metrics, no print() | `DEPLOYMENT_CONSTRAINTS.md` §6.1–6.2, `ENGINEERING_STANDARDS.md` §10 | 🔴 **0% done** |
| 7 | **Testing & Verification** | Make it provable — unit tests, edge cases, integration tests, audit checklist | `codingRules.md` §7, `DEPLOYMENT_CONSTRAINTS.md` §7 (pre-deployment checklist) | 🔴 **0% done** |

---

## Aspect 1: Performance Optimization

### Definition

Performance optimization means **making the system respond as fast as possible while using as few resources as possible**. It answers the question: *"What happens when data grows 10x or users grow 100x?"*

This includes:
- **Database performance:** Indexes on queried columns, no N+1 queries, JOINs instead of loops, pagination for list endpoints
- **Connection management:** Pool sizing, connection recycling, timeout settings
- **Algorithm efficiency:** O(1)/O(n) preferred, avoid O(n²), no expensive operations inside loops
- **Memory management:** Embedding cache budgets, lazy loading, no full-table loads
- **RPi constraints:** Frame processing < 250ms, memory < 2.5GB, frame skip tuning

### Where It's Stated in Our Rules

| Rule File | Sections |
|-----------|----------|
| `ENGINEERING_STANDARDS_FRAMES.md` | §1 (Scale Philosophy), §2 (Big O Rules), §3 (N+1 Ban), §4 (Database Design), §5 (Face Recognition), §6 (Caching), §7 (Loop Rules), §8 (Data Structures) |
| `DEPLOYMENT_CONSTRAINTS.md` | §1.1 (N+1 Ban), §1.2 (Pagination), §1.5 (DB Connection Config), §4.1 (Frame Budget), §4.2 (Memory Ceiling) |
| `codingRules.md` | §9 (Performance Optimization) |

### FRAMES Current Status: 🟢 75% Done

**What PR #26 Fixed:**
- ✅ All 16+ missing indexes added across 13 models (+ 8 bonus indexes)
- ✅ Composite index on `attendance_logs(user_id, class_id, timestamp)`
- ✅ All 3 N+1 query patterns in `faculty.py` eliminated
- ✅ `database.py` fully tuned: `echo=False`, `pool_size=5`, `pool_recycle=300`, `pool_timeout=30`
- ✅ All `datetime.utcnow` → `datetime.now(timezone.utc)` (Python 3.12+ compat)

**What's Still Open:**
- ❌ Pagination missing on `admin/verification/list`, `faculty/session-exceptions-by-faculty`
- ❌ `dashboard-stats` still hardcodes `average_attendance = 85.0` instead of computing
- ❌ RPi embedding cache has no periodic refresh
- ❌ `dept.py /management-data` still queries classes per subject in a loop

---

## Aspect 2: Security

### Definition

Security means **preventing unauthorized access, data leakage, and abuse**. It answers: *"Can someone who shouldn't be here do damage?"*

This includes:
- **Authentication:** Verifying the user IS who they claim to be (JWT tokens)
- **Authorization:** Verifying the user CAN do what they're requesting (role-based access)
- **Input Validation:** Ensuring all user input is sanitized before processing
- **Secrets Management:** No hardcoded API keys, tokens, or database URLs in source code
- **CORS Policy:** Only allowing requests from the actual frontend domain
- **Rate Limiting:** Preventing brute force login, abuse of heavy endpoints
- **Error Opacity:** Never exposing internal error details (`str(e)`) to clients

### Why It's NOT "Part of Optimization"

Optimization makes the system **faster**. Security makes the system **safe**. They are orthogonal concerns:

| | Optimization | Security |
|---|---|---|
| **Goal** | Reduce latency and resource usage | Prevent unauthorized access and data leakage |
| **Example** | Adding `index=True` to a column | Adding JWT token verification to an endpoint |
| **Failure Mode** | Slow responses, timeouts | Data breach, impersonation, unauthorized deletions |
| **Measurement** | Query time (ms), requests/sec | Vulnerabilities found, attack surface area |

You can have a blazing-fast system that anyone can break into (FRAMES right now). Or a perfectly secure system that takes 10 seconds per request. They must be addressed **independently**.

### Where It's Stated in Our Rules

| Rule File | Sections |
|-----------|----------|
| `DEPLOYMENT_CONSTRAINTS.md` | §1.3 (Structured Error Responses), §1.4 (Authentication Middleware — "Non-Negotiable"), §5.1 (CORS Lockdown), §5.2 (Environment Variables), §5.3 (Input Validation), §5.4 (Rate Limiting) |
| `codingRules.md` | §5 (Security Best Practices — "Never hardcode API keys", "Include authorization headers", "Sanitize all user inputs") |

### FRAMES Current Status: 🔴 0% Done

| Security Item | Required | Current State |
|--------------|----------|--------------|
| JWT Authentication | §1.4: "Non-Negotiable" | ❌ Not implemented. User ID comes from URL params — anyone can impersonate any user by changing the number. |
| Role-Based Authorization | §1.4: "students cannot access faculty endpoints" | ❌ Not implemented. A student can call `/api/admin/verification/approve` and approve themselves. |
| CORS Lockdown | §5.1: "Lock Down Before Deployment" | ❌ `allow_origins=["*"]` in `main.py` — any website can make requests to FRAMES backend |
| Rate Limiting | §5.4: Login 5/min, Enroll 3/min, Attendance 1/10s | ❌ Not implemented. Login can be brute-forced infinitely. |
| Input Validation | §5.3 | ⚠️ Partial — Pydantic schemas on register, but login accepts raw dict. No file size limit on PDF uploads. |
| Error Opacity | §1.3: "NEVER Expose Internal Errors" | ❌ Multiple endpoints return `str(e)` — stack traces leak to clients |
| Environment Variables | §5.2 | ✅ `DATABASE_URL` in `.env`. But `JWT_SECRET_KEY`, `FRONTEND_URL` not yet needed (no JWT exists). |

**Impact of Not Fixing:** Without JWT, FRAMES has **zero access control**. Any person who knows the API URL can delete any user, approve any registration, view any student's attendance, or impersonate any faculty member. This is a **deployment blocker**.

---

## Aspect 3: Architecture & Code Quality

### Definition

Architecture means **how the code is organized so future developers (including you in 2 months) can understand and modify it**. It answers: *"Can we add a new feature without rewriting everything?"*

This includes:
- **Separation of Concerns:** Routers handle HTTP, services handle business logic, models handle data
- **Service Layer:** Business logic extracted from routers into dedicated service files
- **Naming Conventions:** `camelCase` for JS, `snake_case` for Python, `PascalCase` for components/classes
- **File Size Limits:** No file over 300 lines
- **DRY (Don't Repeat Yourself):** No duplicated components or logic
- **Specification-First:** Define types/interfaces before implementation

### Where It's Stated in Our Rules

| Rule File | Sections |
|-----------|----------|
| `codingRules.md` | §1 (Modular Structure), §2 (Naming Conventions), §8 (Code Style — "simplicity over cleverness") |
| `ENGINEERING_STANDARDS_FRAMES.md` | §9 (Clean Architecture — "No database calls directly inside UI") |
| `DEPLOYMENT_CONSTRAINTS.md` | §1.6 (Service Layer — "Routers MUST NOT contain business logic"), §8.2 (Files MUST NOT exceed 300 lines) |

### FRAMES Current Status: 🟡 20% Done

| Architecture Item | Current State |
|------------------|--------------|
| Service Layer | ❌ Only `face_enrollment` and `gesture_detection` are extracted. `faculty.py` (694 lines), `kiosk.py` (621 lines) have all logic inline. |
| File Size | ❌ `faculty.py` (694 lines), `kiosk.py` (621 lines), `main_kiosk.py` (646 lines), `DeptHeadUserManagementPage.jsx` (450+ lines) all violate 300-line limit |
| Naming Conventions | ✅ Generally followed — `snake_case` in Python, `PascalCase` in React |
| DRY | ❌ `DeptHeadSystemLogsPage` is an exact copy of `AdminDashboard/SystemLogsPage` |
| Separation of Concerns | ⚠️ Partial — models are properly separated, but routers contain business logic |

---

## Aspect 4: Error Handling & Robustness

### Definition

Error handling means **the system never crashes silently, never shows a blank screen, and always tells the user what happened**. It answers: *"What happens when something goes wrong?"*

This includes:
- **Backend:** Structured error responses with error codes (not raw strings), never exposing `str(e)`, proper HTTP status codes
- **Frontend:** Every component must have Loading, Error, and Success states. No silent `console.error()` only.
- **RPi:** Offline mode must be clearly indicated, graceful shutdown on SIGTERM, crash recovery
- **General:** No bare `except:`, no swallowed errors, proper cleanup (`AbortController`, resource release)

### Where It's Stated in Our Rules

| Rule File | Sections |
|-----------|----------|
| `codingRules.md` | §3 (Anti-Pattern: Race Conditions, Missing Error Handling), §4 (Comprehensive Error Management — "Never assume the happy path") |
| `DEPLOYMENT_CONSTRAINTS.md` | §1.3 (Structured Error Responses), §3.2 (AbortController in every useEffect), §3.3 (Three Mandatory UI States), §4.4 (Graceful Shutdown), §4.5 (Offline-First Behavior) |

### FRAMES Current Status: 🟡 30% Done

| Error Handling Item | Current State |
|--------------------|--------------|
| Structured Backend Errors | ❌ All routers use raw `HTTPException(detail="string")` — no error codes, inconsistent shapes |
| `str(e)` Exposure | ❌ Multiple endpoints in `faculty.py`, `kiosk.py` return internal error strings to clients |
| Frontend Loading States | ⚠️ Partial — some components have loading spinners, many do not (8+ missing) |
| Frontend Error States | ❌ Most components only `console.error()` — users see nothing or a blank screen |
| AbortController | ❌ **36 of 37** frontend components lack AbortController — memory leaks on navigation |
| RPi SIGTERM | ❌ Missing — systemd `stop` will kill the process ungracefully |
| RPi Offline Indicator | ❌ No visual "OFFLINE MODE" display on kiosk screen |

---

## Aspect 5: Frontend Engineering

### Definition

Frontend engineering means **the React application is production-ready, not just "it works on localhost"**. It answers: *"Can we deploy this frontend to a real URL and have real users use it?"*

This includes:
- **Centralized API Client:** One `axios` instance with base URL from environment variable — no `http://localhost:5000` anywhere
- **Authentication Context:** User state in React Context, not scattered `localStorage.getItem()` calls
- **Route Protection:** Protected routes verify auth + role before rendering
- **No Mock Data:** Production components must fetch real data from APIs
- **Environment Configuration:** `VITE_API_BASE_URL` for deployment

### Where It's Stated in Our Rules

| Rule File | Sections |
|-----------|----------|
| `DEPLOYMENT_CONSTRAINTS.md` | §3.1 (Centralized API Client — "No Hardcoded URLs"), §3.2 (AbortController), §3.3 (Three Mandatory UI States), §3.4 (No Mock Data), §3.5 (Auth Context — Single Source of Truth), §3.6 (Route Protection) |
| `codingRules.md` | §3 (Anti-Patterns: Race Conditions with useEffect), §5 (Never hardcode API keys) |

### FRAMES Current Status: 🔴 5% Done

| Frontend Item | Current State |
|--------------|--------------|
| Centralized API Client | ❌ **16 files** with `http://localhost:5000` hardcoded — deployment blocker |
| AuthContext | ❌ Every component parses `localStorage.getItem('currentUser')` independently |
| Route Guards | ❌ Layouts do manual role checks, but no `<ProtectedRoute>` component |
| Mock Data in Production | ❌ **11 components** display hardcoded arrays instead of API data |
| `VITE_API_BASE_URL` | ❌ Not referenced anywhere in the codebase |
| AbortController | ❌ Only `StudentDashboardPage` has one. 36 other components don't clean up fetches. |

**Impact of Not Fixing:** The frontend **cannot be deployed** to any URL other than `localhost:5000`. The moment you host the backend anywhere else, every API call breaks.

---

## Aspect 6: Observability & Logging

### Definition

Observability means **being able to understand what the system is doing in production without attaching a debugger**. It answers: *"Something went wrong in production at 2 AM — can we figure out what happened?"*

This includes:
- **Structured Logging:** Use Python `logging` module with levels (DEBUG, INFO, WARNING, ERROR) — not `print()`
- **Performance Metrics:** Log execution time for slow queries (>100ms), face recognition inference, report generation
- **Kiosk Metrics:** Frame processing latency, memory usage, recognition success rate

### Where It's Stated in Our Rules

| Rule File | Sections |
|-----------|----------|
| `DEPLOYMENT_CONSTRAINTS.md` | §6.1 ("Use Python `logging` — Ban `print()`"), §6.2 (Performance Logging for Critical Paths) |
| `ENGINEERING_STANDARDS_FRAMES.md` | §10 (Logging & Monitoring — "All critical operations must log execution time") |

### FRAMES Current Status: 🔴 0% Done

| Logging Item | Current State |
|-------------|--------------|
| `print()` → `logging` | ❌ `print()` used in `auth.py`, `admin.py`, `faculty.py`, `kiosk.py`, `main_kiosk.py` and others |
| Performance Logging | ❌ No query timing, no face recognition timing, no endpoint duration logging |
| Kiosk System Metrics | ⚠️ Partial — `system_metric` model exists, heartbeat endpoint exists, but no actual metric collection in kiosk code |

---

## Aspect 7: Testing & Verification

### Definition

Testing means **proving the system works correctly by running automated checks**, not just "I clicked the button and it worked". It answers: *"How do we know the code we just pushed doesn't break something?"*

This includes:
- **Unit Tests:** Individual functions (e.g., cosine similarity, PDF parsing, gesture classification)
- **Integration Tests:** API endpoint tests with test database (e.g., create user → enroll face → log attendance)
- **Edge Case Testing:** Empty states, invalid inputs, boundary values, concurrent requests
- **Frontend Testing:** Component renders, API mock tests, error state rendering
- **Pre-Deployment Gate:** The full checklist from `DEPLOYMENT_CONSTRAINTS.md` §7

### Where It's Stated in Our Rules

| Rule File | Sections |
|-----------|----------|
| `codingRules.md` | §7 (Testing & Verification — "Incorporate unit tests", "Test edge cases: empty states, error conditions") |
| `DEPLOYMENT_CONSTRAINTS.md` | §7 (Deployment Readiness Gate — mandatory checklist before ANY deployment) |

### FRAMES Current Status: 🔴 0% Done

| Testing Item | Current State |
|-------------|--------------|
| Backend Unit Tests | ❌ `backend/tests/` directory exists but appears empty/minimal |
| API Integration Tests | ❌ No automated endpoint testing |
| Frontend Tests | ❌ No test files in `frontend/src/` |
| Pre-Deployment Checklist | ❌ The checklist in §7 of DEPLOYMENT_CONSTRAINTS has 25+ items — most fail |
| AI Code Audit | ⚠️ This is what the Process Audit documents accomplish |

---

## Priority Order: What to Fix Next

Based on the rules and the audit, here's the recommended order after optimization:

| Priority | Aspect | Why This Order | Est. Total Effort |
|----------|--------|---------------|-------------------|
| **1st** | 🔴 **Security** (JWT + Auth) | Without this, the system is **wide open** — anyone can do anything. Deployment blocker. | 8-12 hours |
| **2nd** | 🔴 **Frontend Engineering** (API client + AuthContext) | Without centralized API, **frontend can't deploy**. Without AuthContext, JWT tokens can't be managed. These two are tightly coupled to security. | 8-12 hours |
| **3rd** | 🟡 **Error Handling** (AbortController + structured errors) | Memory leaks and silent failures hurt user experience and make debugging impossible. | 6-8 hours |
| **4th** | 🟡 **Architecture** (Service layer extraction) | `faculty.py` at 694 lines and `kiosk.py` at 621 lines are hard to maintain and test. Extracting services also makes testing (aspect 7) possible. | 6-8 hours |
| **5th** | 🔴 **Observability** (`print()` → `logging`) | Must be done before production so you can debug issues without SSH + `print`. Relatively quick. | 2-3 hours |
| **6th** | 🔴 **Testing** (Unit + integration tests) | Once services are extracted (aspect 4), writing tests becomes feasible. Proves everything works before deployment. | 10-15 hours |
| **7th** | 🟢 **Optimization** (remaining items) | The big optimizations are done. Remaining items (pagination on 2 endpoints, dept.py loop, kiosk refresh) are low-risk. | 3-4 hours |

**Total estimated effort remaining: ~45-60 hours of engineering work**

---

## Mapping: Rules → Aspects

This table shows every major rule section and which aspect it belongs to:

### From `codingRules.instructions.md`

| Section | Rule | Maps To Aspect |
|---------|------|---------------|
| §1 | Modular Structure, Separation of Concerns | Architecture |
| §2 | CamelCase/PascalCase/UPPER_SNAKE_CASE naming | Architecture |
| §3 | Avoid Slop Code (Race Conditions, State Desync, Missing Error Handling, Hardcoded Values) | Error Handling + Frontend |
| §4 | Comprehensive Error Management, FetchState type | Error Handling |
| §5 | Security Best Practices (no hardcoded keys, auth headers, sanitize inputs) | Security |
| §6 | Documentation & Comments | Architecture |
| §7 | Testing & Verification | Testing |
| §8 | Code Style & Standards (simplicity over cleverness) | Architecture |
| §9 | Performance Optimization (efficient algorithms, memoization, cleanup) | Optimization |
| §10 | Integration & Dependencies (minimal deps, no duplication) | Architecture |

### From `ENGINEERING_STANDARDS_FRAMES.md`

| Section | Rule | Maps To Aspect |
|---------|------|---------------|
| §1 | Optimize for Scale, Not Just Functionality | Optimization |
| §2 | Big O Performance Rules | Optimization |
| §3 | Strict Rule: No N+1 Queries | Optimization |
| §4 | Database Design Rules (indexes, no SELECT *) | Optimization |
| §5 | Face Recognition Optimization | Optimization |
| §6 | Caching Strategy | Optimization |
| §7 | Loop Rules | Optimization |
| §8 | Data Structure Rules | Optimization |
| §9 | Clean Architecture (UI → ViewModel → Service → Repository) | Architecture |
| §10 | Logging & Monitoring | Observability |
| §11 | Code Review Checklist | Testing |
| §12 | Performance Targets (<200ms frame, <100ms query) | Optimization |

### From `FRAMES_DEPLOYMENT_CONSTRAINTS.md`

| Section | Rule | Maps To Aspect |
|---------|------|---------------|
| §1.1 | Zero N+1 Queries | Optimization |
| §1.2 | All List Endpoints Must Have Pagination | Optimization |
| §1.3 | Structured Error Responses | Error Handling |
| §1.4 | Authentication Middleware — Non-Negotiable | **Security** |
| §1.5 | Database Connection Configuration | Optimization |
| §1.6 | Service Layer for Business Logic | Architecture |
| §2.1 | Required Indexes | Optimization |
| §2.2 | `datetime.now(timezone.utc)` | Optimization |
| §2.3 | CASCADE DELETE Consistency | Architecture |
| §3.1 | Centralized API Client — No Hardcoded URLs | **Frontend** |
| §3.2 | Every useEffect Must Have AbortController | **Frontend** |
| §3.3 | Three Mandatory UI States (Loading/Error/Success) | Error Handling + Frontend |
| §3.4 | No Mock/Hardcoded Data in Production | **Frontend** |
| §3.5 | Auth Context — Single Source of Truth | **Frontend** + Security |
| §3.6 | Route Protection | **Frontend** + Security |
| §4.1 | RPi Frame Processing Budget | Optimization |
| §4.2 | RPi Memory Ceiling | Optimization |
| §4.3 | Embedding Cache Lifecycle | Optimization |
| §4.4 | Graceful Shutdown (SIGTERM) | Error Handling |
| §4.5 | Offline-First Behavior | Error Handling |
| §5.1 | CORS — Lock Down | **Security** |
| §5.2 | Environment Variables | **Security** |
| §5.3 | Input Validation | **Security** |
| §5.4 | Rate Limiting | **Security** |
| §6.1 | Use Python `logging` — Ban `print()` | **Observability** |
| §6.2 | Performance Logging for Critical Paths | **Observability** |
| §7 | Pre-Deployment Checklist (25+ items) | **Testing** |
| §8.1-8.5 | AI Agent Execution Rules | All aspects |

---

## Summary

Your groupmate did the right thing starting with **optimization** — it was the P0 priority. But FRAMES has **7 engineering aspects**, not just 1. Every single one is explicitly required by the project rules.

The current state:

```
Optimization    ████████████████████░░░░  75%  ← PR #26 and your recent optimization
Security        ░░░░░░░░░░░░░░░░░░░░░░░░   0%  ← MOST URGENT
Architecture    ████░░░░░░░░░░░░░░░░░░░░  20%
Error Handling  ███████░░░░░░░░░░░░░░░░░  30%
Frontend        █░░░░░░░░░░░░░░░░░░░░░░░   5%  ← DEPLOYMENT BLOCKER
Observability   ░░░░░░░░░░░░░░░░░░░░░░░░   0%
Testing         ░░░░░░░░░░░░░░░░░░░░░░░░   0%
```

**Next focus should be: Security + Frontend Engineering (they're tightly coupled — JWT on backend requires AuthContext on frontend, which requires centralized API client).**

---

**Reference documents:**
- [FRAMES_Process_Audit_v2.md](audit/FRAMES_Process_Audit_v2.md) — detailed violation-level audit
- [FRAMES_DEPLOYMENT_CONSTRAINTS.md](../FRAMES_DEPLOYMENT_CONSTRAINTS.md) — the full rules
- [ENGINEERING_STANDARDS_FRAMES.md](../../.claude/rules/ENGINEERING_STANDARDS_FRAMES.md.instructions.md) — performance standards
- [codingRules.md](../../.claude/rules/codingRules.instructions.md) — general coding standards
- [FRAMES_SECURITY_RULES.md](../../.claude/rules/FRAMES_SECURITY_RULES.instructions.md) — JWT, auth, rate limiting, input validation
- [FRAMES_OBSERVABILITY_RULES.md](../../.claude/rules/FRAMES_OBSERVABILITY_RULES.instructions.md) — logging format, levels, health checks, metrics
- [FRAMES_TESTING_RULES.md](../../.claude/rules/FRAMES_TESTING_RULES.instructions.md) — test structure, fixtures, mocking, coverage
