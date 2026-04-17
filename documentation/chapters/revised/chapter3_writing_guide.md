# Chapter 3 — Writing Guide
## Your Personal Blueprint: What to Write, Where, and With What Data

> **How to use this guide:**
> - Each section tells you: how many paragraphs, what the paragraph is about, and the specific facts/data to include.
> - You write the actual sentences. This is just your map.
> - Data points in bullets = the exact numbers, terms, and facts to weave in.
> - The goal of each paragraph is stated so you know what point you are making.

---

## SECTION 0: Chapter Opening (1 paragraph)

**Goal of this paragraph:** Tell the reader what Chapter 3 contains — a brief overview of everything they will find in this chapter.

**Data/facts to include:**
- The full name of the system: FRAMES (Facial Recognition and Attendance Monitoring with Embedded System)
- Subtitle: A Web-Based, Gesture-Gated Facial Recognition Attendance System Using Raspberry Pi
- What the chapter covers: project design, system architecture, diagrams, project development process, testing, and evaluation procedure
- The evaluation framework used: ISO/IEC 25010:2023 Software Quality Model

---

## SECTION 1: Project Design (3 paragraphs)

---

### Paragraph 1 — What type of study design is used

**Goal:** Explain that the study uses a developmental-descriptive design and define what that means in the context of this project.

**Data/facts to include:**
- Term to use: developmental-descriptive design
- The developmental aspect = designing and building the actual system
- What was built: a web-based attendance monitoring system with embedded facial recognition and gesture-gated logging on Raspberry Pi hardware, connected to a cloud dashboard
- The descriptive aspect = analyzing and presenting the system's capabilities, workflows, and outputs through pilot testing and user evaluation
- Why this design was chosen: the study aims to both solve a problem AND document the process for future reference in similar biometric deployments

---

### Paragraph 2 — What tools and diagrams were used for design

**Goal:** List the specific diagrams produced during system design and briefly say what each one shows.

**Data/facts to include:**
- Context Data Flow Diagram → shows the external entities that interact with the system
- Top-Level Data Flow Diagram → decomposes the system into major internal processes
- Use Case Diagram → defines role-based interactions and system functions
- System Architecture Diagram → illustrates the two-pipeline design linking edge device, cloud backend, and web frontend
- Block Diagram → maps the physical hardware components and connections
- Entity-Relationship Diagram (ERD) → documents the database schema design hosted on Aiven Cloud PostgreSQL

---

### Paragraph 3 — The three design principles

**Goal:** Explain the three core architectural principles that guided the design decisions.

**Data/facts to include:**
- Principle 1: Separation between edge processing (facial recognition and gesture detection on the Raspberry Pi) and cloud storage (attendance records, reports, dashboards on the FastAPI backend)
- Principle 2: Role-based access control that scopes data visibility to each user's responsibilities
- Principle 3: Real-time data synchronization so that kiosk attendance events are immediately reflected on the web dashboard

---

## SECTION 2: System Architecture (4 paragraphs)

> **Note:** Figure 1 (the architecture diagram) goes between the section title and Paragraph 1.

---

### Paragraph 1 — Overview of the architecture

**Goal:** Introduce the two-pipeline architecture and give a high-level description of the three subsystems.

**Data/facts to include:**
- The term: two-pipeline architecture
- What the separation means: enrollment happens server-side, recognition happens edge-side
- The three layers: Edge Device (Raspberry Pi kiosk), Cloud Backend (FastAPI on Render), Web Frontend (React on Vercel)
- The database: PostgreSQL hosted on Aiven Cloud with SSL encryption
- These three layers are interconnected through HTTPS API calls

---

### Paragraph 2 — Edge Device layer

**Goal:** Describe the Raspberry Pi kiosk hardware and the recognition pipeline it runs.

**Data/facts to include:**
- Hardware: Raspberry Pi 4 Model B, 4 GB RAM, USB webcam, 7-inch HDMI IPS display (1024×600), housed in a kiosk enclosure at the classroom entrance
- Schedule resolver runs FIRST: queries the backend API (with local cache fallback) to determine the active class for the assigned room based on day and time. If no class is active, the kiosk displays "No active class scheduled" and skips all recognition — no CPU resources are wasted on empty periods
- Only when an active class exists does the recognition pipeline activate:
  - Stage 1: MediaPipe BlazeFace (lightweight pre-filter, approximately 30 ms) — checks if a face is present
  - Stage 2: InsightFace buffalo_sc model (only runs if a face is detected, approximately 200 ms) — does SCRFD face detection AND MobileFaceNet embedding extraction
  - This gated approach conserves ARM CPU resources by skipping heavy inference when no face is in frame
- After identity: MediaPipe Hands performs gesture detection for attendance state transitions
- Attendance logger: transmits events via HTTPS; when offline, stores events in a local JSON queue and flushes them every 5 minutes upon reconnection

---

### Paragraph 3 — Cloud Backend layer

**Goal:** Describe what the backend does, how it is built, and its key services.

**Data/facts to include:**
- Framework: FastAPI (Python 3.11+) with SQLAlchemy ORM, deployed on Render
- Database: PostgreSQL on Aiven Cloud with SSL
- What the API provides: authentication, attendance logging, face enrollment, schedule management, report generation
- Face enrollment service: processes base64-encoded webcam frames from the web interface, extracts 512-dimensional embeddings using the same buffalo_sc model, validates quality (minimum score of 0.75), checks for duplicates via cosine similarity (threshold 0.55), averages multiple samples into one stable vector, stores only the normalized embedding — no raw facial images are kept
- PDF schedule parser: uses pdfplumber to extract data from faculty class list PDFs exported from the TUP Portal — each PDF contains one subject with its schedule details (day, time, venue, section) and the complete list of enrolled students with their TUPM IDs
- Report service: aggregates attendance data with a thread-safe in-memory cache (15-second TTL)

