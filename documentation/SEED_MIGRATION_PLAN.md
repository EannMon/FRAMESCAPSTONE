# FRAMES Attendance Seed Migration Plan

> Generated: 2026-03-12
> Purpose: Detailed plan for seeding 3 months of realistic attendance_logs data and rollback

---

## 1. EXISTING DATABASE CONTEXT

### Classes

| Class ID | Subject | Faculty | Day | Time | Room | Section | Students |
|----------|---------|---------|-----|------|------|---------|----------|
| 3 | CC303-M (Methods of Research in Computing) | User 1 (HEAD - Emmanuel Lungay) | Saturday | 18:50–22:00 | Room 328 | BSIT-3A-M | 44 (IDs 52–95) |
| 4 | IT232-M (Computer Architecture & Org, Lec) | User 1 (HEAD - Emmanuel Lungay) | Wednesday | 13:30–16:00 | Room 328 | BSIT-2B-M | 49 (IDs 3–51) |

### Users Available

| Role | Count | ID Range | Notes |
|------|-------|----------|-------|
| HEAD | 1 | ID 1 | Emmanuel Lungay — teaches both classes |
| FACULTY | 1 | ID 2 | Jericho Del Socorro — no classes assigned, but should have attendance if dept head reports are to show faculty data |
| STUDENTS (BSIT-3A-M) | 44 | IDs 52–95 | Enrolled in Class 3 |
| STUDENTS (BSIT-2B-M) | 49 | IDs 3–51 | Enrolled in Class 4 |

### Devices

| Device ID | Room | Name | Capacity |
|-----------|------|------|----------|
| 1 | Room 328 | RPI-328 | 50 |

### Semester

- **Academic Year:** 2025-2026
- **Semester:** 2nd Semester
- **Start Date:** 2026-01-19 (Monday)
- **End Date:** 2026-06-27
- **Seed Window:** Jan 19 → Mar 12 (current date) = ~8 weeks

---

## 2. DATE CALCULATION

### Class 3 — Saturdays (18:50–22:00)

```
Jan: 24, 31
Feb: 7, 14, 21, 28
Mar: 7
Total: 7 Saturdays
```

### Class 4 — Wednesdays (13:30–16:00)

```
Jan: 22, 29
Feb: 5, 12, 19, 26
Mar: 5, 12
Total: 8 Wednesdays
```

**Total class sessions: 15**

---

## 3. SEED DATA DESIGN

### 3.1 Student Attendance Behavior Profiles

To make reports meaningful, students should NOT all have identical patterns. We define 5 behavior profiles and distribute students across them:

| Profile | % of Students | Attendance Rate | Late Rate | Break Usage | Early Exit | Description |
|---------|--------------|-----------------|-----------|-------------|------------|-------------|
| **Excellent** | 25% | 95-100% | 0-5% | Low (0-1 breaks) | Never | Model students, always on time |
| **Good** | 30% | 80-90% | 10-15% | Moderate (1-2 breaks) | Rare (5%) | Generally reliable |
| **Average** | 25% | 65-80% | 20-30% | Moderate (1-2 breaks) | Occasional (10%) | Some absences |
| **At Risk** | 15% | 40-65% | 30-40% | High (2-3 breaks) | Frequent (20%) | Frequently absent/late |
| **Chronic** | 5% | 10-30% | 50%+ | High (3+ breaks) | Frequent (30%) | Rarely attends, often late |

#### Distribution for Class 3 (44 students)

| Profile | Count | Student IDs (from enrolled list) |
|---------|-------|--------------------------------|
| Excellent | 11 | 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62 |
| Good | 13 | 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75 |
| Average | 11 | 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86 |
| At Risk | 7 | 87, 88, 89, 90, 91, 92, 93 |
| Chronic | 2 | 94, 95 |

#### Distribution for Class 4 (49 students)

