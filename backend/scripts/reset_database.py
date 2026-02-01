"""
Database Reset Script - PostgreSQL/SQLAlchemy
Clears all data and re-seeds the database from scratch.

Usage:
    python scripts/reset_database.py          # Interactive mode (asks for confirmation)
    python scripts/reset_database.py --force  # Skip confirmation
    python scripts/reset_database.py --seed   # Also run seed_data.py after reset
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from db.database import engine, SessionLocal, Base


def reset_database(force: bool = False, seed: bool = False):
    """
    Drop all data from database tables (preserves structure).
    """
    if not force:
        print("\n⚠️  WARNING: This will DELETE ALL DATA from the database!")
        print("   Tables affected: users, departments, programs, subjects,")
        print("   classes, enrollments, attendance_logs, devices, facial_profiles")
        print()
        confirm = input("Type 'RESET' to confirm: ")
        if confirm != "RESET":
            print("❌ Aborted. Database unchanged.")
            return False
    
    print("\n🗑️  Resetting database...")
    
    db = SessionLocal()
    try:
        # Order matters due to foreign key constraints
        # Delete from dependent tables first
        tables_in_order = [
            "attendance_logs",
            "enrollments",
            "facial_profiles",
            "classes",
            "subjects",
            "users",
            "programs",
            "departments",
            "devices",
        ]
        
        for table in tables_in_order:
            try:
                result = db.execute(text(f"DELETE FROM {table}"))
                print(f"   ✓ Cleared {table} ({result.rowcount} rows)")
            except Exception as e:
                print(f"   ⚠ Skipped {table}: {e}")
        
        db.commit()
        print("\n✅ Database cleared successfully!")
        
        if seed:
            print("\n🌱 Running seed_data.py...")
            from scripts.seed_data import seed_all
            seed_all()
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        return False
    finally:
        db.close()


def drop_and_recreate_tables(force: bool = False):
    """
    Drop ALL tables and recreate them (nuclear option).
    Use this if schema changed.
    """
    if not force:
        print("\n🔥 DANGER: This will DROP ALL TABLES and recreate them!")
        print("   All data will be PERMANENTLY LOST!")
        print()
        confirm = input("Type 'DROP TABLES' to confirm: ")
        if confirm != "DROP TABLES":
            print("❌ Aborted. Database unchanged.")
            return False
    
    print("\n💥 Dropping all tables...")
    
    try:
        # Import all models to register them
        from models import (
            user, department, program, facial_profile,
            subject, class_, enrollment, device, attendance_log
        )
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("   ✓ All tables dropped")
        
        # Recreate all tables
        Base.metadata.create_all(bind=engine)
        print("   ✓ All tables recreated")
        
        print("\n✅ Database schema reset complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


if __name__ == "__main__":
    args = sys.argv[1:]
    
    force = "--force" in args or "-f" in args
    seed = "--seed" in args or "-s" in args
    drop = "--drop" in args or "-d" in args
    
    if drop:
        drop_and_recreate_tables(force=force)
    else:
        reset_database(force=force, seed=seed)
