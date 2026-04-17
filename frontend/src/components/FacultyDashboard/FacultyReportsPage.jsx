import React, { useState, useEffect, useMemo, useRef } from 'react';
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
// REPORT OPTIONS â€” Separated by tab
// ============================================
const PERSONAL_REPORTS = [
    { id: 'DAILY_REPORT', label: 'Daily Attendance', desc: 'Tracks attendance behavior for selected date and taught subjects, including absences for conducted sessions.' },
    { id: 'WEEKLY_SUMMARY', label: 'Weekly Attendance Summary', desc: 'Summarizes attendance behavior across the selected weekly window.' },
    { id: 'MONTHLY_TRENDS', label: 'Monthly Attendance Trends', desc: 'Shows monthly attendance and punctuality trend movement.' },
    { id: 'SEM_REPORT', label: 'Semestral Report', desc: 'Provides cumulative data and can be filtered per taught subject or all taught subjects.' },
    { id: 'LATE_REPORT', label: 'Personal Late Arrival Report', desc: 'Semestral view of late arrivals across all taught subjects or a selected class.' },
    { id: 'BREAK_LOG', label: 'Break Duration Log', desc: 'Semestral view of break-out and break-in behavior across taught classes.' },
    { id: 'ABSENT_LOG', label: 'Absent Logs', desc: 'Shows conducted sessions where you were marked absent in the selected period.' },
    { id: 'CONSISTENCY', label: 'Personal Consistency Index', desc: 'Explains your stability score, trend direction, and confidence for this report window.' },
];

const CLASS_REPORTS = [
    { id: 'CLASS_DAILY', label: 'Daily Class Attendance', desc: 'Tracks student attendance for each session.' },
    { id: 'CLASS_WEEKLY', label: 'Weekly Attendance Summary (Class)', desc: 'Weekly attendance movement by class with per-student scoring.' },
    { id: 'CLASS_MONTHLY', label: 'Monthly Attendance Trends (Class)', desc: 'Visual trend of improvement or decline per class. Includes participation consistency insights.' },
    { id: 'CLASS_SEMESTER', label: 'Semestral Class Attendance', desc: 'Full semester attendance summary per class. Includes participation consistency insights.' },
    { id: 'CLASS_ABSENCE', label: 'Absence Summary per Section', desc: 'Quantifies student absences for easier grading.' },
    { id: 'CLASS_LATE', label: 'Late Arrival Report', desc: 'Monitors frequency and timing of late student arrivals.' },
    { id: 'PUNCTUALITY_INDEX', label: 'Punctuality Index per Section', desc: 'Ranks student punctuality relative to scheduled start.' },
    { id: 'BREAK_DURATION', label: 'Break Duration & Abuse Report', desc: 'Detects excessive breaks or failures to return.' },
    { id: 'UNRECOGNIZED_LOGS', label: 'Unrecognized Individual Logs', desc: 'Unknown individuals detected by camera.' },
    { id: 'EARLY_EXITS', label: 'Early Exits Report', desc: 'Students leaving before class ends.' },
    { id: 'ATTENDANCE_INCONSISTENCY', label: 'Attendance Inconsistency Logs', desc: 'Students who use break but skip main attendance.' },
];