| Profile | Count | Student IDs (from enrolled list) |
|---------|-------|--------------------------------|
| Excellent | 12 | 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 |
| Good | 15 | 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29 |
| Average | 12 | 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41 |
| At Risk | 7 | 42, 43, 44, 45, 46, 47, 48 |
| Chronic | 3 | 49, 50, 51 |

---

### 3.2 Attendance Log Generation Rules

For each class session on each scheduled date, per student:

#### Step 1: Determine if student attends

```python
attendance_probability = {
    'excellent': 0.97,
    'good':      0.85,
    'average':   0.72,
    'at_risk':   0.52,
    'chronic':   0.20,
}
# Roll random: if random() < probability → student attends
```

#### Step 2: Generate ENTRY log

```python
if attending:
    # Time offset from class start
    late_probability = {
        'excellent': 0.03,   # Almost never late
        'good':      0.12,
        'average':   0.25,
        'at_risk':   0.35,
        'chronic':   0.50,
    }

    if random() < late_probability[profile]:
        # Late entry: 1-30 minutes after class start
        offset_minutes = random.randint(1, 30)
        is_late = True
        remarks = f" [LATE by {offset_minutes} min]"
    else:
        # On-time: 0-10 minutes before class start to 0 minutes after
        offset_minutes = random.randint(-10, 0)
        is_late = False
        remarks = None

    entry_time = class_start + timedelta(minutes=offset_minutes)

    log = AttendanceLog(
        user_id=student_id,
        class_id=class_id,
        device_id=1,
        action='ENTRY',
        verified_by='FACE',            # ENTRY always FACE only
        confidence_score=random.uniform(0.50, 0.95),
        gesture_detected=None,          # No gesture on ENTRY
        timestamp=entry_time,
        remarks=remarks,
        is_late=is_late,
    )
```

#### Step 3: Generate BREAK_OUT / BREAK_IN pairs (optional)

```python
break_probability = {
    'excellent': 0.15,   # Rarely takes breaks
    'good':      0.35,
    'average':   0.50,
    'at_risk':   0.65,
    'chronic':   0.80,
}

max_breaks = {
    'excellent': 1,
    'good':      2,
    'average':   2,
    'at_risk':   3,
    'chronic':   4,
}

if random() < break_probability[profile]:
    num_breaks = random.randint(1, max_breaks[profile])
    current_time = entry_time + timedelta(minutes=random.randint(20, 40))

    for _ in range(num_breaks):
        if current_time >= class_end - timedelta(minutes=15):
            break  # Don't take breaks too close to class end

        # BREAK_OUT
        break_out_time = current_time
        log_break_out = AttendanceLog(
            user_id=student_id,
            class_id=class_id,
            device_id=1,
            action='BREAK_OUT',
            verified_by='FACE+GESTURE',
            confidence_score=random.uniform(0.55, 0.90),
            gesture_detected='PEACE_SIGN',
            timestamp=break_out_time,
            remarks=None,
            is_late=False,
        )

        # Break duration: 3-25 minutes (varies by profile)
        break_duration = {
            'excellent': random.randint(3, 8),
            'good':      random.randint(5, 12),
            'average':   random.randint(5, 15),
            'at_risk':   random.randint(8, 20),
            'chronic':   random.randint(10, 25),
        }

        break_in_time = break_out_time + timedelta(minutes=break_duration[profile])

        # BREAK_IN
        log_break_in = AttendanceLog(
            user_id=student_id,
            class_id=class_id,
            device_id=1,
            action='BREAK_IN',
            verified_by='FACE+GESTURE',
            confidence_score=random.uniform(0.55, 0.90),
            gesture_detected='THUMBS_UP',
            timestamp=break_in_time,
            remarks=None,
            is_late=False,
        )

        current_time = break_in_time + timedelta(minutes=random.randint(15, 30))
```

#### Step 4: Generate EXIT log

