"""
FRAMES Attendance Seed Cleanup — Removes Report Demo Data
==========================================================
Removes all attendance_logs inserted by seed_attendance_reports.py.
Uses the ID range recorded in .seed_attendance_marker.json.

HOW TO RUN (from backend/ directory):
    python scripts/seed_attendance_reports_cleanup.py

SAFETY:
    Only deletes seeded data by ID range. Real kiosk logs are preserved.
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.attendance_log import AttendanceLog


def cleanup():
    """Remove all seeded attendance logs using the marker file."""
    print("=" * 65)
    print("  FRAMES Attendance Seed Cleanup")
    print("=" * 65)

    marker_path = os.path.join(os.path.dirname(__file__), ".seed_attendance_marker.json")

    if not os.path.exists(marker_path):
        print("\n  No seed marker found at:")
        print(f"    {marker_path}")
        print("  Nothing to clean up.")
        return

    with open(marker_path, "r") as f:
        marker = json.load(f)

    first_id = marker["first_id"]
    last_id = marker["last_id"]
    expected_count = marker["count"]

    print(f"\n  Marker found:")
    print(f"    ID range: {first_id} — {last_id}")
    print(f"    Expected rows: {expected_count}")
    print(f"    Seeded at: {marker['seeded_at']}")

    db = SessionLocal()

    try:
        deleted = db.query(AttendanceLog).filter(
            AttendanceLog.id >= first_id,
            AttendanceLog.id <= last_id,
        ).delete(synchronize_session=False)

        db.commit()

        # Remove marker file
        os.remove(marker_path)

        print(f"\n  Removed {deleted} seeded attendance logs")
        print(f"  Marker file deleted")
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
    cleanup()
