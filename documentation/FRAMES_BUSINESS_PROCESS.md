# FRAMES Business Process Design

## Purpose

This document answers the foundational business process questions for FRAMES and defines the complete user interaction flow. **This is a draft for team review before finalizing.**

---

## 1. Who Are the Actors?

There are **four user roles** in FRAMES. Each role maps to a specific module and set of capabilities.

| Role | Who | How Many | Module | Primary Purpose |
|------|-----|----------|--------|-----------------|
| **Faculty Member** | Subject instructors who teach specific classes | Multiple per department | Faculty Module | Upload class schedules, manage class attendance, view reports |
| **Department Head** | The head of a department (e.g., Computer Studies Department) | 1 per department | Department Head Module | Monitor all faculty and students within the department; approve faculty accounts |
| **Student** | Enrolled students | Many per class | Student Module | View personal attendance records and class status (read-only) |
| **Program Coordinator** | Faculty members who hold a special administrative position for a specific program (e.g., BSIT, BSIS, BSCS) | 1 per program (3 in CSD) | Admin/Coordinator Module | Monitor program-specific data for their assigned program only |

### Role Hierarchy (Within a Department)

```
Department Head (1 per department)
├── Program Coordinator - Information Technology (1)
├── Program Coordinator - Information Systems (1)  
├── Program Coordinator - Computer Science (1)
├── Faculty Member A (teaches BSIT classes)
├── Faculty Member B (teaches BSIS classes)
├── Faculty Member C (teaches across programs)
└── Students (auto-created, belong to enrolled classes)
```

### How Are Program Coordinators Scoped?

**Problem:** Program coordinators are regular faculty members but hold an additional oversight role for exactly one program. A coordinator for BSIT should only see BSIT data, not BSIS or BSCS.

**Solution:** The `program_id` field in the user record determines scoping.

| Coordinator | `program_id` | Sees Only |
|---|---|---|
| IT Coordinator | BSIT | BSIT faculty, BSIT classes, BSIT students |
| IS Coordinator | BSIS | BSIS faculty, BSIS classes, BSIS students |
| CS Coordinator | BSCS | BSCS faculty, BSCS classes, BSCS students |

A coordinator can also teach classes (they are still a faculty member). Their teaching view shows their own classes; their coordinator view shows their program's aggregate data.

---

## 2. Who Starts the Process?

The process is **initiated by the Faculty Member** but enabled by the **Department Head**.

### Initialization Flow (One-Time Setup Phase)

```
Step 1: Department Head registers their own account
        → Account is immediately active (no approval needed — 
           they are the top of the department hierarchy)
        → Department Head registers their face embeddings
        
Step 2: Faculty Member creates their own account
        → Account status: PENDING
        → Department Head receives notification of pending faculty account
        → Department Head reviews and APPROVES or REJECTS
        → If approved → Faculty Member account becomes ACTIVE
        → Faculty Member is prompted to register face embeddings

Step 3: Faculty Member uploads class schedule (PDF from TUP portal)
        → System parses the PDF and extracts: section, subject, 
           room, day/time, enrolled student list
        → For EACH student in the uploaded schedule:
           - IF student account already exists → 
             Add enrollment to the new class (no new account)
           - IF student account does NOT exist → 
             Auto-create student account with PENDING face registration
        → Class is created under the faculty member's portal

Step 4: Students open their auto-created accounts
        → First login → prompted to register face embeddings
        → Face registration happens via browser webcam
        → After registration → student can access their dashboard
```

### Why Does the Process Start?

The process starts because:
1. **The institution needs accurate, verifiable attendance records** to evaluate student engagement, faculty compliance, and room utilization.
2. **Manual methods are unreliable** — they are slow, falsifiable, and provide no real-time visibility to department heads.
3. **The department head needs automated oversight** — knowing which classes are actually conducted, which rooms are occupied, and which students are present, without physically inspecting every classroom.
4. **Faculty members need evidence** — automated time-stamped records that support or challenge student attendance claims, exportable for grading documentation.

---

## 3. What Decisions Happen?

### Decision Point 1: Faculty Account Approval

```
Faculty creates account
→ DECISION (by Department Head): Approve or Reject?
  → Approve: Faculty gains access to Faculty Module
  → Reject: Faculty is notified; cannot use the system
```

### Decision Point 2: Student Account Creation During Schedule Upload

```
Faculty uploads class schedule PDF
→ System parses student list
→ For each student:
  DECISION (automated): Does this student already have an account?
    → YES: Link student to new class (add enrollment, no new account)
    → NO: Create new student account, link to class, set face registration as PENDING
```

### Decision Point 3: Attendance Recognition at Kiosk

