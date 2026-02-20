# FRAMES Development Session Log — February 20, 2025

## Session Summary

This session focused on three core improvements to the FRAMES attendance pipeline:

1. **Fixed the attendance state machine** — EXIT now allows re-ENTRY (previously terminal)
2. **Optimized database queries** — Eliminated N+1 queries across kiosk and student endpoints
3. **Implemented real-time Live Status** — New backend endpoint + frontend component with polling
4. **Fixed VerifiedBy enum crash** — `FACE+GESTURE` LookupError resolved

---

## 1. State Machine Fix (EXIT → Re-ENTRY)

### Problem
The attendance state machine treated `EXIT` as a **terminal state** — once a student exited, `allowed_actions` returned `[]` (empty), permanently blocking re-entry for the rest of the day. This was incorrect because students may leave a class and return later for a different class, or re-enter the same room.

Additionally, the **ENTRY guard** was too strict: it blocked ANY second `ENTRY` on the same day, even after a clean `EXIT`.

### Root Cause
- `get_user_attendance_state` queried logs in **descending** order and read only the latest action. After `EXIT`, it set `has_exited=True` and returned `allowed_actions=[]`.
- The `log_attendance` endpoint checked if ANY `ENTRY` existed today (regardless of subsequent `EXIT`) and rejected duplicates.

### What Changed

**File: `backend/api/routers/kiosk.py`** — `get_user_attendance_state()`
- Changed from `.desc()` to `.asc()` — now walks logs **chronologically**
- After encountering `EXIT`, sets `has_exited=True` and resets `has_entered=False`, `is_on_break=False`
- If a new `ENTRY` appears after `EXIT`, resets `has_exited=False` (new session started)
- `allowed_actions` now returns `["ENTRY"]` when `not has_entered or has_exited`

**File: `backend/api/routers/kiosk.py`** — `log_attendance()` ENTRY guard
- Old: Blocked if ANY `ENTRY` log exists today → too strict
- New: Checks only the **last action** — blocks only if last action is `ENTRY`, `BREAK_OUT`, or `BREAK_IN` (user still in active session)

**File: `backend/rpi/main_kiosk.py`** — Local state cache
- After `EXIT`, the local `_user_attendance_state` cache now sets `allowed_actions: ["ENTRY"]` instead of `[]`
- Removed the blocking "already exited" display that prevented re-scanning

### Valid State Transitions (After Fix)

```
[No logs] → ENTRY (face only)
ENTRY → BREAK_OUT (peace sign ✌️)
ENTRY → EXIT (open palm 🖐)
BREAK_OUT → BREAK_IN (thumbs up 👍)
BREAK_IN → BREAK_OUT (peace sign ✌️)
BREAK_IN → EXIT (open palm 🖐)
EXIT → ENTRY (face only, new session)
```

---

## 2. N+1 Query Elimination

### Problem
Multiple endpoints had **database queries inside `for` loops**, causing 1 + (3 × N) queries per request. For a student enrolled in 5 classes with 20 attendance records, this meant 60+ DB round-trips per dashboard load.

### What Changed

#### `backend/api/routers/kiosk.py`
| Endpoint | Before | After |
|---|---|---|
| `GET /active-class` | Loop queried `Subject` and `User` per class | Single query with `joinedload(Class.subject), joinedload(Class.faculty)` |
| `GET /device-schedule` | Same N+1 pattern | Same fix — eager loading |

#### `backend/api/routers/student.py`
| Endpoint | Before | After |
|---|---|---|
| `GET /dashboard/{id}` | Loop queried `Class` then `Subject` per log | `joinedload(AttendanceLog.class_).joinedload(Class.subject)` |
| `GET /schedule/{id}` | Loop queried `Class`, `Subject`, `User` per enrollment | `joinedload(Enrollment.class_).joinedload(Class.subject)` + `joinedload(Enrollment.class_).joinedload(Class.faculty)` |
| `GET /history/{id}` | Loop queried `Class` then `Subject` per log, no pagination | Eager loading + pagination with `skip`/`limit` (max 100) |

### Query Count Summary

| Endpoint | Before (queries) | After (queries) |
|---|---|---|
| `/api/kiosk/active-class` | 1 + 2N | 1 |
| `/api/kiosk/device-schedule` | 1 + 2N | 1 |
| `/api/student/dashboard/{id}` | 3 + 2N | 3 |
| `/api/student/schedule/{id}` | 1 + 3N | 1 |
| `/api/student/history/{id}` | 1 + 2N (unbounded) | 2 (paginated) |
| `/api/student/live-status/{id}` | N/A (new) | 2 |

