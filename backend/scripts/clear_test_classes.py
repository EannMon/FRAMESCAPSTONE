"""
Script to clear ONLY Class, Enrollment, and Subject data for testing.
Preserves Users and Departments.
"""
import sys
import os
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal

def clear_testing_data():
    print("\n🧹 Cleaning Schedule, Enrollment, and Subject data...")
    print("   (Users and Departments will remain intact)\n")
    
    db = SessionLocal()
    try:
        # Tables to clear in order of dependency
        tables_to_clear = [
            "attendance_logs",  # Logs depend on classes
            "enrollments",      # Enrollments depend on classes/users
            "classes",          # Classes depend on subjects/faculty
            "subjects",         # Subjects are created during upload
            "audit_logs"        # Clear history too so you can see new filenames
        ]
        
        for table in tables_to_clear:
            try:
                # Use TRUNCATE with CASCADE for PostgreSQL if possible, 
                # or just DELETE if we want to be safe with standard SQL.
                # DELETE is safer here to avoid permission issues with TRUNCATE in some cloud setups.
                result = db.execute(text(f"DELETE FROM {table}"))
                db.commit()
                print(f"   ✓ Cleared {table}")
            except Exception as e:
                db.rollback()
                print(f"   ⚠ Could not clear {table}: {e}")
        
        print("\n✨ SUCCESS! Classes and related data have been cleared.")
        print("   You can now test your PDF uploads with a fresh slate.")
        
    except Exception as e:
        print(f"\n❌ Critical Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_testing_data()
