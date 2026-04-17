# Chapter 1

## THE PROBLEM AND ITS SETTING

This chapter introduces the research problem, establishes the context and setting, defines the objectives, and explains the significance of the study. It provides the foundation for the development and evaluation of FRAMES: A Web-Based, Gesture-Gated Facial Recognition Attendance System Using Raspberry Pi.

---

### Introduction

Attendance monitoring is a critical institutional process in higher education. Accurate attendance records serve as inputs for evaluating student engagement, verifying faculty compliance, assessing classroom utilization, and supporting departmental oversight. When attendance data is unreliable, institutions lose visibility into whether scheduled classes are actually conducted, whether students are physically present, and whether rooms are being used as intended.

In formal higher-education settings, conventional attendance methods remain common despite their well-documented weaknesses. Manual roll calls are slow, error-prone, and easily falsified (Alam et al., 2025). Paper-based logbooks and sign-in sheets consume instructional time and produce records that are difficult to audit or digitize. Proxy attendance—where one individual signs in on behalf of another—remains a persistent integrity problem that manual and semi-digital methods cannot reliably prevent (Mukthineni et al., 2020).

Technology-assisted alternatives have sought to address these problems, but each carries distinct limitations. RFID-based and QR code–based systems accelerate recording but rely on transferable tokens that can be shared between individuals, rendering them ineffective against intentional proxy attendance (Alam et al., 2025; Vadwala, 2024). Fingerprint scanners address the authentication problem more effectively—because a fingerprint is biometric and cannot be transferred like a card or code—but they require physical contact with shared surfaces, which raises hygiene concerns in institutional environments and introduces throughput bottlenecks when processing large classes sequentially (Alam et al., 2025). Thus, while token-based modalities fail to solve the authentication problem and fingerprint systems solve it at the cost of hygiene and speed, none of these alternatives provides both contactless operation and reliable identity verification simultaneously.

Facial recognition has emerged as a contactless biometric alternative that eliminates dependency on tokens and physical interaction. Several studies have demonstrated the feasibility of deploying facial recognition for classroom attendance using embedded hardware such as the Raspberry Pi (Swathi & RathnaChary, 2023; Ashok Kumar et al., 2021; Shabaneh et al., 2023; Aboluhom & Kandilli, 2025). However, face-only recognition systems introduce their own risks. A system that logs attendance automatically upon detecting a face may record accidental walk-by detections or accept spoofing attacks using printed photographs. Mukthineni et al. (2020) showed that face-only attendance systems remain vulnerable to these presentation attacks, and Jha et al. (2024) argued that an additional confirmation modality is necessary to establish user intent and reduce false positives.

This is where gesture-gated interaction becomes relevant. Hand gesture recognition—specifically static gesture detection using landmark-based pipelines such as MediaPipe Hands—provides a lightweight behavioral confirmation that the user consciously intends to perform an attendance action (Mohamed, Hassan, & Jamil, 2024; Lugaresi et al., 2019). When face recognition is paired with gesture confirmation in a sequential workflow, the resulting system becomes a multimodal attendance mechanism that is contactless, intent-aware, and more resistant to casual spoofing than either modality alone (Bala, Gupta, & Kumar, 2022). Importantly, gesture confirmation is not intended as an absolute security guarantee. It functions as a practical deterrent that raises the effort required for proxy attendance compared to face-only or token-based systems.

Despite the demonstrated viability of these technologies individually, no existing system reviewed in the literature integrates all three of the following into a single deployed solution: (1) lightweight facial recognition optimized for Raspberry Pi hardware, (2) gesture-gated attendance logging that distinguishes entry, break, and exit states, and (3) a web-based dashboard that delivers real-time monitoring, role-based views, and exportable reports for students, faculty, and department heads. This convergence gap—where face recognition, gesture confirmation, and dashboard-centered monitoring remain addressed separately but not together—defines the research problem of this study.

In response, this study develops **FRAMES (Facial Recognition and Attendance Monitoring with Embedded System)**: a web-based, gesture-gated facial recognition attendance system deployed on a Raspberry Pi 4 Model B kiosk with a USB webcam. FRAMES combines InsightFace's `buffalo_sc` model for face recognition, MediaPipe Hands for static gesture detection, and a FastAPI-plus-React web platform that provides real-time attendance visualization, anomaly notification for unrecognized individuals, and structured report generation. The system is piloted in a single classroom at the Technological University of the Philippines–Manila and evaluated using the ISO/IEC 25010 Software Quality Model.

