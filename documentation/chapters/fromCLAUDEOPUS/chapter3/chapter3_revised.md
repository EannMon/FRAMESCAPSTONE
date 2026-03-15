# Chapter 3

## METHODOLOGY

This chapter presents the methodology used in developing the **Facial Recognition and Attendance Monitoring with Embedded System (FRAMES)**: A Web-Based, Gesture-Gated Facial Recognition Attendance System Using Raspberry Pi. It covers the system architecture, design diagrams, development methodology, operations and testing procedures, and evaluation approach based on ISO/IEC 25010 standards.

---

## Project Design

The system design of FRAMES is illustrated through the following diagrams: System Architecture Overview, Context Data Flow Diagram, Top-Level Data Flow Diagram, Use Case Diagram, Entity-Relationship Diagram, Block Diagram, and Attendance Operation Sequence Diagram. Each diagram is documented in a separate file within this chapter's folder for clarity.

---

## System Architecture Overview

FRAMES employs a **two-pipeline edge-server architecture** that separates face enrollment (server-side) from face recognition (edge/Raspberry Pi). This separation optimizes both accuracy and performance for their respective contexts.

### Architecture Components

```
┌──────────────────────────────────────────────────────┐
│                    CLOUD LAYER                       │
│  ┌────────────────────────────────────────────────┐  │
│  │   PostgreSQL Database (Aiven Cloud, SSL)       │  │
│  │   - Users, Facial Profiles (512-d embeddings)  │  │
│  │   - Classes, Enrollments, Schedules            │  │
│  │   - Attendance Logs, Devices                   │  │
│  └──────────────────────┬─────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │  SSL/TLS
    ┌─────────────────────┼─────────────────────┐
    │               SERVER LAYER                │
    │  ┌─────────────────────────────────────┐  │
    │  │   FastAPI Backend (Python 3.12)     │  │
    │  │   - REST API Endpoints              │  │
    │  │   - Face Enrollment Service         │  │
    │  │     (InsightFace buffalo_sc)         │  │
    │  │   - SQLAlchemy 2.x ORM              │  │
    │  │   - bcrypt Authentication           │  │
    │  │   - Report Generation (CSV/PDF)     │  │
    │  └──────────┬──────────────────────────┘  │
    │             │                              │
    │  ┌──────────┴──────────────────────────┐  │
    │  │   Vite + React Frontend (JSX)       │  │
    │  │   - Student Dashboard               │  │
    │  │   - Faculty Dashboard               │  │
    │  │   - Department Head Dashboard       │  │
    │  │   - Face Enrollment Page            │  │
    │  │   - Bootstrap 5.3 (Responsive)      │  │
    │  │   - Chart.js / Recharts             │  │
    │  └─────────────────────────────────────┘  │
    └─────────────────┬─────────────────────────┘
                      │  HTTP/WebSocket
    ┌─────────────────┼─────────────────────────┐
    │            EDGE LAYER (RPi Kiosk)         │
    │  ┌─────────────────────────────────────┐  │
    │  │   Raspberry Pi 4 Model B (4GB)      │  │
    │  │   ┌─────────────────────────────┐   │  │
    │  │   │ USB Webcam (720p, UVC)      │   │  │
    │  │   │ → OpenCV Frame Capture      │   │  │
    │  │   └──────────┬──────────────────┘   │  │
    │  │              ↓                      │  │
    │  │   ┌──────────────────────────────┐  │  │
    │  │   │ MediaPipe BlazeFace (~30ms)  │  │  │
    │  │   │ → Face Detection Gate       │  │  │
    │  │   └──────────┬──────────────────┘  │  │
    │  │              ↓ (face found)         │  │
    │  │   ┌──────────────────────────────┐  │  │
    │  │   │ InsightFace buffalo_sc       │  │  │
    │  │   │ SCRFD → MobileFaceNet       │  │  │
    │  │   │ → 512-d Embedding (~300ms)  │  │  │
    │  │   └──────────┬──────────────────┘  │  │
    │  │              ↓                      │  │
    │  │   ┌──────────────────────────────┐  │  │
    │  │   │ Cosine Similarity Matching   │  │  │
    │  │   │ vs. Cached Embeddings (~1ms) │  │  │
    │  │   └──────────┬──────────────────┘  │  │
    │  │              ↓                      │  │
    │  │   ┌──────────────────────────────┐  │  │
    │  │   │ MediaPipe Hands (~30ms)      │  │  │
    │  │   │ → Gesture Detection          │  │  │
    │  │   │ → 3-frame Debounce           │  │  │
    │  │   └──────────┬──────────────────┘  │  │
    │  │              ↓                      │  │
    │  │   ┌──────────────────────────────┐  │  │
    │  │   │ Kiosk Display (7" HDMI IPS)  │  │  │
    │  │   │ → Camera Feed + Overlay      │  │  │
    │  │   │ → Status + Gesture Prompts   │  │  │
    │  │   │ → Check-in Log               │  │  │
    │  │   └─────────────────────────────┘  │  │
    │  └─────────────────────────────────────┘  │
    └───────────────────────────────────────────┘
```

