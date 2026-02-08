# 📊 FRAMES Top-Level Data Flow Diagram
## System Data Architecture & Information Flow

**FRAMES** - Facial Recognition Attendance and Monitoring System  
**Version:** 1.1 | **Date:** February 8, 2026

---

## 🎯 Overview

This document presents the **top-level data flow diagrams** showing how data moves through the FRAMES system, from user registration to attendance reporting.

---

## 📊 Level 0: Context Diagram

The highest-level view showing FRAMES as a single system interacting with external entities.

> [!IMPORTANT]
> **Registration-First Policy:** All users (Students, Faculty, Department Head) must complete **facial enrollment** before accessing the dashboard. The system blocks dashboard access until `face_registered = true`.

> [!NOTE]
> **HEAD Role Clarification:** The Department Head is also a teaching faculty member. They can upload schedules, auto-create student accounts, teach classes, AND verify faculty members under their department before those faculty can log in and complete facial registration.

```mermaid
flowchart TB
    subgraph USERS["👥 System Users"]
        direction TB
        STU["👤 Student"]
        FAC["👨‍🏫 Faculty"]
        HEAD["👔 Department Head<br/>(also teaches)"]
    end

    subgraph MGMT["⚙️ Management"]
        ADMIN["🔧 Admin"]
    end

    subgraph EDGE["📱 Edge Devices"]
        KIOSK["📟 Raspberry Pi<br/>Kiosk"]
    end

    FRAMES[("🖥️ FRAMES<br/>━━━━━━━━━━<br/>Facial Recognition<br/>Attendance &<br/>Monitoring System")]

    %% STEP 1: Account Creation (by Faculty/Head or self-register)
    FAC -->|"1️⃣ Create account<br/>+ Upload schedule<br/>(auto-creates students)"| FRAMES
    HEAD -->|"1️⃣ Create account<br/>+ Upload schedule<br/>+ Verify faculty"| FRAMES
    STU -->|"1️⃣ Login with<br/>auto-created credentials"| FRAMES

    %% STEP 2: Mandatory Face Enrollment (BEFORE dashboard access)
    STU -->|"2️⃣ Register face<br/>(required first)"| FRAMES
    FAC -->|"2️⃣ Register face<br/>(after HEAD verifies)"| FRAMES
    HEAD -->|"2️⃣ Register face<br/>(required first)"| FRAMES

    %% STEP 3: Dashboard Access (AFTER face enrollment)
    FRAMES -->|"3️⃣ Personal<br/>attendance"| STU
    FRAMES -->|"3️⃣ Class summaries<br/>+ Upload schedules"| FAC
    FRAMES -->|"3️⃣ Dept reports<br/>+ Student attendance<br/>+ Faculty attendance"| HEAD

    %% Admin (no face enrollment needed)
    ADMIN -->|"System config,<br/>analytics"| FRAMES
    FRAMES -->|"System reports"| ADMIN

    %% Kiosk Attendance
    KIOSK <-->|"Face/gesture<br/>↔ Attendance logs"| FRAMES
```

---

## 👔 Department Head (HEAD) Role Details

The HEAD has dual responsibilities: **teaching** and **department management**.

```mermaid
flowchart TB
    subgraph HEAD_ROLE["👔 Department Head Capabilities"]
        direction TB
        
        subgraph TEACHING["📚 As a Teacher"]
            T1["Upload class schedules"]
            T2["Auto-generate student accounts"]
            T3["View own class attendance"]
            T4["Manage own enrolled students"]
        end
        
        subgraph MANAGEMENT["🏛️ As Department Manager"]
            M1["Verify faculty members<br/>(before they can login)"]
            M2["View faculty attendance records"]
            M3["View all dept student attendance"]
            M4["Access department-wide reports"]
        end
    end
    
    T1 --> T2
    M1 --> M2
```

### Faculty Verification Flow

