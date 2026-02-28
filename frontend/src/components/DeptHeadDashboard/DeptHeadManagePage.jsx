import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../Common/ToastProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CreateSubjectModal, AssignFacultyModal, AssignRoomModal } from './DeptHeadManageModals';
import './DeptHeadManagePage.css';

const DeptHeadManagePage = () => {
    const toast = useToast();
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
    const fetchManagementData = async (signal) => {
        setLoading(true);
        try {
            const response = await api.get('/api/dept/management-data', { signal });
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
            if (error.code !== 'ERR_CANCELED') {
                console.error("Error fetching data:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchManagementData(controller.signal);
        return () => controller.abort();
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
            await api.post('/api/dept/create-subject', newCourse);
            addLog(`Created new subject: ${newCourse.code}`);
            setShowCreateModal(false);
            setNewCourse({ code: '', name: '', units: 3 });
            fetchManagementData();
        } catch (error) {
            toast.error(error.userMessage || "Error creating course.");
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
            toast.error(error.userMessage || "Assignment failed.");
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
            toast.error(error.userMessage || "Room assignment failed.");
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

            {/* --- MODALS (extracted to DeptHeadManageModals.jsx) --- */}
            {showCreateModal && (
                <CreateSubjectModal
                    newCourse={newCourse}
                    setNewCourse={setNewCourse}
                    onSubmit={handleCreateCourse}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {showAssignModal && (
                <AssignFacultyModal
                    facultyList={facultyList}
                    onAssign={handleAssignTeacher}
                    onClose={() => setShowAssignModal(false)}
                />
            )}

            {showRoomModal && (
                <AssignRoomModal
                    roomForm={roomForm}
                    setRoomForm={setRoomForm}
                    availableRooms={availableRooms}
                    onSubmit={handleAssignRoom}
                    onClose={() => setShowRoomModal(false)}
                />
            )}

        </div>
    );
};

export default DeptHeadManagePage;
