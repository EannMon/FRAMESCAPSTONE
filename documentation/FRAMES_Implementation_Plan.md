# 📋 FRAMES Feature Implementation Plan
## Finalized Task Breakdown with Database Mapping

**Version:** 1.0  
**Date:** February 8, 2026  
**Status:** Ready for Implementation

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 65 |
| **Uses Existing Schema** | 56 tasks (86%) |
| **Needs New Tables** | 3 tables |
| **Needs New Columns** | 2 columns |
| **Estimated Duration** | 2-3 months (team of 3) |

---

## 🗄️ Database Schema Assessment

### ✅ Existing Tables (10 tables - SUFFICIENT for most features)

| Table | Tasks It Supports |
|-------|-------------------|
| `attendance_logs` | All attendance reports, break tracking, late arrivals, early exits |
| `users` | User management, verification, role-based reports |
| `classes` | Class reports, schedule views, room occupancy |
| `enrollments` | Student-class linking, enrollment verification |
| `session_exceptions` | Online/cancelled class tracking |
| `devices` | Kiosk management, heartbeat, room mapping |
| `facial_profiles` | Face recognition, enrollment quality |
| `departments` | Department-level aggregation |
| `programs` | Program-level aggregation |
| `subjects` | Subject-based reports |

### 🆕 New Tables Required (3 tables)

#### 1. `security_logs` (NEW)
**Purpose:** Track unrecognized face attempts, spoof detection, unauthorized access

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Unique identifier |
| `device_id` | Integer (FK) | → devices.id |
| `event_type` | Enum | `UNRECOGNIZED_FACE` / `GESTURE_FAILURE` / `SPOOF_ATTEMPT` |
| `embedding_data` | LargeBinary | Captured face (if unrecognized) |
| `confidence_score` | Float | Match confidence (if partial match) |
| `timestamp` | DateTime | When occurred |
| `room` | String(100) | Location |

**Supports Tasks:** #35, #47, #54, #55, #59, #60

---

#### 2. `audit_logs` (NEW)
**Purpose:** Track all administrative actions for accountability

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Unique identifier |
| `user_id` | Integer (FK) | → users.id (who performed action) |
| `action_type` | String(50) | `USER_CREATE` / `SCHEDULE_UPLOAD` / `EXPORT_DATA` / etc. |
| `target_table` | String(50) | Table affected |
| `target_id` | Integer | Record affected |
| `old_value` | JSON | Previous state |
| `new_value` | JSON | New state |
| `ip_address` | String(45) | Request IP |
| `timestamp` | DateTime | When occurred |

**Supports Tasks:** #58

---

#### 3. `system_metrics` (NEW - Optional)
**Purpose:** Track system performance for health dashboard

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Unique identifier |
| `device_id` | Integer (FK) | → devices.id |
| `metric_type` | String(50) | `RECOGNITION_LATENCY` / `ERROR_RATE` / `UPTIME` |
| `value` | Float | Metric value |
| `timestamp` | DateTime | When recorded |

**Supports Tasks:** #57, #65

---

### 🔧 New Columns Required (2 columns)

