# FRAMES Deployment Constraints & Optimization Rulebook

## Purpose

This document contains **strict, measurable, FRAMES-specific rules** that every contributor and AI coding agent MUST follow. These rules exist because FRAMES will be deployed for hundreds to thousands of users in a university environment.

These rules **supplement** (not replace) the existing `codingRules.instructions.md` and `ENGINEERING_STANDARDS_FRAMES.md`. Where conflicts exist, THIS document takes priority because it contains deployment-specific constraints.

**Philosophy:** Every rule here exists because the current codebase violates it. Each rule includes a BEFORE (broken) and AFTER (correct) example from the actual FRAMES code.

---

# SECTION 1: BACKEND API CONSTRAINTS

## Rule 1.1: ZERO N+1 Queries — Absolute Ban

Every endpoint MUST retrieve related data using JOINs, eager loading, or batch queries. Querying inside a loop is **FORBIDDEN**.

**Maximum allowed database round-trips per endpoint: 3**
(1 for auth/validation, 1 for primary data, 1 for aggregation — combine when possible)

### FORBIDDEN Pattern (Current Code)
```python
# ❌ BANNED — This fires 1 + (3 × N) queries
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
from sqlalchemy import func, case

# Option A: Eager loading for relationships
classes = (
    db.query(Class)
    .options(joinedload(Class.subject))
    .filter(Class.faculty_id == user_id)
    .all()
)

# Option B: Batch query for counts
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

### FORBIDDEN Pattern
```python
# ❌ BANNED — Loads ALL attendance records, no limit
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
    limit: int = 50,  # Default page size
    db: Session = Depends(get_db)
):
    # Cap maximum to prevent abuse
    limit = min(limit, 100)
    
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == user_id
    ).order_by(AttendanceLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    total = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.user_id == user_id
    ).scalar()
    
    return {"items": logs, "total": total, "skip": skip, "limit": limit}
```

### Limits
| Endpoint Type | Default `limit` | Max `limit` |
|---|---|---|
| Dashboard widgets (recent items) | 5 | 10 |
| List pages (attendance history, user list) | 50 | 100 |
| Export/report endpoints | 500 | 1000 |
| Admin bulk operations | 100 | 500 |

---

## Rule 1.3: Structured Error Responses — Consistent Contract

ALL API errors MUST return this shape:
```json
{
  "success": false,
  "error": {
    "code": "ENROLLMENT_NOT_FOUND",
    "message": "Student is not enrolled in this class",
    "details": null
  }
}
```

### FORBIDDEN
```python
# ❌ BANNED — Raw string messages, inconsistent shapes
raise HTTPException(status_code=404, detail="User not found")
raise HTTPException(status_code=500, detail=str(e))  # Leaks internal errors
```

### REQUIRED
```python
# ✅ CORRECT — Use error helper with error codes
from core.errors import api_error

