# Chapter 2
## REVIEW OF RELATED LITERATURE AND STUDIES

This chapter presents the literature, studies, and design rationale that support FRAMES: Facial Recognition and Attendance Monitoring with Embedded System. The discussion is aligned with the current implementation context of the project: Raspberry Pi 4B edge deployment, webcam-based capture, InsightFace buffalo_sc embeddings, MediaPipe-based gesture handling, a FastAPI and PostgreSQL backend, and a React and Vite web dashboard.

The review is organized to show how attendance systems evolved from manual and single-modality approaches toward multimodal, edge-ready, and dashboard-centered solutions. It also identifies the gaps that remain in many prior works and explains how FRAMES responds to those gaps through gesture-gated logging, controlled deployment assumptions, and role-based monitoring.

---

## 2.1 Review of Related Literature

### 2.1.1 Smart Monitoring in Educational Systems

Smart monitoring in education refers to the use of digital systems that automate attendance capture, class visibility, and reporting through technologies such as the Internet of Things, embedded devices, and real-time analytics. Recent studies show that the focus has moved beyond simply recording presence toward producing actionable information for faculty and administrators. Zhao, Zhao, and Qu (2022) presented an Internet of Things-based classroom attendance management framework that centralized monitoring and made attendance data useful for institutional review. Rama Krishna et al. (2023) similarly synthesized smart attendance approaches using Raspberry Pi and emphasized camera-based recognition, dashboard support, and system integration as common design patterns.

More recent AIoT-based attendance studies strengthen this direction. Nguyen et al. (2021) demonstrated that automated attendance can be combined with artificial intelligence and Internet of Things infrastructure to improve classroom monitoring, while Firdous et al. (2023) showed that classroom attendance systems can integrate AI and IoT technologies into a single workflow. These studies support the idea that attendance systems should be designed as connected information systems rather than isolated recognition tools.

For FRAMES, this means attendance is treated as an end-to-end workflow: recognition, action confirmation, logging, dashboard display, and report generation. The system is therefore positioned as a monitoring platform, not only as a face recognition demo.

### 2.1.2 Embedded and Edge-Based Attendance Deployment

Embedded systems are central to practical attendance monitoring because they allow processing to happen close to the camera and reduce dependence on external servers. Swathi and RathnaChary (2023) demonstrated that Raspberry Pi can support live face detection and attendance management in low-cost educational settings. Ashok Kumar et al. (2021) extended this by showing that deep learning-based attendance management can run on Raspberry Pi when the model and workflow are designed for constrained hardware. Shabaneh et al. (2023) likewise confirmed that Raspberry Pi is suitable for classroom attendance systems when the pipeline is optimized for low power and edge processing.

Touzene, Abed, and Larabi (2024) pushed this further by presenting an embedded intelligent attendance system that combines edge processing with synchronization to a web interface. Aboluhom and Kandilli (2025) also showed that real-time facial recognition on Raspberry Pi is feasible when multitask learning and deployment constraints are considered carefully. Taken together, these studies show that edge deployment is not only possible but appropriate when the objective is fast, low-cost, and classroom-ready operation.

FRAMES follows this direction by using a Raspberry Pi 4B as the kiosk device and by keeping the recognition flow lightweight enough for classroom use. The design favors practical latency, stable operation, and simple hardware maintenance over heavyweight server-side inference.

### 2.1.3 Facial Recognition Techniques for Edge Devices

Facial recognition for attendance has developed from older feature-based methods to modern embedding-based deep learning models. Traditional methods such as Haar cascades and HOG-based pipelines are lightweight, but they generally provide weaker robustness than learned embedding systems. Nguyen et al. (2021) showed that classical face detection libraries can still perform well on Raspberry Pi when the image size is constrained, but the accuracy and reliability of those methods remain limited compared with modern deep learning approaches.

Deep metric-learning models changed this landscape. Schroff et al. (2015) introduced FaceNet, which established the idea of mapping faces into a compact embedding space for similarity comparison. Chen et al. (2018) later proposed MobileFaceNet, a lightweight recognition network designed for mobile and embedded devices. Deng et al. (2019) introduced ArcFace, which improved the separation of identity embeddings by adding an angular margin during training. Guo et al. (2021) then demonstrated how the InsightFace ecosystem operationalized these ideas into practical model packs for detection, alignment, and recognition.

These contributions matter for FRAMES because the system depends on embedding comparison rather than classification against a fixed list of classes. This makes the pipeline suitable for enrollment-based attendance, where new students can be added without retraining a classifier.

