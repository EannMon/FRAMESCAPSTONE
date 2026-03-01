import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../Common/ToastProvider';
import { generateFramesPDF } from '../../utils/ReportGenerator';
import '../StudentDashboard/AttendanceHistoryPage.css'; // Inheriting Student style

const StatusBadge = ({ status }) => {
    let cls = 'neutral';
    if (status === 'Present') cls = 'success';
    else if (status === 'On Break') cls = 'warning';
    else if (status === 'Absent') cls = 'danger';
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

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSchedule(parsedUser.user_id || parsedUser.id);
        }
    }, []);

    // --- 2. FETCH SCHEDULE (API) ---
    const fetchSchedule = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/schedule/${userId}`);
            setMyClasses(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading schedule:', error);
            setLoading(false);
        }
    };

    // --- 3. FETCH CLASS DETAILS (API) ---
    const fetchClassDetails = useCallback(async (clsId) => {
        if (!clsId) {
            setStudentList([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/class-details/${clsId}`);
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
        await fetchClassDetails(clsId);
    };

    // Re-fetch when date changes (for date-based filtering — currently frontend-side)
    const handleDateChange = (e) => {
        setFilterDate(e.target.value);
    };

    // --- 4. LOCAL DATE FILTER ---
    // Filter students by the selected date based on their timeIn field
    const getFilteredStudents = () => {
        const query = searchTerm.toLowerCase();
        return studentList.filter(s => {
            const nameMatch =
                (s.lastName?.toLowerCase() || '').includes(query) ||
                (s.firstName?.toLowerCase() || '').includes(query);
            if (!nameMatch) return false;

            // If student has a timeIn, filter by date; otherwise show as absent for any date
            if (s.timeIn && s.timeIn !== 'N/A' && s.timeIn !== '--') {
                const logDate = new Date(s.timeIn).toISOString().split('T')[0];
                return logDate === filterDate;
            }
            // Absent students always show (no time in recorded)
            return true;
        });
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
            'Status': s.status || 'Absent',
            'Remarks': s.remarks || '',
        }));

        generateFramesPDF(reportInfo, tableData);
    };

    // --- SUMMARY COUNTS ---
    const summaryCounts = () => {
        const filtered = getFilteredStudents();
        return {
            present: filtered.filter(s => s.status === 'Present').length,
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
                                        <th>Status</th>
                                        <th>Remarks</th>
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
                                            <td>
                                                <StatusBadge status={student.status || 'Absent'} />
                                            </td>
                                            <td style={{ color: student.remarks === 'Late' ? 'orange' : '#555' }}>
                                                {student.remarks || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {displayStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
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