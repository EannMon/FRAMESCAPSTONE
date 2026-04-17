# Chapter 3 — Enhanced Diagrams

All diagrams for the FRAMES Chapter 3 Methodology, redesigned for proper rendering and UML-appropriate styling.

---

## Figure 1. System Architecture of FRAMES

```mermaid
flowchart TB
    subgraph EDGE["Edge Device — Raspberry Pi 4B Kiosk"]
        direction TB
        CAM["USB Webcam<br>720p, UVC"]
        DISP["7-inch HDMI IPS Display<br>1024 x 600"]
        RP["Raspberry Pi 4 Model B<br>ARM Cortex-A72, 4 GB RAM"]

        subgraph PIPE["Recognition Pipeline"]
            direction LR
            IF["InsightFace buffalo_sc<br>SCRFD + MobileFaceNet"]
            EC["Embedding Cache<br>In-Memory"]
            MP["MediaPipe Hands<br>Gesture Detection"]
        end

        SR["Schedule Resolver"]
        AL["Attendance Logger"]
        OQ["Offline Queue"]
    end

    subgraph CLOUD["Cloud Backend"]
        direction TB
        API["FastAPI REST API<br>Python 3.11+"]
        DB[("PostgreSQL<br>Aiven Cloud, SSL")]

        subgraph SERV["Services Layer"]
            direction LR
            FE["Face Enrollment<br>Service"]
            PDF["PDF Schedule<br>Parser"]
            RPT["Report and<br>Insight Service"]
        end
    end

    subgraph WEB["Web Frontend — React + Vite + Bootstrap 5.3"]
        direction LR
        STU["Student<br>Module"]
        FAC["Faculty<br>Module"]
        HEAD["Department Head<br>Module"]
    end

    CAM --> RP
    RP --> DISP
    RP --> PIPE
    PIPE --> SR
    SR --> AL
    AL -->|"HTTPS"| API
    AL --> OQ
    OQ -->|"Retry on Reconnect"| API
    API --> DB
    API --> SERV
    SERV --> DB
    WEB -->|"HTTPS"| API
    API -->|"Embeddings Sync"| EC

    style EDGE fill:#e8f4e8,stroke:#2d6a2d,stroke-width:2px
    style CLOUD fill:#e8ecf4,stroke:#2d3d6a,stroke-width:2px
    style WEB fill:#f4f0e8,stroke:#6a5d2d,stroke-width:2px
    style PIPE fill:#d4edda,stroke:#28a745
    style SERV fill:#d6e0f0,stroke:#4a6fa5
```

---

## Figure 2. Context Data Flow Diagram of FRAMES

```mermaid
flowchart TB
    STUDENT["Student"]
    FACULTY["Faculty"]
    DEPTHEAD["Department Head"]
    KIOSK["Raspberry Pi Kiosk"]

    FRAMES(("FRAMES<br>Attendance<br>Monitoring<br>System"))

    STUDENT -->|"Personal info,<br>facial data,<br>live facial scans,<br>hand gestures"| FRAMES
    FRAMES -->|"Attendance confirmation,<br>real-time status,<br>personal reports,<br>notifications"| STUDENT

    FACULTY -->|"Personal info,<br>facial data,<br>class schedule PDF,<br>student invitations,<br>session exceptions"| FRAMES
    FRAMES -->|"Attendance confirmation,<br>class reports,<br>student attendance summaries,<br>real-time indicators,<br>exportable reports"| FACULTY

    DEPTHEAD -->|"Faculty invitations,<br>academic year config,<br>approval/rejection decisions"| FRAMES
    FRAMES -->|"Department-wide reports,<br>faculty compliance data,<br>room utilization summaries,<br>system logs,<br>exportable reports"| DEPTHEAD

    KIOSK -->|"Captured facial frames,<br>hand gesture data,<br>device heartbeat,<br>system metrics"| FRAMES
    FRAMES -->|"Recognition results,<br>attendance state prompts,<br>embedding cache updates,<br>active class schedule"| KIOSK

    style FRAMES fill:#4a90d9,stroke:#2c5f8a,color:#fff,stroke-width:3px
    style STUDENT fill:#f9f9f9,stroke:#333,stroke-width:2px
    style FACULTY fill:#f9f9f9,stroke:#333,stroke-width:2px
    style DEPTHEAD fill:#f9f9f9,stroke:#333,stroke-width:2px
    style KIOSK fill:#f9f9f9,stroke:#333,stroke-width:2px
```

