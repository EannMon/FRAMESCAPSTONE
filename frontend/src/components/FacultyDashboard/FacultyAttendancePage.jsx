import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './FacultyAttendancePage.css';

// --- MOCK DATA: STUDENTS (Shared Data) ---
const mockStudentsData = [
    { id: "2021-001", name: "Terana, Angelica L.", timeIn: "08:55 AM", status: "Present", remarks: "On Time" },
    { id: "2021-002", name: "Llana, Elena J.", timeIn: "09:00 AM", status: "Present", remarks: "On Time" },
    { id: "2021-003", name: "Calingal, Karl Rico C.", timeIn: "09:15 AM", status: "Late", remarks: "15m Late" },
    { id: "2021-004", name: "Lungay, Emmanuel M.", timeIn: "08:45 AM", status: "Present", remarks: "Early" },
    { id: "2021-005", name: "Dela Cruz, Juan P.", timeIn: "--:--", status: "Absent", remarks: "No Excuse" },
    { id: "2021-006", name: "Santos, Maria C.", timeIn: "09:05 AM", status: "Late", remarks: "Traffic" },
];

const FacultyAttendancePage = () => {
    // --- STATES ---
    const [viewMode, setViewMode] = useState('main'); // 'main' or 'details'
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // --- MOCK DATA: CLASSES ---
    const todayClasses = [
        { id: 1, title: "Computer Science 101", code: "CS101", time: "09:00 - 10:30", room: "Room A-205", rate: 95, status: "completed" },
        { id: 2, title: "Data Structures", code: "CS201", time: "11:00 - 12:30", room: "Room B-301", rate: 90, status: "completed" },
        { id: 3, title: "Algorithms", code: "CS301", time: "02:00 - 03:30", room: "Room A-205", rate: 88, status: "ongoing" },
        { id: 4, title: "Software Engineering", code: "CS401", time: "04:00 - 05:30", room: "Lab C-102", rate: 92, status: "upcoming" },
    ];

    const historyData = [
        { date: "Today", class: "Computer Science 101", time: "09:00 AM", present: 30, absent: 2, rate: 94 },
        { date: "Today", class: "Data Structures", time: "11:00 AM", present: 26, absent: 2, rate: 93 },
        { date: "Nov 13", class: "Algorithms", time: "02:00 PM", present: 22, absent: 3, rate: 88 },
    ];

    // --- HANDLERS ---

    // 1. Open Class Details (Student List)
    const handleViewDetails = (cls) => {
        setSelectedClass(cls);
        setViewMode('details');
    };

    // 2. Back to Dashboard
    const handleBack = () => {
        setViewMode('main');
        setSelectedClass(null);
    };

    // 3. Export Single Class Report
    const handleClassExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("CLASS ATTENDANCE REPORT", 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Subject: ${selectedClass.title} (${selectedClass.code})`, 14, 30);
        doc.text(`Time: ${selectedClass.time}`, 14, 36);
        doc.text(`Room: ${selectedClass.room}`, 14, 42);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);

        const tableRows = mockStudentsData.map(s => [s.name, s.id, s.timeIn, s.status, s.remarks]);
        
        autoTable(doc, {
            head: [["Student Name", "ID", "Time In", "Status", "Remarks"]],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [166, 37, 37] } // Red
        });

        doc.save(`${selectedClass.code}_Report.pdf`);
    };

    // 4. Global Export (All Subjects)
    const handleGlobalExport = () => {
        const doc = new jsPDF();
        doc.text("OVERALL ATTENDANCE SUMMARY", 14, 20);
        const tableRows = todayClasses.map(cls => [cls.title, cls.code, cls.room, `${cls.rate}%`, cls.status.toUpperCase()]);
        autoTable(doc, { head: [["Subject", "Code", "Room", "Avg Rate", "Status"]], body: tableRows, startY: 30, headStyles: { fillColor: [166, 37, 37] } });
        doc.save("Global_Attendance_Report.pdf");
    };

    // 5. Master List Export
    const handleDownloadMasterList = () => {
        const doc = new jsPDF();
        doc.text("MASTER STUDENT LIST", 14, 20);
        // Mock content
        doc.text("List of all enrolled students...", 14, 30);
        doc.save("Master_List.pdf");
    };

    // --- HELPER: Status Badge ---
    const renderStatusBadge = (status) => {
        if (status === 'completed') return <span className="status-badge-row green"><i className="fas fa-check-circle"></i> Completed</span>;
        if (status === 'ongoing') return <span className="status-badge-row blue"><i className="fas fa-sync-alt"></i> Ongoing</span>; // Removed fa-spin
        return <span className="status-badge-row grey"><i className="fas fa-clock"></i> Upcoming</span>;
    };

    // --- VIEW 1: MAIN DASHBOARD ---
    const renderMainView = () => (
        <div className="fade-in">
            {/* Header Actions Only (No Title) */}
            <div className="attendance-header-actions">
                <button className="schedule-button view-button" onClick={handleGlobalExport}>
                    <i className="fas fa-file-pdf"></i> Export Full Report
                </button>
                <button className="schedule-button monitor-button" onClick={handleDownloadMasterList}>
                    <i className="fas fa-file-download"></i> Download Master List
                </button>
            </div>

            {/* Statistics */}
            <div className="attendance-stats-grid">
                <div className="attendance-stat-card"><div className="stat-label">Today</div><div className="stat-value green">94%</div><div className="stat-sub">Average Rate</div></div>
                <div className="attendance-stat-card"><div className="stat-label">Classes</div><div className="stat-value">4</div><div className="stat-sub">Scheduled Today</div></div>
                <div className="attendance-stat-card"><div className="stat-label">Absent</div><div className="stat-value red">12</div><div className="stat-sub">Students Today</div></div>
                <div className="attendance-stat-card"><div className="stat-label">Alerts</div><div className="stat-value orange">8</div><div className="stat-sub">Low Attendance</div></div>
            </div>

            {/* Today's Classes */}
            <div className="card">
                <h3>Today's Classes</h3>
                <div className="today-classes-list">
                    {todayClasses.map((cls) => (
                        <div key={cls.id} className={`today-class-item ${cls.status}`}>
                            <div className="class-info">
                                <h4>{cls.title} <span className="code-tag">{cls.code}</span></h4>
                                <p>{cls.time} • {cls.room}</p>
                                {renderStatusBadge(cls.status)}
                            </div>
                            
                            <div className="attendance-visuals">
                                <div className="class-attendance-rate">{cls.rate}%</div>
                                <div className="attendance-progress">
                                    <div className="progress-bar" style={{width: `${cls.rate}%`}}></div>
                                </div>
                            </div>

                            <div className="class-actions">
                                <button className="action-btn view" onClick={() => handleViewDetails(cls)}>
                                    <i className="fas fa-users"></i> View Students
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent History Table */}
            <div className="card mt-4">
                <h3>Recent History</h3>
                <div className="attendance-table-wrapper">
                    <table className="attendance-table">
                        <thead><tr><th>Date</th><th>Class</th><th>Time</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead>
                        <tbody>
                            {historyData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.date}</td><td>{row.class}</td><td>{row.time}</td><td>{row.present}</td><td>{row.absent}</td>
                                    <td><span className={`rate-badge ${row.rate >= 90 ? 'green' : 'orange'}`}>{row.rate}%</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // --- VIEW 2: STUDENT LIST DETAILS (Similar to My Classes) ---
    const renderDetailsView = () => (
        <div className="details-view-container fade-in">
            {/* Back & Header */}
            <div className="details-header">
                <button className="back-link-btn" onClick={handleBack}>
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>
                <div className="class-details-title">
                    <h2>{selectedClass.title} <span className="highlight-code">({selectedClass.code})</span></h2>
                    <p>{selectedClass.time} • {selectedClass.room}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="details-controls">
                <input 
                    type="text" 
                    placeholder="Search student..." 
                    className="search-input"
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="export-pdf-btn" onClick={handleClassExport}>
                    <i className="fas fa-download"></i> Download Report
                </button>
            </div>

            {/* Student Table */}
            <div className="details-table-wrapper">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>ID Number</th>
                            <th>Time In</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockStudentsData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((student) => (
                            <tr key={student.id}>
                                <td className="font-bold">{student.name}</td>
                                <td className="text-muted">{student.id}</td>
                                <td>{student.timeIn}</td>
                                <td>
                                    <span className={`status-badge ${student.status === 'Present' ? 'green' : student.status === 'Late' ? 'orange' : 'red'}`}>
                                        {student.status}
                                    </span>
                                </td>
                                <td>{student.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="attendance-management">
            {viewMode === 'main' ? renderMainView() : renderDetailsView()}
        </div>
    );
};

export default FacultyAttendancePage;