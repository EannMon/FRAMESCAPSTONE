import mysql.connector
from db_config import DB_CONFIG

def clean_data():
    print("🧹 EXECUTING HARD CLEANUP...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Target: Delete EVERYTHING related to test users to avoid ID conflicts
        target_ids = [8, 4] 
        format_ids = ','.join(['%s'] * len(target_ids))

        # 1. Delete Notifications
        cursor.execute(f"DELETE FROM Notification WHERE user_id IN ({format_ids})", tuple(target_ids))
        
        # 2. Delete Logs
        cursor.execute(f"DELETE FROM EventLog WHERE user_id IN ({format_ids})", tuple(target_ids))
        
        # 3. Delete Schedules (Para fresh ang start/end times)
        cursor.execute("DELETE FROM ClassSchedule WHERE section = 'BSIT-4A'")

        # 4. Reset User Enrollment
        cursor.execute(f"UPDATE User SET enrolled_courses = NULL WHERE user_id IN ({format_ids})", tuple(target_ids))

        conn.commit()
        print("✨ SUCCESS! Database is empty and ready for fresh seeding.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    clean_data()