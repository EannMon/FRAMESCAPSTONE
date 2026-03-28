# Chapter 1
## THE PROBLEM AND ITS SETTING

This chapter presents the rationale, context, objectives, scope, and significance of the study. It reflects the current implementation status of FRAMES and aligns the study narrative with the actual pilot deployment conditions.

## Introduction

Digital transformation in higher education has improved instructional delivery, data management, and institutional monitoring. Despite these improvements, attendance management remains a recurring operational challenge because many institutions still rely on manual roll calls, paper records, and weak digital substitutes. These approaches are vulnerable to delayed recording, human error, and proxy attendance, reducing data reliability for both faculty and administration.

Attendance is not only a classroom compliance requirement. It is also a decision input for student support, faculty accountability, and course-level analysis. When attendance records are inaccurate, institutions lose visibility into real classroom participation and room utilization.

Recent advances in computer vision provide practical alternatives through contactless identity verification. However, face-only attendance systems can still produce accidental logs and weak intent confirmation. For this reason, multimodal attendance workflows that combine facial recognition with gesture-based confirmation are increasingly relevant in educational settings.

In response, this study develops **FRAMES (Facial Recognition and Attendance Monitoring with Embedded System)** as a web-based and kiosk-assisted attendance monitoring system. The system integrates:

- Real-time facial recognition
- Gesture-gated attendance actions
- Kiosk feedback and anomaly notification
- Web dashboards for students, faculty, and department head
- Structured attendance reporting

The current pilot uses a **Raspberry Pi 4B and webcam-based capture workflow** in a classroom environment, with deployment constrained to a controlled one-day scenario.

## Background of the Study

Traditional attendance methods in classrooms are operationally costly and difficult to audit. Manual and semi-digital workflows frequently encounter the following issues:

- Delayed encoding of attendance logs
- Inconsistent record validation
- Proxy attendance (buddy punching)
- Limited visibility for department-level review

Alternative attendance technologies (RFID, QR, and single-modality biometrics) reduce encoding time but still face misuse and verification limitations. In classroom contexts, systems that only detect a face without confirming user intent can still log unintended events.

FRAMES addresses this by enforcing a multimodal interaction model:

- Identity is recognized through facial embeddings.
- Attendance action is confirmed through a valid hand gesture (based on state).
- Logs are recorded with action type, verification mode, and time.

The current implementation follows an embedded-plus-web architecture:

- **Edge/Kiosk layer**: Raspberry Pi 4B with webcam capture and real-time recognition flow.
- **Backend layer**: FastAPI API services and PostgreSQL storage.
- **Frontend layer**: React + Vite web dashboard (mobile-responsive, no native mobile app).

This architecture is designed to be low-cost, classroom-ready, and suitable for resource-constrained academic deployment.

## Current Pilot Context (Updated)

To match the present capstone implementation, this study is bounded by the following real deployment setup:

- Hardware: Raspberry Pi 4B with webcam input.
- Site: Room 328, College of Science Building, Computer Studies Department, TUP-Manila.
- Duration: One-day pilot testing and deployment.
- Users for actual operation:
  - 1 Department Head
  - 1 Faculty
  - 1 class under the faculty
  - approximately 50 students (final count subject to actual enrollment)
- Data generation window: One class day only.
- Report testing extension: seeded records following actual attendance-log schema for report stress and format validation.

## Statement of the Problem

The study addresses the need for a practical and reliable attendance monitoring system that can operate in a real classroom with constrained hardware and minimal operational overhead.

Specifically, the study seeks to answer:

1. How can attendance be logged more reliably than manual and token-based methods in a one-room pilot setting?
2. How can facial recognition be paired with gesture confirmation to reduce accidental or unauthorized attendance actions?
3. How can student, faculty, and department head users receive timely and role-appropriate attendance insights through a web dashboard?
4. How acceptable is the developed system when evaluated under ISO/IEC 25010 quality characteristics?

## Objectives of the Study

### General Objective

To design, develop, and evaluate FRAMES as a web-based attendance and monitoring system using Raspberry Pi 4B and webcam-assisted facial recognition with gesture-gated interactions.

### Specific Objectives

1. Design and implement a classroom attendance workflow that includes:
   - facial recognition for identity verification,
   - gesture-based action confirmation,
   - kiosk feedback with anomaly notification,
   - and role-based dashboard access for student, faculty, and department head.

2. Implement report and visualization features that produce structured attendance outputs (CSV/PDF) for:
   - student personal attendance history,
   - class-level attendance summaries,
   - department-level monitoring views.

3. Deploy and test the system in a real classroom pilot (Room 328) using Raspberry Pi 4B and webcam capture.

4. Evaluate the developed system using ISO/IEC 25010 quality characteristics, focusing on:
   - Functional Suitability
   - Performance Efficiency
   - Interaction Capability
   - Reliability
   - Security

## Scope and Delimitations

### Scope

This study covers the design, implementation, pilot deployment, and quality evaluation of FRAMES under a controlled classroom setup.

The implemented system includes:

- Kiosk-based facial recognition and gesture-gated attendance actions
- Attendance state handling (entry, break-out, break-in, exit)
- Kiosk anomaly notification when a detected individual is not part of the active class context
- Role-specific dashboards for student, faculty, and department head
- Exportable attendance reports and visualization

### Delimitations

The study is intentionally limited to:

- One-room pilot deployment (Room 328)
- One-day actual deployment period
- One faculty and one department head in direct operation
- One class in direct operation
- Approximately 50 students (subject to final confirmed roster)
- No native mobile application (web dashboard is mobile-responsive only)
- No campus-wide multi-room rollout in this phase
- No advanced anti-spoofing hardware (e.g., IR/depth sensors)

Additional note on roles:

- Although legacy code may include administrative components, the **current pilot context does not include an active admin role in study operations**.

## Significance of the Study

### Students

FRAMES provides clearer attendance visibility, faster logging, and better confidence that attendance records correspond to actual participation.

### Faculty

The system reduces manual tracking workload and offers timely class-level attendance insights, helping instructors monitor attendance trends and exceptions.

### Department Head

The dashboard and reports provide summarized visibility into class attendance behavior and room-level activity for departmental monitoring.

### Institution

The study demonstrates a practical pathway for low-cost smart attendance using embedded hardware and web dashboards in a constrained university setting.

### Future Researchers

The project contributes implementation evidence for multimodal attendance workflows, edge-assisted recognition pipelines, and ISO/IEC 25010-based evaluation in education.

## Concept Clarification: Kiosk Anomaly Notification

In this study, **anomaly notification** at the kiosk refers to a case where a detected/recognized individual is **not enrolled or not assigned to the currently active class context**. This event is treated as a valid operational anomaly for monitoring and logging purposes.

## Evaluation Basis

The system shall be evaluated using ISO/IEC 25010 quality characteristics with focus on:

- Functional Suitability
- Performance Efficiency
- Interaction Capability
- Reliability
- Security

The evaluation instruments are adapted for role-based respondents (students, faculty, department head), with demo-video-assisted evaluation for roles with limited direct pilot exposure.
