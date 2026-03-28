"""
FRAMES Faculty Reports Seed Script
====================================
Seeds realistic data for Faculty C (maria.dela_cruz@tup.edu.ph) to test
ALL Faculty Report types (weekly, monthly, semestral) AND the live dashboard.

What this seeds:
  - 1 new Subject:  IT-SRP401  "Software Requirements & Project Planning"
  - 2 new Classes taught by Faculty C:
      A) Monday   08:00–11:00  Room 325  Section BSIT-3B  (historical reports)
      B) Saturday 00:00–05:00  Room 325  Section BSIT-3B  (LIVE dashboard tonight)
  - 10 new Students  (SEED-FAC-RPT-001 … 010)  enrolled in BOTH classes
  - Attendance logs  Jan 19 – Mar 28, 2026  for the Monday class
  - Attendance logs  Mar 28 00:00–~05:00      for the Saturday class (live)
  - Faculty C personal ENTRY/BREAK/EXIT for every session

Behavior profiles (students):
  Excellent (2), Good (3), Average (2), At-Risk (2), Chronic (1)

SAFETY:
  - NEVER deletes or alters existing rows.
  - Tags all attendance_logs with remarks "[SEED-FACULTY-RPT]".
  - Writes .seed_faculty_reports_marker.json for safe cleanup.
  - Deterministic: random.seed(99)

HOW TO RUN (from backend/ directory, venv active):
    python scripts/seed_faculty_reports.py

HOW TO CLEAN:
    python scripts/seed_faculty_reports_cleanup.py
"""

import sys, os, json, random
from datetime import datetime, date, timedelta, time as dt_time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from sqlalchemy import func
from models.user import User, UserRole, VerificationStatus
from models.subject import Subject
from models.class_ import Class
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction, VerifiedBy
from models.device import Device, DeviceStatus
import bcrypt

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
SEED_TAG          = "[SEED-FACULTY-RPT]"
STUDENT_ID_PREFIX = "SEED-FAC-RPT"
FACULTY_EMAIL     = "angelica.terana@tup.edu.ph"
SUBJECT_CODE      = "IT-SRP401"
SECTION           = "BSIT-3B"
ROOM              = "325"
ACADEMIC_YEAR     = "2025-2026"
SEMESTER          = "2nd Semester"
SEMESTER_START    = date(2026, 1, 19)
SEED_END          = date(2026, 3, 28)   # today
DEVICE_ROOM       = "325"

random.seed(99)

# ─────────────────────────────────────────────
# STUDENT DATA  (10 students, BSIT-3B)
# ─────────────────────────────────────────────
STUDENTS_DATA = [
    {"first": "Lena",    "last": "Aguilar",    "mid": "M", "suffix": "001"},
    {"first": "Marco",   "last": "Buenaventura","mid": "A", "suffix": "002"},
    {"first": "Claire",  "last": "Castillo",   "mid": "B", "suffix": "003"},
    {"first": "Daniel",  "last": "Domingo",    "mid": "L", "suffix": "004"},
    {"first": "Faith",   "last": "Enriquez",   "mid": "P", "suffix": "005"},
    {"first": "Gabriel", "last": "Flores",     "mid": "R", "suffix": "006"},
    {"first": "Hana",    "last": "Gutierrez",  "mid": "C", "suffix": "007"},
    {"first": "Isko",    "last": "Herrera",    "mid": "E", "suffix": "008"},
    {"first": "Jasmine", "last": "Ilagan",     "mid": "F", "suffix": "009"},
    {"first": "Karl",    "last": "Javier",     "mid": "G", "suffix": "010"},
]

PROFILE_DISTRIBUTION = [
    "excellent", "excellent",
    "good", "good", "good",
    "average", "average",
    "at_risk", "at_risk",
    "chronic",
]