### Two-Pipeline Architecture

#### Pipeline 1: Enrollment (Server-Side)

```
Browser Webcam → 3-5 Frames
                      ↓
           InsightFace buffalo_sc
           FaceAnalysis(det_size=640×640)
                      ↓
           512-d Embedding per frame
                      ↓
           Average + L2-Normalize
                      ↓
           Duplicate Check (cosine > 0.60 → reject)
                      ↓
           Store in PostgreSQL (facial_profiles table)
```

- Runs on the **server/laptop** with full compute
- Uses browser webcam for face capture
- Higher detection resolution (640×640) for maximum enrollment quality
- Averages multiple frame embeddings for noise reduction
- Checks for duplicate face enrollment (fraud prevention)

#### Pipeline 2: Recognition (Edge / Raspberry Pi)

```
USB Webcam (720p @ 15fps)
                      ↓
           MediaPipe BlazeFace Gate (~30ms)
           ├── No face → skip frame
           └── Face found →
                      ↓
           InsightFace buffalo_sc
           FaceAnalysis(det_size=320×320)
           ONNX Runtime on ARM64 CPU
                      ↓
           512-d Embedding (~300-500ms)
                      ↓
           Cosine Similarity vs. Cached Embeddings
           threshold ≥ 0.30 → Match!
                      ↓
           Gesture Confirmation (MediaPipe Hands)
           3-frame temporal smoothing
                      ↓
           POST /api/kiosk/attendance/log
           → Dashboard updates real-time
```

- Runs on the **Raspberry Pi 4** at the classroom
- Uses USB webcam for real-time video
- MediaPipe gate prevents unnecessary InsightFace calls
- Lower detection resolution (320×320) optimized for RPi speed
- Embeddings cached locally for offline operation

---

## Context Data Flow Diagram

*(See separate file: `diagrams/context_dfd.md`)*

The Context Level Data Flow Diagram presents FRAMES as a single process that interacts with four external entities:

| External Entity | Inputs to FRAMES | Outputs from FRAMES |
|-----------------|-------------------|---------------------|
| **Student** | Personal information, facial data (webcam frames), live facial scans at kiosk | Attendance confirmation, real-time status, personal attendance reports |
| **Faculty** | Personal information, facial data, live scans, class schedules (PDF upload) | Attendance confirmation, class-specific reports, student attendance summaries |
| **Department Head** | Login credentials, administrative requests | Faculty compliance reports, department-wide attendance summaries, room utilization insights |
| **USB Webcam + Raspberry Pi** | Captured facial frames, hand gesture data | Facial frame processing status, gesture processing status, kiosk display updates |

> **Note:** There is no separate Admin entity. System management functions are distributed between the Faculty and Department Head roles.

---

## Top-Level Data Flow Diagram

*(See separate file: `diagrams/top_level_dfd.md`)*

The Top-Level DFD expands the single FRAMES process into six interconnected processes:

1. **Process 1.0 — User Registration & Enrollment:** Students and faculty register accounts. Faculty accounts are verified by the Department Head. Student accounts are auto-created when a faculty member or the department head uploads a class schedule (PDF). First-time login redirects unregistered users to the Face Enrollment page.

