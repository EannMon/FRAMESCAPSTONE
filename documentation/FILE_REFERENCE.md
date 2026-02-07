# 📁 FRAMES File Reference

> **Complete listing of ALL files with descriptions and connections**  
> **Last Updated**: February 1, 2026

---

## Quick Navigation

1. [Backend Files](#backend-files)
2. [Frontend Files](#frontend-files)
3. [Documentation](#documentation)
4. [Legacy Files](#legacy-files)

---

# Backend Files

## Entry Point

| File | Description | Connects To |
|------|-------------|-------------|
| `main.py` | FastAPI application entry point. Registers all routers, CORS middleware. | `api/routers/*`, `db/database.py` |

---

## Database Layer (`db/`)

| File | Description | Connects To |
|------|-------------|-------------|
| `database.py` | SQLAlchemy engine, session factory, `get_db()` dependency. Uses PostgreSQL on Aiven with SSL. | `.env`, All models |

---

## Models (`models/`)

SQLAlchemy ORM models representing database tables.

| File | Model | Description | Foreign Keys |
|------|-------|-------------|--------------|
| `user.py` | `User` | Users with roles (STUDENT, FACULTY, HEAD, ADMIN). Has verification status, face registration flag. | `department_id`, `program_id` |
| `department.py` | `Department` | Academic departments (e.g., CSD). | — |
| `program.py` | `Program` | Academic programs (BSIT, BSCS, BSIS). | `department_id` |
| `subject.py` | `Subject` | Course subjects (code, title, units). | — |
| `class_.py` | `Class` | Class schedules with day/time/room. Links faculty to subjects. | `subject_id`, `faculty_id` |
| `enrollment.py` | `Enrollment` | Links students to classes. | `class_id`, `student_id` |
| `attendance_log.py` | `AttendanceLog` | Attendance records with timestamps, verification method. | `user_id`, `class_id`, `device_id` |
| `facial_profile.py` | `FacialProfile` | Face embeddings stored as binary. Model version tracked. | `user_id` |
| `device.py` | `Device` | Kiosk devices (Raspberry Pi) in classrooms. | — |
| `__init__.py` | — | Exports all models for easy imports. | All models |

---

## API Routers (`api/routers/`)

FastAPI route handlers organized by feature.

| File | Prefix | Key Endpoints | Connects To |
|------|--------|---------------|-------------|
| `auth.py` | `/api/auth` | `POST /login`, `POST /register`, `POST /validate-face` | `models/user.py`, `schemas/user.py` |
| `users.py` | `/api/users` | `GET /{id}`, `PUT /{id}`, `POST /verify-password`, `PUT /change-password` | `models/user.py` |
| `admin.py` | `/api/admin` | `GET /verification/list`, `POST /verification/approve`, `POST /verification/reject` | `models/user.py` |
| `faculty.py` | `/api/faculty` | `GET /schedule/{id}`, `GET /dashboard-stats/{id}`, `POST /upload-schedule`, `GET /upload-history/{id}` | `models/class_.py`, `services/pdf_parser.py` |
| `student.py` | `/api/student` | `GET /dashboard/{id}`, `GET /schedule/{id}`, `GET /history/{id}` | `models/user.py`, `models/enrollment.py` |
| `__init__.py` | — | Exports all routers. | All routers |

---

## Schemas (`schemas/`)

Pydantic models for request/response validation.

| File | Classes | Purpose |
|------|---------|---------|
| `user.py` | `UserCreate`, `UserLogin`, `UserResponse`, `LoginResponse` | Validate user data, serialize responses |
| `__init__.py` | — | Exports all schemas |

---

## Services (`services/`)

Business logic separated from routes.

| File | Functions | Description |
|------|-----------|-------------|
| `pdf_parser.py` | `parse_schedule_pdf()` | Parses COR PDFs using pdfplumber. Extracts course info and student lists. |
| `__init__.py` | — | Exports services |

---

## Scripts (`scripts/`)

Utility scripts for database management.

| File | Command | Description |
|------|---------|-------------|
| `init_db.py` | `python scripts/init_db.py` | Creates all database tables |
| `seed_data.py` | `python scripts/seed_data.py` | Seeds initial data (departments, programs, users) |
| `reset_database.py` | `python scripts/reset_database.py` | Clears all data (new SQLAlchemy version) |
| `clean_data.py` | ⚠️ LEGACY | Old MySQL version - DO NOT USE |
| `migrate_db.py` | `python scripts/migrate_db.py` | Apply schema migrations |
| `rollback_db.py` | `python scripts/rollback_db.py` | Rollback schema changes |
| `test_db.py` | `python scripts/test_db.py` | Test database connection |
| `promote_me.py` | `python scripts/promote_me.py` | Promote user to admin role |

---

## Configuration

| File | Description |
|------|-------------|
| `.env` | Environment variables (DATABASE_URL). **DO NOT COMMIT** |
| `ca.pem` | SSL certificate for Aiven PostgreSQL |
| `requirements.txt` | Python dependencies |

---

## Empty Folders (Planned)

| Folder | Purpose | See README |
|--------|---------|------------|
| `core/` | Configuration, security utilities, JWT | `core/README.md` |
| `docs/` | API documentation, OpenAPI specs | `docs/README.md` |
| `tests/` | Pytest unit/integration tests | `tests/README.md` |
| `uploads/` | Uploaded files (COR PDFs, face images) | `uploads/README.md` |
| `testfile/` | Test PDF files for development | Contains `BSIT4A.pdf` |

---

# Frontend Files

## Entry Points

| File | Description | Connects To |
|------|-------------|-------------|
| `index.html` | HTML entry point for Vite | `src/main.jsx` |
| `vite.config.js` | Vite configuration (port 3000, proxy to backend 5000) | — |
| `package.json` | NPM dependencies and scripts | — |

---

## Core (`src/`)

| File | Description | Connects To |
|------|-------------|-------------|
| `main.jsx` | React entry point, mounts App | `App.jsx` |
| `App.jsx` | Router setup, all routes defined | All page components |
| `index.css` | Global styles | — |

---

## Components (`src/components/`)

### Auth Components

| File | Description | API Calls |
|------|-------------|-----------|
| `Auth/LandingPage.jsx` | Login form with role selection | `POST /api/auth/login` |
| `Auth/LandingPage.css` | Styles for login page | — |
| `Auth/RegistrationPage.jsx` | Faculty/Head registration with face capture | `POST /api/auth/register`, `POST /api/auth/validate-face` |
| `Auth/RegistrationPage.css` | Styles for registration | — |

### Common Components

| File | Description | Used By |
|------|-------------|---------|
| `Common/Header.jsx` | Top navigation bar with user info | All layouts |
| `Common/Header.css` | Header styles | — |
| `Common/Utility.css` | Shared utility classes | All components |

### Admin Dashboard

| File | Description | API Calls |
|------|-------------|-----------|
| `AdminDashboard/AdminLayout.jsx` | Admin sidebar + outlet | — |
| `AdminDashboard/AdminLayout.css` | Admin layout styles | — |
| `AdminDashboard/AdminDashboardPage.jsx` | Admin stats view | — |
| `AdminDashboard/UserVerificationPage.jsx` | Approve/reject users | `GET/POST /api/admin/verification/*` |

### Faculty Dashboard

| File | Description | API Calls |
|------|-------------|-----------|
| `FacultyDashboard/FacultyLayout.jsx` | Faculty sidebar + outlet | — |
| `FacultyDashboard/FacultyLayout.css` | Faculty layout styles | — |
| `FacultyDashboard/FacultyDashboardPage.jsx` | Faculty stats view | `GET /api/faculty/dashboard-stats/{id}` |
| `FacultyDashboard/MyClassesPage.jsx` | View classes + upload COR PDF | `GET /api/faculty/schedule/{id}`, `POST /api/faculty/upload-schedule` |
| `FacultyDashboard/MyProfilePage.jsx` | Edit profile | `GET/PUT /api/users/{id}` |

### Student Dashboard

| File | Description | API Calls |
|------|-------------|-----------|
| `StudentDashboard/StudentLayout.jsx` | Student sidebar + outlet | — |
| `StudentDashboard/StudentDashboardPage.jsx` | Student stats view | `GET /api/student/dashboard/{id}` |
| `StudentDashboard/MySchedulePage.jsx` | View class schedule | `GET /api/student/schedule/{id}` |
| `StudentDashboard/AttendanceHistoryPage.jsx` | View attendance logs | `GET /api/student/history/{id}` |

---

# Documentation

| File | Location | Description |
|------|----------|-------------|
| `README.md` | Root | Project overview |
| `PROJECT_STRUCTURE.md` | Root | File structure diagram |
| `SETUP_GUIDE.md` | Root | How to run the project |
| `FILE_REFERENCE.md` | Root | This file - detailed file listing |
| `documentation/FACULTY_HEAD_REPORT_GUIDE.md` | `documentation/` | **New**. Specific instructions for Dept Head reports. |
| `documentation/REPORT_TEMPLATE_IMPLEMENTATION_GUIDE.md` | `documentation/` | **New**. Technical guide on implementing the `ReportGenerator` utility. |
| `MIGRATION_DOCUMENTATION.md` | `documentation/` | Details the migration to FastAPI/Vite/SQLAlchemy. |
| `REFACTOR_COMPLETION_REPORT.md` | `documentation/` | Refactoring summary |
| `CHANGELOG_2026_01_31.md` | `documentation/` | Change log |
| `EDGE_AI_ANALYSIS.md` | `documentation/` | Edge AI architecture analysis |

---

# Legacy Files (`_legacy/`)

> ⚠️ **DO NOT USE IN PRODUCTION** - Reference only

| Folder | Contents | Original Location |
|--------|----------|-------------------|
| `backend_flask/` | `app.py` (Flask monolith), `db_config.py` (MySQL) | `backend/` |
| `frontend_cra/` | Old Create React App code | `frontend_cra_backup/` |
| `sql_structure/` | Old MySQL schema files | `OLD SQL Structure/` |

---

# File Connections Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
├─────────────────────────────────────────────────────────────┤
│  index.html → main.jsx → App.jsx → Component Pages         │
│                              ↓                              │
│                    axios API calls                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
├─────────────────────────────────────────────────────────────┤
│  main.py ─→ api/routers/*.py                               │
│                  ↓                                          │
│           services/*.py (business logic)                    │
│                  ↓                                          │
│           models/*.py (ORM)                                 │
│                  ↓                                          │
│           db/database.py (SQLAlchemy)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQL
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Aiven Cloud)                       │
│              SSL enabled (sslmode=require)                  │
└─────────────────────────────────────────────────────────────┘
```
