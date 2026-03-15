# Chapter 2
## CONCEPTUAL FRAMEWORK

This chapter presents the updated Review of Related Literature and Studies (RRL/RRS), conceptual framework, and operational definition of terms for FRAMES. The chapter aligns with the current capstone implementation context:

- Raspberry Pi 4B edge deployment
- Webcam-based capture in pilot operation
- FastAPI + PostgreSQL backend
- React + Vite web dashboard (mobile-responsive)
- InsightFace buffalo_sc for embeddings
- MediaPipe-based gesture handling
- No active admin role in the current one-room pilot operations

---

## 2.1 Review of Related Literature and Studies

## 2.1.1 Smart Attendance and Classroom Monitoring in Higher Education

Attendance monitoring remains a core process in educational institutions because it affects student accountability, course management, and departmental oversight. Literature shows that manual attendance and weak digital substitutes create recurring issues in timeliness, data integrity, and auditability. Proxy attendance and delayed encoding are repeatedly cited as common operational failures in classroom settings.

Research trends show a movement toward smart attendance systems that combine:

- computer vision,
- embedded hardware,
- and web-based monitoring interfaces.

Smart attendance systems are no longer evaluated only by detection accuracy. They are also expected to provide actionable outputs (dashboards, alerts, and reports), especially for faculty and department-level users.

## 2.1.2 Embedded and Edge-Based Deployments for Attendance

Edge computing studies show Raspberry Pi remains a practical platform for low-cost, classroom-scale intelligent systems when models and pipelines are optimized for CPU-only constraints. The key benefit is locality of processing: recognition can continue with reduced dependence on high-end servers.

In attendance applications, edge setups commonly use:

- a camera feed,
- lightweight detection,
- embedding extraction,
- nearest-match logic,
- API logging to backend.

Prior work also emphasizes that practical deployment quality depends on end-to-end pipeline design, not only model choice. Camera input stability, frame skipping policy, threshold calibration, and API resilience affect real classroom performance.

## 2.1.3 Facial Recognition for Attendance: From Token Replacement to Intent-Aware Logging

Face recognition has been used to reduce proxy attendance compared to RFID/QR approaches. However, face-only systems may still produce unintended logs (e.g., walk-by events) if attendance is automatically recorded on detection.

Recent studies and prototypes therefore combine face recognition with an explicit confirmation stage (gesture/action) to strengthen intent validation and reduce accidental state changes.

For FRAMES, this is important because attendance is not binary check-in only. The system tracks state transitions (entry, break-out, break-in, exit), requiring reliable identity and user intent.

## 2.1.4 Gesture as Intent Confirmation in Attendance Workflows

Hand gesture recognition, especially static gestures, is suitable for embedded environments due to lower computational demand than dynamic sequence modeling. MediaPipe Hands is widely used in real-time gesture interfaces because it provides robust landmark tracking at practical frame rates.

In attendance systems, gesture-gated logic can enforce explicit user action before changing attendance state, reducing false transitions and improving audit confidence.

In FRAMES, gesture flow supports attendance-state operations. The exact mapping may vary per configured policy, but operationally gestures are used to confirm non-entry transitions and prevent silent state drift.

## 2.1.5 Dashboard-Centered Monitoring and Reporting

Literature on educational monitoring tools emphasizes that raw logs are insufficient for decision-making unless transformed into role-relevant visualizations and reports. For classroom deployment, common outputs include:

- personal attendance history,
- class-level summaries,
- anomaly/exception records,
- and exportable reports for documentation.

This aligns with FRAMES architecture, where kiosk events are logged via API and consumed by web dashboards for student, faculty, and department head users.

---

## 2.2 Technology and Model Review (Updated to Current Implementation)

## 2.2.1 Why InsightFace buffalo_sc in FRAMES

The current FRAMES pipeline uses InsightFace buffalo_sc embeddings for consistency between enrollment and recognition. This design avoids cross-model embedding mismatch.

### Practical reasons for selecting buffalo_sc