2. **Process 2.0 — Face Enrollment (Server-Side):** The browser webcam captures 3–5 frames. InsightFace `buffalo_sc` extracts 512-d embeddings per frame. Embeddings are averaged, L2-normalized, and stored in the `facial_profiles` table in PostgreSQL. A duplicate check prevents the same face from enrolling under multiple accounts.

3. **Process 3.0 — Facial Recognition (Edge/RPi):** The Raspberry Pi kiosk captures frames from the USB webcam. MediaPipe BlazeFace serves as a fast pre-filter. InsightFace `buffalo_sc` (via ONNX Runtime) extracts embeddings and compares them against cached profiles using cosine similarity.

4. **Process 4.0 — Gesture Recognition:** After face recognition, MediaPipe Hands detects static hand gestures. A 3-frame debounce ensures consistent detection. Only confirmed face + gesture combinations trigger attendance logging. For entry, gesture is not required (face recognition alone suffices).

5. **Process 5.0 — Attendance Logging:** Validated recognition and gesture events are posted to the backend API. The backend creates attendance log records with timestamps, action types (ENTRY, BREAK_OUT, BREAK_IN, EXIT), verification method, and confidence scores. Logs are stored in the `attendance_logs` table.

6. **Process 6.0 — Report Generation & Dashboards:** Attendance data is aggregated into reports: personal summaries for students, class-specific reports for faculty, and department-wide summaries for the department head. Data is visualized on the React dashboard with real-time status indicators and exportable in CSV/PDF formats.

### Data Stores

| ID | Data Store | Contents |
|----|-----------|----------|
| D1 | Users Database | User profiles, roles (Student, Faculty, Department Head), authentication credentials |
| D2 | Facial Profiles | 512-d face embeddings, model version, enrollment quality scores |
| D3 | Class & Schedule Data | Subjects, classes, schedules, room assignments, enrollment records |
| D4 | Attendance Logs | Timestamped attendance events with action types and verification methods |
| D5 | Device Registry | Kiosk device registrations with assigned rooms |

---

## Use Case Diagram

*(See separate file: `diagrams/use_case.md`)*

The FRAMES use case diagram defines the following actors and their interactions:

### Actors

| Actor | Description |
|-------|-------------|
| **Student** | Enrolled class member who uses the kiosk for attendance and views personal records |
| **Faculty** | Instructor who manages classes, uploads schedules, and monitors student attendance |
| **Department Head** | Extends Faculty role with department-level oversight and faculty verification |
| **USB Webcam / RPi Kiosk** | Hardware actor providing face and gesture data |

### Use Cases by Actor

**Student:**
- Register Account (auto-created via schedule upload)
- Enroll Face (via web app webcam)
- Log Entry (face recognition at kiosk — no gesture required)
- Log Break-Out (peace sign gesture at kiosk)
- Log Break-In (thumbs-up gesture at kiosk)
- Log Exit (open palm gesture at kiosk)
- View Personal Attendance Records
- View Real-Time Status

**Faculty:**
- Register Account
- Enroll Face (via web app webcam)
- Upload Class Schedule (PDF → auto-creates student accounts)
- Log Entry / Break-Out / Break-In / Exit (same as Student)
- View Class Attendance Summary
- Generate Class Reports (CSV/PDF)
- View Student Attendance Details

**Department Head** (extends Faculty):
- Verify Faculty Accounts
- View Department-Wide Attendance Summary
- View Faculty Attendance Reports
- Generate Department Reports (CSV/PDF)

**USB Webcam / RPi Kiosk:**
- Capture Facial Frames
- Capture Gesture Data
- Display Recognition Results
- Display Anomaly Notifications (unrecognized individuals)

> **Anomaly Notification:** When the kiosk detects and recognizes a face that does not belong to any student enrolled in the currently scheduled class for that room, it flags the individual as an anomaly. This notification alerts the faculty that an unauthorized individual is attempting to log attendance.

---

## Database Design (Entity-Relationship Diagram)

*(See separate file: `diagrams/database_erd.md`)*

