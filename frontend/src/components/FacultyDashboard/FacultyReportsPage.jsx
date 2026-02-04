import React, { useState } from 'react';
// import jsPDF from 'jspdf'; <-- Removed
// import autoTable from 'jspdf-autotable'; <-- Removed
import './FacultyReportsPage.css';

const FacultyReportsPage = () => {

    // ==========================================
    // 1. MOCK DATA (Updated for Specific Scenarios)
    // ==========================================

    // DATA A: Class Specific Logs (Students)
    const mockClassLogs = [
        { id: "2021-001", col1: "Terana, Angelica", col2: "BSIT 4A", status: "Present", col3: "08:55 AM", remarks: "On Time" },
        { id: "2021-002", col1: "Llana, Elena", col2: "BSIT 4A", status: "Present", col3: "09:00 AM", remarks: "On Time" },
        { id: "2021-003", col1: "Calingal, Karl", col2: "BSIT 4A", status: "Late", col3: "09:15 AM", remarks: "15 mins Late" },
        { id: "2021-004", col1: "Lungay, Emmanuel", col2: "BSIT 4A", status: "Present", col3: "08:45 AM", remarks: "Early Bird" },
        { id: "2021-005", col1: "Sablan, Mel", col2: "BSIT 4B", status: "Absent", col3: "--:--", remarks: "No Notification" },
        { id: "2021-006", col1: "Dela Cruz, Juan", col2: "BSIT 4B", status: "Alert", col3: "09:00 AM", remarks: "Break Abuse (>20mins)" },
        { id: "UNK-001", col1: "Unknown Individual", col2: "BSIT 4A", status: "Security", col3: "10:30 AM", remarks: "Unrecognized Face Detected" },
    ];

    // DATA B: Personal Faculty Logs (Self)
    const mockPersonalLogs = [
        { id: "LOG-001", col1: "Nov 15, 2024", col2: "CS101 (Room A-205)", status: "On Time", col3: "08:55 AM", remarks: "Started Early" },
        { id: "LOG-002", col1: "Nov 14, 2024", col2: "IT321 (Lab 2)", status: "Late", col3: "09:10 AM", remarks: "Instructor Delay (10m)" },
        { id: "LOG-003", col1: "Nov 13, 2024", col2: "CS101 (Room A-205)", status: "On Time", col3: "09:00 AM", remarks: "Regular Class" },
        { id: "LOG-004", col1: "Nov 12, 2024", col2: "Capstone (Room B-1)", status: "Late", col3: "01:15 PM", remarks: "Instructor Delay (15m)" },
        { id: "LOG-005", col1: "Nov 11, 2024", col2: "Consultation", status: "Present", col3: "08:00 AM", remarks: "Office Hours" },
    ];

    // ==========================================
    // 2. REPORT TYPES (Strictly based on your List)
    // ==========================================
    const reportOptions = [
        // --- CLASS SPECIFIC REPORTS ---
        {
            id: 'CLASS_MONTHLY',
            label: 'Monthly Attendance Trends (Class)',
            desc: 'Visual trend of improvement or decline; encourages reflection.',
            type: 'CLASS'
        },
        {
            id: 'CLASS_SEM',
            label: 'Semestral Report (Per Subject)',
            desc: 'Provides cumulative data per subject for academic reference.',
            type: 'CLASS'
        },
        {
            id: 'CLASS_OVERALL',
            label: 'Overall Semestral Summary',
            desc: 'Consolidates all subjects for holistic engagement assessment.',
            type: 'CLASS'
        },
        {
            id: 'CLASS_LATE',
            label: 'Late Arrival Report',
            desc: 'Monitors frequency and duration of lateness for punctuality.',
            type: 'CLASS'
        },
        {
            id: 'CLASS_CONSISTENCY',
            label: 'Personal Consistency Index (Student)',
            desc: 'AI-generated metric predicting absence trends based on attendance regularity.',
            type: 'CLASS'
        },
        {
            id: 'ABSENCE_SUM',
            label: 'Absence Summaries per Section',
            desc: 'Quantifies absences for easier grading and participation assessment.',
            type: 'CLASS'
        },
        {
            id: 'BREAK_DURATION',
            label: 'Break Duration Analysis',
            desc: 'Detects patterns of excessive or frequent breaks among students.',
            type: 'CLASS'
        },
        {
            id: 'PUNCTUALITY_INDEX',
            label: 'Punctuality Index per Section',
            desc: 'Ranks student punctuality using time-in differentials relative to scheduled start times.',
            type: 'CLASS'
        },
        {
            id: 'UNRECOGNIZED_LOGS',
            label: 'Unrecognized Individual Logs',
            desc: 'Lists unknown individuals detected by the camera, enhancing classroom security.',
            type: 'CLASS'
        },
        {
            id: 'EARLY_EXITS',
            label: 'Early Exits Report',
            desc: 'Identifies students leaving before class ends—useful for participation grading.',
            type: 'CLASS'
        },
        {
            id: 'BREAK_ABUSE',
            label: 'Break Abuse / Extended Break Report',
            desc: 'Detects students failing to return or exceeding break limits.',
            type: 'CLASS'
        },
        {
            id: 'MISSED_ATTENDANCE',
            label: 'Missed Attendance but Present in BreakLogs',
            desc: 'Catches inconsistencies where students skip logging attendance but use break features.',
            type: 'CLASS'
        },
        {
            id: 'PARTICIPATION_INSIGHT',
            label: 'Class Participation Consistency Insight',
            desc: 'AI-computed stability index showing class engagement trends across sessions.',
            type: 'CLASS'
        },

        // --- PERSONAL FACULTY REPORTS ---
        {
            id: 'PERSONAL_DAILY',
            label: 'Daily Attendance per Subject',
            desc: 'Tracks presence, lateness, and breaks for each class session.',
            type: 'PERSONAL'
        },
        {
            id: 'PERSONAL_WEEKLY',
            label: 'Weekly Attendance Summary',
            desc: 'Summarizes present/absent/late counts; promotes accountability.',
            type: 'PERSONAL'
        },
        {
            id: 'PERSONAL_MONTHLY',
            label: 'Monthly Attendance Trends (Self)',
            desc: 'Visual trend of improvement or decline; encourages reflection.',
            type: 'PERSONAL'
        },
        {
            id: 'PERSONAL_SEM',
            label: 'Semestral Report (Per Subject - Self)',
            desc: 'Provides cumulative data per subject for academic reference.',
            type: 'PERSONAL'
        },
        {
            id: 'PERSONAL_OVERALL',
            label: 'Overall Semestral Summary (Self)',
            desc: 'Consolidates all subjects for holistic engagement assessment.',
            type: 'PERSONAL'
        },
        {
            id: 'HISTORY_30D',
            label: 'Attendance History Log (30 Days)',
            desc: 'Maintains recent timestamps; balances data retention and privacy.',
            type: 'PERSONAL'
        },
        {
            id: 'INSTRUCTOR_DELAY',
            label: 'Personal Late Arrival Report (Instructor Delay)',
            desc: 'Monitors frequency and duration of lateness for punctuality.',
            type: 'PERSONAL'
        },
        {
            id: 'PERSONAL_CONSISTENCY',
            label: 'Personal Consistency Index',
            desc: 'AI-generated metric predicting absence trends based on attendance regularity.',
            type: 'PERSONAL'
        }
    ];

    // --- STATES ---
    const [selectedReportId, setSelectedReportId] = useState('CLASS_MONTHLY');
    const [selectedSubject, setSelectedSubject] = useState('CS101');

    // Logic to switch data source
    const currentReport = reportOptions.find(r => r.id === selectedReportId);
    const isPersonal = currentReport?.type === 'PERSONAL';

    // Filter Mock Data for Demo Purposes
    const getDisplayData = () => {
        let data = isPersonal ? mockPersonalLogs : mockClassLogs;

        // Simple Filter Logic for specific report types to make demo realistic
        if (selectedReportId === 'UNRECOGNIZED_LOGS') return data.filter(d => d.status === 'Security');
        if (selectedReportId === 'CLASS_LATE' || selectedReportId === 'INSTRUCTOR_DELAY') return data.filter(d => d.status === 'Late');
        if (selectedReportId === 'BREAK_ABUSE') return data.filter(d => d.status === 'Alert');

        return data; // Default return all
    };

    const displayData = getDisplayData();

    // --- PDF GENERATOR ---
    const handleDownloadPDF = () => {
        // 1. Map Data for Report
        const tableInput = displayData.map(row => {
            if (isPersonal) {
                return {
                    "Date": row.col1,
                    "Subject/Room": row.col2,
                    "Status": row.status.toUpperCase(),
                    "Time In": row.col3,
                    "Remarks": row.remarks
                };
            } else {
                return {
                    "Student Name": row.col1,
                    "Section": row.col2,
                    "Status": row.status.toUpperCase(),
                    "Time In/Out": row.col3,
                    "Remarks": row.remarks
                };
            }
        });

        // 2. Generate PDF using Shared Utility (Blue Theme)
        import('../../utils/ReportGenerator').then(({ generateFramesPDF }) => {
            generateFramesPDF({
                title: currentReport.label,
                type: isPersonal ? "PERSONAL FACULTY REPORT" : "CLASS MONITORING REPORT",
                category: isPersonal ? 'personal' : 'class',
                context: isPersonal
                    ? { name: "Faculty User", id: "FAC-SELF" } // Could be dynamic based on user prop
                    : { classCode: selectedSubject, section: "BSIT 4A" },
                dateRange: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }, tableInput);
        });
    };

    return (
        <div className="fac-reports-container fade-in">

            {/* HEADER & CONTROLS */}
            <div className="fac-reports-header">

                <div className="fac-control-group">
                    <label>Select Report Type</label>
                    <select
                        className="fac-select"
                        value={selectedReportId}
                        onChange={(e) => setSelectedReportId(e.target.value)}
                    >
                        <optgroup label="Class Specific Reports (Students)">
                            {reportOptions.filter(r => r.type === 'CLASS').map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Personal Faculty Reports (Self)">
                            {reportOptions.filter(r => r.type === 'PERSONAL').map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </optgroup>
                    </select>

                    {/* Show Subject Filter ONLY for Class Reports */}
                    {!isPersonal && (
                        <div style={{ marginTop: '15px' }}>
                            <label>Filter Subject</label>
                            <select
                                className="fac-select"
                                style={{ width: '100%' }}
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                <option value="CS101">CS101 - Computer Science 101</option>
                                <option value="IT321">IT321 - Info Assurance</option>
                                <option value="CAPSTONE">Capstone Project 2</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="fac-report-info">
                    <i className={`fas ${isPersonal ? 'fa-user-lock' : 'fa-chalkboard-teacher'}`}></i>
                    <div className="info-content">
                        <h4>{currentReport.label}</h4>
                        <p>{currentReport.desc}</p>

                        {/* Dynamic Tag based on Type */}
                        {isPersonal ? (
                            <span className="personal-tag">
                                <i className="fas fa-lock"></i> Private Faculty Record
                            </span>
                        ) : (
                            <span className="class-tag">
                                <i className="fas fa-users"></i> Class Monitoring
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="fac-table-card">
                <div className="fac-card-header">
                    <h3>
                        {isPersonal ? "My Personal Logs" : `Student List: ${selectedSubject}`}
                    </h3>
                    <button className="btn-export" onClick={handleDownloadPDF}>
                        <i className="fas fa-file-pdf"></i> Generate Official Report
                    </button>
                </div>

                <div className="fac-table-wrapper">
                    <table className="fac-table">
                        <thead>
                            {/* DYNAMIC HEADERS */}
                            {isPersonal ? (
                                <tr>
                                    <th>Date</th>
                                    <th>Subject / Room</th>
                                    <th>Status</th>
                                    <th>Time In</th>
                                    <th>Details / Delay</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>Student Name</th>
                                    <th>Section</th>
                                    <th>Status</th>
                                    <th>Time In / Out</th>
                                    <th>Remarks</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {displayData.length > 0 ? (
                                displayData.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{row.col1}</div>
                                        </td>
                                        <td>{row.col2}</td>
                                        <td>
                                            <span className={`status-pill ${row.status === 'Late' ? 'late' :
                                                row.status === 'Absent' ? 'absent' :
                                                    row.status === 'Alert' || row.status === 'Security' ? 'alert' : 'present'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td>{row.col3}</td>
                                        <td className="remarks-text">
                                            {row.remarks}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                        No records found for this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FacultyReportsPage;