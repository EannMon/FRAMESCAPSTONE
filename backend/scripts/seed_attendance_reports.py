"""
FRAMES Attendance Seed — Report Demo Data
==========================================
Generates ~2,500+ realistic attendance_logs across ~8 weeks (Jan 19 — Mar 12, 2026)
for ALL users in the database:
  - HEAD (user_id=1): teaches both classes, always present
  - FACULTY (user_id=2): no classes, but has misc room visits
  - 93 enrolled students across 2 classes

Uses 5 behavior profiles for students to create varied patterns.
Deterministic (random.seed(42)) for reproducibility.

HOW TO RUN (from backend/ directory):
    python scripts/seed_attendance_reports.py

HOW TO ROLLBACK:
    python scripts/seed_attendance_reports_cleanup.py
"""

import sys
import os
import json
import random
from datetime import datetime, date, timedelta, time as dt_time
from itertools import groupby as itertools_groupby

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.attendance_log import AttendanceLog, AttendanceAction, VerifiedBy
from sqlalchemy import func

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
SEED_TAG = "[SEED-REPORTS]"
DEVICE_ID = 1
SEMESTER_START = date(2026, 1, 19)
SEED_END = date(2026, 3, 12)

random.seed(42)  # Deterministic for reproducibility

# Class definitions from existing DB
CLASSES = [
    {
        "class_id": 3,
        "day_of_week": "Saturday",
        "start_time": dt_time(18, 50),
        "end_time": dt_time(22, 0),
        "students": list(range(52, 96)),  # IDs 52-95 (44 students)
        "faculty_id": 1,
    },
    {
        "class_id": 4,
        "day_of_week": "Wednesday",
        "start_time": dt_time(13, 30),
        "end_time": dt_time(16, 0),
        "students": list(range(3, 52)),   # IDs 3-51 (49 students)
        "faculty_id": 1,
    },
]

# ─────────────────────────────────────────────
# BEHAVIOR PROFILES
# ─────────────────────────────────────────────
PROFILES = {
    "excellent": {
        "attendance_prob": 0.97,
        "late_prob": 0.03,
        "late_min_range": (1, 10),
        "break_prob": 0.15,
        "max_breaks": 1,
        "break_duration_range": (3, 8),
        "exit_prob": 0.95,
        "early_exit_prob": 0.02,
    },
    "good": {
        "attendance_prob": 0.85,
        "late_prob": 0.12,
        "late_min_range": (1, 20),
        "break_prob": 0.35,
        "max_breaks": 2,
        "break_duration_range": (5, 12),
        "exit_prob": 0.85,
        "early_exit_prob": 0.05,
    },
    "average": {
        "attendance_prob": 0.72,
        "late_prob": 0.25,
        "late_min_range": (1, 25),
        "break_prob": 0.50,
        "max_breaks": 2,
        "break_duration_range": (5, 15),
        "exit_prob": 0.70,
        "early_exit_prob": 0.10,
    },
    "at_risk": {
        "attendance_prob": 0.52,
        "late_prob": 0.35,
        "late_min_range": (5, 30),
        "break_prob": 0.65,
        "max_breaks": 3,
        "break_duration_range": (8, 20),
        "exit_prob": 0.55,
        "early_exit_prob": 0.20,
    },
    "chronic": {
        "attendance_prob": 0.20,
        "late_prob": 0.50,
        "late_min_range": (10, 30),
        "break_prob": 0.80,
        "max_breaks": 4,
        "break_duration_range": (10, 25),
        "exit_prob": 0.40,
        "early_exit_prob": 0.30,
    },
}

# Day name → weekday index (Mon=0, Sun=6)
DAY_MAP = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2,
    "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6,
}


