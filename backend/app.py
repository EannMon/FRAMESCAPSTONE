import pdfplumber
import re
import os
from datetime import datetime
import cv2
import mysql.connector
import numpy as np
import base64
import pickle
import json
import bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import DB_CONFIG
from deepface import DeepFace

# --- 🛠️ CRITICAL FIX FOR INTEL GPU CRASH ---
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# --- 1. SETUP MODELS ---
MODEL_NAME = "SFace"
DETECTOR_BACKEND = "opencv"

print("⏳ Initializing DeepFace Models...")
try:
    DeepFace.build_model(MODEL_NAME)
    print("✅ DeepFace models loaded successfully!")
except Exception as e:
    print(f"❌ Warning: Could not load DeepFace models: {e}")

app = Flask(__name__)
# IMPORTANT: Allow ALL routes (r"/*") para gumana ang /validate-face at /register
CORS(app, resources={r"/*": {"origins": "*"}}) 

# --- DB HELPER ---
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"❌ DB Error: {err}")
        return None

# --- FACE PROCESSING ---
def process_face_embedding(face_capture_data_url):
    print("\n🔍 Processing Face Embedding...") 

    if not face_capture_data_url:
        print("⚠️ No face capture data received.")
        return None, "Pending"

    try:
        # Decode base64
        if ',' in face_capture_data_url:
            header, encoded_data = face_capture_data_url.split(',', 1)
        else:
            encoded_data = face_capture_data_url
            
        image_data = base64.b64decode(encoded_data)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None: 
            print("❌ Error: Could not decode image.")
            return None, "Not Registered"

        # Generate Embedding (enforce_detection=False para forgiving)
        embedding_objs = DeepFace.represent(
            img_path = frame, 
            model_name = MODEL_NAME,
            enforce_detection = False, 
            detector_backend = DETECTOR_BACKEND
        )
        
        if len(embedding_objs) >= 1:
            face_vector = embedding_objs[0]["embedding"]
            # Save as list [vector]
            data_to_save = pickle.dumps([face_vector]) 
            print("✅ Embedding generated successfully!")
            return data_to_save, "Registered"
        
        print("⚠️ DeepFace returned 0 embeddings.")
        return None, "Not Registered"

    except Exception as e:
        print(f"❌ CRITICAL ERROR in process_face_embedding: {e}")
        return None, "Not Registered"

# ==========================================
# API: CHECK FACE (Para sa Green Box validation)
# ==========================================
@app.route('/validate-face', methods=['POST'])
def validate_face():
    data = request.json
    face_capture = data.get('faceCapture')
    
    if not face_capture:
        return jsonify({"valid": False, "message": "No image data"}), 400

    try:
        if ',' in face_capture:
            header, encoded_data = face_capture.split(',', 1)
        else:
            encoded_data = face_capture
            
        image_data = base64.b64decode(encoded_data)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Mabilisang check lang kung may mukha
        face_objs = DeepFace.extract_faces(
            img_path=frame, 
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True, 
            align=False
        )
        
        return jsonify({"valid": True, "message": "Face Detected!"}), 200

    except Exception as e:
        print(f"Validation Failed: {e}")
        return jsonify({"valid": False, "message": "No face detected. Center your face."}), 200