// Column configurations per report type
const getColumnConfig = (reportType, tab) => {
    if (reportType === 'CONSISTENCY') {
        // Consistency index uses visual panels, no standard table
        return {
            headers: ['#', 'Subject', 'Room', 'Status', 'Session Summary', 'Remarks'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }
    if (reportType === 'SEM_REPORT') {
        return {
            headers: ['#', 'Subject', 'Room', 'Status', 'Session Summary', 'Remarks'],
            keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
        };
    }
    if (tab === 'PERSONAL') {
        return {
            headers: ['Date & Time', 'Subject', 'Class Section', 'Room', 'Status'],
            keys: ['_date_time', '_subject', 'section', 'room', 'status']
        };
    }
    // CLASS tab default
    return {
        headers: ['#', 'Student ID', 'Name', 'Status', 'Time', 'Remarks'],
        keys: ['id', 'col2', 'col1', 'status', 'col3', 'remarks']
    };
};

const FacultyReportsPage = () => {
    // â”€â”€ Tab State â”€â”€
    const [activeTab, setActiveTab] = useState('PERSONAL'); // 'PERSONAL' | 'CLASS'

    // â”€â”€ Shared State â”€â”€
    const [selectedReport, setSelectedReport] = useState(PERSONAL_REPORTS[0]);
    const [reportData, setReportData] = useState([]);
    const [visualReportData, setVisualReportData] = useState([]);
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
    const [academicYearLabel, setAcademicYearLabel] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('1ST');
    const [departmentSemesterWindow, setDepartmentSemesterWindow] = useState({ dateFrom: '', dateTo: '' });
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [weeklyMonth, setWeeklyMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedWeekNumber, setSelectedWeekNumber] = useState(String(Math.floor((new Date().getDate() - 1) / 7) + 1));

    const reportCacheRef = useRef(new Map());

    const PERSONAL_REPORT_TO_FACULTY_REPORT = {
        DAILY_REPORT: 'PERSONAL_DAILY',
        WEEKLY_SUMMARY: 'PERSONAL_WEEKLY',
        MONTHLY_TRENDS: 'PERSONAL_MONTHLY',
        SEM_REPORT: 'PERSONAL_SEMESTER',
        LATE_REPORT: 'INSTRUCTOR_DELAY',
        BREAK_LOG: 'BREAK_LOG',
        ABSENT_LOG: 'ABSENT_LOG',
        CONSISTENCY: 'PERSONAL_CONSISTENCY',
    };

    const resolveFacultyReportType = (reportId) => {
        if (activeTab === 'CLASS') return reportId;
        return PERSONAL_REPORT_TO_FACULTY_REPORT[reportId] || reportId;
    };

    const normalizeSemesterCode = (semesterValue) => {
        const normalized = String(semesterValue || '').trim().toUpperCase();
        if (normalized.includes('1ST') || normalized.includes('FIRST')) return '1ST';
        if (normalized.includes('2ND') || normalized.includes('SECOND')) return '2ND';
        if (normalized.includes('SUMMER')) return 'SUMMER';
        return '1ST';
    };

    const resolveClassId = (rawValue) => {
        if (rawValue === undefined || rawValue === null) return null;
        const normalized = String(rawValue).trim();
        if (!normalized || normalized === 'undefined' || normalized === 'null') return null;

        const fromKnownClass = classes.find((cls) => {
            const classId = cls?.class_id;
            const id = cls?.id;
            return String(classId) === normalized || String(id) === normalized;
        });

        const candidate = fromKnownClass ? (fromKnownClass.class_id ?? fromKnownClass.id) : Number.parseInt(normalized, 10);
        if (!Number.isInteger(candidate) || candidate <= 0) return null;
        return candidate;
    };

    const getReportMode = (reportId) => {
        if (!reportId) return 'DAILY';
        if (reportId.includes('DAILY') || reportId === 'UNRECOGNIZED_LOGS') return 'DAILY';
        if (reportId.includes('WEEKLY')) return 'WEEKLY';
        if (reportId.includes('MONTHLY')) return 'MONTHLY';
        if (reportId === 'WEEKLY_SUMMARY') return 'WEEKLY';
        if (reportId === 'MONTHLY_TRENDS') return 'MONTHLY';
        return 'SEMESTRAL';
    };

    /**
     * Gate AI Insights display by report mode:
     * - DAILY  → never show (insufficient sample)
     * - WEEKLY → show with "low confidence" badge
     * - MONTHLY / SEMESTRAL → show normally
     * - CONSISTENCY → show only summary profile panel, not full insights
     */
    const getInsightsConfig = (reportId) => {
        const mode = getReportMode(reportId);
        if (mode === 'DAILY') return { show: false, badge: null };
        if (mode === 'WEEKLY') return { show: true, badge: 'Low Confidence — limited weekly sample' };
        if (reportId === 'CONSISTENCY') return { show: false, badge: null }; // consistency has its own panel
        return { show: true, badge: null }; // MONTHLY / SEMESTRAL — full insights
    };

    const getWeekRangesForMonth = () => {
        if (!weeklyMonth) return [];
        const [yearText, monthText] = weeklyMonth.split('-');
        const year = Number(yearText);
        const month = Number(monthText);
        if (!year || !month) return [];

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        const ranges = [];

        let cursor = new Date(startOfMonth);
        let week = 1;
        while (cursor <= endOfMonth) {
            const weekStart = new Date(cursor);
            const weekEnd = new Date(cursor);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (weekEnd > endOfMonth) {
                weekEnd.setTime(endOfMonth.getTime());
            }

            ranges.push({
                value: String(week),
                start: weekStart,
                end: weekEnd,
                label: `Week ${week}: ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            });

            cursor.setDate(cursor.getDate() + 7);
            week += 1;
        }
        return ranges;
    };

    const getSemesterWindow = () => {
        if (departmentSemesterWindow.dateFrom && departmentSemesterWindow.dateTo) {
            return {
                dateFrom: departmentSemesterWindow.dateFrom,
                dateTo: departmentSemesterWindow.dateTo,
            };
        }

        const year = parseInt(academicYear, 10) || new Date().getFullYear();
        if (selectedSemester === '1ST') {
            return { dateFrom: `${year}-08-01`, dateTo: `${year}-12-31` };
        }
        if (selectedSemester === '2ND') {
            return { dateFrom: `${year + 1}-01-01`, dateTo: `${year + 1}-06-30` };
        }
        return { dateFrom: `${year + 1}-06-01`, dateTo: `${year + 1}-07-31` };
    };

    const formatDateLocal = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    // Determine which report list is active based on tab
    const activeReportOptions = activeTab === 'PERSONAL' ? PERSONAL_REPORTS : CLASS_REPORTS;

    // â”€â”€ Modal overflow management â”€â”€
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

    // â”€â”€ Fetch faculty classes â”€â”€
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

        if (user.department_id) {
            api.get(`/api/dept/academic-year?dept_id=${user.department_id}`, { signal: controller.signal })
                .then(res => {
                    if (res.data?.academic_year) {
                        const yearStr = String(res.data.academic_year);
                        setAcademicYearLabel(yearStr);
                        const match = yearStr.match(/^\d{4}/);
                        if (match) setAcademicYear(match[0]);
                        else setAcademicYear(yearStr);
                    }
                    if (res.data?.semester) {
                        setSelectedSemester(normalizeSemesterCode(res.data.semester));
                    }
                    if (res.data?.semester_start_date && res.data?.semester_end_date) {
                        setDepartmentSemesterWindow({
                            dateFrom: res.data.semester_start_date,
                            dateTo: res.data.semester_end_date,
                        });
                        setDateFrom(res.data.semester_start_date);
                        setDateTo(res.data.semester_end_date);
                    }
                }).catch((err) => {
                    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                        console.error('Failed to fetch academic year:', err);
                    }
                });
        }

        return () => controller.abort();
    }, [user]);

    // â”€â”€ Tab change â€” reset to first report of new tab â”€â”€
    useEffect(() => {
        const newDefault = activeTab === 'PERSONAL' ? PERSONAL_REPORTS[0] : CLASS_REPORTS[0];
        setSelectedReport(newDefault);
        setReportData([]);
        setVisualReportData([]);
        setSummaryMetrics([]);
        setInsights([]);
        setSessionCountReference(null);
        setError(null);
        // For class tab, auto-select first class if none selected
        if (activeTab === 'CLASS' && !selectedClass && classes.length > 0) {
            const fallbackClassId = resolveClassId(classes[0]?.class_id ?? classes[0]?.id);
            if (fallbackClassId) setSelectedClass(String(fallbackClassId));
        }
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    // â”€â”€ Auto-fetch when filters change â”€â”€
    useEffect(() => {
        const controller = new AbortController();
        if (selectedReport) {
            fetchReportData(selectedReport.id, controller.signal);
        }
        return () => controller.abort();
    }, [selectedReport, selectedClass, filterDate, weeklyMonth, selectedWeekNumber, academicYear, selectedSemester]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchReportData = async (reportId, signal) => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            const isClassReport = activeTab === 'CLASS';
            const defaultClassId = resolveClassId(classes[0]?.class_id ?? classes[0]?.id);
            const selectedClassId = resolveClassId(selectedClass);
            const resolvedClassId = isClassReport
                ? (selectedClassId ?? defaultClassId)
                : selectedClassId; // Personal: optional class filter

            if (isClassReport && !resolvedClassId) {
                setReportData([]);
                setVisualReportData([]);
                setSummaryMetrics([]);
                setInsights([]);
                setSessionCountReference(null);
                setError('Please select a valid class before loading class-specific reports.');
                setLoading(false);
                return;
            }

            const params = { report_type: resolveFacultyReportType(reportId) };
            if (resolvedClassId !== null) params.class_id = resolvedClassId;

            const mode = getReportMode(reportId);
            let localFrom = dateFrom;
            let localTo = dateTo;

            if (mode === 'DAILY') {
                localFrom = filterDate;
                localTo = filterDate;
            } else if (mode === 'WEEKLY') {
                const weekOptions = getWeekRangesForMonth();
                const selectedWeek = weekOptions.find(w => w.value === selectedWeekNumber);
                if (selectedWeek) {
                    localFrom = formatDateLocal(selectedWeek.start);
                    localTo = formatDateLocal(selectedWeek.end);
                }
            } else if (mode === 'MONTHLY') {
                const [year, month] = weeklyMonth.split('-');
                const lastDay = new Date(year, month, 0).getDate();
                localFrom = `${year}-${month}-01`;
                localTo = `${year}-${month}-${lastDay}`;
            } else {
                const window = getSemesterWindow();
                localFrom = window.dateFrom;
                localTo = window.dateTo;
            }

            params.date_from = localFrom;
            params.date_to = localTo;
            setDateFrom(localFrom);
            setDateTo(localTo);
            params.limit = 200;

            const res = await api.get(`/api/faculty/reports/data/${user.id}`, { params, signal });
            const payload = res.data || {};
            const rows = Array.isArray(payload) ? payload : (payload.rows || []);
            const visualRows = Array.isArray(payload.visual_rows) ? payload.visual_rows : rows;

            // Map data to match student structure for trends
            const mapped = rows.map(row => {
                const col1Text = String(row.col1 || '').trim();
                const col3Text = String(row.col3 || '').trim();
                let timestamp = row.timestamp;

                if (!timestamp && col1Text) {
                    const datePart = col1Text;
                    const timePart = col3Text;
                    if (timePart && timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)) {
                        let [, h, m, meridiem] = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
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
                    timestamp,
                    action: row.action || row.status,
                    is_late: row.is_late || String(row.status || '').toUpperCase() === 'LATE',
                };
            });

            setReportData(mapped);
            setVisualReportData(visualRows);
            setSummaryMetrics(Array.isArray(payload.summary_metrics) ? payload.summary_metrics : []);
            setInsights(Array.isArray(payload.insights) ? payload.insights : []);
            setSessionCountReference(payload.session_count_reference || null);
        } catch (err) {
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return; // Request was superseded — do not touch state
            }
            console.error('Report fetch error:', err);
            setError('Failed to load report data. Please try again.');
            setReportData([]);
            setVisualReportData([]);
            setSummaryMetrics([]);
            setInsights([]);
            setSessionCountReference(null);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        if (activeTab === 'CLASS' && !selectedClass && classes.length > 0) {
            const fallbackClassId = resolveClassId(classes[0]?.class_id ?? classes[0]?.id);
            if (fallbackClassId) setSelectedClass(String(fallbackClassId));
        }
    };

    const handleRefresh = () => {
        if (selectedReport) fetchReportData(selectedReport.id);
    };

    const handleGenerateReport = (format) => {
        if (format === 'PDF') handleDownloadPDF();
        else if (format === 'CSV') handleDownloadCSV();
        else handleDownloadPDF();
    };

    const handleDownloadPDF = async () => {
        if (!selectedReport || reportData.length === 0) return;
        const config = getColumnConfig(selectedReport.id, activeTab);
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });

        const reportInfo = {
            title: selectedReport.label,
            type: activeTab === 'PERSONAL' ? 'Personal Faculty Report' : 'Class Report',
            category: activeTab === 'PERSONAL' ? 'personal' : 'class',
            dateRange: `${dateFrom || 'Start'} â€” ${dateTo || 'Present'}`,
            context: activeTab === 'PERSONAL'
                ? { name: `${user.first_name} ${user.last_name}`, id: user.tupm_id }
                : { classCode: selectedClass || 'All Classes', section: 'All' },
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
                semester: academicYear || 'Current',
            },
        };

        await generateFramesPDF(reportInfo, tableData, 'download', enrichment);
    };

    const handleDownloadCSV = () => {
        if (!selectedReport || reportData.length === 0) return;
        const config = getColumnConfig(selectedReport.id, activeTab);
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });

        const reportInfo = {
            title: selectedReport.label,
            dateRange: `${dateFrom || 'Start'} â€” ${dateTo || 'Present'}`,
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
                semester: academicYear || 'Current',
            },
        };

        generateCSV(reportInfo, tableData, enrichment);
    };

    const config = selectedReport ? getColumnConfig(selectedReport.id, activeTab) : getColumnConfig(null, activeTab);

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
            if (status === 'ENTRY' || status === 'ENTERED' || status === 'ON TIME' || status === 'PRESENT') {
                if (row.is_late) buckets.LATE += 1;
                else buckets.ENTERED += 1;
            } else if (status === 'ABSENT') {
                buckets.ABSENT += 1;
            } else if (status === 'BREAK_OUT') {
                buckets.BREAK_OUT += 1;
            } else if (status === 'BREAK_IN') {
                buckets.BREAK_IN += 1;
            } else if (status === 'EXIT' || status === 'EXITED') {
                buckets.EXITED += 1;
            }
        });

        if (buckets.ABSENT === 0 && sessionCountReference?.report_window) {
            const { attended, conducted, expected } = sessionCountReference.report_window;
            if (activeTab === 'PERSONAL') {
                // Personal: show sessions the faculty missed out of ALL expected scheduled sessions
                buckets.ABSENT = Math.max((expected || conducted || 0) - (attended || 0), 0);
            } else {
                buckets.ABSENT = Math.max((conducted || 0) - (attended || 0), 0);
            }
        }

        return buckets;
    }, [reportData, sessionCountReference]);

    const dailyTrend = useMemo(() => {
        const isClassReport = activeTab === 'CLASS';
        const byKey = {};
        visualReportData.forEach((row) => {
            // For personal reports: group by date. For class reports: group by subject+section label.
            let groupKey;
            let groupLabel;
            if (isClassReport) {
                // Class reports: group by display_date or extract date from timestamp
                const dateStr = row.display_date || (row.timestamp ? row.timestamp.split('T')[0] : null);
                if (!dateStr) return;
                groupKey = dateStr;
                // Format as readable date for display
                const [y, m, d] = dateStr.split('-').map(Number);
                groupLabel = (y && m && d)
                    ? new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' })
                    : dateStr;
            } else {
                // Personal reports: group by subject code + section
                const subjectCode = row.subject_code || '';
                const section = row.section || '';
                const dateStr = row.display_date || row.col1 || (row.timestamp ? row.timestamp.split('T')[0] : null);
                if (!dateStr) return;
                groupKey = subjectCode && section ? `${subjectCode}|${section}|${dateStr}` : dateStr;
                groupLabel = subjectCode && section ? `${subjectCode} — ${section}` : dateStr;
            }

            if (!byKey[groupKey]) {
                byKey[groupKey] = {
                    day: groupKey,
                    label: groupLabel,
                    entered: 0,
                    late: 0,
                    absent: 0,
                    breakOut: 0,
                    breakIn: 0,
                    exited: 0,
                    total: 0,
                };
            }

            const status = String(row.status || '').toUpperCase();
            if (status === 'ENTRY' || status === 'ENTERED' || status === 'ON TIME' || status === 'PRESENT') {
                if (row.is_late) byKey[groupKey].late += 1;
                else byKey[groupKey].entered += 1;
            } else if (status === 'ABSENT') {
                byKey[groupKey].absent += 1;
            } else if (status === 'BREAK_OUT') {
                byKey[groupKey].breakOut += 1;
            } else if (status === 'BREAK_IN') {
                byKey[groupKey].breakIn += 1;
            } else if (status === 'EXIT' || status === 'EXITED') {
                byKey[groupKey].exited += 1;
            }
            byKey[groupKey].total += 1;
        });

        return Object.values(byKey).sort((a, b) => a.day.localeCompare(b.day));
    }, [visualReportData, activeTab]);

    // â”€â”€ Render helpers â”€â”€
    const renderSessionCountReference = () => {
        if (!sessionCountReference) return null;
        const reportWindow = sessionCountReference.report_window || {};
        const wholeSemester = sessionCountReference.whole_semester || {};
        const isClassTab = activeTab === 'CLASS';

        if (isClassTab) {
            // Student-centric view for class reports
            const totalEnrolled = reportWindow.total_enrolled ?? 0;
            const studentsAttended = reportWindow.students_attended ?? 0;
            const studentsAbsent = reportWindow.students_absent ?? (totalEnrolled - studentsAttended);
            const conductedSessions = reportWindow.conducted_sessions ?? reportWindow.conducted ?? 0;
            const expectedSessions = reportWindow.expected_sessions ?? reportWindow.expected ?? 0;
            return (
                <div className="insight-panel" style={{ marginTop: '16px' }}>
                    <div className="insight-section-title" style={{ marginBottom: '12px' }}>Class Attendance Reference</div>
                    <div className="session-reference-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        <div className="session-reference-card" style={{ padding: '14px', background: '#f8fafe', borderRadius: '10px', border: '1px solid #e5ebf7' }}>
                            <div className="session-reference-title" style={{ fontWeight: 700, color: '#163269', marginBottom: '8px', fontSize: '0.88em' }}>Enrollment</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.83em' }}>
                                <div>Total Students: <strong>{totalEnrolled}</strong></div>
                                <div>Attended (unique): <strong>{studentsAttended}</strong></div>
                                <div>Absent (unique): <strong>{studentsAbsent}</strong></div>
                            </div>
                        </div>
                        <div className="session-reference-card" style={{ padding: '14px', background: '#f8fafe', borderRadius: '10px', border: '1px solid #e5ebf7' }}>
                            <div className="session-reference-title" style={{ fontWeight: 700, color: '#163269', marginBottom: '8px', fontSize: '0.88em' }}>Sessions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.83em' }}>
                                <div>Conducted: <strong>{conductedSessions}</strong></div>
                                <div>Expected: <strong>{expectedSessions}</strong></div>
                                <div>Attendance Rate: <strong>{reportWindow.attendance_rate ?? 0}%</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

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

                                                return (
                                                    <div
                                                        key={`${item.day}-${actionKey}`}
                                                        className="grouped-cluster-bar"
                                                        style={{
                                                            height: `${(value / maxTrend) * 100}%`,
                                                            backgroundColor: statusStyle[styleKey] || '#ccc',
                                                        }}
                                                        title={`${item.day} â€¢ ${actionKey.replace(/([A-Z])/g, ' $1')}: ${value}`}
                                                    >
                                                        <span className="grouped-cluster-value">{value}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="grouped-cluster-label">
                                            {item.label || (() => {
                                                const [y, m, d] = (item.day || '').split('-').map(Number);
                                                if (y && m && d) {
                                                    return new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' });
                                                }
                                                return item.day || '—';
                                            })()}
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

        // Gate: hide performance metrics when data sample is too small OR for daily reports
        const mode = getReportMode(selectedReport?.id);
        const minSampleSize = 2;
        const dataSize = reportData.length;
        // Daily reports never show performance metrics (too little data for meaningful analysis)
        const showMetrics = mode !== 'DAILY' && dataSize >= minSampleSize;

        if (!showMetrics && !insights.length) return null;
        // For daily mode, also suppress AI insights (badge already hidden by getInsightsConfig)
        const insightsConfig = getInsightsConfig(selectedReport?.id);
        const showAIInsights = mode !== 'DAILY' && insightsConfig.show && insights.length > 0;

        return (
            <div className="insight-panel">
                <div className="insight-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="insight-section-title" style={{ marginBottom: 0 }}>Performance Metrics</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {insightsConfig.badge && (
                            <span style={{ fontSize: '0.75em', background: '#FFF8E1', color: '#F57F17', padding: '4px 10px', borderRadius: '12px', border: '1px solid #FFCA28', fontWeight: 600 }}>
                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '4px' }} />
                                {insightsConfig.badge}
                            </span>
                        )}
                        {!insightsConfig.show && insights.length > 0 && (
                            <span style={{ fontSize: '0.75em', background: '#f5f5f5', color: '#888', padding: '4px 10px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                                AI Insights unavailable for daily reports
                            </span>
                        )}
                        {showAIInsights && (
                            <button
                                type="button"
                                className="insight-action-btn"
                                onClick={() => setShowInsightsModal(true)}
                            >
                                <i className="fas fa-lightbulb" style={{ marginRight: '6px' }}></i> View AI Insights
                            </button>
                        )}
                    </div>
                </div>

                {showMetrics && summaryMetrics.length > 0 && (
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
                {!showMetrics && summaryMetrics.length > 0 && (
                    <div style={{ fontSize: '0.82em', color: '#888', padding: '8px 0', fontStyle: 'italic' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                        Performance metrics are hidden due to insufficient data ({dataSize} record{dataSize !== 1 ? 's' : ''}). More attendance entries are needed for meaningful analysis.
                    </div>
                )}
            </div>
        );
    };

    // -- Behavioral Consistency Profile (for CONSISTENCY report) --
    const renderConsistencyGuide = () => {
        if (selectedReport?.id !== 'CONSISTENCY') return null;

        const windowStats = sessionCountReference?.report_window || {};
        const attended = Number(windowStats.attended || 0);
        const conducted = Number(windowStats.conducted || 0);
        const expected = Number(windowStats.expected || 0);
        const onTime = Number(statusDistribution.ENTERED || 0);
        const late = Number(statusDistribution.LATE || 0);
        const punctuality = (onTime + late) > 0 ? ((onTime / (onTime + late)) * 100) : 0;
        const attendanceRate = conducted > 0 ? ((attended / conducted) * 100) : 0;
        const progressRate = expected > 0 ? ((attended / expected) * 100) : 0;

        const profileType = attendanceRate >= 85 && punctuality >= 85
            ? 'Exemplary'
            : attendanceRate >= 75 && punctuality >= 75
                ? 'Reliable'
                : attendanceRate >= 75 && punctuality < 75
                    ? 'Dedicated but Tardy'
                    : attendanceRate < 75 && punctuality >= 75
                        ? 'Selective but Punctual'
                        : 'Needs Intervention';

        const profileNote = profileType === 'Exemplary'
            ? 'Strong stability in both attendance and punctuality.'
            : profileType === 'Reliable'
                ? 'Good attendance behavior with manageable risk.'
                : profileType === 'Dedicated but Tardy'
                    ? 'Shows up consistently but time-discipline needs improvement.'
                    : profileType === 'Selective but Punctual'
                        ? 'Usually on time when present, but misses too many sessions.'
                        : 'Attendance and punctuality both need immediate support.';

        return (
            <div className="insight-panel">
                <div className="insight-section-title">Behavioral Consistency Profile</div>
                <div className="session-reference-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <div className="session-reference-card" style={{ padding: '12px', background: '#f8fafe', borderRadius: '10px', border: '1px solid #e5ebf7' }}>
                        <div style={{ fontSize: '0.82em', color: '#163269', fontWeight: 700 }}>Behavior Type</div>
                        <div style={{ fontSize: '1.08em', fontWeight: 700, color: '#102a5c', marginTop: '6px' }}>{profileType}</div>
                        <div style={{ fontSize: '0.82em', color: '#516487', marginTop: '6px' }}>{profileNote}</div>
                    </div>
                    <div className="session-reference-card" style={{ padding: '12px', background: '#f8fafe', borderRadius: '10px', border: '1px solid #e5ebf7' }}>
                        <div style={{ fontSize: '0.82em', color: '#163269', fontWeight: 700 }}>Reliability Snapshot</div>
                        <div style={{ fontSize: '0.83em', marginTop: '6px' }}>Attendance Reliability: <strong>{attendanceRate.toFixed(1)}%</strong></div>
                        <div style={{ fontSize: '0.83em', marginTop: '4px' }}>Punctuality Discipline: <strong>{punctuality.toFixed(1)}%</strong></div>
                        <div style={{ fontSize: '0.83em', marginTop: '4px' }}>Semester Progress Coverage: <strong>{progressRate.toFixed(1)}%</strong></div>
                    </div>
                    <div className="session-reference-card" style={{ padding: '12px', background: '#f8fafe', borderRadius: '10px', border: '1px solid #e5ebf7' }}>
                        <div style={{ fontSize: '0.82em', color: '#163269', fontWeight: 700 }}>Risk Diagnostics</div>
                        <div style={{ fontSize: '0.83em', marginTop: '6px' }}>Late Entries: <strong>{late}</strong></div>
                        <div style={{ fontSize: '0.83em', marginTop: '4px' }}>Absences: <strong>{statusDistribution.ABSENT || 0}</strong></div>
                        <div style={{ fontSize: '0.83em', marginTop: '4px' }}>Break-Out Events: <strong>{statusDistribution.BREAK_OUT || 0}</strong></div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFilters = () => {
        const mode = getReportMode(selectedReport?.id);
        const showClassFilter = activeTab === 'CLASS' || (activeTab === 'PERSONAL' && selectedReport?.id !== 'WEEKLY_SUMMARY');

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div className="report-selector-group">
                    <label>Select Report Type:</label>
                    <select
                        value={selectedReport?.id || ''}
                        onChange={e => handleSelectReport(activeReportOptions.find(opt => opt.id === e.target.value))}
                        className="app-select big-select"
                    >
                        {activeReportOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {showClassFilter && (
                    <div className="filter-item" style={{ minWidth: '220px' }}>
                        <label>{activeTab === 'CLASS' ? 'Class / Section:' : 'Subject / Class:'}</label>
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="app-select big-select"
                        >
                            {activeTab === 'PERSONAL' && <option value="">All Taught Subjects</option>}
                            {(() => {
                                const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
                                const sorted = [...classes].sort((a, b) => {
                                    const dayA = dayOrder[a.day_of_week] || 99;
                                    const dayB = dayOrder[b.day_of_week] || 99;
                                    if (dayA !== dayB) return dayA - dayB;
                                    const labelA = `${a.subject_code} - ${a.section || ''}`;
                                    const labelB = `${b.subject_code} - ${b.section || ''}`;
                                    return labelA.localeCompare(labelB);
                                });
                                return sorted.map((c, index) => {
                                    const classId = c?.class_id ?? c?.id;
                                    const key = classId ? `class-${classId}` : `class-fallback-${index}`;
                                    const value = classId ? String(classId) : '';
                                    const dayLabel = c.day_of_week ? ` (${c.day_of_week})` : '';
                                    const timeLabel = c.start_time && c.end_time
                                        ? ` ${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}`
                                        : '';
                                    return (
                                        <option key={key} value={value}>
                                            {c.subject_code} - {c.section || 'N/A'}{dayLabel}{timeLabel}
                                        </option>
                                    );
                                });
                            })()}
                        </select>
                    </div>
                )}

                {mode === 'DAILY' && (
                    <div className="filter-item">
                        <label>Select Date:</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="app-select big-select"
                        />
                    </div>
                )}

                {mode === 'WEEKLY' && (
                    <>
                        <div className="filter-item">
                            <label>Select Month:</label>
                            <input
                                type="month"
                                value={weeklyMonth}
                                onChange={e => {
                                    setWeeklyMonth(e.target.value);
                                    setSelectedWeekNumber('1');
                                }}
                                className="app-select big-select"
                            />
                        </div>
                        <div className="filter-item">
                            <label>Select Week:</label>
                            <select
                                value={selectedWeekNumber}
                                onChange={e => setSelectedWeekNumber(e.target.value)}
                                className="app-select big-select"
                            >
                                {getWeekRangesForMonth().map(w => (
                                    <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {mode === 'MONTHLY' && (
                    <div className="filter-item">
                        <label>Select Month:</label>
                        <input
                            type="month"
                            value={weeklyMonth}
                            onChange={e => setWeeklyMonth(e.target.value)}
                            className="app-select big-select"
                        />
                    </div>
                )}

                {mode === 'SEMESTRAL' && (
                    <>
                        <div className="filter-item">
                            <label>Academic Year:</label>
                            <select
                                value={academicYear}
                                onChange={e => setAcademicYear(e.target.value)}
                                className="app-select big-select"
                            >
                                {(() => {
                                    const baseYear = parseInt(academicYear, 10) || new Date().getFullYear();
                                    const years = [baseYear - 1, baseYear, baseYear + 1];
                                    return years.map((y) => (
                                        <option key={y} value={y}>{y} - {y + 1}</option>
                                    ));
                                })()}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Semester:</label>
                            <select
                                value={selectedSemester}
                                onChange={e => setSelectedSemester(e.target.value)}
                                className="app-select big-select"
                            >
                                <option value="1ST">1st Semester</option>
                                <option value="2ND">2nd Semester</option>
                                <option value="SUMMER">Summer</option>
                            </select>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // â”€â”€ Main Render â”€â”€
    return (
        <div className="faculty-reports-page">
            {/* Header with Academic Year Badge */}
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                <div className="academic-year-badge">
                    <i className="fas fa-calendar-alt"></i> A.Y. {academicYearLabel || (academicYear ? `${academicYear}-${Number(academicYear) + 1}` : 'Not Set')}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="faculty-reports-tabs">
                <button
                    type="button"
                    className={`faculty-reports-tab ${activeTab === 'PERSONAL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PERSONAL')}
                >
                    <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
                    Personal Records
                </button>
                <button
                    type="button"
                    className={`faculty-reports-tab ${activeTab === 'CLASS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('CLASS')}
                >
                    <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                    Class Reports
                </button>
            </div>

            {/* Filters */}
            <div className="reports-header-section">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                    {renderFilters()}
                    {selectedReport && selectedReport.desc && (
                        <div className="report-description-inline" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            background: '#f0f6ff',
                            borderRadius: '8px',
                            border: '1px solid #d0e2ff',
                            fontSize: '0.83em',
                            color: '#334155',
                            maxWidth: '400px',
                            alignSelf: 'center',
                        }}>
                            <i className="fas fa-info-circle" style={{ color: '#3b82f6', flexShrink: 0 }}></i>
                            <span>{selectedReport.desc}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Content */}
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
                    {!loading && reportData.length > 0 && renderConsistencyGuide()}

                    {selectedReport?.id !== 'CONSISTENCY' && (
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
                                            <tr key={row.dedup_key || `row-${i}`}>
                                                {config.keys.map(key => {
                                                    // Resolve computed keys for personal records
                                                    let value;
                                                    if (key === '_date_time') {
                                                        const datePart = row.col1 || '';
                                                        const timePart = row.col3 || '';
                                                        value = timePart ? `${datePart} ${timePart}` : datePart;
                                                    } else if (key === '_subject') {
                                                        value = row.subject_code || '—';
                                                        if (row.subject_title) value = `${value} - ${row.subject_title}`;
                                                    } else {
                                                        value = row[key] || 'N/A';
                                                    }

                                                    let cellContent = value;

                                                    if (key === '_date_time' && typeof value === 'string' && value.includes(' ')) {
                                                        const parts = value.split(' ');
                                                        const datePart = parts[0];
                                                        const timePart = parts.slice(1).join(' ');
                                                        cellContent = (
                                                            <div>
                                                                <div style={{ fontWeight: '500' }}>{datePart}</div>
                                                                <div style={{ fontSize: '0.82em', color: '#64748b', marginTop: '2px' }}>{timePart}</div>
                                                            </div>
                                                        );
                                                    }

                                                    if (key === 'status') {
                                                        const isPresent = ['ENTERED', 'ENTRY', 'ON TIME', 'PRESENT', 'BREAK_IN'].includes(String(value).toUpperCase());
                                                        cellContent = (
                                                            <LogStatusTag
                                                                text={String(value).toUpperCase()}
                                                                isPresent={isPresent}
                                                                type={String(value).toUpperCase()}
                                                            />
                                                        );
                                                    } else if (key === 'col2' || key === '_subject') {
                                                        cellContent = <span style={{ fontWeight: '600', color: '#334155' }}>{value}</span>;
                                                    }

                                                    return <td key={key}>{cellContent}</td>;
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
                    )}
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
                                    {activeMetric.explanation && <p><strong>Explanation:</strong> {activeMetric.explanation}</p>}
                                    {activeMetric.confidence && <p><strong>Confidence:</strong> {activeMetric.confidence}</p>}
                                    {activeMetric.numerator != null && <p><strong>Numerator:</strong> {activeMetric.numerator}</p>}
                                    {activeMetric.denominator != null && <p><strong>Denominator:</strong> {activeMetric.denominator}</p>}
                                    {activeMetric.data_window && <p><strong>Data Window:</strong> {activeMetric.data_window}</p>}
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
                                    {insight.confidence && (
                                        <span
                                            style={{
                                                fontSize: '0.8rem',
                                                color: insight.confidence === 'HIGH' ? '#2e7d32' : '#e65100',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Confidence: {insight.confidence}
                                        </span>
                                    )}
                                </div>
                            ))}
                            {insights.length === 0 && (
                                <p style={{ color: '#888', textAlign: 'center' }}>No medium or high confidence insights available for this window.</p>
                            )}
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
