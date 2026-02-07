# FRAMES Report Template & Implementation Guide

This document serves as the standard operating procedure for implementing PDF reports across the FRAMES system. It is designed for developers working on Student, Faculty, and Admin modules.

## 1. Visual Reference (The Sandbox)

Before coding, you can check what the reports look like and see the available templates.

-   **Access**: Go to `http://localhost:3000/test-pdf`
-   **Usage**: Select your module (e.g., FACULTY, STUDENT) and specific report type from the dropdown. Click **"Generate"** to see the preview.
-   **Purpose**: Use this to confirm which template suits your feature requirements.

---

## 2. Integration Guide

We have a shared utility: `src/utils/ReportGenerator.js`. **Do not write your own jsPDF code.** Use this wrapper to ensure consistent branding (Colors, Header, Layout).

### Step 1: Import the Utility
Add this to your component file (e.g., `MyClassesPage.jsx`):
```javascript
import { generateFramesPDF } from '../../utils/ReportGenerator';
```

### Step 2: Prepare Your Data
The generator prints whatever keys you give it. You must map your raw database data to "Clean Headers".

**Example Data Mapping:**
```javascript
// Database Data
const dbData = [
  { id: 101, user_lastname: "Doe", user_firstname: "John", time_log: "08:05", status: "LATE" }
];

// Formatted for Report (Do this before calling generator)
const tableInput = dbData.map(row => ({
  "Student Name": `${row.user_lastname}, ${row.user_firstname}`,
  "Time In": row.time_log,
  "Status": row.status.toUpperCase(), // Capitalize for consistency
  "Remarks": row.time_log > "08:00" ? "Late" : "On Time"
}));
```

### Step 3: Implement by Module

Find your role below and copy the snippet.

#### 👩‍🎓 Student Developers (e.g., `AttendanceHistoryPage.jsx`)
*Use this for personal history reports.*

```javascript
const handleExportHistory = () => {
    generateFramesPDF({
        title: "My Attendance Record",
        type: "PERSONAL HISTORY",         
        category: "personal",             // 'personal' removes class specific fields
        context: { 
            name: currentUser.fullName,   // Get from Auth Context
            id: currentUser.studentId 
        },
        dateRange: "Semestral 2024-2025"
    }, tableInput); 
};
```

#### 👨‍🏫 Faculty Developers (e.g., `FacultyReportsPage.jsx`)
*Scenario A: Class List / Monthly Summary*
```javascript
generateFramesPDF({
    title: "Monthly Class Summary",
    type: "CLASS REPORT",
    category: "class",
    context: { 
        classCode: selectedSubject,   // e.g., "IT 302"
        section: selectedSection      // e.g., "BSIT-4A"
    },
    dateRange: "October 2024"
}, classDataMapped);
```

*Scenario B: Break Abuse / Late Reports*
```javascript
generateFramesPDF({
    title: "Break Abuse Report",
    type: "CLASS BEHAVIOR REPORT",
    category: "class",
    context: { classCode: "IT 302", section: "BSIT-4A" },
    dateRange: "Today"
}, breakAbuseData);
```

#### 🏢 Dept Head / Admin Developers (e.g., `SystemLogsPage.jsx`)
*Use for audits, logs, and high-level summaries.*

```javascript
generateFramesPDF({
    title: "Security Access Logs",
    type: "SYSTEM AUDIT",
    category: "system",               // 'system' uses generic scope
    context: { 
        scope: "All Entry Points" 
    },
    dateRange: "Nov 1 - Nov 30"
}, securityLogData);
```

---

## 3. Configuration Reference

| Property | Value Options | Effect |
| :--- | :--- | :--- |
| `title` | String | The main large header text. |
| `type` | String | Subtitle (e.g., "MONTHLY REPORT"). |
| `category` | `'personal'` | Shows Name & ID in header box. |
| | `'class'` | Shows Class Code & Section in header box. |
| | `'system'` | Shows Scope in header box. |
| `context` | Object | Data to fill the box fields (see Examples above). |

## 4. Troubleshooting
- **Logo Missing?** We switched to a clean Navy Blue banner strip for professionalism. No image file is required.
- **Columns Weird?** Ensure your `tableInput` objects have the keys exactly as you want them to appear in the PDF header.