Within this context, the study specifically seeks to determine: (1) how facial recognition can be deployed on a Raspberry Pi kiosk to reliably identify enrolled students and faculty in a classroom setting; (2) how gesture-gated interaction can be used to confirm attendance actions—entry, break-out, break-in, and exit—and reduce accidental or unauthorized logging; (3) how attendance data can be presented through a role-based web dashboard that provides real-time monitoring, structured reports, and exportable records for students, faculty, and the department head; and (4) how acceptable the developed system is when evaluated using the ISO/IEC 25010 Software Quality Model in terms of Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security.

---

### Background of the Study

#### The Institutional Problem

At the Technological University of the Philippines–Manila (TUP-M), attendance monitoring follows conventional practices. Faculty members typically use manual roll calls or paper sign-in sheets to record student presence, and department heads rely on periodic manual reports to assess whether scheduled classes are being conducted. This reliance on manual processes creates several recurring problems. Attendance records may be inaccurate because of delayed encoding, inconsistent enforcement across instructors, or intentional misreporting by students. At the department level, there is limited real-time visibility into room utilization—whether a scheduled class actually took place, how many students were present, or whether the assigned faculty member was in the room. These information gaps reduce the effectiveness of departmental oversight and make it difficult to identify patterns such as chronic absenteeism, underutilized rooms, or classes that are scheduled but not conducted.

These problems are not unique to TUP-M. The broader literature consistently identifies the same limitations in manual and semi-digital attendance systems across educational institutions. Alam et al. (2025) provided one of the most comprehensive recent comparisons of attendance modalities—including RFID, fingerprint, iris, voice, and face recognition—and documented the specific strengths and weaknesses of each. Vadwala (2024) reinforced the value of touchless approaches in institutional settings where hygiene, speed, and proxy prevention are all relevant constraints.

#### Why Facial Recognition on Raspberry Pi

The choice of hardware is critical for classroom deployment in a resource-constrained university. Commercial facial recognition systems typically require GPU servers, enterprise cameras, and proprietary software licenses—infrastructure that is impractical for most Philippine public universities. Raspberry Pi 4 Model B has been validated by multiple studies as a viable platform for embedded facial recognition when the model and pipeline are optimized for its ARM CPU constraints (Aboluhom & Kandilli, 2025; Swathi & RathnaChary, 2023; Panwar et al., 2024; Elnozahy et al., 2025).

FRAMES uses InsightFace's `buffalo_sc` model pack, which combines the SCRFD lightweight face detector with a MobileFaceNet recognition backbone (Chen et al., 2018; Guo et al., 2021). This model achieves approximately 97.5% accuracy on the LFW benchmark while maintaining inference speeds of 300–500 ms on the Raspberry Pi 4—fast enough for responsive kiosk interaction. The recognition pipeline operates entirely on the edge device, with recognized attendance events transmitted to the cloud backend for storage and dashboard display. This architecture reduces dependency on internet connectivity during recognition and keeps the system operational even during brief network outages.

#### Why Gesture-Gated Logging

Face recognition alone answers the question "Who is this person?" but does not answer "What does this person intend to do?" In a classroom attendance context, the distinction matters. FRAMES tracks four attendance states: entry, break-out, break-in, and exit. After the initial entry—which is logged automatically when a student's face is recognized at the kiosk, since the act of standing before the camera implies intent—subsequent actions require gesture confirmation. A peace sign triggers break-out, a thumbs-up triggers break-in, and an open palm triggers exit. This design ensures that state transitions are deliberate and reduces the risk of accidental state changes from walk-by detections or ambient face captures.

The gesture confirmation layer also functions as a lightweight behavioral liveness check. While it does not eliminate sophisticated spoofing attacks, it meaningfully raises the difficulty of casual proxy attendance. A student cannot simply hold a photograph in front of the camera and be marked present for a break or exit action—the system requires a physical gesture in temporal proximity to the face recognition event (Mukthineni et al., 2020; Jha et al., 2024).

#### Why a Dashboard and Not Just a Log

Raw attendance logs are insufficient for decision-making. Faculty members need class-level summaries showing who was present, late, or absent. Department heads need aggregated views across multiple classes and faculty members. Students need personal attendance histories to verify their own records. The literature on educational monitoring systems emphasizes that the institutional value of attendance data comes from its transformation into structured reports and visual dashboards rather than from the raw logs themselves (Zhao, Zhao, & Qu, 2022; Rama Krishna et al., 2023).

FRAMES addresses this through a role-based web dashboard built with React and Bootstrap 5.3, connected to a FastAPI backend and PostgreSQL cloud database. Attendance events from the kiosk are written to the backend in real time and reflected immediately on the dashboard. Faculty members can view per-class attendance summaries; the department head can review department-wide patterns; and students can see their own attendance history and status. Reports are exportable in CSV and PDF formats for documentation and administrative use.