### 2.1.4 InsightFace and the buffalo_sc Model Choice

InsightFace is a practical face analysis toolkit because it packages detection and recognition into a consistent pipeline. Among its model packs, buffalo_sc is the most suitable for FRAMES because it balances speed and recognition quality for Raspberry Pi deployment. The lighter detector and recognizer combination is more realistic for classroom use than heavier packs such as buffalo_l, which deliver stronger benchmark accuracy but require much more computation and memory.

This choice is supported by the broader embedded-face-recognition literature. Panwar et al. (2024) reported that a CNN-based attendance system can run on constrained hardware when the architecture is selected carefully, while Elnozahy et al. (2025) showed that Raspberry Pi-based facial recognition can support secure access-control scenarios when the model is compact and the pipeline is simple. Mohammad et al. (2024) further demonstrated that MobileNetV2 and FaceNet variants can be deployed successfully on Raspberry Pi 400 in an IoT-oriented recognition setup.

For FRAMES, the important point is consistency. The same model family is used for enrollment and recognition so that embedding comparisons remain meaningful. This avoids the mismatch problem that occurs when enrollment and recognition use different feature spaces.

### 2.1.5 Face Embeddings, Privacy, and Bias

Face embeddings are numeric vectors that represent facial geometry in compact form. Their main advantage is that they allow similarity comparison without storing raw facial images. This is important for storage efficiency and for privacy protection, because the system keeps vectors rather than camera snapshots as the primary biometric record.

However, embeddings are not risk-free. Buolamwini and Gebru (2018) showed that face systems can have measurable demographic performance gaps when training data is not balanced. Boutros et al. (2021) also showed that masks and other facial occlusions can reduce recognition reliability. Jasmine and Jasper (2022) added that embeddings themselves can still be sensitive because inversion attacks may reconstruct approximate facial information from stored vectors.

These findings support FRAMES's privacy and design choices. The system stores embeddings rather than raw face images, applies role-based access control, and treats biometric data as sensitive information that must be handled carefully. The Philippine Data Privacy Act of 2012 also reinforces the need for responsible biometric handling in any educational deployment (National Privacy Commission, 2012).

### 2.1.6 Gesture Recognition as Intent Confirmation

Gesture recognition is useful in attendance systems because it can serve as a confirmation layer that distinguishes intentional interaction from accidental detection. For embedded systems, static gestures are usually more practical than dynamic motion sequences because they are faster to evaluate and easier to stabilize on low-power hardware. Mohamed, Hassan, and Jamil (2024) noted that gesture recognition for real-time embedded use must remain robust under lighting variation, clutter, and partial occlusion.

MediaPipe Hands is widely used because it detects hand landmarks efficiently and supports practical real-time interaction. Lugaresi et al. (2019) provided the original framework that made this kind of landmark-based interaction accessible for embedded and cross-platform applications. Anand et al. (2024) further showed that OpenCV and MediaPipe can be integrated into gesture-controlled systems, confirming that this interaction model is technically viable beyond toy prototypes.

FRAMES uses gesture input as a confirmation step for attendance transitions such as break-out, break-in, and exit. A three-frame debounce rule is used so that accidental hand motion does not trigger a state change. This makes the gesture layer a practical intent filter rather than an extra burden on the user.

### 2.1.7 Multimodal Fusion and Gesture-Gated Logging

Single-modality attendance systems are often efficient, but they remain vulnerable to proxy attendance and unintended logs. Multimodal fusion addresses this by combining face recognition with a behavioral confirmation channel. Mukthineni et al. (2020) showed that face-authenticated gesture-based interaction can reduce misuse by requiring both identity and action intent. Jha et al. (2024) similarly argued that multimodal biometric fusion improves robustness because one modality compensates for weaknesses in the other. Bala, Gupta, and Kumar (2022) reviewed fusion strategies and noted that decision-level fusion is often the most practical choice for embedded systems because it avoids expensive cross-feature preprocessing.

FRAMES adopts a sequential, decision-level approach. Face recognition establishes identity first, and a gesture then confirms the desired attendance action when the state change requires it. This is especially relevant in a classroom kiosk where the system must distinguish between entry, temporary break, return from break, and exit.

### 2.1.8 Real-Time Performance on Raspberry Pi