---

## Figure 3. Top-Level Data Flow Diagram of FRAMES

```mermaid
flowchart TB
    STUDENT["Student"]
    FACULTY["Faculty"]
    DEPTHEAD["Department Head"]
    KIOSK["Raspberry Pi Kiosk"]

    P1(("1.0<br>User Registration<br>and Auth"))
    P2(("2.0<br>Schedule<br>Management"))
    P3(("3.0<br>Facial<br>Recognition"))
    P4(("4.0<br>Gesture<br>Recognition"))
    P5(("5.0<br>Attendance<br>Logging"))
    P6(("6.0<br>Report Generation<br>and Dashboards"))

    D1[("D1 — User Database")]
    D2[("D2 — Facial Profiles")]
    D3[("D3 — Class and Enrollment Data")]
    D4[("D4 — Attendance Logs")]
    D5[("D5 — Reports and Notifications")]

    %% Registration flows
    STUDENT -->|"Personal info,<br>facial images"| P1
    FACULTY -->|"Personal info,<br>facial images,<br>invite token"| P1
    DEPTHEAD -->|"Faculty invitations,<br>approval decisions"| P1
    P1 --> D1
    P1 -->|"Embeddings"| D2

    %% Schedule flows
    FACULTY -->|"Schedule PDF,<br>student invitations,<br>session exceptions"| P2
    P2 --> D3
    P2 -->|"Auto-created<br>student accounts"| D1

    %% Recognition flows
    KIOSK -->|"Facial frames"| P3
    P3 <-->|"Enrolled embeddings"| D2
    P3 <-->|"Active class schedule"| D3
    P3 -->|"Identity confirmed"| P4
    P3 -->|"Auto-entry<br>first scan"| P5

    %% Gesture flows
    KIOSK -->|"Hand gesture data"| P4
    P4 -->|"Verified action<br>break or exit"| P5

    %% Logging flows
    P5 --> D4
    P5 -->|"Attendance<br>confirmation"| KIOSK
    P5 -->|"Notifications"| D5

    %% Report flows
    D4 --> P6
    D3 --> P6
    D1 --> P6
    P6 --> D5
    P6 -->|"Personal reports,<br>status indicators"| STUDENT
    P6 -->|"Class reports,<br>exportable records"| FACULTY
    P6 -->|"Department reports,<br>faculty compliance"| DEPTHEAD

    style P1 fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style P2 fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style P3 fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style P4 fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style P5 fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style P6 fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style D1 fill:#fff3cd,stroke:#856404
    style D2 fill:#fff3cd,stroke:#856404
    style D3 fill:#fff3cd,stroke:#856404
    style D4 fill:#fff3cd,stroke:#856404
    style D5 fill:#fff3cd,stroke:#856404
```

---

## Figure 4. Use Case Diagram of FRAMES

