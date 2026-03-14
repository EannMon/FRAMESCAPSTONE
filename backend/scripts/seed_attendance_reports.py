"""
FRAMES Attendance Seed — Report Demo Data
==========================================
Generates realistic attendance_logs across ~3 months (Jan 19 — Apr 19, 2026)
for ALL users in the database:
  - HEAD (user_id=1): teaches Class 4 (Wed), plus extra visits on Mon/Tue/Thu/Fri
  - FACULTY (user_id=96): teaches Class 3 (Sat), attendance auto-generated
  - FACULTY (user_id=2): non-teaching, 3-4 weekday visits with breaks
  - 93 enrolled students across 2 classes (IDs 3-51, 52-95)

Uses 5 behavior profiles for students to create varied patterns:
  - Excellent (25%): nearly perfect, rarely late
  - Good (30%): occasional late, few breaks
  - Average (25%): regular lateness, moderate breaks
  - At Risk (15%): frequent absences, long breaks, early exits
  - Chronic (5%): mostly absent, very late when present

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
SEED_END = date(2026, 4, 19)  # ~3 full months

random.seed(42)  # Deterministic for reproducibility

# Class definitions from existing DB
CLASSES = [
    {
        "class_id": 3,
        "day_of_week": "Saturday",
        "start_time": dt_time(18, 50),
        "end_time": dt_time(22, 0),
        "students": list(range(52, 96)),  # IDs 52-95 (44 students)
        "faculty_id": 96,                # Angelica Terana teaches this class
    },
    {
        "class_id": 4,
        "day_of_week": "Wednesday",
        "start_time": dt_time(13, 30),
        "end_time": dt_time(16, 0),
        "students": list(range(3, 52)),   # IDs 3-51 (49 students)
        "faculty_id": 1,                 # Dept Head teaches this class
    },
]

# Faculty/Head users NOT teaching but should have attendance
# ID=2 (Jericho Del Socorro - FACULTY), ID=97 (Angelica Terana - FACULTY)
# Note: ID=97 teaches Class 3, so only ID=2 needs misc visits
# ID=1 (HEAD) teaches Class 4 but also visits on non-class days
NON_TEACHING_FACULTY = [2]
HEAD_USER_ID = 1

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


def generate_non_teaching_visits(user_id, start_date, end_date):
    """
    Generate varied attendance for a non-teaching faculty/head.
    3-4 visits per week on weekdays during work hours.
    Includes late arrivals, breaks, early exits, and normal exits.
    """
    logs = []
    current_week_start = start_date
    weekdays = [0, 1, 2, 3, 4]  # Mon-Fri

    while current_week_start <= end_date:
        # Pick 3-4 random weekdays this week
        num_visits = random.randint(3, 4)
        visit_days = random.sample(weekdays, min(num_visits, len(weekdays)))

        for day_offset in visit_days:
            visit_date = current_week_start
            while visit_date.weekday() != day_offset:
                visit_date += timedelta(days=1)
            if visit_date > end_date:
                continue

            # Determine arrival time (8:00 AM expected, some are late)
            expected_hour = 8
            if random.random() < 0.18:  # 18% late
                late_min = random.randint(5, 25)
                arrival_minute = late_min
                is_late = True
                entry_remarks = f"{SEED_TAG} [LATE by {late_min} min]"
            else:
                arrival_minute = random.randint(-10, 5)  # early or on time
                is_late = False
                entry_remarks = SEED_TAG

            entry_time = datetime.combine(visit_date, dt_time(expected_hour, 0)) + timedelta(minutes=arrival_minute)
            class_id = random.choice([3, 4])  # Room association

            logs.append(AttendanceLog(
                user_id=user_id,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.ENTRY,
                verified_by=VerifiedBy.FACE,
                confidence_score=round(random.uniform(0.65, 0.92), 3),
                gesture_detected=None,
                timestamp=entry_time,
                remarks=entry_remarks,
                is_late=is_late,
            ))

            # 40% chance of taking a break
            if random.random() < 0.40:
                break_out_time = entry_time + timedelta(minutes=random.randint(60, 120))
                logs.append(AttendanceLog(
                    user_id=user_id,
                    class_id=class_id,
                    device_id=DEVICE_ID,
                    action=AttendanceAction.BREAK_OUT,
                    verified_by=VerifiedBy.FACE_GESTURE,
                    confidence_score=round(random.uniform(0.65, 0.90), 3),
                    gesture_detected="PEACE_SIGN",
                    timestamp=break_out_time,
                    remarks=None,
                    is_late=False,
                ))
                break_duration = random.randint(5, 15)
                break_in_time = break_out_time + timedelta(minutes=break_duration)
                logs.append(AttendanceLog(
                    user_id=user_id,
                    class_id=class_id,
                    device_id=DEVICE_ID,
                    action=AttendanceAction.BREAK_IN,
                    verified_by=VerifiedBy.FACE_GESTURE,
                    confidence_score=round(random.uniform(0.65, 0.90), 3),
                    gesture_detected="THUMBS_UP",
                    timestamp=break_in_time,
                    remarks=None,
                    is_late=False,
                ))

            # EXIT: 12% early exit, 88% normal
            stay_hours = random.randint(2, 4)
            planned_exit = entry_time + timedelta(hours=stay_hours)
            if random.random() < 0.12:
                exit_time = planned_exit - timedelta(minutes=random.randint(15, 40))
                exit_remarks = "Early exit"
            else:
                exit_time = planned_exit + timedelta(minutes=random.randint(0, 10))
                exit_remarks = None

            logs.append(AttendanceLog(
                user_id=user_id,
                class_id=class_id,
                device_id=DEVICE_ID,
                action=AttendanceAction.EXIT,
                verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.65, 0.90), 3),
                gesture_detected="OPEN_PALM",
                timestamp=exit_time,
                remarks=exit_remarks,
                is_late=False,
            ))

        # Advance to next Monday
        days_until_monday = (7 - current_week_start.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        current_week_start += timedelta(days=days_until_monday)

    return logs


def generate_head_extra_visits(head_id, start_date, end_date, class_days):
    """
    Generate extra visits for the Dept Head on NON-class days.
    Head teaches on Wednesday (Class 4), so generate visits on Mon/Tue/Thu/Fri.
    """
    logs = []
    non_class_weekdays = [0, 1, 3, 4]  # Mon, Tue, Thu, Fri
    current = start_date

    while current <= end_date:
        if current.weekday() in non_class_weekdays:
            # 70% chance of showing up on a non-class day
            if random.random() < 0.70:
                # Arrival: 8-9 AM window
                arrive_hour = 8
                arrive_offset = random.randint(-5, 15)
                is_late = arrive_offset > 10
                entry_time = datetime.combine(current, dt_time(arrive_hour, 0)) + timedelta(minutes=arrive_offset)
                class_id = random.choice([3, 4])

                entry_remarks = SEED_TAG
                if is_late:
                    entry_remarks = f"{SEED_TAG} [LATE by {arrive_offset} min]"

                logs.append(AttendanceLog(
                    user_id=head_id,
                    class_id=class_id,
                    device_id=DEVICE_ID,
                    action=AttendanceAction.ENTRY,
                    verified_by=VerifiedBy.FACE,
                    confidence_score=round(random.uniform(0.72, 0.95), 3),
                    gesture_detected=None,
                    timestamp=entry_time,
                    remarks=entry_remarks,
                    is_late=is_late,
                ))

                # 30% break
                if random.random() < 0.30:
                    bo_time = entry_time + timedelta(minutes=random.randint(60, 90))
                    logs.append(AttendanceLog(
                        user_id=head_id, class_id=class_id, device_id=DEVICE_ID,
                        action=AttendanceAction.BREAK_OUT,
                        verified_by=VerifiedBy.FACE_GESTURE,
                        confidence_score=round(random.uniform(0.70, 0.92), 3),
                        gesture_detected="PEACE_SIGN",
                        timestamp=bo_time, remarks=None, is_late=False,
                    ))
                    bi_time = bo_time + timedelta(minutes=random.randint(5, 12))
                    logs.append(AttendanceLog(
                        user_id=head_id, class_id=class_id, device_id=DEVICE_ID,
                        action=AttendanceAction.BREAK_IN,
                        verified_by=VerifiedBy.FACE_GESTURE,
                        confidence_score=round(random.uniform(0.70, 0.92), 3),
                        gesture_detected="THUMBS_UP",
                        timestamp=bi_time, remarks=None, is_late=False,
                    ))

                # Exit 3-5 hours later
                exit_time = entry_time + timedelta(hours=random.randint(3, 5))
                logs.append(AttendanceLog(
                    user_id=head_id, class_id=class_id, device_id=DEVICE_ID,
                    action=AttendanceAction.EXIT,
                    verified_by=VerifiedBy.FACE_GESTURE,
                    confidence_score=round(random.uniform(0.70, 0.92), 3),
                    gesture_detected="OPEN_PALM",
                    timestamp=exit_time, remarks=None, is_late=False,
                ))

        current += timedelta(days=1)

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

        # Non-teaching faculty visits (ID=2: Jericho Del Socorro)
        for fid in NON_TEACHING_FACULTY:
            print(f"\n  Generating Faculty (ID={fid}) visits...")
            faculty_visit_logs = generate_non_teaching_visits(fid, SEMESTER_START, SEED_END)
            all_logs.extend(faculty_visit_logs)
            print(f"    Generated {len(faculty_visit_logs)} logs (ENTRY/BREAK/EXIT)")

        # Dept Head extra visits on non-class days
        print(f"\n  Generating Head (ID={HEAD_USER_ID}) non-class-day visits...")
        head_extra = generate_head_extra_visits(HEAD_USER_ID, SEMESTER_START, SEED_END, class_days=[2])  # Wed=2
        all_logs.extend(head_extra)
        print(f"    Generated {len(head_extra)} extra logs")

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