```python
exit_probability = {
    'excellent': 0.95,    # Almost always stays until end
    'good':      0.85,
    'average':   0.70,
    'at_risk':   0.55,
    'chronic':   0.40,
}

early_exit_probability = {
    'excellent': 0.02,
    'good':      0.05,
    'average':   0.10,
    'at_risk':   0.20,
    'chronic':   0.30,
}

if random() < exit_probability[profile]:
    if random() < early_exit_probability[profile]:
        # Early exit: 10-30 min before class end
        exit_time = class_end - timedelta(minutes=random.randint(10, 30))
        remarks = "Early exit"
    else:
        # Normal exit: 0-5 min after class end
        exit_time = class_end + timedelta(minutes=random.randint(0, 5))
        remarks = None

    log_exit = AttendanceLog(
        user_id=student_id,
        class_id=class_id,
        device_id=1,
        action='EXIT',
        verified_by='FACE+GESTURE',
        confidence_score=random.uniform(0.55, 0.90),
        gesture_detected='OPEN_PALM',
        timestamp=exit_time,
        remarks=remarks,
        is_late=False,
    )
```

#### Step 5: Generate Faculty (HEAD) attendance

The HEAD (user_id=1) is the teacher. Generate their attendance for each session:

```python
# Faculty attends ~95% of sessions
# Late ~15% of the time (instructor delay)
# Always has ENTRY and EXIT, occasionally BREAK_OUT/BREAK_IN

faculty_entry_time = class_start - timedelta(minutes=random.randint(0, 5))  # Usually early

if random() < 0.15:  # 15% chance of being late
    faculty_entry_time = class_start + timedelta(minutes=random.randint(5, 20))
    is_late = True
    remarks = f" [LATE by {int((faculty_entry_time - class_start).total_seconds() / 60)} min]"
else:
    is_late = False
    remarks = None
```

#### Step 6: Generate Faculty (user_id=2) attendance

User 2 (Jericho Del Socorro) doesn't teach these classes, but as a faculty member in the department, they should have SOME attendance logs so the dept head faculty reports have data:

```python
# User 2 enters Room 328 occasionally (maybe preparing for next class, or meetings)
# Generate ~2-3 entries per week on random weekdays during work hours
# This ensures FACULTY_SUMMARY and FACULTY_LATE reports show data for user 2
```

---

### 3.3 Estimated Row Count

| Component | Per Session | Sessions | Total Rows |
|-----------|-----------|----------|------------|
| **Class 3 students attending** (avg 35 of 44) | 35 × ~3 events (ENTRY + avg 0.5 break pairs + EXIT) | 7 | ~735 |
| **Class 3 breaks** (avg 12 students take breaks, avg 1.5 pairs each) | 12 × 3 = 36 events | 7 | ~252 |
| **Class 4 students attending** (avg 38 of 49) | 38 × ~3 events | 8 | ~912 |
| **Class 4 breaks** | ~14 × 3 = 42 events | 8 | ~336 |
| **Faculty (user 1)** ENTRY+breaks+EXIT | ~4 events | 15 | ~60 |
| **Faculty (user 2)** misc entries | ~3 events | ~16 (2/week) | ~48 |
| **TOTAL** | | | **~2,343** |

This gives enough data for meaningful reports while staying realistic.

---

## 4. SEED MIGRATION SCRIPT DESIGN

### 4.1 File: `backend/scripts/seed_attendance_reports.py`

```
Purpose: Generates 3 months of attendance_logs for reports demo
Safe to run: Checks if seed data already exists by remarks tag
Idempotent: Won't double-insert
```

#### Script Structure