#### In `devices` table:
| Column | Type | Purpose |
|--------|------|---------|
| `room_capacity` | Integer | For overcrowding detection (Task #43, #51) |

#### In `attendance_logs` table:
| Column | Type | Purpose |
|--------|------|---------|
| `is_late` | Boolean | Pre-computed late flag for faster queries |

---

## 🎯 Focus Area 1: Hand Gesture Control
**All tasks use EXISTING schema**

| # | Task | Difficulty | Data Source | Logic |
|---|------|------------|-------------|-------|
| 1 | Gesture Constants & Types | Easy | N/A | Python/JS constants only |
| 2 | Gesture UI Prompt | Easy | N/A | Frontend component only |
| 3 | Gesture Feedback Display | Easy | N/A | Frontend component only |
| 4 | MediaPipe Hands Integration | Medium | N/A | Backend service only |
| 5 | Gesture Validation API | Medium | `attendance_logs.gesture_detected`, `attendance_logs.verified_by` | Validate gesture, log to existing columns |
| 6 | Gesture-Gated Flow | Medium | `attendance_logs` | Use existing `action` enum (BREAK_OUT/IN, EXIT) |

**📌 Key Insight:** The `attendance_logs` table already has `gesture_detected` and `verified_by` columns - perfect for gesture tracking!

---

## 📱 Focus Area 2: Raspberry Pi Kiosk Integration
**All tasks use EXISTING schema**

| # | Task | Difficulty | Data Source | Logic |
|---|------|------------|-------------|-------|
| 7 | Device Registration API | Easy | `devices` | INSERT new device record |
| 8 | Device Heartbeat API | Easy | `devices.last_heartbeat` | UPDATE heartbeat timestamp |
| 9 | Device Management Page | Easy | `devices` | CRUD operations on devices |
| 10 | Kiosk Fullscreen UI | Easy | N/A | Frontend only |
| 11 | Pi Camera Capture | Medium | N/A | Edge hardware module |
| 12 | TFLite Face Embedding | Medium | `facial_profiles.embedding` | Compare against stored embeddings |
| 13 | Edge-to-Server Sync | Medium | `facial_profiles`, `classes`, `enrollments` | Sync embeddings + schedules to Pi |
| 14 | Complete Kiosk Pipeline | Hard | All tables | Full edge recognition flow |

**📌 Key Insight:** The `devices` table already has all needed columns (room, ip_address, status, last_heartbeat).

---

## 📊 Focus Area 3: Student Reports
**All tasks use EXISTING schema**

| # | Task | Data Source | Query Logic |
|---|------|-------------|-------------|
| 15 | Daily Attendance | `attendance_logs` | Filter by `user_id`, `DATE(timestamp)`, `class_id` |
| 16 | Weekly Summary | `attendance_logs` | COUNT by action type, GROUP BY WEEK |
| 17 | 30-Day History | `attendance_logs` | WHERE timestamp > NOW() - 30 days |
| 18 | Monthly Trends | `attendance_logs` | Aggregate by month, chart over time |
| 19 | Semestral Per Subject | `attendance_logs` JOIN `classes` JOIN `subjects` | Filter by semester, academic_year |
| 20 | Late Arrival Report | `attendance_logs` | Compare `timestamp` with `classes.start_time` |
| 21 | Break Duration | `attendance_logs` | Calculate time between BREAK_OUT and BREAK_IN |
| 22 | Semestral Summary | All attendance tables | Aggregate all subjects for one student |
| 23 | Consistency Index (AI) | `attendance_logs` | ML model - analyze patterns |

**📌 SQL Pattern for Late Detection:**
```sql
SELECT * FROM attendance_logs al
JOIN classes c ON al.class_id = c.id
WHERE al.action = 'ENTRY' 
  AND TIME(al.timestamp) > c.start_time + INTERVAL '15 minutes'
```

---

## 📊 Focus Area 4: Faculty Reports
**All tasks use EXISTING schema**

| # | Task | Data Source | Query Logic |
|---|------|-------------|-------------|
| 24 | Faculty Personal Daily | `attendance_logs` | Filter by faculty user_id |
| 25 | Faculty Weekly Summary | `attendance_logs` | Same as student, different user |
| 26 | Class Daily Attendance | `attendance_logs` | Filter by class_id, faculty's classes |
| 27 | Absence Per Section | `attendance_logs`, `enrollments` | Find missing entries per enrolled student |
| 28 | Punctuality Index | `attendance_logs` | Rank by (timestamp - start_time) |
| 29 | Class Late Arrivals | `attendance_logs` | Same as #20, filter by class |
| 30 | Break Analysis | `attendance_logs` | BREAK_OUT/IN duration per student |
| 31 | Early Exits | `attendance_logs` | EXIT timestamp < class.end_time |
| 32 | Break Abuse | `attendance_logs` | BREAK_OUT without matching BREAK_IN |
| 33 | Attendance Inconsistency | `attendance_logs` | Has BREAK_OUT but no ENTRY same day |
| 34 | Class Consistency (AI) | `attendance_logs` | ML model |
| 35 | Unrecognized Logs | `security_logs` 🆕 | Query new table |

**📌 SQL Pattern for Break Abuse:**
```sql
SELECT * FROM attendance_logs al1
WHERE al1.action = 'BREAK_OUT'
AND NOT EXISTS (
  SELECT 1 FROM attendance_logs al2
  WHERE al2.user_id = al1.user_id
  AND al2.class_id = al1.class_id
  AND al2.action = 'BREAK_IN'
  AND al2.timestamp > al1.timestamp
)
```

---

## 📊 Focus Area 5: Department Head Reports
**Uses EXISTING schema + HEAD can see faculty in their department**

| # | Task | Data Source | Query Logic |
|---|------|-------------|-------------|
| 36 | Faculty Attendance Summary | `attendance_logs` JOIN `users` | WHERE users.department_id = HEAD's dept AND users.role = 'FACULTY' |
| 37 | Faculty Late Report | Same as #36 | Add late check |
| 38 | Room Occupancy | `attendance_logs` | COUNT users per room per hour |
| 39 | Peak Usage Hours | `attendance_logs` | GROUP BY HOUR(timestamp) |
| 40 | Utilization vs Schedule | `classes`, `attendance_logs` | Compare scheduled vs actual |
| 41 | Dept Activity Summary | All tables | Aggregate by department_id |
| 42 | Faculty Consistency | `attendance_logs` | Trend analysis per faculty |
| 43 | Overcrowding Alerts | `attendance_logs`, `devices.room_capacity` 🔧 | Count > capacity |

**📌 HEAD Department Filter:**
```sql
-- Get all faculty in HEAD's department
SELECT * FROM users 
WHERE role = 'FACULTY' 
AND department_id = (SELECT department_id FROM users WHERE id = :head_user_id)
```

---

## 📊 Focus Area 6: Admin Reports
**Mostly EXISTING schema**

| # | Task | Data Source | Query Logic |
|---|------|-------------|-------------|
| 44 | System-wide Summary | All tables | No filters, aggregate all |
| 45 | System Late/Early | `attendance_logs` | Same logic, no user filter |
| 46 | Occupancy Reports | `attendance_logs`, `devices` | Room-level aggregation |
| 47 | Recognized/Unrecognized | `attendance_logs`, `security_logs` 🆕 | Join both tables |
| 48 | System Break Abuse | `attendance_logs` | Same as #32, all users |
| 49 | Data Inconsistencies | `attendance_logs` | Cross-table validation |
| 50 | Room Insights | `attendance_logs` | Room-level analytics |
| 51 | Empty-but-Scheduled | `classes`, `attendance_logs` | Scheduled class with 0 attendance |
| 52 | CSV/Excel Export | All tables | Export utility |
| 53 | PDF Export | All tables | PDF generation |

---

## 🔒 Focus Area 7: Security Reports
**Needs NEW `security_logs` table**

| # | Task | Data Source | Query Logic |
|---|------|-------------|-------------|
| 54 | Unrecognized Face | `security_logs` 🆕 | event_type = 'UNRECOGNIZED_FACE' |
| 55 | Gesture Failures | `security_logs` 🆕 | event_type = 'GESTURE_FAILURE' |
| 56 | Gesture Frequency | `attendance_logs` | COUNT by gesture_detected |
| 57 | System Errors | `system_metrics` 🆕 | Optional table |
| 58 | Audit Log | `audit_logs` 🆕 | Admin action history |
| 59 | Spoof Detection | `security_logs` 🆕 | event_type = 'SPOOF_ATTEMPT' |
| 60 | Breach Patterns | `security_logs` 🆕 | Pattern analysis |

---

## 🛠️ Focus Area 8: System Improvements
**Mixed - mostly frontend**

| # | Task | Data Source | Logic |
|---|------|-------------|-------|
| 61 | Session Exceptions UI | `session_exceptions` | CRUD on existing table |
| 62 | Dark Mode | N/A | Frontend only (CSS/Context) |
| 63 | Offline Caching | `facial_profiles`, `enrollments` | Edge caching logic |
| 64 | Email Notifications | `users`, `attendance_logs` | Backend email service |
| 65 | System Health | `devices`, `system_metrics` 🆕 | Dashboard component |

---

## 📋 Migration Plan

### Phase 1: Create New Tables (Day 1)

```sql
-- 1. security_logs (required for security features)
CREATE TABLE security_logs (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    event_type VARCHAR(50) NOT NULL,
    embedding_data BYTEA,
    confidence_score FLOAT,
    timestamp TIMESTAMP DEFAULT NOW(),
    room VARCHAR(100)
);

-- 2. audit_logs (required for admin audit)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(50),
    target_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 3. Add room_capacity to devices
ALTER TABLE devices ADD COLUMN room_capacity INTEGER DEFAULT 40;
```

### Phase 2: Optional Tables (If needed)

```sql
-- system_metrics (optional - for system health dashboard)
CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    metric_type VARCHAR(50) NOT NULL,
    value FLOAT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Priority Implementation Order

### Sprint 1: Core Edge Features (Weeks 1-3)
1. ✅ Task #7 - Device Registration API
2. ✅ Task #8 - Device Heartbeat API
3. ✅ Task #11 - Pi Camera Module
4. ✅ Task #12 - TFLite Embedding
5. ✅ Tasks #1-6 - Gesture System
6. ✅ Task #14 - Complete Kiosk Pipeline

### Sprint 2: Student & Faculty Reports (Weeks 4-6)
7. ✅ Tasks #15-22 - Student Reports
8. ✅ Tasks #24-33 - Faculty Reports

### Sprint 3: HEAD & Admin Reports (Weeks 7-9)
9. ✅ Tasks #36-43 - Dept Head Reports
10. ✅ Tasks #44-53 - Admin Reports
11. ✅ Task #52-53 - Export functionality

### Sprint 4: Security & Polish (Weeks 10-12)
12. ✅ Create `security_logs` table
13. ✅ Tasks #54-60 - Security Reports
14. ✅ Tasks #61-65 - System Improvements

---

## 📊 Quick Reference: Data Source per Report

| Report Category | Primary Table | Supporting Tables |
|-----------------|---------------|-------------------|
| Daily/Weekly/Monthly | `attendance_logs` | `classes`, `users` |
| Late Arrivals | `attendance_logs` | `classes` (for start_time) |
| Break Tracking | `attendance_logs` | - (self-join for duration) |
| Early Exits | `attendance_logs` | `classes` (for end_time) |
| Room Occupancy | `attendance_logs` | `devices` |
| Unrecognized Users | `security_logs` 🆕 | `devices` |
| System Audit | `audit_logs` 🆕 | `users` |
| Faculty Overview | `attendance_logs` | `users` (filter by role & dept) |
| Session Exceptions | `session_exceptions` | `classes` |

---

**Document generated:** February 8, 2026  
**Database reference:** [database_analysis.md](file:///c:/Users/Emmanuel/Documents/OURCAPSTONE/Capstoneee/documentation/database/database_analysis.md)
