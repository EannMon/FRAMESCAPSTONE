# Task #3 — Answers to Outstanding Questions

This document provides detailed answers and documentation for the questions raised in Task #3 of `MUSTANALYZEPT2.MD`.

---

## Table of Contents

1. [Database Lag / Slow Network Performance](#1-database-lag--slow-network-performance)
2. [Facial Recognition After Cleaning Database — Export Embeddings](#2-facial-recognition-after-cleaning-database--export-embeddings)
3. [Landing Page Sign-Up Security — Opinions & Suggestions](#3-landing-page-sign-up-security--opinions--suggestions)
4. [Watch Demo — AI Video Suggestions](#4-watch-demo--ai-video-suggestions)
5. [System Logs — Data Source & How It Works](#5-system-logs--data-source--how-it-works)

---

## 1. Database Lag / Slow Network Performance

**Original question:** *"The database seems to be lagging or slow, especially when there is a poor network connection. Can it be fixed?"*

### Root Cause

FRAMES uses a remote **PostgreSQL database hosted on Aiven** (cloud-hosted). Every API request from the backend must travel over the internet to reach the database. On poor network connections, this round-trip delay (latency) adds up:

- **Cold connection:** First connection after inactivity requires TCP handshake + SSL/TLS negotiation → can take 3–10 seconds on slow networks.
- **N+1 queries:** Previously, some endpoints fired dozens of individual database queries in loops. Each query adds network latency.
- **Connection pool exhaustion:** Too many concurrent requests waiting for database connections.

### What Was Fixed

| Optimization | Location | Impact |
|---|---|---|
| **Connection pooling** with `pool_pre_ping=True` | `backend/db/database.py` | Reuses existing connections, validates before use |
| **Short `connect_timeout=8s`** and `pool_timeout=10s` | `backend/db/database.py` | Fails fast instead of hanging for 30+ seconds |
| **`pool_recycle=300`** (5 min) | `backend/db/database.py` | Prevents stale connections from accumulating |
| **N+1 query elimination** | All routers (faculty.py, student.py, admin.py) | Reduced from 100+ queries to 2-3 per endpoint |
| **`joinedload()` / batch queries** | Service & router layer | Single query fetches related data via SQL JOINs |
| **Database indexes** on all FK columns | All models | Faster WHERE/JOIN/ORDER BY operations |
| **Axios timeout increased to 30s** | `frontend/src/services/api.js` | Tolerates cold Aiven connections |
| **Backend startup DB warmup** | `backend/main.py` (startup event) | Pre-establishes connection pool on server start |

### Current Database Configuration

```python
# backend/db/database.py
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=3,          # Aiven free tier limit
    max_overflow=3,
    pool_recycle=300,      # 5-minute connection recycling
    pool_timeout=10,       # Fail after 10s (don't hang)
    connect_args={"connect_timeout": 8}
)
```

### Remaining Limitation

Network latency to Aiven is inherent — it cannot be eliminated while using a remote database. On very poor connections (high packet loss, >500ms latency), API responses will still be slow. The frontend now handles this gracefully with:
- 30-second timeout (up from 15s)
- User-friendly timeout error messages ("Server is taking longer than expected. Please try again.")
- Loading spinners on every data-fetching component

---

## 2. Facial Recognition After Cleaning Database — Export Embeddings

**Original question:** *"When I clean the database, the facial recognition can still be run; it recognizes old data. Do we always need to run `export_embeddings.py`?"*

### How It Works

The facial recognition kiosk (Raspberry Pi) does **NOT** query the database directly during face matching. Instead it uses a **local JSON cache file**:

```
[PostgreSQL Database] → export_embeddings.py → [rpi/data/embeddings_cache.json] → [Kiosk Camera]
```

1. **`backend/scripts/export_embeddings.py`** queries the `facial_profiles` table and writes each user's face embedding (512-dimensional vector) to `rpi/data/embeddings_cache.json`.
2. **The kiosk** (`backend/rpi/kiosk_server.py`) loads this JSON file on startup into memory (`EmbeddingCache` class).
3. **During recognition**, the kiosk compares live camera embeddings against the in-memory cache using cosine similarity. It never touches the database for face matching.

### Why Old Data Persists

When you clean/reset the database:
- The PostgreSQL `facial_profiles` table is emptied.
- But `rpi/data/embeddings_cache.json` **still contains the old exported embeddings**.
- The kiosk reads from the JSON file, not the database → it still "recognizes" deleted users.

### Solution: Auto-Export Before Kiosk Start

**Previously:** You had to manually run `python scripts/export_embeddings.py` every time faces were enrolled or the database was cleaned.

**Now (implemented):** The kiosk server automatically runs the export on startup, so the cache is always up-to-date with the database. The export function is called in `kiosk_server.py`'s `startup_event()` before loading the cache.

### When to Manually Run Export

You should still run the export manually if:
- You enrolled new faces and want the kiosk to recognize them **without restarting the kiosk**.
- You cleaned the database and want to verify the cache was updated.

```bash
cd backend
python scripts/export_embeddings.py --verbose
```

### Periodic Refresh

The kiosk also has a **periodic cache refresh** (every 30 minutes by default) that re-syncs embeddings from the API, ensuring new enrollments are picked up during long-running sessions.

---

## 3. Landing Page Sign-Up Security — Opinions & Suggestions

**Original question:** *"The dept head verification for faculty sign-up is secure but hassle. What are simpler yet secure alternatives?"*

### The Problem

- **Full verification flow** (current): Faculty signs up → Department Head approves → Email sent. Secure but adds burden to Department Head.
- **Open sign-up** (removed): Anyone with link access can register as Faculty. Insecure.

### Recommended Approaches (Opinion)

#### Option A: Invitation Code System (Recommended)

1. Department Head generates a **one-time-use registration code** from their dashboard (e.g., `FRAMES-CPE-2025-A7X3`).
2. Faculty member enters this code during registration.
3. Code is validated, consumed (cannot be reused), and account is created with `VERIFIED` status immediately.
4. No approval queue needed.

**Pros:**
- Only people with a valid code can register — secure.
- Department Head controls who gets access without reviewing each application.
- Faculty gets instant access — no waiting.
- Codes can have expiration dates (e.g., valid for 7 days).

**Cons:**
- Dept Head must generate and distribute codes (but this is a one-time action per faculty member).

#### Option B: Domain-Restricted Sign-Up

1. Remove the public sign-up page entirely.
2. Only allow registration from `@tup.edu.ph` email addresses.
3. Auto-verify users with valid TUP email (verification via email confirmation link).

**Pros:** Self-service, no Dept Head involvement.
**Cons:** Anyone with a TUP email could register as any role.

#### Option C: Email-Only Invite (Current Partial Implementation)

1. Dept Head enters faculty email in their dashboard.
2. System sends an email with a **unique registration link** (contains a signed token).
3. Faculty clicks the link, sets their password, and is immediately verified.

**Pros:** Very secure — only invited people can register.
**Cons:** Requires email delivery to work reliably.

#### Current Implementation Status

The system currently uses **Dept Head verification** (approve/reject flow). The invitation code system (Option A) is the recommended future improvement as it balances security with convenience. The sign-up page for faculty/head has been removed from the public landing page — registration links can be shared directly by the Department Head.

---

## 4. Watch Demo — AI Video Suggestions

**Original question:** *"We don't have contents for Watch Demo yet. Can you suggest how to make a demo video using AI?"*

### AI-Powered Demo Video Tools

| Tool | Type | Best For | Cost |
|---|---|---|---|
| **Synthesia** | AI avatar video | Professional presenter-style demos | Paid ($30+/mo) |
| **HeyGen** | AI avatar + screen recording | Product walkthroughs | Paid (free trial) |
| **Loom + AI** | Screen recording with AI editing | Quick informal demos | Free tier available |
| **OBS Studio + Canva** | Manual screen recording + AI-enhanced editing | Full control, polished output | Free |
| **ScreenPal (Screencast-O-Matic)** | Screen recording with editing | Simple, fast | Free tier |
| **Descript** | AI-powered video editor | Screen recordings with AI transcription & editing | Free tier |

### Recommended Approach for FRAMES Demo

1. **Screen record** the actual FRAMES system using OBS Studio or Loom:
   - Faculty login → Upload schedule → View classes
   - Student login → View schedule → Check attendance history
   - Kiosk face recognition → Attendance logging
   - Department Head dashboard → Verify users → View analytics

2. **Edit with Descript or Canva:**
   - Add captions/subtitles automatically via AI transcription.
   - Add intro/outro slides with FRAMES branding.
   - Add background music (royalty-free).

3. **Optional: AI narration** using ElevenLabs or Synthesia for a professional voiceover.

### Suggested Video Structure

| Section | Duration | Content |
|---|---|---|
| Intro | 15-30s | FRAMES logo, system name, what it does |
| Student Flow | 60-90s | Login, view schedule, view attendance, face enrollment |
| Faculty Flow | 60-90s | Login, upload schedule, manage classes, view attendance |
| Kiosk Demo | 60-90s | Face recognition in action, gesture detection, attendance logging |
| Dept Head Flow | 45-60s | User verification, analytics, device management |
| Closing | 15s | Team, university, tech stack |

**Total: ~5-6 minutes**

---

## 5. System Logs — Data Source & How It Works

**Original question:** *"I do not know in system logs where the data is collected/fetched. Make this page work and explain how."*

### Architecture Overview

```
[User actions in the system]
        │
        ▼
[Backend API endpoints] → write to → [audit_logs table in PostgreSQL]
        │
        ▼
[GET /api/admin/system-logs] → reads from → [audit_logs table]
        │
        ▼
[SystemLogsPage.jsx] → displays in → [Admin Dashboard → System Logs tab]
```

### Data Source: `audit_logs` Table

The system logs page reads from the **`audit_logs`** PostgreSQL table. This table records every significant administrative action in the system.

#### Table Schema

| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Auto-incrementing unique identifier |
| `user_id` | Integer (FK → users) | Who performed the action (nullable for system events) |
| `action_type` | String(50) | Action category (e.g., `USER_VERIFY`, `FACE_ENROLL`) |
| `target_table` | String(50) | Which database table was affected |
| `target_id` | Integer | ID of the affected record |
| `old_value` | JSON | Previous state before the action (nullable) |
| `new_value` | JSON | New state after the action (nullable) |
| `ip_address` | String(45) | IP address of the requester |
| `user_agent` | String(255) | Browser/client info |
| `timestamp` | DateTime | When the action occurred (UTC, indexed) |

#### Indexed Columns (for fast queries)
- `user_id` — filter logs by who performed the action
- `action_type` — filter by action category
- `timestamp` — sort by most recent

### What Actions Create Audit Logs

| Action Type | Service | When It Fires | Level |
|---|---|---|---|
| `USER_CREATE` | AuthService | New user registration | INFO |
| `USER_VERIFY` | AuthService | Dept Head approves a user | INFO |
| `USER_REJECT` | AuthService | Dept Head rejects a user | WARN |
| `USER_DELETE` | AuthService | Admin/Head deletes a user | WARN |
| `USER_UPDATE` | AuthService | User profile updated | INFO |
| `FACE_ENROLL` | RecognitionEngine | User enrolls face data | INFO |
| `FACE_UPDATE` | RecognitionEngine | User re-enrolls face | INFO |
| `SCHEDULE_UPLOAD` | ScheduleService | Faculty uploads PDF schedule | INFO |
| `CLASS_CREATE` | ScheduleService | New class created | INFO |
| `CLASS_UPDATE` | ScheduleService | Class details modified | INFO |
| `CLASS_DELETE` | ScheduleService | Class removed | INFO |
| `DEVICE_CREATE` | DeviceService | Kiosk device registered | INFO |
| `DEVICE_UPDATE` | DeviceService | Device settings changed | INFO |
| `DEVICE_DELETE` | DeviceService | Device decommissioned | WARN |
| `EXPORT_ATTENDANCE` | ReportService | Attendance data exported | INFO |
| `EXPORT_REPORT` | ReportService | Report generated/downloaded | INFO |
| `SESSION_EXCEPTION_CREATE` | ScheduleService | Schedule exception created | WARN |

### Backend Endpoint: `GET /api/admin/system-logs`

**Location:** `backend/api/routers/admin.py` (line ~213)

**Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 50 | Page size (max 200) |
| `action_type` | string | null | Filter by specific action type |

**How it works:**

1. Queries `audit_logs` table with `joinedload(AuditLog.user)` to get user name in a single query (no N+1).
2. Applies optional `action_type` filter.
3. Orders by `timestamp DESC` (newest first).
4. For each log entry, applies three helper functions:

   - **`_action_to_service(action_type)`** — Maps the raw action type to a display-friendly service name:
     - `USER_CREATE` → `"AuthService"`
     - `FACE_ENROLL` → `"RecognitionEngine"`
     - `SCHEDULE_UPLOAD` → `"ScheduleService"`
     - etc.
   
   - **`_action_to_level(action_type)`** — Assigns a severity level for UI display:
     - `USER_DELETE`, `USER_REJECT` → `"WARN"`
     - `SESSION_EXCEPTION_CREATE`, `DEVICE_DELETE` → `"WARN"`
     - Everything else → `"INFO"`
   
   - **`_build_log_message(log, user_name)`** — Generates a human-readable message:
     - `USER_VERIFY` → `"User 'Juan Cruz' verification approved (ID: 42)"`
     - `FACE_ENROLL` → `"Face enrolled for user 'Juan Cruz' (ID: 42)"`
     - `SCHEDULE_UPLOAD` → `"Schedule uploaded by 'Juan Cruz'"`

**Response shape:**

```json
{
    "items": [
        {
            "id": 1,
            "timestamp": "2025-03-05T04:30:00",
            "level": "INFO",
            "service": "AuthService",
            "action_type": "USER_VERIFY",
            "message": "User 'Juan Cruz' verification approved (ID: 42)",
            "user_name": "Admin User",
            "target_table": "users",
            "target_id": 42,
            "ip_address": "192.168.1.10"
        }
    ],
    "total": 150,
    "skip": 0,
    "limit": 50
}
```

### Frontend: `SystemLogsPage.jsx`

**Location:** `frontend/src/components/AdminDashboard/SystemLogsPage.jsx`

**Features:**
- Fetches data from `GET /api/admin/system-logs` on mount and page change.
- **Pagination:** 50 logs per page with Previous/Next buttons.
- **Filters:** Level (All/ERROR/WARN/INFO/DEBUG), Service (dynamic from loaded data), and text search.
- **States:** Loading spinner, error message with retry button, empty state message.
- **AbortController:** Cancels in-flight requests on unmount (prevents memory leaks).

**Display columns:**

| Column | Data |
|---|---|
| Timestamp | Formatted local datetime from `log.timestamp` |
| Level | Color-coded tag — green (INFO), yellow (WARN), red (ERROR) |
| Service | The mapped service name (AuthService, RecognitionEngine, etc.) |
| Message | Human-readable description of the action |

### How Audit Logs Are Created

Audit log entries are written by backend API endpoint handlers when significant actions occur. The pattern is:

```python
from models.audit_log import AuditLog

# Inside an endpoint handler after a significant action:
audit_entry = AuditLog(
    user_id=current_user.id,
    action_type="USER_VERIFY",
    target_table="users",
    target_id=target_user.id,
    old_value={"verification_status": "PENDING"},
    new_value={"verification_status": "VERIFIED"},
    ip_address=request.client.host,
)
db.add(audit_entry)
db.commit()
```

This happens in endpoints like:
- User verification/rejection (`admin.py`)
- Face enrollment (`face.py`)
- Schedule upload (`faculty.py`)
- Device management (`admin.py`)
- Report generation (`reports.py`)

### If No Logs Appear

If the System Logs page is empty, it means:
- No auditable actions have been performed yet.
- The `audit_logs` table has no rows.
- Once users start performing actions (registering, enrolling faces, uploading schedules, verifying users), entries will automatically appear.

---

## Summary

| Question | Status | Where To Find |
|---|---|---|
| Database lag / slow network | **Fixed** — Pool optimized, N+1 eliminated, timeouts increased | `backend/db/database.py`, `frontend/src/services/api.js` |
| Export embeddings after DB clean | **Fixed** — Auto-export on kiosk startup | `backend/rpi/kiosk_server.py`, `backend/scripts/export_embeddings.py` |
| Sign-up security alternatives | **Documented** — Invitation code recommended | Section 3 above |
| Watch demo video | **Suggestions provided** — OBS + Descript recommended | Section 4 above |
| System logs data source | **Implemented & documented** — Reads from `audit_logs` table | `backend/api/routers/admin.py`, `SystemLogsPage.jsx` |