---

## 3. Live Status Feature (New)

### Backend: `GET /api/student/live-status/{user_id}`

**File: `backend/api/routers/student.py`**

New endpoint that returns real-time attendance status for the student dashboard.

**How it works:**
1. Queries today's **latest** `AttendanceLog` for the given user
2. Uses `joinedload` to eagerly fetch `Class` → `Subject` (single query)
3. Maps the `action` field to a status:

| Last Action | Status | Color | Display Text |
|---|---|---|---|
| `ENTRY` | `PRESENT` | green | "In class" |
| `BREAK_IN` | `PRESENT` | green | "Returned from break" |
| `BREAK_OUT` | `BREAK` | amber | "On break" |
| `EXIT` | `EXITED` | grey | "Exited class" |
| No logs today | `IDLE` | grey | "No activity today" |

**Response Schema (`LiveStatusResponse`):**
```json
{
  "status": "PRESENT",
  "status_color": "green",
  "status_text": "In class",
  "room": "CL1",
  "subject_code": "CS101",
  "subject_title": "Introduction to Computing",
  "last_action": "ENTRY",
  "last_timestamp": "2025-02-20 08:03:22.123456"
}
```

### Frontend: `LiveClassStatus` Component

**File: `frontend/src/components/StudentDashboard/StudentDashboardPage.jsx`**

Rewrote the `LiveClassStatus` component to:

1. **Own its data fetching** — has its own `useEffect` with `AbortController`
2. **Poll every 30 seconds** — keeps the status live without requiring page refresh
3. **Handle 3 states** — Loading (spinner), Error (red message), Success (status display)
4. **Show visual indicators:**
   - Green blinking dot + room number → PRESENT (in class)
   - Amber blinking dot + room number → BREAK (on break)
   - No dot → EXITED or IDLE
   - Subject code and title displayed below the room info

Also added `AbortController` to the main `StudentDashboardPage` data fetch (previously missing).

---

## 4. VerifiedBy Enum Fix

### Problem
```
LookupError: 'FACE+GESTURE' is not among the defined enum values.
Enum name: verifiedby. Possible values: FACE, FACE_GESTUR..
```

### Root Cause
The Python `VerifiedBy` enum has:
```python
class VerifiedBy(enum.Enum):
    FACE = "FACE"
    FACE_GESTURE = "FACE+GESTURE"  # name != value
```

The kiosk sends `verified_by: "FACE+GESTURE"` (the **value**). The `log_attendance` endpoint was passing this raw string directly to the ORM:
```python
log = AttendanceLog(verified_by=request.verified_by)  # raw string "FACE+GESTURE"
```

SQLAlchemy's `Enum` column resolves by **member name** first, so it looked for a member literally named `"FACE+GESTURE"` — which doesn't exist (the member name is `FACE_GESTURE`).

### Fix
**File: `backend/api/routers/kiosk.py`** — `log_attendance()`

Convert raw strings to proper enum members **before** creating the ORM object:
```python
action_enum = AttendanceAction(request.action)        # "ENTRY" → AttendanceAction.ENTRY
verified_enum = VerifiedBy(request.verified_by)        # "FACE+GESTURE" → VerifiedBy.FACE_GESTURE
```

Added proper error handling if invalid values are sent (returns 400 with clear message).

The same conversion was added for `action` as a safety measure — it currently works by coincidence (member names happen to match values), but explicit conversion is defensive.

---

## Files Modified

| File | Changes |
|---|---|
| `backend/api/routers/kiosk.py` | State machine fix, ENTRY guard fix, query optimization, enum conversion fix |
| `backend/api/routers/student.py` | New `/live-status` endpoint, N+1 fix on all 3 existing endpoints, pagination on `/history` |
| `backend/rpi/main_kiosk.py` | EXIT local state cache now allows re-ENTRY, removed blocking display |
| `frontend/src/components/StudentDashboard/StudentDashboardPage.jsx` | Rewrote `LiveClassStatus` with real API polling, added `AbortController` to main fetch |

---

## Manual Test Plan

### Test 1: State Machine — Basic Flow
**Prerequisite:** A student with face enrolled, an active class in the current time slot, a registered device.