```mermaid
flowchart LR
    %% ===== PRIMARY ACTORS (Left Side) =====
    Student["<b>Student</b>"]:::actor
    Faculty["<b>Faculty</b>"]:::actor

    %% ===== SYSTEM BOUNDARY =====
    subgraph SYSTEM["FRAMES Attendance Monitoring System"]
        direction TB

        subgraph AUTH_GROUP[" "]
            direction TB
            UC_REG(["Register Account"]):::usecase
            UC_LOGIN(["Login / Logout"]):::usecase
            UC_FACE(["Enroll Face"]):::usecase
            UC_RESET(["Reset Password"]):::usecase
        end

        subgraph ATTEND_GROUP[" "]
            direction TB
            UC_SCAN(["Scan Face at Kiosk"]):::usecase
            UC_GESTURE(["Perform Gesture"]):::usecase
            UC_STATUS(["View Real-Time Attendance Status"]):::usecase
            UC_NOTIFY(["Receive Attendance Notification"]):::usecase
            UC_AUTOEXIT(["Auto-Exit at Class End"]):::usecase
        end

        subgraph FACULTY_GROUP[" "]
            direction TB
            UC_UPLOAD(["Upload Schedule PDF"]):::usecase
            UC_MANAGE(["Manage Class Students"]):::usecase
            UC_LATE(["Set Late Threshold"]):::usecase
            UC_EXCEPT(["Create Session Exception"]):::usecase
            UC_INVITE_S(["Invite Students"]):::usecase
            UC_REPORT(["View Class Attendance Reports"]):::usecase
            UC_EXPORT(["Export Reports — CSV/PDF"]):::usecase
        end

        subgraph HEAD_GROUP[" "]
            direction TB
            UC_INVITE_F(["Invite Faculty"]):::usecase
            UC_APPROVE(["Approve / Reject Faculty Accounts"]):::usecase
            UC_CONFIG(["Configure Academic Year / Semester"]):::usecase
            UC_SUBJ(["Manage Subjects and Devices"]):::usecase
            UC_DEPT_RPT(["View Department-Wide Reports"]):::usecase
            UC_COMPLY(["View Faculty Compliance Data"]):::usecase
            UC_LOGS(["View System Audit Logs"]):::usecase
        end

        subgraph KIOSK_GROUP[" "]
            direction TB
            UC_CAPTURE(["Capture Facial Frames"]):::usecase
            UC_DETECT_G(["Detect Hand Gestures"]):::usecase
            UC_RESOLVE(["Resolve Active Class Schedule"]):::usecase
            UC_FLAG(["Flag Unrecognized Individual"]):::usecase
            UC_HEARTBEAT(["Send Device Heartbeat"]):::usecase
        end

        %% Include relationships (dashed arrows)
        UC_GESTURE -.->|"&laquo;include&raquo;"| UC_SCAN
        UC_EXPORT -.->|"&laquo;include&raquo;"| UC_REPORT
        UC_AUTOEXIT -.->|"&laquo;include&raquo;"| UC_RESOLVE
    end

    %% ===== SECONDARY ACTORS (Right Side) =====
    DeptHead["<b>Department<br>Head</b>"]:::actor
    Kiosk["<b>Kiosk<br>Raspberry Pi</b>"]:::actor

    %% ===== STUDENT CONNECTIONS =====
    Student --- UC_REG
    Student --- UC_LOGIN
    Student --- UC_FACE
    Student --- UC_RESET
    Student --- UC_SCAN
    Student --- UC_GESTURE
    Student --- UC_STATUS
    Student --- UC_NOTIFY

    %% ===== FACULTY CONNECTIONS =====
    Faculty --- UC_LOGIN
    Faculty --- UC_FACE
    Faculty --- UC_SCAN
    Faculty --- UC_GESTURE
    Faculty --- UC_STATUS
    Faculty --- UC_UPLOAD
    Faculty --- UC_MANAGE
    Faculty --- UC_LATE
    Faculty --- UC_EXCEPT
    Faculty --- UC_INVITE_S
    Faculty --- UC_REPORT
    Faculty --- UC_EXPORT

    %% ===== DEPARTMENT HEAD CONNECTIONS =====
    DeptHead --- UC_LOGIN
    DeptHead --- UC_INVITE_F
    DeptHead --- UC_APPROVE
    DeptHead --- UC_CONFIG
    DeptHead --- UC_SUBJ
    DeptHead --- UC_DEPT_RPT
    DeptHead --- UC_COMPLY
    DeptHead --- UC_LOGS

    %% ===== KIOSK CONNECTIONS =====
    Kiosk --- UC_CAPTURE
    Kiosk --- UC_DETECT_G
    Kiosk --- UC_RESOLVE
    Kiosk --- UC_FLAG
    Kiosk --- UC_HEARTBEAT
    Kiosk --- UC_AUTOEXIT

    %% ===== STYLES =====
    classDef actor fill:#f9f9f9,stroke:#333,stroke-width:2px,font-weight:bold
    classDef usecase fill:#8bc34a,stroke:#558b2f,color:#fff,stroke-width:1px

    style SYSTEM fill:#fafafa,stroke:#333,stroke-width:2px
    style AUTH_GROUP fill:transparent,stroke:none
    style ATTEND_GROUP fill:transparent,stroke:none
    style FACULTY_GROUP fill:transparent,stroke:none
    style HEAD_GROUP fill:transparent,stroke:none
    style KIOSK_GROUP fill:transparent,stroke:none
```

