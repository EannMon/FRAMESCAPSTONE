# Chapter 1

## THE PROBLEM AND ITS SETTING

This chapter outlines the rationale, goals, and context of the proposed system. It introduces the background, significance, objectives, and scope of the study to guide the reader in understanding the relevance and direction of the research.

---

### Introduction

The integration of digital technologies into educational institutions has transformed how classrooms are managed, secured, and evaluated. Among these processes, attendance monitoring remains a critical yet persistent challenge. Accurate attendance records are essential for evaluating student engagement, faculty compliance, classroom utilization, and institutional accountability (Aguda, 2024; Vadwala, 2024). However, traditional attendance methods—such as manual roll calls, paper logbooks, and basic digital sign-ins—remain widely used despite their inefficiency and vulnerability to misuse.

Manual attendance consumes valuable instructional time and is prone to human error, delayed recording, and intentional misreporting (Domingo & Ladia, 2024). Proxy attendance, commonly referred to as "buddy punching," undermines the reliability of records and weakens institutional enforcement of attendance policies (Mukthineni et al., 2020). Even technology-assisted approaches such as RFID cards and QR codes offer limited protection against misuse, as credentials may be shared, misplaced, or scanned without physical presence (Hasini et al., 2024). While CCTV systems are increasingly deployed in classrooms, they typically function only as passive surveillance tools and do not provide automated identity verification or structured attendance data (Kagona, 2022).

Recent advances in computer vision and artificial intelligence have enabled contactless biometric systems capable of addressing these limitations. Facial recognition has emerged as a practical solution for identity verification without requiring physical tokens or contact (Siddiqui et al., 2023). However, facial recognition systems that automatically log attendance upon detection remain vulnerable to unintended walk-by logging, spoofing attempts using printed images or mobile phone displays, and ambiguous user intent (Jha et al., 2024). These issues highlight the need for attendance systems that not only recognize identity but also confirm intentional participation.

To address this gap, gesture-gated interaction has gained attention as a complementary mechanism to facial recognition. Hand gesture recognition introduces an explicit, touchless action that confirms user intent, ensuring that attendance events are logged deliberately rather than passively (Mukthineni et al., 2020). When combined with facial recognition, gesture-gated systems form a multimodal authentication approach that enhances reliability, minimizes accidental logging, and improves resilience against simple presentation attacks (Jha et al., 2024).

Despite the promise of such systems, many existing solutions rely on high-cost infrastructure, including GPU-powered servers and enterprise-grade camera systems, which are impractical for large-scale deployment in resource-constrained educational institutions (Mohammad et al., 2024). This limitation is particularly evident in Philippine public universities, where cost-effective, scalable, and energy-efficient solutions are required.

In response, this study proposes **Facial Recognition and Attendance Monitoring with Embedded System (FRAMES)**—a web-based, gesture-gated attendance and monitoring system deployed on Raspberry Pi hardware. FRAMES integrates optimized facial recognition using InsightFace's `buffalo_sc` model pack, static hand gesture confirmation via MediaPipe, and room-aware monitoring to deliver an intentional, contactless, and low-cost attendance solution suitable for classroom environments. A USB webcam connected to a Raspberry Pi 4 Model B serves as the primary image acquisition device, providing reliable, plug-and-play operation without the complexity of CSI-based camera modules. By combining embedded edge computing with a modern web-based dashboard featuring real-time visualization and actionable analytics, the system transforms attendance monitoring from a routine administrative task into a data-driven decision-support tool.

---

### Background of the Study

Attendance monitoring plays a central role in maintaining academic integrity, evaluating instructional delivery, and ensuring effective utilization of institutional resources. However, persistent challenges continue to affect its reliability. Manual attendance systems are susceptible to falsification, delayed encoding, and inconsistent enforcement, resulting in records that do not accurately reflect actual classroom participation (Vadwala, 2024). In academic settings, discrepancies between scheduled classes and actual room usage further complicate administrative oversight and departmental monitoring.