Real-time performance is a decisive requirement for attendance systems used at the classroom door. Raspberry Pi 4B is capable of running such systems, but only when the pipeline is carefully optimized. Tank, Patel, and Deshmukh (2022) showed that multithreaded architecture improves responsiveness on Raspberry Pi because capture, inference, and display can be separated. Aboluhom and Kandilli (2025) likewise reinforced the idea that model selection and pipeline design directly affect practical latency.

FRAMES applies the same principle by combining a lightweight face gate, compact embedding extraction, and in-memory comparison of enrolled users. The goal is not maximum benchmark accuracy in isolation. The goal is a fast and reliable kiosk response that is acceptable in a live classroom setting.

### 2.1.9 Attendance Modality Comparison

Different attendance methods vary in hygiene, speed, spoof resistance, and deployment cost. Manual roll call is simple but slow and difficult to audit. RFID and QR-based systems are faster but can be shared. Fingerprint systems offer stronger identity binding but require touch and can be less desirable in shared environments. Face-only systems are contactless but remain vulnerable to spoofing and unintended recognition.

FRAMES positions face plus gesture as a balanced alternative. It remains contactless, improves intent confirmation, and is inexpensive to deploy with a single webcam and Raspberry Pi kiosk. Vadwala (2024) supported the value of touchless biometric attendance in institutional settings, while Mukthineni et al. (2020) explained why gesture confirmation improves spoof resistance without requiring more expensive hardware.

[Insert Table 2.1 here: Comparison of attendance modalities showing hygiene, speed, spoof resistance, and deployment cost. Suggested content: manual roll call, RFID, QR code, fingerprint, face only, and face plus gesture.]

### 2.1.10 Dashboard-Centered Monitoring and Visualization

Attendance systems become more useful when raw logs are transformed into dashboards, reports, and summaries. Classroom users need immediate feedback, while faculty and department heads need trend views and exportable records. This is why the web dashboard is not a cosmetic add-on in FRAMES. It is part of the system's core value.

FRAMES uses a browser-based dashboard so that attendance events captured by the kiosk can be viewed in real time and later analyzed through summary reports. This aligns with the broader shift in educational monitoring systems toward decision support rather than standalone logging.

[Insert Figure 2.1 here: FRAMES monitoring flow from kiosk capture to backend logging to web dashboard visualization. Suggested content: Raspberry Pi camera input, recognition, gesture confirmation, API write, dashboard update.]

---

## 2.2 Review of Related Studies

### 2.2.1 Local Studies

Local studies are important because they reflect classroom conditions similar to the present deployment context. Reynoso and Torres (2020) introduced Tempus, a Raspberry Pi 3-based attendance system that used facial recognition for classroom monitoring. Delos Trinos et al. (2019) also presented a real-time class attendance monitoring system using smart face recognition in a local conference setting. Alon et al. (2020) proposed a YOLOv3-based attendance system that improved detection robustness, while Domingo and Ladia (2024) developed QSUM-eASys, a face recognition attendance and web-based monitoring system for a university deployment.

These studies show that facial recognition-based attendance is locally relevant and feasible. At the same time, they also reveal the gaps that FRAMES is designed to address. Many local systems emphasize detection or monitoring but do not fully integrate gesture-gated intent confirmation, runtime performance reporting, and a role-based web dashboard that supports both operational use and administrative review.

### 2.2.2 Foreign Studies

Foreign studies provide the technical foundation for FRAMES's edge deployment and multimodal design. Nadhan et al. (2022) showed that automated attendance monitoring can run on low-cost platforms when the architecture is carefully defined. Shabaneh et al. (2023) reinforced the suitability of Raspberry Pi for classroom attendance systems, while Mohammad et al. (2024) demonstrated that multimodal face recognition on Raspberry Pi-class hardware can deliver usable real-time performance.

Other studies focused on gestures and multimodal interaction. Yadav and Jain (2024) reported a real-time vision-based hand gesture recognition approach, and Muneeb et al. (2023) demonstrated gesture-driven control in assistive systems. These works help justify the gesture layer in FRAMES, which uses hand movement as an explicit attendance confirmation mechanism rather than a general-purpose gesture interface.

The literature also highlights the importance of deployment detail. Aboluhom and Kandilli (2025) discussed the practical limits of Raspberry Pi facial recognition, while Touzene et al. (2024) and Tank et al. (2022) emphasized that embedded performance depends on the full pipeline, not only on the model. This supports the FRAMES design choice to optimize the entire flow from capture to logging.

