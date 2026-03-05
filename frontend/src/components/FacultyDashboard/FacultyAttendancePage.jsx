import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../Common/ToastProvider';
import { generateFramesPDF } from '../../utils/ReportGenerator';
import '../StudentDashboard/AttendanceHistoryPage.css'; // Inheriting Student style

const StatusBadge = ({ status }) => {
    let cls = 'neutral';
    if (status === 'Present') cls = 'success';
    else if (status === 'On Break') cls = 'warning';
    else if (status === 'Late') cls = 'warning';
    else if (status === 'Absent') cls = 'danger';
    else if (status === 'Left') cls = 'neutral';
    return (
        <span className={`log-status-tag ${cls}`}>
            {status?.toUpperCase() || 'ABSENT'}
        </span>
    );
};

const FacultyAttendancePage = () => {
    const toast = useToast();

    // --- STATES ---
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    // --- DATA STATES ---
    const [myClasses, setMyClasses] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [user, setUser] = useState(null);

    // --- EDIT MODAL STATES ---
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editTime, setEditTime] = useState('');
    const [editRemarks, setEditRemarks] = useState('');
    const [saving, setSaving] = useState(false);

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const controller = new AbortController();
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSchedule(parsedUser.user_id || parsedUser.id, controller.signal);
        }
        return () => controller.abort();
    }, []);

    // --- 2. FETCH SCHEDULE (API) ---
    const fetchSchedule = async (userId, signal) => {
        try {
            const response = await api.get(`/api/faculty/schedule/${userId}`, { signal });
            setMyClasses(response.data);
            setLoading(false);
        } catch (error) {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error('Error loading schedule:', error);
                setLoading(false);
            }
        }
    };

    // --- 3. FETCH CLASS DETAILS (API) with date param ---
    const fetchClassDetails = useCallback(async (clsId, targetDate) => {
        if (!clsId) {
            setStudentList([]);
            return;
        }
        setLoading(true);
        try {
            const params = {};
            if (targetDate) params.date = targetDate;
            const response = await api.get(`/api/faculty/class-details/${clsId}`, { params });
            setStudentList(response.data);
        } catch (error) {
            console.error('Error loading students:', error);
            toast.error('Could not load student list.');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const handleClassChange = async (e) => {
        const clsId = e.target.value;
        setSelectedClassId(clsId);
        const cls = myClasses.find(c => c.id.toString() === clsId) || null;
        setSelectedClass(cls);
        await fetchClassDetails(clsId, filterDate);
    };

    // Re-fetch when date changes with backend filtering
    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setFilterDate(newDate);
        if (selectedClassId) {
            fetchClassDetails(selectedClassId, newDate);
        }
    };

    // --- 4. LOCAL SEARCH FILTER (date filtering is now backend-side) ---
    const getFilteredStudents = () => {
        const query = searchTerm.toLowerCase();
        return studentList.filter(s => {
            return (
                (s.lastName?.toLowerCase() || '').includes(query) ||
                (s.firstName?.toLowerCase() || '').includes(query)
            );
        });
    };

    // --- EDIT MODAL HANDLERS ---
    const openEditModal = (student) => {
        setEditingStudent(student);
        // Convert "08:15 AM" to "08:15" for the time input
        if (student.timeIn && student.timeIn !== '---') {
            try {
                const [timePart, ampm] = student.timeIn.split(' ');
                let [hours, minutes] = timePart.split(':').map(Number);
                if (ampm === 'PM' && hours !== 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                setEditTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
            } catch {
                setEditTime('');
            }
        } else {
            setEditTime('');
        }
        setEditRemarks(student.remarks || '');
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingStudent?.entry_log_id) {
            toast.error('No attendance entry to edit. Student may be absent.');
            return;
        }
        if (!editTime) {
            toast.error('Please enter a valid time.');
            return;
        }
        if (saving) return;
        setSaving(true);
        try {
            await api.put(`/api/faculty/attendance/${editingStudent.entry_log_id}`, {
                new_time: editTime,
                remarks: editRemarks || null,
            });
            toast.success('Attendance updated successfully.');
            setEditModalOpen(false);
            // Refresh data
            await fetchClassDetails(selectedClassId, filterDate);
        } catch (error) {
            toast.error('Failed to update: ' + (error.response?.data?.detail?.error?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    // --- 5. EXPORT PDF ---
    const handleClassExport = () => {
        if (!selectedClass) return;
        const reportInfo = {
            title: `${selectedClass.subject_title} Attendance`,
            type: 'CLASS ATTENDANCE REPORT',
            category: 'class',
            context: {
                classCode: selectedClass.subject_code,
                section: selectedClass.section,
            },
            dateRange: new Date(filterDate + 'T00:00:00').toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
        };

        const tableData = getFilteredStudents().map(s => ({
            'Student Name': `${s.lastName}, ${s.firstName}`,
            'ID Number': s.tupm_id,
            'Time In': s.timeIn || '--',
            'Time Out': s.timeOut || '--',
            'Status': s.status || 'Absent',
            'Remarks': s.remarks || '',
        }));

        generateFramesPDF(reportInfo, tableData);
    };

    // --- SUMMARY COUNTS ---
    const summaryCounts = () => {
        const filtered = getFilteredStudents();
        return {
            present: filtered.filter(s => s.status === 'Present' || s.status === 'Left').length,
            late: filtered.filter(s => s.status === 'Late').length,
            onBreak: filtered.filter(s => s.status === 'On Break').length,
            absent: filtered.filter(s => s.status === 'Absent' || !s.status || s.status === 'No Record').length,
            total: studentList.length,
        };
    };

    const counts = summaryCounts();
    const displayStudents = getFilteredStudents();

    if (!user) return <div className="loading">Please log in.</div>;

    return (
        <div className="attendance-history-view">

            {/* ── HEADER FILTER SECTION ── */}
            <div className="reports-header-section">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px', width: '100%' }}>

                    {/* Class Selector */}
                    <div className="report-selector-group" style={{ marginBottom: 0, flex: '1 1 260px' }}>
                        <label>Select Class Section:</label>
                        <select
                            className="app-select big-select"
                            value={selectedClassId}
                            onChange={handleClassChange}
                        >
                            <option value="">-- Choose a Class --</option>
                            {myClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.subject_title} ({cls.subject_code}) — {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="filter-item" style={{ flex: '0 0 auto' }}>
                        <label>Session Date:</label>
                        <input
                            type="date"
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95em' }}
                            value={filterDate}
                            onChange={handleDateChange}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Search */}
                    {selectedClass && (
                        <div className="filter-item" style={{ flex: '0 0 auto' }}>
                            <label>Search Student:</label>
                            <input
                                type="text"
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '200px', fontSize: '0.95em' }}
                                placeholder="Search name…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Info banner */}
                <div className="report-description-box" style={{ marginTop: '0px' }}>
                    <i className="fas fa-users" />
                    <span>
                        {selectedClass
                            ? `Viewing attendance for ${selectedClass.subject_title} (${selectedClass.section}) on ${new Date(filterDate + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
                            : 'Select a class from the dropdown and choose a date to view attendance records.'}
                    </span>
                </div>
            </div>

            {/* ── SUMMARY STAT CHIPS ── */}
            {selectedClass && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={statChip('#E6F4EA', '#2E7D32')}>
                        <strong>{counts.present}</strong> <span>Present</span>
                    </div>
                    <div style={statChip('#FFF3E0', '#E65100')}>
                        <strong>{counts.late}</strong> <span>Late</span>
                    </div>
                    <div style={statChip('#FFF8E1', '#F9A825')}>
                        <strong>{counts.onBreak}</strong> <span>On Break</span>
                    </div>
                    <div style={statChip('#FFEBEE', '#C62828')}>
                        <strong>{counts.absent}</strong> <span>Absent</span>
                    </div>
                    <div style={statChip('#f1f5f9', '#475569')}>
                        <strong>{counts.total}</strong> <span>Total Enrolled</span>
                    </div>
                </div>
            )}

            {/* ── TABLE CARD ── */}
            {selectedClass && (
                <div className="card recent-reports-card">
                    <div className="recent-reports-header">
                        <h3>Class Attendance List</h3>
                        <div className="recent-reports-filters">
                            <button className="export-all-button" onClick={handleClassExport}>
                                <i className="fas fa-file-pdf" /> Download Report
                            </button>
                        </div>
                    </div>

                    <div className="reports-table-container">
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>Loading Students…</div>
                        ) : (
                            <table className="recent-reports-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>ID Number</th>
                                        <th>Time In</th>
                                        <th>Time Out</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Edit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayStudents.map(student => (
                                        <tr key={student.user_id}>
                                            <td style={{ fontWeight: '600', color: '#333' }}>
                                                {student.lastName}, {student.firstName}
                                            </td>
                                            <td style={{ color: '#666' }}>{student.tupm_id}</td>
                                            <td>{student.timeIn || '--'}</td>
                                            <td>{student.timeOut || '--'}</td>
                                            <td>
                                                <StatusBadge status={student.status || 'Absent'} />
                                            </td>
                                            <td style={{ color: student.remarks === 'Late' ? 'orange' : '#555' }}>
                                                {student.remarks || '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {student.entry_log_id ? (
                                                    <button
                                                        onClick={() => openEditModal(student)}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#163269', fontSize: '0.9rem', padding: '4px 8px',
                                                        }}
                                                        title="Edit time-in"
                                                    >
                                                        <i className="fas fa-pen" />
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#ccc' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {displayStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                                No attendance records found for this date.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!selectedClass && myClasses.length > 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                    <i className="fas fa-chalkboard-teacher" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '15px', display: 'block' }} />
                    <p>Select a class above and a session date to view attendance.</p>
                </div>
            )}
            {myClasses.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                    <i className="fas fa-calendar-plus" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '15px', display: 'block' }} />
                    <p>No classes assigned yet. Contact your department head.</p>
                </div>
            )}

            {/* ── EDIT ATTENDANCE MODAL ── */}
            {editModalOpen && editingStudent && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 12, padding: '28px 32px', maxWidth: 420, width: '90%',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    }}>
                        <h3 style={{ margin: '0 0 18px', color: '#163269', fontSize: '1.05rem' }}>
                            <i className="fas fa-pen" style={{ marginRight: 8 }} />Edit Attendance
                        </h3>

                        {/* Non-editable fields */}
                        <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f8f9fb', borderRadius: 8, fontSize: '0.9em' }}>
                            <div><strong>Student:</strong> {editingStudent.lastName}, {editingStudent.firstName}</div>
                            <div><strong>ID:</strong> {editingStudent.tupm_id}</div>
                        </div>

                        {/* Editable: Time In */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: '0.88em', color: '#333' }}>
                                Time In (override)
                            </label>
                            <input
                                type="time"
                                value={editTime}
                                onChange={e => setEditTime(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.95em' }}
                            />
                            <p style={{ fontSize: '0.78em', color: '#888', marginTop: 4 }}>
                                Status will auto-update based on class start time.
                            </p>
                        </div>

                        {/* Editable: Remarks */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: '0.88em', color: '#333' }}>
                                Remarks
                            </label>
                            <input
                                type="text"
                                value={editRemarks}
                                onChange={e => setEditRemarks(e.target.value)}
                                placeholder="Optional remark..."
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.95em' }}
                            />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                style={{
                                    padding: '8px 18px', border: '1px solid #ddd', borderRadius: 8,
                                    background: '#fff', cursor: 'pointer', fontSize: '0.9em',
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                style={{
                                    padding: '8px 18px', border: 'none', borderRadius: 8,
                                    background: '#163269', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9em', opacity: saving ? 0.6 : 1,
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for summary stat chips
const statChip = (bg, color) => ({
    background: bg,
    color,
    padding: '8px 18px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '0.9em',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
});

export default FacultyAttendancePage;