import os

# --- 🛠️ CRITICAL FIX FOR INTEL GPU CRASH ---
# Ito ang pipigil sa "vpg-compute-neo" error
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# --- Ngayon pa lang i-import ang iba ---
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
from deepface import DeepFace  # DeepFace must be imported AFTER setting os.environ

# ... (rest of your code) ...

import cv2
import mysql.connector
import numpy as np
import base64
import pickle
import json
import bcrypt
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import DB_CONFIG
from deepface import DeepFace

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

                print(f"✅ Login Successful for: {user['firstName']}")
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
# API: GET USER PROFILE (Smart Version)
# ==========================================
@app.route('/user/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True) 

    try:
        # 1. Fetch EVERYTHING
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
# API: VERIFY PASSWORD (Step 1 of Change Password)
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

# ==========================================
# API: CHANGE PASSWORD (Step 2)
# ==========================================
@app.route('/user/change-password', methods=['PUT'])
def change_password():
    data = request.json
    user_id = data.get('user_id')
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({"error": "Password is required"}), 400

    # Hash the NEW password
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
                face_embedding_vgg, face_status,
                last_active, date_registered
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s,
                %s, %s,
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
            face_blob, face_status
        )

        cursor.execute(sql, val)
        conn.commit()
        user_id = cursor.lastrowid
        
        print(f"✅ Success! User {user_id} registered with Face Status: {face_status}")
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
# STUDENT MODULE APIs
# ==========================================

# 1. Get Dashboard Stats & Notifications
@app.route('/api/student/dashboard/<int:user_id>', methods=['GET'])
def get_student_dashboard(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # A. Attendance Rate (Total IN logs / Total Expected - Simplified calculation)
        cursor.execute("SELECT COUNT(*) as count FROM EventLog WHERE user_id = %s AND event_type = 'attendance_in'", (user_id,))
        total_attendance = cursor.fetchone()['count']
        
        # B. Enrolled Courses (Get JSON)
        cursor.execute("SELECT enrolled_courses FROM User WHERE user_id = %s", (user_id,))
        courses_json = cursor.fetchone()['enrolled_courses']
        # Handle if None or String
        course_count = 0
        if courses_json:
            if isinstance(courses_json, str):
                courses_json = json.loads(courses_json)
            course_count = len(courses_json)

        # C. Notifications
        cursor.execute("SELECT * FROM Notification WHERE user_id = %s ORDER BY created_at DESC LIMIT 5", (user_id,))
        notifications = cursor.fetchall()
        
        # D. Recent Attendance
        cursor.execute("""
            SELECT e.timestamp, c.course_name, cm.room_name 
            FROM EventLog e 
            LEFT JOIN CameraManagement cm ON e.camera_id = cm.camera_id
            -- NOTE: Simplified join. In reality, join with ClassSchedule based on time.
            LEFT JOIN ClassSchedule c ON c.camera_id = e.camera_id 
            WHERE e.user_id = %s AND e.event_type = 'attendance_in'
            ORDER BY e.timestamp DESC LIMIT 3
        """, (user_id,))
        recent_logs = cursor.fetchall()

        return jsonify({
            "attendance_rate": f"{min(total_attendance * 10, 100)}%", # Dummy calc: 10% per login
            "enrolled_courses": course_count,
            "notifications": notifications,
            "recent_attendance": recent_logs
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 2. Get Student Schedule (FILTERED BY ENROLLED COURSES)
@app.route('/api/student/schedule/<int:user_id>', methods=['GET'])
def get_student_schedule(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Get Student Section AND Enrolled Courses
        cursor.execute("SELECT section, enrolled_courses FROM User WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()
        
        if not result or not result['section']:
            return jsonify([]) # No section, no schedule

        section = result['section']
        enrolled_json = result['enrolled_courses']
        
        # Parse enrolled courses (handle string or list)
        enrolled_list = []
        if enrolled_json:
            if isinstance(enrolled_json, str):
                enrolled_list = json.loads(enrolled_json)
            else:
                enrolled_list = enrolled_json
        
        # 2. Get Schedule for Section BUT Filter by Course Code
        # Gumamit tayo ng dynamic SQL generation para sa IN clause
        if not enrolled_list:
             return jsonify([]) # Enrolled in nothing

        format_strings = ','.join(['%s'] * len(enrolled_list))
        
        sql = f"""
            SELECT cs.day_of_week, cs.start_time, cs.end_time, cs.course_name, cm.room_name, cs.course_code
            FROM ClassSchedule cs
            LEFT JOIN CameraManagement cm ON cs.camera_id = cm.camera_id
            WHERE cs.section = %s 
            AND cs.course_code IN ({format_strings}) -- FILTER HERE
            ORDER BY cs.start_time
        """
        
        # Combine section + enrolled list for parameters
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
        sql = """
            SELECT e.timestamp, e.event_type, e.confidence_score, cm.room_name
            FROM EventLog e
            LEFT JOIN CameraManagement cm ON e.camera_id = cm.camera_id
            WHERE e.user_id = %s
            ORDER BY e.timestamp DESC
        """
        cursor.execute(sql, (user_id,))
        logs = cursor.fetchall()
        return jsonify(logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)