```mermaid
flowchart LR
    subgraph FACULTY_REG["Faculty Registration"]
        direction TB
        F1["Faculty<br/>registers"]
        F2["status =<br/>PENDING"]
        F3["Cannot login<br/>or register face"]
    end
    
    subgraph HEAD_VERIFY["HEAD Verification"]
        direction TB
        H1["HEAD reviews<br/>faculty info"]
        H2["HEAD approves"]
        H3["status =<br/>VERIFIED"]
    end
    
    subgraph FACULTY_ACCESS["Faculty Access"]
        direction TB
        A1["Faculty can<br/>now login"]
        A2["Faculty registers<br/>face"]
        A3["Full dashboard<br/>access"]
    end
    
    F1 --> F2 --> F3
    F3 -.->|"Blocked"| H1
    H1 --> H2 --> H3
    H3 --> A1 --> A2 --> A3
```

---

## 🔄 User Access Flow Summary

```mermaid
flowchart LR
    subgraph STEP1["1️⃣ Account Creation"]
        direction TB
        A1["Faculty/HEAD<br/>uploads schedule"]
        A2["Students<br/>auto-created"]
        A1 --> A2
    end

    subgraph STEP1B["1️⃣b Faculty Verification"]
        direction TB
        V1["Faculty registers"]
        V2["HEAD verifies"]
        V3["Faculty approved"]
        V1 --> V2 --> V3
    end

    subgraph STEP2["2️⃣ Face Enrollment"]
        direction TB
        B1["User logs in"]
        B2["Redirect to<br/>Facial Enrollment"]
        B3["Capture 15 frames<br/>Store embedding"]
        B1 --> B2 --> B3
    end

    subgraph STEP3["3️⃣ Dashboard Access"]
        direction TB
        C1["face_registered<br/>= true"]
        C2["Full feature<br/>access"]
        C1 --> C2
    end

    STEP1 --> STEP2 --> STEP3
    STEP1B --> STEP2
```

---

## 📊 Level 1: System Data Flow Diagram

Decomposition of FRAMES into major subsystems showing data stores and processes.

> [!NOTE]
> **Process 2.0 (Facial Enrollment)** acts as a **gate** — users cannot access Process 5.0 (Reporting) until they complete face registration.

```mermaid
flowchart TB
    subgraph USERS["👥 External Actors"]
        direction TB
        STU["👤 Students"]
        FAC["👨‍🏫 Faculty"]
        HEAD["👔 Dept Head<br/>(also teaches)"]
        ADMIN["⚙️ Admin"]
    end

    subgraph EDGE["📱 Edge Devices"]
        KIOSK["Raspberry Pi<br/>Kiosk"]
    end

    subgraph PROCESSES["⚙️ Core Processes"]
        direction TB
        P1[["1.0<br/>User<br/>Management"]]
        P2[["2.0<br/>Facial<br/>Enrollment<br/>━━━━━<br/>⛔ GATE"]]
        P3[["3.0<br/>Schedule<br/>Management"]]
        P4[["4.0<br/>Attendance<br/>Recognition"]]
        P5[["5.0<br/>Reporting &<br/>Analytics"]]
    end

    subgraph DATASTORES["🗄️ Data Stores"]
        direction TB
        D1[("D1: users")]
        D2[("D2: facial_profiles")]
        D3[("D3: departments<br/>programs<br/>subjects")]
        D4[("D4: classes<br/>enrollments<br/>session_exceptions")]
        D5[("D5: devices")]
        D6[("D6: attendance_logs")]
    end

    %% STEP 1: User Management flows
    STU --> |"Registration"| P1
    FAC --> |"Registration"| P1
    HEAD --> |"Registration"| P1
    P1 -->|"User records"| D1
    P1 -->|"Academic links"| D3
    HEAD -->|"Verify faculty"| P1

    %% STEP 2: Facial Enrollment flows (MANDATORY GATE)
    STU -->|"Face frames"| P2
    FAC -->|"Face frames<br/>(after verified)"| P2
    HEAD -->|"Face frames"| P2
    P2 <-->|"User lookup"| D1
    P2 -->|"Face embedding"| D2
    P2 -->|"Set face_registered"| D1

    %% STEP 3: Schedule Management flows
    FAC -->|"Schedule upload"| P3
    HEAD -->|"Schedule upload"| P3
    P3 <-->|"Subject lookup"| D3
    P3 -->|"Class records"| D4
    P3 -->|"Auto-create<br/>students"| D1

    %% STEP 4: Attendance Recognition flows (Edge)
    KIOSK -->|"Face + gesture"| P4
    P4 <-->|"Embedding<br/>lookup"| D2
    P4 <-->|"Class<br/>verification"| D4
    P4 <-->|"Device info"| D5
    P4 -->|"Attendance<br/>record"| D6

    %% STEP 5: Reporting flows (REQUIRES face_registered = true)
    D6 -->|"Logs"| P5
    D4 -->|"Class info"| P5
    D1 -->|"User info"| P5
    D2 -.->|"⛔ Check<br/>face_registered"| P5
    P5 -->|"Personal attendance"| STU
    P5 -->|"Class reports"| FAC
    P5 -->|"Dept + Faculty<br/>reports"| HEAD
    P5 -->|"System analytics"| ADMIN
```

