"""Reset devices table: delete IDs 2 and 3, reset sequence, re-seed ID=1"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # Delete devices 2 and 3
    db.execute(text("DELETE FROM devices WHERE id IN (2, 3)"))
    # Reset sequence to 1
    db.execute(text("ALTER SEQUENCE devices_id_seq RESTART WITH 1"))
    db.commit()
    print("✅ Deleted devices 2 & 3, reset sequence to 1")

    # Verify it's empty
    result = db.execute(text("SELECT id, room, device_name FROM devices")).fetchall()
    if result:
        for r in result:
            print(f"   Remaining: ID={r[0]}, Room={r[1]}, Name={r[2]}")
    else:
        print("   Table empty — ready for fresh seed")
except Exception as e:
    db.rollback()
    print(f"❌ ERROR: {e}")
finally:
    db.close()
