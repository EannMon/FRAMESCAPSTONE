"""
Database Rollback Script for Faculty Upload Feature
SAFELY reverts all changes from migrate_db.py

This script:
1. Deletes all upload data (FacultyScheduleUpload records)
2. Removes test cameras (Room 324 & 326 only)
3. Removes upload_id column from ClassSchedule (keeps data intact)
4. Optionally drops new tables (FacultyScheduleUpload, Subjects)

Run this to revert to the original database state
"""

import mysql.connector
from db_config import DB_CONFIG

def rollback_database(drop_tables=False):
    """
    Rollback database changes
    
    Args:
        drop_tables (bool): If True, drop the new tables. 
                           If False, just clear the data.
    """
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔄 Starting database rollback...")
        print("=" * 50)
        
        # --- 1. DELETE ALL FACULTY UPLOAD DATA ---
        print("🗑️  Deleting faculty upload records...")
        cursor.execute("DELETE FROM FacultyScheduleUpload")
        deleted_uploads = cursor.rowcount
        conn.commit()
        print(f"✅ Deleted {deleted_uploads} upload record(s)")
        
        # --- 2. DELETE TEST CAMERAS ONLY (Room 324 & 326) ---
        print("🎥 Removing test cameras...")
        cursor.execute("""
            DELETE FROM CameraManagement 
            WHERE room_name IN ('Room 324', 'Room 326')
        """)
        deleted_cameras = cursor.rowcount
        conn.commit()
        print(f"✅ Removed {deleted_cameras} test camera(s)")
        
        # --- 3. DROP upload_id COLUMN FROM ClassSchedule ---
        print("📋 Removing upload_id column from ClassSchedule...")
        try:
            cursor.execute("SET FOREIGN_KEY_CHECKS=0")
            cursor.execute("""
                ALTER TABLE ClassSchedule 
                DROP FOREIGN KEY ClassSchedule_ibfk_upload_id
            """)
        except:
            pass  # Foreign key might not exist
        
        try:
            cursor.execute("""
                ALTER TABLE ClassSchedule 
                DROP COLUMN upload_id
            """)
            conn.commit()
            print("✅ Removed upload_id column from ClassSchedule")
        except mysql.connector.Error as e:
            if "Unknown column" in str(e):
                print("⚠️  upload_id column doesn't exist (already removed)")
            else:
                print(f"⚠️  {e}")
        
        finally:
            cursor.execute("SET FOREIGN_KEY_CHECKS=1")
            conn.commit()
        
        # --- 4. DROP NEW TABLES (OPTIONAL) ---
        if drop_tables:
            print("🗑️  Dropping new tables...")
            
            # Drop FacultyScheduleUpload first (has foreign keys)
            try:
                cursor.execute("DROP TABLE IF EXISTS FacultyScheduleUpload")
                conn.commit()
                print("✅ Dropped FacultyScheduleUpload table")
            except mysql.connector.Error as e:
                print(f"⚠️  Could not drop FacultyScheduleUpload: {e}")
            
            # Drop Subjects
            try:
                cursor.execute("DROP TABLE IF EXISTS Subjects")
                conn.commit()
                print("✅ Dropped Subjects table")
            except mysql.connector.Error as e:
                print(f"⚠️  Could not drop Subjects: {e}")
        
        print("=" * 50)
        print("✅ Rollback completed successfully!")
        print("\n📊 Summary:")
        print(f"   - Deleted {deleted_uploads} upload(s)")
        print(f"   - Removed {deleted_cameras} camera(s)")
        print(f"   - Removed upload_id column")
        if drop_tables:
            print("   - Dropped FacultyScheduleUpload & Subjects tables")
        else:
            print("   - Tables remain (can reuse later)")
        
        return True
        
    except mysql.connector.Error as err:
        print(f"❌ Database Error: {err}")
        return False
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    import sys
    
    print("🔴 DATABASE ROLLBACK - This will DELETE data")
    print("=" * 50)
    
    # Ask user if they want to drop tables too
    drop_tables = False
    if len(sys.argv) > 1 and sys.argv[1] == "--drop-tables":
        drop_tables = True
        print("⚠️  WARNING: Will also drop new tables")
    else:
        print("💡 TIP: Add --drop-tables flag to also remove new tables")
    
    confirm = input("\nAre you SURE? Type 'yes' to continue: ").strip().lower()
    
    if confirm == "yes":
        rollback_database(drop_tables=drop_tables)
    else:
        print("❌ Rollback cancelled")
