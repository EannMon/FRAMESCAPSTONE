# Entity-Relationship Diagram — FRAMES Database

## Overview

FRAMES uses PostgreSQL hosted on Aiven Cloud (SSL-encrypted) as its primary relational database. The schema supports user management, facial biometric storage (embeddings only), class scheduling, and attendance logging.

---

## Entity Relationship Diagram (Text Representation)

```
┌──────────────────┐        ┌──────────────────┐         ┌──────────────────┐
│   departments    │        │    programs       │         │    subjects      │
├──────────────────┤        ├──────────────────┤         ├──────────────────┤
│ PK: id           │───────<│ PK: id           │         │ PK: id           │
│ name             │ 1    M │ name             │         │ code             │
│ code             │        │ code             │         │ title            │
└────────┬─────────┘        │ FK: department_id│         │ units            │
         │                  └──────────────────┘         └────────┬─────────┘
         │ 1                                                      │ 1
         │                                                        │
         │ M                                                      │ M
┌────────┴─────────┐                                    ┌─────────┴────────┐
│     users        │                                    │    classes       │
├──────────────────┤                                    ├──────────────────┤
│ PK: id           │                                    │ PK: id           │
│ email            │                                    │ FK: subject_id   │
│ password_hash    │                                    │ FK: faculty_id   │──→ users
│ first_name       │                                    │ section_name     │
│ last_name        │                                    │ room             │
│ role (ENUM)      │                                    │ day_of_week      │
│   STUDENT        │                                    │ start_time       │
│   FACULTY        │                                    │ end_time          │
│   HEAD           │                                    │ semester          │
│ student_number   │                                    │ academic_year    │
│ face_registered  │                                    └────────┬─────────┘
│ is_verified      │                                             │ 1
│ FK: department_id│                                             │
└──┬────┬──────────┘                                             │
   │    │                                                        │ M
   │    │ 1                                                      │
   │    │                                               ┌────────┴─────────┐
   │    │           ┌──────────────────┐                │  enrollments     │
   │    └──────────>│ facial_profiles  │                ├──────────────────┤
   │      1      1  ├──────────────────┤                │ PK: id           │
   │                │ PK: id           │                │ FK: student_id   │──→ users
   │                │ FK: user_id      │                │ FK: class_id     │
   │                │ embedding (BLOB) │                └──────────────────┘
   │                │  (2048 bytes)    │
   │                │ model_version    │
   │                │  ("insightface_  │
   │                │   buffalo_sc_v1")│
   │                │ num_samples      │
   │                │ enrollment_      │
   │                │  quality         │
   │                │ created_at       │
   │                │ updated_at       │
   │                └──────────────────┘
   │ 1
   │
   │ M
┌──┴───────────────┐         ┌──────────────────┐
│ attendance_logs  │         │    devices        │
├──────────────────┤         ├──────────────────┤
│ PK: id           │         │ PK: id           │
│ FK: user_id      │         │ name             │
│ FK: class_id     │──→      │ room             │
│ FK: device_id    │────────>│ status           │
│ action (ENUM)    │         │ api_key          │
│  ENTRY           │         │ last_seen_at     │
│  BREAK_OUT       │         └──────────────────┘
│  BREAK_IN        │
│  EXIT            │
│ verified_by      │
│ confidence_score │
│ timestamp        │
│ synced           │
└──────────────────┘
```

---

## Entity Descriptions

### departments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique department identifier |
| name | VARCHAR | NOT NULL | Full department name (e.g., "Computer Studies Department") |
| code | VARCHAR | UNIQUE | Short code (e.g., "CSD") |

### programs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique program identifier |
| name | VARCHAR | NOT NULL | Full program name |
| code | VARCHAR | UNIQUE | Short code |
| department_id | INTEGER | FK → departments | Parent department |

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique user identifier |
| email | VARCHAR | UNIQUE, NOT NULL | User email (login) |
| password_hash | VARCHAR | NOT NULL | bcrypt-hashed password |
| first_name | VARCHAR | NOT NULL | First name |
| last_name | VARCHAR | NOT NULL | Last name |
| role | ENUM | NOT NULL | STUDENT, FACULTY, or HEAD |
| student_number | VARCHAR | NULLABLE | Student ID number (students only) |
| face_registered | BOOLEAN | DEFAULT FALSE | Whether face enrollment is complete |
| is_verified | BOOLEAN | DEFAULT FALSE | Faculty verification by Dept. Head |
| department_id | INTEGER | FK → departments | User's department |

