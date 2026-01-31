"""
Database Initialization Script
Run this once to create all tables in PostgreSQL.
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import engine, Base

# Import all models to register them with SQLAlchemy
from models.department import Department
from models.program import Program
from models.user import User
from models.facial_profile import FacialProfile
from models.subject import Subject
from models.class_ import Class
from models.enrollment import Enrollment
from models.device import Device
from models.attendance_log import AttendanceLog


def init_database():
    """Create all tables in the database."""
    print("=" * 50)
    print("🗄️  FRAMES Database Initialization")
    print("=" * 50)
    
    try:
        print("\n📡 Connecting to PostgreSQL (Aiven)...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("\n✅ SUCCESS! All tables created:")
        print("   • departments")
        print("   • programs")
        print("   • users")
        print("   • facial_profiles")
        print("   • subjects")
        print("   • classes")
        print("   • enrollments")
        print("   • devices")
        print("   • attendance_logs")
        print("\n" + "=" * 50)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Check DATABASE_URL in .env")
        print("2. Verify Aiven PostgreSQL is running")
        print("3. Ensure psycopg2-binary is installed")
        raise


if __name__ == "__main__":
    init_database()
