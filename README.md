# 🎓 FRAMES: Facial Recognition & Attendance Monitoring System

**Capstone Project** | Technological University of the Philippines - Manila  
**Date**: January 2026 | **Status**: 70% Complete (Hand Gesture + Kiosk Remaining)

---

## 📖 Quick Navigation

### 🚀 **Getting Started** (Start Here!)
1. [Project Overview](docs/START_HERE.md) - What is FRAMES?
2. [Setup Guide](docs/SETUP_CHECKLIST.md) - Run locally in 5 minutes
3. [Architecture](docs/PROJECT_ANALYSIS_AND_ARCHITECTURE.md) - How the system works

### 📚 **Documentation**
- [Capstone Context](docs/CAPSTONE_PROJECT_CONTEXT.md) - Beginner-friendly explanation
- [Features Checklist](docs/FINAL_IMPLEMENTATION_CHECKLIST.md) - What's done vs. pending
- [File Organization](docs/FILE_MANIFEST.md) - Where everything is located
- [Before/After Changes](docs/BEFORE_AFTER_COMPARISON.md) - What changed in v1.0

---

## 🏗️ Project Structure

```
Capstoneee/
├── docs/                          # All documentation (START HERE!)
├── backend/                       # Flask Python API
│   ├── core/                     # Business logic (face, PDF parsing)
│   ├── api/                      # API endpoints
│   ├── scripts/                  # Dev utilities (migrate, seed, clean)
│   ├── tests/                    # Unit tests
│   └── uploads/                  # Temp file storage
├── frontend/                     # React Web Dashboard
│   └── src/
│       ├── components/          # React pages/components
│       ├── services/            # API calls
│       ├── context/             # State management
│       └── utils/               # Helper functions
├── SQL/                         # Database files & schema
└── README.md                    # This file
```

---

## ⚡ Quick Start (5 minutes)

### Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate              # Windows
source venv/bin/activate             # Mac/Linux
pip install -r requirements.txt
python scripts/migrate_db.py         # Setup database
python app.py                        # Start on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start                            # Runs on http://localhost:3000
```

### Verify Database Connection
```bash
cd backend
python scripts/test_db.py
```

---

## ✅ What's Implemented (70%)

| Feature | Status | Location |
|---------|--------|----------|
| Facial Recognition | ✅ | backend/core/ |
| Student Dashboard | ✅ | frontend/src/components/StudentDashboard/ |
| Faculty Dashboard | ✅ | frontend/src/components/FacultyDashboard/ |
| Admin Dashboard | ✅ | frontend/src/components/AdminDashboard/ |
| PDF Schedule Upload | ✅ | backend/api/, frontend upload view |
| Reports (PDF/CSV) | ✅ | backend/api/ |
| Database (MySQL) | ✅ | Aiven Cloud |
| Role-Based Access | ✅ | Full system |

---

## 🔧 What's Remaining (Critical - 30%)

| Feature | Priority | Est. Time |
|---------|----------|-----------|
| Hand Gesture Recognition (MediaPipe) | 🔴 CRITICAL | 3-4 days |
| Kiosk Interface (Feedback Screens) | 🔴 CRITICAL | 2-3 days |
| Raspberry Pi Integration | 🔴 CRITICAL | 2-3 days |
| Real-time Dashboard Updates | 🟡 IMPORTANT | 1-2 days |
| Break In/Out UI (Green/Yellow Status) | 🟡 IMPORTANT | 1 day |

---

## 📞 Sample Test Users

```
Admin User:
Email: admin@tup.edu.ph
Password: pass123

Faculty (Department Head):
Email: rose@gmail.com
Password: 123

Student User:
Email: memedq@gmail.co
Password: password
```

---

## 🚀 Architecture Overview

```
Classroom Entrance (Raspberry Pi)
         ↓ WiFi
Flask Backend API (localhost:5000)
         ↓ SSL/TLS
Aiven MySQL Database (Cloud)
         ↓ WiFi
React Dashboard (localhost:3000)
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests  
cd frontend
npm test

# Database connection
cd backend
python scripts/test_db.py
```

---

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| [START_HERE.md](docs/START_HERE.md) | Project overview & objectives |
| [CAPSTONE_PROJECT_CONTEXT.md](docs/CAPSTONE_PROJECT_CONTEXT.md) | Beginner-friendly explanation with terminology |
| [SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md) | Step-by-step installation guide |
| [PROJECT_ANALYSIS_AND_ARCHITECTURE.md](docs/PROJECT_ANALYSIS_AND_ARCHITECTURE.md) | Technical architecture & deployment |
| [FILE_MANIFEST.md](docs/FILE_MANIFEST.md) | File organization & purpose |
| [BEFORE_AFTER_COMPARISON.md](docs/BEFORE_AFTER_COMPARISON.md) | Changes in v1.0 |
| [FINAL_IMPLEMENTATION_CHECKLIST.md](docs/FINAL_IMPLEMENTATION_CHECKLIST.md) | Progress tracker |

---

## 🛠️ Common Commands

### Development
```bash
# Start backend (Terminal 1)
cd backend && python app.py

# Start frontend (Terminal 2)
cd frontend && npm start

# Database operations
cd backend
python scripts/migrate_db.py     # Add new tables
python scripts/seed_data.py      # Populate test data
python scripts/clean_data.py     # Clear test data
python scripts/rollback_db.py    # Revert migrations
```

### Git Workflow
```bash
git checkout -b feature/your-feature-name
git add .
git commit -m "Clear commit message"
git push -u origin feature/your-feature-name
# Create Pull Request on GitHub
```

---

## 🔐 Sample Test Credentials