#### The System in Context

FRAMES is therefore not positioned as a facial recognition demo or a gesture detection experiment. It is a complete attendance monitoring platform that uses face recognition for identity, gesture confirmation for intent, and a web dashboard for institutional decision support. The pilot deployment takes place in Room 328 of the College of Science Building, Computer Studies Department, TUP-M. A Raspberry Pi 4B with a USB webcam and 7-inch kiosk display serves as the classroom unit. The system is tested with actual students, a faculty member, and the department head, and evaluated using the ISO/IEC 25010 Software Quality Model.

---

### Objectives of the Study

**General Objective**

To design, develop, and evaluate a web-based, gesture-gated facial recognition attendance system deployed on Raspberry Pi for real-time attendance tracking and classroom monitoring within a selected classroom of the Technological University of the Philippines–Manila.

**Specific Objectives**

1. To design a smart monitoring system that incorporates:
   - a. Facial recognition using InsightFace's `buffalo_sc` model pack for reliable identity verification
   - b. Static hand gesture recognition via MediaPipe Hands for confirming attendance actions, including:
     - Entry (automatic upon successful facial recognition)
     - Break-out (peace sign / two-finger gesture)
     - Break-in (thumbs-up)
     - Final exit (open palm)
   - c. A web-based dashboard composed of **Student**, **Faculty**, and **Department Head** modules
   - d. A kiosk feedback interface that provides real-time confirmation, gesture guidance, and anomaly notifications for unrecognized individuals
   - e. An **early entry window** that begins recognition 10 minutes before the official class start time, ensuring students and faculty can log attendance promptly
   - f. An **auto-exit mechanism** that automatically logs an EXIT record (marked AUTO_TIMEOUT) for all users who remain present in the system when the class end time is reached

2. To create reporting and visualization features that generate structured attendance records exportable in CSV and PDF formats, including:
   - a. Personal attendance summaries and real-time status indicators for students
   - b. Class-specific and faculty-level reports for instructors and the department head
   - c. Department-wide attendance and room utilization summaries for the department head

3. To test and improve the functionality, compatibility, and usability of the system through pilot deployment in a selected classroom (Room 328, College of Science Building, Computer Studies Department) using a Raspberry Pi 4 Model B with a USB webcam

4. To evaluate the acceptability and quality of the developed system using the **ISO/IEC 25010 Software Quality Model**, focusing on:
   - a. Functional Suitability
   - b. Performance Efficiency
   - c. Interaction Capability
   - d. Reliability
   - e. Security

---

### Scope and Delimitations of the Study

This study covers the design, development, pilot deployment, and quality evaluation of FRAMES in a controlled classroom environment. The system encompasses kiosk-based facial recognition using InsightFace's `buffalo_sc` model on Raspberry Pi 4B with a USB webcam, gesture-gated attendance logging for break-out, break-in, and exit actions via MediaPipe Hands, and full attendance state handling—entry, break-out, break-in, and exit—including an early entry window and auto-exit at class end time. The system also provides anomaly notification for detected individuals not enrolled in the currently scheduled class, role-specific web dashboards for Student, Faculty, and Department Head users, and exportable attendance reports in CSV and PDF formats.

The system is deployed on a single Raspberry Pi 4 Model B unit with a USB webcam and 7-inch HDMI kiosk display. The pilot site is Room 328, College of Science Building, Computer Studies Department, TUP-Manila. The deployment involves a single day of live testing in the classroom.

The respondents for system evaluation total forty-three (43) individuals. Twenty (20) students from a computer-related program are enrolled in the class section tested in Room 328 and interacted directly with the kiosk during the live pilot deployment, experiencing the full attendance workflow including face recognition, gesture confirmation, kiosk feedback, and dashboard access. Twenty (20) students from a non-computer-related program, drawn from programs outside the Computer Studies Department, were shown a recorded demonstration video of the system in operation and then evaluated it through a parallel survey instrument that uses the same 4-point Likert acceptability scale (4 – Highly Acceptable, 3 – Acceptable, 2 – Unacceptable, 1 – Highly Unacceptable) and covers the same five ISO/IEC 25010 quality characteristics, but contains observation-based question items appropriate for respondents who viewed a demonstration rather than interacted with the system directly; this group provides external user perspective without requiring additional kiosk hardware deployment. Two (2) faculty members participated in the evaluation: the capstone course instructor who manages the class section used in the pilot and the capstone research adviser, both of whom interacted with the faculty module and were shown a complete demonstration of the system. One (1) department head—the head of the Computer Studies Department—reviewed the department-level dashboard and reports through a demonstration and hands-on walkthrough. Individuals not officially enrolled in the selected class section or not included as designated respondents are excluded from the evaluation.