---

## Figure 5. Entity-Relationship Diagram of the FRAMES Database

```mermaid
erDiagram
    COLLEGES {
        int id PK
        varchar name UK
        varchar code UK
        timestamp created_at
    }

    DEPARTMENTS {
        int id PK
        varchar name UK
        varchar code UK
        int college_id FK
        varchar active_academic_year
        varchar active_semester
        date semester_start_date
        date semester_end_date
        timestamp created_at
    }

    PROGRAMS {
        int id PK
        int department_id FK
        varchar name
        varchar code
        timestamp created_at
    }

    USERS {
        int id PK
        varchar email UK
        varchar password_hash
        varchar tupm_id UK
        enum role
        enum verification_status
        boolean face_registered
        varchar first_name
        varchar last_name
        varchar middle_name
        int department_id FK
        int program_id FK
        varchar section
        varchar employee_id UK
        timestamp created_at
        timestamp last_active
    }

    SUBJECTS {
        int id PK
        varchar code UK
        varchar title
        int units
        timestamp created_at
    }

    CLASSES {
        int id PK
        int subject_id FK
        int faculty_id FK
        varchar room
        varchar day_of_week
        time start_time
        time end_time
        varchar section
        varchar semester
        varchar academic_year
        int late_threshold_minutes
        timestamp created_at
    }

    ENROLLMENTS {
        int id PK
        int class_id FK
        int student_id FK
        timestamp enrolled_at
    }

    FACIAL_PROFILES {
        int id PK
        int user_id FK "UK"
        bytea embedding
        varchar model_version
        int num_samples
        float enrollment_quality
        timestamp created_at
        timestamp updated_at
    }

    ATTENDANCE_LOGS {
        int id PK
        int user_id FK
        int class_id FK
        int device_id FK
        enum action
        enum verified_by
        float confidence_score
        varchar gesture_detected
        boolean is_late
        varchar remarks
        timestamp timestamp
    }

    DEVICES {
        int id PK
        varchar room
        varchar ip_address
        varchar device_name
        enum status
        int room_capacity
        timestamp created_at
        timestamp last_heartbeat
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        enum notification_type
        varchar title
        varchar message
        boolean is_read
        int reference_id
        varchar reference_type
        timestamp created_at
    }

    SECURITY_LOGS {
        int id PK
        int device_id FK
        enum event_type
        bytea embedding_data
        float confidence_score
        varchar room
        varchar details
        timestamp timestamp
    }

    SESSION_EXCEPTIONS {
        int id PK
        int class_id FK
        date session_date
        enum exception_type
        varchar reason
        int created_by FK
        timestamp created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        varchar action_type
        varchar target_table
        int target_id
        json old_value
        json new_value
        varchar ip_address
        timestamp timestamp
    }

    USER_INVITES {
        int id PK
        varchar email
        varchar token UK
        int department_id FK
        varchar role
        timestamp expires_at
        boolean used
        timestamp created_at
    }

    SUPPORT_TICKETS {
        int id PK
        int user_id FK
        varchar subject
        text message
        enum status
        text evidence_files
        timestamp created_at
    }

    SYSTEM_METRICS {
        int id PK
        int device_id FK
        varchar metric_type
        float value
        varchar unit
        timestamp timestamp
    }

    COLLEGES ||--o{ DEPARTMENTS : "has"
    DEPARTMENTS ||--o{ PROGRAMS : "offers"
    DEPARTMENTS ||--o{ USERS : "belongs to"
    DEPARTMENTS ||--o{ USER_INVITES : "sends"
    PROGRAMS ||--o{ USERS : "enrolled in"
    USERS ||--o| FACIAL_PROFILES : "has"
    USERS ||--o{ ENROLLMENTS : "enrolled"
    USERS ||--o{ ATTENDANCE_LOGS : "logs"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "performs"
    USERS ||--o{ SUPPORT_TICKETS : "submits"
    USERS ||--o{ CLASSES : "teaches"
    SUBJECTS ||--o{ CLASSES : "offered as"
    CLASSES ||--o{ ENROLLMENTS : "has"
    CLASSES ||--o{ ATTENDANCE_LOGS : "records"
    CLASSES ||--o{ SESSION_EXCEPTIONS : "has"
    DEVICES ||--o{ ATTENDANCE_LOGS : "captures"
    DEVICES ||--o{ SECURITY_LOGS : "logs"
    DEVICES ||--o{ SYSTEM_METRICS : "reports"
```

