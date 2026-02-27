# FRAMES Deployment Constraints & Optimization Rulebook

## Purpose

This document contains **strict, measurable, FRAMES-specific rules** that every contributor and AI coding agent MUST follow. These rules exist because FRAMES will be deployed for hundreds to thousands of users in a university environment.

These rules **supplement** (not replace) the existing `codingRules.instructions.md` and `ENGINEERING_STANDARDS_FRAMES.md`. Where conflicts exist, THIS document takes priority because it contains deployment-specific constraints.

**Philosophy:** Every rule here exists because the current codebase violates it. Each rule includes a BEFORE (broken) and AFTER (correct) example from the actual FRAMES code.

> **For the Team:** This document was generated after a full audit of the FRAMES codebase on February 20, 2026. It identifies concrete violations in our code and provides the exact patterns to follow when fixing them.

---

# SECTION 1: BACKEND API CONSTRAINTS

## Rule 1.1: ZERO N+1 Queries — Absolute Ban

Every endpoint MUST retrieve related data using JOINs, eager loading, or batch queries. Querying inside a loop is **FORBIDDEN**.

**Maximum allowed database round-trips per endpoint: 3**
(1 for auth/validation, 1 for primary data, 1 for aggregation — combine when possible)

### Current Violations Found

| File | Endpoint | Queries Generated |
|------|----------|-------------------|
| `faculty.py` | `get_faculty_schedule` | 1 + 3×N (10 classes = 31 queries) |
| `faculty.py` | `get_class_details_by_schedule_id` | 1 + 2×N (40 students = 82 queries) |
| `faculty.py` | `get_class_details` | 1 + N (40 students = 41 queries) |
| `student.py` | `get_student_dashboard` | 1 + 2×N (3 recent logs = 7 queries) |
| `student.py` | `get_student_schedule` | 1 + 3×N (6 subjects = 19 queries) |
| `student.py` | `get_attendance_history` | 1 + 2×N (200 records = 401 queries!) |
| `kiosk.py` | `get_active_class` | 1 + 2×N per matching class |

### FORBIDDEN Pattern (From Our Code)
```python
# ❌ BANNED — This is from faculty.py lines 74-118
classes = db.query(Class).filter(Class.faculty_id == user_id).all()
for cls in classes:
    subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
    total_students = db.query(Enrollment).filter(Enrollment.class_id == cls.id).count()
    present_count = db.query(AttendanceLog).filter(AttendanceLog.class_id == cls.id).count()
```

### REQUIRED Pattern
```python
# ✅ CORRECT — Single query with JOINs + subqueries
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import func

# Option A: Eager loading for relationships
classes = (
    db.query(Class)
    .options(joinedload(Class.subject))
    .filter(Class.faculty_id == user_id)
    .all()
)

# Option B: Batch query for counts (instead of per-class loop)
enrollment_counts = dict(
    db.query(Enrollment.class_id, func.count(Enrollment.id))
    .filter(Enrollment.class_id.in_([c.id for c in classes]))
    .group_by(Enrollment.class_id)
    .all()
)
```

### Verification Checklist
Before any endpoint is merged, count the number of `db.query()` calls:
- If any `db.query()` is inside a `for` loop → **REJECT**
- If total `db.query()` calls > 3 → **JUSTIFY in code comment why**
- If endpoint returns a list → **MUST use JOIN or batch query**

---

## Rule 1.2: All List Endpoints MUST Have Pagination

Any endpoint that returns a list of records MUST accept `skip` and `limit` parameters.

### FORBIDDEN Pattern (From Our Code)
```python
# ❌ BANNED — From student.py get_attendance_history, loads ALL records
logs = db.query(AttendanceLog).filter(
    AttendanceLog.user_id == user_id
).order_by(AttendanceLog.timestamp.desc()).all()
```

