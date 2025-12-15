import mysql.connector
from db_config import DB_CONFIG

def clean_data():
    print("🧹 EXECUTING DEEP CLEAN (New Schema Compatible)...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 1. Disable Foreign Key Checks (Para makapag-delete tayo kahit may connections)
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

        # 2. List of tables to clean (Targeting Student Data)
        # Note: We are careful not to delete Admin accounts if possible, 
        # but for clean slate, wiping these is safer for dev.
        
        tables_to_truncate = [
            'Notification', 
            'EventLog', 
            'ClassSchedule', 
            'Subjects',  # New Table
            'ReportHistory', # New Table
            'SystemAudit'    # New Table
        ]

        for table in tables_to_truncate:
            print(f"...Truncating {table}")
            cursor.execute(f"TRUNCATE TABLE {table}")

        # 3. Reset Camera Status (Optional, don't delete to keep IDs)
        # cursor.execute("UPDATE CameraManagement SET camera_status = 'Active'")

        # 4. Reset User Enrollments (Specific Users)
        target_ids = [8, 4] # Emmanuel, Elena
        format_ids = ','.join(['%s'] * len(target_ids))
        cursor.execute(f"UPDATE User SET enrolled_courses = NULL, handled_sections = NULL WHERE user_id IN ({format_ids})", tuple(target_ids))

        # 5. Re-enable Foreign Key Checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

        conn.commit()
        print("✨ SUCCESS! Database is fresh and empty.")

    except Exception as e:
        print(f"❌ Error: {e}")
        # Always re-enable checks even if error
        try:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        except:
            pass
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    clean_data()