1. Good speed-accuracy balance for CPU-bound edge scenarios.
2. Smaller backbone profile than heavier alternatives (e.g., buffalo_l) for Raspberry Pi constraints.
3. Integration readiness through InsightFace tooling in Python runtime.
4. Strong empirical compatibility for enrollment-recognition consistency when the same model family is used end-to-end.

## 2.2.2 buffalo_sc vs other options (design-level comparison)

| Option | Typical Strength | Typical Limitation | Fit for Current FRAMES Pilot |
|---|---|---|---|
| InsightFace buffalo_sc | Faster inference on constrained hardware; robust embeddings | Usually lower peak accuracy than larger backbones in unconstrained benchmarks | High fit (edge + near-real-time need) |
| InsightFace buffalo_l | Stronger accuracy ceiling | Heavier compute/memory load on Raspberry Pi | Lower fit for one-day classroom edge pilot |
| FaceNet (legacy variants) | Well-known embedding framework | Depends heavily on implementation and optimization path | Moderate fit |
| dlib-based embedding | Simple baseline integration | Older stack, lower robustness in challenging conditions | Moderate to low fit |

## 2.2.3 How buffalo_sc computes identity similarity in operation

In deployment, the recognition step does not classify identity with a fixed softmax over known classes. Instead, it uses embedding comparison.

Basic pipeline:

1. Detect face region from frame.
2. Extract embedding vector \(\mathbf{e} \in \mathbb{R}^d\) (typically \(d=512\) for InsightFace embeddings).
3. Compare \(\mathbf{e}\) to enrolled user embeddings.
4. Select best match by similarity threshold.

A common similarity function is cosine similarity:

$$
\text{sim}(\mathbf{e}_1, \mathbf{e}_2) = \frac{\mathbf{e}_1 \cdot \mathbf{e}_2}{\|\mathbf{e}_1\|\|\mathbf{e}_2\|}
$$

Decision logic (conceptual):

- If max similarity \(\geq\) threshold, accept recognized identity.
- Otherwise, treat as unknown/unmatched.

### Example

Assume current face embedding compares against cached enrolled embeddings:

- Student A similarity: 0.47
- Student B similarity: 0.29
- Threshold: 0.30

Result: Student A is accepted as match. If all scores are below threshold, recognition is rejected.

## 2.2.4 How buffalo_sc was trained/created (research context)

FRAMES developers did not train buffalo_sc from scratch. The system uses **pretrained InsightFace model assets** and performs deployment-time integration, threshold calibration, and pipeline optimization.

In general, InsightFace model families are trained on large-scale face datasets using deep metric-learning objectives (ArcFace-style margin losses are common in that ecosystem). Exact internal training corpus and release configuration depend on the model package version used.

For thesis clarity, the recommended wording is:

- FRAMES uses pretrained face embedding models from InsightFace.
- Local capstone work focuses on deployment engineering (integration, threshold tuning, caching, and system evaluation), not foundational model training.

## 2.2.5 Why consistency of model version matters

Enrollment and recognition must use compatible embedding space. If enrollment vectors are generated by one model family and recognition vectors by another, similarity scores become unreliable.

Therefore, FRAMES keeps model version consistency in production flow and annotates embedding metadata with model version for traceability.

---

## 2.3 Hardware Review and Deployment Relevance

## 2.3.1 Raspberry Pi 4B as edge device

Raspberry Pi 4B is selected due to:

- low deployment cost,
- acceptable CPU performance for optimized pipelines,
- ease of integration with camera and kiosk display,
- and suitability for classroom pilot operation.

## 2.3.2 Webcam-based capture in current pilot

The present capstone context uses webcam input in operation. In implementation, the camera abstraction supports both OpenCV webcam capture and picamera2 pathways, enabling flexible use across laptop testing and Raspberry Pi deployment constraints.

## 2.3.3 One-room pilot implications

Given Room 328 one-day pilot constraints, the architecture prioritizes:

- stability,
- predictable latency,
- and reliable log generation

over large-scale concurrency optimization.