The FRAMES database schema includes the following core tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `departments` | Academic departments | id, name, code |
| `programs` | Academic programs under departments | id, name, code, department_id |
| `users` | All user accounts | id, email, password_hash, first_name, last_name, role (STUDENT/FACULTY/HEAD), face_registered, department_id |
| `facial_profiles` | Face embeddings (one per user) | id, user_id, embedding (BLOB, 2048 bytes), model_version, num_samples, enrollment_quality |
| `subjects` | Course subjects | id, code, title, units |
| `classes` | Class sections with schedules | id, subject_id, faculty_id, room, day_of_week, start_time, end_time, semester |
| `enrollments` | Student-class enrollment | id, student_id, class_id |
| `devices` | Kiosk device registrations | id, name, room, status |
| `attendance_logs` | Timestamped attendance events | id, user_id, class_id, device_id, action (ENTRY/BREAK_OUT/BREAK_IN/EXIT), verified_by (FACE/AUTO_TIMEOUT), confidence_score, timestamp, remarks, is_late |

### Key Relationships

- `users` → `departments` (many-to-one)
- `users` → `facial_profiles` (one-to-one)
- `classes` → `subjects` (many-to-one)
- `classes` → `users[faculty]` (many-to-one)
- `enrollments` → `users[student]` + `classes` (junction table)
- `attendance_logs` → `users` + `classes` + `devices` (many-to-one each)

### Privacy Design

- The `facial_profiles.embedding` column stores only the 512-dimensional numerical vector (2,048 bytes), **not** raw facial images
- Model version is tracked to ensure embedding compatibility
- All database connections use SSL/TLS encryption via Aiven Cloud

---

## Block Diagram (Hardware Architecture)

*(See separate file: `diagrams/block_diagram.md`)*

```
┌───────────────┐
│  Power Source  │
│  5V 3A USB-C  │
└───────┬───────┘
        │
        ↓
┌───────────────────────────────────────────────────┐
│              Raspberry Pi 4 Model B               │
│              (4 GB LPDDR4 RAM)                    │
│              ARM Cortex-A72 @ 1.5 GHz             │
│                                                   │
│  ┌────────────────┐  ┌──────────────────────────┐ │
│  │ ONNX Runtime   │  │ Python 3.11+             │ │
│  │ InsightFace    │  │ OpenCV, MediaPipe        │ │
│  │ buffalo_sc     │  │ Kiosk Server (Uvicorn)   │ │
│  └────────────────┘  └──────────────────────────┘ │
│                                                   │
│  USB 2.0 Ports        HDMI Port      WiFi/ETH    │
│     ↕                    ↕              ↕         │
└─────┼────────────────────┼──────────────┼─────────┘
      │                    │              │
      ↓                    ↓              ↓
┌──────────┐    ┌──────────────────┐   ┌──────────┐
│ USB      │    │ 7" HDMI IPS      │   │ Network  │
│ Webcam   │    │ Kiosk Display    │   │ (WiFi /  │
│ (720p    │    │ (1024×600)       │   │  LAN)    │
│  UVC)    │    │                  │   │  → API   │
└──────────┘    │ ┌──────────────┐ │   └──────────┘
                │ │📹 Camera Feed│ │
                │ │ + Overlays   │ │
                │ ├──────────────┤ │
                │ │🕐 Time/Date  │ │
                │ │📚 Class Info │ │
                │ ├──────────────┤ │
                │ │🤟 Gesture    │ │
                │ │   Guide      │ │
                │ ├──────────────┤ │
                │ │✅ Check-ins  │ │
                │ │   Log        │ │
                │ └──────────────┘ │
                └──────────────────┘
```

### Hardware Components

| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Raspberry Pi 4 Model B** | Quad-core ARM Cortex-A72 at 1.5 GHz, 4 GB LPDDR4 RAM | Main processing unit for real-time recognition and gesture detection |
| **USB Webcam** | 720p (1280×720), 30fps, UVC-compliant, 90° FOV | Primary image acquisition device for face and gesture capture |
| **7" HDMI IPS Display** | 1024×600 resolution, USB touch | Kiosk interface showing camera feed, status, gesture guide, and check-in log |
| **Power Supply** | 5V 3A USB-C | Stable power delivery to the Raspberry Pi |
| **Network** | Wi-Fi (campus network) or Ethernet | Communication with the FastAPI backend for attendance sync |
| **Keyboard & Mouse** | USB peripherals | Initial setup and troubleshooting (not required during operation) |