```python
"""
FRAMES Attendance Seed — Report Demo Data
==========================================
Generates ~2,300 realistic attendance_logs across 3 months
for the existing 2 classes (IDs 3 and 4) and 93 enrolled students.

Populates data from Jan 19, 2026 (semester start) through Mar 12, 2026.

HOW TO RUN (from backend/ directory):
    python scripts/seed_attendance_reports.py

HOW TO ROLLBACK:
    python scripts/seed_attendance_reports_cleanup.py
"""

# Key constants:
SEED_TAG = "[SEED-REPORTS]"  # Tagged in remarks for easy cleanup
DEVICE_ID = 1
SEMESTER_START = date(2026, 1, 19)
SEED_END = date(2026, 3, 12)  # Current date

# Class definitions (from actual DB):
CLASSES = [
    {
        'class_id': 3,
        'day_of_week': 'Saturday',
        'start_time': time(18, 50),
        'end_time': time(22, 0),
        'students': list(range(52, 96)),  # 52-95 inclusive (44 students)
        'faculty_id': 1,
    },
    {
        'class_id': 4,
        'day_of_week': 'Wednesday',
        'start_time': time(13, 30),
        'end_time': time(16, 0),
        'students': list(range(3, 52)),   # 3-51 inclusive (49 students)
        'faculty_id': 1,
    },
]
```

#### Algorithm Pseudocode

```python
def seed():
    db = SessionLocal()

    # Check if already seeded
    existing = db.query(AttendanceLog).filter(
        AttendanceLog.remarks.contains(SEED_TAG)
    ).first()
    if existing:
        print("Seed data already exists. Run cleanup first.")
        return

    all_logs = []

    for cls in CLASSES:
        # Get all scheduled dates for this class
        dates = get_class_dates(cls['day_of_week'], SEMESTER_START, SEED_END)

        # Assign behavior profiles to students
        profiles = assign_profiles(cls['students'])

        for session_date in dates:
            class_start = datetime.combine(session_date, cls['start_time'])
            class_end = datetime.combine(session_date, cls['end_time'])

            # Generate faculty attendance
            all_logs.extend(generate_faculty_session(cls['faculty_id'], cls['class_id'], class_start, class_end))

            # Generate student attendance
            for student_id in cls['students']:
                profile = profiles[student_id]
                all_logs.extend(generate_student_session(student_id, cls['class_id'], class_start, class_end, profile))

    # Generate misc faculty (user_id=2) presence
    all_logs.extend(generate_faculty2_misc(SEMESTER_START, SEED_END))

    # Bulk insert
    db.bulk_save_objects(all_logs)
    db.commit()

    print(f"Seeded {len(all_logs)} attendance logs")
    print(f"Date range: {SEMESTER_START} to {SEED_END}")
    db.close()
```

---

### 4.2 File: `backend/scripts/seed_attendance_reports_cleanup.py`

```python
"""
FRAMES Attendance Seed Cleanup — Removes Report Demo Data
==========================================================
Removes all attendance_logs inserted by seed_attendance_reports.py.
Identifies seeded data by the [SEED-REPORTS] tag in remarks,
PLUS any logs that have no remarks (from break/exit events)
that fall within the seed date range and have IDs above the
pre-seed maximum.

HOW TO RUN (from backend/ directory):
    python scripts/seed_attendance_reports_cleanup.py

SAFETY:
    This ONLY deletes seeded data. Real attendance logs from kiosk
    recognition are preserved because they don't have [SEED-REPORTS].
"""
```

#### Cleanup Strategy

**Problem:** Not all seed logs have the `[SEED-REPORTS]` tag in remarks (break and exit events have `None` or other remarks).

**Solution:** Use a combination of markers:

1. **Primary marker:** Delete all logs where `remarks LIKE '%[SEED-REPORTS]%'`
2. **Secondary marker:** Delete all logs where `id >= first_seed_id` AND `remarks` matches known seed patterns OR is NULL with a seed-range timestamp
3. **Safest approach:** Record the ID range during seeding

