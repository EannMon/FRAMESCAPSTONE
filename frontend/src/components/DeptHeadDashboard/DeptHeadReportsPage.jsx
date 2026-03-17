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
    { id: 'PUNCTUALITY_INDEX', label: 'Punctuality Index per Section', desc: 'Ranks student punctuality based on arrival offset from class start.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'BREAK_DURATION', label: 'Break Duration Report', desc: 'Break out/in activity logs.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'UNRECOGNIZED_LOGS', label: 'Unrecognized Individual Logs', desc: 'Low-confidence detections for security and audit checks.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'ATTENDANCE_INCONSISTENCY', label: 'Attendance Inconsistency Logs', desc: 'Break events with no matching ENTRY attendance for the same day.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'BREAK_ABUSE', label: 'Break Abuse / Extended Break Report', desc: 'Detects extended breaks and no-return break behavior.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'EARLY_EXITS', label: 'Early Exits Report', desc: 'Students who exited before class end.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'PARTICIPATION_INSIGHT', label: 'Participation Insight', desc: 'Participation summary per student.', type: 'CLASS', category: 'Class-Specific Reports' },

    // --- Personal Records (own attendance as faculty) ---
    { id: 'PERSONAL_DAILY', label: 'My Daily Attendance', desc: 'Your own attendance logs by day.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_WEEKLY', label: 'My Weekly Attendance', desc: 'Your own attendance logs by week.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_MONTHLY', label: 'My Monthly Attendance', desc: 'Your own attendance logs by month.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_SEMESTER', label: 'My Semester Summary', desc: 'Summary of your attendance across all classes.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'INSTRUCTOR_DELAY', label: 'My Late Arrivals', desc: 'Times you arrived late to classes.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'PERSONAL_CONSISTENCY', label: 'My Consistency Index', desc: 'AI-computed consistency score from attendance and punctuality behavior.', type: 'PERSONAL', category: 'Personal Records' },
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