> **Note:** Unlike the original design which specified a Raspberry Pi Camera Module V2 (CSI) and an SSD, the updated FRAMES kiosk uses a standard USB webcam and relies on network-synced cloud storage (PostgreSQL on Aiven) rather than local SSD storage. This simplifies the hardware setup and reduces cost.

---

## Attendance Operation Sequence Diagram

*(See separate file: `diagrams/attendance_sequence.md`)*

The attendance operation follows this sequence for each user interaction at the kiosk:

### Entry Sequence (No Gesture Required)

```
Student          USB Webcam         RPi Kiosk           Backend API          Dashboard
   │                  │                  │                    │                   │
   │  Stand in front  │                  │                    │                   │
   │──────────────────→                  │                    │                   │
   │                  │  Capture frame   │                    │                   │
   │                  │─────────────────→│                    │                   │
   │                  │                  │ MediaPipe gate     │                   │
   │                  │                  │ (face detected)    │                   │
   │                  │                  │                    │                   │
   │                  │                  │ InsightFace        │                   │
   │                  │                  │ buffalo_sc         │                   │
   │                  │                  │ → 512-d embedding  │                   │
   │                  │                  │                    │                   │
   │                  │                  │ Cosine similarity  │                   │
   │                  │                  │ vs. cached data    │                   │
   │                  │                  │ → MATCH (≥ 0.30)   │                   │
   │                  │                  │                    │                   │
   │                  │                  │ POST /attendance   │                   │
   │                  │                  │───────────────────→│                   │
   │                  │                  │                    │ Log ENTRY          │
   │                  │                  │                    │──────────────────→│
   │                  │                  │     200 OK         │                   │
   │  "Welcome,       │                  │←───────────────────│    Update status  │
   │   [Name]!"       │                  │                    │    (green)        │
   │←─────────────────────────────────────                    │                   │
```

### Break-Out / Break-In / Exit Sequence (Gesture Required)

```
Student          USB Webcam         RPi Kiosk           Backend API          Dashboard
   │                  │                  │                    │                   │
   │  [Face recognized — same as above]  │                    │                   │
   │                  │                  │                    │                   │
   │                  │                  │ Prompt gesture     │                   │
   │  "Show gesture"  │                  │ on kiosk screen    │                   │
   │←─────────────────────────────────────                    │                   │
   │                  │                  │                    │                   │
   │  Perform gesture │                  │                    │                   │
   │  (e.g., ✌️)      │                  │                    │                   │
   │──────────────────→                  │                    │                   │
   │                  │  Capture frame   │                    │                   │
   │                  │─────────────────→│                    │                   │
   │                  │                  │ MediaPipe Hands    │                   │
   │                  │                  │ detect gesture     │                   │
   │                  │                  │ (3-frame debounce) │                   │
   │                  │                  │                    │                   │
   │                  │                  │ POST /attendance   │                   │
   │                  │                  │ action: BREAK_OUT  │                   │
   │                  │                  │───────────────────→│                   │
   │                  │                  │                    │ Log BREAK_OUT      │
   │                  │                  │                    │──────────────────→│
   │  "Break logged"  │                  │     200 OK         │    Update status  │
   │←─────────────────────────────────────←───────────────────│    (yellow)       │
```

---

## Project Development Methodology

FRAMES follows the **Waterfall methodology**, a sequential development model where each phase must be substantially completed before the next begins. This approach ensures traceability and systematic validation.

### Phase 1: Analyze

In this phase, the researchers identified and documented the functional and non-functional requirements:

- Real-time attendance tracking through facial recognition (InsightFace `buffalo_sc`)
- Hand gesture-based confirmation for break-out, break-in, and exit actions (MediaPipe Hands)
- Dashboard-driven visualization with role-based access (Student, Faculty, Department Head)
- Edge-server architecture with Raspberry Pi 4 as the kiosk device
- Feasibility analysis confirming that the Raspberry Pi 4 with a USB webcam provides an affordable embedded platform for processing facial and gesture data

### Phase 2: Design

This phase produced the system architecture, user flows, and database schemas:

