import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import '../FacultyDashboard/FacultyReportsPage.css';
import FacultyReportModal from '../FacultyDashboard/FacultyReportModal';
import { generateFramesPDF, generateCSV } from '../../utils/ReportGenerator';

// ============================================
// DEPARTMENT HEAD REPORT OPTIONS
// Includes dept-wide, class-specific, and personal
// ============================================
const reportOptions = [
    // --- Faculty Oversight ---
    { id: 'FACULTY_SUMMARY', label: 'Faculty Performance Summary', desc: 'Overview of all faculty attendance punctuality.', type: 'DEPT', category: 'Faculty Oversight' },
    { id: 'FACULTY_LATE', label: 'Faculty Late Arrivals Report', desc: 'Reports on faculty who arrive late to classes.', type: 'DEPT', category: 'Faculty Oversight' },
    { id: 'FACULTY_CONSISTENCY', label: 'Faculty Consistency Index', desc: 'AI-computed metric of attendance regularity per faculty.', type: 'DEPT', category: 'Faculty Oversight' },

    // --- Facility & Room Analytics ---
    { id: 'ROOM_OCCUPANCY', label: 'Room Occupancy Report', desc: 'Usage metrics per room based on attendance data.', type: 'DEPT', category: 'Facility & Room Analytics' },
    { id: 'PEAK_USAGE', label: 'Peak Hour / Room Usage', desc: 'Identifies peak attendance times per room.', type: 'DEPT', category: 'Facility & Room Analytics' },
    { id: 'ROOM_UTILIZATION', label: 'Room Utilization Rate', desc: 'How efficiently rooms are scheduled vs. used.', type: 'DEPT', category: 'Facility & Room Analytics' },
    { id: 'OVERCROWDING', label: 'Overcrowding Alerts', desc: 'Rooms exceeding capacity thresholds.', type: 'DEPT', category: 'Facility & Room Analytics' },

    // --- Departmental Strategy ---
    { id: 'DEPT_ACTIVITY', label: 'Department-Wide Activity', desc: 'Cross-course attendance and engagement overview.', type: 'DEPT', category: 'Departmental Strategy' },

    // --- Class-Specific Reports (same as Faculty) ---
    { id: 'CLASS_DAILY', label: 'Class Daily Attendance', desc: 'Daily attendance entries for a specific class.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_MONTHLY', label: 'Class Monthly Summary', desc: 'Monthly aggregation of attendance per student.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_SEMESTER', label: 'Class Semester Summary', desc: 'Semester-wide per-student summary: entries, lates, rate.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_ABSENCE', label: 'Absent Students Report', desc: 'Enrolled students with no entry in date range.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_LATE', label: 'Late Students Report', desc: 'Students who had late entries.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'BREAK_DURATION', label: 'Break Duration Report', desc: 'Break out/in activity logs.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'EARLY_EXITS', label: 'Early Exits Report', desc: 'Students who exited before class end.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'PARTICIPATION_INSIGHT', label: 'Participation Insight', desc: 'Participation summary per student.', type: 'CLASS', category: 'Class-Specific Reports' },

    // --- Personal Records (own attendance as faculty) ---
    { id: 'PERSONAL_DAILY', label: 'My Daily Attendance', desc: 'Your own attendance logs by day.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_WEEKLY', label: 'My Weekly Attendance', desc: 'Your own attendance logs by week.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_MONTHLY', label: 'My Monthly Attendance', desc: 'Your own attendance logs by month.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_SEMESTER', label: 'My Semester Summary', desc: 'Summary of your attendance across all classes.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'INSTRUCTOR_DELAY', label: 'My Late Arrivals', desc: 'Times you arrived late to classes.', type: 'PERSONAL', category: 'Personal Records' },
];

/**
 * Returns column headers/keys based on report type for proper table rendering.
 */
const getColumnConfig = (reportId) => {
    const report = reportOptions.find(r => r.id === reportId);
    if (report?.type === 'PERSONAL') {
        return {
            headers: ['ID', 'Date', 'Subject / Room', 'Status', 'Time', 'Remarks'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }
    if (report?.type === 'CLASS') {
        return {
            headers: ['ID', 'Name', 'TUP-M ID', 'Status', 'Time', 'Remarks'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }
    // Dept-wide reports
    return {
        headers: ['ID', 'Name / Room', 'Detail', 'Status', 'Metric', 'Remarks'],
        keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
    };
};

const DeptHeadReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState(reportOptions[0]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [room, setRoom] = useState('');
    const [rooms, setRooms] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [error, setError] = useState(null);

    const [academicYear, setAcademicYear] = useState('');

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    // Fetch room list, academic year, and dept head's classes
    useEffect(() => {
        const controller = new AbortController();
        api.get('/api/dept/management-data', { signal: controller.signal }).then(res => {
            setRooms(res.data?.rooms || []);
        }).catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                // silently ignore
            }
        });

        // Fetch dept head's own classes (they also teach)
        if (user?.id) {
            api.get(`/api/faculty/schedule/${user.id}`, { signal: controller.signal }).then(res => {
                setClasses(res.data || []);
            }).catch((err) => {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    // Dept head may have no classes — that's fine
                }
            });
        }

        if (user?.department_id) {
            api.get(`/api/dept/academic-year?dept_id=${user.department_id}`, { signal: controller.signal })
                .then(res => {
                    if (res.data.academic_year) setAcademicYear(res.data.academic_year);
                    if (res.data.semester_start_date) setDateFrom(res.data.semester_start_date);
                    if (res.data.semester_end_date) setDateTo(res.data.semester_end_date);
                }).catch((err) => {
                    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                        // silently ignore
                    }
                });
        }
        return () => controller.abort();
    }, [user]);

    // Auto-fetch when default report + dates are ready
    useEffect(() => {
        if (selectedReport && dateFrom && dateTo) {
            fetchReportData(selectedReport.id);
        }
    }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

    const groupedReports = useMemo(() => {
        const groups = {};
        reportOptions.forEach(opt => {
            if (!groups[opt.category]) groups[opt.category] = [];
            groups[opt.category].push(opt);
        });
        return groups;
    }, []);

    const fetchReportData = async (reportId) => {
        setLoading(true);
        setError(null);
        try {
            const report = reportOptions.find(r => r.id === reportId);

            if (report?.type === 'CLASS' || report?.type === 'PERSONAL') {
                // Use the faculty reports endpoint for class-specific & personal reports
                if (!user?.id) return;
                const params = { report_type: reportId };
                if (selectedClass) params.class_id = selectedClass;
                if (dateFrom) params.date_from = dateFrom;
                if (dateTo) params.date_to = dateTo;

                const res = await api.get(`/api/faculty/reports/data/${user.id}`, { params });
                setReportData(res.data || []);
            } else {
                // Use the dept reports endpoint for department-wide reports
                const params = { report_type: reportId };
                if (dateFrom) params.date_from = dateFrom;
                if (dateTo) params.date_to = dateTo;
                if (room) params.room = room;
                if (user?.department_id) params.dept_id = user.department_id;

                const res = await api.get('/api/dept/reports/data', { params });
                setReportData(res.data || []);
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                setError('Failed to load report data. Please try again.');
                setReportData([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        fetchReportData(report.id);
    };

    const handleRefresh = () => {
        if (selectedReport) fetchReportData(selectedReport.id);
    };

    const config = selectedReport ? getColumnConfig(selectedReport.id) : getColumnConfig(null);

    const handleDownloadPDF = async () => {
        if (!selectedReport || reportData.length === 0) return;
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });
        const reportType = selectedReport.type === 'PERSONAL'
            ? 'Personal Faculty Report'
            : selectedReport.type === 'CLASS'
                ? 'Class Report'
                : 'Department Head Report';
        const reportInfo = {
            title: selectedReport.label,
            type: reportType,
            category: selectedReport.type === 'PERSONAL' ? 'personal' : selectedReport.type === 'CLASS' ? 'class' : 'dept',
            dateRange: `${dateFrom || 'Start'} — ${dateTo || 'Present'}`,
            context: { name: user ? `${user.first_name} ${user.last_name}` : 'Dept Head', id: user?.tupm_id || '' }
        };
        await generateFramesPDF(reportInfo, tableData, 'download');
    };

    const handleDownloadCSV = () => {
        if (!selectedReport || reportData.length === 0) return;
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });
        generateCSV({ title: selectedReport.label }, tableData);
    };

    const handlePreviewPDF = async () => {
        if (!selectedReport || reportData.length === 0) return;
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });
        const reportType = selectedReport.type === 'PERSONAL'
            ? 'Personal Faculty Report'
            : selectedReport.type === 'CLASS'
                ? 'Class Report'
                : 'Department Head Report';
        const reportInfo = {
            title: selectedReport.label,
            type: reportType,
            category: selectedReport.type === 'PERSONAL' ? 'personal' : selectedReport.type === 'CLASS' ? 'class' : 'dept',
            dateRange: `${dateFrom || 'Start'} — ${dateTo || 'Present'}`,
            context: { name: user ? `${user.first_name} ${user.last_name}` : 'Dept Head', id: user?.tupm_id || '' }
        };
        const url = await generateFramesPDF(reportInfo, tableData, 'view');
        setPreviewUrl(url);
        setModalOpen(true);
    };

    return (
        <div className="faculty-reports-page">
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '15px' }}>
                <div className="academic-year-badge">
                    <i className="fas fa-calendar-alt"></i> A.Y. {academicYear || 'Not Set'}
                </div>
            </div>

            <div className="reports-filters-bar">
                <div className="filter-group">
                    <label>Report Type</label>
                    <select
                        value={selectedReport?.id || ''}
                        onChange={e => handleSelectReport(reportOptions.find(opt => opt.id === e.target.value))}
                        className="filter-select"
                        style={{ minWidth: '240px' }}
                    >
                        <option value="" disabled>Select a report...</option>
                        {Object.entries(groupedReports).map(([category, options]) => (
                            <optgroup key={category} label={category}>
                                {options.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* Show Class selector for class-specific reports */}
                {selectedReport?.type === 'CLASS' && (
                    <div className="filter-group">
                        <label>Subject / Class</label>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="filter-select">
                            <option value="">All Classes</option>
                            {classes.map(c => (
                                <option key={c.class_id} value={c.class_id}>{c.subject_code} - {c.section || 'N/A'}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Show Room selector for dept-wide reports */}
                {selectedReport?.type === 'DEPT' && (
                    <div className="filter-group">
                        <label>Room</label>
                        <select value={room} onChange={e => setRoom(e.target.value)} className="filter-select">
                            <option value="">All Rooms</option>
                            {rooms.map((r, i) => <option key={i} value={r.room_name}>{r.room_name}</option>)}
                        </select>
                    </div>
                )}

                <div className="filter-group">
                    <label>From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-input" />
                </div>
                <div className="filter-group">
                    <label>To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-input" />
                </div>
                <button className="filter-refresh-btn" onClick={handleRefresh} disabled={!selectedReport} style={{ opacity: !selectedReport ? 0.5 : 1 }}>
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            <div className="reports-layout-full">
                <div className="reports-content">
                    {!selectedReport ? (
                        <div className="reports-empty-state">
                            <i className="fas fa-chart-pie"></i>
                            <h3>Select a Report</h3>
                            <p>Choose a report type to view department, class, or personal attendance data.</p>
                        </div>
                    ) : (
                        <>
                            <div className="report-content-header">
                                <div>
                                    <h3>{selectedReport.label}</h3>
                                    <p>{selectedReport.desc}</p>
                                </div>
                                <div className="report-actions">
                                    <button className="report-action-btn preview" onClick={handlePreviewPDF} disabled={reportData.length === 0}>
                                        <i className="fas fa-eye"></i> Preview
                                    </button>
                                    <button className="report-action-btn pdf" onClick={handleDownloadPDF} disabled={reportData.length === 0}>
                                        <i className="fas fa-file-pdf"></i> PDF
                                    </button>
                                    <button className="report-action-btn csv" onClick={handleDownloadCSV} disabled={reportData.length === 0}>
                                        <i className="fas fa-file-csv"></i> CSV
                                    </button>
                                </div>
                            </div>

                            <div className="report-table-container">
                                {loading ? (
                                    <div className="report-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading report data...</p></div>
                                ) : error ? (
                                    <div className="report-no-data">
                                        <i className="fas fa-exclamation-triangle" style={{ color: '#b91c1c' }}></i>
                                        <h4>Error</h4>
                                        <p>{error}</p>
                                    </div>
                                ) : reportData.length === 0 ? (
                                    <div className="report-no-data">
                                        <i className="fas fa-database"></i>
                                        <h4>No Data Available</h4>
                                        <p>No records found for the selected filters. Adjust the date range or room filter.</p>
                                    </div>
                                ) : (
                                    <table className="report-table">
                                        <thead><tr>{config.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                                        <tbody>
                                            {reportData.map((row, i) => (
                                                <tr key={i}>
                                                    {config.keys.map(key => (
                                                        <td key={key} className={key === 'status' ? `status-cell status-${(row[key] || '').toLowerCase().replace(/\s+/g, '-')}` : ''}>{row[key] || 'N/A'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {reportData.length > 0 && (
                                <div className="report-footer"><span>{reportData.length} record(s) found</span></div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {modalOpen && <FacultyReportModal previewUrl={previewUrl} onClose={() => setModalOpen(false)} />}
        </div>
    );
};

export default DeptHeadReportsPage;