PROFILES = {
    "excellent": {
        "attendance_prob": 0.97, "late_prob": 0.03, "late_range": (1, 8),
        "break_prob": 0.15, "max_breaks": 1, "break_dur": (3, 8),
        "exit_prob": 0.95, "early_exit_prob": 0.02,
    },
    "good": {
        "attendance_prob": 0.85, "late_prob": 0.12, "late_range": (1, 20),
        "break_prob": 0.35, "max_breaks": 2, "break_dur": (5, 12),
        "exit_prob": 0.85, "early_exit_prob": 0.05,
    },
    "average": {
        "attendance_prob": 0.72, "late_prob": 0.25, "late_range": (1, 25),
        "break_prob": 0.50, "max_breaks": 2, "break_dur": (5, 15),
        "exit_prob": 0.70, "early_exit_prob": 0.10,
    },
    "at_risk": {
        "attendance_prob": 0.52, "late_prob": 0.35, "late_range": (5, 30),
        "break_prob": 0.65, "max_breaks": 3, "break_dur": (8, 20),
        "exit_prob": 0.55, "early_exit_prob": 0.20,
    },
    "chronic": {
        "attendance_prob": 0.20, "late_prob": 0.50, "late_range": (10, 30),
        "break_prob": 0.80, "max_breaks": 4, "break_dur": (10, 25),
        "exit_prob": 0.40, "early_exit_prob": 0.30,
    },
}

DAY_MAP = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2,
    "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6,
}


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def get_class_dates(day_name: str, start: date, end: date):
    """Return all dates in [start, end] matching day_name."""
    target = DAY_MAP[day_name]
    dates, cur = [], start
    while cur <= end:
        if cur.weekday() == target:
            dates.append(cur)
        cur += timedelta(days=1)
    return dates


def gen_student_session(student_id, class_id, device_id, start_dt, end_dt, profile_name):
    """Generate attendance logs for one student in one class session."""
    p = PROFILES[profile_name]
    logs = []

    if random.random() > p["attendance_prob"]:
        return logs   # absent

    # ENTRY
    if random.random() < p["late_prob"]:
        offset = random.randint(*p["late_range"])
        is_late, remarks = True, f"{SEED_TAG} [LATE by {offset} min]"
    else:
        offset = random.randint(-8, 0)
        is_late, remarks = False, SEED_TAG

    entry_dt = start_dt + timedelta(minutes=offset)
    logs.append(AttendanceLog(
        user_id=student_id, class_id=class_id, device_id=device_id,
        action=AttendanceAction.ENTRY, verified_by=VerifiedBy.FACE,
        confidence_score=round(random.uniform(0.55, 0.97), 3),
        is_late=is_late, timestamp=entry_dt, remarks=remarks,
    ))

    # BREAKS
    if random.random() < p["break_prob"]:
        num_breaks = random.randint(1, p["max_breaks"])
        cur = entry_dt + timedelta(minutes=random.randint(20, 40))
        for _ in range(num_breaks):
            if cur >= end_dt - timedelta(minutes=15):
                break
            bout = cur
            logs.append(AttendanceLog(
                user_id=student_id, class_id=class_id, device_id=device_id,
                action=AttendanceAction.BREAK_OUT, verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.60, 0.93), 3),
                gesture_detected="PEACE_SIGN", is_late=False, timestamp=bout, remarks=None,
            ))
            dur = random.randint(*p["break_dur"])
            bin_ = bout + timedelta(minutes=dur)
            if bin_ >= end_dt:
                break
            logs.append(AttendanceLog(
                user_id=student_id, class_id=class_id, device_id=device_id,
                action=AttendanceAction.BREAK_IN, verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.60, 0.93), 3),
                gesture_detected="THUMBS_UP", is_late=False, timestamp=bin_, remarks=None,
            ))
            cur = bin_ + timedelta(minutes=random.randint(15, 30))

    # EXIT
    if random.random() < p["exit_prob"]:
        if random.random() < p["early_exit_prob"]:
            exit_dt = end_dt - timedelta(minutes=random.randint(10, 30))
            exit_rem = "Early exit"
        else:
            exit_dt = end_dt + timedelta(minutes=random.randint(0, 5))
            exit_rem = None
        logs.append(AttendanceLog(
            user_id=student_id, class_id=class_id, device_id=device_id,
            action=AttendanceAction.EXIT, verified_by=VerifiedBy.FACE_GESTURE,
            confidence_score=round(random.uniform(0.60, 0.93), 3),
            gesture_detected="OPEN_PALM", is_late=False, timestamp=exit_dt, remarks=exit_rem,
        ))

    return logs


