# FRAMES — Final Defense Presentation Content

> Slide-ready content. Each section = one slide. Keep text on slides concise; use the **Speaker Notes** for verbal elaboration.

---

## SLIDE 1: Panel Comments & How We Addressed Them

### Comment 1: Business Process & Role Hierarchy
**Panel concern:** Who is the main user? Why is there a separate Admin module?

**What we did:**
- Removed the standalone Admin role entirely
- Elevated the **Department Head** as the highest authority — manages faculty approvals, views department-wide data, and oversees the system
- Three user roles remain: **Student**, **Faculty**, and **Department Head**

> **Speaker Notes:** The panelists pointed out that having a fourth admin role was redundant in a single-department pilot. We consolidated all administrative functions — user verification, department-wide monitoring, report access — under the Department Head. This simplified the role hierarchy and better reflects the actual organizational structure at TUP-Manila.

---

### Comment 2: Necessity of Gesture-Gated Layer
**Panel concern:** Why require gesture confirmation at all?

**What we did:**
- **Removed** the gesture requirement for **Entry** — face recognition alone logs the first scan, since standing before the kiosk already implies intent
- **Retained** gesture confirmation for **Break-out** (peace sign), **Break-in** (thumbs-up), and **Exit** (open palm)
- This meets the panel halfway: entry is frictionless, but subsequent state changes still require deliberate confirmation

> **Speaker Notes:** The panel questioned whether gesture-gating added unnecessary friction. We agreed that requiring a gesture just to enter was excessive — standing in front of the kiosk is itself an intentional act. However, we retained gestures for break and exit actions because without them, a walk-by detection could accidentally change a student's status. The gesture layer serves as a lightweight behavioral deterrent against accidental and proxy logging, not as a full liveness detection system.

---

### Comment 3: Faculty Account Creation
**Panel concern:** Faculty registration workflow should be more controlled.

**What we did:**
- Implemented a **token-based email invitation** system
- The Department Head sends an invite link to the faculty member's email
- The link contains a **unique JWT token** (valid for 48 hours) tied to the faculty's email and department
- When the faculty clicks the link and registers, the token auto-verifies their account — **no manual approval needed**
- If the token expires or is reused, registration is blocked

> **Speaker Notes:** Originally, faculty would self-register and wait for the Department Head to manually approve. The panel suggested this was inefficient. With the invite system, the Department Head controls who can register by sending the invite in the first place — that act *is* the approval. The JWT token is single-use, time-limited, and department-scoped, so only the intended faculty member can use it. This eliminates the approval bottleneck while keeping registration controlled.

---

### Comment 4: Student Account Creation
**Panel concern:** Students should not manually input their class schedule.

**What we did:**
- Faculty uploads their **Certificate of Registration (COR) PDF** from the TUP portal
- The system **automatically parses** the PDF to extract: subjects, sections, schedules, room assignments, and the **enrolled student list**
- For students not yet in the system, **accounts are auto-created** (TUPM-ID as username, surname as default password)
- Students are **auto-enrolled** into the correct classes — no manual schedule input needed
- Students only need to: log in, change their password, and register their face

> **Speaker Notes:** The panel recommended removing the burden of schedule input from students. Now, the entire enrollment pipeline is faculty-driven. When a faculty member uploads their COR, the PDF parser extracts the student list and creates both the class records and student accounts in one step. Students get auto-verified accounts and just need to complete face registration before the kiosk can recognize them. This reduced setup from a multi-step student process to a single faculty upload.

---

## SLIDE 2: Objectives of the Study

### General Objective
To design, develop, and evaluate a web-based, gesture-gated facial recognition attendance system deployed on Raspberry Pi for real-time attendance tracking and classroom monitoring at TUP-Manila.

### Specific Objectives
1. **Design a smart monitoring system** incorporating:
   - Facial recognition via InsightFace `buffalo_sc` for identity verification
   - Gesture confirmation via MediaPipe Hands for break and exit actions
   - Role-based web dashboard (Student, Faculty, Department Head)
   - Kiosk feedback interface with real-time confirmation and anomaly alerts
   - Early entry window (10 min before class) and auto-exit at class end

2. **Create reporting and visualization features** for:
   - Personal attendance summaries for students
   - Class-level and faculty-level reports for instructors
   - Department-wide attendance and room utilization summaries