---

## 🔄 Key Data Flow Processes

### Process 1.0: User Management

```mermaid
flowchart LR
    subgraph INPUT["📥 Input"]
        A1["Registration<br/>Form"]
        A2["Verification<br/>Request"]
    end

    subgraph PROCESS["1.0 User Management"]
        B1["Validate<br/>Input"]
        B2["Hash<br/>Password"]
        B3["Link to<br/>Dept/Program"]
        B4["Set Verification<br/>Status"]
    end

    subgraph OUTPUT["📤 Output"]
        C1[("users")]
        C2["Account<br/>Created"]
        C3["Verification<br/>Status"]
    end

    A1 --> B1 --> B2 --> B3 --> C1
    A2 --> B4 --> C1
    C1 --> C2
    C1 --> C3
```

**Data Elements:**

| Input | Processing | Output |
|-------|------------|--------|
| email, password, tupm_id, name | Validation, bcrypt hashing | users record |
| department_id, program_id | FK validation | Academic links |
| role, verification_status | Enum validation | Account status |

---

### Process 2.0: Facial Enrollment

```mermaid
flowchart TB
    subgraph INPUT["📸 Input"]
        A1["Webcam Feed<br/>15 frames"]
    end

    subgraph PROCESS["2.0 Facial Enrollment"]
        B1["Face Detection<br/>MTCNN/RetinaFace"]
        B2["Face Alignment<br/>5-point landmark"]
        B3["Embedding Extraction<br/>InsightFace Buffalo"]
        B4["Embedding Averaging<br/>512-d vector"]
        B5["Quality Scoring<br/>0.0 - 1.0"]
    end

    subgraph OUTPUT["💾 Output"]
        C1[("facial_profiles")]
        C2[("users.face_registered<br/>= true")]
    end

    A1 --> B1 --> B2 --> B3 --> B4 --> B5
    B5 --> C1
    B5 --> C2
```

**Data Elements:**

| Input | Processing | Output |
|-------|------------|--------|
| 15 webcam frames | Face detection, alignment | Detected faces |
| Aligned faces | InsightFace inference | 512-d embedding per frame |
| Multiple embeddings | Averaging | Single stable embedding |
| Final embedding | Quality calculation | facial_profiles record |

> [!NOTE]
> **Privacy:** Only the 512-dimensional embedding vector (~2KB) is stored. No raw images are saved.

---

### Process 3.0: Schedule Management

```mermaid
flowchart TB
    subgraph INPUT["📄 Input"]
        A1["Schedule CSV/Excel"]
    end

    subgraph PROCESS["3.0 Schedule Management"]
        B1["Parse File"]
        B2["Validate Subjects"]
        B3["Create/Find<br/>Students"]
        B4["Create Class<br/>Records"]
        B5["Auto-Enroll<br/>Students"]
    end

    subgraph OUTPUT["💾 Output"]
        C1[("subjects")]
        C2[("users<br/>(auto-created)")]
        C3[("classes")]
        C4[("enrollments")]
    end

    A1 --> B1 --> B2
    B2 --> C1
    B1 --> B3 --> C2
    B2 --> B4 --> C3
    C2 --> B5
    C3 --> B5 --> C4
```

**Data Elements:**

| Input | Processing | Output |
|-------|------------|--------|
| subject_code, title, units | Subject lookup/creation | subjects record |
| student_id, name, section | User lookup/creation | users record |
| faculty, room, time, day | Class creation | classes record |
| student ↔ class pairs | Enrollment creation | enrollments record |

---

### Process 4.0: Attendance Recognition (Edge)

