# 📁 CAPSTONEEE FILE ORGANIZATION & MANIFEST

**Date**: January 26, 2026  
**Purpose**: Organize chaotic file structure for easy navigation & understanding

---

## 📖 TABLE OF CONTENTS
1. [Current Messy Structure](#current-messy-structure)
2. [Proposed Clean Structure](#proposed-clean-structure)
3. [File Manifest](#file-manifest)
4. [Backend Files - Detailed Breakdown](#backend-files---detailed-breakdown)
5. [Frontend Files - Detailed Breakdown](#frontend-files---detailed-breakdown)
6. [How to Use This Organization](#how-to-use-this-organization)

---

## 😵 Current Messy Structure

```
backend/
├── app.py                    # Main Flask app (1907 lines!)
├── db_config.py              # DB configuration
├── clean_data.py             # Data cleaning
├── seed_data.py              # Data seeding
├── migrate_db.py             # Database migration
├── rollback_db.py            # Database rollback
├── promote_me.py             # Make user a dept head
├── test_db.py                # Test DB connection
├── requirements.txt          # Dependencies
├── package.json              # (Why is this here? 🤔)
├── ca.pem                    # SSL certificate
├── .env                      # Secrets (not in git)
├── __pycache__/              # Compiled Python files
├── node_modules/             # (From package.json?)
├── testfile/                 # Test PDFs
│   └── BSIT4A.pdf
└── SQL Structure/
    └── database_structure.sql # DB schema

frontend/
├── package.json              # Dependencies
├── README.md
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── App.js                # Main router
│   ├── App.css
│   ├── index.js              # Entry point
│   ├── index.css
│   ├── setupTests.js
│   ├── reportWebVitals.js
│   ├── assets/
│   │   ├── emeee.txt
│   │   └── images/
│   └── components/
│       ├── Eme.txt           # (Random file? 🤔)
│       ├── AdminDashboard/
│       ├── FacultyDashboard/
│       ├── LandingPage/
│       ├── StudentDashboard/
│       └── ZCommon/           # (Z prefix is confusing!)

Root:
├── 00_FINAL_SUMMARY.md       # (Numbered doc?)
├── BEFORE_AFTER_COMPARISON.md
├── CAPSTONE_PROJECT_CONTEXT.md
├── FACULTY_UPLOAD_GUIDE.md
├── FINAL_IMPLEMENTATION_CHECKLIST.md
├── IMPLEMENTATION_SUMMARY.md
├── INDEX.md
├── MASTER_DOCUMENTATION_INDEX.md
├── PROJECT_ANALYSIS_AND_ARCHITECTURE.md
├── PROJECT_FILE_DIRECTORY.md
├── QUICK_REFERENCE.md
├── SETUP_CHECKLIST.md
├── START_HERE.md
├── README.md
└── git files (.git, .gitignore, etc.)

PROBLEMS 🚨:
├─ 11 markdown docs in root (no organization!)
├─ Backend scripts scattered (no folders)
├─ Numbered files (00_FINAL_SUMMARY)
├─ Random files (Eme.txt, emeee.txt, package.json in backend)
├─ Component prefix Z (ZCommon - confusing!)
├─ No clear separation of concerns
└─ Hard to find what you need
```

---

## ✅ Proposed Clean Structure

```
Capstoneee/
│
├── 📚 DOCUMENTATION/              # All docs in one place
│   ├── README.md                  # Start here
│   ├── PROJECT_OVERVIEW.md        # What is FRAMES?
│   ├── SETUP_GUIDE.md             # How to run locally
│   ├── CAPSTONE_OBJECTIVES.md     # Project goals
│   ├── SYSTEM_ARCHITECTURE.md     # Technical architecture
│   ├── API_DOCUMENTATION.md       # All endpoints
│   ├── DEPLOYMENT_GUIDE.md        # Production setup
│   │
│   └── REFERENCE/                 # Quick reference guides
│       ├── TERMINOLOGY.md         # Technical terms explained
│       ├── FEATURES_CHECKLIST.md  # What's done vs missing
│       ├── TROUBLESHOOTING.md     # Common issues & fixes
│       └── FILE_MANIFEST.md       # This file!
│
├── 📦 backend/
│   ├── app.py                     # Main Flask application
│   ├── db_config.py               # Database configuration
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Example env file
│   ├── ca.pem                     # SSL certificate
│   │
│   ├── 🔧 core/                   # Core functionality
│   │   ├── face_recognition.py    # Facial recognition logic
│   │   ├── gesture_detection.py   # Hand gesture logic (NEW)
│   │   ├── pdf_parser.py          # PDF parsing for uploads
│   │   └── __init__.py
│   │
│   ├── 🔌 api/                    # API endpoints
│   │   ├── auth.py                # Login/register endpoints
│   │   ├── face.py                # Face validation/register
│   │   ├── attendance.py          # Attendance tracking
│   │   ├── upload.py              # Faculty schedule upload
│   │   ├── reports.py             # Report generation
│   │   └── __init__.py
│   │
│   ├── 📊 database/               # Database utilities
│   │   ├── models.py              # Data models (if ORM used)
│   │   ├── queries.py             # SQL queries
│   │   └── __init__.py
│   │
│   ├── 🛠️ scripts/                # Utility scripts (dev only)
│   │   ├── migrate_db.py          # Add new DB tables
│   │   ├── rollback_db.py         # Revert migrations
│   │   ├── seed_data.py           # Populate test data
│   │   ├── clean_data.py          # Clear test data
│   │   ├── promote_user.py        # Make user admin/head
│   │   └── test_db_connection.py  # Verify DB works
│   │
│   ├── 🧪 tests/                  # Unit tests
│   │   ├── test_auth.py
│   │   ├── test_face.py
│   │   ├── test_upload.py
│   │   └── __init__.py
│   │
│   ├── 📂 uploads/                # Temp file storage
│   │   └── .gitkeep              # Keep folder in git
│   │
│   ├── 📚 docs/                   # Backend-specific docs
│   │   ├── API_ENDPOINTS.md
│   │   ├── DATABASE_SCHEMA.md
│   │   └── MODELS.md
│   │
│   └── __pycache__/               # Compiled files (in .gitignore)
│
├── 🎨 frontend/
│   ├── package.json               # Node dependencies
│   ├── package-lock.json
│   ├── .env.example               # Example env
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   │
│   ├── src/
│   │   ├── index.js               # React entry point
│   │   ├── App.js                 # Main router
│   │   ├── App.css
│   │   ├── index.css
│   │   │
│   │   ├── 🎯 pages/              # Full page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx      # (If separate)
│   │   │   └── NotFoundPage.jsx   # 404
│   │   │
│   │   ├── 📱 layouts/            # Layout wrappers
│   │   │   ├── StudentLayout.jsx
│   │   │   ├── FacultyLayout.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   └── GuestLayout.jsx
│   │   │
│   │   ├── 📊 dashboards/         # Dashboard pages
│   │   │   ├── StudentDashboard/
│   │   │   │   ├── StudentDashboardPage.jsx
│   │   │   │   ├── SchedulePage.jsx
│   │   │   │   ├── AttendanceHistoryPage.jsx
│   │   │   │   └── styles/
│   │   │   │       └── StudentDashboard.css
│   │   │   │
│   │   │   ├── FacultyDashboard/
│   │   │   │   ├── FacultyDashboardPage.jsx
│   │   │   │   ├── MyClassesPage.jsx (with upload view)
│   │   │   │   ├── AttendancePage.jsx
│   │   │   │   ├── ReportsPage.jsx
│   │   │   │   ├── DeptHeadPage.jsx
│   │   │   │   └── styles/
│   │   │   │
│   │   │   └── AdminDashboard/
│   │   │       ├── AdminDashboardPage.jsx
│   │   │       ├── UserManagementPage.jsx
│   │   │       ├── ApplicationPage.jsx
│   │   │       ├── ReportsPage.jsx
│   │   │       ├── SystemLogsPage.jsx
│   │   │       └── styles/
│   │   │
│   │   ├── 🧩 components/         # Reusable components
│   │   │   ├── Common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   └── ErrorBoundary.jsx
│   │   │   │
│   │   │   ├── Forms/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   ├── UploadForm.jsx
│   │   │   │   └── ProfileForm.jsx
│   │   │   │
│   │   │   ├── Tables/
│   │   │   │   ├── AttendanceTable.jsx
│   │   │   │   ├── UserTable.jsx
│   │   │   │   └── ReportTable.jsx
│   │   │   │
│   │   │   ├── Modals/
│   │   │   │   ├── ConfirmModal.jsx
│   │   │   │   └── UploadProgressModal.jsx
│   │   │   │
│   │   │   └── Status/
│   │   │       ├── StatusIndicator.jsx (Green/Yellow)
│   │   │       └── StatusCard.jsx
│   │   │
│   │   ├── 🎨 styles/             # Global styles
│   │   │   ├── global.css
│   │   │   ├── variables.css
│   │   │   ├── responsive.css
│   │   │   └── themes/
│   │   │       └── dark.css
│   │   │
│   │   ├── 🔌 services/           # API calls
│   │   │   ├── api.js             # Axios setup
│   │   │   ├── authService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── uploadService.js
│   │   │   └── reportService.js
│   │   │
│   │   ├── 💾 context/            # React Context (state)
│   │   │   ├── AuthContext.js
│   │   │   ├── UserContext.js
│   │   │   └── NotificationContext.js
│   │   │
│   │   ├── 🧪 tests/              # Unit tests
│   │   │   ├── App.test.js
│   │   │   ├── components/
│   │   │   └── services/
│   │   │
│   │   ├── 📂 assets/             # Images, fonts, etc
│   │   │   ├── images/
│   │   │   │   ├── logo.png
│   │   │   │   ├── icons/
│   │   │   │   └── illustrations/
│   │   │   └── fonts/
│   │   │
│   │   └── 📚 utils/              # Helper functions
│   │       ├── formatters.js      # Date, number formatting
│   │       ├── validators.js      # Form validation
│   │       ├── localStorage.js    # Local storage helpers
│   │       └── constants.js       # App constants
│   │
│   ├── 📚 docs/                   # Frontend-specific docs
│   │   ├── COMPONENTS.md
│   │   ├── STATE_MANAGEMENT.md
│   │   └── STYLING.md
│   │
│   └── node_modules/              # Dependencies (in .gitignore)
│
├── 🗄️ SQL/                        # Database files
│   ├── database_structure.sql     # Schema dump
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_faculty_upload.sql
│   │   └── 003_gesture_events.sql
│   └── seeds/
│       └── sample_data.sql
│
├── 📝 .gitignore                  # Files to ignore
├── 📝 .env.example                # Template for .env
├── 📝 docker-compose.yml          # (Future: Containerization)
├── 📝 package.json                # (Root: For scripts)
└── 🔑 README.md                   # Main starting point

```

---

## 📋 File Manifest

### Backend Files Classification

| File | Category | Purpose | Run When? |
|------|----------|---------|-----------|
| **app.py** | Core | Main Flask application with all endpoints | Always (development & production) |
| **db_config.py** | Core | Database configuration from .env | Always |
| **requirements.txt** | Config | Python dependencies list | `pip install -r requirements.txt` (setup only) |
| **ca.pem** | Security | SSL certificate for Aiven DB | Always (needed for connection) |
| **.env** | Secrets | Database credentials (NOT in git) | Always (referenced by db_config.py) |
| **migrate_db.py** | 🛠️ Script | **DEV ONLY** - Adds new tables/columns to DB | Once per deployment (`python migrate_db.py`) |
| **rollback_db.py** | 🛠️ Script | **DEV ONLY** - Reverts database changes | If migration fails (`python rollback_db.py`) |
| **seed_data.py** | 🛠️ Script | **DEV ONLY** - Populate DB with test data | After migration (`python seed_data.py`) |
| **clean_data.py** | 🛠️ Script | **DEV ONLY** - Delete all test data | Before fresh test run (`python clean_data.py`) |
| **promote_me.py** | 🛠️ Script | **DEV ONLY** - Make a user admin/dept head | Once per user (`python promote_me.py`) |
| **test_db.py** | 🛠️ Script | **DEV ONLY** - Verify DB connection works | Troubleshooting only (`python test_db.py`) |
| **package.json** | ❌ REMOVE | Why is this in backend? Node project in backend? | DELETE THIS |
| **node_modules/** | ❌ REMOVE | Dependencies from above package.json | DELETE THIS |
| **testfile/BSIT4A.pdf** | 📂 Test | Sample COR PDF for testing upload feature | Testing only (delete before prod) |
| **__pycache__/** | ❌ IGNORE | Compiled Python files | Ignored (in .gitignore) |

### Frontend Files Classification

| File/Folder | Category | Purpose |
|-------------|----------|---------|
| **package.json** | Config | Node dependencies & scripts |
| **package-lock.json** | Config | Locked dependency versions |
| **.env.example** | Config | Template for frontend env vars |
| **public/index.html** | Core | Main HTML file |
| **src/index.js** | Core | React entry point |
| **src/App.js** | Core | Main router configuration |
| **components/AdminDashboard/** | Pages | Admin dashboard pages |
| **components/FacultyDashboard/** | Pages | Faculty dashboard + upload view |
| **components/StudentDashboard/** | Pages | Student dashboard pages |
| **components/LandingPage/** | Pages | Public landing page |
| **components/ZCommon/** | Shared | Common components (rename to Common/) |
| **Eme.txt** | ❌ REMOVE | Random placeholder file |
| **emeee.txt** | ❌ REMOVE | Random placeholder file |
| **assets/images/** | Media | Images for UI |

### Root Documentation Files

| File | Purpose | Read When? |
|------|---------|-----------|
| **README.md** | 🎯 START HERE | First time setup |
| **START_HERE.md** | Project overview | Before coding |
| **SETUP_CHECKLIST.md** | Setup steps | Before running locally |
| **PROJECT_ANALYSIS_AND_ARCHITECTURE.md** | Technical deep-dive | Understanding system design |
| **CAPSTONE_PROJECT_CONTEXT.md** | Spoon-fed explanation | Understanding FRAMES concept |
| **SYSTEM_ARCHITECTURE.md** | System design | Architecture questions |
| **BEFORE_AFTER_COMPARISON.md** | Feature changelog | See what changed |
| **PROJECT_FILE_DIRECTORY.md** | File organization | Navigating codebase |
| **QUICK_REFERENCE.md** | Quick lookup | Fast answers |
| **FACULTY_UPLOAD_GUIDE.md** | Feature guide | How to use upload feature |
| **FINAL_IMPLEMENTATION_CHECKLIST.md** | Progress tracker | What's done/pending |
| **IMPLEMENTATION_SUMMARY.md** | Feature summary | Overview of changes |
| **MASTER_DOCUMENTATION_INDEX.md** | Doc index | Finding docs |
| **INDEX.md** | Another index? | 🤔 Duplicate? |
| **00_FINAL_SUMMARY.md** | Yet another summary? | 🤔 Confusing naming |

---

## 🔧 Backend Files - Detailed Breakdown

### Main Application

#### **app.py** (1907 lines)
```
What it does:
├─ Flask application server
├─ All API endpoints
├─ Facial recognition processing
├─ PDF parsing
├─ Database queries
└─ Response handling

Key Functions:
├─ /api/login → User authentication
├─ /api/register → New user registration
├─ /validate-face → Face recognition
├─ /register-face → Register face embedding
├─ /api/faculty/upload-schedule → PDF upload & parsing
├─ /api/attendance/check-in → Log attendance
├─ /api/reports/* → Generate reports
└─ Many more endpoints...

When to edit:
├─ Adding new API endpoints
├─ Fixing bugs in endpoints
├─ Modifying business logic
└─ Performance optimization

FUTURE REFACTOR:
Separate into modules:
├─ core/face_recognition.py
├─ core/pdf_parser.py
├─ api/endpoints.py
└─ Makes app.py easier to manage
```

#### **db_config.py** (9 lines)
```
What it does:
├─ Reads .env file
├─ Configures database connection
├─ Loads SSL certificate
└─ Returns DB_CONFIG dictionary

When to edit:
├─ Adding SSL certificate
├─ Changing connection parameters
├─ Usually NEVER edit (config driven)

Current config:
{
  'host': 'mysql-cf722f2-framessys01-cee4.c.aivencloud.com',
  'port': 21352,
  'user': 'avnadmin',
  'password': '****',
  'database': 'defaultdb',
  'ssl_ca': 'ca.pem'
}
```

---

### Development Scripts

#### **migrate_db.py** - Add New Tables/Columns
```
Purpose: Prepare database for new features

What it adds:
├─ FacultyScheduleUpload table (NEW)
├─ Subjects table (NEW)
├─ upload_id column to ClassSchedule
├─ Test cameras (Room 324, 326)
└─ Indexes for performance

When to run: `python migrate_db.py`
├─ Only ONCE per fresh database
├─ Before deploying new features
├─ Before seed_data.py

Current migrations:
├─ Faculty upload feature (v1)
└─ Gesture events (planned for v2)

Create new migrations by:
├─ Adding new SQL CREATE/ALTER statements
├─ Running once
├─ Committing migration script to git
```

#### **rollback_db.py** - Undo Migrations
```
Purpose: Revert database to previous state

What it does:
├─ Delete all upload records
├─ Remove test cameras
├─ Remove upload_id column
├─ Optionally drop new tables

When to run: `python rollback_db.py`
├─ Only if migration FAILED
├─ If you need to test fresh setup
├─ Saves you from manual SQL

Safety features:
├─ Asks for confirmation
├─ Only deletes test data
├─ Keeps production data safe

DON'T RUN unless you know what you're doing!
```

#### **seed_data.py** - Populate Test Data
```
Purpose: Fill database with fake data for testing

What it creates:
├─ Sample students
├─ Sample faculty
├─ Sample classes/schedules
├─ Sample attendance records
├─ Test subjects
└─ Test cameras

When to run: `python seed_data.py`
├─ After migrate_db.py
├─ Before testing features
├─ When you want fresh test data

What it creates specifically:
├─ Users: Emmanuel, Elena, Students A-Z
├─ Classes: IT411, IT412, etc.
├─ Schedules: Monday-Friday classes
├─ Attendance: Past 30 days of random attendance
└─ Subjects: CS courses

Edit this if:
├─ Need different test users
├─ Need more/fewer classes
├─ Want specific test scenarios
```

#### **clean_data.py** - Delete Test Data
```
Purpose: Clear database while keeping structure

What it does:
├─ Truncate (empty) tables:
│  ├─ EventLog (all events)
│  ├─ ClassSchedule (all classes)
│  ├─ Subjects (all subjects)
│  └─ Notification (all notifications)
├─ Reset specific user enrollments
├─ Disable foreign key checks (temporarily)
└─ Re-enable foreign key checks

When to run: `python clean_data.py`
├─ Before fresh test
├─ When data gets messy
├─ Before seed_data.py run

Safe because:
├─ Doesn't delete user accounts
├─ Doesn't delete admin users
├─ Schema/tables remain intact
└─ Can easily seed again

CAUTION:
├─ Only run on DEV database
├─ NEVER run on production!
├─ Data deletion is permanent
```

#### **promote_me.py** - Make User Admin/Head
```
Purpose: Grant admin or dept head privileges

What it does:
├─ Find user by email
├─ Update faculty_status = 'Head'
└─ Makes them a department head

When to run: `python promote_me.py`
├─ Once per admin user
├─ Before testing faculty features

How to use:
├─ Edit MY_EMAIL = "your@email.com"
├─ Run: python promote_me.py
├─ User is now dept head

Why needed:
├─ Can't set through frontend yet
├─ Dev script for quick user setup
└─ Should be replaced with admin UI
```

#### **test_db.py** - Verify Connection
```
Purpose: Test if database connection works

What it does:
├─ Connect to Aiven MySQL
├─ Verify credentials work
├─ Check SSL certificate
├─ Print MySQL version
└─ Display connection info

When to run: `python test_db.py`
├─ When setting up environment
├─ If getting "cannot connect" errors
├─ To verify .env is correct

Successful output:
✅ SUCCESS! Connected ka na sa Aiven!
🔗 Connected to Database: defaultdb
🖥️  Host: mysql-cf722f2-...
📊 MySQL Version: 8.0.35

If it fails:
├─ Check .env file exists
├─ Verify credentials are correct
├─ Check internet connection
├─ Check firewall/VPN
└─ Verify ca.pem certificate exists
```

---

## 🎨 Frontend Files - Detailed Breakdown

### Core Files

#### **src/App.js**
```
What it does:
├─ React Router setup
├─ Route configuration
├─ Layout wrapping
└─ Navigation structure

Routes:
├─ / → Landing page (public)
├─ /register/:role → Registration
├─ /admin-* → Admin routes
├─ /faculty-* → Faculty routes
├─ /student-* → Student routes
└─ /profile, /settings → Common

Edit this when:
├─ Adding new pages
├─ Changing routes
├─ Reorganizing navigation
└─ Adding layout wrappers
```

#### **src/index.js**
```
What it does:
├─ React app entry point
├─ Renders App to DOM
├─ Loads global styles
└─ Initializes React environment

NEVER EDIT unless:
├─ Adding providers (Redux, Context)
├─ Changing DOM mount point
├─ Global initialization needed
```

---

### Component Organization

#### **StudentDashboard/** 
```
StudentDashboardPage.jsx
├─ Main student landing
├─ Links to other pages
└─ Quick status overview

SchedulePage.jsx
├─ Current semester schedule
├─ Day-by-day classes
├─ Room locations
└─ Faculty names

AttendanceHistoryPage.jsx
├─ Past attendance records
├─ Calendar view
├─ Statistics (on-time, absences)
└─ Export as PDF/CSV

StudentLayout.jsx
├─ Header (Logo, user menu)
├─ Sidebar (Navigation)
├─ Footer
└─ Wrapper for all student pages

StudentDashboardPage.css
├─ Styles for student dashboard
├─ Color scheme
└─ Responsive layout
```

#### **FacultyDashboard/**
```
FacultyDashboardPage.jsx
├─ Faculty main page
├─ Quick stats
└─ Links to features

MyClassesPage.jsx ✨ (NEW - Upload Feature)
├─ List View: Cards showing classes
├─ Calendar View: Classes on calendar
├─ Upload View: ← NEW!
│  ├─ PDF file picker
│  ├─ Semester/year selection
│  ├─ Upload button
│  ├─ Progress indicator
│  ├─ Status messages
│  └─ Upload history table
└─ Attendance View: Attendance for classes

FacultyAttendancePage.jsx
├─ Attendance for own classes
├─ Student attendance records
├─ Mark attendance manually (if allowed)
└─ Export reports

FacultyReportsPage.jsx
├─ Generate class reports
├─ Attendance summaries
├─ Punctuality statistics
└─ Export as PDF/CSV

DeptHeadManagePage.jsx
├─ Manage faculty in department
├─ View faculty attendance
├─ Assign courses
└─ Department-wide settings

DeptHeadReportsPage.jsx
├─ Faculty performance reports
├─ Attendance aggregates
├─ Department statistics
└─ Export reports

FacultyLayout.jsx
├─ Header + Sidebar + Footer
└─ Wrapper for all faculty pages

MyClassesPage.css
├─ Styles for classes page
├─ Upload form styling
└─ Table styles
```

#### **AdminDashboard/**
```
AdminDashboardPage.jsx
├─ System overview
├─ Statistics
├─ Quick actions
└─ System health

UserManagementPage.jsx
├─ List all users
├─ Create new user
├─ Edit user details
├─ Delete user
├─ Assign roles
└─ Verify accounts

ApplicationPage.jsx
├─ Pending account applications
├─ Review registrations
├─ Approve/reject
└─ (Replaces old verification page)

ReportsPage.jsx
├─ System-wide reports
├─ Attendance summaries
├─ Faculty reports
├─ Student reports
└─ Export options

SystemLogsPage.jsx
├─ System audit trail
├─ API logs
├─ Error logs
├─ User activity
└─ Filter/search

AdminLayout.jsx
├─ Admin header + sidebar + footer
└─ Wrapper for admin pages
```

#### **LandingPage/**
```
LandingPage.jsx
├─ Public home page
├─ Login form
├─ System info
└─ Links to register

RegistrationPage.jsx
├─ Student registration form
├─ Faculty registration form
├─ Form validation
├─ Facial recognition capture
└─ Submit registration
```

#### **ZCommon/** (Rename to Common/)
```
Why "Z" prefix?
├─ Alphabetically at end (for organization)
├─ But it's confusing!
└─ Should be renamed to "Common"

Header.jsx
├─ Logo/branding
├─ Navigation menu
├─ User dropdown
├─ Notifications bell
└─ Logout button

Footer.jsx
├─ Copyright info
├─ Links
└─ Contact info

MyProfilePage.jsx
├─ Edit user profile
├─ Change password
├─ Upload profile photo
└─ View personal info

HelpSupportPage.jsx
├─ FAQ
├─ Contact support
├─ Documentation links
└─ Video tutorials

SettingsPage.jsx
├─ System settings
├─ Notification preferences
├─ Language/theme
└─ Privacy settings

NotificationsPage.jsx
├─ View all notifications
├─ Mark as read
├─ Filter by type
└─ Notification history
```

---

## 🚀 How to Use This Organization

### Finding Files

**Question**: "How do I find the attendance tracking code?"

Old way (😞 Hard):
```
Search everywhere...
├─ Is it in app.py? (search 1907 lines)
├─ Is it in a component? (search 50+ files)
├─ Is it in a script? (search backend/)
└─ Arrgh! 🤦
```

New way (😊 Easy):
```
1. Check this manifest
2. Go to backend/core/attendance.py
3. Or frontend/services/attendanceService.js
4. Done!
```

### Quick Reference

**Backend Structure**:
```
Logic/Business rules → backend/core/
API endpoints → backend/api/
Database stuff → backend/database/
Dev scripts → backend/scripts/
Tests → backend/tests/
```

**Frontend Structure**:
```
Full pages → frontend/src/pages/
Reusable components → frontend/src/components/
Data fetching → frontend/src/services/
App state → frontend/src/context/
Styles → frontend/src/styles/
Helper functions → frontend/src/utils/
```

---

## 📝 Files to DELETE/REMOVE

| File | Why | When |
|------|-----|------|
| **backend/package.json** | Node project doesn't belong in backend | Delete now |
| **backend/node_modules/** | Dependency of above | Delete now |
| **frontend/components/Eme.txt** | Random placeholder | Delete now |
| **frontend/assets/emeee.txt** | Random placeholder | Delete now |
| **testfile/BSIT4A.pdf** | Test only, not in production | Delete before deployment |
| **00_FINAL_SUMMARY.md** | Confusing name, numbered | Archive or merge with README |
| **INDEX.md** | Duplicate of MASTER_DOCUMENTATION_INDEX.md | Delete one |

---

## 📝 Files to RENAME

| Current Name | New Name | Reason |
|--------------|----------|--------|
| **frontend/components/ZCommon/** | **frontend/components/Common/** | Remove confusing Z prefix |
| **0_FINAL_SUMMARY.md** | **SUMMARY.md** or merge into README | Numbered names confusing |
| **PROJECT_FILE_DIRECTORY.md** | **FILE_MANIFEST.md** | Clearer name |

---

## 🎯 Next Steps for Organization

### Phase 1: Immediate Cleanup (1 hour)
- [ ] Delete backend/package.json
- [ ] Delete backend/node_modules/
- [ ] Delete Eme.txt, emeee.txt from frontend
- [ ] Rename ZCommon/ → Common/
- [ ] Delete testfile/BSIT4A.pdf from production branches

### Phase 2: Backend Refactor (3-4 hours)
- [ ] Create backend/core/ folder
- [ ] Move face logic to backend/core/face_recognition.py
- [ ] Move PDF logic to backend/core/pdf_parser.py
- [ ] Create backend/api/ folder
- [ ] Separate endpoint groups into files
- [ ] Update imports in app.py
- [ ] Test everything still works

### Phase 3: Frontend Refactor (4-5 hours)
- [ ] Create frontend/src/services/ (API calls)
- [ ] Create frontend/src/utils/ (helpers)
- [ ] Create frontend/src/context/ (state management)
- [ ] Move components into logical folders
- [ ] Rename components/ to components/views/
- [ ] Add components/common/ for reusable

### Phase 4: Documentation Cleanup (2 hours)
- [ ] Consolidate docs to DOCUMENTATION/
- [ ] Create DOCUMENTATION/REFERENCE/ for guides
- [ ] Make clear what each doc is for
- [ ] Update README to point to docs
- [ ] Archive old docs

---

**Document Version**: 1.0  
**Created**: January 26, 2026  
**Next Review**: After file cleanup