3. **Test and improve** the system through pilot deployment in Room 328, TUP-Manila using Raspberry Pi 4B with USB webcam

4. **Evaluate system acceptability** using ISO/IEC 25010:
   - Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security

---

## SLIDE 3: Scope and Limitations

### What the System Covers
- Kiosk-based facial recognition + gesture-gated attendance (Entry, Break-out, Break-in, Exit)
- Two-pipeline architecture: server-side enrollment, edge-side recognition on RPi
- InsightFace `buffalo_sc` + MediaPipe Hands + MediaPipe BlazeFace pre-filter
- Role-based web dashboard with real-time attendance data
- CSV and PDF exportable reports
- Anomaly notification for unrecognized individuals
- Early entry window (10 min) and auto-exit mechanism

### Deployment Scope
- **Single classroom** — Room 328, College of Science Building, TUP-Manila
- **Single kiosk unit** — Raspberry Pi 4B, USB webcam, 7-inch HDMI display
- **Single session** of live pilot testing

### Respondents (42 total)
- 20 students (computer-related program) — direct kiosk interaction
- 20 students (non-computer program) — video demonstration + survey
- 1 faculty members — hands-on
- 1 department head — dashboard walkthrough

### Key Limitations
- Prototype deployment, not campus-wide
- Gesture-gating is a **behavioral deterrent**, not advanced liveness detection (no 3D depth or IR sensing)
- No mobile app — web dashboard is mobile-responsive via browser
- No integration with external LMS or academic performance tracking
- Only facial and hand gesture modalities — no fingerprint, iris, or voice
- No super-admin role; management split between Faculty and Department Head

---

## SLIDE 4: Chapter 4 — Results and Discussion

*(To be completed after data collection and analysis)*

---

## SLIDE 5: Recommendations for Future Work

### 1. Advanced Presentation Attack Detection (PAD)
- Implement **3D depth-sensing** (e.g., Intel RealSense or structured light) or **infrared-based liveness detection** to move beyond gesture-based deterrence
- Explore **anti-spoofing models** (e.g., FAS methods trained on CASIA-FASD or Replay-Attack datasets) that detect printed photos, screen replays, and 3D masks

### 2. Audio Feedback and Accessibility
- Add **audio confirmation** on the kiosk (e.g., "Attendance logged — Welcome, Juan") to provide immediate verbal feedback alongside visual display
- Integrate **text-to-speech** for accessibility, assisting visually impaired users in navigating the kiosk interaction

### 3. Multi-Room and Campus-Wide Scaling
- Deploy **multiple kiosk units** across different classrooms and buildings to evaluate system behavior at institutional scale
- Implement a **centralized kiosk management dashboard** for monitoring device health, connectivity status, and real-time frame processing metrics across all units

### 4. Dedicated Mobile Application
- Develop a **native mobile app** (Android/iOS) for students and faculty to view attendance in real time, receive push notifications for missed classes, and manage their profiles without relying on a browser

### 5. Integration with Institutional Systems
- Connect FRAMES to the **TUP ERS** or Learning Management System for automatic schedule synchronization and grade-linked attendance enforcement
- Explore **API-based enrollment sync** so student records update automatically when official enrollment data changes

### 6. Enhanced Biometric Modalities
- Investigate **voice recognition** or **gait analysis** as supplementary biometric layers for higher-security environments
- Evaluate **multi-factor biometric fusion** (face + voice) for scenarios requiring stronger identity assurance

### 7. Long-Term Deployment Study
- Conduct an **extended pilot** (full semester) to evaluate system reliability, embedding drift over time, and user acceptance with prolonged daily use
- Collect longitudinal data to measure whether automated attendance monitoring correlates with improved class participation or reduced absenteeism

### 8. Privacy and Compliance Enhancements
- Implement **on-device embedding comparison only** (fully edge-based) to eliminate transmission of biometric data to the cloud
- Explore **federated learning** for model fine-tuning across kiosks without centralizing raw biometric features
- Conduct a formal **Data Privacy Impact Assessment (DPIA)** under the Philippine Data Privacy Act (RA 10173) for institutional-scale deployment

---

*End of Presentation Content*