Various technological alternatives have been introduced to address these concerns. RFID-based systems and QR code scanning reduce recording time but remain vulnerable to credential sharing and impersonation (Hasini et al., 2024). Biometric systems such as fingerprint scanners improve identity verification but require physical contact, raising hygiene concerns and limiting usability in post-pandemic learning environments (Aguda, 2024). Facial recognition offers a contactless alternative; however, facial-only systems often lack intent verification, leading to accidental or unauthorized attendance logging (Siddiqui et al., 2023).

Research in multimodal biometric systems emphasizes the effectiveness of combining facial recognition with behavioral confirmation mechanisms, such as hand gestures, to improve authentication reliability (Mukthineni et al., 2020). Gesture-gated interaction ensures that users consciously initiate attendance events, reducing false positives and mitigating basic spoofing attempts. This approach aligns well with classroom dynamics, where intentional participation is essential (Jha et al., 2024).

From a deployment perspective, the cost and complexity of conventional facial recognition systems present significant barriers. High-performance servers and proprietary platforms are often unsuitable for institutions with limited budgets (Mohammad et al., 2024). Embedded systems, particularly the Raspberry Pi 4 Model B, offer a viable alternative due to their affordability, low power consumption, and sufficient computational capability when paired with optimized machine learning models (Aboluhom & Kandilli, 2023). Lightweight deep learning architectures—such as MobileFaceNet within InsightFace's `buffalo_sc` model pack, optimized with depthwise separable convolutions for edge inference—enable near real-time facial recognition on resource-constrained devices without requiring model conversion to TensorFlow Lite (InsightFace, 2023; Chen et al., 2018). The use of a standard USB webcam further reduces hardware complexity by eliminating dependencies on CSI ribbon cables and the `picamera2` software stack, instead relying on the Universal Video Class (UVC) protocol for plug-and-play operation on Raspberry Pi OS.

Within the context of the Technological University of the Philippines–Manila (TUP-M), challenges related to attendance verification, classroom utilization, and departmental monitoring highlight the need for an integrated and scalable solution. Instances of unverified attendance claims, inconsistencies between schedules and actual class conduct, and limited visibility into room usage underscore the importance of an automated monitoring system that operates holistically across students and faculty members.

FRAMES is designed to address these challenges through a modular web-based platform consisting of **Student**, **Faculty**, and **Department Head** modules. Facial embeddings are enrolled through a controlled registration process on the web application using the browser's webcam and stored as 512-dimensional vectors in a cloud-hosted PostgreSQL database. A classroom-mounted Raspberry Pi unit equipped with a USB webcam and kiosk display performs real-time recognition and gesture-gated logging. Room-aware visualization allows stakeholders to monitor the active classroom, while analytics and reports provide insights into attendance patterns, punctuality, break durations, and room utilization. Through this integrated approach, FRAMES extends beyond attendance recording to support institutional accountability and informed decision-making.

---

### Objectives of the Study

The general objective of this study is to design, develop, and evaluate a web-based smart monitoring system that integrates Raspberry Pi–based facial recognition and gesture-gated authentication for real-time attendance tracking and classroom monitoring within a selected classroom of the Technological University of the Philippines–Manila.

Specifically, the study aims:

1. To design a smart monitoring system that incorporates:
   - a. Facial recognition using InsightFace's `buffalo_sc` model pack for reliable identity verification
   - b. Static hand gesture recognition via MediaPipe Hands for confirming attendance actions, including:
     - Entry (automatic upon successful facial recognition)
     - Break-out (peace sign / two-finger gesture)
     - Break-in (thumbs-up)
     - Final exit (open palm)
   - c. A web-based dashboard composed of **Student**, **Faculty** (with Department Head access), modules
   - d. A kiosk feedback interface that provides real-time confirmation, gesture guidance, and anomaly notifications for unrecognized individuals
   - e. An **early entry window** that begins recognition **10 minutes before** the official class start time, ensuring students and faculty can log attendance promptly without being penalized as late
   - f. An **auto-exit mechanism** that automatically logs an EXIT record (marked `AUTO_TIMEOUT`) for all users who remain present in the system when the class end time is reached, ensuring attendance records are always closed even without manual exit action