```python
# During seeding: record the first and last inserted IDs
# Save to a marker file or a DB table

# seed_attendance_reports.py:
first_id = db.query(func.max(AttendanceLog.id)).scalar() or 0
first_seed_id = first_id + 1
# ... insert all logs ...
last_seed_id = db.query(func.max(AttendanceLog.id)).scalar()

# Write marker to a JSON file for cleanup reference
marker = {
    "seed_tag": SEED_TAG,
    "first_id": first_seed_id,
    "last_id": last_seed_id,
    "count": len(all_logs),
    "seeded_at": datetime.now().isoformat(),
}
with open("scripts/.seed_attendance_marker.json", "w") as f:
    json.dump(marker, f, indent=2)


# seed_attendance_reports_cleanup.py:
marker_path = "scripts/.seed_attendance_marker.json"
if not os.path.exists(marker_path):
    print("No seed marker found. Nothing to clean up.")
    sys.exit(1)

with open(marker_path) as f:
    marker = json.load(f)

deleted = db.query(AttendanceLog).filter(
    AttendanceLog.id >= marker["first_id"],
    AttendanceLog.id <= marker["last_id"],
).delete(synchronize_session=False)

db.commit()
os.remove(marker_path)
print(f"Removed {deleted} seeded attendance logs (IDs {marker['first_id']} — {marker['last_id']})")
```

---

## 5. DATA DISTRIBUTION VALIDATION

After seeding, validate that report queries return meaningful data:

### 5.1 Expected Report Data Checks

| Report | Expected Result |
|--------|----------------|
| **Student Daily** | Any student shows 2-4 actions per session day |
| **Student Weekly** | Shows Present/Late/Absent counts per week, varies by student profile |
| **Student Late Report** | At Risk/Chronic students show more frequent late entries |
| **Student Break Log** | Most students with "Average+" profiles show break pairs |
| **Faculty Class Daily** | Shows 30-40+ student entries per session |
| **Faculty Class Monthly** | Shows per-student summary with Good/Warning/Present status |
| **Faculty Absence Summary** | Shows "Chronic" students (IDs 94-95, 49-51) frequently absent |
| **Faculty Late Report** | Shows ~15-25% of attending students as late per session |
| **Faculty Break Duration** | Shows BREAK_OUT/BREAK_IN pairs with varied timing |
| **Faculty Early Exits** | Shows ~10% of EXIT events flagged as early |
| **Dept Head Faculty Summary** | Shows user 1 and user 2 with entry/late counts |
| **Dept Head Faculty Late** | Shows user 1 with ~15% late entries |
| **Dept Head Room Occupancy** | Room 328 shows high entry count |
| **Dept Head Dept Activity** | Shows HEAD/FACULTY/STUDENT breakdown |

### 5.2 Validation Queries

```sql
-- Check total seed logs
SELECT COUNT(*) FROM attendance_logs WHERE remarks LIKE '%[SEED-REPORTS]%';
-- Expected: ~800+ (ENTRY events with tag)

-- Check total logs including breaks/exits
SELECT COUNT(*) FROM attendance_logs WHERE id >= :first_seed_id;
-- Expected: ~2,300

-- Check action distribution
SELECT action, COUNT(*) FROM attendance_logs WHERE id >= :first_seed_id GROUP BY action;
-- Expected: ENTRY ~800, EXIT ~600, BREAK_OUT ~400, BREAK_IN ~400

-- Check late distribution
SELECT is_late, COUNT(*) FROM attendance_logs WHERE id >= :first_seed_id AND action = 'ENTRY' GROUP BY is_late;
-- Expected: ~70% FALSE, ~30% TRUE

-- Check per-class distribution
SELECT class_id, COUNT(*) FROM attendance_logs WHERE id >= :first_seed_id GROUP BY class_id;
-- Expected: class 3 ~1000, class 4 ~1300 (more students + more sessions)

-- Check confidence score range
SELECT MIN(confidence_score), MAX(confidence_score), AVG(confidence_score) FROM attendance_logs WHERE id >= :first_seed_id;
-- Expected: min ~0.50, max ~0.95, avg ~0.72

-- Check gesture distribution
SELECT gesture_detected, COUNT(*) FROM attendance_logs WHERE id >= :first_seed_id AND gesture_detected IS NOT NULL GROUP BY gesture_detected;
-- Expected: PEACE_SIGN (break_out), THUMBS_UP (break_in), OPEN_PALM (exit)

-- Check verified_by distribution
SELECT verified_by, COUNT(*) FROM attendance_logs WHERE id >= :first_seed_id GROUP BY verified_by;
-- Expected: FACE (entries only), FACE+GESTURE (break + exit events)
```