def assign_profiles(student_ids):
    """Distribute students across 5 behavior profiles (25/30/25/15/5 split)."""
    n = len(student_ids)
    counts = {
        "excellent": max(1, round(n * 0.25)),
        "good":      max(1, round(n * 0.30)),
        "average":   max(1, round(n * 0.25)),
        "at_risk":   max(1, round(n * 0.15)),
    }
    counts["chronic"] = n - sum(counts.values())
    if counts["chronic"] < 1:
        counts["chronic"] = 1
        counts["good"] -= 1

    profile_map = {}
    idx = 0
    for profile_name, count in counts.items():
        for _ in range(count):
            if idx < n:
                profile_map[student_ids[idx]] = profile_name
                idx += 1
    # Assign remaining to 'average' if any rounding mismatch
    while idx < n:
        profile_map[student_ids[idx]] = "average"
        idx += 1
    return profile_map


def get_class_dates(day_name, start, end):
    """Get all dates matching a day_of_week between start and end (inclusive)."""
    target = DAY_MAP[day_name]
    dates = []
    current = start
    while current <= end:
        if current.weekday() == target:
            dates.append(current)
        current += timedelta(days=1)
    return dates


def generate_student_session(student_id, class_id, class_start_dt, class_end_dt, profile_name):
    """Generate attendance logs for one student for one class session."""
    p = PROFILES[profile_name]
    logs = []

    # Step 1: Determine if student attends
    if random.random() > p["attendance_prob"]:
        return logs  # Absent

    # Step 2: ENTRY
    if random.random() < p["late_prob"]:
        offset = random.randint(*p["late_min_range"])
        is_late = True
        remarks = f"{SEED_TAG} [LATE by {offset} min]"
    else:
        offset = random.randint(-10, 0)
        is_late = False
        remarks = SEED_TAG

    entry_time = class_start_dt + timedelta(minutes=offset)
    logs.append(AttendanceLog(
        user_id=student_id,
        class_id=class_id,
        device_id=DEVICE_ID,
        action=AttendanceAction.ENTRY,
        verified_by=VerifiedBy.FACE,
        confidence_score=round(random.uniform(0.55, 0.95), 3),
        gesture_detected=None,
        timestamp=entry_time,
        remarks=remarks,
        is_late=is_late,
    ))

    # Step 3: BREAK_OUT / BREAK_IN pairs
    if random.random() < p["break_prob"]:
        num_breaks = random.randint(1, p["max_breaks"])
        current_time = entry_time + timedelta(minutes=random.randint(20, 40))

        for _ in range(num_breaks):
            if current_time >= class_end_dt - timedelta(minutes=15):
                break

            # BREAK_OUT
            break_out_time = current_time
            logs.append(AttendanceLog(
                user_id=student_id,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.BREAK_OUT,
                verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.60, 0.92), 3),
                gesture_detected="PEACE_SIGN",
                timestamp=break_out_time,
                remarks=None,
                is_late=False,
            ))

            # BREAK_IN after duration
            duration = random.randint(*p["break_duration_range"])
            break_in_time = break_out_time + timedelta(minutes=duration)

            # Don't return after class ends
            if break_in_time >= class_end_dt:
                break

            logs.append(AttendanceLog(
                user_id=student_id,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.BREAK_IN,
                verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.60, 0.92), 3),
                gesture_detected="THUMBS_UP",
                timestamp=break_in_time,
                remarks=None,
                is_late=False,
            ))

            current_time = break_in_time + timedelta(minutes=random.randint(15, 30))

    # Step 4: EXIT
    if random.random() < p["exit_prob"]:
        if random.random() < p["early_exit_prob"]:
            exit_time = class_end_dt - timedelta(minutes=random.randint(10, 30))
            exit_remarks = "Early exit"
        else:
            exit_time = class_end_dt + timedelta(minutes=random.randint(0, 5))
            exit_remarks = None

        logs.append(AttendanceLog(
            user_id=student_id,
            class_id=class_id,
            device_id=DEVICE_ID,
            action=AttendanceAction.EXIT,
            verified_by=VerifiedBy.FACE_GESTURE,
            confidence_score=round(random.uniform(0.60, 0.92), 3),
            gesture_detected="OPEN_PALM",
            timestamp=exit_time,
            remarks=exit_remarks,
            is_late=False,
        ))

    return logs


