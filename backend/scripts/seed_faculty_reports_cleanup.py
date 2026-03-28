"""
FRAMES Faculty Reports Seed Cleanup
=====================================
Removes ONLY what seed_faculty_reports.py added — nothing else.

Deletes (in dependency order):
  1. attendance_logs  tagged with [SEED-FACULTY-RPT] (by ID range from marker)
  2. enrollments      for seeded students in seeded classes
  3. seeded students  (tupm_id LIKE 'SEED-FAC-RPT-%')
  4. seeded classes   (monday + saturday, IDs from marker)
  5. seeded subject   (IT-SRP401) — only if no other classes reference it
  6. seeded device    (Room 325) — only if it was newly created by the seed

Does NOT touch: Faculty C, departments, programs, existing students, existing classes.

HOW TO RUN (from backend/ directory, venv active):
    python scripts/seed_faculty_reports_cleanup.py
"""

import sys, os, json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.user import User, UserRole
from models.subject import Subject
from models.class_ import Class
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog
from models.device import Device

STUDENT_ID_PREFIX = "SEED-FAC-RPT"
SUBJECT_CODE      = "IT-SRP401"
MARKER_PATH       = os.path.join(os.path.dirname(__file__), ".seed_faculty_reports_marker.json")


def cleanup():
    print("=" * 65)
    print("🧹  FRAMES Faculty Reports Seed Cleanup")
    print("=" * 65)

    if not os.path.exists(MARKER_PATH):
        print("\n⚠️  No marker file found at:")
        print(f"    {MARKER_PATH}")
        print("  Nothing to clean up (or already cleaned).")
        return

    with open(MARKER_PATH, "r") as f:
        marker = json.load(f)

    first_id       = marker["first_log_id"]
    last_id        = marker["last_log_id"]
    monday_cls_id  = marker.get("monday_class_id")
    saturday_cls_id= marker.get("saturday_class_id")
    device_id      = marker.get("device_id")

    print(f"\n  Marker: log IDs {first_id}–{last_id}")
    print(f"  Classes: Monday={monday_cls_id}, Saturday={saturday_cls_id}")
    print(f"  Seeded at: {marker.get('seeded_at')}")

    db = SessionLocal()
    try:
        # 1. Delete attendance logs by ID range
        log_del = db.query(AttendanceLog).filter(
            AttendanceLog.id >= first_id,
            AttendanceLog.id <= last_id,
        ).delete(synchronize_session=False)
        print(f"\n  📊  Deleted {log_del} attendance logs (IDs {first_id}–{last_id})")

        # 2. Find seeded students
        seeded_students = db.query(User).filter(
            User.tupm_id.like(f"{STUDENT_ID_PREFIX}-%"),
            User.role == UserRole.STUDENT,
        ).all()
        student_ids = [s.id for s in seeded_students]
        print(f"\n  👤  Found {len(seeded_students)} seeded students")

        # 3. Delete enrollments for seeded students
        class_ids_to_clean = [c for c in [monday_cls_id, saturday_cls_id] if c]
        enroll_del = 0
        if student_ids:
            enroll_del = db.query(Enrollment).filter(
                Enrollment.student_id.in_(student_ids),
            ).delete(synchronize_session=False)
        print(f"  📋  Deleted {enroll_del} enrollments")

        # 4. Delete seeded students
        stu_del = 0
        if student_ids:
            stu_del = db.query(User).filter(
                User.id.in_(student_ids),
            ).delete(synchronize_session=False)
        print(f"  👤  Deleted {stu_del} student users")

        # 5. Delete seeded classes
        cls_del = 0
        if class_ids_to_clean:
            cls_del = db.query(Class).filter(
                Class.id.in_(class_ids_to_clean),
            ).delete(synchronize_session=False)
        print(f"  🗓️   Deleted {cls_del} classes (Monday + Saturday)")

        # 6. Delete subject if no other classes reference it
        subj = db.query(Subject).filter(Subject.code == SUBJECT_CODE).first()
        subj_del = 0
        if subj:
            remaining_classes = db.query(Class).filter(Class.subject_id == subj.id).count()
            if remaining_classes == 0:
                db.delete(subj)
                subj_del = 1
                print(f"  📚  Deleted subject {SUBJECT_CODE}")
            else:
                print(f"  📚  Subject {SUBJECT_CODE} kept ({remaining_classes} class(es) still reference it)")

        # 7. Delete device only if it was newly created by seed (check no other logs reference it)
        dev_del = 0
        if device_id:
            remaining_logs = db.query(AttendanceLog).filter(
                AttendanceLog.device_id == device_id
            ).count()
            if remaining_logs == 0:
                dev = db.query(Device).filter(Device.id == device_id).first()
                if dev:
                    db.delete(dev)
                    dev_del = 1
                    print(f"  🖥️   Deleted device ID={device_id} (no remaining logs)")
            else:
                print(f"  🖥️   Device ID={device_id} kept ({remaining_logs} logs still reference it)")

        db.commit()

        # Remove marker file
        os.remove(MARKER_PATH)
        print(f"\n  ✅  Marker file removed")

        print("\n" + "=" * 65)
        print("✅  Cleanup complete — all Faculty Reports seed data removed")
        print("=" * 65)
        print("   Faculty C, existing students, and real data are untouched.")
        print("   You can re-run the seed anytime:")
        print("     python scripts/seed_faculty_reports.py")

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