```
Camera detects a face
→ DECISION: Does the face match an enrolled student in the CURRENTLY SCHEDULED class?
  → YES (match):
    DECISION: What is their current attendance state?
      → No prior log today → Log as ENTRY (automatic, no gesture needed)
      → State is ENTRY → Prompt for BREAK_OUT gesture (peace sign)
      → State is BREAK_OUT → Prompt for BREAK_IN gesture (thumbs-up)
      → State is BREAK_IN → Prompt for EXIT gesture (open palm)
      → State is EXIT → Session complete; no further logging
  → NO (not enrolled in current class but recognized in system):
    → Flag as "NOT ENROLLED" — the person is registered in the system but 
       not in the class currently scheduled for this room
    → Log anomaly; do not record attendance
  → NO (unknown face — not in the system at all):
    → Flag as "UNRECOGNIZED INDIVIDUAL"
    → Log anomaly for security review; do not record attendance
```

### Decision Point 4: Auto-Exit at Class End Time

```
Class end_time is reached
→ DECISION (automated): Are there open attendance sessions (ENTRY, BREAK_IN without EXIT)?
  → YES: Automatically log EXIT with verified_by = AUTO_TIMEOUT and remark [AUTO_EXIT]
  → NO: No action needed
```

### Decision Point 5: Report Generation and Insights

```
Faculty or Department Head accesses reports
→ DECISION (user): What time range, class, or scope?
  → Per-class report (faculty level)
  → Per-faculty summary (department head level)
  → Department-wide attendance trends (department head level)
  → Program-level report (program coordinator level)
→ System generates:
  - Attendance rates (present, late, absent percentages)
  - Break duration analysis
  - Punctuality trends
  - Room utilization summary
  - Anomaly summary (unrecognized individuals, not-enrolled detections)
→ DECISION (actionable insight examples):
  - "Class CpE301 has 40% chronic late arrivals on Mondays" → Faculty may adjust start time or escalate
  - "Room 328 was unused during its scheduled CpE201 slot on 3 occasions this month" → Department Head investigates
  - "Student TUPM-21-0045 has missed 6 consecutive sessions" → Faculty initiates intervention
```

---

## 4. What Data Is Created or Updated?

### Data Created

| Event | Data Created | Table/Entity |
|-------|-------------|--------------|
| Faculty registers | User record (role=FACULTY, status=PENDING) | `users` |
| Department Head approves faculty | Update user status to VERIFIED | `users` |
| Faculty uploads schedule | Class record, Subject record, Enrollment records, Student accounts | `classes`, `subjects`, `enrollments`, `users` |
| Student registers face | Facial embedding (512-dim vector) | `facial_profiles` |
| Kiosk recognizes face | Attendance log (user_id, class_id, action, timestamp, is_late, verified_by) | `attendance_logs` |
| Unknown face detected | Anomaly record (timestamp, room, frame snapshot reference) | `anomaly_logs` |
| Not-enrolled face detected | Anomaly record with user reference | `anomaly_logs` |
| Auto-exit triggered | Attendance log (action=EXIT, verified_by=AUTO_TIMEOUT) | `attendance_logs` |
| Report generated | Export file (CSV/PDF) | Generated on demand, not stored permanently |

### Data Updated

| Event | Data Updated |
|-------|-------------|
| Student enrolled in additional class by different faculty | `enrollments` table — new row added; `users` table — not modified (account already exists) |
| Student re-registers face | `facial_profiles` table — embedding vector updated, old vector overwritten |
| Faculty updates class schedule | `classes` table — schedule fields updated; `enrollments` — reconciled |
| Embedding cache refresh on kiosk | Local cache — synced from `facial_profiles` via API |

---

## 5. Who Consumes the Output?

| Output | Consumed By | Format | Purpose |
|--------|-------------|--------|---------|
| Real-time kiosk feedback | Student standing at kiosk | Kiosk display (visual + audio cue) | Immediate confirmation of attendance action |
| Personal attendance history | Student (via web dashboard) | Web page, CSV export | Self-monitoring, dispute resolution |
| Class attendance summary | Faculty (via web dashboard) | Web page, CSV/PDF export | Class management, grading input |
| Department attendance report | Department Head (via web dashboard) | Web page, CSV/PDF export | Departmental oversight, room utilization |
| Program-level report | Program Coordinator (via coordinator module) | Web page, CSV/PDF export | Program-specific monitoring |
| Anomaly log | Faculty + Department Head | Web dashboard notification | Security awareness, unauthorized access detection |
| Room visualization | All roles (scoped by role) | Web dashboard (room status tiles) | Real-time room occupancy awareness |

---

## 6. What Value Does the Institution Get?

