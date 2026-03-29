import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import './FacultyReportsPage.css';
import FacultyReportModal from './FacultyReportModal';
import { generateFramesPDF, generateCSV } from '../../utils/ReportGenerator';

const LogStatusTag = ({ text, isPresent, type }) => {
    let statusClass = 'neutral';
    if (isPresent) statusClass = 'success';
    else if (type === 'ABSENT') statusClass = 'danger';
    else if (type === 'BREAK_OUT') statusClass = 'warning';
    else if (type === 'EXIT') statusClass = 'neutral';
    else statusClass = 'neutral';

    return (
        <span className={`log-status-tag ${statusClass}`}>
            {text}
        </span>
    );
};

// ============================================
// REPORT OPTIONS — All required report types
// ============================================
const reportOptions = [
    // --- CLASS SPECIFIC REPORTS ---
    { id: 'CLASS_DAILY', label: 'Daily Class Attendance', desc: 'Tracks student attendance for each session.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_MONTHLY', label: 'Monthly Attendance Trends (Class)', desc: 'Visual trend of improvement or decline per class.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_SEMESTER', label: 'Semestral Class Attendance', desc: 'Full semester attendance summary per class.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_ABSENCE', label: 'Absence Summary per Section', desc: 'Quantifies student absences for easier grading.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'CLASS_LATE', label: 'Late Arrival Report', desc: 'Monitors frequency and timing of late student arrivals.', type: 'CLASS', category: 'Class-Specific Reports' },
    { id: 'PUNCTUALITY_INDEX', label: 'Punctuality Index per Section', desc: 'Ranks student punctuality relative to scheduled start.', type: 'CLASS', category: 'Class-Specific Reports' },
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
    if (reportType === 'PERSONAL_CONSISTENCY' || reportType === 'PERSONAL_SEMESTER') {
        return {
            headers: ['ID', 'Date Coverage', 'Subject / Room', 'Status', 'Session Summary', 'Contact / Remarks'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }
    if (reportType === 'PARTICIPATION_INSIGHT') {
        return {
            headers: ['ID', 'Student Name', 'Performance Score', 'Stability Status', 'Attendance Summary', 'Student ID'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }
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
                    if (res.data?.academic_year) setAcademicYear(res.data.academic_year);
                    if (res.data?.semester_start_date) setDateFrom(res.data.semester_start_date);
                    if (res.data?.semester_end_date) setDateTo(res.data.semester_end_date);
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
            const report = reportOptions.find((opt) => opt.id === reportId);
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
            
            // --- MAP DATA TO MATCH STUDENT STRUCTURE FOR TRENDS ---
            const mapped = rows.map(row => {
                const col1Text = String(row.col1 || '').trim();
                const col3Text = String(row.col3 || '').trim();
                let timestamp = row.timestamp;
                
                if (!timestamp && col1Text) {
                    const datePart = col1Text;
                    const timePart = col3Text;
                    if (timePart && timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)) {
                        let [_, h, m, meridiem] = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                        let hours = Number(h);
                        if (meridiem === 'PM' && hours !== 12) hours += 12;
                        if (meridiem === 'AM' && hours === 12) hours = 0;
                        timestamp = `${datePart}T${String(hours).padStart(2, '0')}:${m}:00`;
                    } else {
                        timestamp = `${datePart}T00:00:00`;
                    }
                }

                return {
                    ...row,
                    timestamp: timestamp,
                    action: row.action || row.status,
                    is_late: row.is_late || String(row.status || '').toUpperCase() === 'LATE'
                };
            });

            setReportData(mapped);
            setSummaryMetrics(Array.isArray(payload.summary_metrics) ? payload.summary_metrics : []);
            setInsights(Array.isArray(payload.insights) ? payload.insights : []);
            setSessionCountReference(payload.session_count_reference || null);
        } catch (err) {
            console.error('Report fetch error:', err);
            setError('Failed to load report data. Please try again.');
            setReportData([]);
            setSummaryMetrics([]);
            setInsights([]);
            setSessionCountReference(null);
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

    const handleGenerateReport = (format) => {
        if (format === 'PDF') handleDownloadPDF();
        else if (format === 'CSV') handleDownloadCSV();
        else {
            handleDownloadPDF(); // fallback
        }
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
        const enrichment = {
            summaryMetrics,
            insights,
            sessionCountReference,
            statusDistribution: reportData.reduce((acc, row) => {
                const status = row.status || 'Unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {}),
            filters: {
                reportType: selectedReport.label,
                subject: selectedClass || 'All Classes',
                semester: academicYear || 'Current'
            }
        };

        await generateFramesPDF(reportInfo, tableData, 'download', enrichment);
    };

    const handleDownloadCSV = () => {
        if (!selectedReport || reportData.length === 0) return;
        const config = getColumnConfig(selectedReport.id);
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });

        const reportInfo = { 
            title: selectedReport.label,
            dateRange: `${dateFrom || 'Start'} — ${dateTo || 'Present'}`
        };

        const enrichment = {
            summaryMetrics,
            insights,
            sessionCountReference,
            statusDistribution: reportData.reduce((acc, row) => {
                const status = row.status || 'Unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {}),
            filters: {
                reportType: selectedReport.label,
                subject: selectedClass || 'All Classes',
                semester: academicYear || 'Current'
            }
        };

        generateCSV(reportInfo, tableData, enrichment);
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

    const config = selectedReport ? getColumnConfig(selectedReport.id) : getColumnConfig(null);

    const statusDistribution = useMemo(() => {
        const buckets = {
            ENTERED: 0,
            LATE: 0,
            ABSENT: 0,
            BREAK_OUT: 0,
            BREAK_IN: 0,
            EXITED: 0,
        };

        reportData.forEach((row) => {
            const status = String(row.status || '').toUpperCase();
            if (status === 'ENTERED' || status === 'ON TIME' || status === 'PRESENT') {
                if (row.is_late) buckets.LATE += 1;
                else buckets.ENTERED += 1;
            } else if (status === 'ABSENT') {
                buckets.ABSENT += 1;
            } else if (status === 'BREAK_OUT') {
                buckets.BREAK_OUT += 1;
            } else if (status === 'BREAK_IN') {
                buckets.BREAK_IN += 1;
            } else if (status === 'EXITED') {
                buckets.EXITED += 1;
            }
        });

        if (buckets.ABSENT === 0 && sessionCountReference?.report_window) {
            const { attended, conducted } = sessionCountReference.report_window;
            buckets.ABSENT = Math.max((conducted || 0) - (attended || 0), 0);
        }

        return buckets;
    }, [reportData, sessionCountReference]);

    const dailyTrend = useMemo(() => {
        const byDate = {};
        reportData.forEach((row) => {
            const dateStr = row.display_date || row.col1 || (row.timestamp ? row.timestamp.split('T')[0] : null);
            if (!dateStr) return;

            if (!byDate[dateStr]) {
                byDate[dateStr] = {
                    day: dateStr,
                    entered: 0,
                    late: 0,
                    absent: 0,
                    breakOut: 0,
                    breakIn: 0,
                    exited: 0,
                    total: 0
                };
            }

            const status = String(row.status || '').toUpperCase();
            if (status === 'ENTERED' || status === 'ON TIME' || status === 'PRESENT') {
                if (row.is_late) byDate[dateStr].late += 1;
                else byDate[dateStr].entered += 1;
            } else if (status === 'ABSENT') {
                byDate[dateStr].absent += 1;
            } else if (status === 'BREAK_OUT') {
                byDate[dateStr].breakOut += 1;
            } else if (status === 'BREAK_IN') {
                byDate[dateStr].breakIn += 1;
            } else if (status === 'EXITED') {
                byDate[dateStr].exited += 1;
            }
            byDate[dateStr].total += 1;
        });

        return Object.values(byDate).sort((a, b) => a.day.localeCompare(b.day));
    }, [reportData]);

    const renderSessionCountReference = () => {
        if (!sessionCountReference) return null;
        const reportWindow = sessionCountReference.report_window || {};
        const wholeSemester = sessionCountReference.whole_semester || {};

        return (
            <div className="insight-panel" style={{ marginTop: '16px' }}>
                <div className="insight-section-title" style={{ marginBottom: '12px' }}>Session Count Reference</div>
                <div className="session-reference-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    <div className="session-reference-card" style={{ padding: '14px', background: '#f8fafe', borderRadius: '10px', border: '1px solid #e5ebf7' }}>
                        <div className="session-reference-title" style={{ fontWeight: 700, color: '#163269', marginBottom: '8px', fontSize: '0.88em' }}>Report Window</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.83em' }}>
                            <div>Attended: <strong>{reportWindow.attended ?? 0}</strong></div>
                            <div>Conducted: <strong>{reportWindow.conducted ?? 0}</strong></div>
                            <div>Expected: <strong>{reportWindow.expected ?? 0}</strong></div>
                        </div>
                    </div>
                    <div className="session-reference-card" style={{ padding: '14px', background: '#f8fafe', borderRadius: '10px', border: '1px solid #e5ebf7' }}>
                        <div className="session-reference-title" style={{ fontWeight: 700, color: '#163269', marginBottom: '8px', fontSize: '0.88em' }}>Whole Semester</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.83em' }}>
                            <div>Attended: <strong>{wholeSemester.attended ?? 0}</strong></div>
                            <div>Conducted: <strong>{wholeSemester.conducted ?? 0}</strong></div>
                            <div>Expected: <strong>{wholeSemester.expected ?? 0}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderVisualSummary = () => {
        if (!reportData.length) return null;

        const statusItems = [
            { label: 'Entered', value: statusDistribution.ENTERED, color: '#2e7d32' },
            { label: 'Late', value: statusDistribution.LATE, color: '#e65100' },
            { label: 'Absent', value: statusDistribution.ABSENT, color: '#c62828' },
            { label: 'On Break (Out)', value: statusDistribution.BREAK_OUT, color: '#1565c0' },
            { label: 'From Break (In)', value: statusDistribution.BREAK_IN, color: '#00897b' },
            { label: 'Exited', value: statusDistribution.EXITED, color: '#6c757d' },
        ];

        const maxStatus = Math.max(...statusItems.map((item) => item.value), 1);
        const maxTrend = Math.max(...dailyTrend.map((item) => item.total), 1);

        const statusStyle = {
            ENTERED: '#2e7d32',
            LATE: '#e65100',
            ABSENT: '#c62828',
            BREAK_OUT: '#1565c0',
            BREAK_IN: '#00897b',
            EXITED: '#6c757d',
        };

        return (
            <div className="insight-panel">
                <div className="insight-section-title">Visual Summary</div>
                <div className="visual-grid">
                    <div className="visual-card">
                        <div className="visual-title">Status Distribution</div>
                        {statusItems.map((item) => (
                            <div key={item.label} className="visual-bar-row">
                                <span className="visual-label">{item.label}</span>
                                <div className="visual-bar-track">
                                    <div
                                        className="visual-bar-fill"
                                        style={{ width: `${(item.value / maxStatus) * 100}%`, backgroundColor: item.color }}
                                    />
                                </div>
                                <span className="visual-value">{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="visual-card">
                        <div className="visual-title">Activity Trend</div>
                        <div className="grouped-cluster-scroll-wrap">
                            <div className="grouped-cluster-chart">
                                {dailyTrend.filter(item => item.total > 0).map((item) => (
                                    <div key={item.day} className="grouped-cluster-item">
                                        <div className="grouped-cluster-track">
                                            {['entered', 'late', 'absent', 'breakOut', 'breakIn', 'exited'].map(actionKey => {
                                                const value = item[actionKey] || 0;
                                                if (value === 0) return null;
                                                const styleKey = actionKey.toUpperCase().replace('BREAKOUT', 'BREAK_OUT').replace('BREAKIN', 'BREAK_IN');
                                                const finalStyleKey = styleKey === 'BREAKOUT' ? 'BREAK_OUT' : (styleKey === 'BREAKIN' ? 'BREAK_IN' : styleKey);
                                                
                                                return (
                                                    <div
                                                        key={`${item.day}-${actionKey}`}
                                                        className="grouped-cluster-bar"
                                                        style={{
                                                            height: `${(value / maxTrend) * 100}%`,
                                                            backgroundColor: statusStyle[finalStyleKey] || '#ccc',
                                                        }}
                                                        title={`${item.day} • ${actionKey.replace(/([A-Z])/g, ' $1')}: ${value}`}
                                                    >
                                                        <span className="grouped-cluster-value">{value}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="grouped-cluster-label">
                                            {new Date(item.day).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="trend-legend-row" style={{ marginTop: '15px' }}>
                            {Object.entries(statusStyle).map(([key, color]) => (
                                <span key={key} className="trend-legend-item">
                                    <span className="trend-legend-dot" style={{ background: color }} />
                                    {key.replace('_', ' ')}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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

    return (
        <div className="faculty-reports-page">
            {/* Header */}
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '15px' }}>
                <div className="academic-year-badge">
                    <i className="fas fa-calendar-alt"></i> A.Y. {academicYear || 'Not Set'}
                </div>
            </div>

            {/* MATCHING STUDENT FILTERS HEADER SECTION */}
            <div className="reports-header-section">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <div className="report-selector-group">
                        <label>Select Report Type:</label>
                        <select
                            value={selectedReport?.id || ''}
                            onChange={e => handleSelectReport(reportOptions.find(opt => opt.id === e.target.value))}
                            className="app-select big-select"
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

                    <div className="filter-item" style={{ minWidth: '220px' }}>
                        <label>Subject / Class:</label>
                        <select 
                            value={selectedClass} 
                            onChange={e => setSelectedClass(e.target.value)} 
                            className="app-select big-select"
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => (
                                <option key={c.class_id} value={c.class_id}>{c.subject_code} - {c.section || 'N/A'}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>From:</label>
                        <input 
                            type="date" 
                            value={dateFrom} 
                            onChange={e => setDateFrom(e.target.value)} 
                            className="app-select big-select" 
                        />
                    </div>
                    
                    <div className="filter-item">
                        <label>To:</label>
                        <input 
                            type="date" 
                            value={dateTo} 
                            onChange={e => setDateTo(e.target.value)} 
                            className="app-select big-select" 
                        />
                    </div>
                </div>

                {selectedReport && selectedReport.desc && (
                    <div className="report-description-box" style={{ marginTop: '0px' }}>
                        <i className="fas fa-info-circle"></i>
                        <span>{selectedReport.desc}</span>
                    </div>
                )}
            </div>

            {!selectedReport ? (
                <div className="reports-empty-state">
                    <i className="fas fa-file-alt"></i>
                    <h3>Select a Report</h3>
                    <p>Choose a report type to view attendance data.</p>
                </div>
            ) : (
                <div className="reports-content-full">
                    {!loading && reportData.length > 0 && renderInsightPanel()}
                    {!loading && reportData.length > 0 && renderVisualSummary()}
                    {!loading && reportData.length > 0 && renderSessionCountReference()}

                    <div className="recent-reports-card" style={{ marginTop: '20px' }}>
                        <div className="recent-reports-header">
                            <h3 style={{ margin: 0 }}>Generated Records</h3>
                            <div className="report-actions">
                                <button className="export-all-button" onClick={() => setModalOpen(true)} disabled={reportData.length === 0}>
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
                                                        if (key === 'status') {
                                                            const isPresent = ['ENTERED', 'ON TIME', 'PRESENT', 'BREAK_IN'].includes(String(value).toUpperCase());
                                                            cellContent = (
                                                                <LogStatusTag 
                                                                    text={String(value).toUpperCase()} 
                                                                    isPresent={isPresent}
                                                                    type={String(value).toUpperCase()}
                                                                />
                                                            );
                                                        } else {
                                                            cellContent = <span style={{ fontWeight: '600', color: '#334155' }}>{value}</span>;
                                                        }
                                                    }
                                                    
                                                    return (
                                                         <td key={key}>{cellContent}</td>
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
                </div>
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
                    scope={selectedClass || 'All Classes'}
                    dateRange={`${dateFrom || '---'} to ${dateTo || '---'}`}
                />
            )}
        </div>
    );
};

export default FacultyReportsPage;
