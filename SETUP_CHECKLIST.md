# Setup Checklist - Faculty Upload Feature

## ✅ What Has Been Implemented

### Backend Changes
- [x] Added PDF parsing functions to `app.py`
  - `parse_schedule_pdf()` - Main PDF parser with multi-page support
  - `clean_section()` - Removes duplicate section names
  - `parse_time_slot()` - Parses day/time from PDF

- [x] Added new API endpoints
  - `POST /api/faculty/upload-schedule` - Upload and process COR PDF
  - `GET /api/faculty/upload-history/<faculty_id>` - View upload history

- [x] Database migration script (`migrate_db.py`)
  - Creates `FacultyScheduleUpload` table
  - Creates `Subjects` table (if not exists)
  - Adds `upload_id` to ClassSchedule
  - Inserts test cameras for Room 324 & 326

### Frontend Changes  
- [x] Updated `MyClassesPage.jsx`
  - New "Upload" view mode
  - File upload form with semester/year selection
  - Upload history table
  - Real-time upload status messages
  - Auto-refresh schedule after successful upload

- [x] Updated `MyClassesPage.css`
  - Upload section styling
  - Form input styles
  - Status badge styling
  - History table styling
  - Responsive mobile layout
  - Modal and message animations

### Documentation
- [x] Created `FACULTY_UPLOAD_GUIDE.md` with full feature documentation
- [x] Created `migrate_db.py` for database setup

---

## 🚀 Next Steps to Get Running

### Step 1: Run Database Migration
```bash
cd c:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
python migrate_db.py
```

**Expected Output:**
```
🔄 Running database migrations...
📋 Creating FacultyScheduleUpload table...
✅ FacultyScheduleUpload table created/verified
📋 Adding upload_id column to ClassSchedule...
✅ upload_id column added to ClassSchedule
📋 Creating Subjects table...
✅ Subjects table created/verified
🎥 Setting up test cameras...
✅ Room 324 camera configured
✅ Room 326 camera configured

✅ All migrations completed successfully!
```

### Step 2: Restart Backend Server
```bash
python app.py
```

### Step 3: Test the Feature
1. Log in as a faculty member
2. Navigate to "My Classes" → "Upload" tab
3. Select a test COR PDF file
4. Choose semester and academic year
5. Click "Upload Schedule"
6. Verify success message appears
7. Check upload history shows the file

---

## 📋 Feature Overview

### For Faculty
✅ Upload course PDF files (COR format)  
✅ Automatic course creation  
✅ Automatic student enrollment  
✅ View upload history with status  
✅ Track students created per upload  

### For Students  
✅ Accounts auto-created when enrolled  
✅ Default password set to surname  
✅ Can view their classes and download reports  
❌ Cannot upload schedules (removed as per requirements)  

### For System
✅ Automatic duplicate section name cleanup  
✅ Multi-page PDF support for student lists  
✅ Validation to prevent duplicate accounts  
✅ Course tracking with upload source  

---

## 🔧 Key Files Modified

### Backend
- `app.py` - Added PDF parsing functions and API endpoints
- `requirements.txt` - Verified pdfplumber is listed
- `migrate_db.py` - NEW database migration script

### Frontend
- `frontend/src/components/FacultyDashboard/MyClassesPage.jsx` - Added upload view
- `frontend/src/components/FacultyDashboard/MyClassesPage.css` - Added upload styles

### Documentation
- `FACULTY_UPLOAD_GUIDE.md` - Comprehensive feature guide

---

## 📊 Database Changes

### New Table: FacultyScheduleUpload
```sql
CREATE TABLE FacultyScheduleUpload (
    upload_id INT PRIMARY KEY,
    faculty_id INT NOT NULL,
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    semester VARCHAR(50),
    academic_year VARCHAR(20),
    uploaded_at DATETIME,
    status ENUM('Processing', 'Completed', 'Failed'),
    error_message TEXT
)
```

### Modified Table: ClassSchedule
```sql
ALTER TABLE ClassSchedule ADD COLUMN upload_id INT;
ALTER TABLE ClassSchedule ADD FOREIGN KEY (upload_id) 
REFERENCES FacultyScheduleUpload(upload_id);
```

### New Table: Subjects
```sql
CREATE TABLE Subjects (
    subject_code VARCHAR(50) PRIMARY KEY,
    subject_description VARCHAR(255),
    units INT,
    created_at DATETIME
)
```

### Test Cameras Inserted
- Room 324 (COS, Capacity: 40)
- Room 326 (COS, Capacity: 40)

---

## ⚠️ Important Reminders

1. **Run Migration First**: Must execute `migrate_db.py` before using upload feature
2. **Restart Backend**: Restart Flask server after migration
3. **Clear Browser Cache**: Ctrl+Shift+Delete to clear frontend cache
4. **PDF Format**: Ensure COR PDFs have proper table structure
5. **Test Cameras**: Room 324 & 326 are for testing only - actual cameras must be installed

---

## 🐛 Troubleshooting

### Migration Won't Run
- Check database connection in `db_config.py`
- Verify MySQL is running
- Check user has CREATE/ALTER permissions

### Upload Button Doesn't Work
- Verify backend is running on port 5000
- Check network tab in browser DevTools
- Look for CORS errors

### Students Not Creating
- Check TUPM ID format (must start with "TUPM-")
- Verify database has write permissions
- Check backend console for parsing errors

### PDF Parsing Fails
- Ensure PDF has tables (not scanned image)
- Check for unusual section name formats
- Try different PDF file

---

## 📞 Support

For issues or questions:
1. Check `FACULTY_UPLOAD_GUIDE.md` for detailed documentation
2. Review backend `app.py` logs for error messages
3. Check browser DevTools console for frontend errors
4. Verify database schema matches requirements

---

**Status**: ✅ Ready for Testing  
**Last Updated**: January 18, 2026  
**Version**: 1.0