The system uses a two-pipeline software architecture. On the server side, InsightFace's `buffalo_sc` model extracts 512-dimensional face embeddings from webcam frames during registration, and these embeddings are stored in a cloud-hosted PostgreSQL database (Aiven Cloud with SSL) with no raw facial images retained. On the edge side (Raspberry Pi), the same `buffalo_sc` model runs via ONNX Runtime, with MediaPipe BlazeFace serving as a fast pre-filter before invoking InsightFace detection and embedding extraction; cosine similarity is used for matching against cached enrolled embeddings. Gesture recognition is handled by MediaPipe Hands, which detects static hand gestures with three-frame temporal debouncing. The backend is built with FastAPI and SQLAlchemy ORM connected to PostgreSQL on Aiven Cloud, while the frontend uses Vite with React, Bootstrap 5.3, and Chart.js/Recharts for visualization as a mobile-responsive web dashboard.

The system is evaluated using the ISO/IEC 25010 Software Quality Model focusing on Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security. Evaluation is conducted through structured Likert-scale survey questionnaires administered to all 43 respondents after the pilot and demonstration sessions.

Several delimitations bound this study. FRAMES is evaluated as a prototype, not as an enterprise-scale or campus-wide deployment, and only one classroom (Room 328) is used for live deployment. Only facial recognition and static hand gesture recognition are implemented as biometric modalities; other modalities such as fingerprint, iris, and voice recognition are excluded. Gesture-gating functions as a behavioral deterrent rather than as advanced liveness detection, meaning no 3D depth sensing or infrared analysis is employed. The system does not include behavioral surveillance, academic performance tracking, or integration with external learning management systems. No dedicated mobile application is developed; the web dashboard is mobile-responsive and accessible from mobile browsers. No super-admin role is implemented in the current pilot; system management functions are distributed between the faculty and department head roles.

---

### Significance of the Study

**For students**, FRAMES provides faster, contactless attendance logging and immediate kiosk feedback confirming their attendance status. The web dashboard gives students direct visibility into their own attendance history and current status, reducing disputes about attendance records.

**For faculty members**, the system eliminates the need for manual roll calls and produces class-level attendance reports automatically. Faculty can view per-session attendance summaries, identify students with attendance concerns, and export records for grading or documentation purposes.

**For the department head**, FRAMES provides a consolidated dashboard showing department-wide attendance data, faculty compliance, and room utilization patterns. This supports data-driven departmental oversight without requiring the department head to physically visit classrooms or wait for manually compiled reports.

**For the institution**, the study demonstrates that a functional, multimodal attendance monitoring system can be deployed using low-cost embedded hardware (Raspberry Pi 4B and USB webcam) in a Philippine public university setting. This provides evidence that smart classroom monitoring is achievable without enterprise-grade infrastructure, offering a practical reference for similar institutions considering technology-assisted attendance solutions.

**For future researchers**, the project contributes implementation evidence for the integration of edge-based facial recognition, gesture-gated interaction, and role-based web dashboards in educational environments. The two-pipeline architecture (server enrollment, edge recognition) and the ISO/IEC 25010-based evaluation provide a replicable framework for subsequent studies on multimodal biometric systems, embedded AI deployment, and software quality assessment in education. The study's adherence to embedding-only biometric storage under the Philippine Data Privacy Act of 2012 (RA 10173) also demonstrates a privacy-by-design approach relevant to future biometric system research (National Privacy Commission, 2012).

---

### Definition of Terms

The following terms are defined as they are used in the context of this study. For a complete operational definition of all system-specific terms, see Chapter 2, Section 2.6.

**FRAMES** — Facial Recognition and Attendance Monitoring with Embedded System; the title of the system developed in this study.

**Gesture-Gated Logging** — A design rule in which attendance state changes (break-out, break-in, exit) are only recorded after both facial recognition and a confirming hand gesture are detected within a temporal window.

**Kiosk** — The physical classroom unit consisting of a Raspberry Pi 4B, USB webcam, and 7-inch HDMI display, deployed at the classroom entrance for attendance interaction.

**Anomaly Notification** — An alert generated by the kiosk when a detected face does not match any enrolled student in the currently scheduled class. No attendance is logged for unrecognized individuals.

**Attendance State** — The current attendance condition of a user in the system: entry, break-out, break-in, or exit.

**buffalo_sc** — The InsightFace model pack used in FRAMES for both enrollment and recognition, combining SCRFD face detection with MobileFaceNet embedding extraction.

**ISO/IEC 25010** — The international software quality evaluation framework used to assess the system's Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security.