### Operational Value

| Problem | How FRAMES Addresses It | Measurable Impact |
|---------|-------------------------|-------------------|
| Proxy attendance ("buddy punching") | Face + gesture multimodal authentication | Proxy attempts require defeating two independent channels |
| Time wasted on manual roll call | Automated contactless attendance via kiosk | Instructional time recovered (estimated 5–10 min per class) |
| Attendance disputes | Timestamped, verified digital records | Evidence-based resolution instead of he-said-she-said |
| Unverified class conduct | Room visualization + attendance logs | Department Head can verify if scheduled classes actually happened |
| Delayed reporting | Real-time dashboard with auto-generated reports | Department Head sees data same-day, not weeks later |
| Room underutilization | Room occupancy tracking + analytics | Data-driven room reallocation decisions |

### Strategic Value

| Dimension | Value |
|-----------|-------|
| **Accountability** | Verifiable records hold both students and faculty accountable for attendance |
| **Transparency** | Students can verify their own records; faculty cannot misreport |
| **Data-driven management** | Department heads make decisions based on patterns, not anecdotes |
| **Scalability** | Each additional room requires only a Raspberry Pi + webcam (~₱5,000) |
| **Privacy compliance** | Embedding-only storage under RA 10173; no raw images retained |
| **Future readiness** | Room visualization infrastructure can support emergency response, facility management, and campus-wide monitoring when scaled |

### Scaled-Up Future Value (Beyond Current Pilot)

When FRAMES is deployed across multiple rooms and departments:

- **Emergency response:** Room visualization shows real-time occupancy during evacuations or drills. Administrators can identify rooms that have not been evacuated.
- **Facility management:** Underutilized rooms are identified through occupancy data, supporting efficient room scheduling.
- **Institutional analytics:** Campus-wide attendance patterns inform academic calendar planning, resource allocation, and policy evaluation.

---

## 7. Complete Business Process Flow (Summary)

```
[SETUP PHASE]
  1. Department Head registers → active immediately → registers face
  2. Faculty Member registers → pending → Department Head approves → active → registers face
  3. Faculty uploads class schedule PDF → classes + subjects created → student accounts auto-created
  4. Students open accounts → register faces via browser webcam → ready for kiosk use

[DAILY OPERATION PHASE]
  5. Early entry window opens (10 min before class start)
  6. Student approaches kiosk → face detected → face matched → ENTRY logged automatically
  7. Student needs a break → approaches kiosk → face matched → prompted for peace sign → BREAK_OUT logged
  8. Student returns → approaches kiosk → face matched → prompted for thumbs-up → BREAK_IN logged
  9. Student leaves for the day → approaches kiosk → face matched → prompted for open palm → EXIT logged
  10. Class end time reached → auto-exit closes any remaining open sessions
  11. Unknown face detected → anomaly notification → no attendance logged

[MONITORING PHASE]
  12. Students view personal attendance on dashboard
  13. Faculty views class-level attendance, generates reports
  14. Department Head views department-wide dashboard, reviews analytics
  15. Program Coordinators view program-specific data

[REPORTING PHASE]
  16. CSV/PDF exports generated on demand by faculty / department head
  17. Analytics surface patterns: late arrivals, absences, unused rooms, anomalies
  18. Actionable decisions made based on data (interventions, schedule adjustments, policy review)
```

---

## 8. Open Questions for Team Review

Before finalizing this business process, the team should decide:

1. **Program Coordinator scope:** Should coordinators see only students and faculty in their program, or also cross-program data within the department? **Recommendation:** Program-scoped only.

2. **Department Head account:** Does the department head need approval from anyone? **Recommendation:** No — self-registration with automatic activation, or pre-created by system setup.

3. **Faculty teaching across programs:** If Faculty A teaches both BSIT and BSIS classes, both program coordinators should see their class data within their respective programs. Is this acceptable? **Recommendation:** Yes — scope is per-class-program, not per-faculty-program.

4. **Student account reuse:** Confirmed — if a student already has an account from another faculty's schedule upload, no new account is created. Only a new enrollment is added. The student sees all classes they are enrolled in. **Confirmed.**

5. **Unrecognized vs. Not-Enrolled:** These are distinct anomaly types. Unrecognized = face not in the system at all. Not-Enrolled = face matches a registered user who is not in the currently scheduled class. Should both trigger kiosk notifications? **Recommendation:** Yes, with different messages.

6. **Room visualization in current pilot:** With only 1 room in the pilot, how should this be presented? **Recommendation:** Show it as a single-room view with a note that the architecture supports multi-room scaling.

---

**This document is a draft. Please review all sections and open questions before the team meeting.**
