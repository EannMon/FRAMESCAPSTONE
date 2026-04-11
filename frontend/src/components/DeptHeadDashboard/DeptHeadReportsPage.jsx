import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import '../FacultyDashboard/FacultyReportsPage.css';
import './DeptHeadReportsPage.css'; // Will create this or ensure it exists
import FacultyReportModal from '../FacultyDashboard/FacultyReportModal';
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
// DEPARTMENT HEAD REPORT OPTIONS
// Includes dept-wide, class-specific, and personal
// ============================================
const reportOptions = [
    // --- Personal Records (own attendance as dept head) ---
    { id: 'DAILY_REPORT', label: 'Daily Attendance', desc: 'Tracks attendance behavior for selected date and subjects, including absences for conducted sessions.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'WEEKLY_SUMMARY', label: 'Weekly Attendance Summary', desc: 'Summarizes attendance behavior across the selected weekly window.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'MONTHLY_TRENDS', label: 'Monthly Attendance Trends', desc: 'Shows monthly attendance and punctuality trend movement.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'SEM_REPORT', label: 'Semestral Report', desc: 'Provides cumulative data and can be filtered per taught subject or all taught subjects.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'LATE_REPORT', label: 'Personal Late Arrival Report', desc: 'Semestral view of your late arrivals across all taught subjects or a selected class.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'BREAK_LOG', label: 'Break Duration Log', desc: 'Semestral view of your break-out and break-in behavior across taught classes.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'ABSENT_LOG', label: 'Absent Logs', desc: 'Shows conducted sessions where you were marked absent in the selected period.', type: 'PERSONAL', category: 'Personal Records' },
    { id: 'CONSISTENCY', label: 'Personal Consistency Index', desc: 'Explains your stability score, trend direction, and confidence for this report window.', type: 'PERSONAL', category: 'Personal Records' },

    // --- Class-Specific Reports ---
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

    // --- Faculty Reports ---
    { id: 'FACULTY_SUMMARY', label: 'Faculty Performance Summary', desc: 'Overview of all faculty attendance punctuality.', type: 'DEPT', category: 'Faculty Reports' },
    { id: 'FACULTY_LATE', label: 'Faculty Late Arrivals Report', desc: 'Reports on faculty who arrive late to classes.', type: 'DEPT', category: 'Faculty Reports' },
    { id: 'FACULTY_CONSISTENCY', label: 'Faculty Consistency Index', desc: 'AI-computed metric of attendance regularity per faculty.', type: 'DEPT', category: 'Faculty Reports' },
    { id: 'FACULTY_ATTENDANCE_RATE', label: 'Faculty Attendance Rate', desc: 'Attendance rate per faculty comparing scheduled sessions vs actual entries.', type: 'DEPT', category: 'Faculty Reports' },
    { id: 'FACULTY_ABSENCE', label: 'Faculty Absence Report', desc: 'Faculty who missed scheduled classes with no attendance record.', type: 'DEPT', category: 'Faculty Reports' },
    { id: 'FACULTY_PUNCTUALITY', label: 'Faculty Punctuality Index', desc: 'Ranks faculty by average arrival time offset from class start.', type: 'DEPT', category: 'Faculty Reports' },
    { id: 'FACULTY_TEACHING_LOAD', label: 'Faculty Teaching Load Overview', desc: 'Classes, sections, students, and attendance summary per faculty.', type: 'DEPT', category: 'Faculty Reports' },

    // --- Department Reports ---
    { id: 'ROOM_OCCUPANCY', label: 'Room Occupancy Report', desc: 'Usage metrics per room based on attendance data.', type: 'DEPT', category: 'Department Reports' },
    { id: 'PEAK_USAGE', label: 'Peak Hour / Room Usage', desc: 'Identifies peak attendance times per room.', type: 'DEPT', category: 'Department Reports' },
    { id: 'ROOM_UTILIZATION', label: 'Room Utilization Rate', desc: 'How efficiently rooms are scheduled vs. used.', type: 'DEPT', category: 'Department Reports' },
    { id: 'OVERCROWDING', label: 'Overcrowding Alerts', desc: 'Rooms exceeding capacity thresholds.', type: 'DEPT', category: 'Department Reports' },
    { id: 'DEPT_ACTIVITY', label: 'Department-Wide Activity', desc: 'Cross-course attendance and engagement overview.', type: 'DEPT', category: 'Department Reports' },
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
        const isPunctuality = reportId === 'CLASS_PUNCTUALITY_INDEX';
        return {
            headers: isPunctuality 
                ? ['ID', 'Name', 'TUPM-ID', 'Status', 'Time', 'Summary']
                : ['ID', 'Name', 'TUPM-ID', 'Status', 'Time', 'Summary'],
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
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Generate Official Report</h3>
                    <button className="metric-modal-close" onClick={onClose} style={{ fontSize: '1.5rem' }}>&times;</button>
                </div>
                <div className="metric-modal-body" style={{ padding: '0 0 20px 0' }}>
                    <p style={{ fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
                        Select your preferred output format to process the report records.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button 
                            style={{ flex: 1, padding: '12px 6px', borderRadius: '8px', border: format === 'PREVIEW' ? '2px solid #163269' : '1px solid #e2e8f0', background: format === 'PREVIEW' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                            onClick={() => setFormat('PREVIEW')}
                        >
                            <i className="fas fa-eye" style={{ fontSize: '1.25rem', color: '#163269' }}></i>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Preview</span>
                        </button>
                        <button 
                            style={{ flex: 1, padding: '12px 6px', borderRadius: '8px', border: format === 'PDF' ? '2px solid #163269' : '1px solid #e2e8f0', background: format === 'PDF' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                            onClick={() => setFormat('PDF')}
                        >
                            <i className="fas fa-file-pdf" style={{ fontSize: '1.25rem', color: '#ef4444' }}></i>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>PDF</span>
                        </button>
                        <button 
                            style={{ flex: 1, padding: '12px 6px', borderRadius: '8px', border: format === 'CSV' ? '2px solid #163269' : '1px solid #e2e8f0', background: format === 'CSV' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                            onClick={() => setFormat('CSV')}
                        >
                            <i className="fas fa-file-csv" style={{ fontSize: '1.25rem', color: '#10b981' }}></i>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>CSV</span>
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
    const [academicYearLabel, setAcademicYearLabel] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('1ST');
    const [departmentSemesterWindow, setDepartmentSemesterWindow] = useState({ dateFrom: '', dateTo: '' });
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [weeklyMonth, setWeeklyMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedWeekNumber, setSelectedWeekNumber] = useState(String(Math.floor((new Date().getDate() - 1) / 7) + 1));

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

    const normalizeSemesterCode = (semesterValue) => {
        const normalized = String(semesterValue || '').trim().toUpperCase();
        if (normalized.includes('1ST') || normalized.includes('FIRST')) return '1ST';
        if (normalized.includes('2ND') || normalized.includes('SECOND')) return '2ND';
        if (normalized.includes('SUMMER')) return 'SUMMER';
        return '1ST';
    };

    const resolveFacultyReportType = (reportId, reportCategory) => {
        if (reportCategory !== 'PERSONAL') return reportId;
        return PERSONAL_REPORT_TO_FACULTY_REPORT[reportId] || reportId;
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
                        // silently ignore
                    }
                });
        }
        return () => controller.abort();
    }, [user]);

    // Auto-fetch when any relevant filter changes
    useEffect(() => {
        if (selectedReport) {
            fetchReportData(selectedReport.id);
        }
    }, [selectedReport, room, selectedClass, filterDate, weeklyMonth, selectedWeekNumber, academicYear, selectedSemester]); // eslint-disable-line react-hooks/exhaustive-deps

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
            const report = reportOptions.find((option) => option.id === reportId);
            if (!report) {
                setLoading(false);
                return;
            }

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

            // Sync the internal dateFrom/dateTo state
            setDateFrom(localFrom);
            setDateTo(localTo);

            if (report.type === 'CLASS' || report.type === 'PERSONAL') {
                // Use the faculty reports endpoint for class-specific & personal reports
                if (!user?.id) {
                    setLoading(false);
                    return;
                }
                
                // For CLASS reports, we must have a class_id
                let targetId = null;
                if (report.type === 'CLASS' || report.type === 'PERSONAL') {
                    // Normalize the selected value or default to first class
                    const rawValue = selectedClass || null;
                    if (!rawValue && report.type === 'CLASS') {
                        setReportData([]);
                        setLoading(false);
                        return;
                    }

                    if (!rawValue) {
                        targetId = null;
                    } else {
                        const stringVal = String(rawValue);
                        // Match against the classes list to get the numeric primary key
                        const found = classes.find(c => 
                            String(c.class_id) === stringVal || 
                            String(c.id) === stringVal ||
                            c.subject_code === stringVal ||
                            `${c.subject_code} - ${c.section}` === stringVal ||
                            stringVal.startsWith(c.subject_code)
                        );
                        
                        targetId = found ? (found.class_id || found.id) : (parseInt(stringVal.split(' ')[0], 10) || null);
                    }

                    if (!targetId && report.type === 'CLASS') {
                        console.error('Could not resolve class_id for:', selectedClass);
                        setReportData([]);
                        setLoading(false);
                        return;
                    }
                }

                const params = {
                    report_type: resolveFacultyReportType(reportId, report.type),
                    legacy: false,
                };
                if (targetId) params.class_id = targetId;
                params.date_from = localFrom;
                params.date_to = localTo;
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
                params.date_from = localFrom;
                params.date_to = localTo;
                if (room) params.room = room;
                if (user?.department_id) params.dept_id = user.department_id;
                params.limit = 200;

                const res = await api.get('/api/dept/reports/data', { params });
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
        if (report?.type === 'CLASS' && !selectedClass && classes.length > 0 && classes[0].class_id != null) {
            setSelectedClass(String(classes[0].class_id));
        }
        // fetchReportData(report.id); // Removed: useEffect will handle this now
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
                                                // Quick fix for key mapping
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

    const handleGenerateReport = (format) => {
        if (format === 'PDF') handleDownloadPDF();
        else if (format === 'CSV') handleDownloadCSV();
        else if (format === 'PREVIEW') handlePreviewPDF();
        else {
            handlePreviewPDF(); // fallback to preview
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
            context: {
                name: user ? `${user.first_name} ${user.last_name}` : 'Dept Head',
                id: user?.tupm_id || '',
                scope: selectedReport.type === 'PERSONAL' ? 'Personal' : selectedReport.type === 'CLASS' ? (selectedClass ? `Class ${selectedClass}` : 'All Classes') : 'Department Wide'
            }
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
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => {
                let val = row[key] || '';
                // Clean em-dash and N/A placeholders for CSV
                if (val === '—' || val === 'N/A') val = '';
                if (typeof val === 'string') val = val.replace(/—/g, '-');
                obj[config.headers[i]] = val;
            });
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
            context: {
                name: user ? `${user.first_name} ${user.last_name}` : 'Dept Head',
                id: user?.tupm_id || '',
                scope: selectedReport.type === 'PERSONAL' ? 'Personal' : selectedReport.type === 'CLASS' ? (selectedClass ? `Class ${selectedClass}` : 'All Classes') : 'Department Wide'
            }
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

        const url = await generateFramesPDF(reportInfo, tableData, 'view', enrichment);
        setPreviewUrl(url);
        setModalOpen(true);
    };

    return (
        <div className="faculty-reports-page">
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '15px' }}>
                <div className="academic-year-badge">
                    <i className="fas fa-calendar-alt"></i> A.Y. {academicYearLabel || (academicYear ? `${academicYear}-${Number(academicYear) + 1}` : 'Not Set')}
                </div>
            </div>

            {/* MATCHING STUDENT FILTERS HEADER SECTION */}
            <div className="reports-header-section">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <div className="report-selector-group" style={{ marginBottom: 0 }}>
                        <label>Select Report Type:</label>
                        <select
                            value={selectedReport?.id || ''}
                            onChange={e => {
                                const opt = reportOptions.find(o => o.id === e.target.value);
                                if (opt) handleSelectReport(opt);
                            }}
                            className="app-select big-select"
                        >
                            <option value="" disabled>-- Select a Report --</option>
                            {Object.entries(groupedReports).map(([category, options]) => (
                                <optgroup key={category} label={category}>
                                    {options.map((opt, optIdx) => (
                                        <option key={`${category}-${opt.id}-${optIdx}`} value={opt.id}>{opt.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Show Class selector for class-specific reports */}
                    {(selectedReport?.type === 'CLASS' || selectedReport?.type === 'PERSONAL') && (
                        <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Filter Subject:</label>
                            <select 
                            value={selectedClass} 
                            onChange={e => {
                                setSelectedClass(e.target.value);
                            }} 
                            className="app-select big-select" 
                            style={{ minWidth: '220px', padding: '10px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }}
                        >
                            <option value="">All Taught Subjects</option>
                            {classes.map((c, idx) => {
                                const idToUse = c.class_id || c.id || "";
                                return (
                                    <option key={`class-id-${idToUse}-${idx}`} value={idToUse}>
                                        {c.subject_code || 'No Code'} - {c.section || 'N/A'}
                                    </option>
                                );
                            })}
                        </select>
                        </div>
                    )}

                    {/* Show Room selector for room-specific reports */}
                    {['ROOM_OCCUPANCY', 'PEAK_USAGE', 'ROOM_UTILIZATION', 'OVERCROWDING', 'DEPT_ACTIVITY'].includes(selectedReport?.id) && (
                        <div className="report-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Room:</label>
                            <select value={room} onChange={e => setRoom(e.target.value)} className="app-select big-select" style={{ minWidth: '180px', padding: '10px', fontSize: '1rem', height: '42px', boxSizing: 'border-box' }}>
                                <option value="">All Rooms</option>
                                <option value="Online">Online</option>
                                {rooms
                                    .filter(r => r.room_name && /^\d+$/.test(r.room_name.replace(/room\s+/gi, '').trim()))
                                    .map((r, i) => {
                                        const cleanRoom = r.room_name.replace(/room\s+/gi, '').trim();
                                        return <option key={`room-${cleanRoom}-${i}`} value={r.room_name}>{cleanRoom}</option>;
                                    })}
                            </select>
                        </div>
                    )}

                    {getReportMode(selectedReport?.id) === 'DAILY' && (
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

                    {getReportMode(selectedReport?.id) === 'WEEKLY' && (
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

                    {getReportMode(selectedReport?.id) === 'MONTHLY' && (
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

                    {getReportMode(selectedReport?.id) === 'SEMESTRAL' && (
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
                                        <option key={y} value={y}>{y} - {y+1}</option>
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

                {/* Description Box */}
                {selectedReport && selectedReport.desc && (
                    <div className="report-description-box" style={{ marginTop: '0px' }}>
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
                                                    const value = row[key] || '—';
                                                    let cellContent = value;
                                                    
                                                    // Subline formatting for Date columns if text contains spaced timestamp
                                                    if ((key === 'col1' || key === 'Detail') && typeof value === 'string' && value.indexOf('/') > -1) {
                                                        const parts = value.split(' ');
                                                        if (parts.length > 1) { 
                                                            cellContent = (
                                                                <div>
                                                                    <div style={{ fontWeight: '500' }}>{parts[0]}</div>
                                                                    <div style={{ fontSize: '0.85em', color: '#888' }}>{parts[1]}</div>
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
                                                            cellContent = <span style={{ fontWeight: '600', color: '#333' }}>{value}</span>;
                                                        }
                                                    }
                                                    
                                                    return (
                                                         <td key={key}>
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
                        {reportData.length === 0 && !loading && (
                            <div className="report-footer" style={{ marginTop: '10px', textAlign: 'center', color: '#64748b' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                                No report data found for the selected {selectedReport?.type === 'CLASS' ? 'class' : 'filters'} and date range.
                            </div>
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
                    scope={selectedReport?.type === 'CLASS' ? 'Class Specific' : selectedReport?.type === 'PERSONAL' ? 'Personal' : 'Department Wide'}
                    dateRange={`${dateFrom} to ${dateTo}`}
                />
            )}
        </div>
    );
};

export default DeptHeadReportsPage;