def gen_faculty_session(faculty_id, class_id, device_id, start_dt, end_dt):
    """Generate Faculty C's own attendance for ONE session."""
    logs = []
    if random.random() > 0.95:
        return logs  # rare absence

    if random.random() < 0.15:
        offset = random.randint(5, 20)
        is_late, remarks = True, f"{SEED_TAG} [LATE by {offset} min]"
    else:
        offset = random.randint(-5, 0)
        is_late, remarks = False, SEED_TAG

    entry_dt = start_dt + timedelta(minutes=offset)
    logs.append(AttendanceLog(
        user_id=faculty_id, class_id=class_id, device_id=device_id,
        action=AttendanceAction.ENTRY, verified_by=VerifiedBy.FACE,
        confidence_score=round(random.uniform(0.80, 0.97), 3),
        is_late=is_late, timestamp=entry_dt, remarks=remarks,
    ))

    # 35% chance of a break
    if random.random() < 0.35:
        bout = entry_dt + timedelta(minutes=random.randint(60, 90))
        if bout < end_dt - timedelta(minutes=20):
            logs.append(AttendanceLog(
                user_id=faculty_id, class_id=class_id, device_id=device_id,
                action=AttendanceAction.BREAK_OUT, verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.80, 0.95), 3),
                gesture_detected="PEACE_SIGN", is_late=False, timestamp=bout, remarks=None,
            ))
            bin_ = bout + timedelta(minutes=random.randint(5, 10))
            logs.append(AttendanceLog(
                user_id=faculty_id, class_id=class_id, device_id=device_id,
                action=AttendanceAction.BREAK_IN, verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.80, 0.95), 3),
                gesture_detected="THUMBS_UP", is_late=False, timestamp=bin_, remarks=None,
            ))

    # EXIT near class end
    exit_dt = end_dt + timedelta(minutes=random.randint(0, 5))
    logs.append(AttendanceLog(
        user_id=faculty_id, class_id=class_id, device_id=device_id,
        action=AttendanceAction.EXIT, verified_by=VerifiedBy.FACE_GESTURE,
        confidence_score=round(random.uniform(0.80, 0.95), 3),
        gesture_detected="OPEN_PALM", is_late=False, timestamp=exit_dt, remarks=None,
    ))
    return logs


def gen_live_session(student_id, class_id, device_id, start_dt, profile_name):
    """
    Generate LIVE attendance for tonight's Saturday class (March 28, 00:00–05:00).
    Uses same profile logic but caps at current time so logs look real-time.
    """
    p = PROFILES[profile_name]
    logs = []
    now = datetime.now()

    if random.random() > p["attendance_prob"]:
        return logs

    # ENTRY
    if random.random() < p["late_prob"]:
        offset = random.randint(*p["late_range"])
        is_late, remarks = True, f"{SEED_TAG} [LATE by {offset} min]"
    else:
        offset = random.randint(-5, 0)
        is_late, remarks = False, SEED_TAG

    entry_dt = start_dt + timedelta(minutes=offset)
    if entry_dt > now:
        return logs   # class hasn't happened yet from caller's POV — skip

    logs.append(AttendanceLog(
        user_id=student_id, class_id=class_id, device_id=device_id,
        action=AttendanceAction.ENTRY, verified_by=VerifiedBy.FACE,
        confidence_score=round(random.uniform(0.75, 0.97), 3),
        is_late=is_late, timestamp=entry_dt, remarks=remarks,
    ))

    # BREAK (50% chance — brief, lab-style)
    bout = entry_dt + timedelta(minutes=random.randint(30, 60))
    if random.random() < 0.50 and bout < now - timedelta(minutes=10):
        logs.append(AttendanceLog(
            user_id=student_id, class_id=class_id, device_id=device_id,
            action=AttendanceAction.BREAK_OUT, verified_by=VerifiedBy.FACE_GESTURE,
            confidence_score=round(random.uniform(0.75, 0.95), 3),
            gesture_detected="PEACE_SIGN", is_late=False, timestamp=bout, remarks=None,
        ))
        bin_ = bout + timedelta(minutes=random.randint(5, 10))
        if bin_ < now:
            logs.append(AttendanceLog(
                user_id=student_id, class_id=class_id, device_id=device_id,
                action=AttendanceAction.BREAK_IN, verified_by=VerifiedBy.FACE_GESTURE,
                confidence_score=round(random.uniform(0.75, 0.95), 3),
                gesture_detected="THUMBS_UP", is_late=False, timestamp=bin_, remarks=None,
            ))

    return logs