---

### Paragraph 4 — Web Frontend layer

**Goal:** Describe the web application, its technology, and how it connects to the backend.

**Data/facts to include:**
- Tech stack: Vite, React 19.2, Bootstrap 5.3, Chart.js and Recharts for data visualization
- Deployed on: Vercel
- Three role-based modules: Student, Faculty, Department Head — each scoped to show only data relevant to that role
- All API communication goes through a centralized Axios client
- Authentication: JWT dual-token system — 24-hour access tokens, 7-day refresh tokens
- Interceptors handle automatic token attachment and redirect to login on 401 responses

---

## SECTION 3: Context Data Flow Diagram (5 paragraphs)

> **Note:** Figure 2 (Context DFD) goes before these paragraphs.

---

### Paragraph 1 — Introduction to the Context DFD

**Goal:** Briefly describe what the Context DFD shows and identify the four external entities.

**Data/facts to include:**
- At this level, the system is shown as a single process bubble
- Four external entities: Student, Faculty, Department Head, Raspberry Pi Kiosk
- Each entity has bidirectional data flows with the system (inputs and outputs)

---

### Paragraph 2 — Student entity flows

**Goal:** Explain what data the Student sends in and receives back.

**Data/facts to include:**
- Inputs to system: personal information, facial data during web-based enrollment (5 to 30 webcam frames), live facial scans at the kiosk, hand gestures at the kiosk
- Outputs from system: attendance confirmation on the kiosk screen, real-time attendance status on the web dashboard, personal attendance reports with compliance tier indicators, notifications for attendance events
- Compliance tiers: Compliant (95% or above), Acceptable (85% or above), Warning (75% or above), Probation (below 75%)

---

### Paragraph 3 — Faculty entity flows

**Goal:** Explain what data the Faculty sends in and receives back.

**Data/facts to include:**
- Inputs to system: personal information, facial data, class list PDFs exported from the TUP Portal (one PDF per subject, listing the schedule and all enrolled students), student invitation codes, session exceptions (cancellations, rescheduling, online marking)
- Outputs from system: attendance confirmation at the kiosk (faculty also scan for their own attendance), class-specific attendance reports with per-student breakdowns, real-time indicators for active classes, exportable records in CSV and PDF formats
- Faculty can monitor attendance without manually tracking students

---

### Paragraph 4 — Department Head entity flows

**Goal:** Explain the dual role of the Department Head as both teacher and manager, and their data flows.

**Data/facts to include:**
- Dual role: teacher AND department manager
- As teacher: uploads class list PDFs from the TUP Portal, manages enrolled students, scans at the kiosk
- As manager:
  - Sends faculty invitations via 48-hour email invitation tokens
  - Configures active academic year, semester, start and end dates
  - Approves or rejects pending faculty accounts (faculty cannot log in until verified)
  - Manages subjects catalog and device registrations
- Outputs from system: department-wide attendance reports, faculty compliance data, room utilization summaries, system audit logs, exportable reports

---

### Paragraph 5 — Raspberry Pi Kiosk entity flows

**Goal:** Explain what the kiosk sends to the system and what it receives back, emphasizing the bidirectional synchronization.

**Data/facts to include:**
- Inputs to system: captured facial frames from USB webcam, hand gesture data from MediaPipe Hands, periodic device heartbeat signals, system metrics (frame processing time, memory usage)
- Outputs from system: recognition results (match or anomaly), attendance state prompts (which gesture to perform next), embedding cache updates when enrollments change, active class schedule for the assigned room
- Key point: bidirectional flow allows the kiosk to operate as a real-time terminal synchronized with the cloud while also maintaining capability during network interruptions

---

## SECTION 4: Top-Level Data Flow Diagram (7 paragraphs)

> **Note:** Figure 3 (Top-Level DFD) goes before these paragraphs.

---

### Paragraph 1 — Introduction to the Top-Level DFD

**Goal:** Explain that this diagram expands the single FRAMES process into six processes and introduces five data stores.

**Data/facts to include:**
- Expands context DFD into 6 numbered processes (P1.0 through P6.0)
- Five data stores: D1 (User Database), D2 (Facial Profiles), D3 (Class and Enrollment Data), D4 (Attendance Logs), D5 (Reports and Notifications)
- These data stores serve as persistent repositories accessible across processes

---

### Paragraph 2 — Process 1.0: User Registration and Authentication

**Goal:** Describe the account creation and facial enrollment process in detail.

**Data/facts to include:**
- Who uses it: Students, Faculty, Department Head
- Student accounts: auto-created during schedule upload (receive default credentials based on TUPM-ID) OR self-register via invitation link
- Faculty: register through 48-hour email invite tokens sent by the Department Head
- Department Head approves or rejects pending faculty: faculty cannot log in or enroll face until status is VERIFIED
- Facial enrollment: user uploads 5 to 30 webcam frames through the web interface
- System processes: extracts 512-dimensional embeddings using InsightFace buffalo_sc, validates quality (minimum score 0.75), checks for duplicate identities (cosine similarity threshold 0.55), averages sample embeddings into one stable vector, normalizes it, stores in D2
- What is stored in D1: user credentials, profile data, face_registered boolean flag
- Privacy note: no raw facial images are retained — only the 2,048-byte numerical embedding vector

