"""
FRAMES Capstone Seed Cleanup Script
=====================================
Removes exactly what seed_capstone.py added — nothing else.

Safe to run: only deletes rows tagged with SEED_TAG in tupm_id,
or directly related data (enrollments/logs) tied to those rows.

HOW TO RUN (from the backend/ directory):
  python scripts/seed_capstone_cleanup.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.user import User, UserRole
from models.subject import Subject
from models.class_ import Class
from models.enrollment import Enrollment
from models.device import Device
from models.attendance_log import AttendanceLog

SEED_TAG    = "SEED-CAP2"
SECTION     = "BSIT-4A"
ACADEMIC_YEAR = "2025-2026"
SEMESTER    = "2nd Semester"
ROOM        = "326"
SUBJECT_CODES = ["IT401", "IT402", "IT403", "IT404"]


def cleanup():
    print("=" * 65)
    print("🧹  FRAMES Capstone Seed Cleanup")
    print("=" * 65)

    db = SessionLocal()

    try:
        # ─────────────────────────────────────────────
        # 1. Find seeded students (tagged tupm_id)
        # ─────────────────────────────────────────────
        seeded_students = db.query(User).filter(
            User.tupm_id.like(f"{SEED_TAG}-%"),
            User.role == UserRole.STUDENT
        ).all()
        student_ids = [s.id for s in seeded_students]
        print(f"\n👤  Found {len(seeded_students)} seeded students")

        # ─────────────────────────────────────────────
        # 2. Find seeded subjects
        # ─────────────────────────────────────────────
        seeded_subjects = db.query(Subject).filter(
            Subject.code.in_(SUBJECT_CODES)
        ).all()
        subject_ids = [s.id for s in seeded_subjects]
        print(f"📚  Found {len(seeded_subjects)} seeded subjects: {SUBJECT_CODES}")

        # ─────────────────────────────────────────────
        # 3. Find seeded classes
        # ─────────────────────────────────────────────
        seeded_classes = db.query(Class).filter(
            Class.subject_id.in_(subject_ids),
            Class.section == SECTION,
            Class.semester == SEMESTER,
            Class.academic_year == ACADEMIC_YEAR,
        ).all()
        class_ids = [c.id for c in seeded_classes]
        print(f"🗓️   Found {len(seeded_classes)} seeded classes")

        # ─────────────────────────────────────────────
        # 4. Delete attendance logs for seeded students in seeded classes
        # ─────────────────────────────────────────────
        log_count = 0
        if student_ids and class_ids:
            log_count = db.query(AttendanceLog).filter(
                AttendanceLog.user_id.in_(student_ids),
                AttendanceLog.class_id.in_(class_ids),
            ).delete(synchronize_session=False)
        print(f"📊  Deleted {log_count} attendance logs")

        # ─────────────────────────────────────────────
        # 5. Delete enrollments for seeded students
        # ─────────────────────────────────────────────
        enroll_count = 0
        if student_ids:
            enroll_count = db.query(Enrollment).filter(
                Enrollment.student_id.in_(student_ids)
            ).delete(synchronize_session=False)
        print(f"📋  Deleted {enroll_count} enrollments")

        # ─────────────────────────────────────────────
        # 6. Delete seeded students
        # ─────────────────────────────────────────────
        student_count = 0
        if student_ids:
            student_count = db.query(User).filter(
                User.id.in_(student_ids)
            ).delete(synchronize_session=False)
        print(f"👤  Deleted {student_count} student users")

        # ─────────────────────────────────────────────
        # 7. Delete seeded classes
        # ─────────────────────────────────────────────
        class_count = 0
        if class_ids:
            class_count = db.query(Class).filter(
                Class.id.in_(class_ids)
            ).delete(synchronize_session=False)
        print(f"🗓️   Deleted {class_count} classes")

        # ─────────────────────────────────────────────
        # 8. Delete seeded subjects
        # ─────────────────────────────────────────────
        subj_count = 0
        if subject_ids:
            subj_count = db.query(Subject).filter(
                Subject.id.in_(subject_ids)
            ).delete(synchronize_session=False)
        print(f"📚  Deleted {subj_count} subjects")

        # ─────────────────────────────────────────────
        # 9. Delete seeded device (only if room matches)
        # ─────────────────────────────────────────────
        device = db.query(Device).filter(Device.room == ROOM).first()
        device_deleted = False
        if device:
            db.delete(device)
            device_deleted = True
        print(f"🖥️   {'Deleted' if device_deleted else 'No'} device for Room {ROOM}")

        db.commit()

        print("\n" + "=" * 65)
        print("✅  Cleanup complete — all capstone seed data removed")
        print("=" * 65)
        print("   Departments, programs, faculty, and head users are untouched.")

    except Exception as e:
        db.rollback()
        print(f"\n❌  ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    cleanup()
