import mysql.connector
import json
from db_config import DB_CONFIG
import random
from datetime import datetime, timedelta

def seed_data():
    print("🌱 Seeding STRICTLY SYNCHRONIZED Data (Timezone Fixed)...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        target_user = 8
        target_section = 'BSIT-4A'

        # 1. SETUP ROOMS & CAMERAS
        print("...Configuring Rooms")
        rooms = [
            ('ComLab 1', 'COS', 'Rpi-Cam-01'),
            ('Lecture Hall A', 'COS', 'Rpi-Cam-02'),
            ('Room 305 - Rizal', 'CLA', 'Rpi-Cam-03') 
        ]
        cam_ids = {} 
        for room in rooms:
            cursor.execute("INSERT IGNORE INTO CameraManagement (room_name, department_code, camera_name, camera_status) VALUES (%s, %s, %s, 'Active')", room)
            conn.commit()
            cursor.execute("SELECT camera_id FROM CameraManagement WHERE room_name = %s", (room[0],))
            cam_ids[room[0]] = cursor.fetchone()[0]

        # 2. ENROLL STUDENT
        print("...Enrolling User")
        my_subjects = ["IT411", "IT412", "IT413", "IT414", "GE-RIZAL"] 
        cursor.execute("UPDATE User SET enrolled_courses = %s, section = %s WHERE user_id = %s", (json.dumps(my_subjects), target_section, target_user))

        # 3. CREATE SCHEDULE (Strict Formatting)
        # Format: (Code, Name, Day, StartH, StartM, EndH, EndM, RoomKey)
        sched_def = [
            ('IT411', 'Capstone Project 2', 'Monday', 7, 0, 10, 0, 'ComLab 1'),
            ('IT412', 'System Administration', 'Monday', 13, 0, 16, 0, 'Lecture Hall A'),
            ('IT413', 'Mobile Development', 'Tuesday', 8, 0, 11, 0, 'ComLab 1'),
            ('IT414', 'Technopreneurship', 'Wednesday', 10, 0, 13, 0, 'Lecture Hall A'),
            ('GE-RIZAL', 'Life and Works of Rizal', 'Saturday', 20, 0, 23, 0, 'Room 305 - Rizal') 
        ]

        print("...Injecting Schedule")
        sql_sched = "INSERT INTO ClassSchedule (course_code, course_name, day_of_week, start_time, end_time, camera_id, section, faculty_id) VALUES (%s, %s, %s, %s, %s, %s, %s, 1)"

        for item in sched_def:
            # Note: We use specific year/month to ensure formatting works, but only Time string is stored
            s_time = datetime(2024, 1, 1, item[3], item[4]).strftime("%I:%M %p")
            e_time = datetime(2024, 1, 1, item[5], item[6]).strftime("%I:%M %p")
            cam_id = cam_ids[item[7]]
            cursor.execute(sql_sched, (item[0], item[1], item[2], s_time, e_time, cam_id, target_section))
        conn.commit()

        # 4. GENERATE HISTORICAL LOGS
        print("...Generating History")
        events = []
        now = datetime.now()
        
        for i in range(30): 
            # Force current_day to have 00:00:00 time to avoid "current execution time" pollution
            current_day = (now - timedelta(days=(30-i))).replace(hour=0, minute=0, second=0, microsecond=0)
            day_name = current_day.strftime('%A')
            
            # Find classes for this day
            todays_classes = [c for c in sched_def if c[2] == day_name]
            
            for cls in todays_classes:
                code, name, day, start_h, start_m, end_h, end_m, room_key = cls
                
                # Define Class Start/End precisely
                class_start_dt = current_day.replace(hour=start_h, minute=start_m)
                class_end_dt = current_day.replace(hour=end_h, minute=end_m)
                
                # Random Attendance Logic (90% chance present)
                if random.random() > 0.1: 
                    # IN: Randomly mostly on time, sometimes late
                    offset = random.choice([0, 1, 2, 3, 5, 10, 15, 25]) # Discrete choices better
                    actual_in = class_start_dt + timedelta(minutes=offset)
                    remarks = "Late" if offset > 15 else "On Time"
                    
                    events.append((target_user, 'attendance_in', actual_in, cam_ids[room_key], 98.2, remarks))
                    
                    # OUT: Slightly before or exact end time
                    offset_out = random.randint(0, 5)
                    actual_out = class_end_dt - timedelta(minutes=offset_out)
                    events.append((target_user, 'attendance_out', actual_out, cam_ids[room_key], 99.1, 'Dismissed'))

        # Bulk Insert
        if events:
            sql_event = "INSERT INTO EventLog (user_id, event_type, timestamp, camera_id, confidence_score, remarks) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.executemany(sql_event, events)
        
        conn.commit()
        print("✅ SUCCESS! Database refreshed with aligned timestamps.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    seed_data()