raise api_error(404, "USER_NOT_FOUND", "User not found")
raise api_error(500, "INTERNAL_ERROR", "An unexpected error occurred")
# Log the actual error server-side, never expose str(e) to client
```

### Critical Rule: NEVER Expose Internal Errors
- `str(e)` or traceback information MUST NEVER appear in HTTP responses
- Log the real error with `logger.exception(...)`, return a generic message to client
- Use `print()` for NOTHING — use Python `logging` module exclusively

---

## Rule 1.4: Authentication Middleware — Non-Negotiable

FRAMES MUST have JWT-based authentication before deployment. Until implemented:

### Minimum Requirements
1. Every router (except `/api/auth/login` and `/api/auth/register`) MUST verify the caller
2. User ID MUST come from the JWT token, NOT from URL parameters
3. Role-based access: students cannot access faculty endpoints, faculty cannot access admin endpoints
4. Tokens MUST expire (recommended: 24h access token, 7d refresh token)

### FORBIDDEN
```python
# ❌ BANNED — user_id from URL with no authentication
@router.get("/dashboard/{user_id}")
def get_student_dashboard(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
```

### REQUIRED
```python
# ✅ CORRECT — user_id extracted from verified JWT
@router.get("/dashboard")
def get_student_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # current_user is already validated from JWT
    # No way to impersonate another user
```

---

## Rule 1.5: Database Connection Configuration

The `database.py` engine MUST use these settings for deployment:

```python
engine = create_engine(
    DATABASE_URL,
    echo=False,              # NEVER True in production — logs every SQL statement
    pool_pre_ping=True,      # Validates connections before use
    pool_size=5,             # Adjust per hosting tier (Aiven free = keep at 2-3)
    max_overflow=5,          # Total possible = pool_size + max_overflow
    pool_recycle=300,        # Recycle connections every 5 minutes (prevents stale)
    pool_timeout=30,         # Fail after 30s waiting for connection (don't hang forever)
)
```

### FORBIDDEN
- `echo=True` in any non-local environment
- Missing `pool_recycle` (causes mysterious "connection closed" errors after hours)
- Missing `pool_timeout` (requests hang forever under connection exhaustion)

---

## Rule 1.6: Service Layer for Business Logic

API routers MUST NOT contain business logic or database queries directly. Routers handle HTTP concerns only.

### Architecture (enforced)
```
Router (HTTP layer)     → receives request, validates input, calls service, returns response
Service (Business logic) → contains rules, orchestrates queries, returns domain objects
Repository/ORM (Data)   → executes queries, returns raw data
```

### FORBIDDEN
```python
# ❌ BANNED — Router contains query logic, attendance calculation, everything
@router.get("/schedule/{user_id}")
def get_faculty_schedule(user_id: int, db: Session = Depends(get_db)):
    classes = db.query(Class).filter(Class.faculty_id == user_id).all()
    for cls in classes:
        subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
        # ... 40 more lines of logic
```

### REQUIRED
```python
# ✅ CORRECT — Router delegates to service
@router.get("/schedule")
def get_faculty_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return faculty_service.get_schedule_with_stats(db, current_user.id)
```

Service files go in `backend/services/` — one per domain (e.g., `faculty_service.py`, `student_service.py`, `attendance_service.py`).

---

# SECTION 2: DATABASE SCHEMA RULES

## Rule 2.1: Required Indexes

Every foreign key column MUST have `index=True`. Every column used in `WHERE`, `ORDER BY`, or `GROUP BY` frequently MUST have an index.

### Mandatory Indexes for FRAMES

```python
# attendance_logs — highest volume table, queried constantly
user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
class_id = Column(Integer, ForeignKey("classes.id"), index=True)
device_id = Column(Integer, ForeignKey("devices.id"), index=True)
timestamp = Column(DateTime, default=datetime.utcnow, index=True)
action = Column(Enum(AttendanceAction), nullable=False, index=True)
is_late = Column(Boolean, default=False, index=True)

# Composite index for the most common query pattern
__table_args__ = (
    Index('ix_attendance_user_class_timestamp', 'user_id', 'class_id', 'timestamp'),
)

# classes — queried for schedule resolution
room = Column(String(100), index=True)
day_of_week = Column(String(20), index=True)
faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)

# users — queried for filtering
role = Column(Enum(UserRole), nullable=False, index=True)
verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, index=True)
department_id = Column(Integer, ForeignKey("departments.id"), index=True)

# enrollments — student_id already has a unique constraint, but add explicit index
student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)

# devices — room lookup for kiosk
room = Column(String(100), index=True)
```

### Rule: When Adding a New Column
If the column will appear in any `WHERE` or `JOIN` clause → add `index=True`.
If unsure → add the index. The write overhead is negligible for FRAMES' scale.

---

## Rule 2.2: Use `datetime.now(timezone.utc)` — Not `datetime.utcnow`

`datetime.utcnow()` is deprecated in Python 3.12+. All timestamp defaults MUST use timezone-aware datetimes.

```python
# ❌ BANNED
from datetime import datetime
timestamp = Column(DateTime, default=datetime.utcnow)

# ✅ CORRECT
from datetime import datetime, timezone
timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

---

## Rule 2.3: CASCADE DELETE Consistency

Every FK relationship MUST explicitly define `ondelete` behavior:

| Parent → Child | Required Behavior |
|---|---|
| User → FacialProfile | `CASCADE` (delete profile when user deleted) |
| User → Enrollments | `CASCADE` |
| User → AttendanceLogs | `CASCADE` |
| Class → Enrollments | `CASCADE` |
| Class → AttendanceLogs | `CASCADE` |
| Device → AttendanceLogs | `SET NULL` (keep attendance records if device is decommissioned) |
| Department → Users | `RESTRICT` (cannot delete dept with users) |
| Program → Users | `RESTRICT` |

---

# SECTION 3: FRONTEND ENGINEERING RULES

## Rule 3.1: Centralized API Client — No Hardcoded URLs

ALL API calls MUST go through a single axios instance. `http://localhost:5000` appearing ANYWHERE in component code is **FORBIDDEN**.

### REQUIRED Setup

