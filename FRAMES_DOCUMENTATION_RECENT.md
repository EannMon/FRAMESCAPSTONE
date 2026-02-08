# FRAMES Documentation
## Facial Recognition Attendance and Monitoring System
**Using Gesture-Gated Actions and Raspberry Pi**

---

## 1. Introduction
CAPSTONE TITLE: FRAMES: A Web-Based, Gesture-Gated Facial Recognition Attendance System Using Raspberry Pi

FRAMES (Facial Recognition Attendance and Monitoring System) is a web-based, smart attendance system designed for classroom environments. It automates attendance logging using facial recognition while introducing gesture-gated confirmation to ensure intentional and authorized actions. The system is deployed using Raspberry Pi kiosks installed in classrooms and is supported by a centralized web platform for administration, reporting, and monitoring.

Unlike traditional attendance systems that rely on manual roll calls or RFID cards, FRAMES minimizes human intervention, prevents proxy attendance, and ensures that attendance actions are deliberate through gesture confirmation for sensitive actions such as break-out, break-in, and exit.

---

## 2. What is a Business Process?

A **business process** is the step-by-step flow of activities that explains:
- Who does what
- Using which system
- In what order
- To achieve a specific goal

In FRAMES, the business process explains **how attendance is recorded from the moment a user is registered until reports are generated**, treating the system as a real business product rather than just a technical prototype.

---

## 3. System Users (Actors)

### 3.1 Students
- Register facial data 
- Attend classes
- Perform attendance actions (entry, break, exit)
- View personal attendance records

### 3.2 Faculty Members
- Register facial data
- Teach assigned classes (resulted by the uploaded schedule)
- Upload schedules (auto creates student account, if needed)
- Perform attendance actions
- View class attendance summaries

### 3.3 Faculty Head (also teaches)
- Register facial data
- Teach assigned classes (resulted by the uploaded schedule)
- Upload schedules (auto creates student account, if needed)
- Perform attendance actions
- View class attendance summaries
- View department attendance summaries in both faculty members and student
- Verifies faculty accounts
- Views department-wide attendance and reports

### 3.4 Program Coordinator / Admin
- Views system-wide analytics
- Generates reports across programs they handle
- Manages departments and programs
- No classroom attendance actions

---

## 4. Final Business Process (DEFENSE-READY)

### 4.1 Account Creation & Verification
1. Faculty Head creates account.
2. Faculty member creates their account and will be verified by the faculty head that headed their department.
3. Student accounts are auto-created by Faculty Head or Faculty member as they upload their class schedule.
4. User logs in using credentials (email + password).
5.. If `face_registered = false`, the system **blocks dashboard access**.
6. User is redirected to **Facial Enrollment Page**.

---

### 4.2 Facial Enrollment Process (WEB – Laptop / PC)

> This process runs on a **central server**, NOT on Raspberry Pi.

1. User is prompted to:
   - Ensure good lighting
   - Face the webcam
   - Remove masks or obstructions
2. System captures **15 frames** from webcam.
3. Each frame passes through:
   - Face detection
   - Face alignment
   - Face embedding extraction (FaceNet)
4. Embeddings are averaged into **one stable embedding vector**.
5. Final embedding is stored in `facial_profiles` table.
6. `face_registered` flag is set to `true`.
7. User is redirected to dashboard.

📌 **Important:**  
Only embeddings are stored — **no raw images**, ensuring privacy compliance.

---

### 4.3 Classroom Attendance Process (Raspberry Pi – EDGE)

#### ENTRY (No Gesture Required)
1. User stands in front of kiosk camera.
2. Raspberry Pi captures face frame.
3. TFLite FaceNet model extracts embedding.
4. Embedding is compared with database embeddings.
5. If confidence ≥ threshold:
   - Attendance logged as `ENTRY`
   - Verified by `FACE`
6. Kiosk displays confirmation.

---

#### BREAK OUT / BREAK IN / EXIT (Gesture Required)
1. Face is recognized first.
2. Kiosk prompts user to perform a **specific hand gesture**. (Peace Sign or two finger raised which is pinter finger and middle finger signifies the user wants to go to a break, thumbs up signifies the user wants to go back to room from a break, and palm open signifies the user will exit the scheduled room )
3. MediaPipe Hands detects static gesture.
4. If face + gesture are valid:
   - Attendance logged
   - Verified by `FACE+GESTURE`
5. If gesture fails → action rejected.

📌 Gesture gating prevents:
- Accidental logging
- Unauthorized usage
- Walk-by detections

---