def seed():
    print("=" * 65)
    print("🌱  FRAMES Faculty Reports Seed")
    print("=" * 65)

    db = SessionLocal()

    try:
        # ── 0. Guard: already seeded? ──────────────────────────────
        existing = db.query(AttendanceLog).filter(
            AttendanceLog.remarks.contains(SEED_TAG)
        ).first()
        if existing:
            print("\n⚠️  Seed data already exists. Run cleanup first:")
            print("    python scripts/seed_faculty_reports_cleanup.py")
            return

        # ── 1. Find Faculty C ──────────────────────────────────────
        faculty = db.query(User).filter(User.email == FACULTY_EMAIL).first()
        if not faculty:
            print(f"\n❌  Faculty '{FACULTY_EMAIL}' not found.")
            print("    Run python scripts/seed_data.py first.")
            return
        print(f"\n✅  Faculty C: {faculty.full_name}  (ID={faculty.id})")
        dept_id = faculty.department_id
        prog_id = faculty.program_id

        # ── 2. Device ──────────────────────────────────────────────
        device = db.query(Device).filter(Device.room == DEVICE_ROOM).first()
        if not device:
            device = Device(
                room=DEVICE_ROOM,
                ip_address="192.168.1.102",
                device_name=f"KIOSK-{DEVICE_ROOM}",
                status=DeviceStatus.ACTIVE,
                room_capacity=40,
            )
            db.add(device)
            db.flush()
            print(f"   🖥️  Created device: {device.device_name} (ID={device.id})")
        else:
            print(f"   🖥️  Using device: {device.device_name} (ID={device.id})")

        # ── 3. Subject ─────────────────────────────────────────────
        subject = db.query(Subject).filter(Subject.code == SUBJECT_CODE).first()
        if not subject:
            subject = Subject(
                code=SUBJECT_CODE,
                title="Software Requirements & Project Planning",
                units=3,
            )
            db.add(subject)
            db.flush()
            print(f"\n📚  Created subject: {SUBJECT_CODE} (ID={subject.id})")
        else:
            print(f"\n📚  Subject exists: {SUBJECT_CODE} (ID={subject.id})")

        # ── 4. Classes ─────────────────────────────────────────────
        print("\n🗓️   Creating classes...")

        # Class A — Monday  08:00–11:00  (historical report data)
        monday_cls = db.query(Class).filter(
            Class.subject_id == subject.id,
            Class.section == SECTION,
            Class.day_of_week == "Monday",
            Class.semester == SEMESTER,
            Class.academic_year == ACADEMIC_YEAR,
        ).first()

        if not monday_cls:
            monday_cls = Class(
                subject_id=subject.id, faculty_id=faculty.id,
                room=ROOM, day_of_week="Monday",
                start_time=dt_time(8, 0), end_time=dt_time(11, 0),
                section=SECTION, semester=SEMESTER, academic_year=ACADEMIC_YEAR,
                late_threshold_minutes=15,
            )
            db.add(monday_cls)
            db.flush()
            print(f"   ✅  Monday class created  (ID={monday_cls.id})  08:00–11:00  Room {ROOM}")
        else:
            print(f"   ℹ️  Monday class exists  (ID={monday_cls.id})")

        # Class B — Saturday  00:00–05:00  (LIVE dashboard tonight)
        saturday_cls = db.query(Class).filter(
            Class.subject_id == subject.id,
            Class.section == SECTION,
            Class.day_of_week == "Saturday",
            Class.semester == SEMESTER,
            Class.academic_year == ACADEMIC_YEAR,
        ).first()

        if not saturday_cls:
            saturday_cls = Class(
                subject_id=subject.id, faculty_id=faculty.id,
                room=ROOM, day_of_week="Saturday",
                start_time=dt_time(0, 0), end_time=dt_time(5, 0),
                section=SECTION, semester=SEMESTER, academic_year=ACADEMIC_YEAR,
                late_threshold_minutes=15,
            )
            db.add(saturday_cls)
            db.flush()
            print(f"   ✅  Saturday class created (ID={saturday_cls.id})  00:00–05:00  Room {ROOM}  [LIVE TONIGHT]")
        else:
            print(f"   ℹ️  Saturday class exists  (ID={saturday_cls.id})")

        # ── 5. Students ────────────────────────────────────────────
        print("\n🎓  Creating students (BSIT-3B)...")
        students = []
        for i, sd in enumerate(STUDENTS_DATA):
            tupm_id = f"{STUDENT_ID_PREFIX}-{sd['suffix']}"
            email   = f"{sd['first'].lower()}.{sd['last'].lower().replace(' ', '_')}@tup.edu.ph"
            pw      = sd["last"].lower().replace(" ", "_")

            existing = db.query(User).filter(User.tupm_id == tupm_id).first()
            if existing:
                students.append(existing)
                print(f"   ℹ️  Exists: {existing.full_name}")
            else:
                stu = User(
                    email=email,
                    password_hash=hash_password(pw),
                    tupm_id=tupm_id,
                    role=UserRole.STUDENT,
                    verification_status=VerificationStatus.VERIFIED,
                    face_registered=True,
                    first_name=sd["first"], last_name=sd["last"], middle_name=sd["mid"],
                    department_id=dept_id, program_id=prog_id,
                    section=SECTION,
                )
                db.add(stu)
                db.flush()
                students.append(stu)
                print(f"   ✅  {stu.full_name}  [{PROFILE_DISTRIBUTION[i]}]  pw:{pw}")

        # ── 6. Enrollments ─────────────────────────────────────────
        print("\n📋  Creating enrollments...")
        enroll_count = 0
        for stu in students:
            for cls in [monday_cls, saturday_cls]:
                exists = db.query(Enrollment).filter(
                    Enrollment.class_id == cls.id,
                    Enrollment.student_id == stu.id,
                ).first()
                if not exists:
                    db.add(Enrollment(class_id=cls.id, student_id=stu.id))
                    enroll_count += 1
        db.flush()
        print(f"   ✅  {enroll_count} enrollments added")

        # ── 7. Record max ID before inserts ───────────────────────
        max_log_id = db.query(func.max(AttendanceLog.id)).scalar() or 0
        first_seed_id = max_log_id + 1

        # ── 8. Monday class — full semester logs ──────────────────
        print("\n📊  Generating Monday historical attendance logs...")
        all_logs = []
        session_dates = get_class_dates("Monday", SEMESTER_START, SEED_END)
        # Only past dates (< today)
        session_dates = [d for d in session_dates if d < SEED_END]

        for session_date in session_dates:
            start_dt = datetime.combine(session_date, dt_time(8, 0))
            end_dt   = datetime.combine(session_date, dt_time(11, 0))

            # Faculty C personal logs
            all_logs.extend(gen_faculty_session(
                faculty.id, monday_cls.id, device.id, start_dt, end_dt
            ))

            # Student logs
            for j, stu in enumerate(students):
                profile = PROFILE_DISTRIBUTION[j]
                all_logs.extend(gen_student_session(
                    stu.id, monday_cls.id, device.id, start_dt, end_dt, profile
                ))

        print(f"   ✅  {len(all_logs)} logs across {len(session_dates)} Monday sessions")

        # ── 9. Saturday class — LIVE logs for tonight ─────────────
        print("\n🟢  Generating LIVE Saturday attendance logs (Mar 28 00:00+)...")
        live_count_before = len(all_logs)

        today = date(2026, 3, 28)  # tonight
        live_start = datetime.combine(today, dt_time(0, 0))
        live_end   = datetime.combine(today, dt_time(5, 0))

        # Faculty C arrives early morning
        fac_entry = live_start + timedelta(minutes=random.randint(0, 10))
        all_logs.append(AttendanceLog(
            user_id=faculty.id, class_id=saturday_cls.id, device_id=device.id,
            action=AttendanceAction.ENTRY, verified_by=VerifiedBy.FACE,
            confidence_score=round(random.uniform(0.88, 0.97), 3),
            is_late=False, timestamp=fac_entry, remarks=SEED_TAG,
        ))

        for j, stu in enumerate(students):
            profile = PROFILE_DISTRIBUTION[j]
            # Stagger student arrivals: each student starts 1–6 min after midnight
            student_start = live_start + timedelta(minutes=random.randint(1, 6))
            all_logs.extend(gen_live_session(
                stu.id, saturday_cls.id, device.id, student_start, profile
            ))

        live_generated = len(all_logs) - live_count_before
        print(f"   ✅  {live_generated} live logs for tonight's Saturday session")

        # ── 10. Bulk insert in chunks ─────────────────────────────
        print(f"\n💾  Inserting {len(all_logs)} total attendance logs in chunks of 50...")
        chunk_size = 50
        for i in range(0, len(all_logs), chunk_size):
            chunk = all_logs[i:i + chunk_size]
            db.bulk_save_objects(chunk)
            db.commit()
            print(f"   ⚙️  Inserted {min(i + chunk_size, len(all_logs))}/{len(all_logs)} logs...")

        last_seed_id = db.query(func.max(AttendanceLog.id)).scalar()

        # ── 11. Save marker for cleanup ───────────────────────────
        marker = {
            "seed_tag": SEED_TAG,
            "student_id_prefix": STUDENT_ID_PREFIX,
            "first_log_id": first_seed_id,
            "last_log_id": last_seed_id,
            "log_count": len(all_logs),
            "subject_code": SUBJECT_CODE,
            "monday_class_id": monday_cls.id,
            "saturday_class_id": saturday_cls.id,
            "device_id": device.id,
            "seeded_at": datetime.now().isoformat(),
            "date_range": f"{SEMESTER_START} to {SEED_END}",
        }
        marker_path = os.path.join(os.path.dirname(__file__), ".seed_faculty_reports_marker.json")
        with open(marker_path, "w") as f:
            json.dump(marker, f, indent=2)

        # ── 12. Summary ───────────────────────────────────────────
        print("\n" + "=" * 65)
        print("✅  FACULTY REPORTS SEED COMPLETE")
        print("=" * 65)
        print(f"\n📊  Summary:")
        print(f"   • Faculty C:      {faculty.full_name}  ({FACULTY_EMAIL})")
        print(f"   • Monday Class:   ID={monday_cls.id}  08:00-11:00  {len(session_dates)} sessions")
        print(f"   • Saturday Class: ID={saturday_cls.id}  00:00-05:00  [LIVE TONIGHT]")
        print(f"   • Students:       {len(students)}  (section {SECTION})")
        print(f"   • Attendance logs: {len(all_logs)}  (IDs {first_seed_id}–{last_seed_id})")
        print(f"\n📝  Login to test:")
        print(f"   Faculty C: {FACULTY_EMAIL} / dela_cruz")
        print(f"\n🗓️  Dashboard — set date range:  2026-01-19  →  2026-03-28")
        print(f"   Select class: {SUBJECT_CODE} - {SECTION}")
        print(f"\n🟢  Live status tonight (Saturday):")
        print(f"   Class active 00:00–05:00, live logs already seeded")
        print(f"\n🧹  To clean up: python scripts/seed_faculty_reports_cleanup.py")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"\n❌  ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