---

### Paragraph 3 — Process 2.0: Schedule Management

**Goal:** Describe how class schedules and student enrollments are managed.

**Data/facts to include:**
- Who uses it: Faculty and Department Head
- Input format: PDF files — specifically, faculty class list PDFs exported from the TUP Portal (each PDF contains one subject with its schedule and the full list of enrolled students with their TUPM IDs)
- Parser used: pdfplumber
- What is extracted: subject codes, subject names, sections, room assignments (venues), days of the week, time slots
- Result: class records created in D3, student accounts auto-created with TUPM-IDs and linked to class enrollments
- Additional faculty controls: session exceptions (cancellations, rescheduling to online, holiday markings), late arrival thresholds in minutes per class
- Department Head can also configure: active academic year, semester, semester start and end dates, subjects catalog

---

### Paragraph 4 — Process 3.0: Facial Recognition

**Goal:** Describe the on-device face recognition pipeline and how it connects to the other processes.

**Data/facts to include:**
- Runs entirely on the edge device (Raspberry Pi) — NOT via API
- IMPORTANT: the schedule resolver determines the active class FIRST (from P2.0 / D3). Only when an active class is resolved does the recognition pipeline activate. If no class is active, the kiosk idles and skips recognition entirely
- Two-stage gated pipeline:
  - Stage 1: MediaPipe BlazeFace (~30 ms) — checks for face presence
  - Stage 2: InsightFace buffalo_sc → SCRFD for detection, MobileFaceNet for embedding extraction (~200 ms)
- Embedding compared via cosine similarity against in-memory cache (only enrolled students of the active class from D3)
- Match threshold: 0.40 cosine similarity
- If first scan with no prior record: proceeds to P5.0 for automatic ENTRY (face only, no gesture)
- If active record exists: forwards confirmed identity to P4.0 for gesture verification

---

### Paragraph 5 — Process 4.0: Gesture Recognition

**Goal:** Describe how gestures are detected, classified, and confirmed.

**Data/facts to include:**
- Triggered only after identity is confirmed by P3.0 AND student already has an active attendance record
- Model used: MediaPipe Hands, 21-landmark hand detection
- Gesture-to-action mapping:
  - Peace sign (two extended fingers) → BREAK_OUT
  - Thumbs-up → BREAK_IN
  - Open palm (all five fingers extended) → EXIT
- Classification method: distance-based finger extension detection, extension ratio threshold 1.3
- Temporal debouncing: gesture must persist across 3 consecutive frames to be confirmed
- Purpose of debouncing: prevents false positives from momentary hand positions

---

### Paragraph 6 — Process 5.0: Attendance Logging

**Goal:** Describe what gets recorded in each log entry and the auto-exit mechanism.

**Data/facts to include:**
- Receives events from P3.0 (auto-entry) or P4.0 (gesture-confirmed transitions)
- Each log entry captures: user identity, class association, device identifier, action type (ENTRY, BREAK_OUT, BREAK_IN, or EXIT), verification method (FACE / FACE+GESTURE / AUTO_TIMEOUT), recognition confidence score, detected gesture name, late status, timestamp, optional remarks
- Late flag: triggered if entry occurs after start_time + late_threshold_minutes
- Auto-exit: when class end time is reached, the system generates EXIT records with AUTO_TIMEOUT verification for all students still in an active session
- Outputs: attendance confirmation displayed on the kiosk screen, notifications stored in D5

---

### Paragraph 7 — Process 6.0: Report Generation and Dashboards

**Goal:** Describe the reporting system and what each role receives.

**Data/facts to include:**
- Aggregates data from D4 (Attendance Logs), D3 (Class and Enrollment Data), D1 (User Database)
- 8 report types: daily attendance, late analysis, break log, weekly summary, monthly trends, 30-day history, attendance consistency, absent log
- Cache: thread-safe in-memory cache with 15-second TTL
- Student output: personal attendance history with compliance tier indicators (Compliant, Acceptable, Warning, Probation)
- Faculty output: class-level summaries with per-student attendance rates, late counts, exportable CSV/PDF reports
- Department Head output: department-wide analytics, faculty compliance data across all instructors, room utilization summaries

---

## SECTION 5: Use Case Diagram (5 paragraphs)

> **Note:** Figure 4 (Use Case Diagram) goes before these paragraphs.

---

### Paragraph 1 — Introduction to the Use Case Diagram

**Goal:** Introduce what the diagram shows, who the actors are, and how use cases are grouped.

**Data/facts to include:**
- Shows how each actor interacts with specific system functions
- Four actors: Faculty Member (left), Department Head (left), Kiosk (right), Student (right)
- Use cases consolidated into shared and role-specific groups reflecting the final diagram
- Student and Faculty Member share: Register Facial Data, Log Attendance, View Real-Time Attendance, Generate Personal Reports
- Faculty Member exclusive: Upload & Manage Class List, Manage Session Exceptions, Set Attendance Rules, Generate Class Reports
- Department Head exclusive: Invite Faculty, Generate Faculty Reports, Configure Department & Academic Settings
- Kiosk exclusive: Resolve Active Class Schedule, Flag Unrecognized Individual, Send Device Heartbeat, Detect Hand Gestures, Capture Facial Frames

---

### Paragraph 2 — Student actor use cases

