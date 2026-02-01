# FRAMES Project Structure

> **FRAMES** - Facial Recognition Attendance Management Educational System  
> **Last Updated**: February 1, 2026

---

## Overview

```
Capstoneee/
├── README.md             # Project overview
├── PROJECT_STRUCTURE.md  # This file
├── SETUP_GUIDE.md        # How to run the project
│
├── backend/              # ✅ FastAPI Backend (Active)
├── frontend/             # ✅ Vite + React Frontend (Active)
│
├── _legacy/              # ⚠️ Old code (reference only)
│   ├── backend_flask/    #    Old Flask monolith
│   ├── frontend_cra/     #    Old Create React App
│   └── sql_structure/    #    Old MySQL schemas
│
└── documentation/        # 📋 All project docs
    ├── TECH_STACK.md          # Technology stack overview
    ├── MIGRATION_DOCUMENTATION.md
    ├── REFACTOR_COMPLETION_REPORT.md
    ├── CHANGELOG_2026_01_31.md
    ├── GUIDELINES/
    └── project_docs/
```

---

## Backend Structure

```
backend/
├── main.py                  # ✅ FastAPI entry point
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables
├── ca.pem                   # SSL certificate (Aiven)
│
├── api/                     # API Layer
│   └── routers/
│       ├── auth.py          # POST /api/auth/login, /register
│       ├── users.py         # GET/PUT /api/users/{id}
│       ├── admin.py         # /api/admin/verification/*
│       ├── faculty.py       # /api/faculty/schedule, upload-schedule
│       ├── student.py       # /api/student/dashboard, history
│       └── face.py          # 🆕 /api/face/enroll, /status
│
├── models/                  # SQLAlchemy ORM Models
│   ├── user.py              # User (roles, verification)
│   ├── department.py        # Department
│   ├── program.py           # Program (BSIT, BSCS, etc)
│   ├── subject.py           # Subject (code, title, units)
│   ├── class_.py            # Class (schedule, faculty)
│   ├── enrollment.py        # Student-Class enrollment
│   ├── attendance_log.py    # Attendance records
│   ├── facial_profile.py    # 🆕 Face embeddings (InsightFace 512-d)
│   └── device.py            # Kiosk devices
│
├── schemas/                 # Pydantic Validation
│   └── user.py              # UserCreate, UserResponse
│
├── services/                # Business Logic
│   ├── pdf_parser.py        # COR PDF parsing (pdfplumber)
│   └── face_enrollment.py   # 🆕 InsightFace embedding extraction
│
├── db/                      # Database Connection
│   └── database.py          # SQLAlchemy engine, get_db()
│
├── scripts/                 # Utility Scripts
│   ├── init_db.py                 # Create all tables
│   ├── seed_data.py               # Seed initial data
│   ├── clean_data.py              # Clear all data
│   ├── test_db.py                 # Test DB connection
│   └── test_face_recognition.py   # 🆕 Webcam face verification test
│
├── core/                    # (Planned) Config & Security
├── docs/                    # (Planned) API documentation
├── tests/                   # (Planned) Pytest tests
├── uploads/                 # Uploaded files storage
└── testfile/                # Test PDFs
```

---

## Frontend Structure

```
frontend/
├── index.html               # ✅ Vite entry point
├── vite.config.js           # Vite configuration
├── package.json             # NPM dependencies
│
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Router & routes
│   ├── index.css            # Global styles
│   │
│   └── components/
│       ├── LandingPage/
│       │   ├── LandingPage.jsx
│       │   ├── RegistrationPage.jsx
│       │   └── *.css
│       │
│       ├── Common/
│       │   ├── Header.jsx
│       │   └── *.css
│       │
│       ├── FaceEnrollment/           # 🆕 Face Enrollment
│       │   ├── FaceEnrollmentPage.jsx
│       │   └── FaceEnrollmentPage.css
│       │
│       ├── AdminDashboard/
│       │   ├── AdminLayout.jsx
│       │   ├── AdminDashboardPage.jsx
│       │   └── *.jsx, *.css
│       │
│       ├── FacultyDashboard/
│       │   ├── FacultyLayout.jsx     # Face check enforced
│       │   ├── FacultyDashboardPage.jsx
│       │   ├── MyClassesPage.jsx     # PDF upload
│       │   └── *.jsx, *.css
│       │
│       └── StudentDashboard/
│           ├── StudentLayout.jsx     # Face check enforced
│           ├── StudentDashboardPage.jsx
│           └── *.jsx, *.css
│
└── public/
    └── assets/              # Static images/icons
```

---

## Key Files Reference

### Backend Entry Points

| File | Purpose | Command |
|------|---------|---------|
| `main.py` | FastAPI server | `uvicorn main:app --reload` |
| `scripts/init_db.py` | Create tables | `python scripts/init_db.py` |
| `scripts/seed_data.py` | Seed data | `python scripts/seed_data.py` |
| `scripts/test_face_recognition.py` | 🆕 Test face recognition | `python scripts/test_face_recognition.py` |

### Frontend Entry Points

| File | Purpose | Command |
|------|---------|---------|
| `main.jsx` | React app | `npm run dev` |
| `vite.config.js` | Dev server config | Port 3000, proxy to 5000 |

---

## API Endpoints Summary

### Auth (`/api/auth`)
- `POST /login` - Login with email/password
- `POST /register` - Register faculty/head
- `POST /validate-face` - Validate face capture

### Users (`/api/users`)
- `GET /{id}` - Get user profile
- `PUT /{id}` - Update profile
- `POST /verify-password` - Check password
- `PUT /change-password` - Change password

### Face (`/api/face`) 🆕
- `POST /enroll` - Enroll face (15 frames → InsightFace embedding)
- `GET /status/{user_id}` - Check face enrollment status

### Faculty (`/api/faculty`)
- `GET /schedule/{id}` - Get classes
- `GET /dashboard-stats/{id}` - Dashboard stats
- `POST /upload-schedule` - Upload COR PDF
- `GET /upload-history/{id}` - Upload history
- `GET /class-details/{id}` - Class students

### Student (`/api/student`)
- `GET /dashboard/{id}` - Dashboard stats
- `GET /schedule/{id}` - Class schedule
- `GET /history/{id}` - Attendance history

### Admin (`/api/admin`)
- `GET /verification/list` - All users
- `POST /verification/approve` - Approve user
- `POST /verification/reject` - Reject user
- `DELETE /user/{id}` - Delete user

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| HEAD | head.santos@tup.edu.ph | santos |
| FACULTY | elena.fernandez@tup.edu.ph | fernandez |
| FACULTY | maria.dela_cruz@tup.edu.ph | dela_cruz |

---

## Quick Start

```bash
# Terminal 1: Backend
cd backend
pip install insightface onnxruntime pillow  # For face enrollment
uvicorn main:app --host 0.0.0.0 --port 5000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/docs
