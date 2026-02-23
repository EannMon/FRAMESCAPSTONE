# FRAMES Attendance Pipeline — Implementation Documentation

**Date:** February 18, 2026  
**Author:** Development Team  
**Status:** Implemented & Verified  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [Attendance State Machine](#3-attendance-state-machine)
4. [Files Modified / Created](#4-files-modified--created)
5. [Database Changes](#5-database-changes)
6. [API Endpoints (New & Updated)](#6-api-endpoints-new--updated)
7. [Kiosk Application (main_kiosk.py)](#7-kiosk-application-main_kioskpy)
8. [Gesture Detection Fix](#8-gesture-detection-fix)
9. [Device Setup & Configuration](#9-device-setup--configuration)
10. [Scripts Created](#10-scripts-created)
11. [How to Run](#11-how-to-run)
12. [Testing Checklist](#12-testing-checklist)
13. [Bugfixes Applied (Session 2)](#13-bugfixes-applied-feb-18-2026--session-2)
14. [Known Limitations & Future Work](#14-known-limitations--future-work)

---

## 1. Overview

### What Was Built

A complete **face-recognition attendance pipeline** that runs on a laptop (substituting for Raspberry Pi) and logs attendance into the `attendance_logs` database table. The system:

- Links a **camera/device to a room** (room 306)
- Resolves the **active scheduled class** for that room based on current day/time
- Loads **enrolled students + faculty** for the active class
- Performs **continuous face recognition** using InsightFace (buffalo_l model)
- Implements a **state machine** for attendance actions (Entry → Break/Exit)
- Uses **gesture detection** (MediaPipe Hands) for break/exit actions
- Detects **late arrivals** using a configurable threshold per class
- Handles **unauthorized persons** (recognized but not enrolled) with `[NOT_IN_CLASS]` logging

### Why It Was Needed

Previously, the kiosk code could detect and recognize faces but had **no attendance logging pipeline**. Recognized faces were not tied to scheduled classes, enrollment was not verified, and no data was written to the `attendance_logs` table. The gestures also had a bug where **peace sign was not being recognized** by MediaPipe.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Face-only ENTRY (no gesture) | Reduces friction for the most common action—walking into class |
| Gesture-gated break/exit | Prevents accidental logging; explicit user intent required |
| Per-class late threshold | Different classes may have different tolerance for lateness |
| NOT_IN_CLASS logging | Auditable record of unauthorized room access |
| Cooldown per user (10s) | Prevents duplicate scans from continuous camera feed |
| Local state cache | Reduces API calls; refreshes on class change |

---

## 2. Architecture & Data Flow

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    LAPTOP KIOSK (main_kiosk.py)             │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Camera   │→│ FaceDetector │→│ FaceRecognizer         │  │
│  │ (OpenCV)  │  │ (MediaPipe)  │  │ (InsightFace buffalo_l)│  │
│  └──────────┘  └──────────────┘  └──────────┬───────────┘  │
│                                              │              │
│                              Embedding match │              │
│                              (cosine sim)    ↓              │
│                         ┌───────────────────────┐           │
│                         │  EmbeddingCache        │           │
│                         │  (embeddings_cache.json│           │
│                         │   8 faces, 512-d each) │           │
│                         └──────────┬────────────┘           │
│                                    │                        │
│          ┌─────────────────────────┤                        │
│          │ Matched user_id         │ No match → "Unknown"   │
│          ↓                         ↓                        │
│  ┌───────────────────┐   ┌──────────────────────┐          │
│  │ Enrollment Check   │   │ Display warning       │          │
│  │ (API: enrolled?)   │   └──────────────────────┘          │
│  └───────┬───────────┘                                      │
│          │                                                  │
│     ┌────┴─────┐                                            │
│     │Enrolled? │                                            │
│  YES│          │NO                                          │
│     ↓          ↓                                            │
│  ┌──────┐  ┌──────────────┐                                 │
│  │State  │  │Log once with   │                                │
│  │Machine│  │[NOT_IN_CLASS]  │                                │
│  └──┬───┘  └──────────────┘                                 │
│     │                                                       │
│  ┌──┴──────────────────────────────────┐                    │
│  │ ENTRY? → face only → log ENTRY      │                    │
│  │ Already entered? → prompt gesture:   │                    │
│  │   ✌️ Peace   → BREAK_OUT             │                    │
│  │   👍 ThumbsUp → BREAK_IN             │                    │
│  │   🖐 Palm     → EXIT                 │                    │
│  └──┬──────────────────────────────────┘                    │
│     │                                                       │
│     ↓                                                       │
│  ┌──────────────────┐                                       │
│  │ AttendanceLogger  │ ←── Offline queue if API down        │
│  │ POST /api/kiosk/  │                                       │
│  │ attendance/log     │                                       │
│  └─────────┬────────┘                                       │
└────────────│────────────────────────────────────────────────┘
             │ HTTP
             ↓
┌─────────────────────────────────────────────────────────────┐
│              FASTAPI BACKEND (localhost:5000)                │
│                                                             │
│  POST /api/kiosk/attendance/log                             │
│    → Validate user, class, device                           │
│    → Check enrollment (faculty or enrolled student?)        │
│    → Calculate is_late (compare timestamp vs start_time     │
│      + late_threshold_minutes)                              │
│    → INSERT INTO attendance_logs                            │
│                                                             │
│  GET /api/kiosk/attendance-state                            │
│    → Query today's logs for user+class                      │
│    → Return state machine position (allowed_actions)        │
│                                                             │
│  GET /api/kiosk/class/{id}/enrolled                         │
│    → Return faculty + enrolled students for a class         │
│                                                             │
│  GET /api/kiosk/active-class                                │
│    → Match device.room to classes by day_of_week & time     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
             │ SQLAlchemy ORM
             ↓
┌─────────────────────────────────────────────────────────────┐
│             POSTGRESQL DATABASE (Aiven Cloud)               │
│                                                             │
│  Tables involved:                                           │
│    devices          → room assignment, device identity      │
│    classes          → schedule (room, day, time, faculty)   │
│    subjects         → subject code + title                  │
│    users            → student/faculty profiles              │
│    enrollments      → student ↔ class mapping               │
│    attendance_logs  → ENTRY/EXIT/BREAK records              │
│    facial_profiles  → 512-d embeddings (for export)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **Camera** captures video frames continuously
2. **FaceDetector** (MediaPipe BlazeFace) detects face bounding box (RPi gate; skipped on laptop)
3. **FaceRecognizer** (InsightFace buffalo_l) extracts 512-dimensional embedding
4. **EmbeddingCache** matches embedding against known faces (cosine similarity ≥ 0.35)
5. **Enrollment check** via API: is this user enrolled in the active class?
6. **State machine** determines allowed action (ENTRY vs gesture-based break/exit)
7. **GestureDetector** (MediaPipe Hands) captures gesture if required
8. **AttendanceLogger** sends POST request to backend API
9. **Backend** validates, calculates lateness, and inserts into `attendance_logs`

---

## 3. Attendance State Machine

### State Transitions

```
(start)
   │
   ▼
ENTRY ──(face only)──► ENTERED
   │                      │
   │               ┌──────┴──────┐
   │               │             │
   │               ▼             ▼
   │          BREAK_OUT       EXIT
   │        (✌️ peace)     (🖐 palm)
   │               │             │
   │               ▼             ▼
   │           ON_BREAK       (end)
   │               │
   │               ▼
   │          BREAK_IN
   │        (👍 thumbs up)
   │               │
   │               ▼
   │           ENTERED ◄───── (loop back)
   │               │
   │        [can BREAK_OUT or EXIT again]
   │
   └──► No more actions after EXIT
```

### Quick Reference Table

| Current State | Trigger | Action Logged | Verified By | Next State |
|---------------|---------|---------------|-------------|------------|
| Not entered | Face recognized | `ENTRY` | `FACE` | Entered |
| Entered | ✌️ Peace sign | `BREAK_OUT` | `FACE+GESTURE` | On break |
| Entered | 🖐 Open palm | `EXIT` | `FACE+GESTURE` | Exited (final) |
| On break | 👍 Thumbs up | `BREAK_IN` | `FACE+GESTURE` | Entered |
| Exited | — | No action | — | — |

### Allowed Actions per State

| State | `allowed_actions` |
|-------|------------------|
| Not entered yet | `["ENTRY"]` |
| Entered (in class) | `["BREAK_OUT", "EXIT"]` |
| On break | `["BREAK_IN"]` |
| Exited | `[]` (empty — session over) |

### State Query API

```
GET /api/kiosk/attendance-state?user_id=5&class_id=3
```

Response:
```json
{
  "user_id": 5,
  "class_id": 3,
  "has_entered": true,
  "is_on_break": false,
  "has_exited": false,
  "last_action": "ENTRY",
  "allowed_actions": ["BREAK_OUT", "EXIT"]
}
```

---

## 4. Files Modified / Created

### Modified Files (6)

| File | What Changed |
|------|-------------|
| `backend/models/class_.py` | Added `late_threshold_minutes = Column(Integer, default=15)` for per-class late configuration |
| `backend/api/routers/kiosk.py` | Added 5 new Pydantic schemas, 3 new endpoints (attendance-state, enrolled, late-threshold), enhanced attendance logging with late detection + enrollment check |
| `backend/api/routers/faculty.py` | Added `LateThresholdUpdate` schema, `PUT` and `GET` endpoints for `/class/{class_id}/late-threshold` |
| `backend/rpi/main_kiosk.py` | Complete rewrite — attendance state machine, enrollment verification, class change detection, gesture prompting with visual overlay |
| `backend/rpi/gesture_detector.py` | Fixed peace sign detection — raised curled threshold (1.7→1.8), added fallback check using `not ring_up and not pinky_up` |
| `backend/rpi/config.py` | Changed `REQUIRE_GESTURE_FOR_ENTRY` from `True` to `False` |

### Created Files (2)

| File | Purpose |
|------|---------|
| `backend/scripts/setup_laptop_device.py` | Registers laptop as a kiosk device in the `devices` table for room 306 |
| `backend/scripts/migrate_late_threshold.py` | Adds `late_threshold_minutes` column to `classes` table via ALTER TABLE |

---

## The State Machine

The state machine: (the gesture should not be repeated to recognized one already done and recognized, it should be prompted to new gesture applicable to the state.)

State	Action	Verified By	Gesture
Not entered	ENTRY	FACE only	None needed
Entered	BREAK_OUT	FACE+GESTURE	✌️ Peace sign
On break	BREAK_IN	FACE+GESTURE	👍 Thumbs up
Entered	EXIT	FACE+GESTURE	🖐 Open palm
Exited	No actions	—	—
Recognition logic:

Camera fetches active class for its room from schedule
Loads enrolled students + faculty for that class
On face recognition:
Enrolled/faculty → follows the state machine above
Recognized but NOT enrolled → logged as [NOT_IN_CLASS] with name
Unknown face → shown as "Unknown" on screen (not logged)
ENTRY automatically checks if late (based on late_threshold_minutes)
4. Peace Sign Fix in gesture_detector.py
Added fallback peace sign detection: if index+middle are UP and ring+pinky are NOT UP (even if not strictly "curled"), it counts
Raised curled threshold from 1.7 → 1.8 to avoid the grey zone between "extended" and "curled"
5. New API Endpoints in kiosk.py
GET /api/kiosk/class/{class_id}/enrolled — returns all students + faculty for a class
GET /api/kiosk/attendance-state?user_id=X&class_id=Y — returns current state + allowed actions
PUT /api/kiosk/class/{class_id}/late-threshold — update late minutes
Enhanced POST /api/kiosk/attendance/log — now returns is_late and handles [NOT_IN_CLASS] marking

---

## 5. Database Changes

### New Column: `classes.late_threshold_minutes`

```sql
ALTER TABLE classes 
ADD COLUMN late_threshold_minutes INTEGER DEFAULT 15;
```

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `late_threshold_minutes` | `INTEGER` | `15` | Minutes after `start_time` before a student is marked late. Configurable per class by faculty/head (1–120 range). |

**Migration script:** `backend/scripts/migrate_late_threshold.py`  
**Status:** ✅ Executed successfully

### New Device Row

```sql
-- Created by setup_laptop_device.py
INSERT INTO devices (room, ip_address, device_name, status, room_capacity)
VALUES ('306', '192.168.254.107', 'LAPTOP-Emmanuel-306', 'ACTIVE', 40);
-- Resulted in Device ID = 1
```

**Setup script:** `backend/scripts/setup_laptop_device.py`  
**Status:** ✅ Executed successfully (Device ID: 1)

### Attendance Log Fields Used

The `attendance_logs` table receives records with these fields:

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `user_id` | int | `5` | FK to `users.id` |
| `class_id` | int | `3` | FK to `classes.id` |
| `device_id` | int | `1` | FK to `devices.id` |
| `action` | enum | `ENTRY` | One of: ENTRY, BREAK_OUT, BREAK_IN, EXIT |
| `verified_by` | enum | `FACE` | `FACE` for entry, `FACE+GESTURE` for break/exit |
| `is_late` | bool | `true` | Computed: timestamp > start_time + late_threshold |
| `confidence_score` | float | `0.42` | Cosine similarity score |
| `gesture_detected` | string | `PEACE_SIGN` | Null for ENTRY; gesture name for break/exit |
| `timestamp` | datetime | `2026-02-18T10:20:00` | When the recognition occurred |
| `remarks` | string | `[LATE by 22 min]` | Auto-appended markers: `[NOT_IN_CLASS]`, `[LATE by N min]` |

---

## 6. API Endpoints (New & Updated)

### New Endpoints

#### 1. `GET /api/kiosk/attendance-state`

**Purpose:** Query current attendance state for a user in a class today.

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | int (query) | User's database ID |
| `class_id` | int (query) | Class ID |

**Response (200):**
```json
{
  "user_id": 5,
  "class_id": 3,
  "has_entered": true,
  "is_on_break": false,
  "has_exited": false,
  "last_action": "ENTRY",
  "allowed_actions": ["BREAK_OUT", "EXIT"]
}
```

**Logic:**
- Queries all `attendance_logs` for user+class where `timestamp` is today
- Iterates through logs to build state (entered? on break? exited?)
- Returns `allowed_actions` based on state machine rules

---

#### 2. `GET /api/kiosk/class/{class_id}/enrolled`

**Purpose:** Get all enrolled students and faculty for a class.

**Response (200):**
```json
{
  "class_id": 3,
  "subject_code": "CS101",
  "faculty": {
    "user_id": 2,
    "name": "John Doe",
    "email": "john@tup.edu.ph",
    "tupm_id": "TUPM-00-1234",
    "role": "FACULTY"
  },
  "students": [
    {
      "user_id": 5,
      "name": "Jane Smith",
      "email": "jane@tup.edu.ph",
      "tupm_id": "TUPM-21-5678",
      "role": "STUDENT",
      "section": "BSIT-4A"
    }
  ],
  "total_enrolled": 1
}
```

**Used by:** `main_kiosk.py._fetch_class_enrollment()` to build the set of enrolled user IDs.

---

#### 3. `PUT /api/kiosk/class/{class_id}/late-threshold`

**Purpose:** Update late threshold for a class (also accessible via faculty router).

**Request Body:**
```json
{
  "late_threshold_minutes": 20
}
```

**Validation:** Must be between 1 and 120 minutes.

---

#### 4. `PUT /api/faculty/class/{class_id}/late-threshold`

**Purpose:** Faculty/head can set how many minutes after start time is considered "late."

**Request/Response:** Same as kiosk endpoint above. Separate route for faculty dashboard access.

---

#### 5. `GET /api/faculty/class/{class_id}/late-threshold`

**Purpose:** Get current late threshold for a class.

**Response (200):**
```json
{
  "class_id": 3,
  "late_threshold_minutes": 15
}
```

---

### Updated Endpoint

#### `POST /api/kiosk/attendance/log` (Enhanced)

**Changes made:**

1. **Enrollment verification:** Checks if `user_id` is the class faculty OR enrolled as a student. If neither, appends `[NOT_IN_CLASS]` to remarks.

2. **Late detection:** For `ENTRY` actions, compares `timestamp` against `class.start_time + late_threshold_minutes`. If late:
   - Sets `is_late = True` on the log entry
   - Appends `[LATE by N min]` to remarks

3. **Response:** Now includes `is_late` boolean.

**Request Body:**
```json
{
  "user_id": 5,
  "class_id": 3,
  "device_id": 1,
  "action": "ENTRY",
  "verified_by": "FACE",
  "confidence_score": 0.42,
  "gesture_detected": null,
  "timestamp": "2026-02-18T10:20:00",
  "remarks": null
}
```

**Response (200):**
```json
{
  "success": true,
  "log_id": 42,
  "message": "Attendance recorded: ENTRY (LATE)",
  "is_late": true
}
```

---

## 7. Kiosk Application (main_kiosk.py)

### Complete Rewrite Summary

The `main_kiosk.py` file was rewritten from ~150 lines to ~627 lines, implementing a full attendance kiosk application.

### Class: `AttendanceKiosk`

#### Initialization (`__init__`)

Loads all components:
- **FaceDetector** — MediaPipe BlazeFace (fast pre-filter for RPi)
- **FaceRecognizer** — InsightFace buffalo_l (512-d embeddings)
- **GestureDetector** — MediaPipe Hands (peace, thumbs up, open palm)
- **EmbeddingCache** — JSON file with 8 enrolled face embeddings (127.1 KB)
- **ScheduleResolver** — Queries backend for active class by room+time
- **AttendanceLogger** — POSTs attendance records with offline queue fallback

State tracking dictionaries:
```python
self._last_recognized: Dict[int, float]       # user_id → timestamp (cooldown)
self._user_attendance_state: Dict[str, dict]   # "uid_classid" → state
self._class_enrolled_ids: Set[int]             # enrolled student IDs
self._class_faculty_id: Optional[int]          # faculty ID for current class
self._current_class_id: Optional[int]          # track class changes
```

#### Main Loop (`run()`)

```
1. Open camera (OpenCV or picamera2 depending on platform)
2. Sync schedule from backend
3. Flush any offline attendance records

LOOP:
  4. Read frame from camera
  5. Skip frames per RECOGNITION_FRAME_SKIP config
  6. Get active class from ScheduleResolver
     → If none: display "No active class scheduled", wait
  7. If class changed: reload enrollment, clear cooldowns
  8. Process frame → face recognition → get (match, confidence, bbox)
  9. If no match: display "Unknown" if face detected, continue
  10. If on cooldown: display "(cooldown)", continue
  11. If match found:
      a. Check enrollment: _is_user_in_class(user_id)?
         → NO: log [NOT_IN_CLASS], show warning 2s, continue
      b. Fetch attendance state: _fetch_attendance_state(user_id, class_id)
      c. If allowed_actions empty: "Already exited", continue
      d. If ENTRY in allowed: log ENTRY (face only), update local state
      e. Else: prompt gesture → map to action → validate allowed → log
  12. Apply cooldown, brief display pause
```

#### Gesture Prompt (`check_gesture()`)

When a gesture is needed:
1. Show visual overlay: "Show gesture... (8.0s)"
2. Display gesture options: "Peace = Break Out | Thumbs Up = Break In | Palm = Exit"
3. Show real-time detected gesture name
4. Draw hand landmarks if detected
5. Return gesture once confirmed (passes temporal smoothing)
6. Return `None` on timeout

#### Key Methods

| Method | Purpose |
|--------|---------|
| `_fetch_class_enrollment(class_id)` | GET `/api/kiosk/class/{id}/enrolled` → populates `_class_enrolled_ids` and `_class_faculty_id` |
| `_fetch_attendance_state(user_id, class_id)` | GET `/api/kiosk/attendance-state` → returns allowed actions |
| `_is_user_in_class(user_id)` | Checks set membership: enrolled students OR faculty |
| `process_frame(frame_bgr)` | Face detection + recognition pipeline → returns `(match, confidence, bbox)` |
| `check_gesture(cap, timeout)` | Captures gesture with visual feedback within timeout |
| `is_on_cooldown(user_id)` | Prevents duplicate scans (10s window) |
| `mark_recognized(user_id)` | Records timestamp for cooldown tracking |

---

## 8. Gesture Detection Fix

### Problem

The peace sign (✌️) was **not being recognized** by MediaPipe in our code. Users would hold up a peace sign, but the system would either detect `OPEN_PALM` or `NONE`.

### Root Cause Analysis

The gesture detector uses a **distance-ratio method** to determine finger extension:

```
ratio = tip_to_MCP_distance / PIP_to_MCP_distance
```

- **Extended:** ratio > 1.5
- **Curled (old):** ratio < 1.7

The gap between 1.5 (extended) and 1.7 (curled) was only **0.2**, creating a "grey zone." In practice, the ring and pinky fingers during a peace sign often have ratios between 1.5 and 1.7 — not detected as extended, but also not detected as curled. This meant:

- Index ✅ extended
- Middle ✅ extended  
- Ring ❌ neither extended nor curled (grey zone)
- Pinky ❌ neither extended nor curled (grey zone)
- Result: No gesture matched

Additionally, the `OPEN_PALM` check came **before** the peace sign check in the classification order, so if ring/pinky were marginally extended, the system would match open palm instead of peace sign.

### Fix Applied (gesture_detector.py)

**Change 1:** Raised curled threshold from 1.7 → 1.8

```python
# Old
return ratio < 1.7

# New — wider gap avoids grey zone
return ratio < 1.8
```

**Change 2:** Added fallback peace sign detection

```python
# Primary check: strict curled 
if index_up and middle_up and ring_curled and pinky_curled:
    return Gesture.PEACE_SIGN

# Fallback: NOT extended (instead of requiring strictly curled)
if index_up and middle_up and not ring_up and not pinky_up:
    return Gesture.PEACE_SIGN
```

**Change 3:** Reordered classification — peace sign is now checked **before** open palm:

```python
# Order: PEACE_SIGN → OPEN_PALM → THUMBS_UP
# (Previously: OPEN_PALM was checked first)
```

### Threshold Summary

| Measurement | Old Value | New Value | 
|-------------|-----------|-----------|
| Extended threshold | > 1.5 | > 1.5 (unchanged) |
| Curled threshold | < 1.7 | < 1.8 |
| Grey zone width | 0.2 | 0.3 (eliminated for peace sign via fallback) |

---

## 9. Device Setup & Configuration

### Laptop Registered as Kiosk Device

```
Device ID:   1
Device Name: LAPTOP-Emmanuel-306
Room:        306
IP Address:  192.168.254.107
Status:      ACTIVE
```

### Configuration (config.py)

Key settings for laptop mode:

| Setting | Value | Notes |
|---------|-------|-------|
| `PLATFORM` | `"laptop"` | Auto-detected (not ARM) |
| `USE_GATED_DETECTION` | `False` | InsightFace runs directly (fast on laptop) |
| `RECOGNITION_DET_SIZE` | `(640, 640)` | Full resolution detection |
| `RECOGNITION_FRAME_SKIP` | `1` | Process every frame |
| `MATCH_THRESHOLD` | `0.35` | Cosine similarity cutoff |
| `REQUIRE_GESTURE_FOR_ENTRY` | `False` | **Changed from True** — face-only entry |
| `REQUIRE_GESTURE_FOR_EXIT` | `True` | Gestures for break/exit |
| `GESTURE_TIMEOUT_SECONDS` | `8.0` | Time to show gesture |
| `GESTURE_CONSECUTIVE_FRAMES` | `3` | Temporal smoothing |
| `COOLDOWN_SECONDS` | `10` | Prevent duplicate scans |
| `INSIGHTFACE_MODEL` | `"buffalo_l"` | Must match enrollment model |
| `CAMERA_WIDTH` | `640` | Laptop default |
| `CAMERA_HEIGHT` | `480` | Laptop default |

---

## 10. Scripts Created

### `scripts/setup_laptop_device.py`

**Purpose:** Register the laptop as a kiosk device in the database.

**Usage:**
```powershell
cd backend
python scripts/setup_laptop_device.py               # Default: room 306
python scripts/setup_laptop_device.py --room "Lab 201"   # Custom room
python scripts/setup_laptop_device.py --name "MyKiosk"   # Custom name
```

**Behavior:**
1. Auto-detects local IP address
2. Generates device name: `LAPTOP-{hostname}-{room}`
3. Checks for existing device with same name or room
4. Creates or updates the device record
5. Prints the Device ID needed for kiosk startup

### `scripts/migrate_late_threshold.py`

**Purpose:** Add `late_threshold_minutes` column to the `classes` table.

**Usage:**
```powershell
cd backend
python scripts/migrate_late_threshold.py
```

**Behavior:**
1. Checks if column already exists (idempotent)
2. Runs `ALTER TABLE classes ADD COLUMN late_threshold_minutes INTEGER DEFAULT 15`
3. Reports success/already-exists

---

## 11. How to Run

### Prerequisites

1. **Backend server running** on `http://localhost:5000`
2. **Device registered** with a room assignment (room "Room 306", Device ID = 1)
3. **Embeddings exported** to `rpi/data/embeddings_cache.json`
4. **Classes scheduled** in the database for room "306" on the current day/time
5. **Students enrolled** in those classes

### Step-by-Step

```powershell
# Terminal 1: Start the backend server
cd backend
python main.py

# Terminal 2: Run the kiosk
cd backend
python rpi/main_kiosk.py --device-id 1

# OR using environment variable:
$env:DEVICE_ID="1"; python rpi/main_kiosk.py
```

### Verify Data is Being Logged

After running the kiosk and having a face recognized:
- Check the `attendance_logs` table in the database
- Use the FastAPI docs at `http://localhost:5000/docs` to query endpoints
- Check the terminal output for `✅ ENTRY logged for {name}` messages

### Re-export Embeddings (if new faces enrolled)

```powershell
cd backend
python scripts/export_embeddings.py
# Output: rpi/data/embeddings_cache.json
```

---

## 12. Testing Checklist

### Functional Tests

- [ ] **ENTRY (face only):** Walk up to camera → face recognized → ENTRY logged with `verified_by=FACE`
- [ ] **BREAK_OUT (gesture):** After ENTRY, face recognized again → prompt gesture → show peace sign ✌️ → BREAK_OUT logged with `verified_by=FACE+GESTURE`, `gesture_detected=PEACE_SIGN`
- [ ] **BREAK_IN (gesture):** After BREAK_OUT → show thumbs up 👍 → BREAK_IN logged
- [ ] **EXIT (gesture):** After ENTRY or BREAK_IN → show open palm 🖐 → EXIT logged
- [ ] **Session end:** After EXIT → no more actions allowed → "Already exited" displayed
- [ ] **Late detection:** ENTRY after `start_time + late_threshold_minutes` → `is_late=true`, remarks contain `[LATE by N min]`
- [ ] **NOT_IN_CLASS:** Recognized face not enrolled in active class → warning displayed → logged ONCE with `[NOT_IN_CLASS]` remark (no duplicates)
- [ ] **Duplicate ENTRY blocked:** Same person re-recognized after ENTRY → state machine prompts gesture instead of re-logging ENTRY
- [ ] **Unknown face:** Unmatched face → red bounding box → "Unknown" label → no log
- [ ] **Cooldown:** Same person re-detected within 10 seconds → "(cooldown)" displayed → no duplicate log
- [ ] **Enrollment retry:** If enrollment fetch fails on kiosk startup → retries automatically until successful
- [ ] **Class change:** When schedule moves to next class → enrollment reloaded → cooldowns cleared
- [ ] **No active class:** Outside schedule hours → "No active class scheduled" displayed

### Gesture Detection Tests

- [ ] **Peace sign recognized** (index + middle extended, ring + pinky not extended)
- [ ] **Thumbs up recognized** (thumb extended, all fingers curled)
- [ ] **Open palm recognized** (all 4 fingers extended)
- [ ] **Gesture timeout:** No gesture within 8 seconds → "Gesture timeout" → no action logged
- [ ] **Wrong gesture:** Gesture maps to disallowed action → "not allowed" → no action logged

### API Tests

- [ ] `GET /api/kiosk/active-class?device_id=1` returns active class for room 306
- [ ] `GET /api/kiosk/class/{id}/enrolled` returns faculty + students
- [ ] `GET /api/kiosk/attendance-state?user_id=5&class_id=3` returns correct state
- [ ] `POST /api/kiosk/attendance/log` creates row in `attendance_logs`
- [ ] `PUT /api/faculty/class/{id}/late-threshold` updates threshold (1–120 range)
- [ ] `GET /api/faculty/class/{id}/late-threshold` returns current threshold

---

## 13. Bugfixes Applied (Feb 18, 2026 — Session 2)

### Bug 1: Duplicate ENTRY Logging for NOT_IN_CLASS Users

**Problem:** When a recognized face was NOT enrolled in the active class, the kiosk logged a new `ENTRY` with `[NOT_IN_CLASS]` **every 10 seconds** (after cooldown expired). No state machine check was applied — the NOT_IN_CLASS code path bypassed state tracking entirely.

**Root Cause:** The NOT_IN_CLASS branch in `main_kiosk.py` always called `log_attendance(action=ENTRY)` without checking whether it had already been logged for this user this session.

**Fix (kiosk-side):**
- Added `_not_in_class_logged: Set[int]` to track user_ids already logged as NOT_IN_CLASS
- NOT_IN_CLASS is now logged **once per user per class session** — subsequent recognitions show the warning but don't create new DB rows
- Set is cleared on class change

**Fix (server-side):**
- Backend `POST /api/kiosk/attendance/log` now checks for existing NOT_IN_CLASS logs for the same user+class today
- If duplicate found, returns `success: true` with the existing log_id (idempotent)

### Bug 2: Enrollment Fetch Failure Never Retried

**Problem:** After a kiosk restart, if the enrollment API call failed (e.g., backend still starting up), the kiosk set `last_class_id` to the active class anyway. This prevented any retry on subsequent loop iterations. Result: `_class_enrolled_ids` stayed empty, making **every recognized user appear as NOT_IN_CLASS**.

**Root Cause:** In `run()`, `last_class_id = active_class.class_id` was set **regardless of whether `_fetch_class_enrollment()` succeeded**.

**Fix:**
- Added `_enrollment_loaded: bool` flag — only `True` after a successful enrollment API response
- `last_class_id` is now only set when `_enrollment_loaded` is `True`
- If enrollment is not loaded, the kiosk retries every 2 seconds until successful
- Added fallback: even if `last_class_id` matches, re-checks `_enrollment_loaded` and retries if needed

### Bug 3: Server-Side Duplicate ENTRY Prevention

**Problem:** Even when the kiosk state machine worked correctly, there was no server-side guard against duplicate ENTRY records (e.g., if kiosk was restarted mid-session, it could re-log ENTRY for a user who already entered).

**Fix:**
- Backend `POST /api/kiosk/attendance/log` now checks for existing ENTRY logs for the same user+class today
- If an ENTRY already exists, returns `success: true` with the existing log_id instead of creating a duplicate
- This applies only to enrolled users (NOT_IN_CLASS has its own separate guard)

### Bug 4: Port Mismatch (Fixed Earlier)

`config.py` defaulted to `http://localhost:8000` but backend runs on port 5000. Fixed to `http://localhost:5000`.

### Bug 5: Room Name Mismatch (Fixed Earlier)

Device registered as `"306"` but classes table has `"Room 306"`. Fixed by updating device room in DB.

### Bug 6: Attendance Logger URL (Fixed Earlier)

`attendance_logger.py` posted to `/api/attendance/log` (doesn't exist) instead of `/api/kiosk/attendance/log`.

### Bug 7: verifiedby Enum Mismatch (Fixed Earlier)

PostgreSQL enum had `FACE_GESTURE` (underscore) but Python sends `FACE+GESTURE` (plus sign). Fixed by renaming DB enum.

---

## 14. Known Limitations & Future Work

### Current Limitations

| Limitation | Description |
|------------|-------------|
| **No auth on kiosk endpoints** | Kiosk API endpoints lack authentication tokens. Anyone with the URL can call them. |
| **Single camera** | Only one camera feed processed. No support for multiple angles. |
| **Cooldown is client-side** | The 10-second cooldown is tracked in the kiosk's memory, not enforced in the DB. A restart resets cooldowns. |
| **No frontend for late threshold** | The `PUT /api/faculty/class/{id}/late-threshold` endpoint exists but the React dashboard has not been updated to call it. |
| **Offline queue not tested** | The offline attendance queue (for network failures) exists but has not been stress-tested. |
| **Gesture sensitivity** | Thumbs up may be hard to detect in certain hand orientations or lighting conditions. |

### Future Work

1. **Frontend integration:** Add late threshold slider to faculty dashboard
2. **Authentication:** Add JWT/API key validation to kiosk endpoints
3. **Multi-camera:** Support multiple angles or cameras per room
4. **Notification system:** Alert faculty when unauthorized person detected
5. **Attendance reports:** Generate daily/weekly reports from logged data
6. **RPi deployment:** Test and optimize on actual Raspberry Pi 4 hardware
7. **Embedding refresh:** Auto-sync embeddings when new students enroll
8. **Gesture training:** Allow users to calibrate gesture sensitivity

---

## Appendix A: File Reference (Full Paths)

| File | Full Path |
|------|-----------|
| Main kiosk | `backend/rpi/main_kiosk.py` |
| Config | `backend/rpi/config.py` |
| Gesture detector | `backend/rpi/gesture_detector.py` |
| Face recognizer | `backend/rpi/face_recognizer.py` |
| Face detector | `backend/rpi/face_detector.py` |
| Embedding cache | `backend/rpi/embedding_cache.py` |
| Schedule resolver | `backend/rpi/schedule_resolver.py` |
| Attendance logger | `backend/rpi/attendance_logger.py` |
| Camera wrapper | `backend/rpi/camera.py` |
| Kiosk API router | `backend/api/routers/kiosk.py` |
| Faculty API router | `backend/api/routers/faculty.py` |
| Class model | `backend/models/class_.py` |
| AttendanceLog model | `backend/models/attendance_log.py` |
| Enrollment model | `backend/models/enrollment.py` |
| Device model | `backend/models/device.py` |
| Device setup script | `backend/scripts/setup_laptop_device.py` |
| Late threshold migration | `backend/scripts/migrate_late_threshold.py` |
| Embedding export | `backend/scripts/export_embeddings.py` |
| Embedding cache data | `backend/rpi/data/embeddings_cache.json` |

## Appendix B: Gesture-to-Action Mapping (Code Reference)

```python
# From main_kiosk.py
GESTURE_ACTION_MAP = {
    Gesture.PEACE_SIGN: AttendanceAction.BREAK_OUT,   # ✌️ → Leave for break
    Gesture.THUMBS_UP:  AttendanceAction.BREAK_IN,    # 👍 → Return from break
    Gesture.OPEN_PALM:  AttendanceAction.EXIT,         # 🖐 → Leave for the day
}
```

## Appendix C: Late Detection Logic

```python
# From kiosk.py POST /api/kiosk/attendance/log
if request.action == "ENTRY" and class_.start_time:
    late_threshold = class_.late_threshold_minutes or 15  # default 15 min
    
    class_start_dt = datetime.combine(timestamp.date(), start_time)
    late_cutoff = class_start_dt + timedelta(minutes=late_threshold)
    
    if timestamp > late_cutoff:
        is_late = True
        minutes_late = int((timestamp - class_start_dt).total_seconds() / 60)
        remarks += f" [LATE by {minutes_late} min]"
```

**Example:** Class starts at 08:00, threshold = 15 min, student enters at 08:22  
→ `is_late = True`, remarks = `[LATE by 22 min]`