### REQUIRED Pattern
```python
# ✅ CORRECT — Paginated with sensible defaults
@router.get("/history/{user_id}")
def get_attendance_history(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    limit = min(limit, 100)  # Cap maximum to prevent abuse
    
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == user_id
    ).order_by(AttendanceLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    total = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.user_id == user_id
    ).scalar()
    
    return {"items": logs, "total": total, "skip": skip, "limit": limit}
```

### Page Size Limits
| Endpoint Type | Default `limit` | Max `limit` |
|---|---|---|
| Dashboard widgets (recent items) | 5 | 10 |
| List pages (attendance history, user list) | 50 | 100 |
| Export/report endpoints | 500 | 1000 |

---

## Rule 1.3: Structured Error Responses

ALL API errors MUST return consistent shape. NEVER expose `str(e)` to clients.

### FORBIDDEN
```python
# ❌ BANNED — From faculty.py upload_schedule exception handler
raise HTTPException(status_code=500, detail=str(e))  # Leaks internal errors!
```

### REQUIRED
```python
# ✅ CORRECT — Generic message to client, detailed log server-side
import logging
logger = logging.getLogger(__name__)

try:
    # ... operation
except Exception as e:
    logger.exception("Failed to upload schedule for user %d", user_id)
    raise HTTPException(status_code=500, detail="Failed to process schedule upload")
```

---

## Rule 1.4: Authentication Middleware — Non-Negotiable

**Current state:** Every API endpoint is publicly accessible. No JWT, no tokens, no API keys. Anyone can call `/api/admin/user/{id}` to delete any user.