2. To create reporting and visualization features that generate structured attendance records exportable in CSV and PDF formats, including:
   - a. Personal attendance summaries and real-time status indicators for students
   - b. Class-specific and faculty-level reports for instructors and the department head
   - c. Department-wide attendance and room utilization reports for the department head

3. To test and improve the functionality, compatibility, and usability of the system through pilot deployment in a selected classroom (Room 328, College of Science Building, Computer Studies Department) using a Raspberry Pi 4 Model B with a USB webcam

4. To evaluate the acceptability and quality of the developed system using the **ISO/IEC 25010 Software Quality Model**, focusing on:
   - a. Functional Suitability
   - b. Performance Efficiency
   - c. Interaction Capability
   - d. Reliability
   - e. Security

---

### Scope and Delimitations of the Study

This study focuses on the design, development, and evaluation of FRAMES, a prototype smart attendance and monitoring system intended for classroom environments. The system integrates facial recognition and static hand gesture confirmation to automate attendance logging while ensuring intentional user interaction. Unlike attendance systems that automatically log presence upon facial detection, FRAMES employs gesture-gated actions to prevent accidental or unauthorized attendance recording, thereby improving the reliability and integrity of attendance data (Mukthineni et al., 2020).

**Deployment Scope.** The system is deployed on a single Raspberry Pi 4 Model B unit equipped with a USB webcam and a 7-inch HDMI IPS kiosk display. The system is piloted in one (1) classroom—**Room 328 of the College of Science Building** at the Technological University of the Philippines–Manila, under the **Computer Studies Department**. Testing and deployment are conducted within a single day to establish a focused and controlled evaluation environment.

The kiosk implements two scheduling-aware behaviors: (1) an **early entry window** that opens recognition 10 minutes before the scheduled class `start_time`, ensuring that users who arrive early are logged on time rather than denied access; and (2) an **auto-exit** routine that automatically closes all open attendance sessions at class `end_time`, logging an EXIT with `verified_by = AUTO_TIMEOUT` for any user who did not manually exit. It is recommended that rooms installing the FRAMES kiosk maintain at least a **30-minute interval between consecutive class schedules** to allow for orderly transitions and prevent schedule overlap at the kiosk level.

**Participants.** The subjects of the study include the following:
- **One (1) Department Head** — the head of the Computer Studies Department, who utilizes the system to review department-wide attendance and faculty reports. Since the department head is the sole user of the department-level module, a **demonstration video** of the system is prepared to supplement their evaluation.
- **One (1) Faculty Member** — a faculty member under the Computer Studies Department who manages one class section and utilizes the system for face enrollment, attendance tracking, and class-level report generation. A demonstration video is also provided to this user.
- **Approximately fifty (50) students** — the students enrolled in the class section managed by the faculty member. These students enroll their facial data through the web application and interact with the kiosk for daily attendance logging.

Individuals not officially enrolled in the selected class section, such as visitors or walk-in users, are excluded from the study. Individuals detected by the kiosk who are not enrolled in the current class are flagged as anomalies and do not have attendance logged.

**Software Architecture.** The system utilizes a two-pipeline facial recognition architecture:

- **Enrollment Pipeline (Server-Side):** The InsightFace `buffalo_sc` model pack (MobileFaceNet backbone with ArcFace loss) is used on the backend server to extract 512-dimensional normalized face embeddings from webcam-captured frames during registration. Multiple frames are averaged and L2-normalized to produce a single stable embedding per user, which is stored in a cloud-hosted **PostgreSQL** database (Aiven Cloud with SSL). No raw facial images are retained—only embedding vectors.

- **Recognition Pipeline (Edge/Raspberry Pi):** The same InsightFace `buffalo_sc` model runs on the Raspberry Pi 4 kiosk via ONNX Runtime. A two-stage gated detection approach is employed: **MediaPipe BlazeFace** serves as a fast pre-filter (~30ms) to detect whether a face is present before invoking the heavier InsightFace detection and embedding extraction (~300–500ms). Recognized embeddings are compared against a locally cached copy of enrolled embeddings using cosine similarity.

