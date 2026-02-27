"""
Diagnostic: Check enrollment data for a user/class and clean duplicate logs.
Usage: python scripts/check_enrollment.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.enrollment import Enrollment
from models.class_ import Class
from models.user import User
from models.attendance_log import AttendanceLog

USER_ID = 47
CLASS_ID = 3

db = SessionLocal()

try:
    # 1. Check user
    user = db.query(User).filter(User.id == USER_ID).first()
    if user:
        print(f"✅ User {USER_ID}: {user.first_name} {user.last_name} (role={user.role})")
    else:
        print(f"❌ User {USER_ID} NOT FOUND")

    # 2. Check class
    cls = db.query(Class).filter(Class.id == CLASS_ID).first()
    if cls:
        print(f"✅ Class {CLASS_ID}: faculty_id={cls.faculty_id}, room={cls.room}, section={cls.section}")
        is_faculty = cls.faculty_id == USER_ID
        print(f"   Is faculty? {is_faculty}")
    else:
        print(f"❌ Class {CLASS_ID} NOT FOUND")

    # 3. Check enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == USER_ID,
        Enrollment.class_id == CLASS_ID
    ).first()
    if enrollment:
        print(f"✅ Enrollment found: student_id={enrollment.student_id}, class_id={enrollment.class_id}")
    else:
        print(f"⚠️ No enrollment for user {USER_ID} in class {CLASS_ID}")

    # 4. List ALL enrollments for this class
    all_enrollments = db.query(Enrollment).filter(Enrollment.class_id == CLASS_ID).all()
    print(f"\n📋 All enrollments for class {CLASS_ID}: ({len(all_enrollments)} students)")
    for e in all_enrollments:
        s = db.query(User).filter(User.id == e.student_id).first()
        name = f"{s.first_name} {s.last_name}" if s else "?"
        print(f"   - student_id={e.student_id}: {name}")

    # 5. Count today's attendance logs for this user+class
    from datetime import datetime, timedelta
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == USER_ID,
        AttendanceLog.class_id == CLASS_ID,
        AttendanceLog.timestamp >= today_start,
        AttendanceLog.timestamp < today_end
    ).order_by(AttendanceLog.timestamp).all()
    
    print(f"\n📊 Today's logs for user {USER_ID}, class {CLASS_ID}: {len(logs)} entries")
    for log in logs:
        print(f"   [{log.id}] {log.action} @ {log.timestamp} | remarks: {log.remarks}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