### Minimum Requirements Before Deployment
1. JWT-based authentication on every endpoint (except login/register)
2. User ID comes from JWT token, NOT from URL parameters
3. Role-based access control (students can't hit faculty endpoints)
4. Token expiry (24h access, 7d refresh recommended)

### FORBIDDEN
```python
# ❌ BANNED — user_id from URL, anyone can impersonate anyone
@router.get("/dashboard/{user_id}")
def get_student_dashboard(user_id: int, db: Session = Depends(get_db)):
```

### REQUIRED
```python
# ✅ CORRECT — user_id from verified JWT
@router.get("/dashboard")
def get_student_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # current_user is already validated, no impersonation possible
```

---

## Rule 1.5: Database Connection Configuration

### Current Problems in database.py
- `echo=True` — logs EVERY SQL statement (destroys performance)
- No `pool_recycle` — stale connections crash after hours
- No `pool_timeout` — requests hang forever under load

### REQUIRED Configuration
```python
engine = create_engine(
    DATABASE_URL,
    echo=False,              # NEVER True in production
    pool_pre_ping=True,      # Validates connections before use
    pool_size=5,             # Adjust per hosting tier (Aiven free = 2-3)
    max_overflow=5,          # Total possible = pool_size + max_overflow
    pool_recycle=300,        # Recycle connections every 5 minutes
    pool_timeout=30,         # Fail after 30s (don't hang forever)
)
```

---

## Rule 1.6: Service Layer for Business Logic

Routers MUST NOT contain business logic or direct database queries. Routers handle HTTP only.

```
Router (HTTP) → receives request, calls service, returns response
Service (Logic) → contains rules, orchestrates queries
Models/ORM (Data) → executes queries
```

### FORBIDDEN
```python
# ❌ BANNED — Router has 50+ lines of query logic
@router.get("/schedule/{user_id}")
def get_faculty_schedule(user_id: int, db=Depends(get_db)):
    classes = db.query(Class).filter(...).all()
    for cls in classes:
        subject = db.query(Subject).filter(...).first()
        # ... 40 more lines
```

### REQUIRED
```python
# ✅ Router delegates to service
@router.get("/schedule")
def get_faculty_schedule(current_user=Depends(get_current_user), db=Depends(get_db)):
    return faculty_service.get_schedule_with_stats(db, current_user.id)
```

---

# SECTION 2: DATABASE SCHEMA RULES

## Rule 2.1: Required Indexes

**Current state:** Zero explicit `index=True` on any column beyond PK/unique. This means full table scans on every query.

### Mandatory Indexes

```python
# attendance_logs (highest volume table)
user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
class_id = Column(Integer, ForeignKey("classes.id"), index=True)
device_id = Column(Integer, ForeignKey("devices.id"), index=True)
timestamp = Column(DateTime, index=True)
action = Column(Enum(AttendanceAction), nullable=False, index=True)
is_late = Column(Boolean, default=False, index=True)

# Composite index for the most common query pattern
__table_args__ = (
    Index('ix_attendance_user_class_timestamp', 'user_id', 'class_id', 'timestamp'),
)

# classes
room = Column(String(100), index=True)
day_of_week = Column(String(20), index=True)
faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)

# users
role = Column(Enum(UserRole), nullable=False, index=True)
verification_status = Column(Enum(VerificationStatus), index=True)
department_id = Column(Integer, ForeignKey("departments.id"), index=True)

# devices
room = Column(String(100), index=True)
```

### Rule: When Adding a New Column
If the column will appear in any `WHERE` or `JOIN` clause → add `index=True`.

---

## Rule 2.2: Timezone-Aware Timestamps

`datetime.utcnow()` is deprecated in Python 3.12+.

```python
# ❌ BANNED
timestamp = Column(DateTime, default=datetime.utcnow)

# ✅ CORRECT
from datetime import datetime, timezone
timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

---

## Rule 2.3: CASCADE DELETE Consistency

| Parent → Child | Behavior |
|---|---|
| User → FacialProfile | CASCADE |
| User → Enrollments | CASCADE |
| User → AttendanceLogs | CASCADE |
| Class → Enrollments | CASCADE |
| Class → AttendanceLogs | CASCADE |
| Device → AttendanceLogs | SET NULL (keep records if device removed) |
| Department → Users | RESTRICT (can't delete dept with users) |

---

# SECTION 3: FRONTEND ENGINEERING RULES

## Rule 3.1: Centralized API Client

**Current state:** `http://localhost:5000` hardcoded in every component. Vite proxy is configured but unused.

### REQUIRED: Create `frontend/src/services/api.js`
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

Then use `api.get('/api/student/dashboard')` instead of `axios.get('http://localhost:5000/api/student/dashboard')`.

---

## Rule 3.2: AbortController in Every useEffect Fetch

**Current state:** Zero AbortController usage. All fetch calls can set state on unmounted components.

```jsx
// ✅ REQUIRED pattern
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/endpoint', { signal: controller.signal });
      setData(response.data);
      setError(null);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError('Failed to load data');
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };
  
  fetchData();
  return () => controller.abort();
}, [dependency]);
```

---

## Rule 3.3: Three Mandatory UI States

Every data-fetching component MUST show Loading, Error, and Success states. `console.error` alone is **FORBIDDEN**.

```jsx
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
if (!data) return <EmptyState />;
return <ActualContent data={data} />;
```

---

## Rule 3.4: No Mock/Hardcoded Data

**Current state:** AdminDashboardPage, UserManagementPage, SystemLogsPage use 100% hardcoded arrays.

All production components MUST fetch real data from the API.

---

## Rule 3.5: Auth Context Required

**Current state:** Every component does `JSON.parse(localStorage.getItem('currentUser'))` separately.

Create `AuthContext` with `useAuth()` hook. Single source of truth for auth state.

---

## Rule 3.6: Route Protection

Protected routes MUST check authentication AND role before rendering.

```jsx
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminLayout />
  </ProtectedRoute>
} />
```

---

# SECTION 4: EDGE DEVICE (RASPBERRY PI) CONSTRAINTS

## Rule 4.1: Frame Processing Budget

| Platform | Max Frame Time | Target |
|---|---|---|
| RPi 4 | < 250ms | 4-5 effective FPS |
| Laptop | < 100ms | 10+ FPS |

## Rule 4.2: Memory Ceiling — 2.5 GB Max for Application

| Component | Budget |
|---|---|
| InsightFace model | ~600 MB |
| MediaPipe | ~200 MB |
| Embedding cache (1000 users) | ~2 MB |
| OpenCV buffers | ~50 MB |
| Headroom | ~500 MB |

If exceeding 2000 users → use on-disk index (FAISS).

## Rule 4.3: Embedding Cache — Periodic Refresh Required

Currently DEFINED (`CACHE_REFRESH_MINUTES = 30`) but NEVER implemented. Must be added to main kiosk loop.

## Rule 4.4: Graceful Shutdown — Handle SIGTERM

Currently only handles `KeyboardInterrupt`. Must also handle SIGTERM for systemd service.

## Rule 4.5: Offline-First — Never Crash

Kiosk must operate using cached embeddings when API is unreachable. Display "OFFLINE MODE" clearly.

---

# SECTION 5: SECURITY CONSTRAINTS

| Rule | Current State | Required |
|---|---|---|
| CORS | `allow_origins=["*"]` | Lock to `FRONTEND_URL` env var |
| Secrets | `DATABASE_URL` in .env ✅ | Add `JWT_SECRET_KEY`, `FRONTEND_URL` |
| Input Validation | Pydantic on some endpoints | ALL endpoints must validate |
| Rate Limiting | None | Login: 5/min, Enrollment: 3/min |
| `print()` | Used in most routers | Replace with `logging` module |

---

# SECTION 6: DEPLOYMENT READINESS CHECKLIST

Before deploying or demoing to professor, ALL must pass:

### Backend
- [ ] `echo=False` in database.py
- [ ] `pool_recycle=300` and `pool_timeout=30` configured
- [ ] Zero `print()` — all replaced with `logging`
- [ ] All FK columns have `index=True`
- [ ] Composite index on `attendance_logs(user_id, class_id, timestamp)`
- [ ] No N+1 queries — zero `db.query()` inside `for` loops
- [ ] All list endpoints paginated
- [ ] JWT authentication active
- [ ] CORS locked to frontend URL
- [ ] `str(e)` never in HTTP responses

### Frontend
- [ ] Zero `http://localhost:5000` in source code
- [ ] Centralized `api.js` client used everywhere
- [ ] `AbortController` in every `useEffect` fetch
- [ ] Loading/Error/Success states everywhere
- [ ] AuthContext implemented
- [ ] Route guards on protected routes
- [ ] Zero hardcoded mock data

### RPi / Kiosk
- [ ] SIGTERM handler
- [ ] Periodic cache refresh implemented
- [ ] Offline mode indicator
- [ ] Frame processing within budget

---

# Fix Priority Order

| Priority | Task | Why |
|---|---|---|
| 🔴 P0 | Add `index=True` to all FK columns | Prevents full table scans |
| 🔴 P0 | Fix N+1 queries (faculty.py, student.py, kiosk.py) | Prevents 400+ queries per request |
| 🔴 P0 | Create `services/api.js`, replace hardcoded URLs | Deployment blocker |
| 🔴 P0 | Fix `echo=False`, add pool settings | Production stability |
| 🟡 P1 | JWT authentication | Security requirement |
| 🟡 P1 | AuthContext + replace localStorage parsing | Frontend architecture |
| 🟡 P1 | AbortController in all useEffect fetches | Prevents memory leaks |
| 🟡 P1 | Pagination on list endpoints | Prevents OOM at scale |
| 🟢 P2 | Service layer extraction | Maintainability |
| 🟢 P2 | Replace `print()` with `logging` | Observability |
| 🟢 P2 | Rate limiting | Security hardening |
| 🟢 P2 | SIGTERM + cache refresh on kiosk | RPi stability |
| 🔵 P3 | Replace mock data in admin pages | Feature completeness |
| 🔵 P3 | Route guards | Security UX |
| 🔵 P3 | CORS lockdown | Pre-deployment |

---

**This document is law for FRAMES development. No exceptions. No shortcuts.**

---

*Generated: February 20, 2026 — Based on full codebase audit*
*Source file: `.claude/rules/FRAMES_DEPLOYMENT_CONSTRAINTS.instructions.md`*