| Step | Action | Expected Result |
|---|---|---|
| 1 | Student faces kiosk camera (no gesture) | `ENTRY` logged, `verified_by=FACE`, student sees "Welcome" |
| 2 | Student shows ✌️ peace sign | `BREAK_OUT` logged, `verified_by=FACE+GESTURE`, status changes to "On Break" |
| 3 | Student shows 👍 thumbs up | `BREAK_IN` logged, `verified_by=FACE+GESTURE`, status changes to "In class" |
| 4 | Student shows 🖐 open palm | `EXIT` logged, `verified_by=FACE+GESTURE`, status changes to "Exited" |
| 5 | Student faces camera again (no gesture) | **NEW** `ENTRY` logged (new session), not blocked |

### Test 2: State Machine — Invalid Transitions
| Step | Action | Expected Result |
|---|---|---|
| Before any entry, show ✌️ | Should be rejected — no active session to break from |
| After ENTRY, show 👍 thumbs up | Should be rejected — not on break |
| After EXIT, show ✌️ | Should be rejected — need ENTRY first |

### Test 3: Live Status API
```bash
# With no attendance today
curl http://localhost:5000/api/student/live-status/5
# Expected: {"status": "IDLE", "status_color": "grey", "status_text": "No activity today", ...}

# After ENTRY is logged
curl http://localhost:5000/api/student/live-status/5
# Expected: {"status": "PRESENT", "status_color": "green", "room": "CL1", ...}

# After BREAK_OUT
curl http://localhost:5000/api/student/live-status/5
# Expected: {"status": "BREAK", "status_color": "amber", "room": "CL1", ...}

# After EXIT
curl http://localhost:5000/api/student/live-status/5
# Expected: {"status": "EXITED", "status_color": "grey", "room": "CL1", ...}
```

### Test 4: Live Status Frontend
| Step | Expected |
|---|---|
| Open student dashboard | LiveClassStatus card shows with loading spinner briefly, then current status |
| Wait 30 seconds | Status auto-refreshes (check Network tab for polling request) |
| Navigate away, come back | No console errors about "state update on unmounted component" |
| If IDLE | Grey text "No activity today", no blinking dot, room shows "---" |
| If PRESENT | Green blinking dot, room name displayed, subject code shown |
| If BREAK | Amber blinking dot, room name, "On break" text |
| If EXITED | No dot, grey text, room where last detected |

### Test 5: VerifiedBy Enum Fix
```bash
# Log attendance with FACE+GESTURE (previously crashed)
curl -X POST http://localhost:5000/api/kiosk/attendance/log \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "class_id": 1,
    "device_id": 1,
    "action": "BREAK_OUT",
    "verified_by": "FACE+GESTURE",
    "confidence_score": 0.85,
    "gesture_detected": "PEACE_SIGN"
  }'
# Expected: {"success": true, "log_id": ..., "message": "Attendance recorded: BREAK_OUT"}

# Invalid verified_by
curl -X POST http://localhost:5000/api/kiosk/attendance/log \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "class_id": 1,
    "device_id": 1,
    "action": "ENTRY",
    "verified_by": "INVALID",
    "confidence_score": 0.85
  }'
# Expected: HTTP 400, {"detail": "Invalid verified_by: INVALID"}
```

### Test 6: N+1 Query Verification
Enable SQL echo temporarily (`echo=True` in `database.py`) and:

1. Call `GET /api/student/dashboard/5` — should see **exactly 3** SQL queries (user lookup, enrolled count + attendance count, recent logs with JOINs)
2. Call `GET /api/student/schedule/5` — should see **exactly 2** queries (user lookup, enrollments with JOINs)
3. Call `GET /api/student/history/5` — should see **exactly 3** queries (user lookup, logs with JOINs, count query)
4. Call `GET /api/student/history/5?skip=0&limit=10` — should return max 10 records
5. Call `GET /api/student/history/5?limit=500` — should cap at 100

### Test 7: Pagination on History
```bash
# Default pagination
curl "http://localhost:5000/api/student/history/5"
# Expected: Returns up to 50 records

# Custom pagination
curl "http://localhost:5000/api/student/history/5?skip=10&limit=5"
# Expected: Returns 5 records starting from offset 10

# Limit cap
curl "http://localhost:5000/api/student/history/5?limit=999"
# Expected: Returns max 100 records (capped)
```

### Test 8: Re-ENTRY After EXIT (Critical Regression Test)
This is the most important test — the primary bug fix of this session.