// Report Download Modal Component containing Preview, PDF, CSV
const ReportDownloadModal = ({ isOpen, onClose, onGenerate }) => {
    const [format, setFormat] = React.useState('PREVIEW'); // PREVIEW, PDF, CSV

    if (!isOpen) return null;

    return (
        <div className="reports-unique-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="reports-unique-modal-content" onClick={e => e.stopPropagation()} style={{ width: '420px', maxWidth: '90%', padding: '20px' }}>
                <div className="metric-modal-header" style={{ marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Generate Official Report</h3>
                    <button className="metric-modal-close" onClick={onClose} style={{ fontSize: '1.5rem', color: '#64748b' }}>&times;</button>
                </div>
                <div className="metric-modal-body" style={{ padding: '0 0 20px 0' }}>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                        Select your preferred output format to process the report records.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button 
                            style={{ flex: 1, padding: '12px 6px', borderRadius: '8px', border: format === 'PREVIEW' ? '2px solid #163269' : '1px solid #e2e8f0', background: format === 'PREVIEW' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                            onClick={() => setFormat('PREVIEW')}
                        >
                            <i className="fas fa-eye" style={{ fontSize: '1.25rem', color: '#163269' }}></i>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>Preview</span>
                        </button>
                        <button 
                            style={{ flex: 1, padding: '12px 6px', borderRadius: '8px', border: format === 'PDF' ? '2px solid #163269' : '1px solid #e2e8f0', background: format === 'PDF' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                            onClick={() => setFormat('PDF')}
                        >
                            <i className="fas fa-file-pdf" style={{ fontSize: '1.25rem', color: '#ef4444' }}></i>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>PDF</span>
                        </button>
                        <button 
                            style={{ flex: 1, padding: '12px 6px', borderRadius: '8px', border: format === 'CSV' ? '2px solid #163269' : '1px solid #e2e8f0', background: format === 'CSV' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                            onClick={() => setFormat('CSV')}
                        >
                            <i className="fas fa-file-csv" style={{ fontSize: '1.25rem', color: '#10b981' }}></i>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>CSV</span>
                        </button>
                    </div>
                </div>
                <div className="report-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                    <button style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }} onClick={onClose}>Cancel</button>
                    <button 
                        style={{ padding: '8px 16px', borderRadius: '6px', background: '#163269', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                        onClick={() => { onGenerate(format); onClose(); }}
                    >
                        Proceed <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem', marginLeft: '4px' }}></i>
                    </button>
                </div>
            </div>
        </div>
    );
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
    const [summaryMetrics, setSummaryMetrics] = useState([]);
    const [insights, setInsights] = useState([]);
    const [activeMetricName, setActiveMetricName] = useState(null);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [sessionCountReference, setSessionCountReference] = useState(null);

    const [academicYear, setAcademicYear] = useState('');

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        const rootNode = document.getElementById('root') || document.body;
        if (modalOpen || isMetricModalOpen || showInsightsModal) {
            rootNode.style.overflow = 'hidden';
            rootNode.style.height = '100vh';
        } else {
            rootNode.style.overflow = '';
            rootNode.style.height = '';
        }
        return () => {
             rootNode.style.overflow = '';
             rootNode.style.height = '';
        };
    }, [modalOpen, isMetricModalOpen, showInsightsModal]);

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
                const resolvedClassId = report?.type === 'CLASS'
                    ? (selectedClass || classes[0]?.class_id || undefined)
                    : undefined;

                const params = { report_type: reportId };
                if (resolvedClassId) params.class_id = resolvedClassId;
                if (dateFrom) params.date_from = dateFrom;
                if (dateTo) params.date_to = dateTo;
                params.limit = 200;

                const res = await api.get(`/api/faculty/reports/data/${user.id}`, { params });
                const payload = res.data || {};
                const rows = Array.isArray(payload) ? payload : (payload.rows || []);
                setReportData(rows);
                setSummaryMetrics(Array.isArray(payload.summary_metrics) ? payload.summary_metrics : []);
                setInsights(Array.isArray(payload.insights) ? payload.insights : []);
                setSessionCountReference(payload.session_count_reference || null);
            } else {
                // Use the dept reports endpoint for department-wide reports
                const params = { report_type: reportId };
                if (dateFrom) params.date_from = dateFrom;
                if (dateTo) params.date_to = dateTo;
                if (room) params.room = room;
                if (user?.department_id) params.dept_id = user.department_id;
                params.limit = 200;

                const res = await api.get('/api/dept/reports/data', { params });
                const payload = res.data || {};
                const rows = Array.isArray(payload) ? payload : (payload.rows || []);
                setReportData(rows);
                setSummaryMetrics(Array.isArray(payload.summary_metrics) ? payload.summary_metrics : []);
                setInsights(Array.isArray(payload.insights) ? payload.insights : []);
                setSessionCountReference(payload.session_count_reference || null);
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                setError('Failed to load report data. Please try again.');
                setReportData([]);
                setSummaryMetrics([]);
                setInsights([]);
                setSessionCountReference(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        if (report?.type === 'CLASS' && !selectedClass && classes.length > 0) {
            setSelectedClass(String(classes[0].class_id));
        }
        fetchReportData(report.id);
    };

    const handleRefresh = () => {
        if (selectedReport) fetchReportData(selectedReport.id);
    };

    const config = selectedReport ? getColumnConfig(selectedReport.id) : getColumnConfig(null);

    const renderInsightPanel = () => {
        if (!summaryMetrics.length && !insights.length) return null;

        return (
            <div className="insight-panel">
                <div className="insight-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="insight-section-title" style={{ marginBottom: 0 }}>Performance Metrics</div>
                    {insights.length > 0 && (
                        <button 
                            type="button" 
                            className="insight-action-btn"
                            onClick={() => setShowInsightsModal(true)}
                        >
                            <i className="fas fa-lightbulb" style={{ marginRight: '6px' }}></i> View AI Insights
                        </button>
                    )}
                </div>

                {summaryMetrics.length > 0 && (
                    <div className="insight-stats-row">
                        {summaryMetrics.map((metric) => (
                            <button
                                key={metric.metric_name}
                                type="button"
                                className={`insight-stat-card metric-button ${activeMetricName === metric.metric_name && isMetricModalOpen ? 'metric-button-active' : ''}`}
                                style={{ position: 'relative' }}
                                onClick={() => {
                                    setActiveMetricName(metric.metric_name);
                                    setIsMetricModalOpen(true);
                                }}
                            >
                                <i className="fas fa-info-circle stat-card-info-icon" style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.82em', color: '#163269', opacity: 0.5 }}></i>
                                <div className="insight-stat-label">{metric.metric_name.replaceAll('_', ' ')}</div>
                                <div className="insight-stat-value">{metric.value}</div>
                                {metric.confidence && <div className="insight-stat-sub">Confidence: {metric.confidence}</div>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderSessionCountReference = () => {
        if (!sessionCountReference) return null;
        const reportWindow = sessionCountReference.report_window || {};
        const wholeSemester = sessionCountReference.whole_semester || {};

        return (
            <div className="insight-panel">
                <div className="insight-section-title" style={{ marginBottom: '12px' }}>Session Count Reference</div>
                <div className="session-reference-grid">
                    <div className="session-reference-card">
                        <div className="session-reference-title">Report Window</div>
                        <div className="session-reference-sub">Attended: <strong>{reportWindow.attended ?? 0}</strong></div>
                        <div className="session-reference-sub">Conducted: <strong>{reportWindow.conducted ?? 0}</strong></div>
                        <div className="session-reference-sub">Expected: <strong>{reportWindow.expected ?? 0}</strong></div>
                    </div>
                    <div className="session-reference-card">
                        <div className="session-reference-title">Reference Window (Semester)</div>
                        <div className="session-reference-sub">Attended: <strong>{wholeSemester.attended ?? 0}</strong></div>
                        <div className="session-reference-sub">Conducted: <strong>{wholeSemester.conducted ?? 0}</strong></div>
                        <div className="session-reference-sub">Expected: <strong>{wholeSemester.expected ?? 0}</strong></div>
                    </div>
                </div>
            </div>
        );
    };

    const renderVisualSummary = () => {
        if (!reportData.length) return null;

        const statusCounts = reportData.reduce((acc, row) => {
            const key = String(row.status || 'UNKNOWN').toUpperCase();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const sorted = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
        const maxCount = Math.max(...sorted.map((item) => item[1]), 1);

        const statusColors = {
            'ENTERED': '#10b981',
            'LATE': '#f59e0b',
            'ABSENT': '#ef4444',
            'BREAK_OUT': '#3b82f6',
            'BREAK_IN': '#8b5cf6',
            'EXITED': '#64748b'
        };

        return (
            <div className="insight-panel">
                <div className="insight-section-title" style={{ marginBottom: '12px' }}>Visual Summary</div>
                <div className="visual-grid">
                    <div className="visual-card">
                        <div className="visual-title">Overall Status Distribution</div>
                        <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                            {sorted.map(([status, count]) => (
                                <div key={status} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 30px', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#475569' }}>{status.replaceAll('_', ' ')}</div>
                                    <div style={{ background: '#f1f5f9', height: '14px', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: statusColors[status] || '#94a3b8', borderRadius: '4px' }}></div>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, textAlign: 'right', color: '#1e293b' }}>{count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="visual-card">
                        <div className="visual-title">Activity Trend</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8', fontSize: '0.85rem', gap: '8px' }}>
                            <i className="fas fa-chart-bar" style={{ fontSize: '2rem', color: '#cbd5e1' }}></i>
                            <span>Activity data distribution for selected range</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleGenerateReport = (format) => {
        if (format === 'PDF') handleDownloadPDF();
        else if (format === 'CSV') handleDownloadCSV();
        else {
            handleDownloadPDF(); // fallback
        }
    };

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

            {/* MATCHING STUDENT FILTERS HEADER SECTION */}
            <div className="reports-header-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-end', justifyContent: 'flex-start', marginBottom: '20px', background: 'white', padding: '20px 25px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.04)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
                    
                    <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Select Report Type:</label>
                        <select
                            value={selectedReport?.id || ''}
                            onChange={e => handleSelectReport(reportOptions.find(opt => opt.id === e.target.value))}
                            className="app-select big-select"
                            style={{ minWidth: '240px', padding: '10px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }}
                        >
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
                        <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Subject / Class:</label>
                            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="app-select big-select" style={{ minWidth: '220px', padding: '10px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }}>
                                <option value="">All Classes</option>
                                {classes.map(c => (
                                    <option key={c.class_id} value={c.class_id}>{c.subject_code} - {c.section || 'N/A'}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Show Room selector for dept-wide reports */}
                    {selectedReport?.type === 'DEPT' && (
                        <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Room:</label>
                            <select value={room} onChange={e => setRoom(e.target.value)} className="app-select big-select" style={{ minWidth: '180px', padding: '10px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }}>
                                <option value="">All Rooms</option>
                                {rooms.map((r, i) => <option key={i} value={r.room_name}>{r.room_name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>From:</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-input" style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }} />
                    </div>
                    
                    <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>To:</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-input" style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }} />
                    </div>
                </div>

                {/* Description Box MOVED INSIDE */}
                {selectedReport && selectedReport.desc && (
                    <div className="report-description-box" style={{ marginTop: '0px', flexGrow: 1, minWidth: '300px' }}>
                        <i className="fas fa-info-circle"></i>
                        <span>{selectedReport.desc}</span>
                    </div>
                )}
            </div>

            {!selectedReport ? (
                <div className="reports-empty-state">
                    <i className="fas fa-chart-pie"></i>
                    <h3>Select a Report</h3>
                    <p>Choose a report type to view department, class, or personal attendance data.</p>
                </div>
            ) : (
                <>
                    {/* Analytics panels stacked above Table CARD */}
                    {!loading && reportData.length > 0 && renderInsightPanel()}
                    {!loading && reportData.length > 0 && renderSessionCountReference()}
                    {!loading && reportData.length > 0 && renderVisualSummary()}

                    {/* Table Card (Replicating Attendance) */}
                    <div className="card recent-reports-card" style={{ marginTop: '20px' }}>
                        <div className="recent-reports-header">
                            <h3 style={{ margin: 0 }}>Generated Records</h3>
                            <div className="recent-reports-filters">
                                <button className="export-all-button" onClick={handlePreviewPDF} disabled={reportData.length === 0}>
                                    <i className="fas fa-file-pdf"></i> Generate Official Report
                                </button>
                            </div>
                        </div>

                        <div className="reports-table-container">
                            {loading ? (
                                <div className="report-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading report data...</p></div>
                            ) : error ? (
                                <div className="report-no-data">
                                    <i className="fas fa-exclamation-triangle error-icon"></i>
                                    <h4>Error</h4>
                                    <p>{error}</p>
                                </div>
                            ) : reportData.length === 0 ? (
                                <div className="report-no-data">
                                    <i className="fas fa-database"></i>
                                    <h4>No Data Available</h4>
                                    <p>No records found for the selected filters.</p>
                                </div>
                            ) : (
                                <table className="recent-reports-table">
                                    <thead>
                                        <tr>
                                            {config.headers.map(h => <th key={h}>{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, i) => (
                                            <tr key={i}>
                                                {config.keys.map(key => {
                                                    const value = row[key] || 'N/A';
                                                    let cellContent = value;
                                                    
                                                    // Subline formatting for Date columns if text contains spaced timestamp
                                                    if ((key === 'col1' || key === 'Detail') && typeof value === 'string' && value.indexOf('/') > -1) {
                                                        const parts = value.split(' ');
                                                        if (parts.length > 1) { 
                                                            cellContent = (
                                                                <div>
                                                                    <div style={{ fontWeight: '500' }}>{parts[0]}</div>
                                                                    <div style={{ fontSize: '0.82em', color: '#64748b', marginTop: '2px' }}>{parts[1]}</div>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                    
                                                    if (key === 'col2' || key === 'status') {
                                                        cellContent = <span style={{ fontWeight: '600', color: '#334155' }}>{value}</span>;
                                                    }
                                                    
                                                    return (
                                                         <td key={key} className={key === 'status' ? `status-cell status-${(row[key] || '').toLowerCase().replace(/\s+/g, '-')}` : ''}>
                                                             {cellContent}
                                                         </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {reportData.length > 0 && (
                            <div className="report-footer" style={{ marginTop: '10px' }}><span>{reportData.length} record(s) found</span></div>
                        )}
                    </div>
                </>
            )}

            {/* Metric Detailed Modal */}
            {isMetricModalOpen && activeMetricName && (
                <div className="reports-unique-modal-overlay" onClick={() => setIsMetricModalOpen(false)}>
                    {(() => {
                        const activeMetric = summaryMetrics.find(m => m.metric_name === activeMetricName);
                        if (!activeMetric) return null;
                        return (
                            <div className="reports-unique-modal-content" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '440px' }}>
                                <div className="metric-modal-header">
                                    <h3>{activeMetric.metric_name.replaceAll('_', ' ')} Details</h3>
                                    <button className="metric-modal-close" onClick={() => setIsMetricModalOpen(false)}>&times;</button>
                                </div>
                                <div className="metric-modal-body">
                                    <p><strong>Current Value:</strong> {activeMetric.current_value || activeMetric.value}</p>
                                    {activeMetric.formula && <p><strong>Formula:</strong> {activeMetric.formula}</p>}
                                    {activeMetric.meaning && <p><strong>Meaning:</strong> {activeMetric.meaning}</p>}
                                    {activeMetric.confidence && <p><strong>Confidence Scale:</strong> {activeMetric.confidence}</p>}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Insights Detailed Modal */}
            {showInsightsModal && (
                <div className="reports-unique-modal-overlay" onClick={() => setShowInsightsModal(false)}>
                    <div className="reports-unique-modal-content insight-detailed-modal" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '780px' }}>
                        <div className="metric-modal-header">
                            <h3>Explainable Insights</h3>
                            <button className="metric-modal-close" onClick={() => setShowInsightsModal(false)}>&times;</button>
                        </div>
                        <div className="metric-modal-body modal-scrollable">
                            {insights.map((insight, idx) => (
                                <div key={idx} className="insight-detailed-item" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                                    <h4 style={{ color: '#163269', marginBottom: '8px' }}>{insight.title}</h4>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#444' }}>{insight.narrative}</p>
                                    {insight.confidence && <span style={{ fontSize: '0.8rem', color: '#777' }}>Confidence score: {insight.confidence}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {modalOpen && (
                <FacultyReportModal 
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)} 
                    onGenerate={handleGenerateReport}
                    reportTitle={selectedReport?.label}
                    scope={selectedReport?.type === 'CLASS' ? 'Class Specific' : 'Department Wide'}
                    dateRange={`${dateFrom} to ${dateTo}`}
                />
            )}
        </div>
    );
};

export default DeptHeadReportsPage;