---

## Figure 6. Block Diagram of FRAMES Hardware Architecture

```mermaid
flowchart LR
    subgraph POWER["Power Supply"]
        PS["5V 3A USB-C<br>Power Supply"]
    end

    subgraph INPUT["Input"]
        CAM["USB Webcam<br>720p, UVC"]
    end

    subgraph PROCESSING["Processing Unit"]
        RPI["Raspberry Pi 4 Model B<br>4 GB RAM<br>ARM Cortex-A72 @ 1.5 GHz"]
    end

    subgraph OUTPUT["Output"]
        LCD["7-inch HDMI IPS Display<br>1024 x 600"]
        SPK["Audio Output<br>Buzzer / Speaker"]
    end

    subgraph NETWORK["Network"]
        NET["Wi-Fi / Ethernet<br>Adapter"]
    end

    subgraph SOFTWARE["Software Stack on RPi"]
        direction TB
        OS["Raspberry Pi OS Bookworm 64-bit"]
        PY["Python 3.11+"]
        OCV["OpenCV — Frame Capture"]
        ONNX["ONNX Runtime — Inference Engine"]
        INS["InsightFace buffalo_sc<br>SCRFD + MobileFaceNet"]
        MPH["MediaPipe Hands<br>21-Landmark Detection"]
    end

    subgraph CLOUD["Cloud"]
        API2["FastAPI Backend<br>REST API over HTTPS"]
        DB2[("PostgreSQL<br>Aiven Cloud")]
    end

    PS -->|"USB-C"| RPI
    CAM -->|"USB 2.0"| RPI
    RPI -->|"HDMI"| LCD
    RPI -->|"3.5mm / GPIO"| SPK
    RPI -->|"Wi-Fi / Ethernet"| NET
    NET -->|"HTTPS"| API2
    API2 --> DB2
    RPI -.- SOFTWARE

    style POWER fill:#fce4ec,stroke:#c62828,stroke-width:2px
    style INPUT fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style PROCESSING fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style OUTPUT fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style NETWORK fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    style SOFTWARE fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    style CLOUD fill:#e8eaf6,stroke:#283593,stroke-width:2px
```

---

## Figure 7. Visual Table of Contents — FRAMES Module Structure

```mermaid
flowchart TD
    subgraph STUDENT_MODULE["Student Module"]
        direction TB
        SD["Dashboard<br>Attendance Rate, Recent Activity"]
        SS["Schedule<br>Weekly Class Timetable"]
        SH["Attendance History<br>Per-Class Logs"]
        SR["Reports<br>Personal Summaries"]
        SP["Profile<br>Account Settings, Face Enrollment"]
    end

    subgraph FACULTY_MODULE["Faculty Module"]
        direction TB
        FD["Dashboard<br>Class Stats, Today's Overview"]
        FC["Class Management<br>Upload Schedule, Add/Remove Students"]
        FA["Attendance<br>Live Room Status, Per-Student Logs"]
        FR["Reports<br>Class and Faculty Reports, CSV/PDF Export"]
        FE["Session Exceptions<br>Cancel, Reschedule"]
        FI["Invite Students<br>Email Invitations"]
        FP["Profile<br>Account Settings, Face Enrollment"]
    end

    subgraph HEAD_MODULE["Department Head Module"]
        direction TB
        HD["Dashboard<br>Department Overview, Attendance Trends"]
        HF["Faculty Management<br>Invite, Approve, Reject Faculty"]
        HS["Subjects and Programs<br>CRUD Operations"]
        HV["Devices<br>Register, Monitor Kiosk Units"]
        HR["Reports<br>Department-Wide, Faculty Compliance, Room Utilization"]
        HA["Academic Config<br>Year, Semester, Dates"]
        HL["System Logs<br>Audit Trail"]
    end

    subgraph KIOSK_MODULE["Kiosk Interface"]
        direction TB
        KC["Camera Feed<br>Live Preview with Overlays"]
        KR["Recognition Display<br>Name, Status, Confidence"]
        KG["Gesture Prompt<br>Action Required, Visual Guide"]
        KA["Anomaly Alert<br>Unknown Face Detected"]
        KS["Class Info<br>Current Subject, Room, Time"]
    end

    style STUDENT_MODULE fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style FACULTY_MODULE fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style HEAD_MODULE fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style KIOSK_MODULE fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
```

---

## Figure 8. Waterfall-Based Project Development Framework for FRAMES

```mermaid
flowchart LR
    A["<b>Phase 1: Analyze</b><br>Requirements gathering,<br>feasibility analysis,<br>role identification"]
    B["<b>Phase 2: Design</b><br>System architecture,<br>DFDs, ERD, use cases,<br>UI wireframes"]
    C["<b>Phase 3: Create</b><br>Backend, frontend,<br>kiosk implementation,<br>database setup"]
    D["<b>Phase 4: Test</b><br>Unit, integration,<br>system, and<br>acceptance testing"]
    E["<b>Phase 5: Evaluate</b><br>ISO/IEC 25010<br>survey-based<br>quality assessment"]

    A --> B --> C --> D --> E

    style A fill:#3498db,stroke:#2c7fb8,color:#fff,stroke-width:2px
    style B fill:#2ecc71,stroke:#27ae60,color:#fff,stroke-width:2px
    style C fill:#e67e22,stroke:#d35400,color:#fff,stroke-width:2px
    style D fill:#9b59b6,stroke:#8e44ad,color:#fff,stroke-width:2px
    style E fill:#e74c3c,stroke:#c0392b,color:#fff,stroke-width:2px
```

---

## Figure 9. Attendance State Machine — Operation Sequence

This additional diagram shows the attendance state transitions that each student goes through during a class session, which is a core part of the system logic.

```mermaid
stateDiagram-v2
    [*] --> NO_RECORD : Student approaches kiosk

    NO_RECORD --> ENTRY : Face recognized<br>Auto-logged (no gesture needed)
    ENTRY --> BREAK_OUT : Face recognized +<br>Peace sign gesture
    BREAK_OUT --> BREAK_IN : Face recognized +<br>Thumbs-up gesture
    BREAK_IN --> EXIT : Face recognized +<br>Open palm gesture
    ENTRY --> EXIT_AUTO : Class end time reached
    BREAK_IN --> EXIT_AUTO : Class end time reached

    EXIT --> [*] : Session complete
    EXIT_AUTO --> [*] : Session complete

    state "No Attendance Record" as NO_RECORD
    state "ENTRY Logged" as ENTRY
    state "BREAK_OUT Logged" as BREAK_OUT
    state "BREAK_IN Logged" as BREAK_IN
    state "EXIT Logged" as EXIT
    state "AUTO_TIMEOUT Exit" as EXIT_AUTO

    note right of ENTRY
        Verified by: FACE only
        Late flag set if after
        start_time + threshold
    end note

    note right of BREAK_OUT
        Verified by: FACE + GESTURE
        Gesture: Peace sign
        3-frame debounce
    end note

    note right of EXIT_AUTO
        Verified by: AUTO_TIMEOUT
        System-triggered at
        class end_time
    end note
```

