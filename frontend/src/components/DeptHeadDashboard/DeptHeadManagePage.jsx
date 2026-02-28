import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../Common/ToastProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DeptHeadManagePage.css';

// ============================================
// Weekly Calendar View (Read-Only)
// ============================================
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7AM to 9PM

const FACULTY_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
];

const WeeklyCalendarView = ({ courses }) => {
    // Parse schedule strings like "Monday 9:00 AM - 12:00 PM" into structured data
    const calendarEvents = useMemo(() => {
        const events = [];
        const facultyColorMap = {};
        let colorIdx = 0;

        courses.forEach(course => {
            if (!course.schedule || !course.room_name) return;

            // Assign color per faculty
            const faculty = course.assigned_faculty || 'Unassigned';
            if (!facultyColorMap[faculty]) {
                facultyColorMap[faculty] = FACULTY_COLORS[colorIdx % FACULTY_COLORS.length];
                colorIdx++;
            }

            // Parse schedule: "Monday 9:00 AM - 12:00 PM"
            const match = course.schedule.match(/^(\w+)\s+(\d{1,2}:\d{2}\s*[APap][Mm])\s*-\s*(\d{1,2}:\d{2}\s*[APap][Mm])$/);
            if (!match) return;

            const day = match[1];
            const startStr = match[2].toUpperCase().trim();
            const endStr = match[3].toUpperCase().trim();

            const parseTime = (str) => {
                const [time, period] = str.split(/\s+/);
                let [h, m] = time.split(':').map(Number);
                if (period === 'PM' && h !== 12) h += 12;
                if (period === 'AM' && h === 12) h = 0;
                return h + m / 60;
            };

            events.push({
                day,
                startHour: parseTime(startStr),
                endHour: parseTime(endStr),
                subject: course.subject_code,
                faculty,
                room: course.room_name,
                color: facultyColorMap[faculty]
            });
        });

        return { events, facultyColorMap };
    }, [courses]);

    const { events, facultyColorMap } = calendarEvents;

    return (
        <div className="weekly-calendar-container card">
            <div className="calendar-header-row">
                <h3><i className="fas fa-calendar-week"></i> Weekly Schedule Overview</h3>
                <div className="calendar-legend">
                    {Object.entries(facultyColorMap).map(([name, color]) => (
                        <span key={name} className="legend-item">
                            <span className="legend-dot" style={{ background: color }}></span>
                            {name}
                        </span>
                    ))}
                </div>
            </div>
            <div className="calendar-scroll-wrapper">
                <table className="calendar-grid">
                    <thead>
                        <tr>
                            <th className="time-col">Time</th>
                            {DAYS.map(d => <th key={d}>{d.slice(0, 3)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {HOURS.map(hour => (
                            <tr key={hour}>
                                <td className="time-cell">
                                    {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}
                                </td>
                                {DAYS.map(day => {
                                    // Find events that occupy this cell
                                    const cellEvents = events.filter(e =>
                                        e.day === day && e.startHour <= hour && e.endHour > hour
                                    );
                                    // Only render block at start hour
                                    const startsHere = cellEvents.filter(e => Math.floor(e.startHour) === hour);
                                    const occupied = cellEvents.length > 0 && startsHere.length === 0;

                                    return (
                                        <td key={day} className={`calendar-cell ${occupied ? 'occupied' : ''}`}>
                                            {startsHere.map((evt, i) => {
                                                const span = Math.ceil(evt.endHour - evt.startHour);
                                                return (
                                                    <div key={i} className="cal-event-block" style={{
                                                        background: evt.color,
                                                        height: `${span * 100}%`,
                                                        minHeight: `${span * 44}px`
                                                    }}>
                                                        <span className="cal-evt-subject">{evt.subject}</span>
                                                        <span className="cal-evt-faculty">{evt.faculty}</span>
                                                        <span className="cal-evt-room">{evt.room}</span>
                                                    </div>
                                                );
                                            })}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DeptHeadManagePage = () => {
    const toast = useToast();
    // --- STATE MANAGEMENT ---
    const [department] = useState("College of Science (COS)");
    const [courses, setCourses] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

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
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/dept/management-data');
            if (response.data) {
                setCourses(response.data.courses || []);
                setFacultyList(response.data.faculty || []);

                // Extract just the room names for the dropdown if rooms exist
                const rooms = response.data.rooms || [];
                setAvailableRooms(rooms.map(r => r.room_name));

                if (rooms.length > 0) {
                    setRoomForm(prev => ({ ...prev, roomName: rooms[0].room_name }));
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            // Optional: alert("Failed to load data from server."); 
            // Suppressed alert on load to prevent spamming if backend is down
        } finally {
            setLoading(false);
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
            toast.error("Error creating course: " + (error.response?.data?.error || error.message));
        }
    };

    // 3. ASSIGN FACULTY
    const openAssignModal = (course) => {
        setSelectedCourse(course);
        setShowAssignModal(true);
    };

    const handleAssignTeacher = async (facultyId, facultyName) => {
        if (!selectedCourse) return;
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
            console.error("Assignment failed:", error);
            toast.error("Assignment failed. Check console for details.");
        }
    };

    // 4. ASSIGN ROOM
    const openRoomModal = (course) => {
        setSelectedCourse(course);
        setShowRoomModal(true);
    };

    const handleAssignRoom = async (e) => {
        e.preventDefault();
        if (!selectedCourse) return;

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
            console.error("Room assignment failed:", error);
            toast.error("Room assignment failed. Check console for details.");
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
            headStyles: { fillColor: [22, 50, 105] } // Adjusted to Navy
        });
        doc.save('Dept_Assignments.pdf');
    };

    return (
        <div className="dept-mgmt-container">
            {/* HEADER */}
            <div className="mgmt-header">
                <div>
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

            {/* View Toggle */}
            <div className="view-toggle-bar">
                <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                    <i className="fas fa-list"></i> List View
                </button>
                <button className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
                    <i className="fas fa-calendar-week"></i> Calendar View
                </button>
            </div>

            {viewMode === 'calendar' ? (
                <WeeklyCalendarView courses={courses} />
            ) : (
                <div className="mgmt-layout">
                    {/* TABLE */}
                    <div className="course-list-section card">
                        <h3>Course Loads & Room Assignments {loading && <span style={{ fontSize: '0.8em', color: '#888' }}>(Refreshing...)</span>}</h3>
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
                                        <tr key={course.subject_code + (course.schedule_id || Math.random())}>
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
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No subjects found. Create one!</td></tr>
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
                            {logs.length === 0 && <div style={{ color: '#999', fontSize: '0.9em' }}>No recent activities.</div>}
                        </div>
                    </div>
                </div>

            )}

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
                                <input type="text" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} required placeholder="e.g. IT 321" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input type="text" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Units</label>
                                <input type="number" value={newCourse.units} onChange={e => setNewCourse({ ...newCourse, units: e.target.value })} required min="1" max="6" />
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
                                    onChange={e => setRoomForm({ ...roomForm, roomName: e.target.value })}
                                >
                                    {availableRooms.length > 0 ? (
                                        availableRooms.map(r => <option key={r} value={r}>{r}</option>)
                                    ) : (
                                        <option value="">No rooms available</option>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Day of Week</label>
                                <select
                                    className="modal-select"
                                    value={roomForm.day}
                                    onChange={e => setRoomForm({ ...roomForm, day: e.target.value })}
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
                                        onChange={e => setRoomForm({ ...roomForm, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>End Time</label>
                                    <input type="text" className="modal-input" placeholder="12:00 PM" required
                                        value={roomForm.endTime}
                                        onChange={e => setRoomForm({ ...roomForm, endTime: e.target.value })}
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