def generate_faculty_session(faculty_id, class_id, class_start_dt, class_end_dt):
    """Generate attendance for the teaching faculty for one session."""
    logs = []

    # Faculty attends ~95% of sessions
    if random.random() > 0.95:
        return logs

    # ENTRY: usually early, 15% chance of late
    if random.random() < 0.15:
        offset = random.randint(5, 20)
        is_late = True
        remarks = f"{SEED_TAG} [LATE by {offset} min]"
    else:
        offset = random.randint(-5, 0)
        is_late = False
        remarks = SEED_TAG

    entry_time = class_start_dt + timedelta(minutes=offset)
    logs.append(AttendanceLog(
        user_id=faculty_id,
        class_id=class_id,
        device_id=DEVICE_ID,
        action=AttendanceAction.ENTRY,
        verified_by=VerifiedBy.FACE,
        confidence_score=round(random.uniform(0.70, 0.95), 3),
        gesture_detected=None,
        timestamp=entry_time,
        remarks=remarks,
        is_late=is_late,
    ))

    # 30% chance of a break
    if random.random() < 0.30:
        break_out_time = entry_time + timedelta(minutes=random.randint(40, 80))
        if break_out_time < class_end_dt - timedelta(minutes=20):
            logs.append(AttendanceLog(
                user_id=faculty_id,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.BREAK_OUT,
                verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.70, 0.92), 3),
                gesture_detected="PEACE_SIGN",
                timestamp=break_out_time,
                remarks=None,
                is_late=False,
            ))
            break_in_time = break_out_time + timedelta(minutes=random.randint(5, 10))
            logs.append(AttendanceLog(
                user_id=faculty_id,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.BREAK_IN,
                verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.70, 0.92), 3),
                gesture_detected="THUMBS_UP",
                timestamp=break_in_time,
                remarks=None,
                is_late=False,
            ))

    # EXIT near end
    exit_time = class_end_dt + timedelta(minutes=random.randint(0, 5))
    logs.append(AttendanceLog(
        user_id=faculty_id,
        class_id=class_id,
        device_id=DEVICE_ID,
        action=AttendanceAction.EXIT,
        verified_by=VerifiedBy.FACE_GESTURE,
        confidence_score=round(random.uniform(0.70, 0.92), 3),
        gesture_detected="OPEN_PALM",
        timestamp=exit_time,
        remarks=None,
        is_late=False,
    ))

    return logs


def generate_faculty2_visits(start_date, end_date):
    """
    Generate misc room visits for Faculty user_id=2 (not teaching).
    ~2-3 visits per week on random weekdays during work hours.
    This ensures dept head reports show data for both faculty members.
    """
    logs = []
    current_week_start = start_date
    weekdays = [0, 1, 3, 4]  # Mon, Tue, Thu, Fri (avoid Wed/Sat — class days)

    while current_week_start <= end_date:
        num_visits = random.randint(1, 3)
        for _ in range(num_visits):
            day_offset = random.choice(weekdays)
            visit_date = current_week_start
            # Find the target weekday in this week
            while visit_date.weekday() != day_offset:
                visit_date += timedelta(days=1)
            if visit_date > end_date:
                continue

            visit_hour = random.randint(8, 15)
            visit_minute = random.randint(0, 59)
            visit_time = datetime.combine(visit_date, dt_time(visit_hour, visit_minute))

            is_late = random.random() < 0.10
            # Assign to a random class for room association
            class_id = random.choice([3, 4])

            logs.append(AttendanceLog(
                user_id=2,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.ENTRY,
                verified_by=VerifiedBy.FACE,
                confidence_score=round(random.uniform(0.65, 0.90), 3),
                gesture_detected=None,
                timestamp=visit_time,
                remarks=SEED_TAG,
                is_late=is_late,
            ))

            # EXIT 1-3 hours later
            exit_time = visit_time + timedelta(hours=random.randint(1, 3))
            logs.append(AttendanceLog(
                user_id=2,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.EXIT,
                verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.65, 0.90), 3),
                gesture_detected="OPEN_PALM",
                timestamp=exit_time,
                remarks=None,
                is_late=False,
            ))

        # Move to next Monday
        current_week_start += timedelta(days=7 - current_week_start.weekday())
        if current_week_start.weekday() != 0:
            current_week_start += timedelta(days=(7 - current_week_start.weekday()) % 7)

    return logs


