import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Common/ToastProvider';
import { generateFramesPDF } from '../../utils/ReportGenerator';
import { getLocalDateString } from '../../utils/timeUtils';
import '../StudentDashboard/AttendanceHistoryPage.css';
import './DeptHeadAttendancePage.css';

// ─── Shared StatusBadge ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    let cls = 'neutral';
    if (!status || status === '—' || status === '--') cls = 'muted';
    else if (status === 'Present') cls = 'success';
    else if (status === 'On Break') cls = 'warning';
    else if (status === 'Late') cls = 'warning';
    else if (status === 'Absent') cls = 'danger';
    else if (status === 'Left') cls = 'neutral';
    return (
        <span className={`log-status-tag ${cls}`}>
            {(!status || status === '—' || status === '--') ? '—' : status.toUpperCase()}
        </span>
    );
};

// ─── Scope toggle options ─────────────────────────────────────────────────────
const SCOPE_MY_CLASSES = 'my';
const SCOPE_ALL_DEPT = 'all';

const DeptHeadAttendancePage = () => {
    const toast = useToast();
    const { user, isLoading: authLoading } = useAuth();

    // ── States ──
    const [scope, setScope] = useState(SCOPE_MY_CLASSES); // 'my' | 'all'

    const [allClasses, setAllClasses] = useState([]);       // all dept classes (scope=all)
    const [myClasses, setMyClasses] = useState([]);         // dept head's own classes (scope=my)

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedClass, setSelectedClass] = useState(null);
    const [filterDate, setFilterDate] = useState(getLocalDateString());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [studentList, setStudentList] = useState([]);

    // Edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editTime, setEditTime] = useState('');
    const [editRemarks, setEditRemarks] = useState('');
    const [saving, setSaving] = useState(false);

    // Edit history panel
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // ── 1. Load classes when user + scope ready ──────────────────────────────
    useEffect(() => {
        if (!user) return;
        const uid = user.user_id || user.id;
        const deptId = user.department_id;

        if (scope === SCOPE_MY_CLASSES) {
            // Dept Head's own classes via faculty schedule endpoint
            api.get(`/api/faculty/schedule/${uid}`)
                .then(r => setMyClasses(r.data || []))
                .catch(() => setMyClasses([]));
        } else {
            // All department classes
            if (!deptId) {
                toast.error('Your account has no department assigned.');
                return;
            }
            api.get(`/api/dept/department-classes?dept_id=${deptId}`)
                .then(r => setAllClasses(r.data || []))
                .catch(() => setAllClasses([]));
        }

        // Reset selection whenever scope changes
        setSelectedClassId('');
        setSelectedClass(null);
        setStudentList([]);
    }, [user, scope]);

    const displayedClasses = scope === SCOPE_MY_CLASSES ? myClasses : allClasses;

    // ── 3. Fetch students for selected class + date ───────────────────────────
    const fetchClassDetails = useCallback(async (clsId, targetDate) => {
        if (!clsId) { setStudentList([]); return; }
        setLoading(true);
        try {
            const response = await api.get(`/api/faculty/class-details/${clsId}`, {
                params: { date: targetDate },
            });
            setStudentList(response.data || []);
        } catch (err) {
            console.error('Error loading students:', err);
            setStudentList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // When class or date changes, reload
    useEffect(() => {
        if (selectedClassId && filterDate) {
            fetchClassDetails(selectedClassId, filterDate);
        }
    }, [selectedClassId, filterDate, fetchClassDetails]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleClassChange = (e) => {
        const id = e.target.value;
        setSelectedClassId(id);
        const found = displayedClasses.find(c => String(c.id) === id) || null;
        setSelectedClass(found);
        setStudentList([]);
    };

    // ── Edit modal ────────────────────────────────────────────────────────────
    const openEditModal = (student) => {
        setEditingStudent(student);
        if (student.timeIn && student.timeIn !== '---') {
            try {
                const [timePart, ampm] = student.timeIn.split(' ');
                let [hours, minutes] = timePart.split(':').map(Number);
                if (ampm === 'PM' && hours !== 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                setEditTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
            } catch { setEditTime(''); }
        } else {
            setEditTime('');
        }
        setEditRemarks(student.remarks || '');
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editTime) { toast.error('Please enter a valid time.'); return; }
        if (saving) return;
        setSaving(true);
        try {
            // Always use dept PUT endpoint (handles both create and edit)
            await api.put('/api/dept/attendance/edit-time-in', {
                student_id: editingStudent.id || editingStudent.user_id,
                class_id: Number(selectedClassId),
                date: filterDate,
                new_time: editTime,
                remarks: editRemarks || null,
                editor_id: user.user_id || user.id,
            });
            toast.success(editingStudent.entry_log_id ? 'Attendance updated.' : 'Attendance entry created.');
            setEditModalOpen(false);
            await fetchClassDetails(selectedClassId, filterDate);
        } catch (err) {
            toast.error('Failed to save: ' + (err.response?.data?.detail?.error?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // ── Edit History panel ────────────────────────────────────────────────────
    const openHistory = async () => {
        if (!selectedClassId) { toast.error('Select a class first.'); return; }
        setHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const r = await api.get(`/api/dept/attendance/edit-history?class_id=${selectedClassId}`);
            setHistoryItems(r.data || []);
        } catch {
            setHistoryItems([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // ── Export PDF ────────────────────────────────────────────────────────────
    const handleExport = () => {
        if (!selectedClass) return;
        const reportInfo = {
            title: `${selectedClass.subject_title || selectedClass.subject_code} Attendance`,
            type: 'CLASS ATTENDANCE REPORT',
            category: 'class',
            context: { classCode: selectedClass.subject_code, section: selectedClass.section },
            dateRange: new Date(filterDate + 'T00:00:00').toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric',
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

    // ── Filters / counts ──────────────────────────────────────────────────────
    const getFilteredStudents = () => {
        const q = searchTerm.toLowerCase();
        return studentList.filter(s =>
            (s.lastName?.toLowerCase() || '').includes(q) ||
            (s.firstName?.toLowerCase() || '').includes(q)
        );
    };

    const summaryCounts = () => {
        const list = getFilteredStudents();
        const noDataStatuses = ['—', '--', '-', ''];
        return {
            present: list.filter(s => s.status === 'Present' || s.status === 'Left').length,
            late: list.filter(s => s.status === 'Late').length,
            onBreak: list.filter(s => s.status === 'On Break').length,
            absent: list.filter(s => s.status === 'Absent').length,
            noData: list.filter(s => noDataStatuses.includes(s.status || '')).length,
            total: studentList.length,
        };
    };

    const counts = summaryCounts();
    const displayStudents = getFilteredStudents();

    if (authLoading) return <div className="loading">Loading...</div>;
    if (!user) return <div className="loading">Please log in.</div>;

    return (
        <div className="attendance-history-view">

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="reports-header-section">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px', width: '100%' }}>

                    {/* Scope Toggle */}
                    <div className="dept-scope-toggle">
                        <button
                            className={`scope-btn ${scope === SCOPE_MY_CLASSES ? 'active' : ''}`}
                            onClick={() => setScope(SCOPE_MY_CLASSES)}
                        >
                            <i className="fas fa-user-tie" /> My Classes
                        </button>
                        <button
                            className={`scope-btn ${scope === SCOPE_ALL_DEPT ? 'active' : ''}`}
                            onClick={() => setScope(SCOPE_ALL_DEPT)}
                        >
                            <i className="fas fa-building" /> All Department Classes
                        </button>
                    </div>

                    {/* Class Selector */}
                    <div className="report-selector-group" style={{ marginBottom: 0, flex: '1 1 260px' }}>
                        <label>Select Class Section:</label>
                        <select
                            className="app-select big-select"
                            value={selectedClassId}
                            onChange={handleClassChange}
                        >
                            <option value="">-- Choose a Class --</option>
                            {displayedClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.subject_title || cls.subject_code}
                                    {scope === SCOPE_ALL_DEPT && cls.faculty_name ? ` (${cls.faculty_name})` : ''}
                                    {' '}&mdash; {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div className="report-selector-group" style={{ marginBottom: 0 }}>
                        <label>Date:</label>
                        <input
                            type="date"
                            className="app-select"
                            value={filterDate}
                            max={getLocalDateString()}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </div>

                    {/* Search */}
                    <div className="report-selector-group" style={{ marginBottom: 0 }}>
                        <label>Search:</label>
                        <input
                            type="text"
                            className="app-select"
                            placeholder="Student name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Summary chips */}
                {selectedClass && !loading && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={statChip('#E6F4EA', '#1b5e20')}><i className="fas fa-check-circle" /> Present: {counts.present}</span>
                        <span style={statChip('#FFF8E1', '#f57f17')}><i className="fas fa-clock" /> Late: {counts.late}</span>
                        <span style={statChip('#FFEBEE', '#b71c1c')}><i className="fas fa-times-circle" /> Absent: {counts.absent}</span>
                        {counts.onBreak > 0 && (
                            <span style={statChip('#E3F2FD', '#0d47a1')}><i className="fas fa-coffee" /> On Break: {counts.onBreak}</span>
                        )}
                        {counts.noData > 0 && (
                            <span style={statChip('#f5f5f5', '#666')}><i className="fas fa-minus-circle" /> No Data: {counts.noData}</span>
                        )}
                        <span style={statChip('#F3E5F5', '#4a148c')}><i className="fas fa-users" /> Total: {counts.total}</span>
                    </div>
                )}
            </div>

            {/* ── TABLE CARD ─────────────────────────────────────────────── */}
            {selectedClass && (
                <div className="card recent-reports-card">
                    <div className="recent-reports-header">
                        <h3>
                            {selectedClass.subject_title || selectedClass.subject_code}
                            {' '}<span style={{ color: '#888', fontWeight: 400 }}>&mdash; {selectedClass.section}</span>
                            {scope === SCOPE_ALL_DEPT && selectedClass.faculty_name && (
                                <span style={{ color: '#555', fontWeight: 400, fontSize: '0.85em' }}> ({selectedClass.faculty_name})</span>
                            )}
                        </h3>
                        <div className="recent-reports-filters" style={{ display: 'flex', gap: '8px' }}>
                            <button className="export-all-button" onClick={openHistory}>
                                <i className="fas fa-history" /> Edit History
                            </button>
                            <button className="export-all-button" onClick={handleExport}>
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
                                            <td className="td-student-name">
                                                {student.lastName}, {student.firstName}
                                            </td>
                                            <td className="td-student-id">{student.tupm_id}</td>
                                            <td>{student.timeIn || '--'}</td>
                                            <td>{student.timeOut || '--'}</td>
                                            <td><StatusBadge status={student.status || 'Absent'} /></td>
                                            <td className={`td-remarks ${student.remarks === 'Late' ? 'late' : ''}`}>
                                                {student.remarks || '-'}
                                            </td>
                                            <td className="td-actions">
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    className="edit-btn"
                                                    title={student.entry_log_id ? 'Edit time-in' : 'Add time-in entry'}
                                                >
                                                    <i className={`fas ${student.entry_log_id ? 'fa-pen' : 'fa-plus'}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="td-empty-state">
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
            {displayedClasses.length === 0 && !loading && (
                <div className="empty-state-container">
                    <i className="fas fa-calendar-plus empty-state-icon" />
                    <p>{scope === SCOPE_MY_CLASSES ? 'You have no assigned classes.' : 'No classes found in this department.'}</p>
                </div>
            )}

            {/* ── EDIT MODAL ─────────────────────────────────────────────── */}
            {editModalOpen && editingStudent && (
                <div className="modal-overlay edit-attendance-overlay">
                    <div className="edit-modal-content">
                        <h3 className="edit-modal-title">
                            <i className={`fas ${editingStudent.entry_log_id ? 'fa-pen' : 'fa-plus'} btn-icon`} />
                            {editingStudent.entry_log_id ? 'Edit Attendance' : 'Add Attendance Entry'}
                        </h3>

                        <div className="edit-modal-info-box">
                            <div><strong>Student:</strong> {editingStudent.lastName}, {editingStudent.firstName}</div>
                            <div><strong>ID:</strong> {editingStudent.tupm_id}</div>
                            <div><strong>Date:</strong> {new Date(filterDate + 'T00:00:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>

                        <div className="edit-modal-field">
                            <label className="edit-modal-label">Time In (24-hour)</label>
                            <input
                                type="time"
                                value={editTime}
                                onChange={e => setEditTime(e.target.value)}
                                className="edit-modal-input"
                            />
                            <p className="edit-modal-hint">Status will auto-update based on class start time.</p>
                        </div>

                        <div className="edit-modal-field edit-modal-field-lg">
                            <label className="edit-modal-label">Remarks</label>
                            <input
                                type="text"
                                value={editRemarks}
                                onChange={e => setEditRemarks(e.target.value)}
                                placeholder="Optional remark..."
                                className="edit-modal-input"
                            />
                        </div>

                        <div className="edit-modal-actions">
                            <button onClick={() => setEditModalOpen(false)} className="edit-modal-cancel-btn">Cancel</button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className={`edit-modal-save-btn ${saving ? 'saving' : ''}`}
                            >
                                {saving ? 'Saving...' : (editingStudent.entry_log_id ? 'Save Changes' : 'Create Entry')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDIT HISTORY PANEL ─────────────────────────────────────── */}
            {historyOpen && (
                <div className="modal-overlay edit-attendance-overlay">
                    <div className="edit-modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className="edit-modal-title" style={{ margin: 0 }}>
                                <i className="fas fa-history btn-icon" /> Attendance Edit History
                            </h3>
                            <button onClick={() => setHistoryOpen(false)} className="edit-modal-cancel-btn" style={{ margin: 0 }}>
                                Close
                            </button>
                        </div>

                        {historyLoading ? (
                            <div style={{ padding: '30px', textAlign: 'center' }}>Loading…</div>
                        ) : historyItems.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No edits recorded for this class.</div>
                        ) : (
                            <table className="recent-reports-table">
                                <thead>
                                    <tr>
                                        <th>Editor</th>
                                        <th>Student</th>
                                        <th>Date</th>
                                        <th>Old Time</th>
                                        <th>New Time</th>
                                        <th>Action</th>
                                        <th>Edited At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyItems.map(h => (
                                        <tr key={h.id}>
                                            <td>{h.editor_name}</td>
                                            <td>{h.student_name}</td>
                                            <td>{h.date}</td>
                                            <td>{h.old_time}</td>
                                            <td>{h.new_time}</td>
                                            <td>
                                                <span className={`log-status-tag ${h.action === 'CREATE' ? 'success' : 'warning'}`}>
                                                    {h.action}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8em', color: '#666' }}>
                                                {h.edited_at ? new Date(h.edited_at).toLocaleString('en-PH') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

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

export default DeptHeadAttendancePage;