```mermaid
flowchart TB
    subgraph INPUT["📱 Raspberry Pi Input"]
        A1["Pi Camera<br/>Feed"]
        A2["Hand Gesture<br/>(for breaks/exit)"]
    end

    subgraph PROCESS["4.0 Attendance Recognition"]
        B1["Face Detection<br/>TFLite"]
        B2["Embedding Extraction<br/>FaceNet INT8"]
        B3["Cosine Similarity<br/>Matching"]
        B4["Threshold Check<br/>≥ 0.6"]
        B5["Gesture Detection<br/>MediaPipe Hands"]
        B6["Action<br/>Validation"]
    end

    subgraph DATASTORES["🗄️ Data Lookup"]
        D1[("facial_profiles<br/>embeddings")]
        D2[("enrollments<br/>class verification")]
        D3[("devices")]
    end

    subgraph OUTPUT["💾 Output"]
        C1[("attendance_logs")]
        C2["Display<br/>Confirmation"]
    end

    A1 --> B1 --> B2
    B2 --> B3
    D1 -.->|"Compare"| B3
    B3 --> B4

    B4 -->|"ENTRY"| B6
    A2 --> B5 -->|"BREAK/EXIT"| B6

    D2 -.->|"Verify enrollment"| B6
    D3 -.->|"Device info"| B6

    B6 --> C1
    B6 --> C2
```

---

### Attendance Action Flow

```mermaid
flowchart LR
    subgraph ACTIONS["Attendance Actions"]
        E[("🚪 ENTRY")]
        BO[("☕ BREAK_OUT")]
        BI[("🔙 BREAK_IN")]
        EX[("🚶 EXIT")]
    end

    subgraph VERIFICATION["Verification Method"]
        F["FACE only"]
        FG["FACE + GESTURE"]
    end

    E --> F
    BO --> FG
    BI --> FG
    EX --> FG
```

**Gesture Meanings:**

| Gesture | Action | Description |
|---------|--------|-------------|
| ✌️ Peace Sign | BREAK_OUT | Two fingers raised |
| 👍 Thumbs Up | BREAK_IN | Return from break |
| 🖐️ Open Palm | EXIT | Leave the class |

---

### Process 5.0: Reporting & Analytics

```mermaid
flowchart TB
    subgraph INPUT["📊 Data Sources"]
        D1[("attendance_logs")]
        D2[("classes")]
        D3[("users")]
        D4[("departments")]
    end

    subgraph PROCESS["5.0 Reporting & Analytics"]
        B1["Aggregate by<br/>Student"]
        B2["Aggregate by<br/>Class/Section"]
        B3["Aggregate by<br/>Faculty"]
        B4["Aggregate by<br/>Department"]
        B5["Generate<br/>Charts"]
    end

    subgraph OUTPUT["📈 Reports"]
        C1["Student<br/>Attendance"]
        C2["Class<br/>Summaries"]
        C3["Faculty<br/>Reports"]
        C4["Dept<br/>Dashboard"]
        C5["Export<br/>CSV/PDF"]
    end

    D1 --> B1 --> C1
    D2 --> B1
    D3 --> B1
    
    D1 --> B2 --> C2
    D2 --> B2
    
    D1 --> B3 --> C3
    D2 --> B3
    D3 --> B3
    
    D1 --> B4 --> C4
    D4 --> B4
    
    B1 --> B5
    B2 --> B5
    B3 --> B5
    B4 --> B5
    B5 --> C5
```

---

## 📊 HEAD Access Scope

The Department Head can access attendance data for:

```mermaid
flowchart TB
    subgraph HEAD_ACCESS["👔 HEAD Can View"]
        direction TB
        
        subgraph OWN_CLASSES["📚 Own Classes (like Faculty)"]
            OC1["Students enrolled<br/>in HEAD's classes"]
            OC2["Attendance for<br/>HEAD's classes"]
        end
        
        subgraph DEPT_FACULTY["👨‍🏫 Department Faculty"]
            DF1["All faculty members<br/>in department"]
            DF2["Faculty attendance<br/>records"]
            DF3["Faculty verification<br/>status"]
        end
        
        subgraph DEPT_STUDENTS["👤 Department Students"]
            DS1["All students<br/>in department"]
            DS2["Student attendance<br/>summaries"]
        end
    end
```