[Insert Table 2.2 here: Summary of representative local and foreign studies, their key contributions, and the gaps FRAMES addresses.]

---

## 2.3 Synthesis of the Literature and Studies

Across the reviewed literature, five consistent points emerge.

First, attendance systems are becoming increasingly smart, meaning that they combine recognition, logging, analytics, and reporting rather than acting as simple check-in tools. Second, edge deployment on Raspberry Pi is feasible when the recognition model and pipeline are kept lightweight. Third, face recognition alone is not sufficient for a robust classroom attendance workflow because it can still produce accidental or spoofed logs. Fourth, gesture recognition is most useful when it confirms intent rather than functioning as a standalone feature. Fifth, dashboards and reports are essential because the real value of attendance data lies in its interpretation.

FRAMES integrates these points into one deployment-oriented design. It uses a compact face recognition pipeline, gesture-gated logging for non-entry actions, role-based web dashboards, and a reporting layer that turns attendance events into decision-support information.

[Insert Figure 2.2 here: Conceptual gap map showing how prior works cover face recognition, gesture recognition, dashboards, and edge deployment, and how FRAMES combines them.]

---

## 2.4 Conceptual Framework

### 2.4.1 Input-Process-Output Model

The conceptual framework of this study follows the Input-Process-Output model.

**Input**

- Enrolled user profiles and embeddings
- Class schedule and room context
- Webcam video stream from the kiosk
- Gesture signals for attendance confirmation
- Backend access rules and role-based dashboard requirements

**Process**

- Face detection and alignment
- Embedding extraction using InsightFace buffalo_sc
- Similarity matching against enrolled embeddings
- Gesture confirmation for action-based attendance states
- Logging through the backend API
- Dashboard display and report generation

**Output**

- Real-time attendance records
- Student, faculty, and department head dashboard views
- Exportable reports and summaries
- Anomaly notifications for unrecognized or out-of-context detections

[Insert Figure 2.3 here: Input-Process-Output conceptual framework for FRAMES.]

### 2.4.2 Narrative Framework

FRAMES conceptualizes attendance as a verified event chain. A face is captured, the identity is matched through embeddings, the intended action is confirmed when required by gesture, and the event is written to the database and surfaced through the dashboard. This sequence reduces manual intervention while keeping the process auditable and understandable for users.

---

## 2.5 Theoretical and Quality Lens

The system is also evaluated through the software quality model of ISO/IEC 25010:2023. The characteristics most relevant to FRAMES are Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security. These dimensions are appropriate because the system must not only recognize a face but also respond quickly, remain understandable to users, maintain stable logs, and protect biometric data.

This quality lens is useful because it treats FRAMES as a complete software system rather than as a model benchmark alone. The evaluation therefore reflects actual deployment behavior in a classroom environment.

---

## 2.6 Operational Definition of Terms

**Attendance State** - The current condition of a user in the class workflow, such as entry, break-out, break-in, or exit.

**Embedding** - A numeric vector that represents facial features for similarity comparison.

**Face Recognition** - The process of matching a detected face against enrolled embeddings to determine identity.

**Gesture-Gated Logging** - A rule that requires a valid hand gesture before specific attendance transitions are recorded.

**Kiosk Anomaly Notification** - An alert generated when a detected face is not part of the active class context.

**Edge Device** - The Raspberry Pi 4B used to run the kiosk-side recognition workflow.

**Web Dashboard** - The browser-based interface used by students, faculty, and department head users to view attendance and reports.

**ISO/IEC 25010 Evaluation** - A structured software-quality assessment using selected product quality characteristics.

**FRAMES** - Facial Recognition and Attendance Monitoring with Embedded System; the project title of the study.

---

## 2.7 Chapter Summary

The reviewed literature shows that attendance systems are moving toward edge-ready, multimodal, and dashboard-centered designs. The studies also show that facial recognition is practical on Raspberry Pi when the model is chosen carefully, but that face-only systems remain vulnerable to spoofing and unintended logs. Gesture confirmation, therefore, is not an optional add-on in FRAMES. It is a design response to the limitations of face-only attendance.

Overall, the literature supports the use of a lightweight face embedding model, gesture-gated attendance actions, and a web dashboard for reporting and monitoring. These findings justify the FRAMES architecture and provide the basis for the system's conceptual framework and quality evaluation.

For the full APA list of sources used in this chapter, see [chapter2_references_apa_2026_04_05.md](chapter2_references_apa_2026_04_05.md).
