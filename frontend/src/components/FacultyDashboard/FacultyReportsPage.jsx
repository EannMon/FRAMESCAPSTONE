import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useToast } from '../Common/ToastProvider';
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
    const isPersonal = reportType.startsWith('PERSONAL') || reportType === 'HISTORY_30D' || reportType === 'INSTRUCTOR_DELAY';
    if (isPersonal) {
        return {
            headers: ['ID', 'Date', 'Subject / Room', 'Status', 'Time', 'Remarks'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }

    const isAggregatedClass = ['CLASS_SEMESTER', 'CLASS_MONTHLY', 'PUNCTUALITY_INDEX', 'PARTICIPATION_INSIGHT'].includes(reportType);
    if (isAggregatedClass) {
        return {
            headers: ['ID', 'Name', 'Metric Details', 'Status', 'Distribution', 'Remarks (Student ID)'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }

    return {
        headers: ['ID', 'Name', 'TUPM Student ID', 'Section', 'Status', 'Time', 'Date'],
        keys: ['id', 'col1', 'col2', 'section', 'status', 'col3', 'date_of_entry']
    };
};

const FacultyReportsPage = () => {
    const toast = useToast();
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
    const [ayStart, setAyStart] = useState('');
    const [ayEnd, setAyEnd] = useState('');

    // --- EDIT MODAL STATES ---
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editTime, setEditTime] = useState('');
    const [editRemarks, setEditRemarks] = useState('');
    const [saving, setSaving] = useState(false);

    const handleQuickDate = (mode) => {
        const now = new Date();
        if (mode === 'weekly') {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            setDateFrom(lastWeek.toISOString().split('T')[0]);
            setDateTo(now.toISOString().split('T')[0]);
        } else if (mode === 'monthly') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setDateFrom(firstDay.toISOString().split('T')[0]);
            setDateTo(lastDay.toISOString().split('T')[0]);
        } else if (mode === 'semestral') {
            if (ayStart) setDateFrom(ayStart);
            if (ayEnd) setDateTo(ayEnd);
        }
    };

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
        const userId = user?.id || user?.user_id;
        if (!userId) return;
        const controller = new AbortController();

        api.get(`/api/faculty/schedule/${userId}`, { signal: controller.signal }).then(res => {
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
                    if (res.data.semester_start_date) {
                        setDateFrom(res.data.semester_start_date);
                        setAyStart(res.data.semester_start_date);
                    }
                    if (res.data.semester_end_date) {
                        setDateTo(res.data.semester_end_date);
                        setAyEnd(res.data.semester_end_date);
                    }
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
    }, [dateFrom, dateTo, selectedReport?.id, selectedClass]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchReportData = async (reportId) => {
        const userId = user?.id || user?.user_id;
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const report = reportOptions.find((opt) => opt.id === reportId);
            const resolvedClassId = report?.type === 'CLASS'
                ? (selectedClass || '0')
                : undefined;

            const params = { report_type: reportId };
            if (resolvedClassId) params.class_id = resolvedClassId;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            params.limit = 200;

            const res = await api.get(`/api/faculty/reports/data/${userId}`, { params });
            const payload = res.data || {};
            const rows = Array.isArray(payload) ? payload : (payload.rows || []);
            setReportData(rows);
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
            setSelectedClass(String(classes[0].id));
        }

        if (report?.id?.includes('SEMESTER') && ayStart && ayEnd) {
            setDateFrom(ayStart);
            setDateTo(ayEnd);
        } else if (report?.id?.includes('MONTHLY')) {
            const now = new Date();
            setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
            setDateTo(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
        } else if (report?.id?.includes('DAILY')) {
            const today = new Date().toISOString().split('T')[0];
            setDateFrom(today);
            setDateTo(today);
        } else if (report?.id?.includes('WEEKLY')) {
            const now = new Date();
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            setDateFrom(lastWeek.toISOString().split('T')[0]);
            setDateTo(now.toISOString().split('T')[0]);
        }
    };

    const handleRefresh = () => {
        if (selectedReport) fetchReportData(selectedReport.id);
    };

    // --- EDIT MODAL HANDLERS ---
    const openEditModal = (row) => {
        setEditingStudent(row);
        if (row.col3 && row.col3 !== '—' && row.col3 !== 'No entry recorded') {
            try {
                const parts = row.col3.split(' ');
                let timePart = parts[0];
                let ampm = parts[1];
                if (parts.length > 2) {
                   timePart = parts[1];
                   ampm = parts[2];
                }

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
        setEditRemarks(row.remarks && row.remarks !== '—' ? row.remarks : '');
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
            // Refresh
            handleGenerateReport();
        } catch (error) {
            toast.error('Failed to update: ' + (error.response?.data?.detail?.error?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateReport = async (format) => {
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

    return (
        <div className="faculty-reports-page">
            {/* Header */}
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '15px' }}>
                <div className="academic-year-badge">
                    <i className="fas fa-calendar-alt"></i> A.Y. {academicYear || 'Not Set'}
                </div>
            </div>

            {/* Filters Bar */}
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

                    <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Subject / Class:</label>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="app-select big-select" style={{ minWidth: '220px', padding: '10px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }}>
                            <option value="">All Classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.subject_code} - {c.section || 'N/A'} ({c.day_of_week})</option>
                            ))}
                        </select>
                    </div>

                    <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                                {selectedReport?.id?.includes('SEMESTER') ? 'Academic Period:' 
                                 : selectedReport?.id?.includes('MONTHLY') ? 'Select Month:' 
                                 : selectedReport?.id?.includes('DAILY') ? 'Select Date:'
                                 : 'Date Range:'}
                            </label>
                            {!(selectedReport?.id?.includes('SEMESTER') || selectedReport?.id?.includes('MONTHLY') || selectedReport?.id?.includes('DAILY')) && (
                                <div className="quick-date-pills" style={{ display: 'flex', gap: '6px' }}>
                                    <button type="button" onClick={() => handleQuickDate('weekly')} style={{ fontSize: '0.75em', padding: '4px 8px', borderRadius: '4px', background: '#e2e8f0', color: '#334155', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Past 7 Days</button>
                                    <button type="button" onClick={() => handleQuickDate('monthly')} style={{ fontSize: '0.75em', padding: '4px 8px', borderRadius: '4px', background: '#e2e8f0', color: '#334155', border: 'none', cursor: 'pointer', fontWeight: '600' }}>This Month</button>
                                    <button type="button" onClick={() => handleQuickDate('semestral')} style={{ fontSize: '0.75em', padding: '4px 8px', borderRadius: '4px', background: '#e2e8f0', color: '#334155', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Semester</button>
                                </div>
                            )}
                        </div>
                        
                        {selectedReport?.id?.includes('SEMESTER') ? (
                            <div style={{ padding: '10px 15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', fontSize: '0.95rem', color: '#334155', fontWeight: '500', height: '42px', boxSizing: 'border-box', display: 'flex', alignItems: 'center' }}>
                                <i className="fas fa-lock" style={{ marginRight: '8px', color: '#94a3b8' }}></i>
                                {ayStart} to {ayEnd}
                            </div>
                        ) : selectedReport?.id?.includes('MONTHLY') ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="month" 
                                    value={dateFrom ? dateFrom.substring(0, 7) : ''} 
                                    onChange={e => {
                                        if (!e.target.value) return;
                                        const [y, m] = e.target.value.split('-');
                                        const firstDay = new Date(y, m - 1, 1).toISOString().split('T')[0];
                                        const lastDay = new Date(y, m, 0).toISOString().split('T')[0];
                                        setDateFrom(firstDay);
                                        setDateTo(lastDay);
                                    }} 
                                    className="filter-input" 
                                    style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', height: '42px', boxSizing: 'border-box', flex: 1, minWidth: '180px' }} 
                                />
                            </div>
                        ) : selectedReport?.id?.includes('DAILY') ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="date" 
                                    value={dateFrom} 
                                    onChange={e => {
                                        setDateFrom(e.target.value);
                                        setDateTo(e.target.value);
                                    }} 
                                    className="filter-input" 
                                    style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', height: '42px', boxSizing: 'border-box', flex: 1, minWidth: '150px' }} 
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-input" style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', height: '42px', boxSizing: 'border-box', flex: 1, minWidth: '130px' }} />
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>to</span>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-input" style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', height: '42px', boxSizing: 'border-box', flex: 1, minWidth: '130px' }} />
                            </div>
                        )}
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
                    <i className="fas fa-file-alt"></i>
                    <h3>Select a Report</h3>
                    <p>Choose a report type to view attendance data.</p>
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
                                                    
                                                    if (key === 'col1' || key === 'col2' || key === 'status') {
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

            {/* Edit Attendance Modal */}
            {editModalOpen && (
                <div className="reports-unique-modal-overlay" onClick={() => setEditModalOpen(false)}>
                    <div className="reports-unique-modal-content" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '400px' }}>
                        <div className="metric-modal-header">
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Edit Manual Entry</h3>
                            <button className="metric-modal-close" onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div className="metric-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <div className="modal-form-group">
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Student</label>
                                <input type="text" value={editingStudent?.col1 || ''} disabled className="app-input" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc' }} />
                            </div>
                            <div className="modal-form-group">
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Time In</label>
                                <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="app-input" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                            </div>
                            <div className="modal-form-group">
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Remarks</label>
                                <input type="text" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} placeholder="Adjusted due to error" className="app-input" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setEditModalOpen(false)} disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                                <button type="button" onClick={handleSaveEdit} disabled={saving || !editTime} style={{ padding: '8px 16px', borderRadius: '6px', background: '#163269', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '500' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            {modalOpen && (
                <FacultyReportModal previewUrl={previewUrl} onClose={() => setModalOpen(false)} />
            )}
        </div>
    );
};

export default FacultyReportsPage;