def seed():
    """Main seed function."""
    print("=" * 65)
    print("  FRAMES Attendance Seed — Report Demo Data")
    print("=" * 65)

    db = SessionLocal()

    try:
        # Check if already seeded
        existing = db.query(AttendanceLog).filter(
            AttendanceLog.remarks.contains(SEED_TAG)
        ).first()
        if existing:
            print("\n  Seed data already exists. Run cleanup first:")
            print("    python scripts/seed_attendance_reports_cleanup.py")
            return

        # Record starting ID for cleanup
        max_id = db.query(func.max(AttendanceLog.id)).scalar() or 0
        first_seed_id = max_id + 1

        all_logs = []

        for cls in CLASSES:
            class_id = cls["class_id"]
            dates = get_class_dates(cls["day_of_week"], SEMESTER_START, SEED_END)
            profiles = assign_profiles(cls["students"])

            print(f"\n  Class {class_id} ({cls['day_of_week']}s): {len(dates)} sessions, {len(cls['students'])} students")
            print(f"    Profile distribution:")
            from collections import Counter
            profile_counts = Counter(profiles.values())
            for pname, pcount in sorted(profile_counts.items()):
                print(f"      {pname}: {pcount} students")

            for session_date in dates:
                class_start_dt = datetime.combine(session_date, cls["start_time"])
                class_end_dt = datetime.combine(session_date, cls["end_time"])

                # Faculty (HEAD) attendance
                faculty_logs = generate_faculty_session(
                    cls["faculty_id"], class_id, class_start_dt, class_end_dt
                )
                all_logs.extend(faculty_logs)

                # Student attendance
                for student_id in cls["students"]:
                    profile_name = profiles[student_id]
                    student_logs = generate_student_session(
                        student_id, class_id, class_start_dt, class_end_dt, profile_name
                    )
                    all_logs.extend(student_logs)

        # Faculty (user_id=2) misc visits
        print(f"\n  Generating Faculty (ID=2) misc room visits...")
        faculty2_logs = generate_faculty2_visits(SEMESTER_START, SEED_END)
        all_logs.extend(faculty2_logs)
        print(f"    Generated {len(faculty2_logs)} visit logs")

        # Bulk insert
        print(f"\n  Inserting {len(all_logs)} attendance logs...")
        db.bulk_save_objects(all_logs)
        db.commit()

        # Get last inserted ID
        last_seed_id = db.query(func.max(AttendanceLog.id)).scalar()

        # Save marker file for cleanup
        marker = {
            "seed_tag": SEED_TAG,
            "first_id": first_seed_id,
            "last_id": last_seed_id,
            "count": len(all_logs),
            "seeded_at": datetime.now().isoformat(),
            "date_range": f"{SEMESTER_START} to {SEED_END}",
        }
        marker_path = os.path.join(os.path.dirname(__file__), ".seed_attendance_marker.json")
        with open(marker_path, "w") as f:
            json.dump(marker, f, indent=2)

        # Print summary
        action_counts = {}
        for log in all_logs:
            action = log.action.value
            action_counts[action] = action_counts.get(action, 0) + 1

        late_count = sum(1 for log in all_logs if log.is_late)

        print(f"\n  Seeded {len(all_logs)} attendance logs")
        print(f"    ID range: {first_seed_id} — {last_seed_id}")
        print(f"    Date range: {SEMESTER_START} to {SEED_END}")
        print(f"    Action breakdown:")
        for action, count in sorted(action_counts.items()):
            print(f"      {action}: {count}")
        print(f"    Late entries: {late_count}")
        print(f"\n  Marker saved to: {marker_path}")
        print(f"\n  To rollback: python scripts/seed_attendance_reports_cleanup.py")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"\n  ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
