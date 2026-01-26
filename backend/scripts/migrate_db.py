"""
Database Migration Script for Faculty Upload Feature
Adds FacultyScheduleUpload table and test cameras
Run this after updating your database schema
"""

import mysql.connector
from db_config import DB_CONFIG

def migrate_database():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔄 Running database migrations...")
        
        # --- 1. CREATE FacultyScheduleUpload TABLE ---
        print("📋 Creating FacultyScheduleUpload table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS FacultyScheduleUpload (
                upload_id INT AUTO_INCREMENT PRIMARY KEY,
                faculty_id INT NOT NULL,
                file_name VARCHAR(255),
                file_path VARCHAR(255),
                semester VARCHAR(50),
                academic_year VARCHAR(20),
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('Processing', 'Completed', 'Failed') DEFAULT 'Processing',
                error_message TEXT,
                
                FOREIGN KEY (faculty_id) REFERENCES User(user_id) ON DELETE CASCADE
            )
        """)
        conn.commit()
        print("✅ FacultyScheduleUpload table created/verified")
        
        # --- 2. ADD upload_id COLUMN TO ClassSchedule (if not exists) ---
        print("📋 Adding upload_id column to ClassSchedule...")
        try:
            cursor.execute("""
                ALTER TABLE ClassSchedule 
                ADD COLUMN upload_id INT AFTER schedule_id,
                ADD FOREIGN KEY (upload_id) REFERENCES FacultyScheduleUpload(upload_id) ON DELETE SET NULL
            """)
            conn.commit()
            print("✅ upload_id column added to ClassSchedule")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("⚠️  upload_id column already exists in ClassSchedule")
            else:
                print(f"⚠️  {e}")
        
        # --- 3. CREATE Subjects TABLE (if not exists) ---
        print("📋 Creating Subjects table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Subjects (
                subject_code VARCHAR(50) PRIMARY KEY,
                subject_description VARCHAR(255) NOT NULL,
                units INT DEFAULT 3,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        print("✅ Subjects table created/verified")
        
        # --- 4. INSERT TEST CAMERAS FOR ROOMS 324 & 326 ---
        print("🎥 Setting up test cameras...")
        test_cameras = [
            ('Room 324', 'COS', 40, 'Camera_Room324', 'Active'),
            ('Room 326', 'COS', 40, 'Camera_Room326', 'Active'),
        ]
        
        for room_name, dept, capacity, cam_name, status in test_cameras:
            cursor.execute("""
                INSERT IGNORE INTO CameraManagement 
                (room_name, department_code, capacity, camera_name, camera_status)
                VALUES (%s, %s, %s, %s, %s)
            """, (room_name, dept, capacity, cam_name, status))
            conn.commit()
            print(f"✅ {room_name} camera configured")
        
        print("\n✅ All migrations completed successfully!")
        
    except mysql.connector.Error as err:
        print(f"❌ Database Error: {err}")
        return False
    finally:
        cursor.close()
        conn.close()
    
    return True

if __name__ == "__main__":
    migrate_database()