**`frontend/src/services/api.js`**
```javascript
import axios from 'axios';

// In development, Vite proxy handles /api → localhost:5000
// In production, set VITE_API_BASE_URL to the real backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### FORBIDDEN
```jsx
// ❌ BANNED — direct axios with hardcoded URL
import axios from 'axios';
const response = await axios.get('http://localhost:5000/api/student/dashboard/5');
```

### REQUIRED
```jsx
// ✅ CORRECT — use centralized api instance with relative path
import api from '../../services/api';
const response = await api.get('/api/student/dashboard');
// user_id comes from JWT on server side, not URL
```

---

## Rule 3.2: Every useEffect Fetch MUST Have AbortController

React components that fetch data MUST cancel in-flight requests on unmount to prevent state updates on unmounted components and race conditions.

### FORBIDDEN
```jsx
// ❌ BANNED — no cleanup, race condition on fast navigation
useEffect(() => {
  const fetchData = async () => {
    const response = await api.get('/api/student/dashboard');
    setDashboardData(response.data);
  };
  fetchData();
}, []);
```

### REQUIRED
```jsx
// ✅ CORRECT — abort on unmount
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/student/dashboard', {
        signal: controller.signal
      });
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        setError('Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };
  
  fetchData();
  return () => controller.abort();
}, []);
```

---

## Rule 3.3: Three Mandatory UI States — Loading, Error, Success

Every component that fetches data MUST handle all three states visually. `console.error` alone is **FORBIDDEN** — users must see error feedback.

### REQUIRED State Pattern
```jsx
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

// In JSX:
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
if (!data) return <EmptyState />;
return <ActualContent data={data} />;
```

### FORBIDDEN
```jsx
// ❌ BANNED — silent failure, user sees nothing
} catch (err) {
  console.error(err);
}
```

---

## Rule 3.4: No Mock/Hardcoded Data in Production Components

Components MUST fetch real data from the API. Hardcoded arrays are only acceptable in:
- Test files (`*.test.jsx`)
- Storybook stories
- Documented placeholders with `// TODO: Replace with API call` AND a tracking issue

### FORBIDDEN
```jsx
// ❌ BANNED — hardcoded mock data in production component
const [users, setUsers] = useState([
  { id: 1, name: 'John Doe', role: 'STUDENT', status: 'Active' },
  { id: 2, name: 'Jane Smith', role: 'FACULTY', status: 'Active' },
]);
```

---

## Rule 3.5: Auth Context — Single Source of Truth

User authentication state MUST live in a React Context, not scattered `localStorage.getItem()` calls.

### REQUIRED
```jsx
// frontend/src/context/AuthContext.jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Validate token on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      validateToken(token).then(setUser).catch(logout);
    }
    setIsLoading(false);
  }, []);
  
  const login = async (email, password) => { /* ... */ };
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### FORBIDDEN
```jsx
// ❌ BANNED — parsing localStorage in every component
const user = JSON.parse(localStorage.getItem('currentUser'));
const userId = user?.id;
```

---

## Rule 3.6: Route Protection

Protected routes MUST verify authentication AND role before rendering. Unauthorized users MUST be redirected.

```jsx
// ✅ REQUIRED — Route guard component
function ProtectedRoute({ allowedRoles, children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  
  return children;
}

// Usage in App.jsx routes
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminLayout />
  </ProtectedRoute>
} />
```

---

# SECTION 4: EDGE DEVICE (RASPBERRY PI) CONSTRAINTS

## Rule 4.1: Frame Processing Budget

Total frame processing MUST stay within budget:

| Platform | Max Frame Time | Target FPS |
|---|---|---|
| RPi 4 (4GB) | < 250ms | 4-5 effective FPS |
| Laptop (test) | < 100ms | 10+ FPS |

If processing exceeds budget:
1. Increase `RECOGNITION_FRAME_SKIP` 
2. Reduce `RECOGNITION_DET_SIZE`
3. NEVER block the camera read loop — use async or threaded processing

---

## Rule 4.2: Memory Ceiling

RPi 4 has 4GB RAM shared with OS, GPU, camera buffer:

| Component | Max Budget |
|---|---|
| OS + Desktop | ~1.2 GB |
| InsightFace model (buffalo_l) | ~600 MB |
| MediaPipe (Hands + BlazeFace) | ~200 MB |
| Embedding cache (1000 users) | ~2 MB |
| OpenCV frame buffers | ~50 MB |
| Application headroom | ~500 MB |
| **Total allocatable** | **~2.5 GB** |

Rules:
- If embedding cache exceeds 2000 users → switch to on-disk index (FAISS or Annoy)
- NEVER load raw images into memory — embeddings only
- Monitor RSS memory via `system_metrics` and alert if > 3 GB

---

## Rule 4.3: Embedding Cache Lifecycle

The kiosk MUST manage embeddings properly:

1. **Load on startup** — fetch from API or local JSON cache
2. **Periodic refresh** — every `CACHE_REFRESH_MINUTES` (30 min), re-sync from API
3. **On class change** — when schedule resolver detects a new active class, reload enrolled students' embeddings
4. **Invalidation** — if API reports a new enrollment mid-session, add to cache without full reload

### REQUIRED: Implement periodic refresh (currently missing)
```python
# In main kiosk loop, track time since last cache refresh
if time.time() - last_cache_refresh > config.CACHE_REFRESH_MINUTES * 60:
    embedding_cache.refresh_from_api()
    last_cache_refresh = time.time()