---

## Figure 10. Recognition Pipeline Flowchart

This diagram details the step-by-step processing that occurs on the Raspberry Pi kiosk for each camera frame.

```mermaid
flowchart TD
    START(["Camera captures frame"])
    DET{"Face detected<br>by SCRFD?"}
    EMBED["Extract 512-D embedding<br>via MobileFaceNet"]
    MATCH{"Cosine similarity<br>above threshold?"}
    STATE{"Current attendance<br>state?"}
    AUTO_ENTRY["Log ENTRY<br>Verified by: FACE"]
    GESTURE_PROMPT["Display gesture prompt<br>based on state"]
    HAND{"Hand gesture<br>detected by<br>MediaPipe?"}
    CORRECT{"Gesture matches<br>required action?"}
    DEBOUNCE{"Gesture held for<br>3 consecutive frames?"}
    LOG_ACTION["Log attendance action<br>Verified by: FACE + GESTURE"]
    DISPLAY["Display confirmation<br>on kiosk screen"]
    ANOMALY["Log security event<br>Unrecognized individual"]
    RETRY["Display: Show gesture<br>for current state"]
    SKIP["Skip frame<br>No face present"]

    START --> DET
    DET -->|"No"| SKIP
    DET -->|"Yes"| EMBED
    EMBED --> MATCH
    MATCH -->|"No match"| ANOMALY
    MATCH -->|"Match found"| STATE
    STATE -->|"No record yet"| AUTO_ENTRY
    STATE -->|"Has active record"| GESTURE_PROMPT
    AUTO_ENTRY --> DISPLAY
    GESTURE_PROMPT --> HAND
    HAND -->|"No hand"| RETRY
    HAND -->|"Hand detected"| CORRECT
    CORRECT -->|"Wrong gesture"| RETRY
    CORRECT -->|"Correct gesture"| DEBOUNCE
    DEBOUNCE -->|"Not yet 3 frames"| GESTURE_PROMPT
    DEBOUNCE -->|"Confirmed"| LOG_ACTION
    LOG_ACTION --> DISPLAY

    style START fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style DISPLAY fill:#2ecc71,stroke:#27ae60,color:#fff
    style ANOMALY fill:#e74c3c,stroke:#c0392b,color:#fff
    style AUTO_ENTRY fill:#2ecc71,stroke:#27ae60,color:#fff
    style LOG_ACTION fill:#2ecc71,stroke:#27ae60,color:#fff
    style SKIP fill:#95a5a6,stroke:#7f8c8d,color:#fff
    style RETRY fill:#f39c12,stroke:#d68910,color:#fff
```

---

## Notes on Rendering

- All diagrams use `<br>` for line breaks (universally supported across Mermaid renderers)
- Use Case Diagram uses stadium-shaped nodes `(["text"])` to approximate UML ovals
- Use Case Diagram places primary actors (Student, Faculty) on the left and secondary actors (Department Head, Kiosk) on the right, with `<<include>>` relationships shown as dashed arrows
- ERD uses native Mermaid `erDiagram` syntax with proper PK/FK/UK annotations
- State Machine (Figure 9) uses `stateDiagram-v2` for proper UML state diagram notation
- Context DFD and Top-Level DFD use circle nodes `(("text"))` for processes and cylinder nodes `[("text")]` for data stores, following standard DFD conventions
- Color coding is consistent: blue for processes, yellow for data stores, green for success states, red for error/anomaly states
