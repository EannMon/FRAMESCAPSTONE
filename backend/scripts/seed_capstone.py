"""
FRAMES Capstone Seed Script - Full Scenario Data
=================================================
Seeds a realistic Capstone Project 2 scenario on top of the existing
departments/programs/faculty already in the DB.

What this seeds:
  - 1 Device (kiosk in Room CL1 / Room 326)
  - 4 Subjects (Capstone 2 subjects for BSIT 4th year)
  - 4 Classes (one per subject, taught by existing faculty, section BSIT-4A)
  - 10 Students (BSIT-4A, enrolled in all 4 classes)
  - 40 Enrollments (10 students x 4 classes)
  - ~2 weeks of attendance logs per class (realistic ENTRY/BREAK_OUT/BREAK_IN/EXIT)

Safe to run multiple times — checks for existing seed data by tupm_id prefix.
Run the companion seed_capstone_cleanup.py to remove all seeded data.

HOW TO RUN (from the backend/ directory):
  python scripts/seed_capstone.py

LOGIN CREDENTIALS (all students):
  Password = lastname (lowercase, underscores for spaces)
  e.g., student juan.dela_rosa@tup.edu.ph  → password: dela_rosa
"""

import sys
import os
import bcrypt
from datetime import datetime, date, timedelta, time as dt_time
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.user import User, UserRole, VerificationStatus
from models.subject import Subject
from models.class_ import Class
from models.enrollment import Enrollment
from models.device import Device, DeviceStatus
from models.attendance_log import AttendanceLog, AttendanceAction, VerifiedBy

# ─────────────────────────────────────────────
# CONFIG — tweak these if your DB already has
# different faculty emails
# ─────────────────────────────────────────────
SEED_TAG = "SEED-CAP2"          # Prefix used in tupm_id for easy cleanup
FACULTY_EMAIL = "maria.dela_cruz@tup.edu.ph"   # Must exist from seed_data.py
HEAD_EMAIL    = "head.santos@tup.edu.ph"        # Must exist from seed_data.py
ROOM = "326"                    # Classroom used for the seed classes
ACADEMIC_YEAR = "2025-2026"
SEMESTER = "2nd Semester"
SECTION = "BSIT-4A"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def minutes_to_time(h: int, m: int) -> dt_time:
    return dt_time(h, m, 0)


