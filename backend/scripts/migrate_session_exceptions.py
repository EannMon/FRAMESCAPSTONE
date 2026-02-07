"""
Database Migration Script - Create session_exceptions table
Run this script to add the new session_exceptions table to the database.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import engine
from models.session_exception import SessionException

def migrate():
    """Create the session_exceptions table if it doesn't exist"""
    print("🔄 Running migration: Creating session_exceptions table...")
    
    try:
        SessionException.__table__.create(engine, checkfirst=True)
        print("✅ session_exceptions table created successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    migrate()
