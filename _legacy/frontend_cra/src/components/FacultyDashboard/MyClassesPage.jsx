import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './MyClassesPage.css';

const FacultyMyClassesPage = () => {
    // --- STATES ---
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar' | 'upload'
    const [subView, setSubView] = useState('main');   // 'main' | 'sheet' | 'profile'
    
    const [user, setUser] = useState(null);
    const [myClasses, setMyClasses] = useState([]); // Data from DB
    const [studentList, setStudentList] = useState([]); // Data from DB
    const [loading, setLoading] = useState(true);

    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Calendar States
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]); 
    const [showManageModal, setShowManageModal] = useState(false);
    const [modalData, setModalData] = useState({ type: 'normal', reason: '' });

    // Upload States
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedSchedules, setUploadedSchedules] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [semester, setSemester] = useState('1st Semester');
    const [academicYear, setAcademicYear] = useState('2024-2025');

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSchedule(parsedUser.user_id || parsedUser.id);
            fetchUploadHistory(parsedUser.user_id || parsedUser.id);
        }
    }, []);

    // --- 2. FETCH DATA FROM DB ---
    const fetchSchedule = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/schedule/${userId}`);
            setMyClasses(response.data);
            generateCalendarEvents(response.data); // Generate calendar based on DB schedule
            setLoading(false);
        } catch (error) {
            console.error("Error loading schedule:", error);
            setLoading(false);
        }
    };

    const fetchUploadHistory = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/upload-history/${userId}`);
            setUploadedSchedules(response.data);
        } catch (error) {
            console.error("Error fetching upload history:", error);
        }
    };

    const fetchClassDetails = async (cls) => {
        setLoading(true);
        setSelectedClass(cls);
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/class-details/${cls.schedule_id}`);
            // Add status color logic for UI
            const processedStudents = response.data.map(s => ({
                ...s,
                statusColor: s.status === 'Present' ? 'green' : 'red'
            }));
            setStudentList(processedStudents);
            setSubView('sheet');
        } catch (error) {
            console.error("Error loading students:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- 3. CALENDAR GENERATOR (DB Schedule -> Calendar Dates) ---
    const generateCalendarEvents = (classes) => {
        const events = [];
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth(); // Current Month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Loop through every day of the month
        for (let d = 1; d <= daysInMonth; d++) {
            const currentDate = new Date(year, month, d);
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            // Find classes that meet on this day name
            classes.forEach(cls => {
                if (cls.day_of_week === dayName) {
                    events.push({
                        id: `${cls.schedule_id}-${d}`, // Unique ID
                        date: dateStr,
                        day: d,
                        title: cls.course_code,
                        time: cls.start_time,
                        section: cls.section,
                        status: 'normal' // Default status
                    });
                }
            });
        }
        setCalendarEvents(events);
    };

    // --- UPLOAD HANDLERS ---
    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadMessage('Please select a PDF file');
            return;
        }

        setIsUploading(true);
        setUploadMessage('Uploading and processing schedule...');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('faculty_id', user.user_id || user.id);
        formData.append('semester', semester);
        formData.append('academic_year', academicYear);

        try {
            const response = await axios.post(
                'http://localhost:5000/api/faculty/upload-schedule',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.status === 201) {
                setUploadMessage(
                    `✅ Success! Created ${response.data.schedules_created} schedule(s) and ${response.data.students_created} student account(s)`
                );
                setSelectedFile(null);
                fetchUploadHistory(user.user_id || user.id);
                fetchSchedule(user.user_id || user.id);
                // Reset form
                setTimeout(() => {
                    setUploadMessage('');
                }, 5000);
            } else {
                setUploadMessage(`❌ Error: ${response.data.error}`);
            }
        } catch (error) {
            setUploadMessage(`❌ Upload failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // --- HANDLERS ---
    const handleTakeAttendance = (cls) => {
        fetchClassDetails(cls);
    };

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

    const toggleSessionSelect = (id) => {
        if (selectedSessions.includes(id)) {
            setSelectedSessions(selectedSessions.filter(sid => sid !== id));
        } else {
            setSelectedSessions([...selectedSessions, id]);
        }
    };

    // Bulk Update (Visual only for now, as DB doesn't store exceptions yet)
    const handleBulkUpdate = () => {
        const updatedEvents = calendarEvents.map(ev => {
            if (selectedSessions.includes(ev.id)) {
                return { ...ev, status: modalData.type, reason: modalData.reason };
            }
            return ev;
        });
        setCalendarEvents(updatedEvents);
        setShowManageModal(false);
        setSelectedSessions([]);
        alert("Schedule updated locally (Backend support for cancellations needed).");
    };

    // --- PDF GENERATORS ---
    const generateClassPDF = () => {
        const doc = new jsPDF();
        doc.text(`Attendance Report: ${selectedClass.title}`, 14, 20);
        doc.text(`Section: ${selectedClass.section}`, 14, 26);
        
        const tableRows = studentList.map(s => [
            `${s.lastName}, ${s.firstName}`, 
            s.timeIn, 
            s.status
        ]);
        autoTable(doc, { 
            head: [["Name", "Time In", "Status"]], 
            body: tableRows, 
            startY: 35, 
            headStyles: { fillColor: [166, 37, 37] } 
        });
        doc.save(`${selectedClass.course_code}_Report.pdf`);
    };

    const generateStudentPDF = () => {
        const doc = new jsPDF();
        doc.text(`Individual Report: ${selectedStudent.firstName} ${selectedStudent.lastName}`, 14, 20);
        autoTable(doc, { 
            startY: 30, 
            head: [['Date', 'Status', 'Time In']], 
            body: [[new Date().toLocaleDateString(), selectedStudent.status, selectedStudent.timeIn]], 
            theme: 'striped', 
            headStyles: { fillColor: [166, 37, 37] } 
        });
        doc.save(`${selectedStudent.lastName}_Report.pdf`);
    };

    // --- RENDERERS ---

    // A. LIST VIEW (Cards)
    const renderClassCards = () => (
        <div className="faculty-classes-grid fade-in">
            {myClasses.length > 0 ? (
                myClasses.map((cls) => (
                    <div key={cls.schedule_id} className={`card faculty-class-card ${cls.status === 'ongoing' ? 'today-active' : ''}`}>
                        <div className="card-status-badge">
                            {cls.status === 'ongoing' ? <span className="badge-today">Ongoing</span> : <span className="badge-upcoming">Upcoming</span>}
                        </div>
                        <div className="faculty-class-header">
                            <h3>{cls.title}</h3>
                            <span className="faculty-class-code">{cls.course_code}</span>
                        </div>
                        <div className="faculty-class-details">
                            <div className="detail-row"><i className="fas fa-clock"></i> {cls.day_of_week} {cls.start_time}</div>
                            <div className="detail-row"><i className="fas fa-map-marker-alt"></i> {cls.room_name || 'TBA'}</div>
                            <div className="detail-row"><i className="fas fa-users"></i> {cls.section} ({cls.total_students})</div>
                        </div>
                        
                        <div className="attendance-preview-bar">
                            <div className="bar-label"><span>Avg. Attendance</span><span className="green">{cls.rate}%</span></div>
                            <div className="progress-track">
                                <div className="progress-fill green" style={{width: `${cls.rate}%`}}></div>
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
                <div style={{gridColumn: '1/-1', textAlign:'center', padding:'40px', color:'#888'}}>
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
                    <h2>{selectedClass.title} <span className="highlight-code">({selectedClass.course_code})</span></h2>
                    <p>{selectedClass.section} • {selectedClass.room_name}</p>
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
                        {studentList.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No students found.</td></tr>}
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

    // D. CALENDAR VIEW
    const renderCalendarView = () => {
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const startDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
        const calendarCells = [];

        for (let i = 0; i < startDay; i++) {
            calendarCells.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const events = calendarEvents.filter(s => s.date === dateStr);
            
            calendarCells.push(
                <div key={day} className="cal-cell day">
                    <div className="cal-day-number">{day}</div>
                    <div className="cal-events-stack">
                        {events.map(ev => (
                            <div 
                                key={ev.id} 
                                className={`cal-event-pill ${ev.status === 'cancelled' ? 'cal-event-red' : 'cal-event-green'} ${selectedSessions.includes(ev.id) ? 'selected-pill' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleSessionSelect(ev.id); }}
                                title={`${ev.title} - Click to Select`}
                            >
                                {selectedSessions.includes(ev.id) && <i className="fas fa-check-circle pill-check"></i>}
                                <span>{ev.time} {ev.title}</span>
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
                        <h3>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <span className="cal-instruction">Click events to select & update status (e.g. Cancel)</span>
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
                    <div className="cal-body-grid">{calendarCells}</div>
                </div>
            </div>
        );
    };

    // E. UPLOAD VIEW
    const renderUploadView = () => (
        <div className="upload-container fade-in">
            <div className="upload-section card">
                <h3>📚 Upload Course Schedule (PDF)</h3>
                <p className="info-text">
                    Upload your COR/Schedule PDF to automatically create courses and enroll students
                </p>

                <div className="form-group">
                    <label>Select PDF File:</label>
                    <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Semester:</label>
                        <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                            <option>1st Semester</option>
                            <option>2nd Semester</option>
                            <option>Summer</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Academic Year:</label>
                        <input 
                            type="text" 
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="2024-2025"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleUpload} 
                    disabled={isUploading}
                    className="upload-btn"
                >
                    {isUploading ? '⏳ Processing...' : '📤 Upload Schedule'}
                </button>

                {uploadMessage && (
                    <div className={`message ${uploadMessage.includes('✅') ? 'success' : 'error'}`}>
                        {uploadMessage}
                    </div>
                )}
            </div>

            {/* Upload History Section */}
            <div className="history-section card">
                <h3>📋 Upload History</h3>
                {uploadedSchedules.length === 0 ? (
                    <p className="no-data">No schedules uploaded yet</p>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Semester</th>
                                <th>Academic Year</th>
                                <th>Schedules</th>
                                <th>Status</th>
                                <th>Uploaded</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uploadedSchedules.map((upload) => (
                                <tr key={upload.upload_id}>
                                    <td>{upload.file_name}</td>
                                    <td>{upload.semester}</td>
                                    <td>{upload.academic_year}</td>
                                    <td>{upload.schedules_count}</td>
                                    <td>
                                        <span className={`status ${upload.status.toLowerCase()}`}>
                                            {upload.status}
                                        </span>
                                    </td>
                                    <td>{new Date(upload.uploaded_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    if (!user) return <div className="loading">Please log in.</div>;

    return (
        <div className="faculty-my-classes-container">
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
                        <button className={`toggle-btn ${viewMode === 'upload' ? 'active' : ''}`} onClick={() => setViewMode('upload')}>
                            <i className="fas fa-cloud-upload-alt"></i> Upload
                        </button>
                    </div>
                </div>
            )}

            {subView === 'main' ? (
                viewMode === 'list' ? renderClassCards() : viewMode === 'calendar' ? renderCalendarView() : renderUploadView()
            ) : subView === 'sheet' ? (
                renderAttendanceSheet()
            ) : (
                renderStudentProfile()
            )}

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