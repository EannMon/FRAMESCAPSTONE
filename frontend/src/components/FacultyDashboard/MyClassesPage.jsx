import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { generateFramesPDF } from '../../utils/ReportGenerator';
import ClassCalendarView from './ClassCalendarView';
import ScheduleUploadView from './ScheduleUploadView';
import './MyClassesPage.css';

const FacultyMyClassesPage = () => {
    const { user: authUser } = useAuth();

    // --- STATES ---
    const [viewMode, setViewMode] = useState('list');   // 'list' | 'calendar' | 'upload'
    const [subView, setSubView] = useState('main');     // 'main' | 'sheet' | 'profile'

    const [user, setUser] = useState(null);
    const [myClasses, setMyClasses] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Calendar events (generated from schedule data)
    const [calendarEvents, setCalendarEvents] = useState([]);

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const controller = new AbortController();

        if (authUser) {
            setUser(authUser);
            fetchSchedule(authUser.user_id || authUser.id, controller.signal);
        }

        return () => controller.abort();
    }, [authUser]);

    // --- 2. FETCH DATA FROM DB ---
    const fetchSchedule = async (userId, signal) => {
        try {
            const response = await api.get(`/api/faculty/schedule/${userId}`, { signal });
            setMyClasses(response.data);
            generateCalendarEvents(response.data);
            setLoading(false);
        } catch (error) {
            if (error.code === 'ERR_CANCELED') return;
            console.error("Error loading schedule:", error);
            setLoading(false);
        }
    };

    const fetchClassDetails = async (cls) => {
        setLoading(true);
        setSelectedClass(cls);
        try {
            const response = await api.get(`/api/faculty/class-details/${cls.id}`);
            const processedStudents = response.data.map(s => ({
                ...s,
                statusColor: s.status === 'Present' ? 'green' : 'red'
            }));
            setStudentList(processedStudents);
            setSubView('sheet');
        } catch (error) {
            if (error.code === 'ERR_CANCELED') return;
            console.error("Error loading students:", error);
            alert(error.userMessage || "Could not load student list.");
        } finally {
            setLoading(false);
        }
    };

    // --- 3. CALENDAR GENERATOR (DB Schedule -> Calendar Dates) ---
    const generateCalendarEvents = (classes) => {
        const events = [];
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDate = new Date(year, month, d);
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            classes.forEach(cls => {
                if (cls.day_of_week === dayName) {
                    events.push({
                        id: `${cls.id}-${d}`,
                        date: dateStr,
                        day: d,
                        title: cls.subject_code,
                        time: cls.start_time,
                        section: cls.section,
                        status: 'normal'
                    });
                }
            });
        }
        setCalendarEvents(events);
    };

    // --- HANDLERS ---
    const handleTakeAttendance = (cls) => fetchClassDetails(cls);

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setSubView('profile');
    };

    const handleBack = () => {
        if (subView === 'profile') setSubView('sheet');
        else if (subView === 'sheet') {
            setSubView('main');
            setSelectedClass(null);
        }
    };

    // Called by ScheduleUploadView after a successful upload
    const handleUploadComplete = () => {
        if (authUser) fetchSchedule(authUser.user_id || authUser.id);
    };

    // --- PDF GENERATORS ---
    const generateClassPDF = () => {
        const tableData = studentList.map(s => ({ "Student Name": `${s.lastName}, ${s.firstName}`, "Student ID": s.tupm_id, "Time In": s.timeIn, "Status": s.status }));
        generateFramesPDF({
            title: `${selectedClass.subject_title} Attendance`, type: "CLASS ATTENDANCE REPORT", category: 'class',
            context: { classCode: selectedClass.subject_code, section: selectedClass.section }, dateRange: new Date().toLocaleDateString()
        }, tableData);
    };

    const generateStudentPDF = () => {
        const tableData = [{ "Date": new Date().toLocaleDateString(), "Subject": selectedClass.subject_title, "Time In": selectedStudent.timeIn, "Status": selectedStudent.status }];
        generateFramesPDF({
            title: "Individual Attendance Report", type: "STUDENT REPORT", category: 'personal',
            context: { name: `${selectedStudent.firstName} ${selectedStudent.lastName}`, id: selectedStudent.tupm_id }, dateRange: new Date().toLocaleDateString()
        }, tableData);
    };

    // ===========================
    // RENDER SECTIONS
    // ===========================

    // A. LIST VIEW (Cards)
    const renderClassCards = () => (
        <div className="faculty-classes-grid fade-in">
            {myClasses.length > 0 ? (
                myClasses.map((cls) => (
                    <div key={cls.id} className={`card faculty-class-card ${cls.status === 'ongoing' ? 'today-active' : ''}`}>
                        <div className="card-status-badge">
                            {cls.status === 'ongoing' ? <span className="badge-today">Ongoing</span> : <span className="badge-upcoming">Upcoming</span>}
                        </div>
                        <div className="faculty-class-header">
                            <h3>{cls.subject_title}</h3>
                            <span className="faculty-class-code">{cls.subject_code}</span>
                        </div>
                        <div className="faculty-class-details">
                            <div className="detail-row"><i className="fas fa-clock"></i> {cls.day_of_week} {cls.start_time}</div>
                            <div className="detail-row"><i className="fas fa-map-marker-alt"></i> {cls.room || 'TBA'}</div>
                            <div className="detail-row"><i className="fas fa-users"></i> {cls.section} ({cls.total_students})</div>
                        </div>
                        <div className="attendance-preview-bar">
                            <div className="bar-label"><span>Avg. Attendance</span><span className="green">{cls.rate}%</span></div>
                            <div className="progress-track">
                                <div className="progress-fill green" style={{ width: `${cls.rate}%` }}></div>
                            </div>
                        </div>
                        <div className="action-area">
                            <button className="faculty-take-attendance-btn" onClick={() => handleTakeAttendance(cls)}>
                                <i className="fas fa-user-check"></i> View Attendance
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#888' }}>
                    {loading ? "Loading classes..." : "No classes assigned."}
                </div>
            )}
        </div>
    );

    // B. ATTENDANCE SHEET VIEW
    const renderAttendanceSheet = () => (
        <div className="attendance-sheet-container fade-in">
            <div className="sheet-header">
                <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i> Back to Classes</button>
                <div className="class-info-header">
                    <h2>{selectedClass.subject_title} <span className="highlight-code">({selectedClass.subject_code})</span></h2>
                    <p>{selectedClass.section} • {selectedClass.room}</p>
                </div>
            </div>
            <div className="sheet-controls">
                <div className="search-wrapper">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search student..." onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button className="export-pdf-btn" onClick={generateClassPDF}><i className="fas fa-download"></i> Export List</button>
            </div>
            <div className="students-list-wrapper">
                <table className="styled-table">
                    <thead><tr><th>Student Name</th><th>Time In</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {studentList
                            .filter(s => s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || s.firstName.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(s => (
                                <tr key={s.user_id} onClick={() => handleViewStudent(s)} className="clickable-row">
                                    <td className="student-name-cell">
                                        <div className="avatar-placeholder">{s.firstName.charAt(0)}</div>
                                        <div><div className="s-name">{s.lastName}, {s.firstName}</div><div className="s-id">{s.tupm_id}</div></div>
                                    </td>
                                    <td>{s.timeIn}</td>
                                    <td><span className={`status-badge ${s.statusColor}`}>{s.status}</span></td>
                                    <td><button className="icon-btn-view"><i className="fas fa-chevron-right"></i></button></td>
                                </tr>
                            ))}
                        {studentList.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No students found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // C. STUDENT PROFILE VIEW
    const renderStudentProfile = () => (
        <div className="student-profile-container fade-in">
            <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i> Back to List</button>
            <div className="student-profile-card card">
                <div className="profile-header-row">
                    <div className="big-avatar">{selectedStudent.firstName.charAt(0)}</div>
                    <div className="profile-info">
                        <h2>{selectedStudent.lastName}, {selectedStudent.firstName}</h2>
                        <p>{selectedStudent.tupm_id}</p>
                    </div>
                    <button className="export-pdf-btn outline" onClick={generateStudentPDF}>Download Report</button>
                </div>
                <div className="profile-stats-grid">
                    <div className="p-stat-box"><label>Status Today</label><div className={`stat-number ${selectedStudent.statusColor}`}>{selectedStudent.status}</div></div>
                    <div className="p-stat-box"><label>Time In</label><div className="stat-number">{selectedStudent.timeIn}</div></div>
                </div>
            </div>
        </div>
    );

    if (!user) return <div className="loading">Please log in.</div>;

    return (
        <div className="faculty-my-classes-container">
            {subView === 'main' && (
                <div className="view-toggle-header">
                    <div className="toggle-buttons">
                        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                            <i className="fas fa-list"></i> List
                        </button>
                        <button className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
                            <i className="fas fa-calendar-alt"></i> Calendar
                        </button>
                        <button className={`toggle-btn ${viewMode === 'upload' ? 'active' : ''}`} onClick={() => setViewMode('upload')}>
                            <i className="fas fa-cloud-upload-alt"></i> Upload
                        </button>
                    </div>
                </div>
            )}

            {subView === 'main' ? (
                viewMode === 'list' ? renderClassCards() :
                viewMode === 'calendar' ? (
                    <ClassCalendarView
                        calendarEvents={calendarEvents}
                        onEventsUpdate={setCalendarEvents}
                    />
                ) : (
                    <ScheduleUploadView
                        user={user}
                        onUploadComplete={handleUploadComplete}
                    />
                )
            ) : subView === 'sheet' ? (
                renderAttendanceSheet()
            ) : (
                renderStudentProfile()
            )}
        </div>
    );
};

export default FacultyMyClassesPage;