### 4.4 Reporting & Analytics
- Attendance logs are aggregated per:
  - Student
  - Class
  - Faculty
  - Department
- Charts and summaries are displayed via web dashboard.
- Exportable reports support administrative decisions.

---

## 5. Enrollment Pipeline vs Recognition Pipeline

### 5.1 What is a Pipeline?

A **pipeline** is a sequence of processing steps where the output of one step becomes the input of the next.

---

### 5.2 Enrollment Pipeline (SERVER-SIDE)

**Purpose:** Create a high-quality reference embedding.

Steps:
1. Webcam Capture
2. Face Detection
3. Face Alignment
4. Embedding Extraction (FaceNet – full model)
5. Embedding Averaging
6. Store in Database

📌 Runs on:
- Laptop / PC
- Central server
- No TFLite required (performance is acceptable)

---

### 5.3 Recognition Pipeline (EDGE – Raspberry Pi)

**Purpose:** Fast real-time matching.

Steps:
1. Pi Camera Capture
2. Face Detection
3. TFLite FaceNet Inference (INT8)
4. Cosine Similarity Matching
5. Threshold Decision
6. Gesture Verification (optional)
7. Attendance Logging

📌 Runs on:
- Raspberry Pi
- Requires TFLite for speed & efficiency

---

## 6. What is EDGE Computing? (SIMPLE)

**Edge computing** means processing data **near where it is captured**, instead of sending everything to a server.

### In FRAMES:
- Face recognition runs on the **Raspberry Pi**
- Database & dashboards run on the **server**

### Why Edge?
- Faster response
- Less bandwidth
- Works even with unstable internet
- Privacy-friendly

---

## 7. Why TensorFlow Lite (TFLite)?

### Why NOT DeepFace on Raspberry Pi?
- Heavy dependencies
- Slow inference
- Requires high RAM
- Not optimized for ARM CPUs

### Why TFLite + FaceNet?
- Designed for edge devices
- Supports quantization (INT8)
- Faster inference (2–5×)
- Lower memory usage

📚 Studies support:
- MobileNetV2 + FaceNet performs well under constrained hardware
- INT8 quantization preserves accuracy with major speed gains

---

## 8. Model Quantization (INT8)

### What is Quantization?
Converting model weights from 32-bit floats to 8-bit integers.

### Benefits:
- Smaller model size
- Faster inference
- Lower power usage

### Used ONLY in:
- Recognition pipeline
- Raspberry Pi deployment

---

## 9. Database Schema (Final)

### Core Tables
- departments
- programs
- users
- facial_profiles
- subjects
- classes
- enrollments
- devices
- attendance_logs

### Key Privacy Decision
- `facial_profiles.embedding` stores **vectors only**
- No images
- GDPR / Data Privacy Act compliant

---

## 10. Technology Stack (FINAL – DEFENSE LOCKED)

### Edge / AI
- MobileNetV2 + FaceNet
- TensorFlow Lite (INT8) for rasp pi
- MediaPipe Hands
- Pi Camera v2 
-insightface for face enrollment pipeline

### Backend
- Python
- FastAPI (async)
- SQLAlchemy
- Aiven PostgreSQL

### Frontend
- Vite + React (JSX)
- Axios
- Chart.js / Recharts

### Device
- Raspberry Pi 4 (4GB+)
- Kiosk small

---

## 11. Security Measures Explained

| Feature | Purpose |
|------|-------|
| SSL Connection | Encrypts DB traffic |
| Environment Variables | Prevents credential leaks |
| Connection Pooling | Prevents DB overload |
| Pre-ping Check | Avoids stale DB connections |

---

## 12. Deployment Overview

- Backend hosted on cloud VM
- Database hosted on Aiven
- Raspberry Pi devices registered as trusted devices
- Frontend served as web app
- Kiosks run fullscreen

---

## 13. System Limitations

- Requires stable lighting
- Internet required for syncing
- Designed for classroom-scale deployment
- Not evaluated for enterprise-wide campuses

---

## 14. Why FRAMES is Defensible

✔ Real business workflow  
✔ Privacy-aware design  
✔ Edge computing justified  
✔ Gesture-gated innovation  
✔ Realistic hardware constraints  
✔ Clear separation of pipelines  

---

## 15. Conclusion

FRAMES demonstrates a practical, secure, and scalable approach to smart attendance systems by combining facial recognition, gesture-based confirmation, and edge computing. The system is suitable for academic environments and provides a strong foundation for future enhancements such as offline caching, liveness detection, and advanced analytics.

---

END OF DOCUMENTATION
