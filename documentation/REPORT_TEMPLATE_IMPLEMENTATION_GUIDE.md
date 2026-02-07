# Report Template Implementation Guide

This guide details how to implement the standard **FRAMES Report Generator** in any React component. Following this guide ensures that all reports allow for consistent branding (Blue Theme), standard headers, and correct data formatting.

## 1. Import the Utility

Instead of using `jsPDF` directly, import the shared utility function. This utility handles all the complex PDF generation logic.

```javascript
// ✅ CORRECT
import { generateFramesPDF } from '../../utils/ReportGenerator';

// ❌ OLD WAY (Do not use)
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
```

## 2. Structure Your Data

The generator expects data in specific formats. You must transform your raw database data into a flat object structure before passing it to the generator.

### A. Report Info Object
This object defines the header and context of the PDF.

```javascript
const reportInfo = {
    title: "Faculty Attendance Performance", // Main Title (e.g., from select dropdown)
    type: "FACULTY REPORT",                  // Subtitle (Generic Type)
    
    // Category determines the 'Context Box' layout
    // Options: 'personal', 'class', 'system'
    category: 'system', 

    // Context object changes based on category
    context: {
        // If category is 'personal':
        // name: "John Doe", id: "FAC-001"
        
        // If category is 'class':
        // classCode: "CS101", section: "BSIT-4A"
        
        // If category is 'system':
        scope: "Computer Studies Department" 
    },

    dateRange: "November 2024" // String to display in the date box
};
```

### B. Table Data Array
The table data must be an array of objects where **Keys are Headers** and **Values are Cell Content**.

> **Tip:** The keys you use here will become the column headers in the PDF. Use "Upper Case" or "Title Case" for keys.

```javascript
const tableInput = rawData.map(item => ({
    "Student Name": item.name,           // Column 1
    "Section": item.section,             // Column 2
    "Status": item.status.toUpperCase(), // Column 3 (Used for color coding)
    "Time In": item.time_in,             // Column 4
    "Remarks": item.remarks              // Column 5
}));
```

## 3. Implementation Example

Here is a full example of a handler function within a React component.

```javascript
const handleGenerateReport = () => {
    // 1. Prepare the Data
    const tableInput = reportData.map(row => ({
        "Faculty": row.name,
        "Subject Load": `${row.units} Units`,
        "Attendance": `${row.attendance}%`,
        "Status": row.status // 'Late', 'Absent', 'Present'
    }));

    // 2. Call the Generator
    // define report attributes
    const reportInfo = {
        title: "Monthly Faculty Performance",
        type: "DEPARTMENT REPORT",
        category: "system",
        context: { scope: "College of Science" },
        dateRange: new Date().toLocaleDateString()
    };

    // 3. Execute
    generateFramesPDF(reportInfo, tableInput);
};
```

## 4. Automatic Color Coding
The utility automatically colors text in the **Status** column based on keywords:

*   **Red/Bold**: "Late", "Absent", "Risk", "Alert", "Warning"
*   **Green**: "Present", "On Time", "Good", "Excellent"

Ensure your data mapping for the standard "Status" or "Remarks" column uses these keywords for best visual results.