- Two-pipeline architecture (enrollment on server, recognition on edge)
- Wireframes and dashboards for all three user roles
- Database schema (PostgreSQL) with embedding storage, attendance logs, and class schedules
- Kiosk UI layout with camera feed, gesture guide, and check-in log
- Block diagram of hardware components

### Phase 3: Create (Implementation)

Implementation integrated the selected technologies:

**Backend (FastAPI + PostgreSQL):**
- FastAPI server with SQLAlchemy 2.x ORM
- InsightFace `buffalo_sc` for face enrollment
- REST API endpoints for authentication, face enrollment, attendance logging, schedule management, and reports
- PostgreSQL on Aiven Cloud with SSL

**Frontend (Vite + React):**
- React-based dashboard with Student, Faculty, and Department Head modules
- Bootstrap 5.3 for responsive layout
- Chart.js / Recharts for attendance visualization
- Axios for API communication

**Edge/Kiosk (Raspberry Pi 4):**
- InsightFace `buffalo_sc` via ONNX Runtime for recognition
- MediaPipe BlazeFace for detection gating and Hands for gesture detection
- OpenCV for USB webcam frame capture
- Kiosk server (Uvicorn) with HTML/JS overlay UI
- Embedding cache for offline-capable recognition

**Gesture Implementation:**
- Peace sign (two fingers) → Break-out
- Thumbs-up → Break-in
- Open palm → Exit
- Entry → Automatic upon face recognition (no gesture required)

### Phase 4: Test

Testing ensures system accuracy and reliability:

- **Unit testing:** Facial recognition accuracy, gesture detection rates, database logging
- **Integration testing:** Communication between kiosk, backend API, and dashboard
- **System testing:** End-to-end attendance logging and report generation
- **User acceptance testing:** Pilot deployment with students, faculty, and department head
- **Performance testing:** Recognition speed, FPS, memory usage on Raspberry Pi 4

### Phase 5: Evaluate

Evaluation uses the **ISO/IEC 25010 Software Quality Model** focusing on:
1. Functional Suitability
2. Performance Efficiency
3. Interaction Capability
4. Reliability
5. Security

Structured Likert-scale survey questionnaires are administered to students (~50), faculty (1), and the department head (1) after a one-day pilot deployment in Room 328.

---

## Operations and Testing Procedures

### System Startup and User Flows

**System Startup:**
1. The FastAPI backend server is started on the laptop/server
2. The Raspberry Pi kiosk server is started, connecting to the backend API
3. Users access the web dashboard through a standard browser (Chrome, Firefox)

**User Login and Role Verification:**

| Role | Login Process | First-Time Requirement |
|------|--------------|------------------------|
| **Department Head** | Signs in with email/password → accesses Management tab for faculty verification | Must complete face enrollment before accessing dashboard |
| **Faculty** | Registers account → verified by Department Head → manages classes | Must complete face enrollment; uploads class schedule (PDF) to auto-create student accounts |
| **Student** | Account auto-created via faculty schedule upload → signs in with generated credentials | Must complete face enrollment before accessing dashboard |

**The Facial Registration Gate:**
- When a user (Faculty or Student) logs in for the first time, the system checks `face_registered` status
- If `face_registered = false`, the dashboard is blocked and the user is redirected to the **Face Enrollment Page**
- The enrollment page captures 3–5 frames via the browser webcam, processes them through InsightFace `buffalo_sc`, and stores the averaged 512-d embedding

**Kiosk Attendance Process:**
- The Raspberry Pi kiosk is placed at the classroom entrance (Room 328)
- The USB webcam continuously captures frames
- The kiosk activates **10 minutes before** the official class `start_time` (early entry window), allowing students and faculty to log attendance early without being marked late
- Students and faculty approach the kiosk for attendance actions:
  - **Face recognized → Entry logged automatically** (no gesture needed)
  - **Peace Sign (✌️)** → Break-out logged
  - **Thumbs-Up (👍)** → Break-in logged
  - **Open Palm (✋)** → Exit logged
- At class `end_time`, the system automatically logs an **EXIT (`AUTO_TIMEOUT`)** for all users who did not manually exit, ensuring records are always complete
- Recognition results and status are displayed on the 7-inch kiosk screen
- All logs are synced to the backend database in real-time

