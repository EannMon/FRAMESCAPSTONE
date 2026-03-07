"""
Seed Script: Test Kiosk Schedule for Pedro Mendoza
Run: python scripts/seed_kiosk_test.py
Clean: python scripts/seed_kiosk_test.py --clean
Verify: python scripts/seed_kiosk_test.py --verify
"""
import sys
import os
from datetime import time, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.user import User
from models.subject import Subject
from models.class_ import Class
from models.device import Device, DeviceStatus

TEST_SUBJECT_CODE = "IT314-TEST"
TEST_ROOM = "CL1"


def seed_kiosk_test():
    db = SessionLocal()
    try:
        today = datetime.now().strftime("%A")
        now = datetime.now().strftime("%H:%M")
        print(f"📅 Today is: {today}, Current time: {now}")

        # 1. Find Pedro Mendoza
        pedro = db.query(User).filter(User.email == "pedro.mendoza@tup.edu.ph").first()
        if not pedro:
            print("❌ Pedro Mendoza not found! Run seed_data.py first.")
            return
        print(f"✅ Found faculty: {pedro.full_name} (ID: {pedro.id})")

        # 2. Create or find test subject
        subject = db.query(Subject).filter(Subject.code == TEST_SUBJECT_CODE).first()
        if not subject:
            subject = Subject(code=TEST_SUBJECT_CODE, title="Web Development", units=3)
            db.add(subject)
            db.flush()
            print(f"✅ Created subject: {subject.code} - {subject.title} (ID: {subject.id})")
        else:
            print(f"✅ Subject exists: {subject.code} (ID: {subject.id})")

        # 3. Delete any existing test classes for this subject, then create fresh
        old_classes = db.query(Class).filter(Class.subject_id == subject.id).all()
        for old in old_classes:
            db.delete(old)
        if old_classes:
            db.flush()
            print(f"🗑️  Deleted {len(old_classes)} old test class(es)")

        # Create class for TODAY, 9:30 AM to 2:00 PM
        start = time(9, 30, 0)
        end = time(14, 0, 0)
        test_class = Class(
            subject_id=subject.id,
            faculty_id=pedro.id,
            room=TEST_ROOM,
            day_of_week=today,
            start_time=start,
            end_time=end,
            section="BSIT-4A",
            semester="2nd Semester",
            academic_year="2025-2026",
            late_threshold_minutes=15
        )
        db.add(test_class)
        db.flush()
        print(f"✅ Created class: {subject.code} | {today} {start.strftime('%H:%M')}-{end.strftime('%H:%M')} | {TEST_ROOM} (ID: {test_class.id})")

        # 4. Ensure device with DEVICE_ID=1 exists and has room=CL1
        device_id = int(os.getenv("DEVICE_ID", "1"))
        device = db.query(Device).filter(Device.id == device_id).first()
        if device:
            # Update room to match
            if device.room != TEST_ROOM:
                device.room = TEST_ROOM
                print(f"✅ Updated device {device_id} room to {TEST_ROOM}")
            else:
                print(f"✅ Device exists: ID={device.id}, Room={device.room}, Name={device.device_name}")
        else:
            # No device with that ID — create one (might get different ID due to auto-increment)
            device = Device(
                room=TEST_ROOM,
                device_name="KIOSK-CL1",
                ip_address="192.168.1.100",
                status=DeviceStatus.ACTIVE,
                room_capacity=40
            )
            db.add(device)
            db.flush()
            if device.id != device_id:
                print(f"⚠️  Device created with ID={device.id} (not {device_id})")
                print(f"   👉 Set DEVICE_ID={device.id} when starting the kiosk server!")
            else:
                print(f"✅ Created device: ID={device.id}, Room={device.room}")

        db.commit()

        print("\n" + "=" * 50)
        print("✅ KIOSK TEST DATA SEEDED!")
        print("=" * 50)
        print(f"  Faculty:   {pedro.full_name} (ID: {pedro.id})")
        print(f"  Subject:   {subject.code} - {subject.title}")
        print(f"  Schedule:  {today} {start.strftime('%H:%M')} - {end.strftime('%H:%M')}")
        print(f"  Room:      {TEST_ROOM}")
        print(f"  Section:   BSIT-4A")
        print(f"  Device ID: {device.id} (use: set DEVICE_ID={device.id})")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def verify_kiosk_test():
    """Check what the kiosk server will see."""
    db = SessionLocal()
    try:
        now = datetime.now()
        today = now.strftime("%A")
        current_time = now.time()
        print(f"📅 Today: {today}, Time: {current_time.strftime('%H:%M:%S')}")

        # Check device
        device_id = int(os.getenv("DEVICE_ID", "1"))
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            print(f"❌ No device with ID={device_id}")
            all_devices = db.query(Device).all()
            for d in all_devices:
                print(f"   Found device: ID={d.id}, Room={d.room}, Name={d.device_name}")
            return
        print(f"✅ Device ID={device.id}, Room={device.room}")

        # Check classes in this room today
        classes = db.query(Class).filter(
            Class.room == device.room,
            Class.day_of_week == today
        ).all()

        if not classes:
            print(f"❌ No classes in room '{device.room}' on {today}")
            all_classes = db.query(Class).filter(Class.room == device.room).all()
            for c in all_classes:
                print(f"   Found class: {c.day_of_week} {c.start_time}-{c.end_time} (room={c.room})")
            return

        print(f"📋 Classes in {device.room} today ({today}):")
        for cls in classes:
            start = cls.start_time
            end = cls.end_time
            is_active = start <= current_time <= end
            status = "🟢 ACTIVE NOW" if is_active else "⚪ Not active"
            subj = db.query(Subject).filter(Subject.id == cls.subject_id).first()
            fac = db.query(User).filter(User.id == cls.faculty_id).first()
            print(f"   {status} | {subj.code if subj else '?'} | {start}-{end} | {fac.full_name if fac else '?'} | {cls.section}")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def clean_kiosk_test():
    db = SessionLocal()
    try:
        from models.attendance_log import AttendanceLog
        from models.enrollment import Enrollment

        subject = db.query(Subject).filter(Subject.code == TEST_SUBJECT_CODE).first()
        if subject:
            test_classes = db.query(Class).filter(Class.subject_id == subject.id).all()
            for cls in test_classes:
                db.query(AttendanceLog).filter(AttendanceLog.class_id == cls.id).delete()
                db.query(Enrollment).filter(Enrollment.class_id == cls.id).delete()
                db.delete(cls)
                print(f"🗑️  Deleted class {cls.id} ({cls.day_of_week} {cls.start_time}-{cls.end_time})")
            db.delete(subject)
            print(f"🗑️  Deleted subject {TEST_SUBJECT_CODE}")
        else:
            print("ℹ️  No test subject found")

        db.commit()
        print("✅ Cleaned up kiosk test data!")
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    if "--clean" in sys.argv:
        clean_kiosk_test()
    elif "--verify" in sys.argv:
        verify_kiosk_test()
    else:
        seed_kiosk_test()
