import React, { useState } from 'react';
import { generateFramesPDF } from '../utils/ReportGenerator';
import './TestPDFPage.css';

const TestPDFPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedReportId, setSelectedReportId] = useState('CLASS_MONTHLY');
    const [pdfPreview, setPdfPreview] = useState(null);

    // ==========================================
    // 1. COMPREHENSIVE REPORT CATALOG
    // ==========================================
    const reportCatalog = [
        // --- FACULTY: CLASS REPORTS ---
        { id: 'CLASS_MONTHLY', category: 'FACULTY_CLASS', label: 'Monthly Attendance Trends (Class)', contextType: 'class' },
        { id: 'CLASS_SEM', category: 'FACULTY_CLASS', label: 'Semestral Summary (Subject)', contextType: 'class' },
        { id: 'CLASS_LATE', category: 'FACULTY_CLASS', label: 'Late Arrival Report', contextType: 'class' },
        { id: 'BREAK_ABUSE', category: 'FACULTY_CLASS', label: 'Break Abuse / Extended Break', contextType: 'class' },
        { id: 'ABSENCE_SUM', category: 'FACULTY_CLASS', label: 'Absence Summaries per Section', contextType: 'class' },
        { id: 'UNRECOGNIZED_LOGS', category: 'FACULTY_CLASS', label: 'Unrecognized Individual Logs', contextType: 'class' },

        // --- FACULTY: PERSONAL REPORTS ---
        { id: 'PERSONAL_DAILY', category: 'FACULTY_PERSONAL', label: 'My Daily Attendance', contextType: 'personal_faculty' },
        { id: 'PERSONAL_WEEKLY', category: 'FACULTY_PERSONAL', label: 'My Weekly Summary', contextType: 'personal_faculty' },
        { id: 'INSTRUCTOR_DELAY', category: 'FACULTY_PERSONAL', label: 'My Late Arrivals (Instructor Delay)', contextType: 'personal_faculty' },
        { id: 'PERSONAL_CONSISTENCY', category: 'FACULTY_PERSONAL', label: 'My Consistency Index', contextType: 'personal_faculty' },

        // --- DEPT HEAD ---
        { id: 'FAC_PERFORMANCE', category: 'DEPT_HEAD', label: 'Faculty Attendance Performance', contextType: 'dept' },
        { id: 'ROOM_OCCUPANCY', category: 'DEPT_HEAD', label: 'Room Utilization & Occupancy', contextType: 'dept_room' },

        // --- ADMIN ---
        { id: 'SEC_LOGS', category: 'ADMIN', label: 'Security & Access Logs', contextType: 'system' },
        { id: 'SPOOF_ATTEMPTS', category: 'ADMIN', label: 'Spoofing Attempt Analysis', contextType: 'system' },
        { id: 'SYSTEM_HEALTH', category: 'ADMIN', label: 'System Health Status', contextType: 'system' },

        // --- STUDENT ---
        { id: 'STUDENT_HISTORY', category: 'STUDENT', label: 'My Attendance History', contextType: 'personal_student' },
    ];

    // ==========================================
    // 2. MOCK DATA GENERATOR
    // ==========================================
    const generateMockData = (reportId) => {
        // A. FACULTY CLASS REPORTS
        if (['CLASS_MONTHLY', 'CLASS_SEM', 'ABSENCE_SUM'].includes(reportId)) {
            return [
                { Student_Name: "Terana, Angelica", Section: "BSIT 4A", Status: "Present", Attendance_Rate: "95%", Remarks: "Good" },
                { Student_Name: "Llana, Elena", Section: "BSIT 4A", Status: "Present", Attendance_Rate: "92%", Remarks: "Good" },
                { Student_Name: "Calingal, Karl", Section: "BSIT 4A", Status: "Risk", Attendance_Rate: "75%", Remarks: "Needs Attention" },
                { Student_Name: "Sablan, Mel", Section: "BSIT 4A", Status: "Absent", Attendance_Rate: "60%", Remarks: "Critical" },
            ];
        }
        if (reportId === 'CLASS_LATE' || reportId === 'INSTRUCTOR_DELAY') {
            return [
                { Name: "Calingal, Karl", Date: "2024-11-01", Time_In: "09:15 AM", Late_Duration: "15 mins", Remarks: "Traffic" },
                { Name: "Sablan, Mel", Date: "2024-11-02", Time_In: "09:30 AM", Late_Duration: "30 mins", Remarks: "Overslept" },
            ];
        }
        if (reportId === 'BREAK_ABUSE') {
            return [
                { Name: "Dela Cruz, Juan", Break_Start: "10:00 AM", Break_End: "---", Duration: "> 45m", Status: "Abuse" },
                { Name: "Santos, Maria", Break_Start: "10:05 AM", Break_End: "10:45 AM", Duration: "40m", Status: "Warning" },
            ];
        }
        if (reportId === 'UNRECOGNIZED_LOGS' || reportId === 'SPOOF_ATTEMPTS') {
            return [
                { Timestamp: "10:15:22", Location: "Gate 1", Event: "Unknown Face", Confidence: "45%", Snapshot: "View" },
                { Timestamp: "11:05:00", Location: "Room 205", Event: "Liveness Fail", Confidence: "88%", Snapshot: "View" },
            ];
        }

        // B. FACULTY PERSONAL
        if (['PERSONAL_DAILY', 'PERSONAL_WEEKLY', 'PERSONAL_CONSISTENCY'].includes(reportId)) {
            return [
                { Date: "Nov 1, 2024", Subject: "CS101", Time_In: "08:50 AM", Status: "Present", Remarks: "Early" },
                { Date: "Nov 2, 2024", Subject: "IT321", Time_In: "09:10 AM", Status: "Late", Remarks: "Traffic" },
                { Date: "Nov 3, 2024", Subject: "CS101", Time_In: "09:00 AM", Status: "Present", Remarks: "On Time" },
            ];
        }

        // C. DEPT HEAD
        if (reportId === 'FAC_PERFORMANCE') {
            return [
                { Faculty: "Mr. Smith", Subject_Load: "5", Attendance: "98%", Average_Lates: "0", Status: "Excellent" },
                { Faculty: "Ms. Doe", Subject_Load: "6", Attendance: "85%", Average_Lates: "2/week", Status: "Warning" },
            ];
        }
        if (reportId === 'ROOM_OCCUPANCY') {
            return [
                { Room: "Lab 1", Capacity: "40", Current: "35", Utilization: "87%", Status: "Normal" },
                { Room: "Lab 2", Capacity: "30", Current: "45", Utilization: "150%", Status: "Overcrowded" },
            ];
        }

        // D. STUDENT
        if (reportId === 'STUDENT_HISTORY') {
            return [
                { Date: "Oct 15", Class: "CS101", Status: "Present", Time: "09:00", Remarks: "-" },
                { Date: "Oct 17", Class: "CS101", Status: "Absent", Time: "--:--", Remarks: "Sick" },
                { Date: "Oct 20", Class: "CS101", Status: "Late", Time: "09:20", Remarks: "Rain" },
            ];
        }

        // Default Fallback
        return [
            { Info: "No specific mock data for this ID yet", Status: "Pending" }
        ];
    };

    const handleGenerate = async () => {
        const selectedReport = reportCatalog.find(r => r.id === selectedReportId);
        const mockData = generateMockData(selectedReportId);

        // BUILD CONTEXT
        let context = {};
        if (selectedReport.contextType === 'class') {
            context = { classCode: "CS101", section: "BSIT-4A" };
        } else if (selectedReport.contextType === 'personal_faculty') {
            context = { name: "Prof. Dela Cruz", id: "FAC-009" };
        } else if (selectedReport.contextType === 'personal_student') {
            context = { name: "Mendoza, User 5", id: "2023-1005" };
        } else if (selectedReport.contextType.includes('dept')) {
            context = { scope: "CCIS Department" };
        } else {
            context = { scope: "System Wide" };
        }

        const reportInfo = {
            title: selectedReport.label,
            type: selectedReport.category.replace('_', ' ') + " REPORT",
            category: selectedReport.contextType.includes('personal') ? 'personal' :
                selectedReport.contextType.includes('class') ? 'class' : 'system',
            context: context,
            dateRange: "Nov 1 - Nov 30, 2024",
            generatedBy: "Test Admin"
        };

        const url = await generateFramesPDF(reportInfo, mockData, 'view');
        setPdfPreview(url);
    };

    // Filter list
    const filteredOptions = selectedCategory === 'ALL'
        ? reportCatalog
        : reportCatalog.filter(r => r.category.includes(selectedCategory));

    return (
        <div className="test-pdf-container">
            <div className="test-card" style={{ maxWidth: '800px' }}>
                <h1>FRAMES Report Templates</h1>
                <p>Comprehensive sandbox for all system report types.</p>

                {/* 1. FILTER CATEGORY */}
                <div className="controls-group">
                    <label>Module Scope:</label>
                    <div className="btn-group">
                        {['ALL', 'FACULTY', 'DEPT', 'ADMIN', 'STUDENT'].map(cat => (
                            <button
                                key={cat}
                                className={`filter-btn ${selectedCategory.includes(cat) || (cat === 'ALL' && selectedCategory === 'ALL') ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat === 'DEPT' ? 'DEPT_HEAD' : cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. SELECT SPECIFIC REPORT */}
                <div className="controls-group">
                    <label>Select Report Template:</label>
                    <select
                        className="main-select"
                        value={selectedReportId}
                        onChange={(e) => setSelectedReportId(e.target.value)}
                    >
                        {filteredOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>
                                [{opt.category}] {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="action-area">
                    <button className="generate-btn" onClick={handleGenerate}>
                        <i className="fas fa-file-pdf"></i> Generate Template Preview
                    </button>
                </div>

                {pdfPreview && (
                    <div className="pdf-preview-container">
                        <iframe src={pdfPreview} width="100%" height="100%" title="PDF Preview"></iframe>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestPDFPage;
