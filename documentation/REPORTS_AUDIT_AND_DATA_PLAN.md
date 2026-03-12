# FRAMES Reports Audit & Attendance Data Utilization Plan

> Generated: 2026-03-12
> Purpose: (1) Audit all documented reports against actual implementations, (2) Plan how attendance_logs data powers each report and chart

---

## PART 1: REPORT IMPLEMENTATION AUDIT

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented (frontend + backend) |
| ⚠️ | Partially implemented (exists but reuses another report's logic / missing dedicated backend) |
| ❌ | Not implemented |

---

### 1.1 Student Module — 9 Documented Reports

| # | Documented Report | Status | Implementation Notes |
|---|---|---|---|
| 1 | Daily Attendance per Subject | ✅ | `DAILY_REPORT` in `AttendanceHistoryPage.jsx` — filters attendance_logs by date + maps to enrolled classes via schedule matching |
| 2 | Weekly Attendance Summary | ✅ | `WEEKLY_SUMMARY` in `AttendanceHistoryPage.jsx` — groups logs by week and shows present/absent/late counts |
| 3 | Monthly Attendance Trends | ❌ | **MISSING** — Not in the student report type dropdown. The dashboard has a chart (`AttendanceTrendChart` with Monthly filter), but there is NO dedicated PDF/CSV report for monthly trends. The faculty module has `PERSONAL_MONTHLY` but the student `AttendanceHistoryPage.jsx` only lists 8 types, none called "monthly trends." |
| 4 | Semestral Report (Per Subject) | ✅ | `SEM_REPORT` in `AttendanceHistoryPage.jsx` — full semester data filtered per subject |
| 5 | Overall Semestral Summary | ✅ | `OVERALL_SEM` in `AttendanceHistoryPage.jsx` — all subjects combined for the semester |
| 6 | Attendance History Log (30 Days) | ✅ | `HISTORY_30D` in `AttendanceHistoryPage.jsx` — last 30 days of raw timestamps |
| 7 | Personal Late Arrival Report | ✅ | `LATE_REPORT` in `AttendanceHistoryPage.jsx` — filters where `is_late = TRUE` |
| 8 | Break Duration Log | ✅ | `BREAK_LOG` in `AttendanceHistoryPage.jsx` — filters `action IN (BREAK_OUT, BREAK_IN)` |
| 9 | Personal Consistency Index | ✅ | `CONSISTENCY` in `AttendanceHistoryPage.jsx` — AI-generated metric from attendance regularity (currently uses simple aggregation, not ML) |

**Student Dashboard Charts (separate from reports):**
- ✅ `AttendanceTrendChart` — SVG line/area chart with Weekly/Monthly/Semestral + type filters (Present/Break/Absent)
- ✅ Summary cards: Attendance Rate, Enrolled Courses, Punctuality Rate
- ✅ Recent Attendance List with status tags
- ✅ Live Status Card (real-time class detection)

**Student Gap:** Report #3 (Monthly Attendance Trends) has a chart on the dashboard but no standalone downloadable PDF/CSV report.

---

### 1.2 Faculty Module — 22 Documented Reports

#### Personal Attendance Records (8 documented)

| # | Documented Report | Status | Implementation Notes |
|---|---|---|---|
| 1 | Daily Attendance per Subject | ✅ | `PERSONAL_DAILY` → `_personal_attendance_report()` in `report_service.py` |
| 2 | Weekly Attendance Summary | ✅ | `PERSONAL_WEEKLY` → same function, date range = 7 days |
| 3 | Monthly Attendance Trends | ✅ | `PERSONAL_MONTHLY` → same function, date range = 1 month |
| 4 | Semestral Report (Per Subject) | ✅ | `PERSONAL_SEMESTER` → `_personal_semester_report()` — aggregated entries/lates per class |
| 5 | Overall Semestral Summary | ⚠️ | **Merged into #4** — `PERSONAL_SEMESTER` covers all subjects. No visually separate "overall" vs "per subject" distinction in the UI. The documentation lists them as separate, but they share one implementation. |
| 6 | Attendance History Log (30 Days) | ⚠️ | **Mapped to `PERSONAL_DAILY`** — the backend doesn't enforce 30-day hard cap; it's the same query with date filters. The frontend `FacultyReportsPage.jsx` lists "Attendance History Log (30 Days)" as a report type but it calls the same `_personal_attendance_report`. |
| 7 | Personal Late Arrival Report (Instructor Start Delay) | ✅ | `INSTRUCTOR_DELAY` → `_instructor_delay_report()` — filters `action=ENTRY AND is_late=TRUE` for the faculty user |
| 8 | Personal Consistency Index | ⚠️ | `PERSONAL_CONSISTENCY` → reuses `_personal_semester_report()`. Not a true AI/ML metric, just aggregate "Good"/"Warning" based on late count. |

#### Class-Specific Reports (14 documented)

| # | Documented Report | Status | Implementation Notes |
|---|---|---|---|
| 1 | Daily Attendance per Subject | ✅ | `CLASS_DAILY` → `_class_daily_report()` — all logs for a class in date range |
| 2 | Monthly Attendance Trends | ✅ | `CLASS_MONTHLY` → reuses `_class_semester_report()` with monthly date range |
| 3 | Semestral Report (Per Subject) | ✅ | `CLASS_SEMESTER` → `_class_semester_report()` — per-student aggregate |
| 4 | Overall Semestral Summary | ⚠️ | **Same as #3** — no separate "overall" aggregation across multiple classes. The UI just runs `CLASS_SEMESTER` for the selected class. |
| 5 | Late Arrival Report | ✅ | `CLASS_LATE` → `_class_late_report()` — `is_late=TRUE AND action=ENTRY` for enrolled students |
| 6 | Personal Consistency Index (class) | ⚠️ | `PARTICIPATION_INSIGHT` → reuses `_class_semester_report()`. Not truly AI-computed. Uses same "Good/Warning/Present" logic. |
| 7 | Absence Summaries per Section | ✅ | `CLASS_ABSENCE` → `_class_absence_report()` — enrolled students with zero ENTRY logs in range |
| 8 | Break Duration Analysis | ✅ | `BREAK_DURATION` → `_break_duration_report()` — filters `action IN (BREAK_OUT, BREAK_IN)` |
| 9 | Punctuality Index per Section | ⚠️ | **Not a dedicated report** — The documented "ranking students by time-in differentials" is NOT implemented as a standalone computation. `CLASS_LATE` shows late students but doesn't rank or compute a time differential index. Listed in the UI dropdown as "Punctuality Index per Section" but the backend falls through to `_class_daily_report()`. |
| 10 | Unrecognized Individual Logs | ⚠️ | `UNRECOGNIZED_LOGS` → **Reuses `_class_daily_report()`** — Does NOT filter for unknown/unrecognized faces. Would need `confidence_score < threshold` filter or a separate "unrecognized" flag. Currently just shows all logs for the class. |
| 11 | Early Exits Report | ✅ | `EARLY_EXITS` → `_early_exits_report()` — filters `action=EXIT` |
| 12 | Break Abuse / Extended Break Report | ⚠️ | **Partially covered by `BREAK_DURATION`** — shows break events but does NOT compute break duration (BREAK_OUT to BREAK_IN delta) or flag "extended" breaks. No threshold enforcement. |
| 13 | Missed Attendance but Present in BreakLogs | ⚠️ | `ATTENDANCE_INCONSISTENCY` → **Reuses `_class_daily_report()`** — Does NOT detect the specific inconsistency (students who have BREAK_OUT/BREAK_IN but no ENTRY). Would need a set-difference query. |
| 14 | Class Participation Consistency Insight | ⚠️ | `PARTICIPATION_INSIGHT` → reuses `_class_semester_report()`. Shows entries/lates per student but NOT "AI-computed stability index showing class engagement trends across sessions." |

---

### 1.3 Department Head Module — 30 Documented Reports

#### Personal Attendance Records (8 documented) — Same as Faculty Personal

| # | Documented Report | Status | Notes |
|---|---|---|---|
| 1-8 | (Same 8 as Faculty Personal) | ✅/⚠️ | Same implementation via shared `/api/faculty/reports/data/{user_id}` endpoint. See Faculty section above. |

#### Class-Specific Reports (14 documented) — Same as Faculty Class

| # | Documented Report | Status | Notes |
|---|---|---|---|
| 1-14 | (Same 14 as Faculty Class) | ✅/⚠️ | Same implementation. Dept Head accesses their own classes via the same Faculty report API. |

#### Faculty-Specific Reports (8 documented) — Dept Head Exclusive

| # | Documented Report | Status | Implementation Notes |
|---|---|---|---|
| 1 | Faculty Attendance Summary | ✅ | `FACULTY_SUMMARY` → `_faculty_summary_report()` — all verified faculty in department with entry/late counts |
| 2 | Faculty Late Arrival Report | ✅ | `FACULTY_LATE` → `_faculty_late_report()` — faculty with `is_late=TRUE` entries, optionally filtered by room |
| 3 | Room Occupancy Trends | ✅ | `ROOM_OCCUPANCY` → `_room_occupancy_report()` — ENTRY counts per room in date range |
| 4 | Peak Usage Hours | ⚠️ | `PEAK_USAGE` → **Reuses `_room_occupancy_report()`** — does NOT break down by hour/time-of-day. Just shows total entry count per room, not peak times. |
| 5 | Room Utilization vs. Schedule | ⚠️ | `ROOM_UTILIZATION` → **Reuses `_room_occupancy_report()`** — does NOT compare actual attendance against scheduled class hours. Just total entries per room. |
| 6 | Overcrowding Alerts Report | ⚠️ | `OVERCROWDING` → **Reuses `_room_occupancy_report()`** — Devices have `room_capacity` field but the report does NOT compare entry count against capacity to flag overcrowding. |
| 7 | Department Activity Summary | ✅ | `DEPT_ACTIVITY` → `_dept_activity_report()` — entry counts grouped by role (STUDENT/FACULTY/HEAD) |
| 8 | Faculty Consistency Index | ⚠️ | `FACULTY_CONSISTENCY` → **Reuses `_faculty_summary_report()`** — Same data as Faculty Summary. Not a trend/semester-over-semester comparison. |

**Department Head Dashboard Charts:**
- ✅ Attendance trends chart with Department/Faculty/Personal/Classroom view modes
- ✅ Weekly/Monthly/Semestral time filters
- ✅ Interactive SVG charts with hover tooltips

---

### 1.4 AUDIT SUMMARY

| Module | Documented | ✅ Full | ⚠️ Partial | ❌ Missing | Coverage |
|--------|-----------|---------|------------|-----------|----------|
| **Student** | 9 | 8 | 0 | 1 | 89% |
| **Faculty Personal** | 8 | 4 | 4 | 0 | 50% full, 100% present |
| **Faculty Class** | 14 | 6 | 8 | 0 | 43% full, 100% present |
| **Dept Head Exclusive** | 8 | 3 | 5 | 0 | 38% full, 100% present |
| **TOTAL** | 39* | 21 | 17 | 1 | 54% full, 97% present |

*\*Unique reports = 39 (student 9 + faculty personal 8 + faculty class 14 + dept head exclusive 8). Dept Head inherits 22 from faculty.*

---

### 1.5 KEY GAPS TO ADDRESS

#### Priority 1: Reports that exist in UI but have wrong/reused backend logic

| Report | Current Backend | What It SHOULD Do |
|--------|----------------|-------------------|
| **Punctuality Index per Section** | Falls through to `_class_daily_report` | Compute time differential: `timestamp - class.start_time` per student, average that, rank students. Display: Student \| Avg Delay (min) \| Rank \| Score |
| **Unrecognized Individual Logs** | Shows all class logs | Filter for `confidence_score < 0.5` OR logs where user_id doesn't match any enrolled student. Requires kiosk to log unrecognized faces. |
| **Break Abuse / Extended Break** | Shows raw BREAK events | Pair BREAK_OUT→BREAK_IN timestamps, calculate duration, flag where duration > threshold (e.g., 15 min). Display: Student \| Break Start \| Break End \| Duration \| Status (Normal/Extended) |
| **Missed Attendance but Present in BreakLogs** | Shows all class logs | Set operation: students who have BREAK_OUT or BREAK_IN but NO ENTRY on the same day. Display: Student \| Break Events \| Missing ENTRY Date |
| **Peak Usage Hours** | Room entry totals | Group entries by hour-of-day: `EXTRACT(HOUR FROM timestamp)`, show count per hour per room. Display: Room \| Hour \| Entry Count \| Peak Flag |
| **Room Utilization vs. Schedule** | Room entry totals | Compare `COUNT(ENTRY logs)` against `COUNT(scheduled class sessions)` per room. Display: Room \| Scheduled Sessions \| Actual Usage \| Utilization % |
| **Overcrowding Alerts** | Room entry totals | Compare concurrent entries against `device.room_capacity`. Display: Room \| Max Concurrent \| Capacity \| Alert (Yes/No) |

#### Priority 2: AI/Consistency reports that need real computation

| Report | Current Logic | What It SHOULD Do |
|--------|--------------|-------------------|
| **Personal Consistency Index** (all modules) | "Good" if lates=0, "Warning" if lates>2 | Compute: (days_attended / total_class_days) ratio, variance of attendance gaps, trend slope (improving/declining). Return a 0-100 score. |
| **Class Participation Consistency Insight** | Same as semester report | Compute per-session attendance rate, standard deviation across sessions, trend direction. Return per-student stability score. |
| **Faculty Consistency Index** | Same as faculty summary | Compute cross-semester attendance trend, identify patterns (e.g., "absent every Monday"). |

#### Priority 3: Missing student report

| Report | What to Implement |
|--------|-------------------|
| **Student Monthly Attendance Trends** (report #3) | Add `MONTHLY_TRENDS` to student `AttendanceHistoryPage.jsx` report types. Group logs by month, show Present/Late/Absent counts per month. Generate as PDF table + optional trend line. |

---

---

## PART 2: ATTENDANCE_LOGS DATA UTILIZATION PLAN

### 2.1 Table Schema Reference

```sql
CREATE TABLE attendance_logs (
  id            serial4 PRIMARY KEY,
  user_id       int4 NOT NULL,          -- FK → users.id
  class_id      int4,                    -- FK → classes.id
  device_id     int4,                    -- FK → devices.id
  action        attendanceaction NOT NULL, -- ENTRY | BREAK_OUT | BREAK_IN | EXIT
  verified_by   verifiedby,              -- FACE | FACE+GESTURE
  confidence_score float8,               -- 0.0 to 1.0
  gesture_detected varchar(50),          -- PEACE_SIGN | THUMBS_UP | OPEN_PALM | null
  timestamp     timestamp,               -- UTC when logged
  remarks       varchar(255),            -- human-readable notes
  is_late       bool DEFAULT false       -- computed at log time
);
```

### 2.2 Column-to-Report Mapping Matrix

This matrix shows exactly which columns from `attendance_logs` are needed by each report.

| Column | Student Reports | Faculty Personal | Faculty Class | Dept Head |
|--------|----------------|-----------------|---------------|-----------|
| `user_id` | All (filter=self) | All (filter=self) | All (join to student names) | All (join to faculty/student) |
| `class_id` | All (map to subject) | All (join to subject) | All (filter=selected class) | All (join for room/dept scope) |
| `action` | All (determine status) | All (determine status) | All (core filter per report type) | All (ENTRY counts for room analytics) |
| `timestamp` | All (date range, time display) | All (date range, time) | All (date range, hour extraction) | All (date range, peak hour calc) |
| `is_late` | Late Report, Summary cards | Instructor Delay, Semester | Late Report, Absence calc | Faculty Late, Faculty Summary |
| `confidence_score` | *(unused)* | *(unused)* | Unrecognized Logs (need <0.5 filter) | System Logs (ERROR if <0.5) |
| `verified_by` | *(unused)* | *(unused)* | *(unused — potential enhancement)* | *(unused)* |
| `gesture_detected` | *(unused)* | *(unused)* | *(unused — potential enhancement)* | *(unused)* |
| `remarks` | All (display column) | All (display column) | All (display column) | All (display column) |
| `device_id` | *(unused)* | *(unused)* | *(unused)* | System Logs (device source name) |

### 2.3 Data Flow Per Report Category

#### A. Daily / History Reports (simplest pattern)

```
Query: SELECT * FROM attendance_logs
       WHERE user_id = :uid AND class_id = :cid
         AND timestamp BETWEEN :from AND :to
       ORDER BY timestamp DESC
       LIMIT 500

Joins: users (name, tupm_id), classes → subjects (code, title), classes (room)

Output columns: Date | Subject/Room | Status | Time | Remarks

Status derivation:
  - action = 'ENTRY' AND is_late = TRUE  → "LATE"
  - action = 'ENTRY' AND is_late = FALSE → "PRESENT" or "ENTRY"
  - action = 'BREAK_OUT'                 → "BREAK_OUT"
  - action = 'BREAK_IN'                  → "BREAK_IN"
  - action = 'EXIT'                      → "EXIT"
```

Reports using this pattern:
- Student: Daily, Weekly, 30-Day History
- Faculty Personal: Daily, Weekly, Monthly
- Faculty Class: Daily Attendance

---

#### B. Aggregate / Summary Reports (GROUP BY pattern)

```
Query 1 — Total entries:
  SELECT user_id, COUNT(*) as entries
  FROM attendance_logs
  WHERE class_id = :cid AND action = 'ENTRY'
    AND timestamp BETWEEN :from AND :to
  GROUP BY user_id

Query 2 — Late entries:
  SELECT user_id, COUNT(*) as lates
  FROM attendance_logs
  WHERE class_id = :cid AND action = 'ENTRY' AND is_late = TRUE
    AND timestamp BETWEEN :from AND :to
  GROUP BY user_id

Python merge: entries_by_user + lates_by_user → row per student

Output columns: Student | Entries | Status | On-time/Late | ID

Status derivation:
  - entries > 0 AND lates = 0   → "Good"
  - lates > 2                    → "Warning"
  - entries = 0                  → "No Data"
  - else                         → "Present"
```

Reports using this pattern:
- Faculty Class: Monthly, Semester, Participation Insight
- Faculty Personal: Semester Summary, Consistency Index
- Dept Head: Faculty Summary, Faculty Consistency

---

#### C. Absence Detection (Set Difference pattern)

```
Step 1: Get all enrolled students for class_id
  SELECT student_id FROM enrollments WHERE class_id = :cid

Step 2: Get students who had ENTRY in date range
  SELECT DISTINCT user_id FROM attendance_logs
  WHERE class_id = :cid AND action = 'ENTRY'
    AND timestamp BETWEEN :from AND :to

Step 3: Absent = Step 1 - Step 2 (Python set difference)

Output: Student | ID | Status=ABSENT | "No entry recorded" | Enrollment note
```

Reports using this pattern:
- Faculty Class: Absence Summary per Section
- Dept Head Class: Same

---

#### D. Filtered Action Reports (specific action filter)

```
Late students:
  WHERE class_id = :cid AND action = 'ENTRY' AND is_late = TRUE

Break activities:
  WHERE class_id = :cid AND action IN ('BREAK_OUT', 'BREAK_IN')

Early exits:
  WHERE class_id = :cid AND action = 'EXIT'

Instructor late arrivals:
  WHERE user_id = :faculty_id AND action = 'ENTRY' AND is_late = TRUE
```

Reports using this pattern:
- Faculty Class: Late Report, Break Duration, Early Exits
- Faculty Personal: Instructor Delay
- Dept Head: Faculty Late Arrivals

---

#### E. Room Analytics (JOIN classes + GROUP BY room)

```
Room occupancy:
  SELECT c.room, COUNT(al.id) as entries
  FROM attendance_logs al
  JOIN classes c ON al.class_id = c.id
  WHERE al.action = 'ENTRY'
    AND al.timestamp BETWEEN :from AND :to
    AND c.faculty_id IN (SELECT id FROM users WHERE department_id = :dept_id)
  GROUP BY c.room

Peak hours (NEEDED — currently not implemented):
  SELECT c.room, EXTRACT(HOUR FROM al.timestamp) as hour, COUNT(*) as count
  FROM attendance_logs al
  JOIN classes c ON al.class_id = c.id
  WHERE al.action = 'ENTRY'
    AND al.timestamp BETWEEN :from AND :to
  GROUP BY c.room, hour
  ORDER BY count DESC

Room utilization (NEEDED — currently not implemented):
  -- Scheduled sessions count
  SELECT c.room, COUNT(DISTINCT DATE(al.timestamp)) as actual_days
  FROM attendance_logs al
  JOIN classes c ON al.class_id = c.id
  WHERE al.action = 'ENTRY'
  GROUP BY c.room

  -- Compare against expected days from class.day_of_week in date range
```

Reports using this pattern:
- Dept Head: Room Occupancy, Peak Usage, Room Utilization, Overcrowding

---

#### F. Department Activity (GROUP BY role)

```
  SELECT u.role, COUNT(al.id) as entries
  FROM attendance_logs al
  JOIN users u ON al.user_id = u.id
  WHERE u.department_id = :dept_id
    AND al.action = 'ENTRY'
    AND al.timestamp BETWEEN :from AND :to
  GROUP BY u.role
```

Reports using this pattern:
- Dept Head: Department Activity Summary

---

### 2.4 NEW Computations Needed (Using Existing Columns)

These are the computations that are documented but NOT yet implemented in `report_service.py`. All can be derived from existing `attendance_logs` columns:

#### 2.4.1 Punctuality Index (time differential ranking)

```sql
-- For each student's ENTRY in a class, compute minutes late
SELECT
  u.id as user_id,
  u.first_name || ' ' || u.last_name as name,
  AVG(EXTRACT(EPOCH FROM (al.timestamp - (DATE(al.timestamp) + c.start_time))) / 60) as avg_arrival_offset_min,
  COUNT(*) as total_entries
FROM attendance_logs al
JOIN users u ON al.user_id = u.id
JOIN classes c ON al.class_id = c.id
WHERE al.class_id = :class_id
  AND al.action = 'ENTRY'
  AND al.timestamp BETWEEN :from AND :to
GROUP BY u.id, name
ORDER BY avg_arrival_offset_min ASC;

-- Score: 100 - (avg_arrival_offset_min * 2), capped at 0-100
-- Rank by score descending
```

**Columns used:** `timestamp`, `class_id` → `classes.start_time`, `user_id`, `action`

---

#### 2.4.2 Break Duration Analysis (BREAK_OUT → BREAK_IN pairing)

```python
# Python logic (faster than SQL for pairing)
breaks = db.query(AttendanceLog).filter(
    AttendanceLog.class_id == class_id,
    AttendanceLog.action.in_([AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN]),
    AttendanceLog.timestamp.between(date_from, date_to)
).order_by(AttendanceLog.user_id, AttendanceLog.timestamp).all()

# Pair consecutive BREAK_OUT → BREAK_IN per user
for user_id, user_breaks in groupby(breaks, key=lambda b: b.user_id):
    stack = []
    for b in user_breaks:
        if b.action == AttendanceAction.BREAK_OUT:
            stack.append(b)
        elif b.action == AttendanceAction.BREAK_IN and stack:
            out_event = stack.pop()
            duration_min = (b.timestamp - out_event.timestamp).total_seconds() / 60
            # Flag: duration > 15 min → "Extended", else "Normal"
```

**Columns used:** `user_id`, `class_id`, `action`, `timestamp`

---

#### 2.4.3 Attendance Inconsistency Detection

```sql
-- Students who have BREAK events but no ENTRY on the same day
WITH break_users AS (
  SELECT DISTINCT user_id, DATE(timestamp) as break_date
  FROM attendance_logs
  WHERE class_id = :class_id
    AND action IN ('BREAK_OUT', 'BREAK_IN')
    AND timestamp BETWEEN :from AND :to
),
entry_users AS (
  SELECT DISTINCT user_id, DATE(timestamp) as entry_date
  FROM attendance_logs
  WHERE class_id = :class_id
    AND action = 'ENTRY'
    AND timestamp BETWEEN :from AND :to
)
SELECT bu.user_id, bu.break_date
FROM break_users bu
LEFT JOIN entry_users eu ON bu.user_id = eu.user_id AND bu.break_date = eu.entry_date
WHERE eu.entry_date IS NULL;
```

**Columns used:** `user_id`, `class_id`, `action`, `timestamp`

---

#### 2.4.4 Peak Usage Hours

```sql
SELECT
  c.room,
  EXTRACT(HOUR FROM al.timestamp) as hour_of_day,
  COUNT(*) as entry_count
FROM attendance_logs al
JOIN classes c ON al.class_id = c.id
JOIN users u ON c.faculty_id = u.id
WHERE al.action = 'ENTRY'
  AND u.department_id = :dept_id
  AND al.timestamp BETWEEN :from AND :to
GROUP BY c.room, hour_of_day
ORDER BY c.room, entry_count DESC;
```

**Columns used:** `class_id` → `classes.room`, `timestamp`, `action`

---

#### 2.4.5 Overcrowding Detection

```sql
-- Count concurrent people in room at any point
-- Simplified: max entries per room per day vs capacity
SELECT
  c.room,
  DATE(al.timestamp) as day,
  COUNT(CASE WHEN al.action = 'ENTRY' THEN 1 END) as entries,
  COUNT(CASE WHEN al.action = 'EXIT' THEN 1 END) as exits,
  d.room_capacity
FROM attendance_logs al
JOIN classes c ON al.class_id = c.id
JOIN devices d ON d.room = c.room
WHERE al.timestamp BETWEEN :from AND :to
GROUP BY c.room, day, d.room_capacity
HAVING COUNT(CASE WHEN al.action = 'ENTRY' THEN 1 END) > d.room_capacity;
```

**Columns used:** `class_id` → `classes.room`, `action`, `timestamp`, `devices.room_capacity`

---

#### 2.4.6 Consistency Index (0-100 score)

```python
# For a student or faculty member:
def compute_consistency_index(user_id, class_ids, date_from, date_to, db):
    """
    Score from 0-100 based on:
    - attendance_ratio (40%): days attended / expected class days
    - punctuality (30%): on-time entries / total entries
    - regularity (30%): 1 - (std_dev of gaps between attendances / expected_gap)
    """
    # Expected class days: count occurrences of class.day_of_week in date range
    # Actual attended: count DISTINCT dates with ENTRY per class
    # Late ratio: count(is_late=TRUE) / count(ENTRY)
    # Gap regularity: std deviation of days between consecutive attendances

    attendance_ratio = actual_attended / expected_days  # 0-1
    punctuality = on_time_entries / total_entries         # 0-1
    gap_std = std_dev(gaps_between_attendances)
    expected_gap = 7  # weekly class
    regularity = max(0, 1 - (gap_std / expected_gap))    # 0-1

    score = (attendance_ratio * 40) + (punctuality * 30) + (regularity * 30)
    return round(score, 1)
```

**Columns used:** `user_id`, `class_id`, `action`, `timestamp`, `is_late`

---

### 2.5 Chart Data Derivation From attendance_logs

#### Student Dashboard Charts

| Chart | Query Pattern | X-Axis | Y-Axis | Series |
|-------|--------------|--------|--------|--------|
| Attendance Trend (Weekly) | Group by `DATE_TRUNC('week', timestamp)`, count by action type | Week labels | Count | Present (ENTRY), Break (BREAK_OUT), Absent (enrolled − ENTRY days) |
| Attendance Trend (Monthly) | Group by `DATE_TRUNC('month', timestamp)` | Month labels | Count | Same 3 series |
| Attendance Trend (Semestral) | Group by month across full semester | Month labels | Count | Same 3 series |
| Punctuality Rate | `COUNT(ENTRY AND is_late=FALSE) / COUNT(ENTRY) * 100` | N/A | Percentage | Single value |
| Attendance Rate | `COUNT(DISTINCT ENTRY dates) / expected_class_dates * 100` | N/A | Percentage | Single value |

#### Department Head Dashboard Charts

| Chart | Query Pattern | X-Axis | Y-Axis | Series |
|-------|--------------|--------|--------|--------|
| Department View | Group by week/month, count ENTRY for all dept users | Time period | Count | Single line |
| Faculty View | Group by week/month, count ENTRY for role=FACULTY in dept | Time period | Count | Per-faculty lines |
| Personal View | Group by week/month, count ENTRY for current user | Time period | Count | Single line |
| Classroom View | Group by week/month, count ENTRY per room | Time period | Count | Per-room lines |

---

### 2.6 Unused Columns — Enhancement Opportunities

| Column | Current Usage | Potential Report Enhancement |
|--------|-------------|------------------------------|
| `verified_by` | Stored only | **Verification Method Report** — Show FACE vs FACE+GESTURE distribution. Useful for security auditing. "X% of entries verified by gesture." |
| `gesture_detected` | Stored only | **Gesture Usage Report** — Distribution of PEACE_SIGN/THUMBS_UP/OPEN_PALM across breaks/exits. Useful for system reliability metrics. |
| `confidence_score` | System Logs only (ERROR if <0.5) | **Recognition Quality Report** — Average confidence per student, flag students consistently low. Useful for re-enrollment recommendations. |
| `device_id` | System Logs source | **Per-Device Report** — Attendance logged per device, device reliability metrics. Already partially in system logs. |

---

### 2.7 Data Requirements for Complete Report Coverage

To generate ALL 39 documented reports plus charts, the `attendance_logs` table needs:

**Minimum data requirements for a meaningful demo:**
- At least **3 months** of data (Jan 19, 2026 → Mar 12, 2026 = semester so far)
- Both classes (ID 3 and 4) must have logs on their scheduled days
- Multiple students must have logs (not just user_id 1 and 3)
- Mix of on-time and late entries (for punctuality reports)
- Mix of BREAK_OUT/BREAK_IN pairs (for break duration reports)
- Some EXIT events (for early exit reports)
- Some students with zero attendance (for absence reports)
- Faculty (user_id 1 = HEAD, user_id 2 = FACULTY) must have ENTRY logs (for dept head reports)
- Varying confidence scores (some <0.5 for system logs)
- Mix of verified_by values (for future enhancement)

**Current data: 32 attendance_logs — insufficient for meaningful reports.**
**Target: ~4,000-6,000 logs covering 3 months.**

---

## PART 3: IMPLEMENTATION PRIORITY

### Phase 1 — Data Seeding (Prerequisite)
1. Create seed migration script with 3 months of realistic attendance data
2. Create rollback script to remove seeded data

### Phase 2 — Fix Partial Reports (Backend-only changes in `report_service.py`)
1. Implement `_punctuality_index_report()` — new function
2. Implement `_break_abuse_report()` — new function with duration calculation
3. Implement `_attendance_inconsistency_report()` — new function with set difference
4. Implement `_peak_usage_report()` — new function with hour grouping
5. Implement `_room_utilization_report()` — new function comparing actual vs scheduled
6. Implement `_overcrowding_report()` — new function comparing entries vs capacity
7. Implement `_consistency_index()` — shared utility for 0-100 scoring

### Phase 3 — Add Missing Student Report
1. Add `MONTHLY_TRENDS` to `AttendanceHistoryPage.jsx` report types

### Phase 4 — Enhancement (Optional)
1. Add verification method distribution report
2. Add gesture usage report
3. Add recognition quality report