### facial_profiles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique profile identifier |
| user_id | INTEGER | FK → users, UNIQUE | One profile per user |
| embedding | BLOB/BYTEA | NOT NULL | 512-d float32 vector (2,048 bytes) |
| model_version | VARCHAR | NOT NULL | e.g., "insightface_buffalo_sc_v1" |
| num_samples | INTEGER | DEFAULT 1 | Number of frames averaged |
| enrollment_quality | FLOAT | NULLABLE | Average detection quality score (0–1) |
| created_at | TIMESTAMP | DEFAULT NOW | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE | Last modification timestamp |

> **Privacy Note:** The `embedding` column stores ONLY the numerical vector, NOT raw facial images. The model version is tracked to ensure embedding compatibility.

### subjects
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique subject identifier |
| code | VARCHAR | UNIQUE | Subject code (e.g., "CS 301") |
| title | VARCHAR | NOT NULL | Subject name |
| units | INTEGER | NULLABLE | Credit units |

### classes
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique class identifier |
| subject_id | INTEGER | FK → subjects | Associated subject |
| faculty_id | INTEGER | FK → users | Assigned faculty |
| section_name | VARCHAR | NULLABLE | Section name |
| room | VARCHAR | NOT NULL | Room assignment (e.g., "Room 328") |
| day_of_week | VARCHAR | NOT NULL | Day(s) of the week |
| start_time | TIME | NOT NULL | Class start time |
| end_time | TIME | NOT NULL | Class end time |
| semester | VARCHAR | NULLABLE | Semester |
| academic_year | VARCHAR | NULLABLE | Academic year |

### enrollments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique enrollment identifier |
| student_id | INTEGER | FK → users | Enrolled student |
| class_id | INTEGER | FK → classes | Target class |
| | | UNIQUE(student_id, class_id) | Prevents duplicate enrollment |

### devices
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique device identifier |
| name | VARCHAR | NOT NULL | Device name (e.g., "Kiosk 328") |
| room | VARCHAR | NOT NULL | Assigned room |
| status | VARCHAR | DEFAULT "active" | Device status |
| api_key | VARCHAR | UNIQUE | API authentication key |
| last_seen_at | TIMESTAMP | NULLABLE | Last heartbeat |

### attendance_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique log identifier |
| user_id | INTEGER | FK → users, NOT NULL | Who was recognized |
| class_id | INTEGER | FK → classes, NULLABLE | Which class session |
| device_id | INTEGER | FK → devices, NULLABLE | Which kiosk device |
| action | ENUM | NOT NULL | ENTRY, BREAK_OUT, BREAK_IN, EXIT |
| verified_by | VARCHAR | NULLABLE | Verification method (e.g., "face+gesture") |
| confidence_score | FLOAT | NULLABLE | Cosine similarity score (0–1) |
| timestamp | TIMESTAMP | DEFAULT NOW | When the action occurred |
| synced | BOOLEAN | DEFAULT TRUE | Whether synced to server (offline support) |

---

## Key Relationships

| Relationship | Cardinality | Description |
|-------------|-------------|-------------|
| departments → users | 1:M | A department has many users |
| departments → programs | 1:M | A department has many programs |
| users → facial_profiles | 1:1 | Each user has at most one facial profile |
| users → classes (as faculty) | 1:M | A faculty member teaches many classes |
| subjects → classes | 1:M | A subject can have many class sections |
| users → enrollments | 1:M | A student enrolls in many classes |
| classes → enrollments | 1:M | A class has many enrolled students |
| users → attendance_logs | 1:M | A user has many attendance log entries |
| classes → attendance_logs | 1:M | A class has many attendance log entries |
| devices → attendance_logs | 1:M | A device generates many log entries |