```bash
# 1. Log ENTRY
curl -X POST http://localhost:5000/api/kiosk/attendance/log \
  -H "Content-Type: application/json" \
  -d '{"user_id":5,"class_id":1,"device_id":1,"action":"ENTRY","verified_by":"FACE","confidence_score":0.85}'

# 2. Check state — should allow BREAK_OUT and EXIT
curl "http://localhost:5000/api/kiosk/attendance/state?user_id=5&class_id=1"
# Expected: has_entered=true, allowed_actions=["BREAK_OUT","EXIT"]

# 3. Log EXIT
curl -X POST http://localhost:5000/api/kiosk/attendance/log \
  -H "Content-Type: application/json" \
  -d '{"user_id":5,"class_id":1,"device_id":1,"action":"EXIT","verified_by":"FACE+GESTURE","confidence_score":0.85,"gesture_detected":"OPEN_PALM"}'

# 4. Check state — should allow re-ENTRY
curl "http://localhost:5000/api/kiosk/attendance/state?user_id=5&class_id=1"
# Expected: has_entered=false, has_exited=true, allowed_actions=["ENTRY"]

# 5. Log ENTRY again — MUST SUCCEED (this was the bug)
curl -X POST http://localhost:5000/api/kiosk/attendance/log \
  -H "Content-Type: application/json" \
  -d '{"user_id":5,"class_id":1,"device_id":1,"action":"ENTRY","verified_by":"FACE","confidence_score":0.82}'
# Expected: {"success": true, ...} — NOT a 400 error

# 6. Check state — should be in new session
curl "http://localhost:5000/api/kiosk/attendance/state?user_id=5&class_id=1"
# Expected: has_entered=true, has_exited=false, allowed_actions=["BREAK_OUT","EXIT"]
```

---

## Known Remaining Issues (Not Addressed This Session)

These were identified but intentionally deferred per the "don't do drastic refactoring yet" directive:

| Issue | Severity | Location |
|---|---|---|
| Hardcoded `http://localhost:5000` in frontend | P0 | All dashboard components |
| No JWT authentication | P1 | All endpoints use `{user_id}` from URL |
| No `AuthContext` — raw `localStorage` parsing | P1 | `StudentDashboardPage.jsx` and others |
| `echo=True` in database engine | P0 | `db/database.py` |
| No `pool_recycle` / `pool_timeout` configured | P0 | `db/database.py` |
| Zero indexes on any model FK column | P0 | All models |
| `datetime.utcnow` used instead of `datetime.now(timezone.utc)` | P2 | All model timestamp defaults |
| `print()` used instead of `logging` in some files | P2 | Various |
| Admin pages use 100% mock/hardcoded data | P3 | Admin components |
| No rate limiting | P2 | Auth and enrollment endpoints |
| CORS allows all origins (`*`) | P2 | `main.py` |
| `str(e)` exposed in kiosk error response | P1 | `kiosk.py` line ~420 |

These are tracked in `.claude/rules/FRAMES_DEPLOYMENT_CONSTRAINTS.instructions.md` Section 7 "Deployment Readiness Gate" and will be addressed in future sessions.

---

## Architecture Reference

```
                    ┌────────────────────┐
                    │  Student Dashboard │ (React)
                    │  LiveClassStatus   │ polls /live-status every 30s
                    └─────────┬──────────┘
                              │ HTTP
                    ┌─────────▼──────────┐
                    │   FastAPI Backend   │
                    │  student.py router  │ → live-status, dashboard, schedule, history
                    │  kiosk.py router    │ → active-class, log, state, enrollment
                    └─────────┬──────────┘
                              │ SQLAlchemy (joinedload)
                    ┌─────────▼──────────┐
                    │ Aiven PostgreSQL    │
                    │ attendance_logs     │ ← highest volume table
                    │ classes, subjects   │
                    │ enrollments, users  │
                    └────────────────────┘
                              ▲
        ┌─────────────────────┤ HTTP POST /log
        │                     │
  ┌─────┴──────────┐   ┌─────┴──────────┐
  │  RPi Kiosk #1  │   │  Laptop Kiosk  │
  │  InsightFace   │   │  (test mode)   │
  │  MediaPipe     │   │                │
  │  Camera V2     │   │                │
  └────────────────┘   └────────────────┘
```

---
---

# PR Summary — 2026-02-20 (Eann's Session)

**Date:** 2026-02-20  
**Branch:** `main`  

---

