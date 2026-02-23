import React, { useState, useEffect } from 'react';
// import jsPDF from 'jspdf'; <-- Removed
// import autoTable from 'jspdf-autotable'; <-- Removed
import './FacultyReportsPage.css';
import FacultyReportModal from './FacultyReportModal';

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


    // --- STATES ---
    const [selectedReportId, setSelectedReportId] = useState('CLASS_MONTHLY');
    const [selectedSubject, setSelectedSubject] = useState('CS101');
    const [dateFilter, setDateFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [selectedSection, setSelectedSection] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modal & Generation States
    const [showModal, setShowModal] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Logic to switch data source
    const currentReport = reportOptions.find(r => r.id === selectedReportId);
    const isPersonal = currentReport?.type === 'PERSONAL';

    // Filter Mock Data for Demo Purposes
    const getDisplayData = () => {
        let data = isPersonal ? mockPersonalLogs : mockClassLogs;

        // 1. Filter by Section (Class Reports Only)
        if (!isPersonal && selectedSection !== 'All') {
            data = data.filter(d => d.col2 === selectedSection);
        }

        // 2. Filter by Status
        if (statusFilter !== 'All') {
            if (statusFilter === 'Issues') {
                data = data.filter(d => ['Late', 'Absent', 'Alert', 'Security'].includes(d.status));
            } else if (statusFilter === 'Present') {
                data = data.filter(d => ['Present', 'On Time'].includes(d.status));
            } else {
                data = data.filter(d => d.status === statusFilter);
            }
        }

        // 3. Simple Filter Logic for specific report types to make demo realistic
        if (selectedReportId === 'UNRECOGNIZED_LOGS') return data.filter(d => d.status === 'Security');
        if (selectedReportId === 'CLASS_LATE' || selectedReportId === 'INSTRUCTOR_DELAY') return data.filter(d => d.status === 'Late');
        if (selectedReportId === 'BREAK_ABUSE') return data.filter(d => d.status === 'Alert');

        return data; // Default return all
    };

    const displayData = getDisplayData();

    // --- REPORT GENERATION HANDLERS ---

    const handleGenerateClick = () => {
        setValidationError('');

        // 1. Validation Logic
        const requiresDate = ['PERSONAL_DAILY', 'CLASS_LATE'].includes(selectedReportId);
        // Add more logic here for which reports STRICTLY need a date

        if (requiresDate && !dateFilter) {
            setValidationError('Please select a specific date for this report type.');
            return;
        }

        // If Monthly report, strictly require month? (Optional rule)
        if (selectedReportId.includes('MONTHLY') && !monthFilter) {
            setValidationError('Please select a month for the monthly report.');
            return;
        }

        // Proceed to Modal
        setShowModal(true);
    };

    const handleConfirmGeneration = (format) => {
        if (format === 'PDF') {
            handleDownloadPDF();
        } else if (format === 'CSV') {
            handleDownloadCSV();
        }
        setShowModal(false);
    };

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
                    : { classCode: selectedSubject, section: selectedSection === 'All' ? 'All Sections' : selectedSection },
                dateRange: dateFilter || monthFilter || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }, tableInput);
        });
    };

    // --- CSV GENERATOR ---
    const handleDownloadCSV = () => {
        // 1. Map Data for Report
        const tableInput = displayData.map(row => {
            if (isPersonal) {
                return {
                    "Date": row.col1,
                    "Subject_Room": row.col2,
                    "Status": row.status.toUpperCase(),
                    "Time_In": row.col3,
                    "Remarks": row.remarks
                };
            } else {
                return {
                    "Student_Name": row.col1,
                    "Section": row.col2,
                    "Status": row.status.toUpperCase(),
                    "Time_In_Out": row.col3,
                    "Remarks": row.remarks
                };
            }
        });

        // 2. Generate CSV using Shared Utility
        import('../../utils/ReportGenerator').then(({ generateCSV }) => {
            generateCSV({
                title: currentReport.label
            }, tableInput);
        });
    };

    return (
        <div className="fac-reports-container fade-in">

            {/* HEADER & CONTROLS */}
            <div className="fac-reports-header">

                {/* LEFT COLUMN: Primary Filters (Max 3) */}
                <div className="fac-control-column">
                    <div className="fac-input-group">
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
                    </div>

                    {/* Show Subject Filter ONLY for Class Reports */}
                    {!isPersonal && (
                        <div className="fac-input-group">
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

                    {/* Date / Month Selection */}
                    <div className="fac-input-group">
                        <label>Date Selection <span style={{ color: 'red' }}>*</span></label>
                        {selectedReportId.includes('MONTHLY') || selectedReportId.includes('SEM') ? (
                            <input
                                type="month"
                                className="fac-select"
                                style={{ width: '100%' }}
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                            />
                        ) : (
                            <input
                                type="date"
                                className="fac-select"
                                style={{ width: '100%' }}
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        )}
                    </div>

                    {/* MOVED STATUS HERE FOR PERSONAL REPORTS ONLY (To fill gap) */}
                    {isPersonal && (
                        <div className="fac-input-group">
                            <label>Status Category</label>
                            <select
                                className="fac-select"
                                style={{ width: '100%' }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Present">Present / On Time</option>
                                <option value="Issues">Issues Only (Late/Absent/Alert)</option>
                                <option value="Late">Late Only</option>
                                <option value="Absent">Absent Only</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Info Box (Top) & Secondary Filters */}
                <div className="fac-control-column-right">

                    {/* Info Box (Moved to Top) */}
                    <div className="fac-report-info-compact">
                        <div className="info-header-row">
                            <i className={`fas ${isPersonal ? 'fa-user-lock' : 'fa-chalkboard-teacher'}`}></i>
                            <h4>{currentReport.label}</h4>
                        </div>
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

                    {/* Secondary Filters Row (Below Info Box) */}
                    {!isPersonal && (
                        <div className="fac-secondary-filters">
                            {/* Section Filter (Class Only) */}
                            <div className="fac-input-group">
                                <label>Section / Group</label>
                                <select
                                    className="fac-select"
                                    style={{ width: '100%' }}
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option value="All">All Sections</option>
                                    <option value="BSIT 4A">BSIT 4A</option>
                                    <option value="BSIT 4B">BSIT 4B</option>
                                    <option value="BSCS 3A">BSCS 3A</option>
                                </select>
                            </div>

                            {/* Status Category Filter (Class Only here) */}
                            <div className="fac-input-group">
                                <label>Status Category</label>
                                <select
                                    className="fac-select"
                                    style={{ width: '100%' }}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Present">Present / On Time</option>
                                    <option value="Issues">Issues Only (Late/Absent/Alert)</option>
                                    <option value="Late">Late Only</option>
                                    <option value="Absent">Absent Only</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Validation Error Message (Full Width) */}
                {validationError && (
                    <div className="validation-error" style={{ width: '100%', marginTop: '10px' }}>
                        <i className="fas fa-exclamation-circle"></i> {validationError}
                    </div>
                )}
            </div>

            {/* DATA TABLE */}
            <div className="fac-table-card">
                <div className="fac-card-header">
                    <h3>
                        {isPersonal ? "My Personal Logs" : `Student List: ${selectedSubject}`}
                    </h3>
                    <button className="btn-export" onClick={handleGenerateClick}>
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
                                        No data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIRMATION MODAL */}
            <FacultyReportModal 
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onGenerate={handleConfirmGeneration}
                reportTitle={currentReport.label}
                scope={isPersonal ? 'My Personal Logs' : selectedSubject}
                dateRange={dateFilter || monthFilter || "All Time"}
                filters={`${selectedSection !== 'All' ? selectedSection : 'All Sections'}, ${statusFilter !== 'All' ? statusFilter : 'All Statuses'}`}
            />
        </div>
    );
};

export default FacultyReportsPage;