**Goal:** Describe all use cases the Student actor is connected to.

**Data/facts to include:**
- Student connects to 4 shared use cases
- Register Facial Data: web-based enrollment using 5 to 30 webcam frames; produces 512-dimensional embedding stored server-side
- Log Attendance: face scan at the kiosk for automatic ENTRY; subsequent state transitions (BREAK_OUT, BREAK_IN, EXIT) via gestures (peace sign, thumbs-up, open palm)
- View Real-Time Attendance: dashboard showing current attendance status with compliance tier indicators (Compliant 95%+, Acceptable 85%+, Warning 75%+, Probation below 75%)
- Generate Personal Reports: personal attendance history with per-class breakdowns and compliance tier indicators

---

### Paragraph 3 — Faculty Member actor use cases

**Goal:** Describe all use cases the Faculty Member is connected to, noting shared and exclusive ones.

**Data/facts to include:**
- Faculty Member connects to 4 shared use cases (same as Student) PLUS 4 exclusive use cases
- Shared: Register Facial Data, Log Attendance (scans at kiosk for own attendance), View Real-Time Attendance, Generate Personal Reports
- Upload & Manage Class List: uploads class list PDFs exported from the TUP Portal; pdfplumber parses subject code, schedule, section, venue, and student roster with TUPM IDs; auto-generates student accounts and enrollment records
- Manage Session Exceptions: marks individual sessions as cancelled, rescheduled, online, or holiday, preventing those sessions from affecting attendance calculations
- Set Attendance Rules: configures late arrival threshold (in minutes) per class
- Generate Class Reports: class-level attendance summaries with per-student attendance rates, late counts, and exportable CSV/PDF records

---

### Paragraph 4 — Department Head actor use cases

**Goal:** Describe all use cases for the Department Head, emphasizing the dual role as teacher and manager.

**Data/facts to include:**
- Department Head connects to shared use cases plus 3 exclusive management use cases
- Shared with Faculty Member: Register Facial Data, Log Attendance, View Real-Time Attendance, Generate Personal Reports, Upload & Manage Class List, Generate Class Reports
- Invite Faculty: sends 48-hour email invitation tokens; invited faculty register and enroll face, then await approval
- Generate Faculty Reports: department-wide attendance analytics, faculty compliance data across all instructors, room utilization summaries
- Configure Department & Academic Settings: sets active academic year, active semester, semester start and end dates; manages subjects catalog and device registrations; approves or rejects pending faculty accounts (faculty cannot access the system until approved)

---

### Paragraph 5 — Kiosk (Raspberry Pi) actor use cases

**Goal:** Describe the automated operations the kiosk performs.

**Data/facts to include:**
- Kiosk actor represents the Raspberry Pi hardware; all 5 use cases are fully automated (no direct human interaction)
- Resolve Active Class Schedule: queries backend API (with local cache fallback for offline operation) to identify the currently active class for the assigned room; recognition pipeline only activates when an active class is found
- Capture Facial Frames: USB webcam feeds the two-stage gated pipeline — BlazeFace pre-filter (~30 ms) then InsightFace buffalo_sc embedding extraction (~200 ms)
- Detect Hand Gestures: MediaPipe Hands 21-landmark model classifies peace sign, thumbs-up, and open palm; 3-frame temporal debouncing prevents false positives
- Flag Unrecognized Individual: when cosine similarity of a detected face falls below threshold 0.40 against all enrolled embeddings, the event is logged as a security anomaly in the security_logs table
- Send Device Heartbeat: periodic signals transmitted to the backend confirming operational status and reporting system metrics (frame processing time, memory usage)

---

## SECTION 6: Database Design / ERD (6 paragraphs)

> **Note:** Figure 5 (ERD) goes before these paragraphs.

---

### Paragraph 1 — Overview of the database

**Goal:** Introduce the ERD and give the top-level facts about the schema.

**Data/facts to include:**
- Hosted on: Aiven Cloud PostgreSQL with SSL encryption
- Total number of tables: 17
- Purpose: supports attendance tracking, facial recognition, gesture-gated logging, schedule management, role-based reporting, anomaly detection, and system monitoring

---

### Paragraph 2 — Organizational hierarchy tables

**Goal:** Describe the colleges → departments → programs structure and the departments table.

**Data/facts to include:**
- colleges table: top level (e.g., College of Science)
- departments table: one or more per college (e.g., Computer Studies Department); also stores active_academic_year, active_semester, semester_start_date, semester_end_date
- programs table: one or more per department (e.g., BSIT, BSIS, BSCS)

---

### Paragraph 3 — Users table (the central entity)

**Goal:** Describe the users table as the central entity that ties everything together.

**Data/facts to include:**
- Supports 4 roles via userrole enum: STUDENT, FACULTY, HEAD, ADMIN
- Each user belongs to a department (and optionally to a program)
- Students identified by tupm_id (e.g., TUPM-XX-XXXXX); faculty and heads by employee_id
- verification_status field: PENDING, VERIFIED, REJECTED — controls account activation; faculty need department head approval
- face_registered boolean: mandatory before accessing web dashboard features

---

### Paragraph 4 — Facial profiles table and privacy considerations

**Goal:** Describe what the facial_profiles table stores and explain the privacy-by-design approach.

**Data/facts to include:**
- One record per user (unique constraint on user_id)
- Stores: 512-dimensional embedding as bytea binary (2,048 bytes = 512 float32 values), model version (insightface_buffalo_sc_v1), number of enrollment samples, enrollment quality score (minimum 0.75)
- No raw facial images are stored — embedding only
- This is privacy-by-design, consistent with the Data Privacy Act of 2012 (RA 10173)

---

### Paragraph 5 — Classes, enrollments, and attendance logs

**Goal:** Describe the three core transactional tables.

**Data/facts to include:**
- classes table: links subject + faculty, records room, day_of_week, start_time, end_time (SQL Time type), section, semester, academic_year, late_threshold_minutes (default 0)
- enrollments table: many-to-many between students and classes; unique constraint on (class_id, student_id); both FKs use ON DELETE CASCADE
- attendance_logs table: highest-volume table; captures user, class, device, action (ENTRY/BREAK_OUT/BREAK_IN/EXIT via attendanceaction enum), verification method (FACE/FACE+GESTURE/AUTO_TIMEOUT via verificationmethod enum), confidence_score, gesture_detected, is_late, remarks, timestamp
- Performance: composite index on (user_id, class_id, timestamp) for optimized queries

---

### Paragraph 6 — Supporting tables

**Goal:** Describe the remaining 7 supporting tables and their purposes.

**Data/facts to include:**
- devices: tracks kiosk units; room, IP, device name, status enum (ACTIVE/INACTIVE/MAINTENANCE), last_heartbeat
- notifications: per-user alerts, 11 notification types
- security_logs: records anomalies — unrecognized faces, gesture failures, spoof attempts, unauthorized access
- session_exceptions: faculty marks sessions as cancelled, online, holiday (onsite is default)
- audit_logs: administrative trail with JSON old/new values
- user_invites: 48-hour email invitation tokens with used boolean
- support_tickets: file attachment support (up to 3 JPGs or 1 PDF, max 5 MB)
- system_metrics: performance telemetry from kiosk devices (frame times, memory usage)

---

## SECTION 7: Block Diagram (3 paragraphs)

> **Note:** Figure 6 (Block Diagram) goes before these paragraphs.

---

### Paragraph 1 — Power, input, and processing

**Goal:** Describe the power supply, USB webcam input, and the Raspberry Pi as the processing unit.

**Data/facts to include:**
- Power: 5V 3A USB-C power supply
- Processing unit: Raspberry Pi 4 Model B, quad-core ARM Cortex-A72 @ 1.5 GHz, 4 GB LPDDR4 RAM
- USB Webcam: 720p, UVC-compliant, connects via USB 2.0
- Frame capture mode on RPi: 480×360 resolution at 15 FPS (to conserve processing bandwidth)
- For comparison, laptop testing mode: 640×480 at 30 FPS
- Camera abstraction: supports both Picamera2 (for native CSI camera on Bookworm) and OpenCV VideoCapture (for USB webcam or laptop)

---

### Paragraph 2 — Output devices and network

**Goal:** Describe the display, optional audio output, and network connectivity.

**Data/facts to include:**
- Display: 7-inch HDMI IPS display, 1024×600 resolution
- What the display shows: live camera feed with bounding boxes and name overlays, attendance confirmation messages, gesture prompts with visual guides, anomaly alerts for unrecognized faces, class info (current subject, room, time)
- Optional audio: buzzer or speaker via 3.5 mm jack or GPIO for audible feedback
- Network: built-in Wi-Fi or Ethernet; all cloud communication over HTTPS

---

### Paragraph 3 — Software stack running on the Pi

**Goal:** List and briefly explain all software components running on the Raspberry Pi.

**Data/facts to include:**
- OS: Raspberry Pi OS Bookworm 64-bit
- Runtime: Python 3.11+
- OpenCV: frame capture and image preprocessing
- ONNX Runtime (CPUExecutionProvider): inference engine for running models on ARM CPU
- InsightFace buffalo_sc: SCRFD (face detection) + MobileFaceNet (embedding extraction)
- MediaPipe BlazeFace: lightweight pre-filter gate, runs before InsightFace on every frame
- MediaPipe Hands: 21-landmark hand gesture detection
- Key point: all recognition happens locally on the device — no raw frames are ever sent to the API; matching uses numpy-based batch cosine similarity on in-memory embeddings

---

## SECTION 8: Attendance State Machine (4 paragraphs)

> **Note:** Figure 7 (State Machine diagram) goes before these paragraphs.

---

### Paragraph 1 — Introduction to the state machine

**Goal:** Introduce the concept and name the four states a student moves through.

**Data/facts to include:**
- This is the core operational logic of FRAMES
- Four attendance states: ENTRY, BREAK_OUT, BREAK_IN, EXIT
- Plus a starting condition: no record yet (first scan)
- Plus a system-triggered final state: AUTO_TIMEOUT exit

---

### Paragraph 2 — Entry (first recognition)

**Goal:** Explain how the first scan works and the late-flag mechanism.

**Data/facts to include:**
- Student approaches the kiosk for the first time in a session (no prior attendance record for that class on that day)
- System automatically logs an ENTRY — face only, no gesture required
- Reasoning: standing in front of the camera implies attendance intent
- Verification method stored: FACE
- Late flag: if entry occurs after start_time + late_threshold_minutes, the record is flagged as late
- Field set: is_late = true

---

### Paragraph 3 — State transitions (break and exit)

**Goal:** Walk through all possible state transitions and the gestures that trigger them.

**Data/facts to include:**
- ENTRY → BREAK_OUT: peace sign (two extended fingers)
- BREAK_OUT → BREAK_IN: thumbs-up
- BREAK_IN → BREAK_OUT: peace sign again (student can take multiple breaks)
- BREAK_IN → EXIT: open palm (five extended fingers)
- ENTRY → EXIT: open palm (skip break entirely)
- All gesture-gated transitions: require face re-recognition AND correct gesture
- Verification method stored: FACE+GESTURE
- Temporal debouncing: gesture must be held for 3 consecutive frames

---

### Paragraph 4 — Auto-timeout exit

**Goal:** Explain the automatic system-triggered exit at class end.

**Data/facts to include:**
- When: scheduled class end time is reached
- Who it affects: students who still have an active session (in ENTRY or BREAK_IN state)
- What happens: system automatically generates EXIT records for all of them
- Verification method stored: AUTO_TIMEOUT
- Purpose: ensures complete attendance records even when students forget to scan out

---

## SECTION 9: Recognition Pipeline Flowchart (3 paragraphs)

> **Note:** Figure 8 (Pipeline Flowchart) goes before these paragraphs.

---

### Paragraph 1 — From frame capture to identity match

**Goal:** Describe the first half of the pipeline: schedule resolution → frame capture → BlazeFace gate → InsightFace → cosine match.

**Data/facts to include:**
- Pre-condition: schedule resolver has already determined the active class for the room. If no active class, recognition does not run at all
- Starting point: camera captures a frame
- BlazeFace gate: runs first (~30 ms); if no face detected, frame is skipped entirely (saves ~200 ms per frame)
- If face detected: SCRFD performs precise face localization, MobileFaceNet extracts 512-D embedding
- Embedding compared against in-memory cache using batch cosine similarity (np.dot() on numpy matrix)
- Match threshold: 0.40 cosine similarity
- Below threshold: flagged as unrecognized, security event logged
- Above threshold but not enrolled in active class: message shown on screen

---

### Paragraph 2 — From identity match to attendance action

**Goal:** Describe the second half of the pipeline: after match, check state, then branch to auto-entry or gesture.

**Data/facts to include:**
- After identity confirmed AND enrollment verified: check current attendance state
- No record → automatic ENTRY logged (face only)
- Active record → gesture prompt displayed on screen based on required next action
- MediaPipe Hands detects hand gesture using distance-based finger extension ratios
- Wrong gesture: prompt shown again
- Correct gesture must be held 3 consecutive frames (debounce)
- Only after debounce confirmation: action is logged

---

### Paragraph 3 — Why the gated architecture matters for the RPi

**Goal:** Briefly explain the performance rationale for the two-stage design.

**Data/facts to include:**
- Context: Raspberry Pi has a 2.5 GB usable memory ceiling (OS takes 1.2 GB, InsightFace model takes ~600 MB, MediaPipe ~200 MB)
- InsightFace inference: ~200 ms per call
- BlazeFace pre-filter: ~30 ms per call
- In a real classroom, most frames have no person in front of the camera
- Running InsightFace on every frame would waste ~200 ms per empty frame
- The BlazeFace gate dramatically reduces the number of InsightFace calls, keeping the pipeline within the sub-250 ms per-frame budget on the Raspberry Pi

---

## SECTION 10: Visual Table of Contents (4 paragraphs)

> **Note:** Figure 9 (VTOC diagram) goes before these paragraphs.

---

### Paragraph 1 — Introduce the VTOC

**Goal:** Explain what the visual table of contents shows.

**Data/facts to include:**
- Shows the hierarchical feature structure of each module
- Four modules: Student Module, Faculty Module, Department Head Module, Kiosk Interface

---

### Paragraph 2 — Student Module and Faculty Module

**Goal:** Describe the features available in each of these two modules.

