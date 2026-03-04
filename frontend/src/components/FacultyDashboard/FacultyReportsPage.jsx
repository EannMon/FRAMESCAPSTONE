import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import './FacultyReportsPage.css';
import FacultyReportModal from './FacultyReportModal';
import { generateFramesPDF, generateCSV } from '../../utils/ReportGenerator';

// ============================================
// REPORT OPTIONS — All required report types
// ============================================
const reportOptions = [
    // --- CLASS SPECIFIC REPORTS ---
    { id: 'CLASS_DAILY', label: 'Daily Class Attendance', desc: 'Tracks student attendance for each session.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_MONTHLY', label: 'Monthly Attendance Trends (Class)', desc: 'Visual trend of improvement or decline per class.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_SEMESTER', label: 'Semestral Class Attendance', desc: 'Full semester attendance summary per class.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_ABSENCE', label: 'Absence Summary per Section', desc: 'Quantifies student absences for easier grading.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_LATE', label: 'Punctuality Index per Section', desc: 'Ranks student punctuality relative to scheduled start.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'BREAK_DURATION', label: 'Break Duration & Abuse Report', desc: 'Detects excessive breaks or failures to return.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'UNRECOGNIZED_LOGS', label: 'Unrecognized Individual Logs', desc: 'Unknown individuals detected by camera.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'EARLY_EXITS', label: 'Early Exits Report', desc: 'Students leaving before class ends.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'ATTENDANCE_INCONSISTENCY', label: 'Attendance Inconsistency Logs', desc: 'Students who use break but skip main attendance.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'PARTICIPATION_INSIGHT', label: 'Participation Consistency Insight', desc: 'AI-computed engagement trends across sessions.', type: 'CLASS', category: 'Class-Specific Reports' },

    // --- PERSONAL REPORTS ---
    { id: 'PERSONAL_DAILY', label: 'Daily Attendance per Subject', desc: 'Your own presence, lateness, and breaks for each session.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_WEEKLY', label: 'Weekly Attendance Summary', desc: 'Summarizes personal attendance counts for accountability.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_MONTHLY', label: 'Monthly Attendance Trends', desc: 'Visualizes improvement or decline in attendance regularity.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_SEMESTER', label: 'Semestral & Overall Summary', desc: 'Cumulative data across all subjects for holistic assessment.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'HISTORY_30D', label: 'Attendance History Log (30 Days)', desc: 'Recent timestamps while balancing privacy.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'INSTRUCTOR_DELAY', label: 'Late Arrival Report (Instructor)', desc: 'Monitors personal punctuality regarding class start.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_CONSISTENCY', label: 'Personal Consistency Index', desc: 'AI metric predicting absence trends based on regularity.', type: 'PERSONAL', category: 'Personal Records' },
];

// Column configurations per report type
const getColumnConfig = (reportType) => {
    const isPersonal = reportType.startsWith('PERSONAL') || reportType === 'HISTORY_30D' || reportType === 'INSTRUCTOR_DELAY';
    if (isPersonal) {
        return {
            headers: ['ID', 'Date', 'Subject / Room', 'Status', 'Time', 'Remarks'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }
    return {
        headers: ['Student ID', 'Name', 'Section', 'Status', 'Time', 'Remarks'],
        keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
    };
};

const FacultyReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState(reportOptions[0]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [error, setError] = useState(null);

    const [academicYear, setAcademicYear] = useState('');

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    // Fetch faculty's classes for the dropdown
    useEffect(() => {
        if (!user?.id) return;
        const controller = new AbortController();

        api.get(`/api/faculty/schedule/${user.id}`, { signal: controller.signal }).then(res => {
            setClasses(res.data || []);
        }).catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                console.error('Failed to fetch schedule:', err);
            }
        });

        // Fetch Academic Year
        if (user.department_id) {
            api.get(`/api/dept/academic-year?dept_id=${user.department_id}`, { signal: controller.signal })
                .then(res => {
                    if (res.data.academic_year) setAcademicYear(res.data.academic_year);
                    if (res.data.semester_start_date) setDateFrom(res.data.semester_start_date);
                    if (res.data.semester_end_date) setDateTo(res.data.semester_end_date);
                }).catch((err) => {
                    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                        console.error('Failed to fetch academic year:', err);
                    }
                });
        }

        return () => controller.abort();
    }, [user]);

    // Group report options by category
    const groupedReports = useMemo(() => {
        const groups = {};
        reportOptions.forEach(opt => {
            if (!groups[opt.category]) groups[opt.category] = [];
            groups[opt.category].push(opt);
        });
        return groups;
    }, []);

    // Auto-fetch when default report + dates are ready
    useEffect(() => {
        if (selectedReport && dateFrom && dateTo) {
            fetchReportData(selectedReport.id);
        }
    }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchReportData = async (reportId) => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            const params = { report_type: reportId };
            if (selectedClass) params.class_id = selectedClass;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const res = await api.get(`/api/faculty/reports/data/${user.id}`, { params });
            setReportData(res.data || []);
        } catch (err) {
            console.error('Report fetch error:', err);
            setError('Failed to load report data. Please try again.');
            setReportData([]);
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

    const handleDownloadPDF = async () => {
        if (!selectedReport || reportData.length === 0) return;
        const config = getColumnConfig(selectedReport.id);
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });

        const reportInfo = {
            title: selectedReport.label,
            type: selectedReport.type === 'PERSONAL' ? 'Personal Faculty Report' : 'Class Report',
            category: selectedReport.type === 'PERSONAL' ? 'personal' : 'class',
            dateRange: `${dateFrom || 'Start'} — ${dateTo || 'Present'}`,
            context: selectedReport.type === 'PERSONAL'
                ? { name: `${user.first_name} ${user.last_name}`, id: user.tupm_id }
                : { classCode: selectedClass || 'All Classes', section: 'All' }
        };
        await generateFramesPDF(reportInfo, tableData, 'download');
    };

    const handleDownloadCSV = () => {
        if (!selectedReport || reportData.length === 0) return;
        const config = getColumnConfig(selectedReport.id);
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });

        const reportInfo = { title: selectedReport.label };
        generateCSV(reportInfo, tableData);
    };

    const handlePreviewPDF = async () => {
        if (!selectedReport || reportData.length === 0) return;
        const config = getColumnConfig(selectedReport.id);
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });

        const reportInfo = {
            title: selectedReport.label,
            type: selectedReport.type === 'PERSONAL' ? 'Personal Faculty Report' : 'Class Report',
            category: selectedReport.type === 'PERSONAL' ? 'personal' : 'class',
            dateRange: `${dateFrom || 'Start'} — ${dateTo || 'Present'}`,
            context: selectedReport.type === 'PERSONAL'
                ? { name: `${user.first_name} ${user.last_name}`, id: user.tupm_id }
                : { classCode: selectedClass || 'All Classes', section: 'All' }
        };
        const url = await generateFramesPDF(reportInfo, tableData, 'view');
        setPreviewUrl(url);
        setModalOpen(true);
    };

    const config = selectedReport ? getColumnConfig(selectedReport.id) : null;

    return (
        <div className="faculty-reports-page">
            {/* Header */}
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '15px' }}>
                <div className="academic-year-badge">
                    <i className="fas fa-calendar-alt"></i> A.Y. {academicYear || 'Not Set'}
                </div>
            </div>

            {/* Filters Bar */}
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
                <div className="filter-group">
                    <label>Subject / Class</label>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="filter-select">
                        <option value="">All Classes</option>
                        {classes.map(c => (
                            <option key={c.class_id} value={c.class_id}>{c.subject_code} - {c.section || 'N/A'}</option>
                        ))}
                    </select>
                </div>
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
                {/* Report Preview */}
                <div className="reports-content">
                    {!selectedReport ? (
                        <div className="reports-empty-state">
                            <i className="fas fa-file-alt"></i>
                            <h3>Select a Report</h3>
                            <p>Choose a report type from the sidebar to generate and preview data.</p>
                        </div>
                    ) : (
                        <>
                            {/* Report Title + Actions */}
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

                            {/* Data Table */}
                            <div className="report-table-container">
                                {loading ? (
                                    <div className="report-loading">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        <p>Loading report data...</p>
                                    </div>
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
                                        <p>No records found in the database for the selected filters. Adjust the date range or class filter and try again.</p>
                                    </div>
                                ) : (
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                {config.headers.map(h => <th key={h}>{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map((row, i) => (
                                                <tr key={i}>
                                                    {config.keys.map(key => (
                                                        <td key={key} className={key === 'status' ? `status-cell status-${(row[key] || '').toLowerCase().replace(/\s+/g, '-')}` : ''}>
                                                            {row[key] || 'N/A'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Record Count */}
                            {reportData.length > 0 && (
                                <div className="report-footer">
                                    <span>{reportData.length} record(s) found</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* PDF Preview Modal */}
            {modalOpen && (
                <FacultyReportModal previewUrl={previewUrl} onClose={() => setModalOpen(false)} />
            )}
        </div>
    );
};

export default FacultyReportsPage;
