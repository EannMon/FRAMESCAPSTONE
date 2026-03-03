# Capstone FRAMES — Comprehensive Technology & Architecture Analysis

**FRAMES** — Facial Recognition Attendance and Monitoring Educational System  
**Version:** 2.1.0 | **Date:** March 4, 2026  
**Institution:** Technological University of the Philippines — Manila  
**Authors:** Capstone Team  
**Status:** Pre-Deployment / Capstone Defense

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Backend Technology Stack](#3-backend-technology-stack)
4. [Frontend Technology Stack](#4-frontend-technology-stack)
5. [Edge Device (RPi Kiosk) Stack](#5-edge-device-rpi-kiosk-stack)
6. [Database Technology](#6-database-technology)
7. [Facial Recognition Pipeline Deep-Dive](#7-facial-recognition-pipeline-deep-dive)
8. [Embedding Mathematics & Comparison](#8-embedding-mathematics--comparison)
9. [Performance Concepts & Metrics](#9-performance-concepts--metrics)
10. [Framework & Library Comparisons](#10-framework--library-comparisons)
11. [Security Architecture](#11-security-architecture)
12. [Optimization Strategies](#12-optimization-strategies)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Cost Analysis](#14-cost-analysis)
15. [Terminology Glossary](#15-terminology-glossary)
16. [References](#16-references)

---

## 1. Executive Summary

FRAMES is a **three-tier system** combining a modern web application with edge computing for real-time facial recognition attendance tracking. The system serves four user roles:

| Role | Count (Expected) | Primary Interaction |
|------|------------------|-------------------|
| **Students** | 1,000–5,000 | Web dashboard + kiosk face scan |
| **Faculty** | 50–200 | Web dashboard + kiosk face scan |
| **Department Heads** | 5–15 | Web dashboard (management) |
| **Administrators** | 2–5 | Web dashboard (system-wide) |

### Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRAMES Architecture                       │
│                                                                   │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────────┐   │
│  │ Frontend  │────▶│   Backend    │────▶│  PostgreSQL (Aiven)│   │
│  │ React SPA │     │  FastAPI     │     │  Cloud Database     │   │
│  │ Vite/3000 │◀────│  Uvicorn/5000│◀────│  SSL/TLS           │   │
│  └──────────┘     └──────┬───────┘     └────────────────────┘   │
│                          │                                        │
│                          │ REST API                               │
│                          │                                        │
│  ┌───────────────────────▼──────────────────────┐               │
│  │        RPi 4 Kiosk (Edge Device)              │               │
│  │  Camera → InsightFace → Embedding Match       │               │
│  │  → Gesture Verify → Log Attendance            │               │
│  └───────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Key Technology Choices

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Backend API | FastAPI | 0.128.0 | Async, auto-docs, type-safe, fastest Python framework |
| Frontend | React | 19.2.0 | Component-based, vast ecosystem, team expertise |
| Database | PostgreSQL | 15 (Aiven) | ACID-compliant, JSON support, enterprise-grade |
| Face Recognition | InsightFace (buffalo_l) | 0.7.3 | State-of-art accuracy, ONNX portable, open-source |
| Gesture Detection | MediaPipe | 0.10.14 | Lightweight, real-time, cross-platform |
| Edge Device | Raspberry Pi 4 (4GB) | — | Cost-effective, Linux-based, GPIO/camera support |

---

## 2. System Architecture Overview

### 2.1 Three-Tier + Edge Architecture

FRAMES extends the traditional three-tier pattern with an **edge computing layer**:

| Tier | Component | Technology | Responsibility |
|------|-----------|-----------|---------------|
| **Presentation** | React SPA | React 19, Vite, Axios | User interface, state management, routing |
| **Application** | REST API | FastAPI, SQLAlchemy, Pydantic | Business logic, auth, data validation |
| **Data** | Cloud Database | PostgreSQL 15 (Aiven) | Persistent storage, indexes, constraints |
| **Edge** | RPi Kiosk | InsightFace, MediaPipe, OpenCV | Real-time face/gesture recognition, local cache |

### 2.2 Communication Patterns

```
Frontend (Browser)
    │
    ├── HTTPS/REST ──▶ Backend API (FastAPI)
    │   Headers: Authorization: Bearer <JWT>
    │   Content-Type: application/json
    │
Backend API
    │
    ├── SQLAlchemy ORM ──▶ PostgreSQL (Aiven, SSL)
    │   Connection Pool: 3 + 3 overflow
    │
    ├── REST ◀── RPi Kiosk (polling)
    │   Headers: X-Device-Key: <API_KEY>
    │
RPi Kiosk
    │
    ├── REST ──▶ Backend API (attendance logging)
    │   Fallback: offline_attendance.json (local queue)
    │
    ├── USB/CSI ◀── Camera (video stream)
    │
    └── ONNX Runtime ◀── InsightFace model files (~600MB)
```

### 2.3 Data Flow: Attendance Lifecycle

```
1. Camera captures frame (every 200ms on RPi)
2. MediaPipe BlazeFace detects face presence (~30ms)
3. InsightFace extracts 512-d embedding (~200ms)
4. Embedding compared against cached enrolled faces (~5ms)
5. If match found → check attendance state machine
6. If gesture required → MediaPipe Hands verifies gesture (~50ms)
7. POST /api/kiosk/attendance/log → backend logs to PostgreSQL
8. If API unreachable → queue locally, flush on reconnect
```

---

## 3. Backend Technology Stack

### 3.1 Core Framework: FastAPI 0.128.0

**What it is:** FastAPI is a modern, high-performance Python web framework for building APIs with Python 3.7+ based on standard Python type hints. It was created by Sebastián Ramírez in 2018.

**How it works:** FastAPI is built on top of **Starlette** (ASGI framework) for the web parts and **Pydantic** for the data parts. It uses Python type annotations to automatically validate request/response data, generate OpenAPI/Swagger documentation, and provide IDE autocompletion.

**Why FastAPI was chosen over alternatives:**

| Feature | FastAPI | Flask | Django REST | Express.js |
|---------|---------|-------|-------------|------------|
| **Performance** | ~15,000 req/s | ~3,000 req/s | ~2,500 req/s | ~12,000 req/s |
| **Type Safety** | Built-in (Pydantic) | Manual | Serializers | Manual |
| **Auto Documentation** | Swagger + ReDoc | Manual/Flasgger | Built-in | swagger-jsdoc |
| **Async Support** | Native | Quart needed | Channels | Native |
| **Learning Curve** | Low | Very Low | High | Low |
| **Dependency Injection** | Built-in `Depends()` | Manual | Manual | Manual |
| **Data Validation** | Automatic via types | Manual | Serializers | express-validator |

**Key Features Used in FRAMES:**
- **Dependency Injection** (`Depends()`): Used for database sessions, JWT authentication, role checking
- **Pydantic Models**: All request/response schemas validated automatically
- **APIRouter**: Modular router organization by domain (student, faculty, admin, kiosk)
- **Middleware**: CORS, rate limiting, error handling
- **OpenAPI**: Auto-generated API documentation at `/docs`

**How it's applied in FRAMES:**
```python
# backend/main.py — FastAPI application initialization
app = FastAPI(title="FRAMES API", version="2.1.0")

# backend/api/routers/student.py — Route with dependency injection
@router.get("/schedule/{user_id}", response_model=List[ScheduleItem])
def get_student_schedule(
    user_id: int,                        # Validated by FastAPI
    db: Session = Depends(get_db),        # DB session injected
):
```

### 3.2 ASGI Server: Uvicorn 0.40.0

**What it is:** Uvicorn is a lightning-fast ASGI (Asynchronous Server Gateway Interface) server implementation, built on `uvloop` and `httptools`. It serves as the interface between the web framework and the operating system's network layer.

**How it works:** Uvicorn listens on a TCP port, accepts HTTP connections, and passes requests to the ASGI application (FastAPI). It supports HTTP/1.1, WebSocket, and HTTP/2.

**WSGI vs ASGI:**
| Protocol | Model | Framework | Concurrency |
|----------|-------|-----------|-------------|
| WSGI | Synchronous | Flask, Django | One request per thread |
| ASGI | Asynchronous | FastAPI, Django Channels | Many concurrent requests |

**In FRAMES:** Uvicorn runs with `--reload` in development (auto-restart on file changes) and without it in production. It binds to `0.0.0.0:5000`.

### 3.3 ORM: SQLAlchemy 2.0.46

**What it is:** SQLAlchemy is the most popular Python SQL toolkit and Object-Relational Mapping (ORM) library. It provides a full suite of enterprise-level persistence patterns.

**How it works:** SQLAlchemy maps Python classes to database tables and Python objects to rows. It translates method calls into SQL queries, manages connections via a pool, and handles transactions.

**Why SQLAlchemy over alternatives:**

| Feature | SQLAlchemy | Django ORM | Peewee | Tortoise ORM |
|---------|-----------|------------|--------|-------------|
| **Framework coupling** | Framework-agnostic | Django-only | Framework-agnostic | Async-only |
| **Query power** | Full SQL expressiveness | Limited | Moderate | Moderate |
| **Connection pooling** | Built-in, configurable | Basic | Basic | Basic |
| **Eager loading** | `joinedload()`, `selectinload()` | `select_related()`, `prefetch_related()` | Manual | Limited |
| **Migration tool** | Alembic | Django migrations | playhouse.migrate | Aerich |
| **Maturity** | 15+ years | 15+ years | 10+ years | 5 years |

**Key Patterns Used in FRAMES:**
- **`joinedload()`**: Eager-loads related objects in a single SQL JOIN to prevent N+1 queries
- **`selectinload()`**: Loads related objects in a separate IN query (better for one-to-many)
- **Connection Pooling**: `pool_size=3, max_overflow=3, pool_recycle=300, pool_timeout=10`
- **Declarative Base**: All models inherit from `Base` with automatic table mapping

### 3.4 Data Validation: Pydantic 2.12.5

**What it is:** Pydantic is a data validation library that uses Python type annotations to validate data shapes, enforce constraints, and serialize/deserialize JSON.

**How it works:** You define a class inheriting from `BaseModel` with typed fields. When data is passed in, Pydantic automatically validates types, applies constraints, and raises descriptive errors if validation fails.

**In FRAMES:**
```python
class ScheduleItem(BaseModel):
    class_id: int
    subject_code: Optional[str] = None
    subject_title: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None
    faculty_name: Optional[str] = None
    section: Optional[str] = None
```

When FastAPI receives a request, Pydantic validates every field. If `class_id` isn't an integer, the client gets a clear `422 Unprocessable Entity` error with details.

### 3.5 Authentication: python-jose 3.5.0 + bcrypt 5.0.0

**How JWT Authentication Works:**

```
1. User sends email + password to POST /api/auth/login
2. Backend verifies password against bcrypt hash in database
3. If valid → create JWT access token (24h) + refresh token (7d)
4. Client stores tokens in localStorage
5. Every subsequent request includes: Authorization: Bearer <token>
6. Backend verifies token signature + expiration on each request
7. Token payload contains: {sub: user_id, role, dept, exp}
```

**JWT Token Structure:**
```
Header:     {"alg": "HS256", "typ": "JWT"}      ← Algorithm
Payload:    {"sub": 42, "role": "FACULTY", ...}  ← Claims
Signature:  HMAC-SHA256(header.payload, secret)  ← Verification
```

**bcrypt Password Hashing:**
```
Input:  "mypassword123"
Output: "$2b$12$LJ3m4ys3s2sH9h3Kx..."  ← 60-char hash with embedded salt
```

bcrypt is specifically designed for password hashing — it's intentionally slow (~100ms per hash) to resist brute-force attacks. The salt is automatically generated and embedded in the hash.

### 3.6 Rate Limiting: slowapi 0.1.9

**What it is:** A rate-limiting library for FastAPI/Starlette that limits the number of requests a client can make to specific endpoints within a time window.

**Why it matters for FRAMES:**
- Login endpoint (5/minute): Prevents brute-force password attacks
- Face enrollment (3/minute): Prevents resource exhaustion (face processing is CPU-intensive)
- Attendance logging (6/minute per device): Prevents duplicate scans

**How it works:** Each incoming request's IP address is recorded. If the same IP exceeds the configured limit within the time window, the server returns `429 Too Many Requests`.

### 3.7 PDF Parsing: pdfplumber 0.11.9

**What it is:** A Python library for extracting text, tables, and metadata from PDF files. It's built on top of `pdfminer.six`.

**In FRAMES:** Faculty upload their class schedule PDFs (Certificate of Registration / COR). The `pdf_parser.py` service extracts:
- Subject codes and titles
- Schedule (day, time, room)
- Section information
- Faculty assignments

This data populates the `classes`, `subjects`, and `enrollments` tables.

### 3.8 Complete Backend Dependency Table

| Library | Version | Purpose | Category |
|---------|---------|---------|----------|
| FastAPI | 0.128.0 | Web framework | Core |
| Uvicorn | 0.40.0 | ASGI server | Core |
| SQLAlchemy | 2.0.46 | ORM + database toolkit | Core |
| Pydantic | 2.12.5 | Data validation | Core |
| psycopg2-binary | 2.9.11 | PostgreSQL driver | Database |
| python-jose[cryptography] | 3.5.0 | JWT tokens | Security |
| bcrypt | 5.0.0 | Password hashing | Security |
| slowapi | 0.1.9 | Rate limiting | Security |
| python-dotenv | 1.2.1 | Environment variables | Config |
| InsightFace | 0.7.3 | Face recognition model | AI/ML |
| ONNX Runtime | 1.23.2 | Model inference engine | AI/ML |
| MediaPipe | 0.10.14 | Gesture + face detection | AI/ML |
| OpenCV | 4.13.0 | Image processing | AI/ML |
| NumPy | 2.4.2 | Numerical computing | AI/ML |
| pdfplumber | 0.11.9 | PDF text extraction | Business |
| python-multipart | 0.0.22 | File upload parsing | Utility |
| email-validator | 2.3.0 | Email format validation | Validation |
| Starlette | 0.50.0 | ASGI toolkit (FastAPI base) | Core |
| Requests | 2.32.5 | HTTP client (kiosk → API) | Network |
| scikit-learn | 1.8.0 | ML utilities | AI/ML |
| SciPy | 1.17.0 | Scientific computing | AI/ML |
| Pillow | 12.1.0 | Image processing support | AI/ML |
| cryptography | 46.0.4 | Crypto backend for JWT | Security |

---

## 4. Frontend Technology Stack

### 4.1 Core Framework: React 19.2.0

**What it is:** React is a JavaScript library for building user interfaces, created by Meta (Facebook) in 2013. It uses a component-based architecture where the UI is composed of reusable, self-contained components.

**How React works:**
1. **Components**: Functions or classes that return JSX (HTML-like syntax in JavaScript)
2. **Virtual DOM**: React maintains an in-memory representation of the real DOM. When state changes, React compares the new virtual DOM with the previous one (diffing) and applies only the minimal necessary changes to the real DOM (reconciliation)
3. **Hooks**: Functions like `useState`, `useEffect`, `useContext` that let functional components manage state and side effects
4. **One-Way Data Flow**: Data flows from parent to child components via props

**Why React was chosen over alternatives:**

| Feature | React | Angular | Vue.js | Svelte |
|---------|-------|---------|--------|--------|
| **Bundle Size** | ~42 KB (gzipped) | ~143 KB | ~33 KB | ~1.6 KB |
| **Learning Curve** | Moderate | Steep | Gentle | Gentle |
| **Community** | Largest | Large | Growing | Small |
| **Job Market** | Most demanded | Strong | Growing | Limited |
| **Performance** | Virtual DOM | Change detection | Virtual DOM | Compiler-based |
| **TypeScript** | Optional | Built-in | Optional | Optional |
| **Ecosystem** | Vast (npm) | Comprehensive (included) | Growing | Limited |
| **State Management** | Context/Redux/Zustand | RxJS/NgRx | Pinia/Vuex | Stores |

**Key React Patterns in FRAMES:**

1. **Functional Components + Hooks**: All components use modern functional style
2. **`useEffect` with AbortController**: Every data fetch includes cleanup to prevent memory leaks
3. **Context API (`AuthContext`)**: Centralized authentication state
4. **Error Boundaries**: `ErrorBoundary` component catches render errors gracefully
5. **Conditional Rendering**: Loading/Error/Success states on every data-fetching component

### 4.2 Routing: React Router DOM 7.9.4

**What it is:** The standard routing library for React SPAs. It enables navigation between views without full page reloads.

**How it works:** React Router intercepts browser navigation events. Instead of requesting a new HTML page from the server, it renders the appropriate React component based on the URL path.

**In FRAMES:**
```jsx
// Role-based routing with protection
<Route path="/student-dashboard" element={
  <ProtectedRoute allowedRoles={['STUDENT']}>
    <StudentLayout />
  </ProtectedRoute>
}>
  <Route index element={<StudentDashboardPage />} />
  <Route path="schedule" element={<SchedulePage />} />
  <Route path="attendance" element={<AttendanceHistoryPage />} />
</Route>
```

### 4.3 HTTP Client: Axios 1.12.2

**What it is:** A promise-based HTTP client for the browser and Node.js with automatic transforms, interceptors, and request cancellation.

**Why Axios over fetch():**

| Feature | Axios | Native fetch() |
|---------|-------|---------------|
| Request interceptors | Built-in | Manual wrapper needed |
| Response interceptors | Built-in | Manual wrapper needed |
| Timeout | `timeout: 15000` | `AbortController` + `setTimeout` |
| Auto JSON parsing | Automatic | `.json()` call needed |
| Error handling | Non-2xx throws error | Must check `response.ok` |
| Request cancellation | `CancelToken` or `AbortController` | `AbortController` only |
| Upload progress | Built-in | ReadableStream only |

**In FRAMES — Centralized API Client:**
```javascript
// services/api.js — Single axios instance for all API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// JWT auto-injection on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handling — auto-redirect to login
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
```

### 4.4 Build Tool: Vite 6.2.0

**What it is:** Vite (French for "fast") is a next-generation frontend build tool created by Evan You (Vue.js creator). It uses native ES modules in development and Rollup for production builds.

**How Vite works:**
1. **Development**: Uses the browser's native ES module import system. No bundling needed — files are served individually with instant HMR (Hot Module Replacement)
2. **Production**: Bundles via Rollup with tree-shaking, code splitting, and minification
3. **ESBuild**: Uses ESBuild (written in Go) for JSX/TypeScript transpilation — 10-100x faster than Webpack's Babel

**Why Vite over Webpack:**

| Feature | Vite | Webpack (CRA) |
|---------|------|--------------|
| **Dev Server Start** | <500ms | 10-30 seconds |
| **HMR Speed** | <50ms | 1-5 seconds |
| **Build Time** | Fast (Rollup) | Moderate |
| **Configuration** | Minimal | Extensive |
| **Tree Shaking** | Built-in | Requires config |

**FRAMES Vite Configuration:**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
});
```

The proxy configuration means in development, the frontend at `localhost:3000` automatically forwards `/api/*` requests to the backend at `localhost:5000`. This avoids CORS issues during development.

### 4.5 Other Frontend Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| Bootstrap | 5.3.8 | Responsive CSS framework — grid, cards, buttons, modals |
| jsPDF | 3.0.4 | Client-side PDF generation for attendance reports |
| jsPDF-autotable | 5.0.2 | Table plugin for jsPDF — auto-formats attendance tables |
| React Calendar | 6.0.0 | Calendar date picker widget for schedule/attendance views |
| prop-types | 15.8.1 | Runtime type checking for React component props |
| concurrently | 9.2.1 | Runs frontend + backend dev servers simultaneously |

---

## 5. Edge Device (RPi Kiosk) Stack

### 5.1 Hardware Specifications

| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Board** | Raspberry Pi 4 Model B | Edge compute platform |
| **RAM** | 4 GB LPDDR4 | Model loading + frame processing |
| **CPU** | Broadcom BCM2711, Quad-core Cortex-A72 @ 1.8 GHz | Inference + image processing |
| **Camera** | RPi Camera V2 (Sony IMX219, 8MP) | Face capture |
| **Display** | 7" HDMI IPS (1024×600) | UI display with kiosk mode |
| **Storage** | 32 GB microSD (Class 10) | OS + models + cache |
| **Connectivity** | WiFi 802.11ac (5 GHz) | API communication |

### 5.2 Memory Budget

The RPi 4 has 4 GB total, but not all is available:

| Component | Memory Usage | Notes |
|-----------|-------------|-------|
| OS + Desktop | ~1,200 MB | Raspberry Pi OS with desktop |
| InsightFace (buffalo_l) | ~600 MB | ONNX model loaded in memory |
| MediaPipe (Hands + BlazeFace) | ~200 MB | Two model pipelines |
| Embedding Cache (1,000 users) | ~2 MB | 1000 × 512 × 4 bytes |
| OpenCV Frame Buffers | ~50 MB | BGR frames in memory |
| Application Code + Libraries | ~200 MB | Python interpreter + packages |
| **Available Headroom** | ~500 MB | For OS operations |
| **Total Allocated** | ~2,500 MB | Out of 4,096 MB |

### 5.3 Software Architecture

```
main_kiosk.py              ← Main loop: camera read → process → display
    │
    ├── camera.py           ← Camera abstraction (picamera2 / OpenCV)
    ├── config.py           ← Environment-based configuration
    │
    ├── face_detector.py    ← MediaPipe BlazeFace (fast gate, ~30ms)
    ├── face_recognizer.py  ← InsightFace buffalo_l (embedding, ~200ms)
    ├── gesture_detector.py ← MediaPipe Hands (gesture verify, ~50ms)
    │
    ├── embedding_cache.py  ← Pre-loaded NumPy matrix of enrolled embeddings
    ├── schedule_resolver.py← Room → Active Class resolution (API + local cache)
    ├── attendance_logger.py← POST to API + offline queue
    │
    └── metrics_collector.py← Performance metrics logging every 60s
```

### 5.4 Platform Auto-Detection

The kiosk code auto-adapts to its execution environment:

| Setting | Laptop (Development) | RPi 4 (Production) |
|---------|---------------------|---------------------|
| Detection size | 640×640 | 160×160 |
| Gated detection | Disabled | Enabled (BlazeFace gate) |
| Frame skip | 1 (every frame) | 5 (every 5th frame) |
| Camera resolution | 640×480 @ 30fps | 480×360 @ 15fps |
| Camera library | OpenCV | picamera2 |

### 5.5 Offline-First Design

The kiosk is designed to never stop functioning even when the network is down:

```
1. API Available:
   POST /api/kiosk/attendance/log → 200 OK → logged

2. API Unreachable:
   POST /api/kiosk/attendance/log → ConnectionError
   → Save to offline_attendance.json (local file)
   → Display "OFFLINE MODE" on screen
   → Continue recognizing faces

3. API Restored:
   → Read offline_attendance.json
   → POST each queued record
   → Clear file on success
```

---

## 6. Database Technology

### 6.1 PostgreSQL 15 (Aiven Cloud)

**What it is:** PostgreSQL is an advanced open-source relational database system with over 35 years of active development. It's known for reliability, data integrity, and correctness.

**Why PostgreSQL over alternatives:**

| Feature | PostgreSQL | MySQL | SQLite | MongoDB |
|---------|-----------|-------|--------|---------|
| **ACID Compliance** | Full | Full (InnoDB) | Full | Per-document |
| **JSON Support** | Native (jsonb) | JSON type | No | Native (BSON) |
| **Custom Types** | ENUM, arrays, ranges | ENUM only | No | No |
| **Full-Text Search** | Built-in (tsvector) | Full-text index | FTS5 extension | Atlas Search |
| **Concurrency** | MVCC | Locking (MyISAM) | File locking | Document-level |
| **Binary Data** | bytea (embeddings) | BLOB | BLOB | BinData |
| **Extensions** | pgvector, PostGIS, etc. | Limited | Limited | N/A |
| **Cost** | Free (open source) | Free/Dual-licensed | Free | Free tier only |

**Why PostgreSQL for FRAMES specifically:**
- **ENUM types**: Attendance actions (ENTRY/BREAK_OUT/BREAK_IN/EXIT), user roles, device status — enforced at the database level
- **bytea for embeddings**: 512-dimensional float32 vectors stored as binary (2,048 bytes each)
- **JSONB for audit logs**: Flexible old_value/new_value storage for admin action tracking
- **Robust indexing**: B-tree, composite indexes for fast attendance query patterns
- **Aiven hosting**: Managed PostgreSQL with automatic backups, SSL, monitoring

### 6.2 Aiven Cloud PostgreSQL

**What it is:** Aiven is a managed cloud database service that provides fully-managed PostgreSQL instances with automatic backups, monitoring, and scaling.

**Free Tier Specifications:**
| Spec | Value |
|------|-------|
| RAM | 1 GB |
| Storage | 5 GB |
| Max Connections | ~20 |
| Backups | Automatic daily |
| SSL/TLS | Enforced |
| Region | Various (closest to Philippines: Singapore) |

**Connection Configuration:**
```python
engine = create_engine(
    DATABASE_URL,
    echo=False,              # No SQL logging in production
    pool_pre_ping=True,      # Validate connections before use
    pool_size=3,             # Aiven free tier connection limit
    max_overflow=3,          # Can temporarily exceed to 6
    pool_recycle=300,        # Recycle every 5 minutes
    pool_timeout=10,         # Fail fast (don't hang)
)
```

### 6.3 Schema Overview (15 Tables)

| Table | Purpose | Row Volume Estimate |
|-------|---------|-------------------|
| departments | Academic departments | 5–15 (static) |
| programs | Degree programs per department | 20–50 (slow growth) |
| subjects | Academic courses | 50–200 (per semester) |
| users | All system users | 1,000–5,000 (per semester) |
| classes | Scheduled class sessions | 200–500 (per semester) |
| enrollments | Student ↔ Class mapping | 5,000–20,000 |
| facial_profiles | Face embeddings (512-d binary) | 1,000–5,000 |
| attendance_logs | **Highest volume** — every scan | 50,000–500,000 (per semester) |
| devices | RPi kiosk devices | 5–20 (slow growth) |
| session_exceptions | Class overrides (cancelled/online) | 100–500 |
| security_logs | Security events | 100–1,000 |
| audit_logs | Admin action tracking | 500–5,000 |
| system_metrics | Device performance data | 10,000–100,000 |
| support_tickets | Help desk tickets | 50–500 |
| user_settings | User preferences | 1,000–5,000 |

### 6.4 Key Indexes

The most critical index in FRAMES:

```sql
-- Composite index for the most common query pattern:
-- "Get attendance logs for a specific student in a specific class, ordered by time"
CREATE INDEX ix_attendance_user_class_timestamp 
    ON attendance_logs(user_id, class_id, timestamp);
```

This single composite index optimizes:
- Student dashboard: "Show my recent attendance"
- Faculty view: "Show attendance for my class"
- Kiosk: "What's this student's last action today in this class?"

Without this index, every attendance query would scan the entire `attendance_logs` table (potentially 500,000+ rows).

---

## 7. Facial Recognition Pipeline Deep-Dive

### 7.1 What is Facial Recognition?

Facial recognition is the process of identifying a person from a digital image or video frame by comparing their facial features against a database of known faces. It is NOT the same as face detection (finding where faces are in an image).

**The Pipeline:**
```
Image → Face Detection → Face Alignment → Feature Extraction → Matching
```

### 7.2 InsightFace: buffalo_l Model

**What is InsightFace?** InsightFace is an open-source face recognition library developed by the InsightFace team at Imperial College London and SenseTime. The `buffalo_l` model is their production-ready model package.

**Model Architecture:**

| Component | Architecture | Purpose | Output |
|-----------|-------------|---------|--------|
| **Face Detection** | RetinaFace (ResNet-50 backbone) | Locates faces + 5 landmarks | Bounding boxes + keypoints |
| **Face Alignment** | Affine transformation | Normalizes face orientation | 112×112 aligned face |
| **Feature Extraction** | ArcFace (ResNet-50 backbone) | Converts face to embedding | 512-dimensional vector |

**Why buffalo_l was chosen:**

| Model | Accuracy (LFW) | Size | Speed (CPU) | Open Source |
|-------|----------------|------|-------------|-------------|
| **InsightFace buffalo_l** | **99.83%** | ~600 MB | ~200ms (RPi) | **Yes** |
| InsightFace buffalo_s | 99.33% | ~200 MB | ~80ms (RPi) | Yes |
| dlib face_recognition | 99.38% | ~30 MB | ~400ms (RPi) | Yes |
| FaceNet (Google) | 99.63% | ~90 MB | ~300ms (RPi) | Yes (TF) |
| AmazonRekognition | 99.9%+ | Cloud-only | ~500ms (API) | No ($$) |
| Microsoft Azure Face | 99.9%+ | Cloud-only | ~500ms (API) | No ($$) |

**Key Reasons:**
1. **Accuracy**: 99.83% on LFW — among the best open-source options
2. **ONNX Format**: Runs on any platform (CPU/GPU/ARM) via ONNX Runtime
3. **Open Source**: No API costs, no cloud dependency, full control
4. **Buffalo_l specifically**: Best accuracy variant; the `_l` ("large") uses ResNet-50 which provides the highest-quality embeddings

### 7.3 Face Detection: RetinaFace

RetinaFace is a face detection model that finds faces in images and returns:
- **Bounding box**: Coordinates of the face rectangle (x1, y1, x2, y2)
- **5 Keypoints**: Left eye, right eye, nose tip, left mouth corner, right mouth corner
- **Confidence score**: 0.0 to 1.0 (FRAMES uses ≥0.5 threshold)

### 7.4 Face Alignment

After detection, the face is aligned using an affine transformation:
1. The 5 keypoints from detection are compared to a "standard" face template
2. A 2D transformation matrix is computed
3. The face is warped to align with the template
4. Result: A normalized 112×112 pixel face image

This step is critical because the same person photographed from different angles produces different raw images, but the aligned versions are nearly identical.

### 7.5 Feature Extraction: ArcFace

ArcFace (Additive Angular Margin Loss) is a loss function used to train the ResNet-50 network. It produces embeddings that:
- **Maximize inter-class distance**: Different people have very different vectors
- **Minimize intra-class distance**: The same person always produces similar vectors

The network takes a 112×112 aligned face and outputs a **512-dimensional floating-point vector** (the "embedding").

### 7.6 Two-Stage Detection on RPi (Gated Pipeline)

To save CPU on the resource-constrained RPi, FRAMES uses a two-stage approach:

```
Stage 1: MediaPipe BlazeFace (~30ms)
    → Fast, lightweight face detection
    → If NO face detected → skip frame (save ~200ms)
    → If face detected → crop face region
    → Pass cropped face to Stage 2

Stage 2: InsightFace buffalo_l (~150-200ms)
    → Full face detection + alignment + embedding extraction
    → Only runs when Stage 1 confirms face presence
```

**Performance Impact:**
- Without gating: Every frame costs ~250ms regardless (4 effective FPS)
- With gating: Only frames with faces cost ~250ms; empty frames cost ~30ms (significant power savings when classroom is empty)

---

## 8. Embedding Mathematics & Comparison

### 8.1 What is an Embedding?

An embedding is a dense vector representation of data in a high-dimensional space. For faces, a 512-dimensional embedding is a list of 512 floating-point numbers that encodes the unique facial features of a person.

```
Person A: [0.0234, -0.0891, 0.1456, ..., -0.0567]  ← 512 numbers
Person B: [0.1890, -0.0234, -0.0891, ..., 0.0123]  ← 512 numbers (different)
```

### 8.2 How Embeddings are Generated

1. **Input**: 112×112 aligned face image (3 channels: RGB)
2. **Network**: ResNet-50 with ArcFace training
3. **Forward Pass**: Image passes through 50 layers of convolutions, batch normalization, and activations
4. **Output**: 512-dimensional vector (the final fully-connected layer)
5. **Normalization**: Vector is L2-normalized so its magnitude equals 1

```python
# Conceptual (actual computation happens inside the neural network)
raw_embedding = resnet50(aligned_face)       # Shape: (512,)
embedding = raw_embedding / np.linalg.norm(raw_embedding)  # L2 normalize
```

### 8.3 How Embeddings are Stored

In FRAMES, embeddings are stored in PostgreSQL as **binary data (bytea)**:

```python
# Enrollment: NumPy array → bytes → PostgreSQL
embedding_array = np.array([0.0234, -0.0891, ...], dtype=np.float32)  # 512 floats
embedding_bytes = embedding_array.tobytes()  # 512 × 4 = 2,048 bytes
# Store in facial_profiles.embedding (LargeBinary column)

# Recognition: PostgreSQL → bytes → NumPy array
raw_bytes = row.embedding  # bytea from database
embedding_array = np.frombuffer(raw_bytes, dtype=np.float32)  # Back to 512 floats
```

**Storage Requirements:**
| Users | Embedding Size | Total Storage |
|-------|---------------|---------------|
| 100 | 2 KB each | 200 KB |
| 1,000 | 2 KB each | 2 MB |
| 5,000 | 2 KB each | 10 MB |
| 10,000 | 2 KB each | 20 MB |

### 8.4 How Embeddings are Compared: Cosine Similarity

**Cosine similarity** measures the cosine of the angle between two vectors. For L2-normalized vectors (magnitude = 1), this equals the dot product:

$$\text{cosine\_similarity}(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}| \cdot |\mathbf{b}|} = \mathbf{a} \cdot \mathbf{b} \quad \text{(when } |\mathbf{a}| = |\mathbf{b}| = 1\text{)}$$

**Interpretation:**
| Similarity | Meaning | Example |
|-----------|---------|---------|
| 1.0 | Identical | Same image processed twice |
| 0.6–0.8 | Same person | Different photos, different lighting |
| 0.3–0.5 | Uncertain | Could be same person or similar-looking |
| 0.0–0.2 | Different person | Clearly different individuals |
| -1.0 | Opposite | Theoretically impossible for faces |

**FRAMES Thresholds:**
| Mode | Threshold | False Accept Rate | False Reject Rate |
|------|-----------|-------------------|-------------------|
| Balanced | ≥ 0.35 | ~1% | ~5% |
| Strict | ≥ 0.50 | ~0.1% | ~15% |

### 8.5 Batch Comparison (How the Kiosk Matches Faces)

The kiosk pre-loads all enrolled embeddings into a NumPy matrix:

```python
# embedding_cache.py — Pre-loaded enrollment data
# Shape: (N, 512) where N = number of enrolled users
embedding_matrix = np.array([
    [0.0234, -0.0891, ...],  # User 1
    [0.1890, -0.0234, ...],  # User 2
    ...                       # User N
])

# When a face is detected, compute similarity against ALL enrolled faces
query_embedding = insightface_model.get(frame)[0].embedding  # Shape: (512,)

# Batch cosine similarity using matrix multiplication (O(N) operation, very fast)
similarities = np.dot(embedding_matrix, query_embedding)  # Shape: (N,)

# Find best match
best_index = np.argmax(similarities)
best_score = similarities[best_index]

if best_score >= threshold:  # 0.35 balanced / 0.50 strict
    matched_user = enrolled_users[best_index]
```

**Performance:**
| Enrolled Users | Comparison Time | Method |
|---------------|----------------|--------|
| 100 | ~0.1ms | `np.dot` (BLAS-optimized) |
| 1,000 | ~0.5ms | `np.dot` |
| 5,000 | ~2ms | `np.dot` |
| 10,000 | ~5ms | `np.dot` — still fast enough |
| 100,000+ | Consider FAISS/Annoy | Approximate nearest neighbor |

---

## 9. Performance Concepts & Metrics

### 9.1 Key Terminology

#### FPS (Frames Per Second)
**Definition:** The number of video frames processed per second. Higher FPS = smoother video = faster recognition.

| FPS | Experience | Use Case |
|-----|-----------|----------|
| 1–2 | Jerky, slideshow-like | Minimum viable |
| 4–5 | Acceptable for kiosk | **FRAMES target on RPi 4** |
| 10–15 | Smooth for users | FRAMES on laptop |
| 24–30 | Film/human perception | Standard video |
| 60+ | Gaming-smooth | Unnecessary for FRAMES |

**FRAMES Effective FPS Calculation:**
```
Frame Skip = 5 (process every 5th frame)
Camera FPS = 15
Effective Processing FPS = 15 / 5 = 3 frames processed per second
Frame Processing Time = ~250ms
Max Processing FPS = 1000ms / 250ms = 4 FPS

Actual Effective FPS on RPi: 3–4 FPS
```

#### Milliseconds (ms) — Latency
**Definition:** The time it takes for a single operation to complete. Lower ms = faster operation.

| Operation | Expected Time | Acceptable | What Happens If Too Slow |
|-----------|--------------|------------|-------------------------|
| Face detection (BlazeFace) | ~30ms | <50ms | Wasted frames |
| Face embedding (InsightFace) | ~200ms | <250ms | Low FPS |
| Embedding comparison (1K users) | ~0.5ms | <5ms | Barely noticeable |
| Gesture detection | ~50ms | <100ms | Delayed feedback |
| **Total frame pipeline** | **~280ms** | **<250ms target** | Drops below 4 FPS |
| API call (attendance log) | ~100-500ms | <1000ms | Use offline queue |
| Database query | ~50ms | <100ms | Increase pool / add index |

#### Latency Percentiles
- **p50 (median)**: 50% of operations complete within this time
- **p95**: 95% complete within this time — the "worst case for most users"
- **p99**: 99% complete — the "worst case ignoring extreme outliers"

FRAMES uses p95 as the primary metric for frame processing.

### 9.2 Frame Processing Budget (RPi 4)

The total frame processing must stay within 250ms on RPi:

```
Budget Breakdown:
├── Camera Read:        ~10ms   (frame capture)
├── BlazeFace Gate:     ~30ms   (quick face detection)
├── InsightFace:        ~180ms  (full detection + embedding)
├── Embedding Match:    ~5ms    (batch cosine similarity)
├── Gesture Detection:  ~50ms   (if needed, overlapped)
├── Display Update:     ~10ms   (OpenCV imshow)
└── TOTAL:             ~285ms   (over budget → use frame skip)
```

**Solution: Frame Skip = 5**
- Camera runs at 15 FPS
- Recognition runs on every 5th frame (3 FPS effective)
- The 4 skipped frames still display on screen (smooth video)
- Total recognition latency perceived by user: 1-2 seconds

### 9.3 Database Query Performance

| Query Pattern | Without Index | With Index | Improvement |
|--------------|--------------|------------|-------------|
| Get student's attendance today | ~500ms (full scan) | ~5ms | 100x |
| Get class enrollment list | ~200ms | ~3ms | 66x |
| Count attendance by class | ~800ms | ~10ms | 80x |
| Get faculty schedule | ~100ms | ~2ms | 50x |

**N+1 Query Problem (What FRAMES Avoids):**
```
BAD (N+1): 1 query for 100 classes + 100 queries for subjects = 101 queries
GOOD (JOIN): 1 query with joinedload = 1 query

With 100 classes:
  N+1: 101 queries × 50ms each = 5,050ms (5 seconds!)
  JOIN: 1 query = ~50ms
```

### 9.4 Metrics Collection

The FRAMES kiosk reports performance metrics every 60 seconds:

```
METRICS | frames=180 avg_ms=195.3 p95_ms=248.7 avg_faces=1.2 memory_mb=2340
```

| Metric | Description | Alert Threshold |
|--------|-------------|----------------|
| `frames` | Frames processed in last 60s | <60 (less than 1/s) |
| `avg_ms` | Average frame processing time | >200ms |
| `p95_ms` | 95th percentile frame time | >250ms |
| `avg_faces` | Average faces detected per frame | — |
| `memory_mb` | Process RSS memory | >3,000 MB |

---

## 10. Framework & Library Comparisons

### 10.1 Backend Framework Comparison

| Criteria | FastAPI (Chosen) | Flask | Django | Express.js (Node) |
|----------|:---:|:---:|:---:|:---:|
| Performance (RPS) | **15,000+** | 3,000 | 2,500 | 12,000 |
| Type safety | **Built-in** | None | Serializers | None |
| Auto docs | **Swagger + ReDoc** | Manual | DRF has it | swagger-jsdoc |
| Async I/O | **Native** | Extension | Channels | **Native** |
| ORM integration | **SQLAlchemy** | SQLAlchemy | Django ORM | Sequelize/Prisma |
| Learning curve | Low | **Very Low** | High | Low |
| Dependency injection | **Built-in** | None | None | None |
| Python ecosystem | **Full access** | Full access | Full access | JS only |
| ML/AI libraries | **NumPy, OpenCV, InsightFace** | Same | Same | Limited ports |

**Why FastAPI won:** Python ecosystem (InsightFace, MediaPipe, NumPy all Python-native), built-in type safety, auto-generated API documentation, and performance close to Node.js.

### 10.2 Face Recognition Framework Comparison

| Criteria | InsightFace (Chosen) | dlib | FaceNet | OpenCV DNN | AWS Rekognition |
|----------|:---:|:---:|:---:|:---:|:---:|
| Accuracy (LFW) | **99.83%** | 99.38% | 99.63% | ~95% | 99.9%+ |
| Speed (RPi CPU) | ~200ms | ~400ms | ~300ms | ~150ms | ~500ms (API) |
| Embedding dims | 512 | 128 | 128/512 | Varies | N/A |
| ONNX support | **Yes** | No | TF/TFLite | Yes | N/A |
| Open source | **Yes** | Yes | Yes | Yes | **No** |
| Cost | **Free** | Free | Free | Free | **$0.001/face** |
| Offline capable | **Yes** | Yes | Yes | Yes | **No (cloud)** |
| Training data | MS1M (1M identities) | — | VGGFace2 | — | — |

**Why InsightFace buffalo_l won:**
1. Highest open-source accuracy (99.83%)
2. ONNX format runs on ARM (RPi) without GPU
3. 512-d embeddings provide richest feature space
4. Completely free and offline-capable (critical for kiosk)
5. Active maintenance and community

### 10.3 Frontend Framework Comparison

| Criteria | React (Chosen) | Vue.js | Angular | Svelte |
|----------|:---:|:---:|:---:|:---:|
| Bundle size (gzipped) | 42 KB | **33 KB** | 143 KB | **1.6 KB** |
| Job market demand | **#1** | #3 | #2 | #4 |
| Component ecosystem | **Vast** | Growing | Comprehensive | Limited |
| Learning curve | Moderate | **Easy** | Steep | Easy |
| Team familiarity | **Yes** | Limited | No | No |
| TypeScript support | Good | Good | **Built-in** | Good |
| State management | Context/Redux | Pinia | NgRx | Stores |

**Why React won:** Team familiarity, largest ecosystem, most job market value, excellent documentation, and mature tooling (Vite, React DevTools).

### 10.4 Database Comparison

| Criteria | PostgreSQL (Chosen) | MySQL | MongoDB | SQLite |
|----------|:---:|:---:|:---:|:---:|
| ACID compliance | **Full** | Full (InnoDB) | Per-document | Full |
| ENUM types | **Native** | Native | No | No |
| Binary data (embeddings) | **bytea** | BLOB | BinData | BLOB |
| JSON support | **jsonb (indexed)** | JSON | **Native** | No |
| Managed hosting (free) | **Aiven** | PlanetScale | Atlas | N/A (file-based) |
| Concurrent connections | **Excellent** | Good | Excellent | **Poor** |
| Full-text search | **tsvector** | FULLTEXT | Atlas Search | FTS5 |
| Extensions | **pgvector, PostGIS** | Limited | Limited | Limited |

---

## 11. Security Architecture

### 11.1 Authentication Flow

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│  Browser  │         │   FastAPI    │         │  PostgreSQL   │
│           │         │   Backend    │         │  (Aiven)      │
└─────┬─────┘         └──────┬───────┘         └──────┬───────┘
      │                      │                        │
      │  POST /api/auth/login│                        │
      │  {email, password}   │                        │
      │─────────────────────▶│                        │
      │                      │  SELECT * FROM users   │
      │                      │  WHERE email = ?       │
      │                      │───────────────────────▶│
      │                      │                        │
      │                      │  user row              │
      │                      │◀───────────────────────│
      │                      │                        │
      │                      │  bcrypt.verify(         │
      │                      │    password,            │
      │                      │    user.password_hash)  │
      │                      │                        │
      │  {access_token,      │                        │
      │   refresh_token,     │                        │
      │   user}              │                        │
      │◀─────────────────────│                        │
      │                      │                        │
      │  GET /api/student/   │                        │
      │  dashboard           │                        │
      │  Authorization:      │                        │
      │  Bearer <JWT>        │                        │
      │─────────────────────▶│                        │
      │                      │  jwt.decode(token)     │
      │                      │  → {sub:42, role:...}  │
      │                      │                        │
      │                      │  db.query(User).get(42)│
      │                      │───────────────────────▶│
      │                      │                        │
```

### 11.2 Security Layers

| Layer | Mechanism | Protection Against |
|-------|-----------|-------------------|
| **Transport** | SSL/TLS (Aiven enforced) | Eavesdropping, man-in-the-middle |
| **Authentication** | JWT (HS256, 24h expiry) | Unauthorized access |
| **Authorization** | Role-based (`require_role()`) | Privilege escalation |
| **Password** | bcrypt (12 rounds) | Rainbow tables, brute force |
| **Rate Limiting** | slowapi (5/min login) | Brute force, DDoS |
| **CORS** | Locked to FRONTEND_URL | Cross-site request forgery |
| **Input Validation** | Pydantic schemas | SQL injection, XSS |
| **Error Opacity** | `api_error()` helper | Information leakage |
| **Audit Trail** | AuditLog model | Accountability, forensics |
| **Biometric Security** | Gesture verification | Walk-by false detections |
| **Anti-Spoofing** | SecurityLog + confidence | Photo/video attacks |

### 11.3 Attendance State Machine (Anti-Fraud)

The attendance system uses a strict state machine to prevent fraud:

```
State Machine per (user, class, day):

    ┌─────────┐   face only   ┌──────────┐
    │ NOT     │──────────────▶│  ENTERED  │
    │ ENTERED │               │  (ENTRY)  │
    └─────────┘               └─────┬─────┘
                                    │
                              ✌️ peace sign
                                    │
                              ┌─────▼─────┐
                              │ ON BREAK   │
                              │ (BREAK_OUT)│
                              └─────┬─────┘
                                    │
                              👍 thumbs up
                                    │
                              ┌─────▼─────┐
                              │ RETURNED   │
                              │ (BREAK_IN) │
                              └─────┬─────┘
                                    │
                              🖐 open palm
                                    │
                              ┌─────▼─────┐
                              │  EXITED    │
                              │  (EXIT)    │
                              └───────────┘
```

**Why gestures are required for BREAK/EXIT:**
- ENTRY only needs face (student walks in, no need for gesture)
- BREAK_OUT, BREAK_IN, EXIT require explicit gestures to prevent:
  - Accidental attendance logging when walking past the kiosk
  - One person scanning in for multiple people
  - Students leaving without proper exit logging

---

## 12. Optimization Strategies

### 12.1 Database Optimization

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| **Composite Index** | `(user_id, class_id, timestamp)` on attendance_logs | 100x faster attendance queries |
| **Eager Loading** | `joinedload()` on all relationship queries | Eliminates N+1 queries |
| **Connection Pooling** | `pool_size=3, max_overflow=3` | Prevents connection exhaustion |
| **Pool Recycling** | `pool_recycle=300` | Prevents stale connections |
| **Parameterized Queries** | SQLAlchemy ORM (never raw f-strings) | Prevents SQL injection |
| **Pagination** | `skip/limit` on all list endpoints | Prevents OOM on large datasets |

### 12.2 Frontend Optimization

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| **AbortController** | Every `useEffect` fetch | Prevents memory leaks |
| **Centralized API** | Single axios instance | Consistent auth, error handling |
| **Vite + ESBuild** | Native ES modules in dev | <500ms dev server start |
| **Code Splitting** | Lazy routes (potential) | Smaller initial bundle |
| **Three-State UI** | Loading/Error/Success | Better UX, no silent failures |

### 12.3 Edge Device Optimization

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| **Gated Detection** | BlazeFace gates InsightFace | Saves ~200ms per empty frame |
| **Frame Skip** | Process every 5th frame | Reduces CPU by 80% |
| **Reduced Resolution** | 160×160 det_size on RPi | 4x fewer pixels to process |
| **Embedding Cache** | Pre-loaded NumPy matrix | O(1) cache access |
| **Batch Cosine Sim** | `np.dot(matrix, query)` | BLAS-optimized, ~0.5ms for 1K users |
| **Thread Pool** | `OMP_NUM_THREADS=4` | Full CPU utilization |
| **Offline Queue** | Local JSON file | Never lose attendance data |
| **Periodic Refresh** | 30-minute cache refresh | Up-to-date embeddings |

---

## 13. Deployment Architecture

### 13.1 Deployment Targets

| Component | Platform | Tier | Cost | URL Pattern |
|-----------|----------|------|------|-------------|
| **Frontend** | Vercel | Free | $0/mo | `https://frames.vercel.app` |
| **Backend** | Render | Free | $0/mo | `https://frames-api.onrender.com` |
| **Database** | Aiven PostgreSQL | Free | $0/mo | `pg://avnadmin:...@pg-xxx.aiven.io:25060/defaultdb` |
| **Kiosk** | Raspberry Pi 4 (on-premises) | Hardware | ~₱5,000 one-time | `http://192.168.x.x:8000` |

### 13.2 Vercel (Frontend)

**What it is:** Vercel is a cloud platform that provides hosting for static sites and frontend frameworks with edge network deployment.

**Why Vercel:**
- Zero-config deployment for Vite/React
- Global CDN (Content Delivery Network) for fast loading
- Automatic HTTPS
- Preview deployments per Git branch
- Free tier: 100 GB bandwidth, unlimited deploys

**Configuration:**
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "build": { "env": { "VITE_API_BASE_URL": "https://frames-api.onrender.com" } }
}
```

### 13.3 Render (Backend)

**What it is:** Render is a cloud platform for deploying web services, APIs, databases, and static sites.

**Why Render:**
- Supports Python/FastAPI natively
- Free tier: 750 hours/month (enough for continuous uptime)
- Auto-deploy from Git
- SSL/HTTPS included
- Health checks and auto-restart

**Limitations of Free Tier:**
| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| 512 MB RAM | Tight for ML models | Don't run InsightFace on Render; only API logic |
| Spin down after 15 min idle | First request slow (~30s) | Health check pinging |
| Shared CPU | Variable performance | Acceptable for API workload |
| No persistent disk | Uploads lost on redeploy | Use cloud storage or database |

**render.yaml:**
```yaml
services:
  - type: web
    name: frames-api
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://frames.vercel.app
```

### 13.4 Aiven PostgreSQL

**What it is:** Aiven is a managed cloud database service. Their free tier provides a shared PostgreSQL instance suitable for small projects.

**Free Tier Specs:**
| Spec | Value |
|------|-------|
| PostgreSQL version | 15 |
| RAM | 1 GB (shared) |
| Storage | 5 GB |
| Connections | ~20 max |
| Region | Multiple (Singapore closest) |
| Backups | Daily automatic |
| SSL | Enforced |
| Monitoring | Basic metrics |

**Connection String Format:**
```
postgresql://avnadmin:<password>@<host>.aiven.io:25060/defaultdb?sslmode=require
```

### 13.5 Full Deployment Diagram

```
┌─────────────────────────────────────────────────┐
│                    Internet                       │
│                                                   │
│  ┌──────────────┐    ┌─────────────────────────┐ │
│  │   Vercel     │    │      Render              │ │
│  │   (CDN Edge) │    │   (Web Service)          │ │
│  │              │    │                           │ │
│  │  React SPA   │───▶│  FastAPI + Uvicorn       │ │
│  │  Static HTML │    │  Python 3.11             │ │
│  │  + JS + CSS  │    │  512MB RAM               │ │
│  │              │    │                           │ │
│  │  HTTPS       │    │  HTTPS                   │ │
│  └──────────────┘    └───────────┬───────────────┘ │
│                                  │                  │
│                                  │ SSL/TLS          │
│                                  │                  │
│                      ┌───────────▼───────────────┐ │
│                      │   Aiven PostgreSQL         │ │
│                      │   (Singapore Region)       │ │
│                      │   5 GB storage             │ │
│                      │   ~20 connections          │ │
│                      └───────────────────────────┘ │
│                                                     │
│       ┌─────────────────────────────────────┐      │
│       │     Campus Network (TUP Manila)      │      │
│       │                                       │      │
│       │  ┌────────┐  ┌────────┐  ┌────────┐ │      │
│       │  │ RPi #1 │  │ RPi #2 │  │ RPi #3 │ │      │
│       │  │ Lab 1  │  │ Lab 2  │  │ Room 3 │ │      │
│       │  │ Camera │  │ Camera │  │ Camera │ │      │
│       │  └───┬────┘  └───┬────┘  └───┬────┘ │      │
│       │      │ WiFi      │ WiFi      │ WiFi │      │
│       │      └───────────┼───────────┘      │      │
│       │                  │                   │      │
│       │                  ▼                   │      │
│       │          REST API calls              │      │
│       │       to Render backend              │      │
│       └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

---

## 14. Cost Analysis

### 14.1 Software Costs

| Component | Cost | Notes |
|-----------|------|-------|
| React | $0 | MIT License, open source |
| FastAPI | $0 | MIT License, open source |
| PostgreSQL | $0 | PostgreSQL License, open source |
| InsightFace | $0 | MIT License, open source |
| MediaPipe | $0 | Apache 2.0, open source |
| OpenCV | $0 | Apache 2.0, open source |
| Vercel Hosting | $0 | Free tier |
| Render Hosting | $0 | Free tier |
| Aiven PostgreSQL | $0 | Free tier |
| **Total Software** | **$0/month** | |

### 14.2 Hardware Costs (Per Kiosk)

| Component | Cost (PHP) | Cost (USD) |
|-----------|-----------|-----------|
| Raspberry Pi 4 (4GB) | ₱3,500–4,500 | $63–80 |
| 7" HDMI Display | ₱1,500–2,500 | $27–45 |
| USB Webcam (720p) | ₱500–1,000 | $9–18 |
| 32 GB microSD (Class 10) | ₱300–500 | $5–9 |
| Power Supply (5V 3A USB-C) | ₱300–500 | $5–9 |
| 3D-Printed Enclosure | ₱500–1,000 | $9–18 |
| **Total Per Kiosk** | **₱6,600–10,000** | **$118–179** |

### 14.3 Comparison with Commercial Solutions

| Solution | Per-Kiosk Cost | Monthly Fee | Accuracy | Offline |
|----------|---------------|-------------|----------|---------|
| **FRAMES (Ours)** | **₱8,000** | **₱0** | **99.83%** | **Yes** |
| ZKTeco iFace302 | ₱15,000–25,000 | ₱0 | ~98% | Yes |
| Hanvon FaceID F710 | ₱20,000–30,000 | ₱0 | ~99% | Yes |
| AWS Rekognition (cloud) | ₱0 (camera only) | ~₱5,000/mo | 99.9% | No |
| Microsoft Azure Face | ₱0 (camera only) | ~₱3,000/mo | 99.9% | No |

**FRAMES Advantage:** 50–70% cheaper than commercial kiosks with comparable accuracy, zero monthly fees, and full customizability.

---

## 15. Terminology Glossary

| Term | Definition |
|------|-----------|
| **ASGI** | Asynchronous Server Gateway Interface — Python standard for async web servers |
| **ArcFace** | Angular Margin Loss function for training face recognition models |
| **Batch Cosine Similarity** | Computing similarity between one vector and many vectors simultaneously using matrix multiplication |
| **bcrypt** | A password hashing algorithm designed to be computationally expensive to resist brute-force attacks |
| **BLAS** | Basic Linear Algebra Subprograms — optimized math library used by NumPy for fast matrix operations |
| **BlazeFace** | Google's lightweight face detection model (part of MediaPipe) |
| **CDN** | Content Delivery Network — geographically distributed servers for fast content delivery |
| **Cosine Similarity** | A measure of similarity between two vectors by computing the cosine of the angle between them |
| **CSI** | Camera Serial Interface — Raspberry Pi's dedicated camera connection |
| **CRUD** | Create, Read, Update, Delete — basic database operations |
| **det_size** | Detection size — the resolution at which InsightFace runs face detection (640×640 default) |
| **Embedding** | A dense vector representation of data (a face) in a high-dimensional space |
| **ENUM** | Enumerated type — a column that can only hold predefined values |
| **FK** | Foreign Key — a database column that references another table's primary key |
| **FPS** | Frames Per Second — number of video frames processed per second |
| **Gated Detection** | Two-stage pipeline where a fast detector gates a slow, accurate detector |
| **HMR** | Hot Module Replacement — Vite feature that updates UI without full page reload |
| **JWT** | JSON Web Token — a compact, URL-safe token for transmitting claims between parties |
| **Latency** | The time delay between a request and its response (measured in milliseconds) |
| **LFW** | Labeled Faces in the Wild — standard benchmark dataset for face recognition evaluation |
| **N+1 Query** | A performance anti-pattern where N additional database queries are executed inside a loop |
| **ONNX** | Open Neural Network Exchange — portable format for ML models |
| **ORM** | Object-Relational Mapping — maps database tables to programming language objects |
| **p95** | 95th percentile — 95% of operations complete within this time |
| **PK** | Primary Key — unique identifier for a database row |
| **Pool Recycling** | Periodically replacing database connections to prevent stale/dead connections |
| **ResNet-50** | A 50-layer deep residual neural network architecture |
| **SPA** | Single Page Application — a web app that loads once and updates dynamically |
| **SSL/TLS** | Secure Sockets Layer / Transport Layer Security — encryption protocols |
| **UVC** | USB Video Class — standard driver protocol for USB webcams |
| **V4L2** | Video4Linux2 — Linux kernel API for video capture |
| **Virtual DOM** | React's in-memory representation of the real DOM for efficient updates |

---

## 16. References

### Frameworks & Libraries
1. FastAPI Documentation — https://fastapi.tiangolo.com/
2. React Documentation — https://react.dev/
3. SQLAlchemy Documentation — https://docs.sqlalchemy.org/en/20/
4. InsightFace GitHub — https://github.com/deepinsight/insightface
5. MediaPipe Documentation — https://developers.google.com/mediapipe
6. OpenCV Documentation — https://docs.opencv.org/
7. Pydantic Documentation — https://docs.pydantic.dev/latest/
8. Vite Documentation — https://vitejs.dev/
9. PostgreSQL Documentation — https://www.postgresql.org/docs/15/

### Research Papers
10. Deng, J., et al. "ArcFace: Additive Angular Margin Loss for Deep Face Recognition." CVPR 2019.
11. Deng, J., et al. "RetinaFace: Single-shot Multi-level Face Localisation in the Wild." CVPR 2020.
12. He, K., et al. "Deep Residual Learning for Image Recognition." CVPR 2016.

### Deployment Platforms
13. Vercel — https://vercel.com/
14. Render — https://render.com/
15. Aiven — https://aiven.io/

### Benchmarks
16. LFW Face Verification — http://vis-www.cs.umass.edu/lfw/
17. FRVT (NIST Face Recognition Vendor Test) — https://pages.nist.gov/frvt/

---

**Document Version:** 1.0 | **Last Updated:** March 4, 2026  
**Prepared for:** Capstone Defense — TUP Manila
