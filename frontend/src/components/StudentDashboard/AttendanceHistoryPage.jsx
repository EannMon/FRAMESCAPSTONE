import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';

import './AttendanceHistoryPage.css';
import StudentReportModal from './StudentReportModal';

const LogStatusTag = ({ text, isPresent, type }) => {
    let statusClass = 'neutral';
    if (isPresent) statusClass = 'success';
    else if (type === 'BREAK_OUT') statusClass = 'warning';
    else if (type === 'EXIT') statusClass = 'neutral';
    else statusClass = 'neutral';

    return (
        <span className={`log-status-tag ${statusClass}`}>
            {text}
        </span>
    );
};

const AttendanceHistoryPage = () => {
    // 1. DATA STATE
    const [rawLogs, setRawLogs] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [uniqueSubjects, setUniqueSubjects] = useState([]);
    const [subjectClassMap, setSubjectClassMap] = useState({});
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [isFetchingReport, setIsFetchingReport] = useState(false);
    const [summaryMetrics, setSummaryMetrics] = useState([]);
    const [insights, setInsights] = useState([]);
    const [sessionCountReference, setSessionCountReference] = useState(null);
    const reportCacheRef = useRef(new Map());

    // 2. FILTER STATE
    const [selectedReportType, setSelectedReportType] = useState('DAILY_REPORT'); // Default to first valid item
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
    const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]); // End Date
    const [selectedSemester, setSelectedSemester] = useState('1ST'); // 1ST, 2ND, SUMMER
    const [academicYear, setAcademicYear] = useState(new Date().getFullYear());

    // ... (reportTypes array remains same) ...
    const reportTypes = [
        { id: 'DAILY_REPORT', label: 'Daily Attendance per Subject', desc: 'Tracks presence, lateness, and breaks for each class session.' },
        { id: 'WEEKLY_SUMMARY', label: 'Weekly Attendance Summary', desc: 'Summarizes present/absent/late counts; promotes accountability.' },
        { id: 'MONTHLY_TRENDS', label: 'Monthly Attendance Trends', desc: 'Groups attendance by month to identify patterns and trends over time.' },
        { id: 'SEM_REPORT', label: 'Semestral Report', desc: 'Provides cumulative data and can be filtered per subject or all enrolled subjects.' },
        { id: 'HISTORY_30D', label: 'Attendance History Log (30 Days)', desc: 'Maintains recent timestamps; balances data retention and privacy.' },
        { id: 'LATE_REPORT', label: 'Personal Late Arrival Report', desc: 'Monitors frequency and duration of lateness for punctuality.' },
        { id: 'BREAK_LOG', label: 'Break Duration Log', desc: 'Shows total break time to encourage responsible behavior.' },
        { id: 'CONSISTENCY', label: 'Personal Consistency Index', desc: 'AI-generated metric predicting absence trends.' }
    ];

    // Helper: Parse Time "HH:MM:SS" (24-hr) or "07:00 AM" (12-hr) -> Minutes
    const parseTimeStr = (timeStr) => {
        if (!timeStr) return 0;
        try {
            // Handle 24-hr format "HH:MM:SS" or "HH:MM"
            if (timeStr.includes(':') && !timeStr.includes('AM') && !timeStr.includes('PM')) {
                const parts = timeStr.split(':');
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
            // Handle 12-hr format "07:00 AM"
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
        } catch (e) {
            return 0;
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!storedUser) return;
                setUserProfile(storedUser);

                // A. Get Schedule & Pre-process
                const userId = storedUser.id || storedUser.user_id;
                const schedRes = await api.get(`/api/student/schedule/${userId}`, { signal: controller.signal });
                
                // OPTIMIZATION: Pre-calculate start/end minutes for schedule
                const processedSchedule = (schedRes.data || []).map(cls => ({
                    ...cls,
                    startMins: parseTimeStr(cls.start_time),
                    endMins: parseTimeStr(cls.end_time)
                }));
                setSchedule(processedSchedule);

                // Extract Subjects for Filter
                const subjects = [];
                const seen = new Set();
                const subjectToClass = {};
                processedSchedule.forEach(item => {
                    if (item.subject_title && !seen.has(item.subject_title)) {
                        seen.add(item.subject_title);
                        subjects.push(item.subject_title);
                    }
                    if (item.subject_title && item.class_id && !subjectToClass[item.subject_title]) {
                        subjectToClass[item.subject_title] = item.class_id;
                    }
                });
                setUniqueSubjects(subjects);
                setSubjectClassMap(subjectToClass);

                setLoading(false);

            } catch (error) {
                if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                    console.error("Error:", error);
                    setLoading(false);
                }
            }
        };
        fetchData();

        return () => controller.abort();
    }, []);

    const resolveDateWindow = () => {
        const selectedDate = new Date(filterDate);
        selectedDate.setHours(0, 0, 0, 0);

        const toIso = (d, end = false) => {
            const copy = new Date(d);
            if (end) copy.setHours(23, 59, 59, 999);
            else copy.setHours(0, 0, 0, 0);
            return copy.toISOString().split('T')[0];
        };

        if (selectedReportType === 'DAILY_REPORT') {
            return { dateFrom: toIso(selectedDate), dateTo: toIso(selectedDate, true) };
        }

        if (selectedReportType === 'LATE_REPORT' || selectedReportType === 'BREAK_LOG') {
            return { dateFrom: '2020-01-01', dateTo: toIso(new Date(), true) };
        }

        if (selectedReportType === 'WEEKLY_SUMMARY') {
            const weekEnd = new Date(selectedDate);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return { dateFrom: toIso(selectedDate), dateTo: toIso(weekEnd, true) };
        }

        if (selectedReportType === 'HISTORY_30D' || selectedReportType === 'CONSISTENCY') {
            const last30 = new Date(selectedDate);
            last30.setDate(last30.getDate() - 29);
            return { dateFrom: toIso(last30), dateTo: toIso(selectedDate, true) };
        }

        if (selectedReportType === 'MONTHLY_TRENDS') {
            const mtDate = new Date(filterDate);
            const start = new Date(mtDate.getFullYear(), mtDate.getMonth(), 1);
            const end = new Date(mtDate.getFullYear(), mtDate.getMonth() + 1, 0);
            return { dateFrom: toIso(start), dateTo: toIso(end, true) };
        }

        if (selectedReportType === 'SEM_REPORT') {
            const year = parseInt(academicYear, 10);
            if (selectedSemester === '1ST') {
                return { dateFrom: `${year}-08-01`, dateTo: `${year}-12-31` };
            }
            if (selectedSemester === '2ND') {
                return { dateFrom: `${year + 1}-01-01`, dateTo: `${year + 1}-05-31` };
            }
            return { dateFrom: `${year + 1}-06-01`, dateTo: `${year + 1}-07-31` };
        }

        return { dateFrom: `${academicYear}-08-01`, dateTo: `${parseInt(academicYear, 10) + 1}-07-31` };
    };

    const metricDictionary = {
        real_time_attendance_rate: {
            label: 'Real-Time Attendance Rate',
            explanation: 'How many conducted sessions you attended in this window.',
            formula: 'sessions_attended / sessions_conducted * 100',
        },
        semester_progress_attendance_rate: {
            label: 'Semester Progress Attendance Rate',
            explanation: 'How much of expected sessions you have already attended.',
            formula: 'sessions_attended / expected_sessions * 100',
        },
        punctuality_rate: {
            label: 'Punctuality Rate',
            explanation: 'Share of attended ENTRY events that were on time.',
            formula: 'on_time_entries / total_entries * 100',
        },
        consistency_index: {
            label: 'Consistency Index',
            explanation: 'Weighted behavior stability from attendance and punctuality.',
            formula: 'real_time_attendance_rate * 0.7 + punctuality_rate * 0.3',
        },
    };

    const confidenceMeaning = {
        HIGH: 'High reliability: enough sessions and complete data.',
        MEDIUM: 'Moderate reliability: acceptable samples but limited depth.',
        LOW: 'Low reliability: small sample size and/or limited data in this window.',
    };

    const statusDistribution = useMemo(() => {
        const buckets = { PRESENT: 0, LATE: 0, ON_BREAK: 0, EXITED: 0 };
        rawLogs.forEach((log) => {
            const action = (log.action || '').toUpperCase();
            if (action === 'ENTRY' || action === 'BREAK_IN') {
                if (log.is_late) buckets.LATE += 1;
                else buckets.PRESENT += 1;
            } else if (action === 'BREAK_OUT') {
                buckets.ON_BREAK += 1;
            } else if (action === 'EXIT') {
                buckets.EXITED += 1;
            }
        });
        return buckets;
    }, [rawLogs]);

    const dailyTrend = useMemo(() => {
        const grouped = {};
        rawLogs.forEach((log) => {
            if (!log.timestamp) return;
            const key = new Date(log.timestamp).toISOString().split('T')[0];
            grouped[key] = (grouped[key] || 0) + 1;
        });
        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, count]) => ({ day, count }));
    }, [rawLogs]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchServerReport = async () => {
            const userId = userProfile?.id || userProfile?.user_id;
            if (!userId) return;
            if (selectedSubject !== 'ALL' && !subjectClassMap[selectedSubject]) return;

            const { dateFrom, dateTo } = resolveDateWindow();
            const scopedClassId = selectedSubject !== 'ALL' ? subjectClassMap[selectedSubject] : 'ALL';
            const cacheKey = [
                userId,
                selectedReportType,
                scopedClassId,
                dateFrom,
                dateTo,
                selectedSemester,
                academicYear,
            ].join('|');

            const cached = reportCacheRef.current.get(cacheKey);
            const nowMs = Date.now();
            if (cached && nowMs - cached.ts < 90000) {
                setRawLogs(cached.logs);
                setSummaryMetrics(cached.summaryMetrics);
                setInsights(cached.insights);
                setSessionCountReference(cached.sessionCountReference);
                setIsFetchingReport(false);
                return;
            }

            setIsFetchingReport(true);
            setRawLogs([]);
            setSummaryMetrics([]);
            setInsights([]);
            setSessionCountReference(null);
            try {
                const res = await api.get(`/api/student/reports/data/${userId}`, {
                    signal: controller.signal,
                    params: {
                        report_type: selectedReportType,
                        date_from: dateFrom,
                        date_to: dateTo,
                        class_id: selectedSubject !== 'ALL' ? subjectClassMap[selectedSubject] : undefined,
                        limit: 250,
                    },
                });

                const payload = res.data || {};
                const rows = payload.rows || [];

                const mapped = rows.map((row) => ({
                    timestamp: row.timestamp,
                    action: row.action,
                    is_late: row.is_late,
                    mapped_subject: row.subject_title || row.col2 || 'Unscheduled',
                    mapped_room: row.room || '—',
                    faculty_name: row.faculty_name || '—',
                    remarks: row.remarks || '—',
                }));

                setRawLogs(mapped);
                setSummaryMetrics(payload.summary_metrics || []);
                setInsights(payload.insights || []);
                setSessionCountReference(payload.session_count_reference || null);
                reportCacheRef.current.set(cacheKey, {
                    ts: nowMs,
                    logs: mapped,
                    summaryMetrics: payload.summary_metrics || [],
                    insights: payload.insights || [],
                    sessionCountReference: payload.session_count_reference || null,
                });
            } catch (error) {
                if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                    console.error('Student report fetch error:', error);
                }
            } finally {
                setIsFetchingReport(false);
            }
        };

        fetchServerReport();
        return () => controller.abort();
    }, [selectedReportType, selectedSubject, filterDate, selectedSemester, academicYear, userProfile, subjectClassMap]);

    // --- FILTER LOGIC ---
    const getFilteredData = () => {
        let filtered = [...rawLogs];

        // 1. Subject Filter
        if (selectedSubject !== 'ALL') {
            filtered = filtered.filter(l => l.mapped_subject === selectedSubject);
        }

        // Server already scopes report windows, so client only sorts for display.
        return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    };

    const renderServerInsightPanel = () => {
        if (!summaryMetrics.length && !insights.length) return null;

        return (
            <div className="insight-panel">
                {summaryMetrics.length > 0 && (
                    <div className="insight-stats-row">
                        {summaryMetrics.map((metric) => (
                            <div key={metric.metric_name} className="insight-stat-card">
                                <div className="insight-stat-label">{metric.metric_name.replaceAll('_', ' ')}</div>
                                <div className="insight-stat-value">{metric.value}</div>
                                <div className="insight-stat-sub">Confidence: {metric.confidence}</div>
                            </div>
                        ))}
                    </div>
                )}

                {insights.length > 0 && (
                    <div className="insight-section" style={{ marginTop: '14px' }}>
                        <div className="insight-section-title">Explainable Insights</div>
                        <ul style={{ margin: '10px 0 0 0', paddingLeft: '18px' }}>
                            {insights.map((insight) => (
                                <li key={insight.insight_code} style={{ marginBottom: '8px' }}>
                                    <strong>{insight.title}:</strong> {insight.narrative} (Confidence: {insight.confidence})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderMetricDictionary = () => {
        if (!summaryMetrics.length) return null;
        return (
            <div className="insight-panel">
                <div className="insight-section-title">Metric Legend and Formula Guide</div>
                <div className="metric-dictionary-grid">
                    {summaryMetrics.map((metric) => {
                        const dict = metricDictionary[metric.metric_name] || {
                            label: metric.metric_name.replaceAll('_', ' '),
                            explanation: metric.explanation || 'Derived from report window records.',
                            formula: metric.formula || 'N/A',
                        };
                        return (
                            <div key={metric.metric_name} className="metric-dictionary-card">
                                <div className="metric-dictionary-title">{dict.label}</div>
                                <div className="metric-dictionary-value">Current: {metric.value}</div>
                                <div className="metric-dictionary-line"><strong>Formula:</strong> {dict.formula}</div>
                                <div className="metric-dictionary-line"><strong>Meaning:</strong> {dict.explanation}</div>
                                <div className="metric-dictionary-line"><strong>Confidence:</strong> {metric.confidence} - {confidenceMeaning[metric.confidence] || 'Data confidence from sample quality.'}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderVisualSummary = () => {
        if (!rawLogs.length) return null;

        const statusItems = [
            { label: 'Present', value: statusDistribution.PRESENT, color: '#2e7d32' },
            { label: 'Late', value: statusDistribution.LATE, color: '#e65100' },
            { label: 'On Break', value: statusDistribution.ON_BREAK, color: '#1565c0' },
            { label: 'Exited', value: statusDistribution.EXITED, color: '#6c757d' },
        ];
        const maxStatus = Math.max(...statusItems.map((item) => item.value), 1);
        const maxTrend = Math.max(...dailyTrend.map((item) => item.count), 1);

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
                        <div className="visual-title">Daily Activity Trend</div>
                        <div className="mini-column-chart">
                            {dailyTrend.slice(-10).map((item) => (
                                <div key={item.day} className="mini-column-item">
                                    <div className="mini-column-track">
                                        <div
                                            className="mini-column-fill"
                                            style={{ height: `${(item.count / maxTrend) * 100}%` }}
                                        />
                                    </div>
                                    <div className="mini-column-value">{item.count}</div>
                                    <div className="mini-column-label">{new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSessionCountReference = () => {
        if (!sessionCountReference) return null;
        const reportWindow = sessionCountReference.report_window || {};
        const wholeSemester = sessionCountReference.whole_semester || {};

        return (
            <div className="insight-panel">
                <div className="insight-section-title">Session Count Reference</div>
                <div className="session-reference-grid">
                    <div className="session-reference-card">
                        <div className="session-reference-title">Report Window</div>
                        <div className="session-reference-line">Attended: {reportWindow.attended ?? 0}</div>
                        <div className="session-reference-line">Conducted: {reportWindow.conducted ?? 0}</div>
                        <div className="session-reference-line">Expected: {reportWindow.expected ?? 0}</div>
                    </div>
                    <div className="session-reference-card">
                        <div className="session-reference-title">Whole Semester (Department Dates)</div>
                        <div className="session-reference-sub">
                            {wholeSemester.semester_start_date || 'N/A'} to {wholeSemester.semester_end_date || 'N/A'}
                        </div>
                        <div className="session-reference-line">Attended: {wholeSemester.attended ?? 0}</div>
                        <div className="session-reference-line">Conducted: {wholeSemester.conducted ?? 0}</div>
                        <div className="session-reference-line">Expected: {wholeSemester.expected ?? 0}</div>
                    </div>
                </div>
            </div>
        );
    };

    // Helper: Map action to display status
    const getActionStatus = (action) => {
        if (!action) return { text: '—', isPresent: false };
        const upper = action.toUpperCase();
        if (upper === 'ENTRY' || upper === 'BREAK_IN') return { text: 'PRESENT', isPresent: true };
        if (upper === 'BREAK_OUT') return { text: 'ON BREAK', isPresent: false };
        if (upper === 'EXIT') return { text: 'EXITED', isPresent: false };
        return { text: action, isPresent: false };
    };

    const displayData = getFilteredData();
    const currentDesc = reportTypes.find(r => r.id === selectedReportType)?.desc;

    // --- GENERATE DATE RANGE STRING ---
    const getDateRangeString = () => {
        const d = new Date(filterDate);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };

        switch (selectedReportType) {
            case 'DAILY_REPORT':
                return d.toLocaleDateString('en-US', options);
            case 'LATE_REPORT':
            case 'BREAK_LOG':
                return `All available records up to ${new Date().toLocaleDateString('en-US', options)}`;
            case 'WEEKLY_SUMMARY':
                const weekEnd = new Date(d);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return `${d.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
            case 'HISTORY_30D':
                const last30 = new Date(d);
                last30.setDate(last30.getDate() - 30);
                return `${last30.toLocaleDateString('en-US', options)} - ${d.toLocaleDateString('en-US', options)}`;

            case 'MONTHLY_TRENDS':
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            case 'SEM_REPORT':
                return `${selectedSemester === '1ST' ? '1st' : (selectedSemester === '2ND' ? '2nd' : 'Summer')} Semester ${academicYear}-${parseInt(academicYear) + 1}`;
            default:
                return d.toLocaleDateString('en-US', options);
        }
    };

    // --- RENDER DYNAMIC DATE FILTER ---
    const renderDateFilter = () => {
        const style = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '160px' };
        
        // A. Single Date Input (Used for Daily, Weekly Start, History End)
        if (selectedReportType === 'DAILY_REPORT') {
             return (
                 <div className="filter-item">
                     <label>Select Date:</label>
                     <input type="date" style={style} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
        }
        if (selectedReportType === 'LATE_REPORT' || selectedReportType === 'BREAK_LOG') {
            return null;
        }
        if (selectedReportType === 'WEEKLY_SUMMARY') {
             return (
                 <div className="filter-item">
                     <label>Week Starting:</label>
                     <input type="date" style={style} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
        }
        if (selectedReportType === 'HISTORY_30D') {
             return (
                 <div className="filter-item">
                     <label>Reference Date (End):</label>
                     <input type="date" style={style} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
        }

        // B. Month Picker (Monthly Trends)
        if (selectedReportType === 'MONTHLY_TRENDS') {
            return (
                <div className="filter-item">
                    <label>Select Month:</label>
                    <input type="month" style={style} value={filterDate.substring(0, 7)} onChange={(e) => setFilterDate(e.target.value + '-01')} />
                </div>
            );
        }

        // Semester Selector (Sem Report)
        if (selectedReportType === 'SEM_REPORT') {
             return (
                 <div style={{ display: 'flex', gap: '15px' }}>
                     <div className="filter-item">
                         <label>School Year:</label>
                         <select style={style} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                             {[2023, 2024, 2025, 2026].map(y => (
                                 <option key={y} value={y}>{y} - {y+1}</option>
                             ))}
                         </select>
                     </div>
                     <div className="filter-item">
                         <label>Semester:</label>
                         <select style={style} value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                             <option value="1ST">1st Semester</option>
                             <option value="2ND">2nd Semester</option>
                             <option value="SUMMER">Summer</option>
                         </select>
                     </div>
                 </div>
             );
        }
        return null; 
    };

    // --- MODAL STATE ---
    const [showReportModal, setShowReportModal] = useState(false);

    // --- REPORT GENERATION HANDLER ---
    const handleGenerateReport = (format) => {
        // 1. Map Data for Report (Matching keys to headers)
        const tableInput = displayData.map(log => {
            const status = getActionStatus(log.action);
            return {
                "Date": new Date(log.timestamp).toLocaleDateString(),
                "Time": new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                "Subject": log.mapped_subject,
                "Professor": log.faculty_name || 'N/A',
                "Room": log.mapped_room || 'N/A',
                "Status": status.text
            };
        });

        const reportObj = reportTypes.find(r => r.id === selectedReportType);
        const reportTitle = reportObj?.label.replace(/^[a-z]\.\s/, '') || "Attendance Report";
        const dateRangeStr = getDateRangeString();

        const reportInfo = {
            title: reportTitle,
            type: "PERSONAL ATTENDANCE RECORD",
            category: 'personal',
            context: {
                name: `${userProfile.first_name || userProfile.firstName} ${userProfile.last_name || userProfile.lastName}`,
                id: userProfile.tupm_id
            },
            dateRange: dateRangeStr
        };

        if (format === 'PDF') {
            import('../../utils/ReportGenerator').then(({ generateFramesPDF }) => {
                generateFramesPDF(reportInfo, tableInput);
            });
        } else if (format === 'CSV') {
            import('../../utils/ReportGenerator').then(({ generateCSV }) => {
                generateCSV(reportInfo, tableInput);
            });
        }
        
        setShowReportModal(false);
    };

    const handleOpenModal = () => {
        // Validation: Verify constraints if needed (e.g., date selected)
        // For now, flexible.
        setShowReportModal(true);
    };

    if (loading) return <div style={{ padding: '40px' }}>Loading Records...</div>;

    return (
        <div className="attendance-history-view">

            {/* REPORT HEADER */}
            <div className="reports-header-section">
                
                {/* FLEX CONTAINER FOR ALIGNMENT */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <div className="report-selector-group" style={{ marginBottom: 0 }}>
                        <label>Select Report Type:</label>
                        <select
                            className="app-select big-select"
                            value={selectedReportType}
                            onChange={(e) => setSelectedReportType(e.target.value)}
                        >
                            {reportTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* DYNAMIC DATE FILTER */}
                    <div className="dynamic-date-filter" style={{ marginTop: 0 }}>
                        {renderDateFilter()}
                    </div>
                </div>

                <div className="report-description-box" style={{marginTop: '0px'}}>
                    <i className="fas fa-info-circle"></i>
                    <span>{currentDesc}</span>
                </div>
                {isFetchingReport && <div className="report-refreshing-note">Updating report data...</div>}
            </div>

            {!loading && displayData.length > 0 && renderServerInsightPanel()}
            {!loading && displayData.length > 0 && renderSessionCountReference()}
            {!loading && displayData.length > 0 && renderMetricDictionary()}
            {!loading && displayData.length > 0 && renderVisualSummary()}
            {!loading && isFetchingReport && (
                <div className="insight-panel">
                    <div className="insight-section-title">Loading Selected Report</div>
                    <div className="report-loading-skeleton">Fetching updated metrics and records...</div>
                </div>
            )}

            {/* TABLE CARD */}
            <div className="card recent-reports-card">
                <div className="recent-reports-header">
                    <h3>Generated Records</h3>

                    <div className="recent-reports-filters">
                        <label>Filter Subject:</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="app-select"
                        >
                            <option value="ALL">All Enrolled Subjects</option>
                            {uniqueSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>

                        <button className="export-all-button" onClick={handleOpenModal}>
                            <i className="fas fa-file-pdf"></i> Generate Official Report
                        </button>
                    </div>
                </div>

                <div className="reports-table-container">
                    <table className="recent-reports-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Subject</th>
                                <th>Professor</th>
                                <th>Room</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.length > 0 ? (
                                displayData.map((log, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.85em', color: '#888' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#333' }}>
                                            {log.mapped_subject}
                                        </td>
                                        <td>{log.faculty_name || '—'}</td>
                                        <td>{log.mapped_room}</td>
                                        <td>
                                            {(() => {
                                                const status = getActionStatus(log.action);
                                                return (
                                                    <LogStatusTag
                                                        text={status.text}
                                                        isPresent={status.isPresent}
                                                        type={log.action?.toUpperCase()}
                                                    />
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                        No records found for this view.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REPORT GENERATION MODAL */}
            <StudentReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onGenerate={handleGenerateReport}
                defaultReportType={reportTypes.find(r => r.id === selectedReportType)?.label}
                defaultSubject={selectedSubject === 'ALL' ? 'All Enrolled Subjects' : selectedSubject}
                defaultDate={getDateRangeString()}
                filters="All Statuses"
            />
        </div>
    );
};

export default AttendanceHistoryPage;