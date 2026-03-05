import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
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
    const [isCustomRoom, setIsCustomRoom] = useState(false);

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

    // Camera/Device management
    const [devices, setDevices] = useState([]);
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [deviceForm, setDeviceForm] = useState({ device_name: '', room: '', ip_address: '', room_capacity: 40 });

    // --- ACADEMIC YEAR SETTINGS (from DB via API) ---
    const defaultAY = {
        academicYear: '2025-2026',
        semester: '2nd Semester',
        startMonth: 'August',
        endMonth: 'May',
    };
    const [ayConfig, setAyConfig] = useState(defaultAY);
    const [editingAY, setEditingAY] = useState(false);
    const [ayForm, setAyForm] = useState(defaultAY);

    useEffect(() => {
        const controller = new AbortController();
        // Fetch academic year from backend
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const deptId = storedUser.department_id;
        if (deptId) {
            api.get(`/api/dept/academic-year?dept_id=${deptId}`, { signal: controller.signal })
                .then(res => {
                    const needsSave = !res.data.academic_year || !res.data.semester;
                    const data = {
                        ...defaultAY,
                        academicYear: res.data.academic_year || defaultAY.academicYear,
                        semester: res.data.semester || defaultAY.semester,
                    };
                    setAyConfig(data);
                    setAyForm(data);
                    // Auto-save defaults to DB if not set yet
                    if (needsSave && storedUser.id) {
                        api.put('/api/dept/academic-year', {
                            user_id: storedUser.id,
                            academic_year: data.academicYear,
                            semester: data.semester,
                        }, { signal: controller.signal }).catch(err => {
                            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                                console.error('Failed to auto-save academic year:', err);
                            }
                        });
                    }
                })
                .catch(err => {
                    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                        console.error('Failed to fetch academic year:', err);
                    }
                });
        }
        return () => controller.abort();
    }, []);

    const handleSaveAY = async () => {
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        try {
            await api.put('/api/dept/academic-year', {
                user_id: storedUser.id,
                academic_year: ayForm.academicYear,
                semester: ayForm.semester,
            });
            setAyConfig(ayForm);
            setEditingAY(false);
            toast.success('Academic Year settings saved.');
        } catch (error) {
            toast.error('Failed to save academic year: ' + (error.response?.data?.detail?.error?.message || error.message));
        }
    };

    // --- 1. FETCH DATA FROM DB ---
    const fetchManagementData = async (signal) => {
        setLoading(true);
        try {
            // Pass current AY/semester to filter course load
            const params = {};
            if (ayConfig.academicYear) params.academic_year = ayConfig.academicYear;
            if (ayConfig.semester) params.semester = ayConfig.semester;

            const response = await api.get('/api/dept/management-data', { params, signal });
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
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error("Error fetching data:", error);
            }
        } finally {
            if (!signal || !signal.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchManagementData(controller.signal);
        // Fetch devices for camera management
        api.get('/api/dept/devices', { signal: controller.signal })
            .then(res => setDevices(res.data || []))
            .catch(err => { if (err.name !== 'AbortError' && err.name !== 'CanceledError') console.error('Device fetch error:', err); });
        return () => controller.abort();
    }, [ayConfig.academicYear, ayConfig.semester]); // Re-fetch when AY/semester changes

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
            await api.post('/api/dept/create-subject', newCourse);
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
            await api.post('/api/dept/assign-faculty', {
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
        // Pre-fill room with the course's current room if available
        const currentRoom = course.room_name || '';
        const isExisting = currentRoom === '' || availableRooms.includes(currentRoom);
        setIsCustomRoom(!isExisting && currentRoom !== '');
        setRoomForm(prev => ({
            ...prev,
            roomName: currentRoom || (availableRooms[0] || '')
        }));
        setShowRoomModal(true);
    };

    const handleAssignRoom = async (e) => {
        e.preventDefault();
        if (!selectedCourse) return;

        try {
            await api.post('/api/dept/assign-room', {
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

    // Delete course handler
    const handleDeleteCourse = async (course) => {
        if (!window.confirm(`Delete subject "${course.subject_code} - ${course.name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/dept/subjects/${course.subject_id || course.id}`);
            addLog(`Deleted subject ${course.subject_code}`);
            fetchManagementData();
            toast.success(`Deleted ${course.subject_code}`);
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete subject. It may have enrolled students.');
        }
    };

    // Camera/Device management handlers
    const fetchDevices = async () => {
        try {
            const res = await api.get('/api/dept/devices');
            setDevices(res.data || []);
        } catch (err) { console.error('Device fetch error:', err); }
    };
    const handleAddDevice = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/dept/devices', deviceForm);
            toast.success('Camera device registered');
            addLog(`Registered device "${deviceForm.device_name}" in ${deviceForm.room}`);
            setShowDeviceModal(false);
            setDeviceForm({ device_name: '', room: '', ip_address: '', room_capacity: 40 });
            fetchDevices();
            fetchManagementData(); // Refresh rooms list
        } catch (err) {
            console.error('Add device failed:', err);
            toast.error('Failed to register device');
        }
    };
    const handleDeleteDevice = async (device) => {
        if (!window.confirm(`Remove device "${device.device_name}"?`)) return;
        try {
            await api.delete(`/api/dept/devices/${device.id}`);
            toast.success('Device removed');
            addLog(`Removed device "${device.device_name}"`);
            fetchDevices();
        } catch (err) {
            toast.error('Failed to remove device');
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
            {/* ── ACADEMIC YEAR SETTINGS CARD ── */}
            <div className="ay-settings-card card">
                <div className="ay-settings-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="fas fa-calendar-alt" style={{ color: '#163269', fontSize: '1.1rem' }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#163269' }}>Academic Year Settings</h3>
                            <p style={{ margin: 0, fontSize: '0.82em', color: '#666' }}>Controls the active academic period for reports and calendar limits.</p>
                        </div>
                    </div>
                    {!editingAY ? (
                        <button className="mgmt-btn outline" style={{ padding: '6px 14px' }} onClick={() => setEditingAY(true)}>
                            <i className="fas fa-pen" /> Edit
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="mgmt-btn outline" style={{ padding: '6px 14px' }} onClick={() => setEditingAY(false)}>Cancel</button>
                            <button className="mgmt-btn primary" style={{ padding: '6px 14px' }} onClick={handleSaveAY}>
                                <i className="fas fa-save" /> Save
                            </button>
                        </div>
                    )}
                </div>

                {!editingAY ? (
                    <div className="ay-info-row">
                        <div className="ay-stat">
                            <span className="ay-stat-label">Academic Year</span>
                            <span className="ay-stat-value">{ayConfig.academicYear}</span>
                        </div>
                        <div className="ay-stat">
                            <span className="ay-stat-label">Semester</span>
                            <span className="ay-stat-value">{ayConfig.semester}</span>
                        </div>
                        <div className="ay-stat">
                            <span className="ay-stat-label">Start Date</span>
                            <span className="ay-stat-value">{ayConfig.startMonth}</span>
                        </div>
                        <div className="ay-stat">
                            <span className="ay-stat-label">End Date</span>
                            <span className="ay-stat-value">{ayConfig.endMonth}</span>
                        </div>
                    </div>
                ) : (
                    <div className="ay-edit-form">
                        <div className="form-row">
                            <div className="form-group half">
                                <label>Academic Year</label>
                                <input
                                    type="text"
                                    className="modal-input"
                                    placeholder="e.g. 2025-2026"
                                    value={ayForm.academicYear}
                                    onChange={e => setAyForm({ ...ayForm, academicYear: e.target.value })}
                                />
                            </div>
                            <div className="form-group half">
                                <label>Semester</label>
                                <select
                                    className="modal-select"
                                    value={ayForm.semester}
                                    onChange={e => setAyForm({ ...ayForm, semester: e.target.value })}
                                >
                                    <option>1st Semester</option>
                                    <option>2nd Semester</option>
                                    <option>Summer</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group half">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    className="modal-input"
                                    value={ayForm.startMonth}
                                    onChange={e => setAyForm({ ...ayForm, startMonth: e.target.value })}
                                />
                            </div>
                            <div className="form-group half">
                                <label>End Date <span style={{ fontSize: '0.75em', color: '#888' }}>(okay to update later)</span></label>
                                <input
                                    type="date"
                                    className="modal-input"
                                    value={ayForm.endMonth}
                                    onChange={e => setAyForm({ ...ayForm, endMonth: e.target.value })}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.78em', color: '#666', margin: '4px 0 0' }}>
                            <i className="fas fa-info-circle" style={{ marginRight: 4 }}></i>
                            If you are unsure of the end date, enter an initial estimate. You can update it anytime.
                        </p>
                    </div>
                )}
            </div>

            {/* ── CAMERA MANAGEMENT CARD ── */}
            <div className="ay-settings-card card" style={{ marginTop: 16 }}>
                <div className="ay-settings-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="fas fa-video" style={{ color: '#163269', fontSize: '1.1rem' }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#163269' }}>Camera Management</h3>
                            <p style={{ margin: 0, fontSize: '0.82em', color: '#666' }}>Manage camera devices assigned to rooms for face recognition.</p>
                        </div>
                    </div>
                    <button className="mgmt-btn primary" style={{ fontSize: '0.85rem', padding: '6px 14px' }} onClick={() => setShowDeviceModal(true)}>
                        <i className="fas fa-plus"></i> Add Camera
                    </button>
                </div>
                {devices.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '0.9em', padding: '10px 0' }}>No camera devices registered yet. Click "Add Camera" to set one up.</p>
                ) : (
                    <div className="table-responsive" style={{ marginTop: 10 }}>
                        <table className="mgmt-table" style={{ fontSize: '0.88em' }}>
                            <thead>
                                <tr>
                                    <th>Device Name</th>
                                    <th>Room</th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                    <th>Last Heartbeat</th>
                                    <th style={{ width: 60 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.device_name}</td>
                                        <td>{d.room || '—'}</td>
                                        <td>{d.ip_address || '—'}</td>
                                        <td>
                                            <span className={`status-badge ${d.status === 'ACTIVE' ? 'active' : d.status === 'INACTIVE' ? 'inactive' : 'maintenance'}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td>{d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleString() : 'Never'}</td>
                                        <td>
                                            <button className="icon-action delete" title="Remove" onClick={() => handleDeleteDevice(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
                                        <th>Instructor</th>
                                        <th>Room & Schedule</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(course => (
                                        <tr key={course.subject_code + (course.schedule_id || Math.random())} className="user-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedCourse(course)}>
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
                                                    <button className="icon-action assign" title="Change Instructor" onClick={(e) => { e.stopPropagation(); openAssignModal(course); }}>
                                                        <i className="fas fa-chalkboard-teacher"></i>
                                                    </button>
                                                    <button className="icon-action room" title="Assign Room" onClick={(e) => { e.stopPropagation(); openRoomModal(course); }}>
                                                        <i className="fas fa-door-open"></i>
                                                    </button>
                                                    <button className="icon-action" title="Delete Subject" style={{ color: '#dc2626' }} onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course); }}>
                                                        <i className="fas fa-trash"></i>
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
                                <label>Subject Code <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} required placeholder="e.g. IT 321" />
                            </div>
                            <div className="form-group">
                                <label>Subject Name <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required placeholder="e.g. Web Systems and Technologies" />
                            </div>
                            <div className="form-group">
                                <label>Instructor</label>
                                <select className="modal-select" value={newCourse.faculty_id || ''} onChange={e => setNewCourse({ ...newCourse, faculty_id: e.target.value })}>
                                    <option value="">-- Select Instructor --</option>
                                    {facultyList.map(f => <option key={f.user_id} value={f.user_id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Room</label>
                                <select className="modal-select" value={newCourse.room || ''} onChange={e => setNewCourse({ ...newCourse, room: e.target.value })}>
                                    <option value="">-- Select Room (or Online) --</option>
                                    <option value="Online">Online</option>
                                    {availableRooms.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
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

            {/* 2. Change Instructor */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3>Change Instructor</h3>
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
                            <h3>Assign Room &amp; Schedule</h3>
                            <button className="close-btn" onClick={() => { setShowRoomModal(false); setIsCustomRoom(false); }}>&times;</button>
                        </div>
                        <form onSubmit={handleAssignRoom}>
                            <div className="form-group">
                                <label>Room</label>
                                <select
                                    className="modal-select"
                                    value={isCustomRoom ? '__custom__' : roomForm.roomName}
                                    onChange={e => {
                                        if (e.target.value === '__custom__') {
                                            setIsCustomRoom(true);
                                            setRoomForm({ ...roomForm, roomName: '' });
                                        } else {
                                            setIsCustomRoom(false);
                                            setRoomForm({ ...roomForm, roomName: e.target.value });
                                        }
                                    }}
                                >
                                    {availableRooms.length > 0 ? (
                                        availableRooms.map(r => <option key={r} value={r}>{r}</option>)
                                    ) : (
                                        <option value="">No rooms available yet</option>
                                    )}
                                    <option value="__custom__">＋ Add new room...</option>
                                </select>
                                {isCustomRoom && (
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="Enter room name (e.g. MH-301)"
                                        required
                                        autoFocus
                                        value={roomForm.roomName}
                                        onChange={e => setRoomForm({ ...roomForm, roomName: e.target.value })}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
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

            {/* ── ADD CAMERA MODAL ── */}
            {showDeviceModal && (
                <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3>Register Camera Device</h3>
                            <button className="modal-close" onClick={() => setShowDeviceModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddDevice}>
                            <div className="form-group">
                                <label>Device Name *</label>
                                <input className="modal-input" required placeholder="e.g. RPi-CL1"
                                    value={deviceForm.device_name}
                                    onChange={e => setDeviceForm({ ...deviceForm, device_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Room *</label>
                                <select className="modal-select" required
                                    value={deviceForm.room}
                                    onChange={e => setDeviceForm({ ...deviceForm, room: e.target.value })}>
                                    <option value="">Select room...</option>
                                    {availableRooms.filter(r => r !== 'Online').map((r, i) => (
                                        <option key={i} value={r}>{r}</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '0.78em', color: '#888', margin: '4px 0 0' }}>
                                    Rooms are populated from class schedules. Upload schedules first to see rooms here.
                                </p>
                            </div>
                            <div className="form-group">
                                <label>IP Address (optional)</label>
                                <input className="modal-input" placeholder="e.g. 192.168.1.50"
                                    value={deviceForm.ip_address}
                                    onChange={e => setDeviceForm({ ...deviceForm, ip_address: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Room Capacity</label>
                                <input type="number" className="modal-input" min={1} max={500}
                                    value={deviceForm.room_capacity}
                                    onChange={e => setDeviceForm({ ...deviceForm, room_capacity: parseInt(e.target.value) || 40 })} />
                            </div>
                            <button type="submit" className="submit-btn full">Register Device</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── COURSE DETAIL MODAL ── */}
            {selectedCourse && !showAssignModal && !showRoomModal && (
                <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>{selectedCourse.subject_code} — {selectedCourse.name}</h3>
                            <button className="modal-close" onClick={() => setSelectedCourse(null)}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div><strong>Instructor:</strong> {selectedCourse.assigned_faculty || 'Unassigned'}</div>
                            <div><strong>Room:</strong> {selectedCourse.room_name || 'TBA'}</div>
                            <div><strong>Schedule:</strong> {selectedCourse.schedule || 'TBA'}</div>
                            <div><strong>Section:</strong> {selectedCourse.section || '—'}</div>
                            <div><strong>Enrolled Students:</strong> {selectedCourse.enrolled_count ?? '—'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button className="submit-btn" style={{ background: '#163269' }}
                                onClick={() => { const c = selectedCourse; setSelectedCourse(null); openAssignModal(c); }}>
                                <i className="fas fa-user-edit" /> Change Instructor
                            </button>
                            <button className="submit-btn" style={{ background: '#1a5632' }}
                                onClick={() => { const c = selectedCourse; setSelectedCourse(null); openRoomModal(c); }}>
                                <i className="fas fa-door-open" /> Assign Room
                            </button>
                            <button className="submit-btn" style={{ background: '#b91c1c' }}
                                onClick={() => { const c = selectedCourse; setSelectedCourse(null); handleDeleteCourse(c); }}>
                                <i className="fas fa-trash" /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DeptHeadManagePage;