# ==========================================
# API: LOGIN
# ==========================================
@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    
    # Use dictionary=True so we can access data by name (e.g., user['firstName'])
    cursor = conn.cursor(dictionary=True) 

    try:
        # 1. Find the user by email
        sql = "SELECT * FROM User WHERE email = %s"
        cursor.execute(sql, (email,))
        user = cursor.fetchone()

        if user:
            # 2. Check Password using Bcrypt
            stored_hash = user['password_hash']
            if isinstance(stored_hash, str):
                stored_hash = stored_hash.encode('utf-8')

            if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
                
                # 3. Clean up the data before sending to Frontend
                del user['password_hash'] 
                del user['face_embedding_vgg'] 
                
                # Fix Date formats
                if user.get('birthday'): user['birthday'] = str(user['birthday'])
                if user.get('date_registered'): user['date_registered'] = str(user['date_registered'])
                if user.get('last_active'): user['last_active'] = str(user['last_active'])

                print(f"✅ Login Successful for: {user['firstName']} (Status: {user.get('verification_status', 'N/A')})")
                return jsonify({"message": "Login Successful", "user": user}), 200
            else:
                print("❌ Login Failed: Incorrect Password")
                return jsonify({"error": "Invalid email or password"}), 401
        else:
            print("❌ Login Failed: User not found")
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"❌ Login Error: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# API: GET USER PROFILE
# ==========================================
@app.route('/user/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True) 

    try:
        # 1. Fetch EVERYTHING (includes verification_status)
        sql = "SELECT * FROM User WHERE user_id = %s"
        cursor.execute(sql, (user_id,))
        user = cursor.fetchone()

        if user:
            # 2. AUTOMATIC CLEANUP LOOP
            for key, value in user.items():
                # A. Fix JSON Columns
                if key in ['handled_sections', 'enrolled_courses', 'emergency_contact', 'preferences']:
                    if value and isinstance(value, str):
                        try:
                            user[key] = json.loads(value)
                        except:
                            user[key] = [] 
                    elif value is None:
                        user[key] = []

                # B. Fix Dates
                if hasattr(value, 'isoformat'): 
                    user[key] = value.isoformat()
            
            # 3. DELETE SENSITIVE/HEAVY DATA
            user.pop('password_hash', None)
            user.pop('face_embedding_vgg', None)
            
            return jsonify(user), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"❌ Error fetching profile: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# API: UPDATE PROFILE
# ==========================================
@app.route('/user/update/<int:user_id>', methods=['PUT'])
def update_user_profile(user_id):
    data = request.json
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()

    try:
        # 1. Prepare JSON fields
        emergency_contact = json.dumps(data.get('emergency_contact', {}))
        
        # 2. Update Query
        sql = """
            UPDATE User SET 
                firstName = %s,
                lastName = %s,
                contactNumber = %s,
                birthday = %s,
                homeAddress = %s,
                street_number = %s,
                street_name = %s,
                barangay = %s,
                city = %s,
                zip_code = %s,
                emergency_contact = %s
            WHERE user_id = %s
        """
        
        # 3. Map values
        vals = (
            data.get('firstName'),
            data.get('lastName'),
            data.get('contactNumber'),
            data.get('birthday'), 
            data.get('homeAddress'),
            data.get('street_number'),
            data.get('street_name'),
            data.get('barangay'),
            data.get('city'),
            data.get('zip_code'),
            emergency_contact,
            user_id
        )

        cursor.execute(sql, vals)
        conn.commit()

        print(f"✅ User {user_id} Updated Successfully")
        return jsonify({"message": "Profile updated successfully!"}), 200

    except Exception as e:
        print(f"❌ Update Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# API: VERIFY PASSWORD & CHANGE PASSWORD
# ==========================================
@app.route('/user/verify-password', methods=['POST'])
def verify_password():
    data = request.json
    user_id = data.get('user_id')
    password_input = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT password_hash FROM User WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()

        if user:
            stored_hash = user['password_hash']
            if isinstance(stored_hash, str):
                stored_hash = stored_hash.encode('utf-8')
            
            if bcrypt.checkpw(password_input.encode('utf-8'), stored_hash):
                return jsonify({"valid": True}), 200
            else:
                return jsonify({"valid": False, "error": "Incorrect password"}), 401
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/user/change-password', methods=['PUT'])
def change_password():
    data = request.json
    user_id = data.get('user_id')
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({"error": "Password is required"}), 400

    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE User SET password_hash = %s WHERE user_id = %s", 
            (hashed_pw, user_id)
        )
        conn.commit()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# API: REGISTER
# ==========================================
@app.route('/register', methods=['POST']) 
def register_user():
    data = request.json
    print(f"\n📩 Registering: {data.get('firstName')} {data.get('lastName')}")
    
    if not data.get('faceCapture'):
        print("⚠️ Warning: Payload missing 'faceCapture'")

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()

    try:
        role = data.get('role')
        email = data.get('email')
        password = data.get('password')
        
        tupm_id = f"TUPM-{data.get('tupmYear')}-{data.get('tupmSerial')}"
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        face_blob, face_status = process_face_embedding(data.get('faceCapture'))

        # --- AUTO VERIFY FOR ADMIN ---
        if role == 'admin':
            verification_status = 'Verified'
            print("💡 Account Role: Admin. Auto-verified.")
        else:
            verification_status = 'Pending'

        handled_sections = json.dumps(data.get('handledSections', []))
        enrolled_courses = json.dumps(data.get('selectedCourses', []))
        
        full_addr = f"{data.get('streetNumber')} {data.get('streetName')}, {data.get('barangay')}, {data.get('city')}, {data.get('zipCode')}"

        sql = """
            INSERT INTO User (
                email, password_hash, role, tupm_id,
                firstName, lastName, middleName, birthday, contactNumber,
                street_number, street_name, barangay, city, zip_code, homeAddress,
                college, course, year_level, section, student_status, term, faculty_status,
                handled_sections, enrolled_courses,
                face_embedding_vgg, face_status, verification_status, 
                last_active, date_registered
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s,
                %s, %s, %s, 
                NOW(), NOW()
            )
        """

        val = (
            email, hashed_pw, role, tupm_id,
            data.get('firstName'), data.get('lastName'), data.get('middleName'), data.get('birthday'), data.get('contactNumber'),
            data.get('streetNumber'), data.get('streetName'), data.get('barangay'), data.get('city'), data.get('zipCode'), full_addr,
            data.get('college'), 
            data.get('courseCode'), 
            data.get('year'), 
            data.get('section'), 
            data.get('status'), 
            data.get('term'), 
            data.get('facultyStatus'),
            handled_sections, enrolled_courses,
            face_blob, face_status, verification_status  
        )

        cursor.execute(sql, val)
        conn.commit()
        user_id = cursor.lastrowid
        
        print(f"✅ Success! User {user_id} registered with Face Status: {face_status} and Verification Status: {verification_status}")
        return jsonify({"message": "Registration Successful!", "user_id": user_id}), 201

    except mysql.connector.Error as err:
        if err.errno == 1062:
            return jsonify({"error": "Email or TUPM ID already exists."}), 409
        print(f"❌ SQL Error: {err}")
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        print(f"❌ General Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# ADMIN VERIFICATION APIs
# ==========================================

@app.route('/admin/verification/list', methods=['GET'])
def get_all_users():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True) 

    try:
        sql = """
        SELECT 
            user_id, firstName, lastName, email, role, 
            college, course, tupm_id, date_registered, verification_status 
        FROM User 
        ORDER BY date_registered DESC
        """
        cursor.execute(sql)
        users = cursor.fetchall()

        for user in users:
            if user.get('date_registered'):
                user['date_registered'] = str(user['date_registered'])

        print(f"✅ Retrieved {len(users)} users for verification list.")
        return jsonify(users), 200

    except Exception as e:
        print(f"❌ Error retrieving user list: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/verification/approve', methods=['POST'])
def approve_user_verification():
    data = request.json
    user_id = data.get('user_id')
    new_status = 'Verified'

    if not user_id: return jsonify({"error": "Invalid User ID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        sql = "UPDATE User SET verification_status = %s WHERE user_id = %s"
        cursor.execute(sql, (new_status, user_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "User not found or status unchanged"}), 404

        print(f"✅ User ID {user_id} updated to {new_status}")
        return jsonify({"message": f"User {user_id} status updated to {new_status}"}), 200

    except Exception as e:
        print(f"❌ Error updating status: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/verification/reject', methods=['POST'])
def reject_user_verification():
    data = request.json
    user_id = data.get('user_id')
    new_status = 'Rejected'

    if not user_id: return jsonify({"error": "Invalid User ID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        sql = "UPDATE User SET verification_status = %s WHERE user_id = %s"
        cursor.execute(sql, (new_status, user_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "User not found or status unchanged"}), 404

        print(f"✅ User ID {user_id} updated to {new_status}")
        return jsonify({"message": f"User {user_id} status updated to {new_status}"}), 200

    except Exception as e:
        print(f"❌ Error updating status: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/user-delete/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = "DELETE FROM User WHERE user_id = %s"
        cursor.execute(sql, (user_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "User not found"}), 404

        print(f"✅ User ID {user_id} deleted permanently.")
        return jsonify({"message": f"User {user_id} deleted successfully"}), 200

    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# STUDENT MODULE APIs
# ==========================================

# 1. Get Dashboard Stats & Notifications
@app.route('/api/student/dashboard/<int:user_id>', methods=['GET'])
def get_student_dashboard(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # A. Get Verification Status
        cursor.execute("SELECT enrolled_courses, verification_status FROM User WHERE user_id = %s", (user_id,))
        user_data = cursor.fetchone()

        # SECURITY CHECK
        if not user_data or user_data.get('verification_status') != 'Verified':
             return jsonify({
                 "attendance_rate": "N/A", 
                 "enrolled_courses": 0,
                 "notifications": [{"message": "Account pending admin approval", "icon": "fa-user-lock"}],
                 "recent_attendance": []
             })

        # B. Attendance Rate
        cursor.execute("SELECT COUNT(*) as count FROM EventLog WHERE user_id = %s AND event_type = 'attendance_in'", (user_id,))
        total_attendance = cursor.fetchone()['count']
        
        # C. Enrolled Courses
        course_count = 0
        if user_data['enrolled_courses']:
            try:
                courses = json.loads(user_data['enrolled_courses'])
                course_count = len(courses)
            except:
                course_count = 0

        # D. Notifications
        cursor.execute("SELECT * FROM Notification WHERE user_id = %s ORDER BY created_at DESC LIMIT 5", (user_id,))
        notifications = cursor.fetchall()
        
        # E. Recent Attendance
        cursor.execute("""
            SELECT e.timestamp, s.subject_description as course_name, cm.room_name 
            FROM EventLog e 
            LEFT JOIN CameraManagement cm ON e.camera_id = cm.camera_id
            LEFT JOIN ClassSchedule c ON c.camera_id = e.camera_id 
            LEFT JOIN Subjects s ON c.course_code = s.subject_code
            WHERE e.user_id = %s AND e.event_type = 'attendance_in'
            ORDER BY e.timestamp DESC LIMIT 3
        """, (user_id,))
        recent_logs = cursor.fetchall()

        return jsonify({
            "attendance_rate": f"{min(total_attendance * 10, 100)}%",
            "enrolled_courses": course_count,
            "notifications": notifications,
            "recent_attendance": recent_logs
        })
    except Exception as e:
        print(f"Dashboard Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 2. Get Student Schedule
@app.route('/api/student/schedule/<int:user_id>', methods=['GET'])
def get_student_schedule(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Get Student Section, Enrolled, Verification
        cursor.execute("SELECT section, enrolled_courses, verification_status FROM User WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()

        # SECURITY CHECK
        if not result or result.get('verification_status') != 'Verified':
             return jsonify({"error": "Account not verified"}), 403
        
        if not result['section']:
            return jsonify([]) # No section, no schedule

        section = result['section']
        enrolled_json = result['enrolled_courses']
        
        enrolled_list = []
        if enrolled_json:
            if isinstance(enrolled_json, str):
                enrolled_list = json.loads(enrolled_json)
            else:
                enrolled_list = enrolled_json
        
        if not enrolled_list: return jsonify([])

        format_strings = ','.join(['%s'] * len(enrolled_list))
        
        # FIXED QUERY: JOIN SUBJECTS for course_name
        sql = f"""
            SELECT 
                cs.day_of_week, 
                cs.start_time, 
                cs.end_time, 
                s.subject_description as course_name, 
                cs.course_code,
                cm.room_name
            FROM ClassSchedule cs
            LEFT JOIN CameraManagement cm ON cs.camera_id = cm.camera_id
            JOIN Subjects s ON cs.course_code = s.subject_code
            WHERE cs.section = %s 
            AND cs.course_code IN ({format_strings})
            ORDER BY cs.start_time
        """
        
        params = [section] + enrolled_list
        cursor.execute(sql, tuple(params))
        schedule = cursor.fetchall()
        
        return jsonify(schedule)

    except Exception as e:
        print(f"Schedule Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 3. Get Attendance History
@app.route('/api/student/history/<int:user_id>', methods=['GET'])
def get_attendance_history(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # SECURITY CHECK
        cursor.execute("SELECT verification_status FROM User WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()
        if not result or result.get('verification_status') != 'Verified':
            return jsonify({"error": "Account not verified"}), 403

        sql = """
            SELECT 
                e.timestamp, 
                e.event_type, 
                e.confidence_score, 
                cm.room_name,
                e.remarks,
                s.subject_description as course_name
            FROM EventLog e
            LEFT JOIN CameraManagement cm ON e.camera_id = cm.camera_id
            LEFT JOIN ClassSchedule cs ON e.camera_id = cs.camera_id
            LEFT JOIN Subjects s ON cs.course_code = s.subject_code
            WHERE e.user_id = %s
            ORDER BY e.timestamp DESC
        """
        cursor.execute(sql, (user_id,))
        logs = cursor.fetchall()
        return jsonify(logs)
    except Exception as e:
        print(f"History Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# API: FACULTY DASHBOARD STATS (MODIFIED for Verification Check)
# ==========================================

# 1. Get Faculty Schedule & Stats
@app.route('/api/faculty/schedule/<int:user_id>', methods=['GET'])
def get_faculty_schedule_endpoint(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check Verification Status first
        cursor.execute("SELECT verification_status FROM User WHERE user_id = %s", (user_id,))
        status_data = cursor.fetchone()
        if not status_data or status_data.get('verification_status') != 'Verified':
             return jsonify({"error": "Account not verified"}), 403

        today_name = datetime.now().strftime('%A')
        
        sql = """
            SELECT 
                cs.schedule_id, 
                cs.course_code, 
                s.subject_description as title,
                cs.section,
                cs.start_time, 
                cs.end_time, 
                cs.day_of_week,
                cm.room_name
            FROM ClassSchedule cs
            JOIN Subjects s ON cs.course_code = s.subject_code
            LEFT JOIN CameraManagement cm ON cs.camera_id = cm.camera_id
            WHERE cs.faculty_id = %s
        """
        
        cursor.execute(sql, (user_id,))
        classes = cursor.fetchall()

        # Calculate Stats for each class
        for cls in classes:
            # 1. Total Students
            cursor.execute("SELECT COUNT(*) as count FROM User WHERE section = %s AND role = 'student'", (cls['section'],))
            total_res = cursor.fetchone()
            total_students = total_res['count'] if total_res else 0
            
            # 2. Present Students Today
            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) as count 
                FROM EventLog 
                WHERE schedule_id = %s 
                AND DATE(timestamp) = CURDATE() 
                AND event_type = 'attendance_in'
            """, (cls['schedule_id'],))
            present_res = cursor.fetchone()
            present_count = present_res['count'] if present_res else 0

            # 3. Rate
            rate = 0
            if total_students > 0:
                rate = round((present_count / total_students) * 100)
            
            cls['rate'] = rate
            cls['total_students'] = total_students
            cls['present_count'] = present_count

            # 4. Status
            cls['status'] = 'upcoming' 
            if cls['day_of_week'] == today_name:
                if present_count > 0: cls['status'] = 'ongoing'
                if present_count == total_students and total_students > 0: cls['status'] = 'completed'

        return jsonify(classes)

    except Exception as e:
        print(f"❌ Sched Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/faculty/dashboard-stats/<int:user_id>', methods=['GET'])
def get_faculty_dashboard_stats(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Today's Classes Count
        today_name = datetime.now().strftime('%A')
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM ClassSchedule 
            WHERE faculty_id = %s AND day_of_week = %s
        """, (user_id, today_name))
        today_classes = cursor.fetchone()['count']

        # 2. Total Students Handled
        cursor.execute("""
            SELECT COUNT(DISTINCT u.user_id) as count
            FROM User u
            JOIN ClassSchedule cs ON u.section = cs.section
            WHERE cs.faculty_id = %s AND u.role = 'student'
        """, (user_id,))
        total_students = cursor.fetchone()['count']

        # 3. Overall Attendance Rate
        cursor.execute("""
            SELECT 
                COUNT(*) as total_logs,
                (SELECT COUNT(*) * 4 FROM ClassSchedule WHERE faculty_id = %s) as expected_logs
            FROM EventLog e
            JOIN ClassSchedule cs ON e.schedule_id = cs.schedule_id
            WHERE cs.faculty_id = %s 
            AND e.event_type = 'attendance_in'
            AND e.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """, (user_id, user_id))
        att_data = cursor.fetchone()
        
        att_rate = 0
        if att_data['expected_logs'] and att_data['expected_logs'] > 0:
            att_rate = round((att_data['total_logs'] / att_data['expected_logs']) * 100)

        # 4. Recent Attendance
        cursor.execute("""
            SELECT 
                s.subject_code, 
                s.subject_description, 
                DATE_FORMAT(e.timestamp, '%h:%i %p') as time,
                e.confidence_score as rate
            FROM EventLog e
            JOIN ClassSchedule cs ON e.schedule_id = cs.schedule_id
            JOIN Subjects s ON cs.course_code = s.subject_code
            WHERE cs.faculty_id = %s AND e.event_type = 'attendance_in'
            ORDER BY e.timestamp DESC LIMIT 5
        """, (user_id,))
        recent_logs = cursor.fetchall()

        return jsonify({
            "today_classes": today_classes,
            "total_students": total_students,
            "attendance_rate": att_rate,
            "recent_attendance": recent_logs,
            "alerts": 0
        })

    except Exception as e:
        print(f"Dashboard Stats Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/faculty/class-details/<int:schedule_id>', methods=['GET'])
def get_class_details_endpoint(schedule_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT section FROM ClassSchedule WHERE schedule_id = %s", (schedule_id,))
        sched_data = cursor.fetchone()
        if not sched_data: return jsonify([])
        section = sched_data['section']

        sql_students = """
            SELECT user_id, tupm_id, firstName, lastName, 'Absent' as status, '--:--' as timeIn
            FROM User 
            WHERE section = %s AND role = 'student'
            ORDER BY lastName
        """
        cursor.execute(sql_students, (section,))
        students = cursor.fetchall()

        sql_logs = """
            SELECT user_id, DATE_FORMAT(timestamp, '%h:%i %p') as time_in, remarks 
            FROM EventLog 
            WHERE schedule_id = %s AND DATE(timestamp) = CURDATE() AND event_type = 'attendance_in'
        """
        cursor.execute(sql_logs, (schedule_id,))
        logs = cursor.fetchall()

        log_map = {log['user_id']: log for log in logs}

        for student in students:
            uid = student['user_id']
            if uid in log_map:
                student['status'] = 'Present'
                student['timeIn'] = log_map[uid]['time_in']
                student['remarks'] = log_map[uid]['remarks'] or 'On Time'
            else:
                student['remarks'] = 'No Record'

        return jsonify(students)

    except Exception as e:
        print(f"❌ Details Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# API: DEPT HEAD MANAGEMENT (Curriculum & Schedule)
# ==========================================

# ==========================================
# FACULTY & DEPT HEAD MANAGEMENT APIs (This was missing)
# ==========================================

# 1. GET ALL MANAGEMENT DATA
@app.route('/api/dept/management-data', methods=['GET'])
def get_management_data():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        sql_courses = """
            SELECT 
                s.subject_id, s.subject_code, s.subject_description as name, s.units,
                cs.schedule_id, cs.section, cs.day_of_week, cs.start_time, cs.end_time, cm.room_name,
                CONCAT(u.firstName, ' ', u.lastName) as assigned_faculty, u.user_id as faculty_id
            FROM Subjects s
            LEFT JOIN ClassSchedule cs ON s.subject_code = cs.course_code
            LEFT JOIN User u ON cs.faculty_id = u.user_id
            LEFT JOIN CameraManagement cm ON cs.camera_id = cm.camera_id
            ORDER BY s.created_at DESC
        """
        cursor.execute(sql_courses)
        courses = cursor.fetchall()
        for c in courses:
            c['schedule'] = f"{c['day_of_week']} {c['start_time']} - {c['end_time']}" if c['day_of_week'] else None

        cursor.execute("SELECT user_id, CONCAT(firstName, ' ', lastName) as name FROM User WHERE role = 'faculty'")
        faculty = cursor.fetchall()

        cursor.execute("SELECT camera_id, room_name FROM CameraManagement")
        rooms = cursor.fetchall()

        return jsonify({"courses": courses, "faculty": faculty, "rooms": rooms})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 2. CREATE NEW SUBJECT
@app.route('/api/dept/create-subject', methods=['POST'])
def create_subject():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO Subjects (subject_code, subject_description, units) VALUES (%s, %s, %s)", 
                       (data['code'], data['name'], data['units']))
        conn.commit()
        return jsonify({"message": "Subject created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 3. ASSIGN FACULTY
@app.route('/api/dept/assign-faculty', methods=['POST'])
def assign_faculty():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if data.get('schedule_id'):
            cursor.execute("UPDATE ClassSchedule SET faculty_id = %s WHERE schedule_id = %s", (data['faculty_id'], data['schedule_id']))
        else:
            cursor.execute("INSERT INTO ClassSchedule (course_code, faculty_id, section) VALUES (%s, %s, 'Section 1')", (data['subject_code'], data['faculty_id']))
        conn.commit()
        return jsonify({"message": "Faculty assigned"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 4. ASSIGN ROOM
@app.route('/api/dept/assign-room', methods=['POST'])
def assign_room():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT camera_id FROM CameraManagement WHERE room_name = %s", (data['room_name'],))
        room = cursor.fetchone()
        if not room: return jsonify({"error": "Room not found"}), 404
        
        if data.get('schedule_id'):
            cursor.execute("UPDATE ClassSchedule SET camera_id = %s, day_of_week = %s, start_time = %s, end_time = %s WHERE schedule_id = %s", 
                           (room[0], data['day'], data['start_time'], data['end_time'], data['schedule_id']))
        else:
            cursor.execute("INSERT INTO ClassSchedule (course_code, camera_id, day_of_week, start_time, end_time, section) VALUES (%s, %s, %s, %s, %s, 'Section 1')",
                           (data['subject_code'], room[0], data['day'], data['start_time'], data['end_time']))
        conn.commit()
        return jsonify({"message": "Room assigned"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        
# ==========================================
# API: UPLOAD & PARSE COR (PDF) - DYNAMIC SEARCH FIX
# ==========================================
@app.route('/api/student/upload-cor', methods=['POST'])
def upload_cor():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    user_id = request.form.get('user_id')
    
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    if not user_id: return jsonify({"error": "User ID missing"}), 400

    print(f"📄 Processing CoR for User {user_id}...")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        with pdfplumber.open(file) as pdf:
            first_page = pdf.pages[0]
            # Crop header to avoid noise
            top_half = first_page.crop((0, 0, first_page.width, first_page.height * 0.75)) 
            
            # Default extraction (most robust for text clustering)
            table = top_half.extract_table()
            
            if not table: return jsonify({"error": "Could not read table."}), 400

            parsed_subjects = []
            
            # --- 1. GET USER SECTION ---
            cursor.execute("SELECT section FROM User WHERE user_id = %s", (user_id,))
            res = cursor.fetchone()
            user_section = res[0] if res else 'BSIT-4A'

            for row in table[1:]: 
                if not row: continue 
                
                # Clean row: Remove None and empty strings
                clean_row = [str(x).replace('\n', ' ').strip() for x in row if x and str(x).strip() != '']
                
                # Skip garbage rows
                if not clean_row or len(clean_row) < 3: continue
                
                sub_code = clean_row[0]
                
                # Garbage Filter
                garbage_keywords = ['time:', 'date:', 'page', 'total', 'fee', 'assessment', 'payment', 'balance']
                if any(k in sub_code.lower() for k in garbage_keywords): continue

                # --- 2. DYNAMIC SEARCH STRATEGY ---
                # Find the TIME column first (Anchor Point)
                time_index = -1
                for i, cell in enumerate(clean_row):
                    # Check for Time Pattern (e.g., "7:00 AM-9:00 AM")
                    if ("AM" in cell or "PM" in cell) and ("-" in cell or "–" in cell):
                        time_index = i
                        break
                
                # Default Values
                days_raw = "TBA"
                time_raw = "TBA"
                section_raw = user_section
                
                if time_index != -1:
                    # FOUND TIME! Now map others relative to it.
                    time_raw = clean_row[time_index]
                    
                    # Day is usually immediately BEFORE Time
                    if time_index > 0:
                        days_raw = clean_row[time_index - 1]
                    
                    # Section is usually the LAST item
                    # Check if last item looks like a section (contains 'BS')
                    if "BS" in clean_row[-1] or "SECTION" in clean_row[-1].upper():
                        section_raw = clean_row[-1]
                    elif len(clean_row) > time_index + 1:
                         # If Room exists, Section might be after Room
                         section_raw = clean_row[-1]
                else:
                    # Fallback: If no Time pattern found, try standard indices
                    if len(clean_row) >= 7:
                        days_raw = clean_row[3]
                        time_raw = clean_row[4]
                        section_raw = clean_row[6]

                # --- 3. INSERT SUBJECT ---
                # Extract Title: Everything between Code and (Units/Day)
                # This is just a placeholder title if dynamic search is complex, usually row[1] is fine
                sub_title = clean_row[1] 
                
                cursor.execute("""
                    INSERT IGNORE INTO Subjects (subject_code, subject_description, units)
                    VALUES (%s, %s, 3)
                """, (sub_code, sub_title))

                # --- 4. SPLIT LOGIC & PARSING ---
                day_parts = [d.strip() for d in days_raw.split('/') if d.strip()]
                time_parts = [t.strip() for t in time_raw.split('/') if t.strip()]
                
                max_splits = max(len(day_parts), len(time_parts))

                for i in range(max_splits):
                    current_day_abbr = day_parts[i] if i < len(day_parts) else (day_parts[-1] if day_parts else 'TBA')
                    current_time_range = time_parts[i] if i < len(time_parts) else (time_parts[-1] if time_parts else 'TBA')

                    # Parse Day
                    day_map = {
                        'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'TH': 'Thursday', 'HU': 'Thursday',
                        'F': 'Friday', 'S': 'Saturday', 'SUN': 'Sunday', 'SU': 'Sunday'
                    }
                    clean_key = current_day_abbr.upper().replace('.', '').strip()
                    full_day = day_map.get(clean_key, current_day_abbr)
                    if len(full_day) < 3: full_day = 'TBA'

                    # Parse Time
                    start_time = "TBA"
                    end_time = "TBA"
                    clean_range = current_time_range.replace('–', '-') # Fix en-dash
                    if "-" in clean_range:
                        t_parts = clean_range.split('-')
                        if len(t_parts) >= 2:
                            start_time = t_parts[0].strip()
                            end_time = t_parts[1].strip()

                    # Find Camera (Optional: Map room from raw if needed, else NULL)
                    camera_id = None

                    # --- 5. INSERT SCHEDULE ---
                    check_sql = """
                        SELECT schedule_id FROM ClassSchedule 
                        WHERE course_code = %s AND section = %s AND day_of_week = %s AND start_time = %s
                    """
                    cursor.execute(check_sql, (sub_code, section_raw, full_day, start_time))
                    
                    if not cursor.fetchone():
                        print(f"   ➕ Adding: {sub_code} | {full_day} | {start_time}-{end_time} | Sec: {section_raw}")
                        cursor.execute("""
                            INSERT INTO ClassSchedule 
                            (course_code, section, day_of_week, start_time, end_time, camera_id, faculty_id)
                            VALUES (%s, %s, %s, %s, %s, %s, NULL)
                        """, (sub_code, section_raw, full_day, start_time, end_time, camera_id))

                parsed_subjects.append(sub_code)

            if parsed_subjects:
                courses_json = json.dumps(list(set(parsed_subjects)))
                cursor.execute("UPDATE User SET enrolled_courses = %s, section = %s WHERE user_id = %s", (courses_json, section_raw, user_id))
                
                notif_msg = f"Schedule generated. {len(set(parsed_subjects))} subjects verified."
                cursor.execute("INSERT INTO Notification (user_id, icon, message, is_read) VALUES (%s, 'fas fa-file-invoice', %s, FALSE)", (user_id, notif_msg))

            conn.commit()
            return jsonify({"message": "Schedule generated successfully!", "subjects": parsed_subjects}), 200

    except Exception as e:
        print(f"❌ CoR Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)