```

---

## Rule 4.4: Graceful Shutdown

The kiosk MUST handle both keyboard interrupt AND SIGTERM (for systemd service management):

```python
import signal

def _handle_sigterm(signum, frame):
    """Handle systemd stop gracefully."""
    raise KeyboardInterrupt  # Reuse existing cleanup logic

signal.signal(signal.SIGTERM, _handle_sigterm)
```

---

## Rule 4.5: Offline-First Behavior

When the backend API is unreachable:
1. Log attendance to `offline_attendance.json` (already implemented)
2. Display "OFFLINE MODE" on kiosk screen clearly
3. Continue recognizing faces using cached embeddings
4. Flush offline queue when connectivity returns (already implemented)
5. NEVER crash or freeze — the kiosk must always remain operational

---

# SECTION 5: SECURITY CONSTRAINTS

## Rule 5.1: CORS — Lock Down Before Deployment

```python
# ❌ BANNED in production
allow_origins=["*"]

# ✅ REQUIRED — explicit origins
allow_origins=[
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]
```

---

## Rule 5.2: Environment Variables — Required List

These MUST be in `.env` and NEVER hardcoded:

| Variable | Purpose | Where Used |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Backend |
| `JWT_SECRET_KEY` | Token signing | Backend |
| `FRONTEND_URL` | CORS allowed origin | Backend |
| `VITE_API_BASE_URL` | Backend URL for production | Frontend |
| `BACKEND_URL` | API URL for kiosk | RPi |
| `DEVICE_ID` | Kiosk identity | RPi |
| `DEVICE_ROOM` | Room assignment | RPi |

---

## Rule 5.3: Input Validation

- ALL user inputs MUST be validated via Pydantic schemas (backend) or checked before submission (frontend)
- File uploads (PDF schedule) MUST validate: file type, file size (max 10MB), content
- Query parameters used in database queries MUST be parameterized (SQLAlchemy handles this, but NEVER use `text()` with f-strings)

---

## Rule 5.4: Rate Limiting on Sensitive Endpoints

These endpoints MUST have rate limits:

| Endpoint | Limit | Reason |
|---|---|---|
| `/api/auth/login` | 5 per minute per IP | Prevent brute force |
| `/api/face/enroll` | 3 per minute per user | Heavy processing |
| `/api/kiosk/attendance/log` | 1 per 10 seconds per user | Prevent duplicate scans |
| `/api/faculty/upload-schedule` | 5 per minute per user | Heavy processing |

---

# SECTION 6: LOGGING & MONITORING

## Rule 6.1: Use Python `logging` — Ban `print()`

```python
# ❌ BANNED
print(f"User {user_id} logged attendance")
print(f"Error: {e}")

# ✅ REQUIRED
import logging
logger = logging.getLogger(__name__)

logger.info("User %d logged attendance for class %d", user_id, class_id)
logger.exception("Failed to log attendance")  # Includes traceback automatically
```

---

## Rule 6.2: Performance Logging for Critical Paths

These operations MUST log execution time:
- Database queries over 100ms
- Face recognition inference
- Embedding comparison (batch)
- Schedule upload parsing
- Report generation

```python
import time

start = time.perf_counter()
result = db.query(...).all()
elapsed = (time.perf_counter() - start) * 1000
if elapsed > 100:
    logger.warning("Slow query in get_faculty_schedule: %.1fms", elapsed)
