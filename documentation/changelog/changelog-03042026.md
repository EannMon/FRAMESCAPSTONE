# Changelog — March 4, 2026

**Branch:** `enhanced-optimization-security`  
**Date:** 2026-03-04  
**Author:** AI-assisted development session

---

## Summary

Frontend enhancements for student schedule and attendance history pages, crash fix for attendance history, face registration gate for department head, and comprehensive documentation additions.

---

## Changes

### 1. Backend — Student Schedule: Added `section` field (P1)

**File:** `backend/api/routers/student.py`

- Added `section` field to `ScheduleItem` Pydantic schema
- Updated `/schedule/{user_id}` endpoint to include `cls.section` in the response
- Dept heads, students, and faculty now receive class section info in schedule data

### 2. Frontend — Student Schedule Page: Enhanced Display (P1)

**File:** `frontend/src/components/StudentDashboard/SchedulePage.jsx`

- **12-Hour Time Format:** Added `formatTo12Hr()` helper to convert backend 24-hour time strings (e.g., `"22:45:00"`) to user-friendly 12-hour format (e.g., `"10:45 PM"`)
- **Professor Name:** Each class card now displays the assigned faculty member's name
- **Subject Code + Title:** Shows both the subject code (e.g., `IT302`) and full title instead of just the title
- **Section Display:** Shows the student's section for each enrolled class (e.g., `BSIT-4A`)
- **Room with Icon:** Room location displayed with map marker icon
- Fixed field name mismatches: `course_name` → `subject_title`, `room_name` → `room`
- Updated all three view modes (Today, This Week, Calendar) to use enhanced `ClassItem` component

### 3. Frontend — Attendance History Page: Crash Fix (P0)

**File:** `frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx`

**Root Cause:** The component was referencing `log.event_type` (from the old Flask API) but the new FastAPI backend returns `log.action`. Calling `.includes()` on `undefined` caused a fatal crash:
```
TypeError: Cannot read properties of undefined (reading 'includes')
    at AttendanceHistoryPage.jsx:468:70
```

**Fixes Applied:**
- `log.event_type` → `log.action` in all 6 occurrences (render, report generation, status mapping)
- `log.room_name` → `log.room` (matching new `AttendanceRecord` schema)
- `cls.course_name` → `cls.subject_title` (matching new `ScheduleItem` schema)
- `cls.room_name` → `cls.room` (matching new `ScheduleItem` schema)
- `foundClass.title` → `foundClass.subject_title` for subject matching
- Updated `parseTimeStr()` to handle both 24-hour (`"22:45:00"`) and 12-hour (`"07:00 AM"`) time formats
- Added `getActionStatus()` helper function for clean action-to-display mapping:
  - `ENTRY` / `BREAK_IN` → "PRESENT" (green)
  - `BREAK_OUT` → "ON BREAK" (warning/amber)
  - `EXIT` → "EXITED" (neutral/grey)
- Updated `LogStatusTag` component to use new action values instead of old event types
- Report generation now uses `getActionStatus()` for consistent status output

### 4. Frontend — Dept Head Dashboard: Face Registration Gate (P1)

**File:** `frontend/src/components/DeptHeadDashboard/DeptHeadDashboardPage.jsx`

- Added a prominent red warning banner when `faceRegistered === false`
- Banner explains that FRAMES requires facial recognition enrollment
- Includes a "Go to Settings" button that navigates to the settings page for face enrollment
- Banner appears below the welcome section and above all dashboard content
- Dashboard remains accessible (not fully blocked) but the warning is highly visible and action-oriented

### 5. Documentation — USB Webcam Migration Guide

**File:** `documentation/usbwebcam.md`

- Comprehensive research and plan for switching from Raspberry Pi Camera Module to USB webcam
- Cost comparison, resolution analysis, compatibility considerations
- Step-by-step migration instructions for OpenCV configuration changes
- Performance benchmarks and recommended webcam models

### 6. Documentation — Capstone FRAMES Analysis

**File:** `documentation/Capstone_FRAMES_Analysis.md`

- Full-stack technology analysis: frameworks, libraries, dependencies
- How each technology is applied in the project and why it was chosen
- Facial recognition pipeline deep-dive: embedding generation, storage, comparison
- Performance concepts: FPS, ms per frame, acceptable thresholds
- Competitor comparison: InsightFace vs alternatives, FastAPI vs Flask, React vs Angular/Vue
- Security and optimization strategies for production readiness
- Deployment architecture: Vercel (frontend), Render (backend), Aiven (PostgreSQL)

### 7. Documentation — Updated Data Dictionary

**File:** `documentation/database/FRAMES_Data_Dictionary.md`

- Updated to match current Aiven PostgreSQL DDL
- Added new tables: `support_tickets`, `user_settings`
- Added new enum: `ticketstatus`
- Updated `departments` table with `active_academic_year` and `active_semester` columns
- Updated `devices` table with `room_capacity` column
- Added existing indexes documentation
- Updated all field definitions to match live schema

---

## Files Modified

| File | Type | Change |
|------|------|--------|
| `backend/api/routers/student.py` | Backend | Added `section` to ScheduleItem |
| `frontend/src/components/StudentDashboard/SchedulePage.jsx` | Frontend | 12hr time, professor, code, section |
| `frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx` | Frontend | Crash fix: event_type→action, field mapping |
| `frontend/src/components/DeptHeadDashboard/DeptHeadDashboardPage.jsx` | Frontend | Face registration warning gate |
| `documentation/usbwebcam.md` | Docs | USB webcam migration guide |
| `documentation/Capstone_FRAMES_Analysis.md` | Docs | Comprehensive tech analysis |
| `documentation/database/FRAMES_Data_Dictionary.md` | Docs | Updated to live DDL |

---

## Testing Notes

- Student Schedule: Verify 12-hour format renders for classes with times like `22:45:00` → `10:45 PM`
- Attendance History: Verify page loads without crash, status tags show PRESENT/ON BREAK/EXITED correctly
- Dept Head Dashboard: Verify red banner appears when face not registered, disappears when registered
- API contract: `/api/student/schedule/{id}` now returns `section` field in each item
