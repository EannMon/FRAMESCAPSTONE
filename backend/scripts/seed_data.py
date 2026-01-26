import mysql.connector
import json
from db_config import DB_CONFIG
import random
from datetime import datetime, timedelta

def seed_data():
    print("🌱 Seeding NEW SCHEMA Data (Subjects -> Schedule -> Logs -> Notifs)...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        target_user = 8 # Emmanuel
        target_section = 'BSIT-4A'

        # --- 1. SETUP ROOMS ---
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

        # --- 2. CREATE SUBJECTS (NEW TABLE REQUIREMENT) ---
        print("...Creating Subjects Master List")
        # List of subjects needed
        subjects_data = [
            ('IT411', 'Capstone Project 2', 3),
            ('IT412', 'System Administration', 3),
            ('IT413', 'Mobile Development', 3),
            ('IT414', 'Technopreneurship', 3),
            ('GE-RIZAL', 'Life and Works of Rizal', 3)
        ]
        
        sql_subject = "INSERT INTO Subjects (subject_code, subject_description, units) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE subject_description=subject_description"
        cursor.executemany(sql_subject, subjects_data)
        conn.commit()

        # --- 3. ENROLL STUDENT ---
        print("...Enrolling User")
        my_subjects = ["IT411", "IT412", "IT413", "IT414", "GE-RIZAL"] 
        cursor.execute("UPDATE User SET enrolled_courses = %s, section = %s WHERE user_id = %s", (json.dumps(my_subjects), target_section, target_user))

        # --- 4. CREATE SCHEDULE (Linked to Subjects) ---
        # Format: (Code, Day, StartH, StartM, EndH, EndM, RoomKey)
        # Note: We don't need Subject Name here anymore, kukunin na yan sa Subjects table via Foreign Key
        sched_def = [
            ('IT411', 'Monday', 7, 0, 10, 0, 'ComLab 1'),
            ('IT412', 'Monday', 13, 0, 16, 0, 'Lecture Hall A'),
            ('IT413', 'Tuesday', 8, 0, 11, 0, 'ComLab 1'),
            ('IT414', 'Wednesday', 10, 0, 13, 0, 'Lecture Hall A'),
            ('GE-RIZAL', 'Saturday', 20, 0, 23, 0, 'Room 305 - Rizal') 
        ]

        print("...Injecting Class Schedule")
        sql_sched = """
            INSERT INTO ClassSchedule (course_code, section, day_of_week, start_time, end_time, camera_id, faculty_id) 
            VALUES (%s, %s, %s, %s, %s, %s, 1)
        """

        schedule_map = [] # To keep track for log generation

        for item in sched_def:
            s_time = datetime(2024, 1, 1, item[2], item[3]).strftime("%I:%M %p")
            e_time = datetime(2024, 1, 1, item[4], item[5]).strftime("%I:%M %p")
            cam_id = cam_ids[item[6]]
            
            # Store for log loop later
            schedule_map.append({
                'code': item[0], 'day': item[1], 
                'start_h': item[2], 'start_m': item[3],
                'end_h': item[4], 'end_m': item[5],
                'cam_id': cam_id, 'room': item[6]
            })

            cursor.execute(sql_sched, (item[0], target_section, item[1], s_time, e_time, cam_id))
        conn.commit()

        # --- 5. GENERATE HISTORY (Logs + Notifications) ---
        print("...Generating Synchronized History & Notifications")
        events = []
        notifications = []
        now = datetime.now()
        
        # Loop 30 days back
        for i in range(30): 
            current_day = now - timedelta(days=(30-i))
            day_name = current_day.strftime('%A')
            
            # Find classes for this day
            todays_classes = [c for c in schedule_map if c['day'] == day_name]
            
            for cls in todays_classes:
                # Class Times
                class_start_dt = current_day.replace(hour=cls['start_h'], minute=cls['start_m'], second=0)
                class_end_dt = current_day.replace(hour=cls['end_h'], minute=cls['end_m'], second=0)
                
                # --- A. LIVE CLASS CHECK (If happening right now) ---
                is_live_now = (day_name == now.strftime('%A')) and (class_start_dt <= now <= class_end_dt)

                if is_live_now:
                    print(f"🚨 LIVE CLASS: {cls['code']} in {cls['room']}")
                    live_in = now.replace(hour=cls['start_h'], minute=cls['start_m'], second=0) + timedelta(minutes=5)
                    if live_in > now: live_in = now 
                    
                    events.append((target_user, 'attendance_in', live_in, cls['cam_id'], 99.5, 'On Time'))
                    
                    # Live Notification
                    msg = f"You have successfully timed in for {cls['code']} at {cls['room']}."
                    notifications.append((target_user, 'fas fa-clock', msg, False, live_in))
                    continue 

                # --- B. PAST CLASSES ---
                if class_end_dt < now:
                    if random.random() > 0.1: # 90% Attendance
                        
                        # Time In Logic
                        offset = random.randint(0, 20)
                        actual_in = class_start_dt + timedelta(minutes=offset)
                        remarks = "Late" if offset > 15 else "On Time"
                        
                        events.append((target_user, 'attendance_in', actual_in, cls['cam_id'], 98.2, remarks))
                        
                        # Notification for Time In
                        msg_in = f"Attendance Recorded: {cls['code']} ({remarks})"
                        notifications.append((target_user, 'fas fa-check-circle', msg_in, True, actual_in))

                        # Time Out Logic
                        actual_out = class_end_dt - timedelta(minutes=random.randint(0, 10))
                        events.append((target_user, 'attendance_out', actual_out, cls['cam_id'], 99.1, 'Dismissed'))

        # Bulk Insert Logs
        if events:
            sql_event = "INSERT INTO EventLog (user_id, event_type, timestamp, camera_id, confidence_score, remarks) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.executemany(sql_event, events)
        
        # Bulk Insert Notifications
        if notifications:
            sql_notif = "INSERT INTO Notification (user_id, icon, message, is_read, created_at) VALUES (%s, %s, %s, %s, %s)"
            cursor.executemany(sql_notif, notifications)
        
        conn.commit()
        print("✅ SUCCESS! Database seeded with new structure.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    seed_data()