"""
Migration Script: Add active_academic_year and active_semester columns to departments table.
Run this once to update your existing database schema.

Usage:
    cd backend
    ..\\venv\\Scripts\\python.exe scripts\\migrate_add_academic_year.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from db.database import engine
from sqlalchemy import text, inspect

def migrate():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('departments')]
    
    with engine.connect() as conn:
        if 'active_academic_year' not in columns:
            conn.execute(text(
                "ALTER TABLE departments ADD COLUMN active_academic_year VARCHAR(20) DEFAULT '2025-2026'"
            ))
            print("Added 'active_academic_year' column to departments table.")
        else:
            print("'active_academic_year' column already exists.")
        
        if 'active_semester' not in columns:
            conn.execute(text(
                "ALTER TABLE departments ADD COLUMN active_semester VARCHAR(50) DEFAULT '2nd Semester'"
            ))
            print("Added 'active_semester' column to departments table.")
        else:
            print("'active_semester' column already exists.")
        
        conn.commit()
    
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
