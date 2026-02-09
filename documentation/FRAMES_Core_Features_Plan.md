# 📋 FRAMES Core Features Implementation Plan

This plan details the implementation of **Student, Faculty, Department Head, and Admin** modules, focusing on comprehensive reporting and analytics.
For Gesture/Face Recognition tasks, see [FRAMES_Recognition_Pipeline_Plan.md](FRAMES_Recognition_Pipeline_Plan.md).

---

## 🎓 Module 1: Student Reports

### Easy Tasks (1-3 days)

#### 1. Personal Attendance Records
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Implement Daily, Weekly, and Monthly views of student attendance.
    - **Daily:** Tracks presence, lateness, and breaks per session.
    - **Weekly:** Summary of present/absent/late counts.
    - **Monthly:** Trend verification.
- **Files:** `frontend/src/pages/student/AttendanceDashboard.tsx`, `backend/routers/student_reports.py`
- **Dependencies:** `attendance_logs`
- **Blockers:** None

#### 2. Semestral Summaries
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Cumulative reports per subject and overall semester engagement.
- **Files:** `frontend/src/pages/student/SemestralReport.tsx`, `backend/services/semester_service.py`
- **Dependencies:** `classes`, `subjects`
- **Blockers:** None

### Medium Tasks (3-5 days)

#### 3. Student Behavioral Logs
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** 
    - **History Log:** 30-day recent timestamp view.
    - **Late Arrival:** Frequency/duration of lateness.
    - **Break Duration:** Total break time logging.
- **Files:** `frontend/src/components/BehavioralLog.tsx`, `backend/services/behavior_service.py`
- **Dependencies:** `is_late` column
- **Blockers:** None

#### 4. Personal Consistency Index (AI)
- **Difficulty:** Hard
- **Status:** ⬜ TODO
- **Description:** AI-generated metric predicting absence trends based on regularity.
- **Files:** `backend/ml/consistency_model.py`, `frontend/src/components/ConsistencyScore.tsx`
- **Dependencies:** Historical attendance data
- **Blockers:** Data availability

---

## 👨‍🏫 Module 2: Faculty Reports

### Easy Tasks (1-3 days)

#### 5. Class & Personal Attendance
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Faculty's own attendance (Daily/Weekly/Monthly/Semestral) + Class-specific daily attendance.
- **Files:** `frontend/src/pages/faculty/MyAttendance.tsx`, `frontend/src/pages/faculty/ClassView.tsx`
- **Dependencies:** `users.role = 'FACULTY'`
- **Blockers:** None

#### 6. Section Absence Summary
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Quantify absences per section for grading.
- **Files:** `frontend/src/components/AbsenceSummary.tsx`
- **Dependencies:** `enrollments`
- **Blockers:** None

### Medium Tasks (3-5 days)

#### 7. Anomaly & Security Logs
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:**
    - **Unrecognized Logs:** List unknown individuals detected in class.
    - **Break Abuse:** Students exceeding break limits/not returning.
    - **Missed Log vs Break:** Students in break logs but no attendance entry.
- **Files:** `backend/routers/security_alerts.py`, `frontend/src/pages/faculty/SecurityAlerts.tsx`
- **Dependencies:** `security_logs` (for unrecognizable), `attendance_logs`
- **Blockers:** Security Table

#### 8. Punctuality & Early Exit
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** 
    - **Punctuality Index:** Rank students by arrival time vs start time.
    - **Early Exit:** Identify students leaving before class end.
    - **Late Arrival:** Monitor frequency/duration.
- **Files:** `backend/services/punctuality_service.py`
- **Dependencies:** `classes.start_time`, `classes.end_time`
- **Blockers:** None

#### 9. Class Participation Consistency (AI)
- **Difficulty:** Hard
- **Status:** ⬜ TODO
- **Description:** AI-computed stability index for class engagement trends.
- **Files:** `backend/ml/engagement_model.py`
- **Dependencies:** Task #4 setup
- **Blockers:** None

---

## 🏢 Module 3: Department Head (Extended Faculty)

### Medium Tasks (3-5 days)

#### 10. Faculty Monitoring
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** 
    - **Attendance Summary:** Aggregate for all dept faculty.
    - **Late Arrival:** Identify recurring faculty delays.
    - **Consistency Index:** Reliability trends across semesters.
- **Files:** `frontend/src/pages/head/FacultyOverview.tsx`, `backend/routers/head_reports.py`
- **Dependencies:** `users.department_id`
- **Blockers:** None

#### 11. Room & Resource Utilization
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:**
    - **Occupancy Trends:** Occupants per room over time.
    - **Peak Usage:** Busiest hours optimization.
    - **Utilization vs Schedule:** Actual vs Scheduled comparison.
    - **Overcrowding:** Rooms exceeding capacity.
- **Files:** `frontend/src/pages/head/ResourcePlanning.tsx`, `backend/services/occupancy_service.py`
- **Dependencies:** `devices.room_capacity`
- **Blockers:** None

#### 12. Department Activity Summary
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** Cross-faculty/course analytics for meetings.
- **Files:** `frontend/src/components/DeptActivityChart.tsx`
- **Dependencies:** All previous aggregations
- **Blockers:** None

---

## 🛡️ Module 4: Admin

### Medium Tasks (3-5 days)

#### 13. Wide-Attendance & Facility Reports
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** 
    - System-wide Attendance/Late/Early/Break/Missed summaries.
    - Room Occupancy/Utilization/Overcrowding/Empty-but-Scheduled.
- **Files:** `frontend/src/pages/admin/SystemOverview.tsx`, `backend/routers/admin_reports.py`
- **Dependencies:** All module data
- **Blockers:** None

#### 14. Security & Access Control
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:**
    - **Recognized & Unrecognized Logs:** Traceability.
    - **Unauthorized Access:** Non-registered entry attempts.
    - **Spoof Detection:** Mismatched recognition attempts.
    - **Breach Patterns:** Suspicious frequency by location/time.
- **Files:** `frontend/src/pages/admin/SecurityDashboard.tsx`
- **Dependencies:** `security_logs`
- **Blockers:** None

#### 15. System Health & Performance
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:**
    - **Gesture Usage:** Frequency analysis.
    - **Unrecognized Gesture:** Misuse detection.
    - **System Error/Trend:** Error rates per room/lighting.
    - **System Activity Audit:** Log of admin actions.
    - **Performance Insight (AI):** Uptime/latency/accuracy trends.
- **Files:** `frontend/src/pages/admin/SystemHealth.tsx`, `backend/routers/system_health.py`
- **Dependencies:** `system_metrics`, `audit_logs`
- **Blockers:** None
