import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DeptHeadManagePage.css';

const DeptHeadManagePage = () => {
    // --- STATE MANAGEMENT ---
    const [department] = useState("College of Science (COS)");
    const [courses, setCourses] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    
    // Selection State
    const [selectedCourse, setSelectedCourse] = useState(null);
    
    // Form States
    const [newCourse, setNewCourse] = useState({
        code: '', name: '', units: 3
    });

    const [roomForm, setRoomForm] = useState({
        roomName: '', 
        day: 'Monday',
        startTime: '09:00 AM',
        endTime: '12:00 PM'
    });

    const [logs, setLogs] = useState([]);

    // --- 1. FETCH DATA FROM DB ---
    const fetchManagementData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/dept/management-data');
            setCourses(response.data.courses);
            setFacultyList(response.data.faculty);
            // Extract just the room names for the dropdown
            setAvailableRooms(response.data.rooms.map(r => r.room_name));
            if(response.data.rooms.length > 0) {
                setRoomForm(prev => ({...prev, roomName: response.data.rooms[0].room_name}));
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to load data from server.");
        }
    };

    useEffect(() => {
        fetchManagementData();
    }, []);

    // --- LOGGING HELPER ---
    const addLog = (action) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLogs(prev => [{ time, action, user: 'You' }, ...prev]);
    };

    // --- HANDLERS ---

    // 2. CREATE COURSE
    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/dept/create-subject', newCourse);
            addLog(`Created new subject: ${newCourse.code}`);
            setShowCreateModal(false);
            setNewCourse({ code: '', name: '', units: 3 });
            fetchManagementData(); // Refresh table
        } catch (error) {
            alert("Error creating course: " + (error.response?.data?.error || error.message));
        }
    };

    // 3. ASSIGN FACULTY
    const openAssignModal = (course) => {
        setSelectedCourse(course);
        setShowAssignModal(true);
    };

    const handleAssignTeacher = async (facultyId, facultyName) => {
        try {
            await axios.post('http://localhost:5000/api/dept/assign-faculty', {
                schedule_id: selectedCourse.schedule_id,
                subject_code: selectedCourse.subject_code,
                faculty_id: facultyId
            });
            addLog(`Assigned ${facultyName} to ${selectedCourse.subject_code}`);
            setShowAssignModal(false);
            fetchManagementData();
        } catch (error) {
            alert("Assignment failed.");
        }
    };

    // 4. ASSIGN ROOM
    const openRoomModal = (course) => {
        setSelectedCourse(course);
        setShowRoomModal(true);
    };

    const handleAssignRoom = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/dept/assign-room', {
                schedule_id: selectedCourse.schedule_id,
                subject_code: selectedCourse.subject_code,
                room_name: roomForm.roomName,
                day: roomForm.day,
                start_time: roomForm.startTime,
                end_time: roomForm.endTime
            });
            addLog(`Assigned ${roomForm.roomName} to ${selectedCourse.subject_code}`);
            setShowRoomModal(false);
            fetchManagementData();
        } catch (error) {
            alert("Room assignment failed.");
        }
    };

    // PDF Export
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Department Load & Room Assignment`, 14, 20);
        const tableRows = courses.map(c => [
            c.subject_code, 
            c.name, 
            c.assigned_faculty || "Unassigned", 
            c.room_name || "TBA", 
            c.schedule || "TBA"
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
                        <i className="fas fa-plus"></i> Create New Subject
                    </button>
                </div>
            </div>

            <div className="mgmt-layout">
                {/* TABLE */}
                <div className="course-list-section card">
                    <h3>Course Loads & Room Assignments {loading && "(Loading...)"}</h3>
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
                                    <tr key={course.subject_code + (course.schedule_id || 'new')}>
                                        <td>
                                            <span className="code-pill">{course.subject_code}</span>
                                            <div className="small-desc">{course.name}</div>
                                        </td>
                                        
                                        {/* Faculty Column */}
                                        <td>
                                            {course.assigned_faculty ? (
                                                <div className="assigned-pill">
                                                    <i className="fas fa-user-check"></i> {course.assigned_faculty}
                                                </div>
                                            ) : (
                                                <span className="unassigned-text">-- No Instructor --</span>
                                            )}
                                        </td>

                                        {/* Room Column */}
                                        <td>
                                            {course.room_name ? (
                                                <div className="room-info-box">
                                                    <div className="room-name">{course.room_name}</div>
                                                    <div className="sched-time">{course.schedule}</div>
                                                </div>
                                            ) : (
                                                <span className="tba-text">TBA</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="action-row">
                                                <button className="icon-action assign" title="Assign Faculty" onClick={() => openAssignModal(course)}>
                                                    <i className="fas fa-chalkboard-teacher"></i>
                                                </button>
                                                <button className="icon-action room" title="Assign Room" onClick={() => openRoomModal(course)}>
                                                    <i className="fas fa-door-open"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {courses.length === 0 && !loading && (
                                    <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No subjects found. Create one!</td></tr>
                                )}
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
                        {logs.length === 0 && <div style={{color:'#999', fontSize:'0.9em'}}>No recent activities.</div>}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            
            {/* 1. Create Course */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3>Add New Subject</h3>
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
                            <div className="form-group">
                                <label>Units</label>
                                <input type="number" value={newCourse.units} onChange={e => setNewCourse({...newCourse, units: e.target.value})} required min="1" max="6" />
                            </div>
                            <button type="submit" className="submit-btn full">Create Subject</button>
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
                                <button key={faculty.user_id} className="faculty-option-btn" onClick={() => handleAssignTeacher(faculty.user_id, faculty.name)}>
                                    <div className="fac-avatar">{faculty.name.charAt(0)}</div>
                                    <span className="fac-name">{faculty.name}</span>
                                </button>
                            ))}
                            {facultyList.length === 0 && <div>No faculty found.</div>}
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
                                    <input type="text" className="modal-input" placeholder="09:00 AM" required 
                                        value={roomForm.startTime}
                                        onChange={e => setRoomForm({...roomForm, startTime: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>End Time</label>
                                    <input type="text" className="modal-input" placeholder="12:00 PM" required 
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