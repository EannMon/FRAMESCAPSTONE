"""
Seed Live Status Data - Creates classes, enrollments, and today's attendance logs
for testing the Live Status dot visualization on Faculty/DeptHead dashboards.

Run: python scripts/seed_live_status.py
Clean: python scripts/seed_live_status.py --clean
"""
import sys
import os
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from sqlalchemy import text
from db.database import SessionLocal
from models.user import User, UserRole, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction

SEED_TAG = "LIVESTATUS_SEED"


def reset_sequences(db):
    """Reset all PK sequences to avoid conflicts."""
    tables = ['subjects', 'classes', 'users', 'enrollments', 'attendance_logs']
    for t in tables:
        try:
            db.execute(text(f"SELECT setval('{t}_id_seq', (SELECT COALESCE(MAX(id),0) FROM {t}))"))
        except Exception:
            pass
    db.commit()


def get_or_create_subject(db, code, title, units):
    """Safely get or create a subject."""
    sub = db.query(Subject).filter(Subject.code == code).first()
    if sub:
        return sub
    sub = Subject(code=code, title=title, units=units)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def get_or_create_student(db, first, last, idx, dept_id):
    """Safely get or create a student."""
    import bcrypt
    tupm_id = f"TUPM-22-{1001 + idx}"
    student = db.query(User).filter(User.tupm_id == tupm_id).first()
    if student:
        return student
    pw = bcrypt.hashpw(last.lower().encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')
    student = User(
        email=f"{first.lower()}.{last.lower()}@tup.edu.ph",
        password_hash=pw,
        tupm_id=tupm_id,
        role=UserRole.STUDENT,
        verification_status=VerificationStatus.VERIFIED,
        face_registered=True,
        first_name=first,
        last_name=last,
        section=f"BSIT-4{chr(65 + (idx % 4))}",
        department_id=dept_id,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def seed_live_status():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("🟢 Seeding Live Status Test Data")
        print("=" * 60)
        
        today_name = datetime.now().strftime('%A')
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        print(f"\n📅 Today is: {today_name}")

        # Fix sequences first
        print("\n🔧 Resetting DB sequences...")
        reset_sequences(db)

        # Get faculty
        faculty_users = db.query(User).filter(
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
            User.verification_status == VerificationStatus.VERIFIED
        ).all()

        if not faculty_users:
            print("❌ No verified faculty! Run seed_data.py first.")
            return

        print(f"   Found {len(faculty_users)} faculty members")
        dept_id = faculty_users[0].department_id

        # Create subjects one by one with commits
        print("\n📚 Creating subjects...")
        subjects_data = [
            ("IT 326", "Capstone Project 2", 3),
            ("IT 322", "Info Assurance & Security", 3),
        ]
        subjects = []
        for code, title, units in subjects_data:
            sub = get_or_create_subject(db, code, title, units)
            subjects.append(sub)
            print(f"   ✅ Subject: {code} (ID: {sub.id})")

        # Reset sequences again after subjects
        reset_sequences(db)

        # Create classes — assign Room 326 to Mendoza specifically, 322 to Santos
        print("\n🏫 Creating today's classes...")
        rooms = ["Room 326", "Room 322"]
        
        # Find Pedro Mendoza and Ricardo Cruz Santos specifically
        mendoza = next((f for f in faculty_users if f.last_name == "Mendoza"), None)
        santos = next((f for f in faculty_users if f.last_name == "Santos"), None)
        
        # Enforce same department so Dept Head sees both classes
        if mendoza and santos and mendoza.department_id != santos.department_id:
            print(f"\n🔄 Syncing department IDs for {mendoza.last_name} and {santos.last_name}...")
            santos.department_id = mendoza.department_id
            db.commit()
            db.refresh(santos)

        # Fallback faculty assignments
        faculty_assignments = [
            mendoza or faculty_users[0],   # Room 326 -> Mendoza
            santos or faculty_users[-1],   # Room 322 -> Head (Santos)
        ]
        
        created_classes = []
        
        for i, (sub, room) in enumerate(zip(subjects, rooms)):
            fac = faculty_assignments[i]
            
            existing = db.query(Class).filter(
                Class.subject_id == sub.id,
                Class.day_of_week == today_name,
                Class.room == room,
            ).first()

            if existing:
                # Update faculty assignment if changed
                if existing.faculty_id != fac.id:
                    existing.faculty_id = fac.id
                    db.commit()
                    print(f"   🔄 Updated: {sub.code} in {room} -> {fac.full_name}")
                else:
                    print(f"   ⚡ Exists: {sub.code} in {room}")
                created_classes.append(existing)
                continue

            now = datetime.now()
            start_dt = now - timedelta(hours=1)
            end_dt = now + timedelta(hours=1)

            cls = Class(
                subject_id=sub.id,
                faculty_id=fac.id,
                room=room,
                day_of_week=today_name,
                start_time=start_dt.time(),
                end_time=end_dt.time(),
                section=f"BSIT-4{chr(65 + i)}",
                semester="1st Semester",
                academic_year="2025-2026"
            )
            db.add(cls)
            db.commit()
            db.refresh(cls)
            created_classes.append(cls)
            print(f"   ✅ Class: {sub.code} in {room} ({today_name}) -> {fac.full_name}")

        # Reset sequences
        reset_sequences(db)

        # Create students
        print("\n👨‍🎓 Creating students...")
        student_names = [
            ("Ana", "Martinez"), ("Carlos", "Rivera"), ("Diana", "Cruz"),
            ("Edgar", "Lim"), ("Fatima", "Santos"), ("Gabriel", "Tan"),
            ("Hannah", "Gomez"), ("Ivan", "Aquino"), ("Julia", "Castro"),
            ("Kevin", "Ramos"), ("Luna", "Bautista"), ("Marco", "Villanueva"),
            ("Nina", "Soriano"), ("Oscar", "Diaz"), ("Patricia", "Ferrer"),
            ("Rafael", "Manalo"), ("Sofia", "Pascual"), ("Tomas", "Alvarez"),
            ("Uriel", "Navarro"), ("Victoria", "Jimenez"),
        ]
        students = []
        for idx, (first, last) in enumerate(student_names):
            s = get_or_create_student(db, first, last, idx, dept_id)
            students.append(s)
        print(f"   ✅ {len(students)} students ready")
        reset_sequences(db)

        # Enroll students
        print("\n📋 Enrolling students...")
        for cls_idx, cls in enumerate(created_classes):
            class_students = students[cls_idx * 10: (cls_idx + 1) * 10]
            for student in class_students:
                exists = db.query(Enrollment).filter(
                    Enrollment.class_id == cls.id,
                    Enrollment.student_id == student.id
                ).first()
                if not exists:
                    db.add(Enrollment(class_id=cls.id, student_id=student.id))
            db.commit()
            print(f"   ✅ {len(class_students)} students -> class {cls.id} ({subjects[cls_idx].code})")

        reset_sequences(db)

        # Clean today's seed logs
        print("\n🧹 Cleaning old seed logs...")
        deleted = db.query(AttendanceLog).filter(
            AttendanceLog.remarks == SEED_TAG,
            AttendanceLog.timestamp >= today_start
        ).delete()
        db.commit()
        print(f"   Removed {deleted} old seed logs")
        reset_sequences(db)

        # Create attendance logs
        print("\n🟢🟡 Creating attendance logs...")
        for cls_idx, cls in enumerate(created_classes):
            class_students = students[cls_idx * 10: (cls_idx + 1) * 10]
            sub = subjects[cls_idx]
            
            # Base log time is 1 hour ago based on our updated class start time
            base_time = datetime.now() - timedelta(hours=1)

            for s_idx, student in enumerate(class_students):
                roll = random.random()
                
                if roll < 0.6:
                    # Present
                    t = base_time + timedelta(minutes=random.randint(0, 15))
                    db.add(AttendanceLog(
                        user_id=student.id, class_id=cls.id,
                        action=AttendanceAction.ENTRY, timestamp=t,
                        is_late=(random.random() < 0.2), remarks=SEED_TAG
                    ))
                    print(f"      🟢 {student.first_name} {student.last_name} ENTRY ({sub.code})")
                
                elif roll < 0.85:
                    # On break
                    t1 = base_time + timedelta(minutes=random.randint(0, 10))
                    t2 = t1 + timedelta(minutes=random.randint(30, 60))
                    db.add(AttendanceLog(
                        user_id=student.id, class_id=cls.id,
                        action=AttendanceAction.ENTRY, timestamp=t1,
                        is_late=False, remarks=SEED_TAG
                    ))
                    db.add(AttendanceLog(
                        user_id=student.id, class_id=cls.id,
                        action=AttendanceAction.BREAK_OUT, timestamp=t2,
                        is_late=False, remarks=SEED_TAG
                    ))
                    print(f"      🟡 {student.first_name} {student.last_name} ON BREAK ({sub.code})")
                else:
                    print(f"      ⚪ {student.first_name} {student.last_name} ABSENT ({sub.code})")

            # Faculty entry
            fac = db.query(User).filter(User.id == cls.faculty_id).first()
            if fac:
                ft = base_time
                db.add(AttendanceLog(
                    user_id=fac.id, class_id=cls.id,
                    action=AttendanceAction.ENTRY, timestamp=ft,
                    is_late=False, remarks=SEED_TAG
                ))
                print(f"      🟢 Faculty {fac.full_name} ENTRY ({sub.code})")

            db.commit()

        print("\n" + "=" * 60)
        print("✅ LIVE STATUS SEED COMPLETE!")
        print("=" * 60)
        print(f"\n🔑 Login as faculty to test:")
        for fac in faculty_users[:3]:
            print(f"   {fac.email} / {fac.last_name.lower().replace(' ', '_')}")
        heads = [u for u in faculty_users if u.role == UserRole.HEAD]
        if heads:
            print(f"\n🔑 Login as HEAD:")
            for h in heads:
                print(f"   {h.email} / {h.last_name.lower()}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def clean_seed():
    db = SessionLocal()
    try:
        print("🧹 Cleaning Live Status seed data...")
        count = db.query(AttendanceLog).filter(AttendanceLog.remarks == SEED_TAG).delete()
        db.commit()
        print(f"   ✅ Removed {count} attendance logs")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--clean":
        clean_seed()
    else:
        seed_live_status()
