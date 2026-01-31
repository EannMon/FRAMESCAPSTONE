# Faculty Schedule Upload Feature - Implementation Guide

## Overview
This update implements the faculty schedule upload feature, allowing faculty members to upload PDF course schedules (COR) to automatically:
- Create courses in the system
- Enroll students automatically
- Create student accounts with default passwords
- Verify existing student accounts in the class

## Changes Made

### Backend (Python/Flask)

#### 1. New Database Tables
- **FacultyScheduleUpload**: Tracks all schedule uploads by faculty
  - Fields: upload_id, faculty_id, file_name, semester, academic_year, status, error_message
  - Automatically timestamps uploads

- **Subjects** (if not exists): Master list of subjects
  - Fields: subject_code (PK), subject_description, units

#### 2. New API Endpoints

**POST /api/faculty/upload-schedule**
- Upload COR PDF file
- Automatically parse and create classes
- Create/Update student accounts
- Parameters:
  - `file`: PDF file (multipart)
  - `faculty_id`: Faculty user_id
  - `semester`: "1st Semester", "2nd Semester", "Summer"
  - `academic_year`: e.g., "2024-2025"
- Returns: Upload confirmation with schedule/student creation counts

**GET /api/faculty/upload-history/<faculty_id>**
- Retrieve all uploads by a faculty member
- Shows upload history with status and schedule counts
- Returns: Array of upload records sorted by date (newest first)

#### 3. New Helper Functions

**parse_schedule_pdf(file, faculty_id)**
- Parses COR PDF with multi-page support
- Extracts: Schedule ID, Schedule Name, Subject, Section, Credit/Units, Day/Time, Venue
- Handles: Duplicate sections (e.g., "BSIT-BSIT-4A-M" → "BSIT-4A-M")
- Multi-page: Continues reading student lists across pages
- Returns: Parsed JSON with courses and enrolled students

**clean_section(section_str)**
- Removes duplicated section names
- Example: "BSIT-BSIT-4A-M" → "BSIT-4A-M"

**parse_time_slot(days_str, time_str)**
- Converts abbreviated day codes to full names
- Parses time ranges from PDF format

#### 4. Database Migrations
- Added `upload_id` column to ClassSchedule table
- Created FacultyScheduleUpload table
- Created Subjects table (if not exists)
- Inserted test cameras for Room 324 & 326

### Frontend (React)

#### 1. MyClassesPage.jsx Updates
- **New viewMode**: "upload" added alongside "list" and "calendar"
- **New UI Section**: Upload tab with:
  - PDF file picker
  - Semester selector
  - Academic Year input
  - Upload button with real-time feedback
  - Upload history table showing all uploaded files with status

#### 2. New State Variables
```javascript
const [selectedFile, setSelectedFile] = useState(null);
const [uploadedSchedules, setUploadedSchedules] = useState([]);
const [isUploading, setIsUploading] = useState(false);
const [uploadMessage, setUploadMessage] = useState('');
const [semester, setSemester] = useState('1st Semester');
const [academicYear, setAcademicYear] = useState('2024-2025');
```

#### 3. New Functions
- `handleFileSelect()`: File picker handler
- `handleUpload()`: Upload and process PDF
- `fetchUploadHistory()`: Load upload records
- `renderUploadView()`: Upload UI component

#### 4. Updated Buttons/Navigation
- Added "Upload" toggle button to view switcher
- Tab shows PDF upload section + history table

### CSS Styling

#### 1. New Upload View Styles
- `.upload-container`: Two-column grid layout
- `.upload-section`: Form section styling
- `.upload-btn`: Primary action button
- `.message`: Success/error feedback messages
- `.history-table`: Upload records table
- `.status`: Badge styling for Processing/Completed/Failed states

#### 2. Responsive Design
- Mobile-friendly layout adjustments
- Single column on tablets/phones
- Proper spacing and alignment