def seed_capstone():
    print("=" * 65)
    print("🌱  FRAMES Capstone Seed — Full Scenario")
    print("=" * 65)

    db = SessionLocal()

    try:
        # ─────────────────────────────────────────────
        # 0. PREFLIGHT: find existing faculty/dept
        # ─────────────────────────────────────────────
        faculty = db.query(User).filter(User.email == FACULTY_EMAIL).first()
        if not faculty:
            print(f"\n❌  Faculty user '{FACULTY_EMAIL}' not found.")
            print("    Please run  scripts/seed_data.py  first, then re-run this script.")
            return

        head = db.query(User).filter(User.email == HEAD_EMAIL).first()

        dept_id = faculty.department_id
        prog_id = faculty.program_id

        print(f"\n✅  Found faculty: {faculty.full_name} (dept_id={dept_id})")

        # ─────────────────────────────────────────────
        # 1. DEVICE
        # ─────────────────────────────────────────────
        print(f"\n🖥️   Creating/finding device in Room {ROOM}...")
        device = db.query(Device).filter(Device.room == ROOM).first()
        if not device:
            device = Device(
                room=ROOM,
                ip_address="192.168.1.101",
                device_name=f"KIOSK-{ROOM}",
                status=DeviceStatus.ACTIVE,
                room_capacity=40,
            )
            db.add(device)
            db.flush()
            print(f"   ✅  Device created: {device.device_name} (ID: {device.id})")
        else:
            print(f"   ℹ️   Device already exists: {device.device_name} (ID: {device.id})")

        # ─────────────────────────────────────────────
        # 2. SUBJECTS (Capstone 2 curriculum)
        # ─────────────────────────────────────────────
        print("\n📚  Creating subjects...")

        subjects_data = [
            {"code": "IT401", "title": "Capstone Project 2",         "units": 3},
            {"code": "IT402", "title": "Information Assurance & Security", "units": 3},
            {"code": "IT403", "title": "Systems Integration & Architecture", "units": 3},
            {"code": "IT404", "title": "Technopreneurship",           "units": 3},
        ]

        subjects = {}
        for sd in subjects_data:
            existing = db.query(Subject).filter(Subject.code == sd["code"]).first()
            if existing:
                subjects[sd["code"]] = existing
                print(f"   ℹ️   Subject exists: {sd['code']}")
            else:
                subj = Subject(code=sd["code"], title=sd["title"], units=sd["units"])
                db.add(subj)
                db.flush()
                subjects[sd["code"]] = subj
                print(f"   ✅  Created: {sd['code']} – {sd['title']}")

        # ─────────────────────────────────────────────
        # 3. CLASSES (one per subject, BSIT-4A)
        # ─────────────────────────────────────────────
        print("\n🗓️   Creating classes...")

        classes_data = [
            {"subject_code": "IT401", "day": "Monday",    "start": (7, 30),  "end": (10, 30)},
            {"subject_code": "IT402", "day": "Tuesday",   "start": (10, 30), "end": (13, 30)},
            {"subject_code": "IT403", "day": "Thursday",  "start": (7, 30),  "end": (10, 30)},
            {"subject_code": "IT404", "day": "Friday",    "start": (13, 0),  "end": (16, 0)},
        ]

        classes = {}
        for cd in classes_data:
            subj = subjects[cd["subject_code"]]
            existing_cls = db.query(Class).filter(
                Class.subject_id == subj.id,
                Class.section == SECTION,
                Class.day_of_week == cd["day"],
                Class.semester == SEMESTER,
                Class.academic_year == ACADEMIC_YEAR,
            ).first()

            if existing_cls:
                classes[cd["subject_code"]] = existing_cls
                print(f"   ℹ️   Class exists: {cd['subject_code']} {cd['day']}")
            else:
                cls = Class(
                    subject_id=subj.id,
                    faculty_id=faculty.id,
                    room=ROOM,
                    day_of_week=cd["day"],
                    start_time=minutes_to_time(*cd["start"]),
                    end_time=minutes_to_time(*cd["end"]),
                    section=SECTION,
                    semester=SEMESTER,
                    academic_year=ACADEMIC_YEAR,
                    late_threshold_minutes=15,
                )
                db.add(cls)
                db.flush()
                classes[cd["subject_code"]] = cls
                print(f"   ✅  Class: {subj.code} | {cd['day']} {cd['start'][0]:02d}:{cd['start'][1]:02d}–{cd['end'][0]:02d}:{cd['end'][1]:02d} | Room {ROOM}")

        # ─────────────────────────────────────────────
        # 4. STUDENTS (10 BSIT-4A students)
        # ─────────────────────────────────────────────
        print("\n🎓  Creating students...")

        students_data = [
            {"first": "Juan",     "last": "Dela Rosa",   "mid": "M",  "id_suffix": "001"},
            {"first": "Maria",    "last": "Cruz",        "mid": "A",  "id_suffix": "002"},
            {"first": "Jose",     "last": "Reyes",       "mid": "B",  "id_suffix": "003"},
            {"first": "Ana",      "last": "Santos",      "mid": "L",  "id_suffix": "004"},
            {"first": "Carlos",   "last": "Garcia",      "mid": "P",  "id_suffix": "005"},
            {"first": "Liza",     "last": "Torres",      "mid": "R",  "id_suffix": "006"},
            {"first": "Mark",     "last": "Villanueva",  "mid": "C",  "id_suffix": "007"},
            {"first": "Sofia",    "last": "Bautista",    "mid": "E",  "id_suffix": "008"},
            {"first": "Rico",     "last": "Mendoza",     "mid": "F",  "id_suffix": "009"},
            {"first": "Camille",  "last": "Aquino",      "mid": "G",  "id_suffix": "010"},
        ]

        students = []
        for sd in students_data:
            tupm_id = f"{SEED_TAG}-{sd['id_suffix']}"
            email = f"{sd['first'].lower()}.{sd['last'].lower().replace(' ', '_')}@tup.edu.ph"
            password = sd["last"].lower().replace(" ", "_")

            existing = db.query(User).filter(User.tupm_id == tupm_id).first()
            if existing:
                students.append(existing)
                print(f"   ℹ️   Student exists: {existing.full_name}")
            else:
                student = User(
                    email=email,
                    password_hash=hash_password(password),
                    tupm_id=tupm_id,
                    role=UserRole.STUDENT,
                    verification_status=VerificationStatus.VERIFIED,
                    face_registered=True,
                    first_name=sd["first"],
                    last_name=sd["last"],
                    middle_name=sd["mid"],
                    department_id=dept_id,
                    program_id=prog_id,
                    section=SECTION,
                )
                db.add(student)
                db.flush()
                students.append(student)
                print(f"   ✅  Student: {student.full_name} | {email} | pw: {password}")

        # ─────────────────────────────────────────────
        # 5. ENROLLMENTS
        # ─────────────────────────────────────────────
        print("\n📋  Creating enrollments...")
        enroll_count = 0
        for student in students:
            for cls in classes.values():
                existing_enroll = db.query(Enrollment).filter(
                    Enrollment.class_id == cls.id,
                    Enrollment.student_id == student.id
                ).first()
                if not existing_enroll:
                    db.add(Enrollment(class_id=cls.id, student_id=student.id))
                    enroll_count += 1
        db.flush()
        print(f"   ✅  Created {enroll_count} enrollments ({len(students)} students × {len(classes)} classes)")

        # ─────────────────────────────────────────────
        # 6. ATTENDANCE LOGS (2 weeks of history)
        # ─────────────────────────────────────────────
        print("\n📊  Generating attendance logs (2 weeks)...")

        # Map day names to weekday numbers (Mon=0 … Sun=6)
        DAY_MAP = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2,
            "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6
        }

        today = date.today()
        # Go back 14 days from today
        start_date = today - timedelta(days=14)

        log_count = 0

        for subject_code, cls in classes.items():
            target_weekday = DAY_MAP[cls.day_of_week]
            class_start = cls.start_time
            class_end = cls.end_time

            # Find all dates in the past 2 weeks that match the class weekday
            session_dates = []
            for delta in range(14):
                d = start_date + timedelta(days=delta)
                if d.weekday() == target_weekday and d < today:
                    session_dates.append(d)

            for session_date in session_dates:
                for student in students:
                    # Realistic absence rate: 85% attendance
                    if random.random() < 0.15:
                        continue  # absent — no log

                    # Check if log already exists for this student+class+date
                    existing_log = db.query(AttendanceLog).filter(
                        AttendanceLog.user_id == student.id,
                        AttendanceLog.class_id == cls.id,
                    ).filter(
                        AttendanceLog.timestamp >= datetime.combine(session_date, dt_time.min),
                        AttendanceLog.timestamp <= datetime.combine(session_date, dt_time.max),
                    ).first()

                    if existing_log:
                        continue

                    # ENTRY time: class start + 0–20 min (some late)
                    late_offset = random.randint(0, 20)
                    entry_dt = datetime.combine(session_date, class_start) + timedelta(minutes=late_offset)
                    is_late = late_offset > 15

                    entry_log = AttendanceLog(
                        user_id=student.id,
                        class_id=cls.id,
                        device_id=device.id,
                        action=AttendanceAction.ENTRY,
                        verified_by=VerifiedBy.FACE,
                        is_late=is_late,
                        confidence_score=round(random.uniform(0.75, 0.99), 3),
                        timestamp=entry_dt,
                        remarks="[LATE by {} min]".format(late_offset - 15) if is_late else None,
                    )
                    db.add(entry_log)
                    log_count += 1

                    # 60% chance they also do a break cycle
                    if random.random() < 0.6:
                        # BREAK_OUT ~1 hr into class
                        break_out_dt = entry_dt + timedelta(minutes=random.randint(55, 75))
                        db.add(AttendanceLog(
                            user_id=student.id,
                            class_id=cls.id,
                            device_id=device.id,
                            action=AttendanceAction.BREAK_OUT,
                            verified_by=VerifiedBy.FACE_GESTURE,
                            is_late=False,
                            confidence_score=round(random.uniform(0.80, 0.99), 3),
                            gesture_detected="PEACE_SIGN",
                            timestamp=break_out_dt,
                        ))
                        log_count += 1

                        # BREAK_IN ~10–15 min later
                        break_in_dt = break_out_dt + timedelta(minutes=random.randint(10, 15))
                        db.add(AttendanceLog(
                            user_id=student.id,
                            class_id=cls.id,
                            device_id=device.id,
                            action=AttendanceAction.BREAK_IN,
                            verified_by=VerifiedBy.FACE_GESTURE,
                            is_late=False,
                            confidence_score=round(random.uniform(0.80, 0.99), 3),
                            gesture_detected="THUMBS_UP",
                            timestamp=break_in_dt,
                        ))
                        log_count += 1

                    # EXIT near end of class
                    class_end_dt = datetime.combine(session_date, class_end)
                    exit_dt = class_end_dt - timedelta(minutes=random.randint(0, 10))
                    db.add(AttendanceLog(
                        user_id=student.id,
                        class_id=cls.id,
                        device_id=device.id,
                        action=AttendanceAction.EXIT,
                        verified_by=VerifiedBy.FACE_GESTURE,
                        is_late=False,
                        confidence_score=round(random.uniform(0.80, 0.99), 3),
                        gesture_detected="OPEN_PALM",
                        timestamp=exit_dt,
                    ))
                    log_count += 1

        db.commit()

        print(f"   ✅  Generated {log_count} attendance log entries")
        print("\n" + "=" * 65)
        print("✅  CAPSTONE SEED COMPLETE")
        print("=" * 65)
        print("\n📊  Summary:")
        print(f"   • Device:      Room {ROOM}")
        print(f"   • Subjects:    {', '.join(subjects.keys())}")
        print(f"   • Classes:     {len(classes)} (section {SECTION}, {ACADEMIC_YEAR})")
        print(f"   • Students:    {len(students)}")
        print(f"   • Enrollments: {len(students) * len(classes)}")
        print(f"   • Attn Logs:   {log_count} (2 weeks of history)")
        print("\n📝  Student logins (email / password = lastname):")
        for sd in students_data:
            email = f"{sd['first'].lower()}.{sd['last'].lower().replace(' ', '_')}@tup.edu.ph"
            pw    = sd["last"].lower().replace(" ", "_")
            print(f"   {email:<45} / {pw}")
        print(f"\n🧹  To clean up: python scripts/seed_capstone_cleanup.py")
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
    seed_capstone()
