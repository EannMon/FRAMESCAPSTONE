# 📖 FRAMES Data Dictionary
## Complete Field-Level Reference for All Database Entities

**FRAMES** — Facial Recognition Attendance and Monitoring System  
**Version:** 2.0 | **Date:** March 4, 2026  
**Database:** PostgreSQL 15 (Aiven Cloud) | **ORM:** SQLAlchemy 2.x

---

## 📖 Table of Contents

1. [Purpose](#-purpose)
2. [Conventions Used](#-conventions-used)
3. [Enum Reference](#-enum-reference)
4. [Table: departments](#-table-departments)
5. [Table: programs](#-table-programs)
6. [Table: subjects](#-table-subjects)
7. [Table: users](#-table-users)
8. [Table: facial_profiles](#-table-facial_profiles)
9. [Table: classes](#-table-classes)
10. [Table: enrollments](#-table-enrollments)
11. [Table: devices](#-table-devices)
12. [Table: attendance_logs](#-table-attendance_logs)
13. [Table: session_exceptions](#-table-session_exceptions)
14. [Table: security_logs](#-table-security_logs)
15. [Table: audit_logs](#-table-audit_logs)
16. [Table: system_metrics](#-table-system_metrics)
15. [Table: support_tickets](#-table-support_tickets)
16. [Table: user_settings](#-table-user_settings)
17. [Cross-Reference: Foreign Key Map](#-cross-reference-foreign-key-map)
18. [Cross-Reference: Enum Usage Map](#-cross-reference-enum-usage-map)
19. [Data Volume Estimates](#-data-volume-estimates)
20. [Changelog](#-changelog)

---

## 🎯 Purpose

This Data Dictionary provides a **field-by-field definition** of every column in every table of the FRAMES database. It serves as:

- A **reference for developers** when writing queries, API endpoints, or ORM models
- A **reference for testers** to understand valid/invalid data ranges
- A **documentation artifact** for the capstone defense and technical review
- A **single source of truth** synchronized with the live `updatedSchema` SQL dump and SQLAlchemy models

---

## 📐 Conventions Used

| Symbol | Meaning |
|--------|---------|
| **PK** | Primary Key — unique row identifier, auto-incrementing integer |
| **FK** | Foreign Key — references another table's PK |
| **UK** | Unique Key — value must be unique across all rows |
| **NN** | NOT NULL — value is required |
| **DEF** | Has a default value |
| `→` | "References" (FK target) |
| `serial4` | PostgreSQL auto-incrementing 4-byte integer |
| `varchar(N)` | Variable-length string, max N characters |
| `timestamp` | Date and time without timezone |
| `bytea` | Binary data (used for face embeddings) |
| `json` | JSON document storage |
| `float8` | 8-byte floating point (double precision) |
| `int4` | 4-byte integer |
| `bool` | Boolean (true/false) |
| `time` | Time of day without date |
| `date` | Calendar date without time |

---

## 🏷️ Enum Reference

All enum types used across the FRAMES database. These are PostgreSQL custom types enforced at the database level.

### `userrole`

| Value | Description | Used By |
|-------|-------------|---------|
| `STUDENT` | Regular student — attends classes, views own attendance | Students |
| `FACULTY` | Teacher/Instructor — teaches classes, uploads schedules, views class reports | Faculty |
| `HEAD` | Department Head — also a faculty member; verifies faculty, views department reports | Department Heads |
| `ADMIN` | System Administrator — manages system-wide settings, views all analytics | Admins |

### `verificationstatus`

| Value | Description | Transitions |
|-------|-------------|-------------|
| `PENDING` | Newly registered, awaiting approval | → VERIFIED or → REJECTED |
| `VERIFIED` | Account approved by HEAD or ADMIN | Terminal state (can be re-rejected) |
| `REJECTED` | Account rejected | Terminal state (can be re-verified) |

### `devicestatus`

| Value | Description |
|-------|-------------|
| `ACTIVE` | Device is operational and sending heartbeats |
| `INACTIVE` | Device is offline or decommissioned |
| `MAINTENANCE` | Device is under maintenance/repair |

### `attendanceaction`

| Value | Description | Verification Required | Gesture |
|-------|-------------|----------------------|---------|
| `ENTRY` | Student/faculty enters the classroom | Face only | None |
| `BREAK_OUT` | Leaves classroom for a break | Face + Gesture | ✌️ Peace Sign |
| `BREAK_IN` | Returns from break | Face + Gesture | 👍 Thumbs Up |
| `EXIT` | Leaves the class permanently | Face + Gesture | 🖐️ Open Palm |

### `verifiedby`

| Value | Description | When Used |
|-------|-------------|-----------|
| `FACE` | Face recognition alone | ENTRY action |
| `FACE+GESTURE` | Face recognition + hand gesture confirmation | BREAK_OUT, BREAK_IN, EXIT actions |

### `exceptiontype`

| Value | Description | Attendance Impact |
|-------|-------------|-------------------|
| `ONSITE` | Regular in-person class session | Normal attendance tracking |
| `ONLINE` | Class held remotely/online | No kiosk attendance expected |
| `CANCELLED` | Class cancelled | No attendance expected |
| `HOLIDAY` | Holiday — no classes | No attendance expected |

### `ticketstatus`

| Value | Description | Used By |
|-------|-------------|----------|
| `OPEN` | Newly submitted ticket, awaiting review | Support Tickets |
| `IN_PROGRESS` | Ticket is being addressed by admin/support | Support Tickets |
| `RESOLVED` | Issue has been resolved | Support Tickets |
| `CLOSED` | Ticket closed (resolved or declined) | Support Tickets |

### `securityeventtype`

| Value | Description | Severity |
|-------|-------------|----------|
| `UNRECOGNIZED_FACE` | Face detected but no match in embedding cache | Low |
| `GESTURE_FAILURE` | Gesture verification failed multiple times | Medium |
| `SPOOF_ATTEMPT` | Suspected photo/video spoof detected | High |
| `UNAUTHORIZED_ACCESS` | Recognized user attempted unauthorized action | High |

---

## 📋 Table: `departments`

**Category:** 🏫 Academic Structure  
**Purpose:** Stores academic departments/colleges in the university  
**ORM Model:** `backend/models/department.py` → `Department`  
**Estimated Volume:** 5–15 records (slow growth)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique department identifier | `1` | System-generated |
| 2 | `name` | `varchar(100)` | UK, NN | — | No | Full department name | `"College of Industrial Technology"` | 1–100 chars, must be unique |
| 3 | `code` | `varchar(20)` | UK | — | Yes | Abbreviated code | `"CIT"` | 1–20 chars, uppercase preferred, must be unique |
| 4 | `active_academic_year` | `varchar(20)` | — | `'2025-2026'` | Yes | Currently active academic year for this department | `"2025-2026"` | Format: YYYY-YYYY |
| 5 | `active_semester` | `varchar(50)` | — | `'2nd Semester'` | Yes | Currently active semester for this department | `"2nd Semester"` | E.g., "1st Semester", "2nd Semester", "Summer" |
| 6 | `created_at` | `timestamp` | — | `NOW()` | Yes | Record creation timestamp | `2026-01-15 08:00:00` | Auto-set on creation |

**Relationships:**
- Parent of `programs` (1:N via `programs.department_id`)
- Parent of `users` (1:N via `users.department_id`)

---

## 📋 Table: `programs`

**Category:** 🏫 Academic Structure  
**Purpose:** Stores degree programs offered within departments  
**ORM Model:** `backend/models/program.py` → `Program`  
**Estimated Volume:** 20–50 records (slow growth)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique program identifier | `1` | System-generated |
| 2 | `department_id` | `int4` | FK → `departments.id`, NN | — | No | Parent department | `1` | Must reference existing department |
| 3 | `name` | `varchar(100)` | NN | — | No | Full program name | `"Bachelor of Science in Information Technology"` | 1–100 chars |
| 4 | `code` | `varchar(20)` | — | — | Yes | Abbreviated code | `"BSIT"` | 1–20 chars, uppercase preferred |
| 5 | `created_at` | `timestamp` | — | `NOW()` | Yes | Record creation timestamp | `2026-01-15 08:00:00` | Auto-set on creation |

**Relationships:**
- Child of `departments` (N:1 via `department_id`)
- Parent of `users` (1:N via `users.program_id`)

---

## 📋 Table: `subjects`

**Category:** 🏫 Academic Structure  
**Purpose:** Stores academic subjects/courses offered  
**ORM Model:** `backend/models/subject.py` → `Subject`  
**Estimated Volume:** 50–200 records (grows per semester)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique subject identifier | `1` | System-generated |
| 2 | `code` | `varchar(50)` | UK, NN | — | No | Subject code (unique across university) | `"IT302"` | 1–50 chars, unique |
| 3 | `title` | `varchar(255)` | NN | — | No | Full subject name | `"Data Structures & Algorithms"` | 1–255 chars |
| 4 | `units` | `int4` | — | `3` | Yes | Credit units | `3` | Typically 1–6 |
| 5 | `created_at` | `timestamp` | — | `NOW()` | Yes | Record creation timestamp | `2026-01-15 08:00:00` | Auto-set on creation |

**Relationships:**
- Parent of `classes` (1:N via `classes.subject_id`)

---

## 📋 Table: `users`

**Category:** 👥 User & Identity  
**Purpose:** Central table storing ALL system users — Students, Faculty, Department Heads, and Admins  
**ORM Model:** `backend/models/user.py` → `User`  
**Estimated Volume:** 1,000–5,000 records (grows per semester)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique user identifier | `1` | System-generated |
| 2 | `email` | `varchar(255)` | UK, NN | — | No | Login email address | `"john.doe@tup.edu.ph"` | Valid email format, unique |
| 3 | `password_hash` | `varchar(255)` | NN | — | No | Bcrypt-hashed password | `"$2b$12$..."` | Bcrypt hash string, never stored as plaintext |
| 4 | `tupm_id` | `varchar(50)` | UK, NN | — | No | TUP Manila student/faculty ID | `"TUPM-21-1234"` | Format: TUPM-YY-NNNN, unique |
| 5 | `role` | `userrole` (enum) | NN | — | No | User role in the system | `"STUDENT"` | One of: STUDENT, FACULTY, HEAD, ADMIN |
| 6 | `verification_status` | `verificationstatus` (enum) | — | `PENDING` | Yes | Account approval status | `"VERIFIED"` | One of: PENDING, VERIFIED, REJECTED |
| 7 | `face_registered` | `bool` | — | `false` | Yes | Whether user completed face enrollment | `true` | Set to `true` after successful face enrollment |
| 8 | `first_name` | `varchar(100)` | NN | — | No | User's first name | `"John"` | 1–100 chars |
| 9 | `last_name` | `varchar(100)` | NN | — | No | User's last name | `"Doe"` | 1–100 chars |
| 10 | `middle_name` | `varchar(100)` | — | — | Yes | User's middle name | `"Smith"` | 0–100 chars, optional |
| 11 | `contact_number` | `varchar(20)` | — | — | Yes | Phone/mobile number | `"09171234567"` | Up to 20 chars, Philippine mobile format recommended |
| 12 | `birthday` | `timestamp` | — | — | Yes | Date of birth | `2003-05-15` | Valid date |
| 13 | `home_address` | `varchar(500)` | — | — | Yes | Residential address | `"123 Main St, Manila"` | Up to 500 chars |
| 14 | `department_id` | `int4` | FK → `departments.id` | — | Yes | Associated department | `1` | Must reference existing department (nullable for ADMIN users) |
| 15 | `program_id` | `int4` | FK → `programs.id` | — | Yes | Enrolled program | `1` | Must reference existing program (nullable for FACULTY/ADMIN) |
| 16 | `year_level` | `varchar(20)` | — | — | Yes | Student's year level | `"4th Year"` | Typically "1st Year" to "5th Year" |
| 17 | `section` | `varchar(50)` | — | — | Yes | Student's section | `"BSIT-4A"` | Format: PROGRAM-YEAR+LETTER |
| 18 | `current_term` | `varchar(50)` | — | — | Yes | Current academic term | `"1st Semester"` | Free text |
| 19 | `academic_advisor` | `varchar(100)` | — | — | Yes | Assigned academic advisor | `"Dr. Santos"` | Free text |
| 20 | `gpa` | `varchar(10)` | — | — | Yes | Grade point average | `"1.75"` | Stored as string for flexibility |
| 21 | `emergency_contact_name` | `varchar(100)` | — | — | Yes | Emergency contact person | `"Maria Doe"` | Full name of emergency contact |
| 22 | `emergency_contact_relationship` | `varchar(50)` | — | — | Yes | Relationship to user | `"Mother"` | E.g., Mother, Father, Guardian, Spouse |
| 23 | `emergency_contact_phone` | `varchar(20)` | — | — | Yes | Emergency contact number | `"09181234567"` | Phone number format |
| 24 | `emergency_contact_address` | `varchar(255)` | — | — | Yes | Emergency contact address | `"456 Oak Ave, Manila"` | Free text |
| 25 | `created_at` | `timestamp` | — | `NOW()` | Yes | Account creation timestamp | `2026-01-15 08:00:00` | Auto-set on creation |
| 26 | `last_active` | `timestamp` | — | `NOW()` | Yes | Last activity timestamp | `2026-02-02 10:30:00` | Auto-updated on activity |

**Column Groups:**
- **Authentication** (2–4): Credentials and school ID
- **Role & Status** (5–7): System role and verification state
- **Personal Info** (8–13): Name, contact, address
- **Academic Info** (14–20): Department, program, section, GPA
- **Emergency Contact** (21–24): Emergency contact details
- **Timestamps** (25–26): Creation and activity tracking

**Relationships:**
- Child of `departments` (N:1 via `department_id`)
- Child of `programs` (N:1 via `program_id`)
- Parent of `facial_profiles` (1:1 via `facial_profiles.user_id`, CASCADE DELETE)
- Parent of `enrollments` (1:N via `enrollments.student_id`, CASCADE DELETE)
- Parent of `classes` as faculty (1:N via `classes.faculty_id`)
- Parent of `attendance_logs` (1:N via `attendance_logs.user_id`, CASCADE DELETE)
- Parent of `audit_logs` (1:N via `audit_logs.user_id`)
- Parent of `session_exceptions` as creator (1:N via `session_exceptions.created_by`)
- Parent of `support_tickets` (1:N via `support_tickets.user_id`)
- Parent of `user_settings` (1:1 via `user_settings.user_id`)

---

## 📋 Table: `facial_profiles`

**Category:** 👥 User & Identity  
**Purpose:** Stores face recognition embedding vectors separately from user data for efficient AI queries and model versioning  
**ORM Model:** `backend/models/facial_profile.py` → `FacialProfile`  
**Estimated Volume:** 1:1 with users who complete face enrollment

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique profile identifier | `1` | System-generated |
| 2 | `user_id` | `int4` | FK → `users.id`, UK, NN, ON DELETE CASCADE | — | No | Associated user (one-to-one) | `1` | Must reference existing user, unique per user |
| 3 | `embedding` | `bytea` | — | — | Yes | 512-dimensional face embedding vector | Binary data (~2048 bytes) | InsightFace buffalo_l output, normalized float32 array |
| 4 | `model_version` | `varchar(50)` | — | `'insightface_buffalo_l_v1'` | Yes | AI model version used for embedding | `"insightface_buffalo_l_v1"` | Used for model upgrade tracking |
| 5 | `num_samples` | `int4` | — | `0` | Yes | Number of frames used during enrollment | `5` | Minimum 5 recommended for quality |
| 6 | `enrollment_quality` | `float8` | — | `0.0` | Yes | Average quality score (0.0 – 1.0) | `0.95` | Higher = better enrollment quality |
| 7 | `created_at` | `timestamp` | — | `NOW()` | Yes | First enrollment timestamp | `2026-01-15 08:00:00` | Auto-set |
| 8 | `updated_at` | `timestamp` | — | `NOW()` | Yes | Last re-enrollment timestamp | `2026-02-01 14:00:00` | Auto-updated when embedding changes |

> **Privacy Note:** Only the 512-dimensional embedding vector (~2KB binary) is stored. **No raw face images are saved.** This ensures compliance with the Philippine Data Privacy Act of 2012 (RA 10173) and GDPR principles.

**Relationships:**
- Child of `users` (1:1 via `user_id`, CASCADE DELETE — removing user removes their face data)

---

## 📋 Table: `classes`

**Category:** 📅 Class Scheduling  
**Purpose:** Represents a scheduled class session — a combination of subject, faculty, time slot, and room  
**ORM Model:** `backend/models/class_.py` → `Class`  
**Estimated Volume:** 50–200 per semester

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique class identifier | `1` | System-generated |
| 2 | `subject_id` | `int4` | FK → `subjects.id`, NN | — | No | Subject being taught | `1` | Must reference existing subject |
| 3 | `faculty_id` | `int4` | FK → `users.id`, NN | — | No | Faculty member teaching | `5` | Must reference user with FACULTY or HEAD role |
| 4 | `room` | `varchar(100)` | — | — | Yes | Classroom/laboratory name | `"CL1"` | Must match a room registered in `devices` table for kiosk matching |
| 5 | `day_of_week` | `varchar(20)` | — | — | Yes | Day of the week | `"Monday"` | One of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday |
| 6 | `start_time` | `time` | — | — | Yes | Class start time | `08:00:00` | Time format HH:MM:SS |
| 7 | `end_time` | `time` | — | — | Yes | Class end time | `10:00:00` | Must be after start_time |
| 8 | `section` | `varchar(50)` | — | — | Yes | Section name | `"BSIT-4A"` | Format: PROGRAM-YEAR+LETTER |
| 9 | `semester` | `varchar(50)` | — | — | Yes | Academic semester | `"1st Semester"` | E.g., "1st Semester", "2nd Semester", "Summer" |
| 10 | `academic_year` | `varchar(20)` | — | — | Yes | Academic year | `"2025-2026"` | Format: YYYY-YYYY |
| 11 | `late_threshold_minutes` | `int4` | — | `15` | Yes | Minutes after start_time before ENTRY is marked late | `15` | Range: 1–120; configurable per class by faculty |
| 12 | `created_at` | `timestamp` | — | `NOW()` | Yes | Record creation timestamp | `2026-01-15 08:00:00` | Auto-set |

**Business Logic:**
- A class is identified uniquely by the combination of `subject_id` + `section` + `day_of_week` + `semester` + `academic_year`
- The `late_threshold_minutes` value is used by the kiosk to determine if an ENTRY should be flagged as late
- The `room` value must match a `devices.room` value for the kiosk to resolve which class is active

**Relationships:**
- Child of `subjects` (N:1 via `subject_id`)
- Child of `users` as faculty (N:1 via `faculty_id`)
- Parent of `enrollments` (1:N via `enrollments.class_id`, CASCADE DELETE)
- Parent of `attendance_logs` (1:N via `attendance_logs.class_id`)
- Parent of `session_exceptions` (1:N via `session_exceptions.class_id`)

---

## 📋 Table: `enrollments`

**Category:** 📅 Class Scheduling  
**Purpose:** Junction/bridge table linking students to their enrolled classes (resolves many-to-many relationship)  
**ORM Model:** `backend/models/enrollment.py` → `Enrollment`  
**Estimated Volume:** 20–30 per student per semester

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique enrollment identifier | `1` | System-generated |
| 2 | `class_id` | `int4` | FK → `classes.id`, NN, ON DELETE CASCADE | — | No | Enrolled class | `1` | Must reference existing class |
| 3 | `student_id` | `int4` | FK → `users.id`, NN, ON DELETE CASCADE | — | No | Enrolled student | `10` | Must reference existing user with STUDENT role |
| 4 | `enrolled_at` | `timestamp` | — | `NOW()` | Yes | Enrollment timestamp | `2026-01-20 09:00:00` | Auto-set |

**Unique Constraint:** `unique_enrollment` on `(class_id, student_id)` — each student can only enroll once per class.

**Relationships:**
- Child of `classes` (N:1 via `class_id`, CASCADE — if class deleted, enrollment removed)
- Child of `users` (N:1 via `student_id`, CASCADE — if student deleted, enrollment removed)

---

## 📋 Table: `devices`

**Category:** ✅ Attendance Tracking  
**Purpose:** Stores Raspberry Pi kiosk devices deployed in classrooms for attendance capture  
**ORM Model:** `backend/models/device.py` → `Device`  
**Estimated Volume:** 5–20 devices (slow growth, hardware-dependent)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique device identifier | `1` | System-generated |
| 2 | `room` | `varchar(100)` | — | — | Yes | Room where device is deployed | `"CL1"` | Must match `classes.room` for schedule resolution |
| 3 | `ip_address` | `varchar(45)` | — | — | Yes | Device network address (IPv4 or IPv6) | `"192.168.1.100"` | Valid IP format |
| 4 | `device_name` | `varchar(100)` | — | — | Yes | Human-readable device identifier | `"KIOSK-CL1"` | Free text, unique recommended |
| 5 | `status` | `devicestatus` (enum) | — | `ACTIVE` | Yes | Current operational status | `"ACTIVE"` | One of: ACTIVE, INACTIVE, MAINTENANCE |
| 6 | `room_capacity` | `int4` | — | `40` | Yes | Maximum room occupancy for overcrowding alerts | `40` | Positive integer |
| 7 | `created_at` | `timestamp` | — | `NOW()` | Yes | Device registration timestamp | `2026-01-15 08:00:00` | Auto-set |
| 8 | `last_heartbeat` | `timestamp` | — | — | Yes | Last time device sent a heartbeat | `2026-02-02 17:55:00` | Updated by periodic kiosk heartbeat pings |

**Relationships:**
- Parent of `attendance_logs` (1:N via `attendance_logs.device_id`)
- Parent of `security_logs` (1:N via `security_logs.device_id`)
- Parent of `system_metrics` (1:N via `system_metrics.device_id`)

---

## 📋 Table: `attendance_logs`

**Category:** ✅ Attendance Tracking  
**Purpose:** Core table storing all attendance records with face/gesture verification metadata — the highest-volume table in FRAMES  
**ORM Model:** `backend/models/attendance_log.py` → `AttendanceLog`  
**Estimated Volume:** 100–500 per student per semester (highest write volume)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique log identifier | `1` | System-generated |
| 2 | `user_id` | `int4` | FK → `users.id`, NN | — | No | User whose attendance is logged | `10` | Must reference existing user |
| 3 | `class_id` | `int4` | FK → `classes.id` | — | Yes | Associated class session | `1` | Must reference existing class (nullable for edge cases) |
| 4 | `device_id` | `int4` | FK → `devices.id` | — | Yes | Kiosk device that captured the record | `1` | Must reference existing device (nullable if logged manually) |
| 5 | `action` | `attendanceaction` (enum) | NN | — | No | Type of attendance event | `"ENTRY"` | One of: ENTRY, BREAK_OUT, BREAK_IN, EXIT |
| 6 | `verified_by` | `verifiedby` (enum) | — | — | Yes | How identity was verified | `"FACE"` | One of: FACE, FACE+GESTURE |
| 7 | `is_late` | `bool` | — | `false` | Yes | Whether this ENTRY was after the late threshold | `true` | Computed by kiosk API: `timestamp > start_time + late_threshold_minutes` |
| 8 | `confidence_score` | `float8` | — | — | Yes | Face recognition confidence (0.0 – 1.0) | `0.92` | Cosine similarity from InsightFace; threshold ≥ 0.35 |
| 9 | `gesture_detected` | `varchar(50)` | — | — | Yes | Hand gesture detected (if any) | `"PEACE_SIGN"` | One of: PEACE_SIGN, THUMBS_UP, OPEN_PALM, or null |
| 10 | `timestamp` | `timestamp` | — | `NOW()` | Yes | When the event occurred | `2026-02-02 08:02:15` | Kiosk local time |
| 11 | `remarks` | `varchar(255)` | — | — | Yes | Optional notes or system annotations | `"Late entry - traffic"` | May contain system tags: `[LATE by N min]`, `[NOT_IN_CLASS]` |

**Attendance State Machine:**
```
No logs → ENTRY (face only)
After ENTRY → BREAK_OUT (face + gesture: ✌️) or EXIT (face + gesture: 🖐️)
After BREAK_OUT → BREAK_IN (face + gesture: 👍)
After EXIT → ENTRY again (new cycle within same day)
```

**Late Calculation Logic:**
- `is_late = true` when: `timestamp > class.start_time + class.late_threshold_minutes`
- Remarks auto-annotated with `[LATE by N min]`

**Relationships:**
- Child of `users` (N:1 via `user_id`)
- Child of `classes` (N:1 via `class_id`)
- Child of `devices` (N:1 via `device_id`)

---

## 📋 Table: `session_exceptions`

**Category:** 📅 Class Scheduling  
**Purpose:** Tracks exceptions to normal class sessions — cancellations, online mode, holidays — used for accurate attendance reporting  
**ORM Model:** `backend/models/session_exception.py` → `SessionException`  
**Estimated Volume:** 5–20 per class per semester

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique exception identifier | `1` | System-generated |
| 2 | `class_id` | `int4` | FK → `classes.id`, NN | — | No | Affected class | `5` | Must reference existing class |
| 3 | `session_date` | `date` | NN | — | No | Specific date when exception applies | `2026-02-14` | Valid calendar date |
| 4 | `exception_type` | `exceptiontype` (enum) | — | — | Yes | Type of exception | `"ONLINE"` | One of: ONSITE, ONLINE, CANCELLED, HOLIDAY |
| 5 | `reason` | `varchar(255)` | — | — | Yes | Reason for the exception | `"Natural Disaster"` | Predefined options: Health Related, Natural Disaster, Internet Connectivity, Holiday, Faculty Leave, University Event, Others |
| 6 | `created_by` | `int4` | FK → `users.id` | — | Yes | Faculty/HEAD who created the exception | `3` | Must reference user with FACULTY or HEAD role |
| 7 | `created_at` | `timestamp` | — | `NOW()` | Yes | Record creation timestamp | `2026-02-07 15:00:00` | Auto-set |

**Relationships:**
- Child of `classes` (N:1 via `class_id`)
- Child of `users` as creator (N:1 via `created_by`)

---

## 📋 Table: `security_logs`

**Category:** 🔒 Security & Monitoring  
**Purpose:** Records security events from kiosk devices — unrecognized faces, gesture failures, spoof attempts  
**ORM Model:** `backend/models/security_log.py` → `SecurityLog`  
**Estimated Volume:** Variable (depends on security events)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique log identifier | `1` | System-generated |
| 2 | `device_id` | `int4` | FK → `devices.id` | — | Yes | Device that detected the event | `1` | Must reference existing device |
| 3 | `event_type` | `securityeventtype` (enum) | NN | — | No | Type of security event | `"UNRECOGNIZED_FACE"` | One of: UNRECOGNIZED_FACE, GESTURE_FAILURE, SPOOF_ATTEMPT, UNAUTHORIZED_ACCESS |
| 4 | `embedding_data` | `bytea` | — | — | Yes | Captured face embedding for later analysis | Binary data | 512-d vector of unrecognized face |
| 5 | `confidence_score` | `float8` | — | — | Yes | Highest partial match confidence | `0.28` | Cosine similarity (below match threshold) |
| 6 | `room` | `varchar(100)` | — | — | Yes | Room where event occurred | `"CL1"` | Device room at time of event |
| 7 | `details` | `varchar(500)` | — | — | Yes | Additional context/description | `"3 failed gesture attempts"` | Free text |
| 8 | `timestamp` | `timestamp` | — | `NOW()` | Yes | Event timestamp | `2026-02-02 09:15:00` | Auto-set |

**Relationships:**
- Child of `devices` (N:1 via `device_id`)

---

## 📋 Table: `audit_logs`

**Category:** 🔒 Security & Monitoring  
**Purpose:** Tracks all administrative and significant user actions for accountability and audit trail  
**ORM Model:** `backend/models/audit_log.py` → `AuditLog`  
**Estimated Volume:** Grows with system usage

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique audit identifier | `1` | System-generated |
| 2 | `user_id` | `int4` | FK → `users.id` | — | Yes | User who performed the action | `3` | Nullable for system-initiated actions |
| 3 | `action_type` | `varchar(50)` | NN | — | No | Type of action performed | `"USER_CREATE"` | See Audit Action Types below |
| 4 | `target_table` | `varchar(50)` | — | — | Yes | Database table affected | `"users"` | Valid table name |
| 5 | `target_id` | `int4` | — | — | Yes | Record ID that was affected | `15` | ID of the modified record |
| 6 | `old_value` | `json` | — | — | Yes | Previous state (before change) | `{"status": "PENDING"}` | JSON snapshot of changed fields |
| 7 | `new_value` | `json` | — | — | Yes | New state (after change) | `{"status": "VERIFIED"}` | JSON snapshot of changed fields |
| 8 | `ip_address` | `varchar(45)` | — | — | Yes | IP address of the request | `"192.168.1.50"` | IPv4 or IPv6 |
| 9 | `user_agent` | `varchar(255)` | — | — | Yes | Browser/client user agent string | `"Mozilla/5.0..."` | HTTP User-Agent header |
| 10 | `timestamp` | `timestamp` | — | `NOW()` | Yes | When the action occurred | `2026-02-02 10:00:00` | Auto-set |

**Predefined Audit Action Types:**

| Action Type | Description |
|-------------|-------------|
| `USER_CREATE` | New user account created |
| `USER_UPDATE` | User profile updated |
| `USER_DELETE` | User account deleted |
| `USER_VERIFY` | User verification status changed to VERIFIED |
| `USER_REJECT` | User verification status changed to REJECTED |
| `FACE_ENROLL` | Face embedding enrolled for first time |
| `FACE_UPDATE` | Face embedding re-enrolled/updated |
| `SCHEDULE_UPLOAD` | PDF schedule file uploaded and parsed |
| `CLASS_CREATE` | New class created |
| `CLASS_UPDATE` | Class details updated |
| `CLASS_DELETE` | Class deleted |
| `SESSION_EXCEPTION_CREATE` | Session exception (cancel/online) created |
| `DEVICE_CREATE` | New kiosk device registered |
| `DEVICE_UPDATE` | Device configuration updated |
| `DEVICE_DELETE` | Device decommissioned |
| `EXPORT_ATTENDANCE` | Attendance data exported |
| `EXPORT_REPORT` | Report generated and downloaded |
| `LOGIN_SUCCESS` | Successful login |
| `LOGIN_FAILED` | Failed login attempt |
| `LOGOUT` | User logged out |

**Relationships:**
- Child of `users` (N:1 via `user_id`)

---

## 📋 Table: `system_metrics`

**Category:** 🔒 Security & Monitoring  
**Purpose:** Stores system performance metrics from kiosk devices for health monitoring and diagnostics  
**ORM Model:** `backend/models/system_metric.py` → `SystemMetric`  
**Estimated Volume:** High (time-series data, periodic reporting)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique metric identifier | `1` | System-generated |
| 2 | `device_id` | `int4` | FK → `devices.id` | — | Yes | Device reporting the metric | `1` | Must reference existing device |
| 3 | `metric_type` | `varchar(50)` | NN | — | No | Type of metric being reported | `"RECOGNITION_LATENCY"` | See Metric Types below |
| 4 | `value` | `float8` | NN | — | No | Numeric metric value | `150.5` | Positive number |
| 5 | `unit` | `varchar(20)` | — | — | Yes | Unit of measurement | `"ms"` | E.g., ms, percent, count, bytes |
| 6 | `timestamp` | `timestamp` | — | `NOW()` | Yes | When the metric was recorded | `2026-02-02 10:00:00` | Auto-set |

**Predefined Metric Types:**

| Category | Metric Type | Unit | Description |
|----------|-------------|------|-------------|
| Recognition | `RECOGNITION_LATENCY` | ms | Time to process face recognition |
| Recognition | `RECOGNITION_SUCCESS` | count | Successful face matches |
| Recognition | `RECOGNITION_FAILURE` | count | Failed face matches |
| Recognition | `RECOGNITION_ACCURACY` | percent | Overall accuracy rate |
| System | `UPTIME` | seconds | Device uptime |
| System | `CPU_USAGE` | percent | CPU utilization |
| System | `MEMORY_USAGE` | percent | RAM utilization |
| System | `DISK_USAGE` | percent | Disk space used |
| Network | `NETWORK_LATENCY` | ms | API round-trip time |
| Network | `SYNC_SUCCESS` | count | Successful data syncs |
| Network | `SYNC_FAILURE` | count | Failed data syncs |
| Gesture | `GESTURE_LATENCY` | ms | Time to detect gesture |
| Gesture | `GESTURE_SUCCESS` | count | Successful gesture detections |
| Gesture | `GESTURE_FAILURE` | count | Failed gesture detections |

**Relationships:**
- Child of `devices` (N:1 via `device_id`)

---

## � Table: `support_tickets`

**Category:** 🔧 Support & Settings  
**Purpose:** Stores user-submitted support tickets for issue tracking and help requests  
**ORM Model:** `backend/models/support_ticket.py` → `SupportTicket`  
**Estimated Volume:** 50–500 records (event-driven)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique ticket identifier | `1` | System-generated |
| 2 | `user_id` | `int4` | FK → `users.id`, NN, IDX | — | No | User who submitted the ticket | `10` | Must reference existing user |
| 3 | `subject` | `varchar(200)` | NN | — | No | Ticket subject/title | `"Cannot access schedule page"` | 1–200 chars |
| 4 | `message` | `text` | NN | — | No | Full description of the issue | `"When I click on Schedule..."` | Free text, no max length |
| 5 | `status` | `ticketstatus` (enum) | — | `'OPEN'` | Yes | Current ticket status | `"OPEN"` | One of: OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| 6 | `created_at` | `timestamp` | — | `NOW()` | Yes | Ticket submission timestamp | `2026-03-01 14:30:00` | Auto-set on creation |

**Indexes:**
- `ix_support_tickets_user_id` on `user_id` — fast lookup of tickets by user

**Relationships:**
- Child of `users` (N:1 via `user_id`)

---

## 📋 Table: `user_settings`

**Category:** 🔧 Support & Settings  
**Purpose:** Stores per-user preference settings for notifications, theme, and language  
**ORM Model:** `backend/models/user_settings.py` → `UserSettings`  
**Estimated Volume:** 1:1 with users (created on first settings update)

| # | Column | PostgreSQL Type | Constraints | Default | Nullable | Description | Example Value | Validation Rules |
|---|--------|----------------|-------------|---------|----------|-------------|---------------|------------------|
| 1 | `id` | `serial4` | PK | Auto-increment | No | Unique settings identifier | `1` | System-generated |
| 2 | `user_id` | `int4` | FK → `users.id`, UK, NN | — | No | Associated user (one-to-one) | `10` | Must reference existing user, unique per user |
| 3 | `email_notifications` | `bool` | — | `true` | Yes | Whether to receive email notifications | `true` | Boolean |
| 4 | `sms_notifications` | `bool` | — | `false` | Yes | Whether to receive SMS notifications | `false` | Boolean |
| 5 | `push_notifications` | `bool` | — | `true` | Yes | Whether to receive push notifications | `true` | Boolean |
| 6 | `theme` | `varchar(20)` | — | `'light'` | Yes | UI theme preference | `"dark"` | E.g., "light", "dark" |
| 7 | `language` | `varchar(10)` | — | `'en'` | Yes | Preferred language code | `"en"` | ISO 639-1 code (e.g., "en", "fil") |

**Indexes:**
- `ix_user_settings_user_id` (unique) on `user_id` — enforces one settings record per user

**Relationships:**
- Child of `users` (1:1 via `user_id`)

---

## �🔗 Cross-Reference: Foreign Key Map

Complete mapping of all foreign key relationships in the FRAMES database.

| # | Child Table | FK Column | Parent Table | Parent Column | ON DELETE | Index Required |
|---|-------------|-----------|--------------|---------------|-----------|----------------|
| 1 | `programs` | `department_id` | `departments` | `id` | NO ACTION | Yes |
| 2 | `users` | `department_id` | `departments` | `id` | NO ACTION | Yes |
| 3 | `users` | `program_id` | `programs` | `id` | NO ACTION | Yes |
| 4 | `facial_profiles` | `user_id` | `users` | `id` | CASCADE | Yes (+ UK) |
| 5 | `classes` | `subject_id` | `subjects` | `id` | NO ACTION | Yes |
| 6 | `classes` | `faculty_id` | `users` | `id` | NO ACTION | Yes |
| 7 | `enrollments` | `class_id` | `classes` | `id` | CASCADE | Yes |
| 8 | `enrollments` | `student_id` | `users` | `id` | CASCADE | Yes |
| 9 | `attendance_logs` | `user_id` | `users` | `id` | NO ACTION | Yes |
| 10 | `attendance_logs` | `class_id` | `classes` | `id` | NO ACTION | Yes |
| 11 | `attendance_logs` | `device_id` | `devices` | `id` | NO ACTION | Yes |
| 12 | `session_exceptions` | `class_id` | `classes` | `id` | NO ACTION | Yes |
| 13 | `session_exceptions` | `created_by` | `users` | `id` | NO ACTION | Yes |
| 14 | `security_logs` | `device_id` | `devices` | `id` | NO ACTION | Yes |
| 15 | `audit_logs` | `user_id` | `users` | `id` | NO ACTION | Yes |
| 16 | `system_metrics` | `device_id` | `devices` | `id` | NO ACTION | Yes |
| 17 | `support_tickets` | `user_id` | `users` | `id` | NO ACTION | Yes |
| 18 | `user_settings` | `user_id` | `users` | `id` | NO ACTION | Yes (+ UK) |

---

## 🏷️ Cross-Reference: Enum Usage Map

| Enum Type | Used In Table | Used In Column | Possible Values |
|-----------|---------------|----------------|-----------------|
| `userrole` | `users` | `role` | STUDENT, FACULTY, HEAD, ADMIN |
| `verificationstatus` | `users` | `verification_status` | PENDING, VERIFIED, REJECTED |
| `devicestatus` | `devices` | `status` | ACTIVE, INACTIVE, MAINTENANCE |
| `attendanceaction` | `attendance_logs` | `action` | ENTRY, BREAK_OUT, BREAK_IN, EXIT |
| `verifiedby` | `attendance_logs` | `verified_by` | FACE, FACE+GESTURE |
| `exceptiontype` | `session_exceptions` | `exception_type` | ONSITE, ONLINE, CANCELLED, HOLIDAY |
| `securityeventtype` | `security_logs` | `event_type` | UNRECOGNIZED_FACE, GESTURE_FAILURE, SPOOF_ATTEMPT, UNAUTHORIZED_ACCESS |
| `ticketstatus` | `support_tickets` | `status` | OPEN, IN_PROGRESS, RESOLVED, CLOSED |

---

## 📊 Data Volume Estimates

| Entity | Expected Records | Growth Rate | Storage per Record | Notes |
|--------|-----------------|-------------|-------------------|-------|
| `departments` | 5–15 | Very slow | ~150 bytes | Static reference data |
| `programs` | 20–50 | Slow | ~150 bytes | Static reference data |
| `subjects` | 50–200 | Per semester | ~300 bytes | Grows with curriculum |
| `users` | 1,000–5,000 | Per semester | ~1.5 KB | Students + faculty + admin |
| `facial_profiles` | 1:1 with users | Same as users | ~2.2 KB | Dominated by 2KB embedding |
| `classes` | 50–200 per semester | Per semester | ~200 bytes | One per subject+section+day |
| `enrollments` | 20–30 per student | Per semester | ~50 bytes | Junction table, small rows |
| `devices` | 5–20 | Very slow | ~200 bytes | Hardware-limited |
| `attendance_logs` | 100–500 per student/semester | **Highest** | ~200 bytes | Most frequently written table |
| `session_exceptions` | 5–20 per class/semester | Moderate | ~150 bytes | Event-driven |
| `security_logs` | Variable | Event-driven | ~2.2 KB | Includes embedding when available |
| `audit_logs` | Grows with usage | Moderate | ~500 bytes | JSON values increase size |
| `system_metrics` | High (time-series) | Continuous | ~100 bytes | May need retention policy |
| `support_tickets` | 50–500 | Event-driven | ~500 bytes | Grows with user issues |
| `user_settings` | 1:1 with users | Same as users | ~100 bytes | One per user, small rows |

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-08 | 0.1 | Initial data dictionary draft |
| 2026-02-23 | 1.0 | Full field-level documentation for all 13 tables; aligned with `updatedSchema` SQL dump; added new `users` columns (contact_number, birthday, home_address, emergency contacts, current_term, academic_advisor, gpa); added `classes.late_threshold_minutes`; added `attendance_logs.is_late`; added `devices.room_capacity`; updated `verificationstatus` enum values to UPPERCASE |
| 2026-03-04 | 2.0 | Added 2 new tables: `support_tickets` (help desk tickets with ticketstatus enum), `user_settings` (per-user preferences for notifications/theme/language); added `ticketstatus` enum (OPEN, IN_PROGRESS, RESOLVED, CLOSED); added `departments.active_academic_year` (varchar(20), default '2025-2026'), `departments.active_semester` (varchar(50), default '2nd Semester'); updated FK map (18 relationships total), enum usage map, and data volume estimates; total tables now 15 |

---

**Document verified against:**
- DDL export (March 4, 2026)
- SQLAlchemy models in `backend/models/`
- Live PostgreSQL schema on Aiven