## Installation & Setup

### 1. Run Database Migration
```bash
cd backend
python migrate_db.py
```

### 2. Update Requirements (if needed)
The following packages are already in requirements.txt:
- `pdfplumber`: PDF parsing
- `bcrypt`: Password hashing
- `mysql-connector-python`: Database
- `flask`: Web framework

If missing, run:
```bash
pip install pdfplumber
```

### 3. Restart Backend Server
```bash
python app.py
```

### 4. Clear Browser Cache
Clear frontend cache to ensure new components load:
- Chrome: Ctrl+Shift+Delete → Clear browsing data
- Or use Hard Refresh: Ctrl+Shift+R

## PDF Format Requirements

The system expects COR (Class of Records) PDF files with the following structure:

### Page 1 Header Section
Contains course information in tabular format:
- Schedule ID
- Schedule Name (Section + Subject Code)
- Subject (Subject Code - Subject Name)
- Section (e.g., BSIT-4A-M)
- Day/Time (e.g., W 06:00PM-08:00PM)
- Venue (Room name or "Online")

### Multi-Page Student List
- Each page has numbered student entries
- Columns: Counter | TUPM ID | Student Name | Course | Remarks
- TUPM IDs start with "TUPM-"
- System automatically finds continuation pages and reads all students

## Student Account Auto-Creation

When a faculty uploads a schedule:

### If Student Doesn't Exist
- **New account created** with:
  - Default password = student's surname (lowercase)
  - Role = "student"
  - Email = TUPM-{id}@tup.edu.ph
  - Verification status = "Verified" (auto-approved)
  - Face status = "Not Registered"
  - Enrolled courses = Subject codes from uploaded schedule

### If Student Already Exists
- **Account updated** with:
  - New subject code added to enrolled_courses
  - Section updated to current schedule section
  - No duplicate account created

## Testing

### Test with Sample PDF
1. Navigate to MyClasses → Upload tab
2. Select a test COR PDF file
3. Choose semester and academic year
4. Click "Upload Schedule"
5. View success message with course/student counts
6. Check upload history table
7. Students should appear in student list view

### Test Cameras
- Room 324 and Room 326 are pre-configured
- Used for attendance tracking for "on-site" venues
- Online venues won't have camera tracking

## Troubleshooting

### PDF Parsing Issues
**Problem**: "Could not parse PDF"
**Solution**:
- Ensure PDF has tables in standard format
- Check PDF is not scanned image (OCR needed)
- Verify section names don't have unusual characters

### Student Not Creating
**Problem**: Students not added to database
**Solution**:
- Check student TUPM ID format (must start with "TUPM-")
- Verify database connection
- Check browser console for errors

### Upload Status Stuck on "Processing"
**Problem**: Upload shows processing but never completes
**Solution**:
- Check backend logs for parsing errors
- Verify database has FacultyScheduleUpload table
- Restart Flask server

### File Upload Fails
**Problem**: Upload button doesn't work
**Solution**:
- Ensure file is PDF format
- Check file size (< 10MB recommended)
- Try different PDF or browser

## Important Notes

### Rooms 324 & 326
- Pre-configured for testing
- Should have physical camera setup
- Will record attendance if venue matches
- Other rooms won't generate attendance reports

### Student Account Security
- Default password is surname (lowercase)
- Student should change password on first login
- Email auto-generated from TUPM ID

### Data Validation
- System validates section names (removes duplicates)
- Checks for duplicate TUPM IDs
- Verifies time slot parsing
- Cleans up student names automatically

## Future Enhancements

1. **Bulk Import**: Import multiple PDFs at once
2. **Schedule Verification**: Faculty review before confirming
3. **Student Notifications**: Email students their credentials
4. **Attendance Rules**: Define late/absent policies per course
5. **Grade Integration**: Link with grading system
6. **Conflict Detection**: Warn of room/time conflicts

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Production Ready