---

## 2.4 Synthesis of Reviewed Literature

From local and foreign studies and implementation-focused documentation, five synthesis points guide FRAMES design:

1. Face-only attendance improves over manual methods but still needs intent confirmation.
2. Gesture-assisted confirmation improves operational reliability for state transitions.
3. Edge deployment is feasible on Raspberry Pi if model and pipeline are optimized.
4. Monitoring value comes from dashboards and reports, not just recognition events.
5. System evaluation should include software quality dimensions beyond raw model accuracy.

These points directly support the current FRAMES architecture and its ISO/IEC 25010 evaluation focus.

---

## 2.5 Conceptual Framework

## 2.5.1 Input-Process-Output (IPO) Framework

### Input

- User profiles and enrollment data
- Face registration images/frames
- Class schedule and room assignment data
- Live kiosk video feed (webcam)
- Gesture signals during attendance interaction

### Process

- Face detection and embedding extraction
- Similarity-based identity matching
- Gesture-gated attendance-state validation
- Attendance log writing via API
- Role-based dashboard aggregation and report generation
- Anomaly tagging (recognized but not part of active class context)

### Output

- Real-time attendance state updates
- Student/faculty/department-head dashboard views
- Exportable attendance reports (CSV/PDF)
- Pilot evaluation dataset for ISO/IEC 25010 criteria

## 2.5.2 Narrative Conceptual Model

FRAMES conceptualizes classroom attendance as a verified event chain:

1. Capture and detect face.
2. Confirm identity through embedding similarity.
3. Validate intended action (gesture/state rule).
4. Persist attendance event with timestamp and context.
5. Surface decision-ready outputs through dashboards and reports.

This chain reduces reliance on manual verification and increases auditability of attendance transitions.

---

## 2.6 Theoretical Anchors and Quality Lens

The system is evaluated using ISO/IEC 25010 dimensions relevant to deployment goals:

- Functional Suitability: correctness/completeness of attendance features.
- Performance Efficiency: response time and operational throughput.
- Interaction Capability: clarity and usability of kiosk/dashboard interactions.
- Reliability: consistency of logs and stable behavior in usage conditions.
- Security: role-based access and attendance data protection practices.

This quality lens ensures the study evaluates FRAMES as a complete software system, not only as a recognition model.

---

## 2.7 Operational Definition of Terms

The following terms are operationally defined for this study:

- **FRAMES**: Facial Recognition and Attendance Monitoring with Embedded System; a web-and-kiosk attendance platform for classroom use.
- **Attendance State**: The user’s current class presence condition (e.g., entered, on break, exited) derived from logged events.
- **Embedding**: Numeric vector representation of facial features used for similarity-based identity matching.
- **Face Recognition**: Matching a detected face against enrolled embeddings to determine identity.
- **Gesture-Gated Logging**: Rule requiring valid gesture or equivalent state-confirmed interaction before specific attendance transitions are recorded.
- **Kiosk Anomaly Notification**: Alert/log case when a recognized person is not part of the active class enrollment/assignment context.
- **Edge Device**: Raspberry Pi 4B running kiosk-side recognition and attendance interaction logic.
- **Web Dashboard**: Browser-based interface for student, faculty, and department head attendance monitoring and reports.
- **Pilot Deployment**: One-day implementation run in Room 328 under constrained participants and class scope.
- **ISO/IEC 25010 Evaluation**: Structured software-quality assessment using selected criteria in this study.

---

## 2.8 Chapter Summary

This chapter established the updated scholarly and technical basis for FRAMES and aligned the conceptual framework with the actual capstone implementation context. The literature supports the selected multimodal attendance strategy, edge-assisted deployment, and dashboard-driven monitoring model. The next chapter details methodology, diagrams, and testing/evaluation procedures tailored to the one-room, one-day pilot setup.

---

## Note on Citation Finalization

Before final manuscript submission, align all in-text citations with your approved bibliography manager output and institutional format. Retain only verifiable local and foreign sources used by the panel-approved reference list.
