# Chapter 3
## METHODOLOGY

This chapter presents the updated methodology for FRAMES based on the current capstone context and implementation status. It includes research design, system design artifacts, development approach, operations flow, testing protocol, and evaluation procedure.

## 3.1 Research Design

This study uses a **developmental and evaluative** approach. The team designed and implemented FRAMES as a functional prototype, then evaluated the system using ISO/IEC 25010 quality dimensions under a controlled pilot deployment.

### Evaluation dimensions used in this study

- Functional Suitability
- Performance Efficiency
- Interaction Capability
- Reliability
- Security

## 3.2 Updated Pilot Setting and Participants

The methodology is constrained to the current capstone pilot context:

- Site: Room 328, College of Science Building, Computer Studies Department, TUP-Manila
- Duration: one-day deployment and testing
- Direct users:
  - one (1) department head
  - one (1) faculty
  - one (1) class
  - approximately fifty (50) students (subject to final validated class list)

### Role scope in this pilot

Operationally, this pilot focuses on:

- Student
- Faculty
- Department Head

No active admin role is included in pilot evaluation analysis.

## 3.3 System Design Artifacts

The revised diagrams are provided in the diagrams folder:

- [diagrams/01_context_diagram.md](diagrams/01_context_diagram.md)
- [diagrams/02_top_level_dfd.md](diagrams/02_top_level_dfd.md)
- [diagrams/03_use_case_diagram.md](diagrams/03_use_case_diagram.md)
- [diagrams/04_block_diagram.md](diagrams/04_block_diagram.md)
- [diagrams/05_attendance_sequence_diagram.md](diagrams/05_attendance_sequence_diagram.md)
- [diagrams/06_deployment_diagram.md](diagrams/06_deployment_diagram.md)
- [diagrams/07_conceptual_erd.md](diagrams/07_conceptual_erd.md)

## 3.4 System Architecture (Implementation-Aligned)

FRAMES uses a layered architecture:

1. **Kiosk/Edge Layer**
   - Raspberry Pi 4B
   - Webcam input
   - Local recognition and gesture flow

2. **API/Backend Layer**
   - FastAPI services
   - attendance, schedule, reports, user/profile endpoints
   - PostgreSQL persistence

3. **Web Application Layer**
   - React + Vite frontend
   - role-based interfaces for student, faculty, and department head
   - report and monitoring views

4. **Data Layer**
   - relational data for users, classes, enrollments, attendance logs, and device context

## 3.5 Attendance Operation Logic

FRAMES records attendance as state transitions, not only simple check-in/check-out.

### Core flow

1. Face detected and recognized from kiosk feed.
2. Class-context validation is applied (enrolled/assigned vs not in class).
3. Allowed transition is determined from previous state.
4. Gesture confirmation is requested for required transitions.
5. Attendance log is persisted and surfaced to dashboard/report APIs.

### Anomaly handling

If identity is recognized but the user is not part of the active class context, kiosk anomaly notification is triggered and logged accordingly.

## 3.6 Project Development Process

The capstone implementation follows a staged development process:

1. **Requirements and Constraint Analysis**
   - identify classroom workflow, role needs, and pilot constraints

2. **Architecture and Data Design**
   - design API contracts, state logic, and data schema

3. **Implementation**
   - kiosk pipeline, backend endpoints, frontend dashboards, report generation

4. **Verification and Internal Testing**
   - unit-level checks and feature-level integration checks

5. **Pilot Deployment and Evaluation**
   - one-room one-day operational run and post-use evaluation survey

## 3.7 Technology Stack Used in Methodology

### Edge/Kiosk

- Raspberry Pi 4B
- Webcam camera input
- OpenCV capture pipeline
- InsightFace buffalo_sc embeddings
- MediaPipe for gesture handling

### Backend

- Python 3.x
- FastAPI
- SQLAlchemy
- PostgreSQL

### Frontend

- React
- Vite
- Axios
- responsive web interface (no native mobile app)

## 3.8 Data Collection and Test Evidence Sources

The study gathers evidence from:

- kiosk event logs
- API-generated attendance records
- dashboard outputs
- exported report artifacts (CSV/PDF)
- respondent survey forms (students, faculty, department head)

## 3.9 Testing Procedure (ISO/IEC 25010-Aligned)

## 3.9.1 Functional Suitability

Objective: verify that FRAMES performs required attendance and reporting functions correctly.

Test focus:

- attendance transitions are logged correctly
- dashboard status reflects latest valid logs
- report generation returns valid structured outputs
- anomaly notification is raised for not-in-class recognition

## 3.9.2 Performance Efficiency

Objective: assess responsiveness under pilot operating conditions.

Test focus:

- kiosk response latency from recognition to log confirmation
- dashboard load and refresh responsiveness
- report generation completion time

## 3.9.3 Interaction Capability

Objective: evaluate usability of kiosk and dashboard interfaces.

Test focus:

- clarity of kiosk prompts and feedback
- ease of dashboard navigation for each role
- readability and mobile responsiveness of web pages

## 3.9.4 Reliability

Objective: verify consistency and stability of logging behavior.

Test focus:

- repeated operations produce consistent records
- duplicate/invalid transitions are handled safely
- logs persist correctly after refresh/reopen

## 3.9.5 Security

Objective: evaluate basic protection and access control behavior.

Test focus:

- role-limited access to pages/features
- attendance data access restrictions by role
- reduced proxy attendance risk through identity + gesture flow

## 3.10 Evaluation Instrument and Scoring

The post-deployment instrument is provided at:

- [../revised/post_deployment_iso25010_survey.md](../revised/post_deployment_iso25010_survey.md)

### Scoring method

1. Use 5-point Likert responses.
2. Compute mean per ISO criterion.
3. Compute overall acceptability mean.
4. Interpret means using the defined scale ranges.

## 3.11 Procedure for Limited Faculty/Head Respondent Scenario

Because only one faculty and one department head directly operate the pilot in one day:

- apply demo-video-assisted evaluation for additional role scenarios,
- label responses by exposure mode,
- and analyze direct-use versus demo-assisted feedback separately.

## 3.12 Ethical and Data Handling Notes

- Participation in evaluation is voluntary.
- Survey responses are aggregated for research analysis.
- Attendance records are used for system evaluation and not for punitive action within this pilot.
- Sensitive identity information is handled under institutional data privacy expectations.

## 3.13 Chapter Summary

This methodology chapter defines how FRAMES is developed, tested, and evaluated in the updated pilot context. The method is aligned with actual deployment constraints (single room, single day, limited direct evaluators) and uses ISO/IEC 25010 criteria to produce structured, role-relevant evidence for capstone evaluation.
