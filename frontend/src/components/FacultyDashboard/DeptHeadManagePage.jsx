import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DeptHeadManagePage.css';

const DeptHeadManagePage = () => {
    // --- STATE MANAGEMENT ---
    const [department] = useState("College of Science (COS)");
    
    // Modals Visibility
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    
    // Form States
    const [newCourse, setNewCourse] = useState({
        code: '', name: '', units: 3, type: 'Lecture', category: 'Major'
    });

    // Room Assignment State (With Default Time)
    const [roomForm, setRoomForm] = useState({
        roomName: 'Room 301', // Default simple room
        day: 'Monday',
        startTime: '09:00',
        endTime: '12:00'
    });

    // --- MOCK DATA (Updated Room Names) ---
    const [courses, setCourses] = useState([
        { 
            id: 1, 
            code: 'IT 321', 
            name: 'Information Assurance', 
            units: 3, 
            type: 'Lecture', 
            category: 'Major', 
            assignedTo: 'Mr. Juan Cruz', 
            room: 'Room 301', // Simple Name
            schedule: 'Mon 09:00 AM - 12:00 PM' 
        },
        { 
            id: 2, 
            code: 'MATH 1', 
            name: 'Calculus 1', 
            units: 5, 
            type: 'Lecture', 
            category: 'Math', 
            assignedTo: null, 
            room: null, // Will show TBA
            schedule: null 
        },
        { 
            id: 3, 
            code: 'GE 4', 
            name: 'Mathematics in Modern World', 
            units: 3, 
            type: 'Lecture', 
            category: 'GenEd', 
            assignedTo: 'Ms. Ana Santos', 
            room: 'ComLab A', // Simple Name
            schedule: 'Wed 01:00 PM - 04:00 PM' 
        },
    ]);

    const facultyList = [
        { id: 101, name: 'Mr. Juan Cruz', status: 'Active' },
        { id: 102, name: 'Ms. Ana Santos', status: 'Active' },
        { id: 103, name: 'Sir. Benigno Aquino', status: 'Active' },
    ];

    // --- UPDATED ROOM LIST (Simple Names) ---
    const availableRooms = [
        "Room 301",
        "Room 302",
        "Room 303",
        "ComLab A",
        "ComLab B",
        "AVR"
    ];

    const [logs, setLogs] = useState([
        { time: '10:00 AM', action: 'System initialized', user: 'System' },
    ]);

    // --- FUNCTIONS ---

    const addLog = (action) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLogs(prev => [{ time, action, user: 'You' }, ...prev]);
    };

    // 1. Create Course
    const handleCreateCourse = (e) => {
        e.preventDefault();
        const courseObj = { ...newCourse, id: Date.now(), assignedTo: null, room: null, schedule: null };
        setCourses([...courses, courseObj]);
        addLog(`Created new course: ${newCourse.code}`);
        setShowCreateModal(false);
        setNewCourse({ code: '', name: '', units: 3, type: 'Lecture', category: 'Major' });
    };

    // 2. Assign Faculty
    const openAssignModal = (courseId) => {
        setSelectedCourseId(courseId);
        setShowAssignModal(true);
    };

    const handleAssignTeacher = (teacherName) => {
        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourseId) return { ...course, assignedTo: teacherName };
            return course;
        });
        setCourses(updatedCourses);
        addLog(`Assigned ${teacherName} to a subject`);
        setShowAssignModal(false);
    };

    // 3. Assign Room & Schedule (Fixed Logic)
    const openRoomModal = (courseId) => {
        setSelectedCourseId(courseId);
        setShowRoomModal(true);
    };

    const handleAssignRoom = (e) => {
        e.preventDefault();
        const scheduleStr = `${roomForm.day.substring(0,3)} ${roomForm.startTime} - ${roomForm.endTime}`;
        
        const updatedCourses = courses.map(c => {
            if (c.id === selectedCourseId) {
                return { ...c, room: roomForm.roomName, schedule: scheduleStr };
            }
            return c;
        });
        
        setCourses(updatedCourses);

        const targetCourse = courses.find(c => c.id === selectedCourseId);
        if (targetCourse) {
            addLog(`Assigned ${roomForm.roomName} to ${targetCourse.code}`);
        }

        setShowRoomModal(false);
    };

    // Delete
    const handleDeleteCourse = (id, code) => {
        if (window.confirm(`Delete ${code}?`)) {
            setCourses(courses.filter(c => c.id !== id));
            addLog(`Deleted course: ${code}`);
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Department Load & Room Assignment`, 14, 20);
        const tableRows = courses.map(c => [
            c.code, c.name, c.assignedTo || "Unassigned", c.room || "TBA", c.schedule || "TBA"
        ]);
        autoTable(doc, {
            head: [["Code", "Description", "Instructor", "Room", "Schedule"]],
            body: tableRows,
            startY: 30,
            headStyles: { fillColor: [166, 37, 37] }
        });
        doc.save('Dept_Assignments.pdf');
    };

    return (
        <div className="dept-mgmt-container">
            {/* HEADER */}
            <div className="mgmt-header">
                <div>
                    <h2>Curriculum & Room Management</h2>
                    <span className="dept-badge"><i className="fas fa-building"></i> {department}</span>
                </div>
                <div className="header-actions">
                    <button className="mgmt-btn outline" onClick={handleDownloadPDF}>
                        <i className="fas fa-file-pdf"></i> Download Load
                    </button>
                    <button className="mgmt-btn primary" onClick={() => setShowCreateModal(true)}>
                        <i className="fas fa-plus"></i> Create New Course
                    </button>
                </div>
            </div>

            <div className="mgmt-layout">
                {/* TABLE */}
                <div className="course-list-section card">
                    <h3>Course Loads & Room Assignments</h3>
                    <div className="table-responsive">
                        <table className="mgmt-table">
                            <thead>
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Assigned Faculty</th>
                                    <th>Room & Schedule</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(course => (
                                    <tr key={course.id}>
                                        <td>
                                            <span className="code-pill">{course.code}</span>
                                            <div className="small-desc">{course.name}</div>
                                        </td>
                                        
                                        {/* Faculty Column */}
                                        <td>
                                            {course.assignedTo ? (
                                                <div className="assigned-pill">
                                                    <i className="fas fa-user-check"></i> {course.assignedTo}
                                                </div>
                                            ) : (
                                                <span className="unassigned-text">-- No Instructor --</span>
                                            )}
                                        </td>

                                        {/* Room Column (SIMPLE TEXT ONLY) */}
                                        <td>
                                            {course.room ? (
                                                <div className="room-info-box">
                                                    <div className="room-name">{course.room}</div>
                                                    <div className="sched-time">{course.schedule}</div>
                                                </div>
                                            ) : (
                                                <span className="tba-text">TBA</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="action-row">
                                                <button className="icon-action assign" title="Assign Faculty" onClick={() => openAssignModal(course.id)}>
                                                    <i className="fas fa-chalkboard-teacher"></i>
                                                </button>
                                                <button className="icon-action room" title="Assign Room" onClick={() => openRoomModal(course.id)}>
                                                    <i className="fas fa-door-open"></i>
                                                </button>
                                                <button className="icon-action delete" title="Delete" onClick={() => handleDeleteCourse(course.id, course.code)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* LOGS */}
                <div className="logs-section card">
                    <h3>Activity Log</h3>
                    <div className="logs-list">
                        {logs.map((log, index) => (
                            <div key={index} className="log-item">
                                <div className="log-icon"><i className="fas fa-history"></i></div>
                                <div className="log-details">
                                    <span className="log-action">{log.action}</span>
                                    <span className="log-meta">{log.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            
            {/* 1. Create Course */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3>Add New Course</h3>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group">
                                <label>Subject Code</label>
                                <input type="text" value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} required placeholder="e.g. IT 321" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input type="text" value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} required />
                            </div>
                            <button type="submit" className="submit-btn full">Create Course</button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Assign Faculty */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3>Assign Instructor</h3>
                            <button className="close-btn" onClick={() => setShowAssignModal(false)}>&times;</button>
                        </div>
                        <div className="faculty-select-list">
                            {facultyList.map(faculty => (
                                <button key={faculty.id} className="faculty-option-btn" onClick={() => handleAssignTeacher(faculty.name)}>
                                    <div className="fac-avatar">{faculty.name.charAt(0)}</div>
                                    <span className="fac-name">{faculty.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Assign Room */}
            {showRoomModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3>Assign Room & Schedule</h3>
                            <button className="close-btn" onClick={() => setShowRoomModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAssignRoom}>
                            <div className="form-group">
                                <label>Select Room</label>
                                <select 
                                    className="modal-select"
                                    value={roomForm.roomName} 
                                    onChange={e => setRoomForm({...roomForm, roomName: e.target.value})}
                                >
                                    {availableRooms.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Day of Week</label>
                                <select 
                                    className="modal-select"
                                    value={roomForm.day}
                                    onChange={e => setRoomForm({...roomForm, day: e.target.value})}
                                >
                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Start Time</label>
                                    <input type="time" className="modal-input" required 
                                        value={roomForm.startTime}
                                        onChange={e => setRoomForm({...roomForm, startTime: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>End Time</label>
                                    <input type="time" className="modal-input" required 
                                        value={roomForm.endTime}
                                        onChange={e => setRoomForm({...roomForm, endTime: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <button type="submit" className="submit-btn full">Save Assignment</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DeptHeadManagePage;