**Real-Time Monitoring:**
- The web dashboard displays real-time attendance status with color-coded indicators:
  - 🟢 **Green** — Present (inside classroom)
  - 🟡 **Yellow** — On Break
- Faculty and Department Head can view who is currently in the room

**Data Export:**
- Faculty and the Department Head can download attendance summaries in PDF or CSV formats

---

### Testing Procedures Based on ISO/IEC 25010

The following test procedures are aligned with the five selected ISO/IEC 25010 quality characteristics:

#### Table 1. Functional Suitability Test

| Test Module | Test Scenario | Steps |
|------------|---------------|-------|
| **Attendance Logging (Face + Gesture)** | System correctly identifies user and logs attendance based on face and gesture | 1. Approach kiosk. 2. Wait for face detection. 3. Observe automatic entry log. 4. Verify dashboard status shows Green. 5. Perform peace sign for break-out. 6. Verify dashboard shows Yellow. 7. Perform thumbs-up for break-in. 8. Verify return to Green. 9. Perform open palm for exit. |
| **Early Entry Window** | System accepts attendance 10 minutes before class official start time | 1. Set system clock or class schedule so current time is 8 minutes before class start. 2. Approach kiosk. 3. Verify kiosk shows active class and logs entry. 4. Confirm entry is marked ON TIME (is_late = false). 5. Verify dashboard reflects early entry status. |
| **Auto-Exit at Class End** | System auto-logs EXIT for users still present when class ends | 1. Ensure a user is logged as PRESENT (ENTRY recorded, no EXIT). 2. Allow class end_time to pass. 3. Verify backend logs an EXIT record with verified_by = AUTO_TIMEOUT and remarks = [AUTO_EXIT]. 4. Confirm dashboard no longer shows user as active. |
| **Dashboard Update Accuracy** | Attendance and status indicators update in real time | 1. Perform multiple attendance actions. 2. Check dashboard reflection time. 3. Confirm updates appear without manual refresh via WebSocket. |
| **Report Generation** | Exportable reports match logged attendance data | 1. Generate CSV/PDF report for the test class. 2. Compare report entries against database logs. 3. Verify completeness and accuracy. |
| **Anomaly Detection** | Unrecognized individuals are correctly flagged | 1. Have an un-enrolled person face the kiosk. 2. Verify "Unrecognized" is displayed with red bounding box. 3. Confirm no attendance is logged. |

#### Table 2. Performance Efficiency Test

| Test Module | Test Scenario | Steps |
|------------|---------------|-------|
| **Recognition Speed** | System responds within acceptable delay | 1. Time system response from face detection to confirmation. 2. Repeat under different positions/angles. 3. Record latency; target ≤ 2 seconds per recognition. |
| **System Load and Stability** | System maintains performance under sequential user interactions | 1. Have 5–10 students log attendance in sequence. 2. Monitor CPU usage and memory on Raspberry Pi. 3. Confirm no freezing or crashes. |
| **Dashboard Responsiveness** | Dashboard remains responsive during data load | 1. Open dashboard with full attendance data. 2. Check page load time. 3. Navigate between views. 4. Confirm no lag or timeout errors. |

#### Table 3. Interaction Capability (Usability) Test

| Test Module | Test Scenario | Steps |
|------------|---------------|-------|
| **User Interface Navigation** | First-time users can navigate the dashboard | 1. Log in as Student, Faculty, or Department Head. 2. Explore sidebar and features. 3. Locate attendance logs and reports. 4. Assess clarity of labels and feedback messages. |
| **Gesture Recognition Feedback** | Kiosk provides clear guidance and confirmation | 1. Attempt each gesture at kiosk. 2. Observe gesture prompts and visual guides. 3. Evaluate success/failure message clarity. |
| **Mobile Responsiveness** | Dashboard adapts to different screen sizes | 1. Open dashboard on desktop and mobile phone. 2. Check UI scaling and readability. 3. Verify interactive elements respond properly. |

#### Table 4. Reliability Test

| Test Module | Test Scenario | Steps |
|------------|---------------|-------|
| **Consistent Logging** | Logs remain consistent after repeated operations | 1. Perform 5+ entry/exit cycles. 2. Check database for duplicate or missing entries. 3. Confirm log order and timestamps are accurate. |
| **Error Recovery** | System recovers from hardware/connection errors | 1. Briefly disconnect USB webcam and reconnect. 2. Attempt recognition again. 3. Verify that logs and dashboard data persist. |
| **Recognition Consistency** | Same user recognized reliably across attempts | 1. Have the same student perform 10 consecutive recognition attempts. 2. Record success rate and confidence scores. 3. Verify consistency ≥ 95%. |

#### Table 5. Security Test

| Test Module | Test Scenario | Steps |
|------------|---------------|-------|
| **Authentication and Access Control** | Unauthorized role access is blocked | 1. Attempt to access Faculty/Department Head pages with a Student account. 2. Verify access is denied. 3. Confirm proper session handling and logout. |
| **Spoofing Prevention** | Gesture gating prevents photo-based spoofing | 1. Present a printed photo of an enrolled user to the kiosk. 2. Observe if the system requires a gesture. 3. Verify that attendance is not logged for a static photo (no gesture possible). |
| **Data Privacy** | Facial data stored as embeddings only | 1. Inspect database `facial_profiles` table. 2. Confirm only numerical embedding vectors are stored (no raw images). 3. Verify SSL/TLS encryption on database connection. |
| **Unknown User Handling** | Unregistered individuals are flagged | 1. Have a non-enrolled person face the kiosk. 2. Verify anomaly alert on kiosk display. 3. Confirm entry is blocked and logged separately. |

---

## Evaluation Procedure

The evaluation procedure assesses FRAMES's overall performance, functionality, and user acceptance using the **ISO/IEC 25010 Software Quality Model**.

### Evaluation Steps

1. **Deployment Setup:** FRAMES is deployed in Room 328, College of Science Building, Computer Studies Department, TUP–Manila. The hardware (Raspberry Pi 4, USB webcam, kiosk display) is installed and configured. The backend and frontend are hosted on the server.

2. **Data Preparation:** In addition to real attendance data generated during the one-day testing, **seeded attendance data** is generated in accordance with the format of the system's actual attendance data structure. This seeded data enables comprehensive evaluation of reporting features beyond the limited single-day dataset.

3. **Demonstration Video:** A comprehensive demonstration video of all FRAMES features is prepared for the faculty member and department head, covering face enrollment, kiosk attendance, dashboard navigation, and report generation. This supplements their hands-on interaction, given that they are the sole users of their respective modules.

4. **Hands-On Testing:** 
   - **Students (~50):** Enroll their faces via the web application, use the kiosk for attendance throughout the testing day, and access their personal attendance records on the dashboard.
   - **Faculty (1):** Uses the system for class management, monitors student attendance, generates reports, and interacts with the kiosk.
   - **Department Head (1):** Reviews department-level reports, verifies faculty accounts, and evaluates administrative features.

5. **Survey Administration:** After the testing period, all participants complete structured survey questionnaires based on a **4-point Likert scale** aligned with the five ISO/IEC 25010 characteristics:

   | Scale | Adjectival Rating | Range |
   |-------|-------------------|-------|
   | 4 | Highly Acceptable | 3.4 – 4.0 |
   | 3 | Very Acceptable | 2.6 – 3.3 |
   | 2 | Acceptable | 1.8 – 2.5 |
   | 1 | Not Acceptable | 1.0 – 1.7 |

6. **Data Analysis:** Survey responses are tabulated using Microsoft Excel. Weighted means are computed per item, per ISO/IEC 25010 characteristic, and overall. Results are interpreted using the adjectival rating scale.

7. **Results Presentation:** Findings are presented in tabular and graphical formats showing system performance per quality characteristic, with discussion of strengths and areas for improvement.

### Respondent Summary

| Respondent Group | Count | Evaluation Method |
|------------------|-------|-------------------|
| Students | ~50 | Hands-on system use + survey questionnaire |
| Faculty | 1 | Hands-on system use + demonstration video + survey questionnaire |
| Department Head | 1 | Hands-on system use + demonstration video + survey questionnaire |

> **Note on Limited Evaluators:** Since the faculty member and department head are the only credible evaluators who directly used the system in its intended roles, the demonstration video ensures they can evaluate all features comprehensively despite the limited deployment scope.
