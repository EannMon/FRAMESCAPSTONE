import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import Axios
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './FacultyAttendancePage.css';

const FacultyAttendancePage = () => {
    // --- STATES ---
    const [viewMode, setViewMode] = useState('main'); // 'main' or 'details'
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // --- DATA STATES ---
    const [myClasses, setMyClasses] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [user, setUser] = useState(null);

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSchedule(parsedUser.user_id || parsedUser.id);
        }
    }, []);

    // --- 2. FETCH SCHEDULE (API) ---
    const fetchSchedule = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/schedule/${userId}`);
            setMyClasses(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading schedule:", error);
            setLoading(false);
        }
    };

    // --- 3. FETCH CLASS DETAILS (API) ---
    const handleViewDetails = async (cls) => {
        setSelectedClass(cls);
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/class-details/${cls.schedule_id}`);
            setStudentList(response.data);
            setViewMode('details');
        } catch (error) {
            console.error("Error loading students:", error);
            alert("Could not load student list.");
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleBack = () => {
        setViewMode('main');
        setSelectedClass(null);
        setStudentList([]);
    };

    // Export Single Class Report
    const handleClassExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("CLASS ATTENDANCE REPORT", 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Subject: ${selectedClass.title} (${selectedClass.course_code})`, 14, 30);
        doc.text(`Section: ${selectedClass.section}`, 14, 36);
        doc.text(`Time: ${selectedClass.start_time} - ${selectedClass.end_time}`, 14, 42);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);

        const tableRows = studentList.map(s => [
            `${s.lastName}, ${s.firstName}`, 
            s.tupm_id, 
            s.timeIn, 
            s.status, 
            s.remarks
        ]);
        
        autoTable(doc, {
            head: [["Student Name", "ID", "Time In", "Status", "Remarks"]],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [166, 37, 37] } 
        });

        doc.save(`${selectedClass.course_code}_${selectedClass.section}_Report.pdf`);
    };

    // Global Export (All Subjects)
    const handleGlobalExport = () => {
        const doc = new jsPDF();
        doc.text("OVERALL ATTENDANCE SUMMARY", 14, 20);
        const tableRows = myClasses.map(cls => [
            cls.title, 
            cls.course_code, 
            cls.room_name || "TBA", 
            `${cls.rate}%`, 
            cls.status.toUpperCase()
        ]);
        autoTable(doc, { 
            head: [["Subject", "Code", "Room", "Attendance %", "Status"]], 
            body: tableRows, 
            startY: 30, 
            headStyles: { fillColor: [166, 37, 37] } 
        });
        doc.save("Global_Attendance_Report.pdf");
    };

    // Helper: Status Badge
    const renderStatusBadge = (status) => {
        if (status === 'completed') return <span className="status-badge-row green"><i className="fas fa-check-circle"></i> Completed</span>;
        if (status === 'ongoing') return <span className="status-badge-row blue"><i className="fas fa-sync-alt"></i> Ongoing</span>;
        return <span className="status-badge-row grey"><i className="fas fa-clock"></i> Upcoming</span>;
    };

    // --- VIEW 1: MAIN DASHBOARD ---
    const renderMainView = () => (
        <div className="fade-in">
            <div className="attendance-header-actions">
                <button className="schedule-button view-button" onClick={handleGlobalExport}>
                    <i className="fas fa-file-pdf"></i> Export Full Report
                </button>
            </div>

            {/* Statistics based on Real Data */}
            <div className="attendance-stats-grid">
                <div className="attendance-stat-card">
                    <div className="stat-label">Total Classes</div>
                    <div className="stat-value">{myClasses.length}</div>
                    <div className="stat-sub">Assigned Subjects</div>
                </div>
                <div className="attendance-stat-card">
                    <div className="stat-label">Avg Attendance</div>
                    <div className="stat-value green">
                        {myClasses.length > 0 
                            ? Math.round(myClasses.reduce((acc, curr) => acc + curr.rate, 0) / myClasses.length) 
                            : 0}%
                    </div>
                    <div className="stat-sub">Across all sections</div>
                </div>
            </div>

            {/* Today's Classes */}
            <div className="card">
                <h3>My Class Schedule {loading && "(Loading...)"}</h3>
                <div className="today-classes-list">
                    {myClasses.length > 0 ? (
                        myClasses.map((cls) => (
                            <div key={cls.schedule_id} className={`today-class-item ${cls.status}`}>
                                <div className="class-info">
                                    <h4>{cls.title} <span className="code-tag">{cls.course_code}</span></h4>
                                    <p>
                                        <span style={{fontWeight:'bold', color:'#555'}}>{cls.section}</span> • 
                                        {cls.day_of_week} {cls.start_time} • {cls.room_name}
                                    </p>
                                    {renderStatusBadge(cls.status)}
                                </div>
                                
                                <div className="attendance-visuals">
                                    <div className="class-attendance-rate">{cls.rate}%</div>
                                    <div className="attendance-progress">
                                        <div className="progress-bar" style={{width: `${cls.rate}%`}}></div>
                                    </div>
                                    <div style={{fontSize:'0.8em', color:'#888', marginTop:'5px'}}>
                                        {cls.present_count} / {cls.total_students} Present
                                    </div>
                                </div>

                                <div className="class-actions">
                                    <button className="action-btn view" onClick={() => handleViewDetails(cls)}>
                                        <i className="fas fa-users"></i> View Students
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{padding:'20px', textAlign:'center', color:'#888'}}>
                            No classes assigned yet. Contact the Dept Head.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // --- VIEW 2: STUDENT LIST DETAILS ---
    const renderDetailsView = () => (
        <div className="details-view-container fade-in">
            <div className="details-header">
                <button className="back-link-btn" onClick={handleBack}>
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>
                <div className="class-details-title">
                    <h2>{selectedClass.title} <span className="highlight-code">({selectedClass.course_code})</span></h2>
                    <p>{selectedClass.section} • {selectedClass.room_name}</p>
                </div>
            </div>

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
                        {studentList
                            .filter(s => 
                                s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                s.firstName.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((student) => (
                            <tr key={student.user_id}>
                                <td className="font-bold">{student.lastName}, {student.firstName}</td>
                                <td className="text-muted">{student.tupm_id}</td>
                                <td>{student.timeIn}</td>
                                <td>
                                    <span className={`status-badge ${student.status === 'Present' ? 'green' : 'red'}`}>
                                        {student.status}
                                    </span>
                                </td>
                                <td>{student.remarks}</td>
                            </tr>
                        ))}
                        {studentList.length === 0 && (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No students enrolled in this section.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (!user) return <div className="loading">Please log in.</div>;

    return (
        <div className="attendance-management">
            {viewMode === 'main' ? renderMainView() : renderDetailsView()}
        </div>
    );
};

export default FacultyAttendancePage;