---

## 6. FACULTY DATA ENRICHMENT

### 6.1 User 2 (FACULTY) Presence Data

Since User 2 (Jericho Del Socorro) has no classes but IS a faculty member in the department, we need to generate some attendance data so that department head reports show more than just 1 faculty member.

**Approach:** Generate ~2-3 ENTRY logs per week for User 2 on random weekdays, entering Room 328 during work hours (8:00-17:00). This simulates a faculty member going to the classroom for preparation, meetings, etc.

```python
# For each week in the semester:
for week_start in weekly_dates:
    num_visits = random.randint(1, 3)
    for _ in range(num_visits):
        visit_day = random.choice(['Monday', 'Tuesday', 'Thursday', 'Friday'])
        visit_date = get_next_weekday(week_start, visit_day)
        visit_time = datetime.combine(visit_date, time(random.randint(8, 15), random.randint(0, 59)))

        # ENTRY
        log_entry = AttendanceLog(
            user_id=2,
            class_id=random.choice([3, 4]),  # Associated with a class for room mapping
            device_id=1,
            action='ENTRY',
            verified_by='FACE',
            confidence_score=random.uniform(0.60, 0.90),
            timestamp=visit_time,
            is_late=random.random() < 0.10,  # 10% late
            remarks=f"{SEED_TAG}" if is_late else f"{SEED_TAG}",
        )
        # EXIT ~1-3 hours later
        exit_time = visit_time + timedelta(hours=random.randint(1, 3))
        log_exit = AttendanceLog(...)
```

---

## 7. IMPLEMENTATION CHECKLIST

- [ ] Create `backend/scripts/seed_attendance_reports.py` with:
  - [ ] All 5 behavior profiles with correct probability constants
  - [ ] Date generation for Saturdays (Class 3) and Wednesdays (Class 4)
  - [ ] Student attendance generation following the ENTRY → BREAK_OUT → BREAK_IN → EXIT state machine
  - [ ] Faculty (user 1) attendance for each teaching session
  - [ ] Faculty (user 2) miscellaneous room visits
  - [ ] `[SEED-REPORTS]` tag in ENTRY remarks for identification
  - [ ] JSON marker file output for cleanup
  - [ ] Idempotency check (skip if already seeded)
  - [ ] Bulk insert (not per-row) for performance
  - [ ] Deterministic seed (`random.seed(42)`) for reproducibility

- [ ] Create `backend/scripts/seed_attendance_reports_cleanup.py` with:
  - [ ] Read marker file for ID range
  - [ ] Single DELETE WHERE id BETWEEN first AND last
  - [ ] Remove marker file
  - [ ] Print summary of deleted rows

- [ ] Validate after seeding:
  - [ ] Run all 5 validation queries from §5.2
  - [ ] Test Student Dashboard loads with charted data
  - [ ] Test Faculty Reports page generates PDFs with actual data
  - [ ] Test Dept Head Reports page shows faculty summaries and room analytics
  - [ ] Verify no N+1 queries triggered (check server logs for slow query warnings)

---

## 8. SAFETY NOTES

1. **This does NOT modify any existing tables** — only INSERTs into `attendance_logs`
2. **Existing 32 logs are preserved** — seed starts from `MAX(id) + 1`
3. **Rollback is clean** — DELETE by ID range, no cascading effects
4. **Idempotent** — running the seed script twice won't double-insert
5. **Reproducible** — using `random.seed(42)` means same run = same data
6. **No schema changes** — no ALTER TABLE, no new columns, no migrations needed
