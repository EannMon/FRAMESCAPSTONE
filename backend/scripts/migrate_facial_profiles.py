"""
Migration Script: Add new columns to facial_profiles table
Adds: num_samples, enrollment_quality
Updated: February 1, 2026

Run this script to update the database schema:
    cd backend
    python scripts/migrate_facial_profiles.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from db.database import engine


def migrate():
    print("\n" + "="*60)
    print("   FACIAL_PROFILES TABLE MIGRATION")
    print("="*60)
    
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'facial_profiles' 
            AND column_name IN ('num_samples', 'enrollment_quality')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        print(f"\n📊 Existing new columns: {existing_columns or 'None'}")
        
        # Add num_samples if not exists
        if 'num_samples' not in existing_columns:
            print("\n🔄 Adding 'num_samples' column...")
            conn.execute(text("""
                ALTER TABLE facial_profiles 
                ADD COLUMN num_samples INTEGER DEFAULT 0
            """))
            print("   ✅ Added num_samples")
        else:
            print("   ⏭️  num_samples already exists")
        
        # Add enrollment_quality if not exists
        if 'enrollment_quality' not in existing_columns:
            print("\n🔄 Adding 'enrollment_quality' column...")
            conn.execute(text("""
                ALTER TABLE facial_profiles 
                ADD COLUMN enrollment_quality FLOAT DEFAULT 0.0
            """))
            print("   ✅ Added enrollment_quality")
        else:
            print("   ⏭️  enrollment_quality already exists")
        
        # Update model_version default for new rows
        print("\n🔄 Updating model_version default...")
        conn.execute(text("""
            ALTER TABLE facial_profiles 
            ALTER COLUMN model_version SET DEFAULT 'insightface_buffalo_l_v1'
        """))
        print("   ✅ Updated model_version default")
        
        conn.commit()
        
        # Verify
        print("\n📋 Current table structure:")
        result = conn.execute(text("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'facial_profiles'
            ORDER BY ordinal_position
        """))
        for row in result.fetchall():
            print(f"   • {row[0]}: {row[1]} (default: {row[2] or 'NULL'})")
    
    print("\n" + "="*60)
    print("   ✅ MIGRATION COMPLETE!")
    print("="*60 + "\n")


if __name__ == "__main__":
    migrate()