```

---

# SECTION 7: DEPLOYMENT READINESS GATE

Before ANY deployment (including demo to professor), ALL of these MUST pass:

## Pre-Deployment Checklist

### Backend (Mandatory)
- [ ] `echo=False` in database.py engine configuration
- [ ] `pool_recycle` and `pool_timeout` configured
- [ ] Zero `print()` statements — all replaced with `logging`
- [ ] All FK columns have `index=True`
- [ ] Composite index on `attendance_logs(user_id, class_id, timestamp)`
- [ ] No N+1 queries — zero `db.query()` inside `for` loops
- [ ] All list endpoints have pagination (`skip`/`limit`)
- [ ] JWT authentication middleware active
- [ ] CORS locked to specific frontend URL
- [ ] Rate limiting on auth and enrollment endpoints
- [ ] `str(e)` never exposed in HTTP responses
- [ ] `datetime.utcnow` replaced with `datetime.now(timezone.utc)`

### Frontend (Mandatory)
- [ ] Zero `http://localhost:5000` in source code
- [ ] Centralized API client (`services/api.js`) used everywhere
- [ ] `AbortController` in every `useEffect` fetch
- [ ] Loading/Error/Success states on every data-fetching component
- [ ] AuthContext implemented and used (no raw `localStorage`)
- [ ] Route guards on all protected routes
- [ ] Zero hardcoded mock data in production components
- [ ] `VITE_API_BASE_URL` environment variable configured

### RPi / Kiosk (Mandatory)
- [ ] SIGTERM handler for graceful systemd shutdown
- [ ] Periodic embedding cache refresh implemented
- [ ] Offline mode clearly indicated on screen
- [ ] Frame processing within budget (<250ms on RPi)
- [ ] Memory usage monitored and within 2.5GB ceiling

### Testing (Mandatory)
- [ ] Every API endpoint manually tested with valid AND invalid input
- [ ] Attendance state machine tested: ENTRY → BREAK_OUT → BREAK_IN → EXIT
- [ ] Concurrent user test: 10+ simultaneous kiosk requests
- [ ] Frontend tested on slow network (Chrome DevTools throttling)
- [ ] Database query count verified per endpoint (max 3 round-trips)

---

# SECTION 8: AI AGENT-SPECIFIC EXECUTION RULES

These rules constrain how AI coding agents (GitHub Copilot, Claude, etc.) modify FRAMES code:

## Rule 8.1: Before Writing ANY Database Query
1. Check if the data can be fetched with an existing query by adding `joinedload()`
2. If a new query is needed, verify it doesn't duplicate existing queries
3. NEVER write `db.query()` inside a `for` loop — restructure as batch query

## Rule 8.2: Before Creating ANY New File
1. Check if the functionality belongs in an existing file
2. Files MUST NOT exceed 300 lines — split if approaching
3. Follow existing naming convention (`snake_case.py` for Python, `PascalCase.jsx` for React)

## Rule 8.3: Before Modifying ANY Frontend Component
1. Verify `AbortController` is present in all `useEffect` fetches
2. Verify loading/error states exist
3. Use `api` import from `services/api.js` — never raw `axios`
4. Use `useAuth()` hook — never raw `localStorage`

## Rule 8.4: Before Modifying ANY Model
1. Add `index=True` to any new FK or frequently-queried column
2. Use `datetime.now(timezone.utc)` for timestamp defaults
3. Define `ondelete` behavior on every FK

## Rule 8.5: Code Quality Gate
Every AI-generated change MUST:
- Have zero `print()` statements (use `logging`)
- Have zero hardcoded URLs
- Have explicit error handling (no bare `except:`)
- Include a brief docstring on new functions
- Follow camelCase (JS) / snake_case (Python) naming

---

# Summary: Priority Order for Fixing FRAMES

If you're fixing the codebase based on these rules, follow this order:

| Priority | Task | Impact |
|---|---|---|
| 🔴 P0 | Add `index=True` to all FK columns in models | Prevents full table scans |
| 🔴 P0 | Fix N+1 queries in faculty.py, student.py, kiosk.py | Prevents 400+ queries per request |
| 🔴 P0 | Create `services/api.js` and replace all hardcoded URLs | Deployment blocker |
| 🔴 P0 | Set `echo=False`, add `pool_recycle`, `pool_timeout` | Production stability |
| 🟡 P1 | Implement JWT authentication | Security requirement |
| 🟡 P1 | Create AuthContext, replace localStorage parsing | Frontend architecture |
| 🟡 P1 | Add AbortController to all useEffect fetches | Prevents memory leaks |
| 🟡 P1 | Add pagination to list endpoints | Prevents OOM on large datasets |
| 🟢 P2 | Service layer extraction from routers | Code maintainability |
| 🟢 P2 | Replace all `print()` with `logging` | Production observability |
| 🟢 P2 | Rate limiting | Security hardening |
| 🟢 P2 | SIGTERM + periodic cache refresh on kiosk | RPi stability |
| 🔵 P3 | Replace mock data in admin pages | Feature completeness |
| 🔵 P3 | Add route guards | Security UX |
| 🔵 P3 | CORS lockdown | Pre-deployment |

---

**This document is law for FRAMES development. No exceptions. No shortcuts.**
