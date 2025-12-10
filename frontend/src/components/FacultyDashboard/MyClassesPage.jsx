import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './MyClassesPage.css';

// --- MOCK DATA: STUDENTS ---
const mockStudentsData = [
    { id: "2021-001", name: "Terana, Angelica L.", timeIn: "08:55 AM", status: "On Time", attendanceRate: 98, statusColor: "green" },
    { id: "2021-002", name: "Llana, Elena J.", timeIn: "09:00 AM", status: "On Time", attendanceRate: 95, statusColor: "green" },
    { id: "2021-003", name: "Calingal, Karl Rico C.", timeIn: "09:15 AM", status: "Late", attendanceRate: 88, statusColor: "orange" },
    { id: "2021-004", name: "Lungay, Emmanuel M.", timeIn: "08:45 AM", status: "On Time", attendanceRate: 96, statusColor: "green" },
    { id: "2021-005", name: "Dela Cruz, Juan P.", timeIn: "--:--", status: "Absent", attendanceRate: 75, statusColor: "red" },
    { id: "2021-006", name: "Santos, Maria C.", timeIn: "09:05 AM", status: "Late", attendanceRate: 85, statusColor: "orange" },
];

const FacultyMyClassesPage = () => {
    // --- STATES ---
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [subView, setSubView] = useState('main');   // 'main' (Cards/Cal) | 'sheet' (Student List) | 'profile'
    
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // For Calendar Selection (Bulk Edit)
    const [selectedSessions, setSelectedSessions] = useState([]); 
    const [showManageModal, setShowManageModal] = useState(false);
    const [modalData, setModalData] = useState({ type: 'normal', reason: '' });

    // --- MOCK SCHEDULE (Calendar Data - Dec 2025) ---
    const [scheduleData, setScheduleData] = useState([
        { id: 1, date: '2025-12-01', day: 1, title: 'CS101', time: '09:00 AM', status: 'normal' },
        { id: 2, date: '2025-12-03', day: 3, title: 'CS301', time: '02:00 PM', status: 'normal' },
        { id: 3, date: '2025-12-08', day: 8, title: 'CS101', time: '09:00 AM', status: 'normal' },
        { id: 4, date: '2025-12-08', day: 8, title: 'CS201', time: '11:00 AM', status: 'normal' },
        { id: 5, date: '2025-12-10', day: 10, title: 'CS401', time: '04:00 PM', status: 'online-sync', reason: 'Typhoon' },
        { id: 6, date: '2025-12-12', day: 12, title: 'CS101', time: '09:00 AM', status: 'normal' },
        { id: 7, date: '2025-12-15', day: 15, title: 'CS301', time: '02:00 PM', status: 'cancelled', reason: 'Holiday' },
    ]);

    // --- MOCK CLASSES (List View Data) ---
    const facultyMockClasses = [
        { id: 101, name: "Computer Science 101", code: "CS101", students: 32, room: "A-205", time: "09:00 AM", attendanceRate: 94, isToday: true },
        { id: 102, name: "Data Structures", code: "CS201", students: 28, room: "B-301", time: "11:00 AM", attendanceRate: 89, isToday: true },
        { id: 103, name: "Algorithms", code: "CS301", students: 25, room: "A-205", time: "02:00 PM", attendanceRate: 91, isToday: false },
        { id: 104, name: "Software Eng", code: "CS401", students: 30, room: "C-102", time: "04:00 PM", attendanceRate: 92, isToday: false },
    ];

    // --- HELPERS ---
    const getStatusClass = (status) => {
        if (status === 'online-sync') return 'cal-event-blue';
        if (status === 'online-async') return 'cal-event-purple';
        if (status === 'cancelled') return 'cal-event-red';
        return 'cal-event-green';
    };

    const getAttendanceColor = (rate) => {
        if (rate >= 90) return "green";
        if (rate >= 80) return "orange";
        return "red";
    };

    // --- HANDLERS ---

    // 1. Navigation Logic
    const handleTakeAttendance = (cls) => {
        setSelectedClass(cls);
        setSubView('sheet'); // Go to Student List
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setSubView('profile'); // Go to Individual Profile
    };

    const handleBack = () => {
        if (subView === 'profile') setSubView('sheet');
        else if (subView === 'sheet') {
            setSubView('main');
            setSelectedClass(null);
        }
    };

    // 2. Calendar Selection Logic
    const toggleSessionSelect = (id) => {
        if (selectedSessions.includes(id)) {
            setSelectedSessions(selectedSessions.filter(sid => sid !== id));
        } else {
            setSelectedSessions([...selectedSessions, id]);
        }
    };

    // 3. Bulk Update Logic
    const handleBulkUpdate = () => {
        const updatedSchedule = scheduleData.map(item => {
            if (selectedSessions.includes(item.id)) {
                return { ...item, status: modalData.type, reason: modalData.reason };
            }
            return item;
        });
        setScheduleData(updatedSchedule);
        setShowManageModal(false);
        setSelectedSessions([]);
    };

    // --- PDF GENERATORS ---
    const generateClassPDF = () => {
        const doc = new jsPDF();
        doc.text(`Attendance Report: ${selectedClass.name}`, 14, 20);
        const tableRows = mockStudentsData.map(s => [s.name, s.timeIn, s.status]);
        autoTable(doc, { head: [["Name", "Time In", "Status"]], body: tableRows, startY: 30, headStyles: { fillColor: [166, 37, 37] } });
        doc.save(`${selectedClass.code}_Attendance.pdf`);
    };

    const generateStudentPDF = () => {
        const doc = new jsPDF();
        doc.text(`Individual Report: ${selectedStudent.name}`, 14, 20);
        autoTable(doc, { startY: 30, head: [['Date', 'Status']], body: [['Dec 01', 'Present'], ['Dec 03', 'Present']], theme: 'striped', headStyles: { fillColor: [166, 37, 37] } });
        doc.save(`${selectedStudent.name}_Report.pdf`);
    };

    // --- RENDERERS ---

    // A. LIST VIEW (Cards with Take Attendance)
    const renderClassCards = () => (
        <div className="faculty-classes-grid fade-in">
            {facultyMockClasses.map((cls) => (
                <div key={cls.id} className={`card faculty-class-card ${cls.isToday ? 'today-active' : ''}`}>
                    <div className="card-status-badge">
                        {cls.isToday ? <span className="badge-today">Today</span> : <span className="badge-upcoming">Upcoming</span>}
                    </div>
                    <div className="faculty-class-header">
                        <h3>{cls.name}</h3>
                        <span className="faculty-class-code">{cls.code}</span>
                    </div>
                    <div className="faculty-class-details">
                        <div className="detail-row"><i className="fas fa-clock"></i> {cls.time}</div>
                        <div className="detail-row"><i className="fas fa-map-marker-alt"></i> {cls.room}</div>
                        <div className="detail-row"><i className="fas fa-users"></i> {cls.students} Students</div>
                    </div>
                    <div className="attendance-preview-bar">
                        <div className="bar-label"><span>Avg. Attendance</span><span className={getAttendanceColor(cls.attendanceRate)}>{cls.attendanceRate}%</span></div>
                        <div className="progress-track"><div className={`progress-fill ${getAttendanceColor(cls.attendanceRate)}`} style={{width: `${cls.attendanceRate}%`}}></div></div>
                    </div>
                    
                    {/* BUTTON NA GAGANA NA: */}
                    <div className="action-area">
                        <button className="faculty-take-attendance-btn" onClick={() => handleTakeAttendance(cls)}>
                            <i className="fas fa-user-check"></i> Take Attendance
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    // B. ATTENDANCE SHEET VIEW
    const renderAttendanceSheet = () => (
        <div className="attendance-sheet-container fade-in">
            <div className="sheet-header">
                <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i> Back to Classes</button>
                <div className="class-info-header">
                    <h2>{selectedClass.name} <span className="highlight-code">({selectedClass.code})</span></h2>
                    <p>{selectedClass.time} • {selectedClass.room}</p>
                </div>
            </div>
            <div className="sheet-controls">
                <div className="search-wrapper">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search student..." onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
                <button className="export-pdf-btn" onClick={generateClassPDF}><i className="fas fa-download"></i> Export List</button>
            </div>
            <div className="students-list-wrapper">
                <table className="styled-table">
                    <thead><tr><th>Student Name</th><th>Time In</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {mockStudentsData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                            <tr key={s.id} onClick={() => handleViewStudent(s)} className="clickable-row">
                                <td className="student-name-cell">
                                    <div className="avatar-placeholder">{s.name.charAt(0)}</div>
                                    <div><div className="s-name">{s.name}</div><div className="s-id">{s.id}</div></div>
                                </td>
                                <td>{s.timeIn}</td>
                                <td><span className={`status-badge ${s.statusColor}`}>{s.status}</span></td>
                                <td><button className="icon-btn-view"><i className="fas fa-chevron-right"></i></button></td>
                            </tr>
                        ))}
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
                    <div className="big-avatar">{selectedStudent.name.charAt(0)}</div>
                    <div className="profile-info">
                        <h2>{selectedStudent.name}</h2>
                        <p>{selectedStudent.id}</p>
                    </div>
                    <button className="export-pdf-btn outline" onClick={generateStudentPDF}>Download Report</button>
                </div>
                <div className="profile-stats-grid">
                    <div className="p-stat-box"><label>Attendance</label><div className="stat-number green">{selectedStudent.attendanceRate}%</div></div>
                    <div className="p-stat-box"><label>Status</label><div className={`stat-number ${selectedStudent.statusColor}`}>{selectedStudent.status}</div></div>
                </div>
            </div>
        </div>
    );

    // D. REAL CALENDAR VIEW (Grid Layout)
    const renderCalendarView = () => {
        // December 2025: Starts Mon (1). 31 Days.
        const daysInMonth = 31;
        const startDay = 1; 
        const calendarCells = [];

        // Empty slots for padding
        for (let i = 0; i < startDay; i++) {
            calendarCells.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
        }

        // Days 1-31
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `2025-12-${String(day).padStart(2, '0')}`;
            const events = scheduleData.filter(s => s.date === dateStr);
            
            calendarCells.push(
                <div key={day} className="cal-cell day">
                    <div className="cal-day-number">{day}</div>
                    <div className="cal-events-stack">
                        {events.map(ev => (
                            <div 
                                key={ev.id} 
                                className={`cal-event-pill ${getStatusClass(ev.status)} ${selectedSessions.includes(ev.id) ? 'selected-pill' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleSessionSelect(ev.id); }}
                                title={`${ev.title} - Click to Select`}
                            >
                                {selectedSessions.includes(ev.id) && <i className="fas fa-check-circle pill-check"></i>}
                                <span>{ev.time.split(' ')[0]} {ev.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="real-calendar-container fade-in">
                <div className="cal-controls-row">
                    <div className="cal-title-group">
                        <h3>December 2025</h3>
                        <span className="cal-instruction">Click events to select & update status (e.g. Cancel/Online)</span>
                    </div>
                    {selectedSessions.length > 0 && (
                        <button className="bulk-update-btn" onClick={() => setShowManageModal(true)}>
                            Update {selectedSessions.length} Selected
                        </button>
                    )}
                </div>
                
                <div className="calendar-grid-wrapper">
                    <div className="cal-header-row">
                        <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                    </div>
                    <div className="cal-body-grid">
                        {calendarCells}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="faculty-my-classes-container">
            {/* MAIN HEADER & TOGGLES (Only show in main view) */}
            {subView === 'main' && (
                <div className="view-toggle-header">
                    <h2>My Classes</h2>
                    <div className="toggle-buttons">
                        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                            <i className="fas fa-list"></i> List
                        </button>
                        <button className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
                            <i className="fas fa-calendar-alt"></i> Calendar
                        </button>
                    </div>
                </div>
            )}

            {/* CONTENT LOGIC */}
            {subView === 'main' ? (
                viewMode === 'list' ? renderClassCards() : renderCalendarView()
            ) : subView === 'sheet' ? (
                renderAttendanceSheet()
            ) : (
                renderStudentProfile()
            )}

            {/* MODAL FOR CALENDAR EDIT */}
            {showManageModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box manage-modal">
                        <div className="modal-header">
                            <h3>Update Schedule Status</h3>
                            <button className="close-btn" onClick={() => setShowManageModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="info-banner">
                                <i className="fas fa-info-circle"></i> Update <strong>{selectedSessions.length}</strong> selected class(es).
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={modalData.type} onChange={(e) => setModalData({...modalData, type: e.target.value})}>
                                    <option value="normal">On-Site</option>
                                    <option value="online-sync">Synchronous Online</option>
                                    <option value="online-async">Asynchronous</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Remarks (Optional)</label>
                                <textarea value={modalData.reason} onChange={(e) => setModalData({...modalData, reason: e.target.value})} placeholder="e.g. Typhoon"></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowManageModal(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleBulkUpdate}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyMyClassesPage;