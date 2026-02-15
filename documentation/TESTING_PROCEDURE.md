# FRAMES Testing Procedure
## Chapter 3 - Capstone Documentation

### System Overview
**FRAMES** (Facial Recognition and Attendance Monitoring with Embedded System): A Web-Based System with Hand Gesture Control using Raspberry Pi

---

## Testing Framework

This testing procedure follows:
- **ISO/IEC 25010** Quality Software Model
- **TUP Prototype Evaluation Instrument**

Individual role-based actions were tested under the same criteria to ensure uniformity of results.

---

## ISO/IEC 25010 Quality Characteristics Applied

| # | Characteristic | Sub-characteristics Tested | FRAMES Application |
|---|----------------|---------------------------|-------------------|
| 1 | **Functional Suitability** | Completeness, Correctness, Appropriateness | All features work as specified |
| 2 | **Performance Efficiency** | Time behavior, Resource utilization | Response times, system load |
| 3 | **Compatibility** | Co-existence, Interoperability | Browser compatibility, API integration |
| 4 | **Usability** | Learnability, Operability, Aesthetics | Intuitive interface, error handling |
| 5 | **Reliability** | Maturity, Availability, Fault tolerance | System uptime, error recovery |
| 6 | **Security** | Confidentiality, Integrity, Authenticity | Login security, data protection |
| 7 | **Maintainability** | Modularity, Testability | Code structure, debugging ease |
| 8 | **Portability** | Adaptability, Installability | Cross-platform deployment |

---

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrator | Full system access |
| **Dept. Head** | Department Head | Department-level management |
| **Faculty** | Instructor/Professor | Class and attendance management |
| **Student** | Enrolled learner | Personal attendance view |

---

## Testing Procedures by User Role

---

### 1. GENERAL USER WALKTHROUGH (All Roles)

#### Step 1: System Access
1. Open web browser (Chrome, Firefox, or Edge)
2. Navigate to `http://[server-ip]:3000`
3. The FRAMES login page should display

**Expected Result:** Login page loads within 3 seconds with proper branding

#### Step 2: Authentication
1. Enter valid credentials (TUPM ID and Password)
2. Click "Login" button
3. System authenticates and redirects to role-specific dashboard

**Expected Result:** Successful login within 2 seconds, proper dashboard display

#### Step 3: Dashboard Navigation
1. User sees role-appropriate dashboard
2. Sidebar menu shows accessible features
3. User can navigate between modules

**Expected Result:** All navigation links work, proper content loads

---

### 2. ADMIN TESTING PROCEDURES

#### 2.1 User Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Users module | User list displays |
| 2 | Add new user | Form appears, user created |
| 3 | Edit existing user | Modifications saved |
| 4 | Delete user | User removed from system |

#### 2.2 Department Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Departments | Department list displays |
| 2 | Add department | New department created |
| 3 | Assign Dept. Head | Head assigned to department |

#### 2.3 Device Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Devices | Kiosk device list displays |
| 2 | Register new device | Device added with room assignment |
| 3 | Check device status | Status shows ACTIVE/INACTIVE |

#### 2.4 System Reports
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Reports | Report filters display |
| 2 | Generate attendance report | Report generates with data |
| 3 | Export to PDF | PDF downloads with FRAMES branding |

---

### 3. DEPARTMENT HEAD TESTING PROCEDURES

#### 3.1 Faculty Monitoring
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View faculty list | Department faculty displayed |
| 2 | View faculty schedules | Class schedules shown |
| 3 | Check faculty attendance | Attendance stats visible |

#### 3.2 Department Reports
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Generate dept. report | Report with faculty data |
| 2 | Filter by date range | Filtered results display |
| 3 | Export report | PDF generated |

---

### 4. FACULTY TESTING PROCEDURES

#### 4.1 Schedule Upload
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to My Classes | Classes page loads |
| 2 | Click "Upload Schedule" | Upload modal appears |
| 3 | Select PDF file | File accepted (CRS schedule format) |
| 4 | Click Upload | Schedule parsed, subjects extracted |
| 5 | Verify subjects | Subject codes display correctly (not UNKNOWN) |