**Data/facts to include:**
- Student Module (5 areas): Dashboard (attendance rate, compliance tier, recent activity), Schedule (weekly timetable), Attendance History (paginated per-class logs), Reports (8 report types), Profile (account settings, face enrollment)
- Faculty Module (7 areas): Dashboard (class stats, today's overview), Class Management (upload class list PDFs from TUP Portal, add/remove students), Attendance (live room status, per-student logs), Reports (CSV/PDF export), Session Exceptions (cancel/reschedule/online), Invite Students (48-hour email links), Profile

---

### Paragraph 3 — Department Head Module

**Goal:** Describe the administrative features available to the Department Head.

**Data/facts to include:**
- 7 areas: Dashboard (department-wide overview, attendance trends), Faculty Management (invite/approve/reject), Subjects and Programs (CRUD operations), Devices (register and monitor kiosk units), Reports (department-wide, faculty compliance, room utilization), Academic Config (year, semester, dates), System Logs (audit trail)

---

### Paragraph 4 — Kiosk Interface

**Goal:** Describe the five display areas on the kiosk screen.

**Data/facts to include:**
- 5 display areas on the 7-inch HDMI display
- Camera Feed: live preview with bounding boxes and name labels
- Recognition Display: identified user's name, attendance status, confidence score
- Gesture Prompt: which gesture is required for the user's current state, with a visual guide
- Anomaly Alert: appears when an unrecognized face is detected
- Class Info: current subject, room number, scheduled time

---

## SECTION 11: Attendance Data Flow Sequence (3 paragraphs)

> **Note:** Figure 10 (Sequence Diagram) goes before these paragraphs.

---

### Paragraph 1 — Entry flow (face only)

**Goal:** Walk through what happens when a student scans for the first time.

**Data/facts to include:**
- Student approaches kiosk
- Two-stage pipeline runs: BlazeFace (~30 ms) → InsightFace buffalo_sc (~200 ms)
- 512-D embedding compared against in-memory cache via batch cosine similarity
- If match >= 0.40 AND enrolled in active class AND no prior record: ENTRY logged automatically
- Kiosk POSTs to backend API: POST /api/kiosk/attendance/log
- Backend inserts the record into PostgreSQL
- Kiosk displays confirmation on screen

---

### Paragraph 2 — Break/exit flow (face + gesture)

**Goal:** Walk through what happens for subsequent attendance transitions.

**Data/facts to include:**
- Student faces the camera AND shows a hand gesture
- Same recognition pipeline re-verifies identity
- MediaPipe Hands detects the gesture simultaneously
- Gesture must match required action for current state
- Must be held for 3 consecutive frames
- If confirmed: kiosk POSTs action to API with verification_method = FACE+GESTURE
- Kiosk displays which gesture is needed if wrong gesture shown

---

### Paragraph 3 — Auto-exit flow (system triggered)

**Goal:** Explain how the kiosk handles class end automatically.

**Data/facts to include:**
- When: kiosk's schedule resolver detects that class end_time has been reached
- Kiosk sends bulk auto-exit request to backend API
- API generates EXIT records for all students who remain in ENTRY or BREAK_IN state
- Verification method stored: AUTO_TIMEOUT
- Ensures no incomplete attendance records at class end

---

## SECTION 12: Project Development — Waterfall (5 paragraphs)

> **Note:** Figure 11 (Waterfall diagram) goes somewhere in this section.

---

### Paragraph 1 — Why Waterfall was chosen

**Goal:** Justify the choice of Waterfall methodology for this project.

**Data/facts to include:**
- Waterfall: a sequential methodology where each phase must complete before the next begins
- Why it fits this project: requirements were well-defined from the start — recognition pipeline, gesture mapping, dashboard features, database schema could all be specified in advance
- This is unlike iterative approaches where requirements evolve during development
- 5 phases: Analyze, Design, Create, Test, Evaluate

---

### Paragraph 2 — Analyze phase

**Goal:** Describe what was done during requirements analysis.

**Data/facts to include:**
- Identified functional requirements: real-time facial recognition attendance tracking, gesture-gated state logging (ENTRY/BREAK_OUT/BREAK_IN/EXIT), early entry window (10 minutes before class start), auto-exit at class end, role-based dashboards, exportable reports in CSV and PDF, anomaly detection for unrecognized individuals
- Feasibility analysis: confirmed Raspberry Pi 4 with USB webcam runs InsightFace buffalo_sc at 200–300 ms per recognition cycle when combined with BlazeFace pre-filter gate
- Database choice: Aiven Cloud PostgreSQL selected to avoid self-hosted infrastructure cost while ensuring SSL-encrypted connections
- Identified 4 user roles: Student, Faculty, Department Head, Admin

---

### Paragraph 3 — Design phase

**Goal:** State what was produced during design and list the key design decisions.

**Data/facts to include:**
- What was produced: all 11 diagrams described in the preceding sections
- Key design decisions:
  - Two-pipeline separation: enrollment (server-side) vs. recognition (edge-side, ONNX Runtime + InsightFace)
  - Gated detection: BlazeFace (~30 ms) before InsightFace (~200 ms)
  - Embedding-only biometric storage: 512-D float32 vectors (2,048 bytes per user), no raw images, aligned with RA 10173
  - Decision-level multimodal fusion: face recognition decision + gesture recognition decision — both must pass for non-entry actions
  - State machine for 4 attendance states with temporal gesture debouncing (3 frames)
  - Role-based data scoping per user role
  - Offline-first kiosk: local embedding cache + local schedule cache + offline JSON attendance queue

---

### Paragraph 4 — Create phase

**Goal:** Describe implementation and list the technologies used.

**Data/facts to include:**
- Service-layer backend architecture: routers (HTTP), services (business logic), models (database schema)
- 11 API routers: auth, student, faculty, dept_head, kiosk, face enrollment, reports, user profile, support tickets, invitations, users
- Technology table (use the one in the chapter — list key components): FastAPI, SQLAlchemy 2.x, PostgreSQL (Aiven), Vite + React 19.2, Bootstrap 5.3, Chart.js/Recharts, Axios, InsightFace buffalo_sc, MediaPipe BlazeFace, ONNX Runtime, MediaPipe Hands, OpenCV, Raspberry Pi OS Bookworm 64-bit, pdfplumber, SendGrid + SMTP Gmail fallback, Render, Vercel, python-jose (JWT), slowapi
- Kiosk modular pipeline: camera.py, face_detector.py, face_recognizer.py, gesture_detector.py, schedule_resolver.py, attendance_logger.py, embedding_cache.py, metrics_collector.py, main_kiosk.py

---

### Paragraph 5 — Test phase

**Goal:** Describe the four levels of testing conducted.

**Data/facts to include:**
- Unit testing: individual modules — facial recognition accuracy, gesture detection, attendance state machine transitions, database query correctness
- Integration testing: verified communication between Raspberry Pi, FastAPI, PostgreSQL, and React frontend; confirmed kiosk events appear on the dashboard in real time
- System testing: end-to-end workflow tested under realistic classroom conditions in Room 328, College of Science Building
- User acceptance testing: 43 respondents total — 20 CS students (live kiosk interaction), 20 non-CS students (video demonstration), 2 faculty members, 1 department head

---

## SECTION 13: Evaluation Procedure (3 paragraphs)

---

### Paragraph 1 — The ISO/IEC 25010:2023 framework and the 5 characteristics

**Goal:** Introduce the evaluation framework and name the five quality characteristics used.

**Data/facts to include:**
- Framework: ISO/IEC 25010:2023 Software Quality Model
- Why this framework: it provides standardized, internationally recognized quality characteristics for evaluating software systems
- 5 characteristics selected based on relevance to the system's scope:
  1. Functional Suitability — whether the system performs the functions it is supposed to perform
  2. Performance Efficiency — whether the system performs well relative to the resources it uses
  3. Interaction Capability — whether the system can be understood, learned, and used effectively by users
  4. Reliability — whether the system performs consistently and recovers from errors
  5. Security — whether the system protects data and restricts access appropriately

---

### Paragraph 2 — What each characteristic assesses in FRAMES

**Goal:** Connect each quality characteristic to specific FRAMES-specific items being evaluated.

**Data/facts to include:**
- Functional Suitability: face recognition accuracy, gesture logging correctness, report completeness, enrollment process, anomaly detection
- Performance Efficiency: kiosk recognition speed (target under 5 seconds per recognition cycle), dashboard load time, sequential processing throughput
- Interaction Capability: dashboard intuitiveness, gesture learnability, feature organization, visual design, time reduction compared to manual attendance methods
- Reliability: recognition consistency, log completeness (no missing or duplicate entries), system stability, error recovery, offline mode resilience
- Security: multimodal proxy prevention (hard to impersonate someone with both face and gesture), role-based access restriction, biometric data handling (embedding-only storage), alignment with RA 10173

---

### Paragraph 3 — Survey instruments, respondents, and scoring scale

**Goal:** Describe how the evaluation was conducted — who took the survey and how responses are interpreted.

**Data/facts to include:**
- Two instruments: (1) experience-based instrument for respondents who physically used the system, (2) observation-based instrument for respondents who watched a video demonstration
- Both use the same 4-point Likert acceptability scale:
  - 4 = Highly Acceptable (works excellently, no issues)
  - 3 = Acceptable (works with minor issues at most)
  - 2 = Unacceptable (significant issues affecting functionality)
  - 1 = Highly Unacceptable (does not work/fails requirements)
- Weighted mean interpretation ranges:
  - 3.25–4.00 = Highly Acceptable
  - 2.50–3.24 = Acceptable
  - 1.75–2.49 = Unacceptable
  - 1.00–1.74 = Highly Unacceptable
- 43 total respondents: 20 CS students (live interaction), 20 non-CS students (video demonstration), 2 faculty members, 1 department head
- Each survey has 5 parts covering the 5 ISO characteristics + overall assessment section + open-ended qualitative questions
- Statistical analysis: weighted mean and standard deviation computed per item, per characteristic, and overall
- Results analyzed separately per group then aggregated for overall system acceptability rating

---

## QUICK REFERENCE: All Figures in Order

| Figure | Diagram Type | Goes Before Section |
|--------|-------------|---------------------|
| Figure 1 | System Architecture | System Architecture paragraphs |
| Figure 2 | Context DFD | Context DFD paragraphs |
| Figure 3 | Top-Level DFD | Top-Level DFD paragraphs |
| Figure 4 | Use Case Diagram | Use Case paragraphs |
| Figure 5 | ERD (17 tables) | Database Design paragraphs |
| Figure 6 | Block Diagram | Block Diagram paragraphs |
| Figure 7 | Attendance State Machine | State Machine paragraphs |
| Figure 8 | Recognition Pipeline Flowchart | Pipeline paragraphs |
| Figure 9 | Visual Table of Contents | VTOC paragraphs |
| Figure 10 | Attendance Sequence Diagram | Sequence paragraphs |
| Figure 11 | Waterfall Methodology | Project Development paragraphs |

---

## QUICK REFERENCE: Key Numbers to Remember

| Value | What It Refers To |
|-------|------------------|
| 0.40 | Cosine similarity threshold for face recognition match |
| 0.45 | Strict threshold (used in some scenarios) |
| 0.55 | Duplicate identity check threshold during enrollment |
| 0.75 | Minimum enrollment quality score |
| 512 | Dimensions in a face embedding vector |
| 2,048 bytes | Storage size of one embedding (512 floats × 4 bytes) |
| 5–30 | Number of webcam frames accepted during enrollment |
| 3 | Consecutive frames required to confirm a gesture |
| 1.3 | Finger extension ratio threshold for gesture classification |
| ~30 ms | BlazeFace pre-filter processing time per frame |
| ~200 ms | InsightFace buffalo_sc processing time per frame |
| 15 seconds | Report cache TTL (time-to-live) |
| 30 minutes | Embedding cache refresh interval |
| 5 minutes | Offline queue flush interval |
| 24 hours | JWT access token lifespan |
| 7 days | JWT refresh token lifespan |
| 48 hours | Email invitation token expiry |
| 17 | Total database tables |
| 11 | Total API routers |
| 5V 3A | Raspberry Pi power supply spec |
| 480×360 / 15 FPS | Kiosk capture resolution (RPi) |
| 640×480 / 30 FPS | Laptop testing capture resolution |
| 1024×600 | Display resolution |
| 43 | Total evaluation respondents |
| 20 | CS student respondents (live interaction) |
| 20 | Non-CS student respondents (video) |
| 2 | Faculty respondents |
| 1 | Department Head respondent |
| 8 | Number of report types |
| Room 328 | Testing room location (College of Science Building) |
