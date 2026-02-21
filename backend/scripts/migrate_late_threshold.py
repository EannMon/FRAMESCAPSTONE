"""
Migration: Add late_threshold_minutes column to classes table.
This allows faculty/head to configure how many minutes after class start
is considered 'late' (default: 15 minutes).

Usage:
    cd backend
    python scripts/migrate_late_threshold.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import engine
from sqlalchemy import text


def migrate():
    print("\n" + "=" * 60)
    print("   FRAMES - Migration: Add late_threshold_minutes")
    print("=" * 60)

    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'classes' AND column_name = 'late_threshold_minutes'
        """))

        if result.fetchone():
            print("\n✅ Column 'late_threshold_minutes' already exists in 'classes' table.")
            print("   No migration needed.")
            return

        # Add the column with default value
        print("\n🔄 Adding 'late_threshold_minutes' column to 'classes' table...")
        conn.execute(text("""
            ALTER TABLE classes 
            ADD COLUMN late_threshold_minutes INTEGER DEFAULT 15
        """))
        conn.commit()

        print("✅ Column added successfully!")
        print("   Default: 15 minutes")
        print("   Faculty/Head can change this per class from their dashboard.")

    print("=" * 60)


if __name__ == "__main__":
    migrate()