#### 4.2 Class Calendar Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View calendar | Monthly calendar displays |
| 2 | Select class sessions | Sessions highlighted |
| 3 | Update status (Cancel/Online) | Modal with reason dropdown appears |
| 4 | Save changes | Status saved to database |

**Reason Dropdown Options:**
- Health Related
- Natural Disaster
- Internet Connectivity
- Holiday
- Faculty Leave
- University Event
- Others

#### 4.3 Attendance Monitoring
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Attendance | Class list displays |
| 2 | Click "View Students" | Student list loads |
| 3 | View attendance details | Individual records shown |
| 4 | Export class report | PDF with FRAMES template |

---

### 5. STUDENT TESTING PROCEDURES

#### 5.1 Attendance View
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as student | Student dashboard loads |
| 2 | View attendance history | Personal attendance records |
| 3 | Check class schedule | Enrolled classes displayed |

#### 5.2 Face Registration
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access face registration | Camera interface loads |
| 2 | Capture facial data | Face detected and stored |
| 3 | Verify registration | Profile shows registered status |

---

### 6. RASPBERRY PI KIOSK TESTING PROCEDURES

#### 6.1 Device Startup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Power on Raspberry Pi | System boots |
| 2 | Kiosk mode launches | Attendance interface displays |
| 3 | Camera initializes | Face detection active |

#### 6.2 Facial Recognition
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Stand in front of camera | Face detected |
| 2 | Face processed | Identity matched |
| 3 | Attendance logged | Entry recorded with timestamp |

#### 6.3 Hand Gesture Control
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Show PEACE sign | Break entry/exit recorded |
| 2 | Show STOP gesture | Session ends |
| 3 | Invalid gesture | Error prompt displayed |

---

## Quality Criteria Evaluation Matrix

### Functional Suitability Testing

| Feature | Completeness | Correctness | Appropriateness |
|---------|-------------|-------------|-----------------|
| Login/Logout | ☐ | ☐ | ☐ |
| Schedule Upload | ☐ | ☐ | ☐ |
| Attendance Logging | ☐ | ☐ | ☐ |
| Report Generation | ☐ | ☐ | ☐ |
| Face Recognition | ☐ | ☐ | ☐ |
| Gesture Control | ☐ | ☐ | ☐ |

### Usability Testing

| Criteria | Rating (1-5) | Remarks |
|----------|-------------|---------|
| Learnability | ☐ | |
| Operability | ☐ | |
| User Error Protection | ☐ | |
| UI Aesthetics | ☐ | |
| Accessibility | ☐ | |

### Security Testing

| Test | Pass | Fail | N/A |
|------|------|------|-----|
| Unauthorized access blocked | ☐ | ☐ | ☐ |
| Session timeout works | ☐ | ☐ | ☐ |
| Password encryption | ☐ | ☐ | ☐ |
| Role-based access enforced | ☐ | ☐ | ☐ |

### Performance Testing

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Page load time | < 3s | | |
| Login response | < 2s | | |
| Face detection | < 1s | | |
| Report generation | < 5s | | |

---

## Test Environment Specifications

### Hardware Requirements
| Component | Specification |
|-----------|--------------|
| Raspberry Pi | Pi 4 Model B (4GB RAM) |
| Camera | USB Webcam / Pi Camera Module |
| Monitor | 7" or larger touchscreen |

### Software Requirements
| Component | Version |
|-----------|---------|
| Backend | Python 3.9+, FastAPI |
| Frontend | React 18, Vite |
| Database | PostgreSQL (Aiven Cloud) |
| OS (Kiosk) | Raspberry Pi OS |

### Network Requirements
- Stable internet connection
- Same network for kiosk and server
- Backend accessible on port 5000
- Frontend accessible on port 3000

---

## Evaluation Summary

| Quality Characteristic | Score (1-5) | Weighted Score |
|-----------------------|-------------|----------------|
| Functional Suitability | | |
| Performance Efficiency | | |
| Compatibility | | |
| Usability | | |
| Reliability | | |
| Security | | |
| Maintainability | | |
| Portability | | |
| **TOTAL** | | **/40** |

---

*This testing procedure follows ISO/IEC 25010 Quality Software Model and TUP Prototype Evaluation Instrument guidelines.*