---

## 🔄 Complete Attendance Data Flow Sequence

```mermaid
sequenceDiagram
    participant STU as 👤 Student
    participant KIOSK as 📱 Kiosk
    participant API as 🖥️ Backend API
    participant DB as 🗄️ PostgreSQL

    Note over STU,DB: Attendance Entry Flow (Face Only)
    STU->>KIOSK: Stand in front of camera
    KIOSK->>KIOSK: Capture face frame
    KIOSK->>KIOSK: Extract embedding (TFLite)
    KIOSK->>API: Send embedding for matching
    API->>DB: Query facial_profiles
    DB-->>API: Return matches + confidence
    
    alt Confidence ≥ Threshold
        API->>DB: Verify enrollment
        DB-->>API: Enrollment confirmed
        API->>DB: INSERT attendance_log
        API-->>KIOSK: Success response
        KIOSK-->>STU: ✅ Attendance Recorded
    else Confidence < Threshold
        API-->>KIOSK: No match found
        KIOSK-->>STU: ❌ Face not recognized
    end

    Note over STU,DB: Break-Out Flow (Face + Gesture)
    STU->>KIOSK: Show face + Peace sign ✌️
    KIOSK->>KIOSK: Verify face match
    KIOSK->>KIOSK: Detect gesture (MediaPipe)
    
    alt Face + Gesture Valid
        KIOSK->>API: Log break-out
        API->>DB: INSERT attendance_log
        API-->>KIOSK: Success
        KIOSK-->>STU: ✅ Break recorded
    else Invalid
        KIOSK-->>STU: ❌ Action rejected
    end
```

---

## 🏗️ System Architecture Data Flow

```mermaid
flowchart TB
    subgraph CLIENT["🌐 Frontend"]
        WEB["Web Dashboard<br/>(Vite + React)"]
    end

    subgraph EDGE["📱 Edge Layer"]
        CAM["Pi Camera v2"]
        TFLITE["TFLite FaceNet"]
        MEDIAPIPE["MediaPipe Hands"]
    end

    subgraph SERVER["🖥️ Backend"]
        API["REST API<br/>(FastAPI)"]
        INSIGHT["InsightFace<br/>(enrollment)"]
    end

    subgraph DATABASE["🗄️ Database"]
        PG[("PostgreSQL<br/>(Aiven)<br/>━━━━━━━<br/>10 tables")]
    end

    WEB <-->|"HTTP/JSON"| API
    CAM -->|"Frames"| TFLITE
    TFLITE -->|"Embeddings"| API
    CAM -->|"Frames"| MEDIAPIPE
    MEDIAPIPE -->|"Gestures"| API
    
    WEB -->|"Webcam frames"| INSIGHT
    INSIGHT -->|"Embeddings"| API
    
    API <-->|"SQLAlchemy<br/>SSL"| PG
```

---

## 📋 Data Store Summary

| Data Store | Tables | Primary Data | Access Pattern |
|------------|--------|--------------|----------------|
| D1: User Data | users | Credentials, roles, academic info | Read-heavy (auth, lookup) |
| D2: Biometric Data | facial_profiles | Face embeddings | Read-heavy (recognition) |
| D3: Academic Structure | departments, programs, subjects | Org hierarchy | Read-only (reference) |
| D4: Scheduling | classes, enrollments, session_exceptions | Class schedules, student links | Read-heavy, write on enrollment |
| D5: Devices | devices | Kiosk info, status | Read-heavy, periodic heartbeat |
| D6: Attendance | attendance_logs | All attendance records | Write-heavy, read for reports |

---

## 📊 Data Volume Estimates

| Entity | Expected Volume | Growth Rate |
|--------|-----------------|-------------|
| Users | 1,000 - 5,000 | Per semester |
| Facial Profiles | 1:1 with users | Same as users |
| Classes | 50 - 200 per semester | Per semester |
| Enrollments | 20-30 per student | Per semester |
| Attendance Logs | 100-500 per student | Per semester |
| Devices | 5-20 | Slow (hardware) |

---

**Document generated:** February 8, 2026  
**System architecture verified against:** FRAMES_DOCUMENTATION_RECENT.md