- **Hand Gesture Recognition:** Static hand gesture recognition is implemented using **MediaPipe Hands** to confirm user intent during break-out, break-in, and exit actions. A three-frame temporal smoothing debounce ensures consistent gesture detection before logging.

- **Backend:** The server-side application is built with **FastAPI** (Python, asynchronous), **SQLAlchemy 2.x** ORM, and **PostgreSQL** hosted on Aiven Cloud. The backend handles user authentication, face enrollment, attendance logging, schedule management, and report generation.

- **Frontend:** The web dashboard is developed with **Vite** and **React (JSX)**, using **Axios** for HTTP communication, **Bootstrap 5.3** for responsive layout, and **Chart.js / Recharts** for attendance visualization. The dashboard is mobile-responsive and accessible on desktop and mobile browsers without a dedicated mobile application.

**Evaluation.** The evaluation of FRAMES is conducted using the **ISO/IEC 25010 Software Quality Model**, focusing on **Functional Suitability**, **Performance Efficiency**, **Interaction Capability**, **Reliability**, and **Security**. System evaluation is performed by students, the faculty member, and the department head through structured survey questionnaires based on a Likert scale administered after a one-day testing and deployment period. For the faculty member and department head, a demonstration video of the system is provided to supplement their hands-on experience, given that they are the sole users of their respective modules.

For testing of reporting features, **seeded attendance data** is generated in accordance with the format of the system's attendance data structure. This approach enables the evaluation of reports and analytics beyond the limited data produced during a single day of testing.

**Delimitations.** The study is delimited to the evaluation of FRAMES as a prototype system and does not assess enterprise-scale or campus-wide deployment. The system focuses exclusively on facial recognition combined with static hand gesture interaction, excluding other biometric modalities such as fingerprint, iris, or voice recognition. While gesture-gated interaction reduces basic spoofing and unintended logging, advanced liveness detection and presentation attack detection techniques (e.g., 3D depth sensing, infrared analysis) are beyond the scope of this study. Furthermore, the system is limited to attendance verification and classroom occupancy monitoring and does not include behavioral surveillance, academic performance tracking, or integration with external learning management systems. The system does not include a dedicated mobile application but is designed to be mobile-responsive through its web-based interface. No administrative (admin) role is implemented; system management functions are distributed between the faculty and department head roles.

---

### Significance of the Study

This study contributes to the advancement of smart classroom technologies by presenting a low-cost, contactless, and intention-aware attendance monitoring system.

**For students and faculty members**, FRAMES minimizes attendance errors, reduces administrative workload, and promotes accountability through transparent and real-time feedback mechanisms. The gesture-gated approach ensures that attendance records reflect deliberate participation rather than passive presence. Students benefit from immediate visual feedback on the kiosk confirming their attendance status, while faculty members gain access to class-level attendance summaries and reports generated automatically by the system.

**For academic departments**, the system provides actionable insights into classroom utilization, faculty attendance, and student attendance trends, supporting data-driven decision-making and policy evaluation (Vadwala, 2024). The department head can review aggregated attendance data and faculty compliance reports through the web dashboard, enabling informed oversight of departmental operations.

**For the institution and future researchers**, FRAMES demonstrates the feasibility of deploying edge-optimized artificial intelligence systems using affordable embedded hardware and standard USB peripherals. The use of InsightFace's `buffalo_sc` model—a lightweight yet accurate face recognition model based on MobileFaceNet and ArcFace loss—offers a practical reference for future research on multimodal biometrics, edge computing, and gesture-gated interaction design in educational environments. The two-pipeline architecture (enrollment on server, recognition on edge) provides a replicable deployment pattern for similar resource-constrained computing scenarios. Additionally, the system's adherence to the Data Privacy Act of 2012 (RA 10173) through embedding-only storage and consent-based enrollment underscores the importance of privacy-by-design in biometric systems deployed in educational settings.
