import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';

import './AttendanceHistoryPage.css';
import StudentReportModal from './StudentReportModal';

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

const AttendanceHistoryPage = () => {
    const now = new Date();
    const currentMonthValue = now.toISOString().slice(0, 7);

    const getCurrentAcademicContext = () => {
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        if (month >= 8 && month <= 12) return { academicYearStart: year, semesterCode: '1ST' };
        if (month >= 1 && month <= 5) return { academicYearStart: year - 1, semesterCode: '2ND' };
        return { academicYearStart: year - 1, semesterCode: 'SUMMER' };
    };

    const getWeekNumberInMonth = (dateObj) => String(Math.floor((dateObj.getDate() - 1) / 7) + 1);
    const { academicYearStart, semesterCode } = getCurrentAcademicContext();

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
    const [filterDate, setFilterDate] = useState(now.toISOString().split('T')[0]); // Default Today
    const [selectedSemester, setSelectedSemester] = useState(semesterCode); // 1ST, 2ND, SUMMER
    const [academicYear, setAcademicYear] = useState(academicYearStart);
    const [weeklyMonth, setWeeklyMonth] = useState(currentMonthValue);
    const [selectedWeekNumber, setSelectedWeekNumber] = useState(getWeekNumberInMonth(now));
    const [selectedVisualStatus, setSelectedVisualStatus] = useState('ALL');
    const [activeMetricName, setActiveMetricName] = useState(null);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [deptSemesterWindow, setDeptSemesterWindow] = useState(null);
    const [deptActiveSemesterCode, setDeptActiveSemesterCode] = useState(null);
    const [deptActiveAcademicYearStart, setDeptActiveAcademicYearStart] = useState(null);

    // ... (reportTypes array remains same) ...
    const reportTypes = [
        { id: 'DAILY_REPORT', label: 'Daily Attendance', desc: 'Tracks attendance behavior for selected date and subjects, including absences for conducted sessions.' },
        { id: 'WEEKLY_SUMMARY', label: 'Weekly Attendance Summary', desc: 'Summarizes present/absent/late counts; promotes accountability.' },
        { id: 'MONTHLY_TRENDS', label: 'Monthly Attendance Trends', desc: 'Groups attendance by month to identify patterns and trends over time.' },
        { id: 'SEM_REPORT', label: 'Semestral Report', desc: 'Provides cumulative data and can be filtered per subject or all enrolled subjects.' },
        { id: 'LATE_REPORT', label: 'Personal Late Arrival Report', desc: 'Semestral view of your late arrivals across all subjects or a selected subject.' },
        { id: 'BREAK_LOG', label: 'Break Duration Log', desc: 'Semestral view of your break-out and break-in behavior across subjects.' },
        { id: 'ABSENT_LOG', label: 'Absent Logs', desc: 'Shows conducted sessions where you were marked absent in the selected period.' },
        { id: 'CONSISTENCY', label: 'Personal Consistency Index', desc: 'Explains your stability score, trend direction, and confidence for this report window.' }
    ];

    const getSemesterWindow = () => {
        const year = parseInt(academicYear, 10);
        if (
            deptSemesterWindow?.start &&
            deptSemesterWindow?.end &&
            deptActiveSemesterCode === selectedSemester &&
            Number(deptActiveAcademicYearStart) === Number(academicYear)
        ) {
            return {
                dateFrom: deptSemesterWindow.start,
                dateTo: deptSemesterWindow.end,
            };
        }
        if (selectedSemester === '1ST') {
            return { dateFrom: `${year}-08-01`, dateTo: `${year}-12-31` };
        }
        if (selectedSemester === '2ND') {
            return { dateFrom: `${year + 1}-01-01`, dateTo: `${year + 1}-06-30` };
        }
        return { dateFrom: `${year + 1}-06-01`, dateTo: `${year + 1}-07-31` };
    };

    const parseSemesterCode = (rawSemester) => {
        const value = String(rawSemester || '').toUpperCase();
        if (value.includes('1ST')) return '1ST';
        if (value.includes('2ND')) return '2ND';
        if (value.includes('SUMMER')) return 'SUMMER';
        return null;
    };

    const parseAcademicYearStart = (rawAcademicYear) => {
        const value = String(rawAcademicYear || '');
        const match = value.match(/(\d{4})\s*-\s*(\d{4})/);
        if (match) return Number(match[1]);
        const yearMatch = value.match(/\d{4}/);
        return yearMatch ? Number(yearMatch[0]) : null;
    };

    const getWeekRangesForMonth = () => {
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

    const formatDateLocal = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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

                const departmentId = storedUser.department_id;
                if (departmentId) {
                    try {
                        const acadRes = await api.get('/api/dept/academic-year', {
                            signal: controller.signal,
                            params: { dept_id: departmentId },
                        });
                        const acadData = acadRes.data || {};
                        const semesterCode = parseSemesterCode(acadData.semester);
                        const academicYearStart = parseAcademicYearStart(acadData.academic_year);

                        if (semesterCode) {
                            setDeptActiveSemesterCode(semesterCode);
                            setSelectedSemester(semesterCode);
                        }
                        if (academicYearStart) {
                            setDeptActiveAcademicYearStart(academicYearStart);
                            setAcademicYear(academicYearStart);
                        }
                        if (acadData.semester_start_date && acadData.semester_end_date) {
                            setDeptSemesterWindow({
                                start: acadData.semester_start_date,
                                end: acadData.semester_end_date,
                            });
                        }
                    } catch (error) {
                        if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                            console.warn('Failed to load department semester window, using fallback window rules.', error);
                        }
                    }
                }

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
                    if (item.subject_title && item.class_id) {
                        if (!subjectToClass[item.subject_title]) {
                            subjectToClass[item.subject_title] = [];
                        }
                        if (!subjectToClass[item.subject_title].includes(item.class_id)) {
                            subjectToClass[item.subject_title].push(item.class_id);
                        }
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

        const toIso = (d) => formatDateLocal(new Date(d));

        if (selectedReportType === 'DAILY_REPORT') {
            return { dateFrom: toIso(selectedDate), dateTo: toIso(selectedDate, true) };
        }

        if (selectedReportType === 'WEEKLY_SUMMARY') {
            const weekRanges = getWeekRangesForMonth();
            const selectedWeek = weekRanges.find((item) => item.value === selectedWeekNumber) || weekRanges[0];
            if (!selectedWeek) {
                return { dateFrom: toIso(selectedDate), dateTo: toIso(selectedDate, true) };
            }
            return { dateFrom: toIso(selectedWeek.start), dateTo: toIso(selectedWeek.end, true) };
        }

        if (selectedReportType === 'CONSISTENCY' || selectedReportType === 'LATE_REPORT' || selectedReportType === 'BREAK_LOG') {
            return getSemesterWindow();
        }

        if (selectedReportType === 'ABSENT_LOG') {
            return getSemesterWindow();
        }

        if (selectedReportType === 'MONTHLY_TRENDS') {
            const mtDate = new Date(filterDate);
            const start = new Date(mtDate.getFullYear(), mtDate.getMonth(), 1);
            const end = new Date(mtDate.getFullYear(), mtDate.getMonth() + 1, 0);
            return { dateFrom: toIso(start), dateTo: toIso(end, true) };
        }

        if (selectedReportType === 'SEM_REPORT') {
            return getSemesterWindow();
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

    const normalizeAttendanceAction = (log) => {
        const rawAction = String(log.action || '').toUpperCase();
        const rawStatus = String(log.status || '').toUpperCase();

        if (['ENTRY', 'BREAK_OUT', 'BREAK_IN', 'EXIT', 'ABSENT'].includes(rawAction)) return rawAction;
        if (['LATE', 'ENTERED', 'PRESENT', 'ON_TIME', 'ON TIME'].includes(rawStatus)) return 'ENTRY';
        if (rawStatus === 'EXITED') return 'EXIT';
        if (rawStatus === 'ABSENT') return 'ABSENT';
        if (rawStatus.includes('BREAK') && rawStatus.includes('OUT')) return 'BREAK_OUT';
        if (rawStatus.includes('BREAK') && rawStatus.includes('IN')) return 'BREAK_IN';

        return rawAction || rawStatus;
    };

    const getReportScopedLogs = (logs) => {
        let scoped = [...logs];

        if (selectedSubject !== 'ALL') {
            const selectedClassIds = subjectClassMap[selectedSubject] || [];
            scoped = scoped.filter((log) => (
                selectedClassIds.map(Number).includes(Number(log.class_id)) || log.mapped_subject === selectedSubject
            ));
        }

        if (selectedReportType === 'BREAK_LOG') {
            scoped = scoped.filter((log) => {
                const action = normalizeAttendanceAction(log);
                return action === 'BREAK_OUT' || action === 'BREAK_IN';
            });
        }

        if (selectedReportType === 'LATE_REPORT') {
            scoped = scoped.filter((log) => {
                const action = normalizeAttendanceAction(log);
                return action === 'ENTRY' && !!log.is_late;
            });
        }

        if (selectedReportType === 'ABSENT_LOG') {
            scoped = scoped.filter((log) => normalizeAttendanceAction(log) === 'ABSENT');
        }

        return scoped;
    };

    const getSubjectDisplayName = (subjectTitle) => {
        if (!subjectTitle || subjectTitle === 'Unscheduled') return subjectTitle || 'Unscheduled';
        const matched = schedule.find((item) => item.subject_title === subjectTitle);
        if (!matched || !matched.subject_code) return subjectTitle;
        return `${matched.subject_code} - ${subjectTitle}`;
    };

    const statusDistribution = useMemo(() => {
        const sourceLogs = getReportScopedLogs(rawLogs);

        const buckets = {
            ENTERED: 0,
            LATE: 0,
            ABSENT: 0,
            BREAK_OUT: 0,
            BREAK_IN: 0,
            EXITED: 0,
        };

        sourceLogs.forEach((log) => {
            const action = normalizeAttendanceAction(log);
            if (action === 'ENTRY') {
                if (log.is_late) buckets.LATE += 1;
                else buckets.ENTERED += 1;
            } else if (action === 'ABSENT') {
                buckets.ABSENT += 1;
            } else if (action === 'BREAK_OUT') {
                buckets.BREAK_OUT += 1;
            } else if (action === 'BREAK_IN') {
                buckets.BREAK_IN += 1;
            } else if (action === 'EXIT') {
                buckets.EXITED += 1;
            }
        });

        const shouldInjectAbsentFallback = !['BREAK_LOG', 'LATE_REPORT'].includes(selectedReportType);
        if (shouldInjectAbsentFallback && buckets.ABSENT === 0) {
            const windowStats = sessionCountReference?.report_window || {};
            const attended = Number(windowStats.attended || 0);
            const conducted = Number(windowStats.conducted || 0);
            buckets.ABSENT = Math.max(conducted - attended, 0);
        }

        return buckets;
    }, [rawLogs, selectedReportType, selectedSubject, subjectClassMap, sessionCountReference]);

    const groupedSubjectActivity = useMemo(() => {
        const summary = {};

        rawLogs.forEach((log) => {
            const subjectKey = log.mapped_subject || 'Unscheduled';
            if (!summary[subjectKey]) {
                summary[subjectKey] = {
                    ENTERED: 0,
                    LATE: 0,
                    ABSENT: 0,
                    BREAK_OUT: 0,
                    BREAK_IN: 0,
                    EXITED: 0,
                };
            }

            const action = (log.action || '').toUpperCase();
            if (action === 'ENTRY') {
                if (log.is_late) summary[subjectKey].LATE += 1;
                else summary[subjectKey].ENTERED += 1;
            } else if (action === 'ABSENT') {
                summary[subjectKey].ABSENT += 1;
            } else if (action === 'BREAK_OUT') {
                summary[subjectKey].BREAK_OUT += 1;
            } else if (action === 'BREAK_IN') {
                summary[subjectKey].BREAK_IN += 1;
            } else if (action === 'EXIT') {
                summary[subjectKey].EXITED += 1;
            }
        });

        return Object.entries(summary).map(([subject, counts]) => ({ subject, ...counts }));
    }, [rawLogs]);

    const dailyTrend = useMemo(() => {
        const sourceLogs = getReportScopedLogs(rawLogs);

        // All report trends are grouped by subject so repeated sessions accumulate by subject, not by date.
        const bySubject = {};
        const scopedSubjectTitles = selectedSubject === 'ALL'
            ? uniqueSubjects
            : [selectedSubject];

        scopedSubjectTitles.forEach((title) => {
            const label = getSubjectDisplayName(title);
            bySubject[label] = {
                day: label,
                entered: 0,
                late: 0,
                absent: 0,
                breakOut: 0,
                breakIn: 0,
                exited: 0,
                total: 0,
                isSubjectAxis: true,
            };
        });

        sourceLogs.forEach((log) => {
            const subjectLabel = log.mapped_subject
                ? getSubjectDisplayName(log.mapped_subject)
                : (log.subject_code
                    ? `${log.subject_code} - ${log.mapped_subject || 'Unscheduled'}`
                    : (log.mapped_subject || 'Unscheduled'));

            if (!bySubject[subjectLabel]) {
                bySubject[subjectLabel] = {
                    day: subjectLabel,
                    entered: 0,
                    late: 0,
                    absent: 0,
                    breakOut: 0,
                    breakIn: 0,
                    exited: 0,
                    total: 0,
                    isSubjectAxis: true,
                };
            }

            const action = normalizeAttendanceAction(log);
            if (action === 'ENTRY') {
                if (log.is_late) bySubject[subjectLabel].late += 1;
                else bySubject[subjectLabel].entered += 1;
            } else if (action === 'BREAK_OUT') {
                bySubject[subjectLabel].breakOut += 1;
            } else if (action === 'BREAK_IN') {
                bySubject[subjectLabel].breakIn += 1;
            } else if (action === 'EXIT') {
                bySubject[subjectLabel].exited += 1;
            } else if (action === 'ABSENT') {
                bySubject[subjectLabel].absent += 1;
            }
            bySubject[subjectLabel].total += 1;
        });

        return Object.values(bySubject).sort((a, b) => String(a.day).localeCompare(String(b.day)));
    }, [rawLogs, selectedReportType, selectedSubject, subjectClassMap, sessionCountReference, uniqueSubjects, schedule]);

    const comparativeInsight = useMemo(() => {
        const scoped = getReportScopedLogs(rawLogs);
        if (!scoped.length) return null;

        const perSubject = {};
        scoped.forEach((log) => {
            const key = log.mapped_subject
                ? getSubjectDisplayName(log.mapped_subject)
                : (log.subject_code
                    ? `${log.subject_code} - ${log.mapped_subject || 'Unscheduled'}`
                    : (log.mapped_subject || 'Unscheduled'));
            if (!perSubject[key]) {
                perSubject[key] = {
                    attended: 0,
                    late: 0,
                    absent: 0,
                    conductedSessionKeys: new Set(),
                    attendedSessionKeys: new Set(),
                };
            }

            const sessionDate = log.timestamp ? new Date(log.timestamp).toISOString().slice(0, 10) : log.display_date;
            const sessionKey = `${log.class_id || key}|${sessionDate || 'UNKNOWN'}`;
            const action = normalizeAttendanceAction(log);
            if (action === 'ENTRY') {
                perSubject[key].attendedSessionKeys.add(sessionKey);
                perSubject[key].conductedSessionKeys.add(sessionKey);
                if (log.is_late) perSubject[key].late += 1;
            }
            if (action === 'ABSENT') {
                perSubject[key].absent += 1;
                perSubject[key].conductedSessionKeys.add(sessionKey);
            }
        });

        const rows = Object.entries(perSubject).map(([subject, stats]) => ({
            subject,
            attendedSessions: stats.attendedSessionKeys.size,
            conductedSessions: stats.conductedSessionKeys.size,
            lateEntries: stats.late,
            absentSessions: stats.absent,
            score: stats.conductedSessionKeys.size > 0
                ? (stats.attendedSessionKeys.size / stats.conductedSessionKeys.size) * 100
                : 0,
        }));

        if (rows.length < 2) return null;

        const fairnessPool = rows.filter((row) => row.conductedSessions >= 2);
        const rankingRows = fairnessPool.length >= 2 ? fairnessPool : rows;

        rankingRows.sort((a, b) => b.score - a.score);
        const best = rankingRows[0];
        const weakest = rankingRows[rankingRows.length - 1];

        const reportLabel = {
            DAILY_REPORT: 'Daily Attendance',
            WEEKLY_SUMMARY: 'Weekly Attendance Summary',
            MONTHLY_TRENDS: 'Monthly Attendance Trends',
            SEM_REPORT: 'Semestral Report',
            LATE_REPORT: 'Personal Late Report',
            BREAK_LOG: 'Break Duration Log',
            ABSENT_LOG: 'Absent Logs',
            CONSISTENCY: 'Consistency Index',
        }[selectedReportType] || 'Selected Report';

        return {
            insight_code: `SUBJECT_COMPARISON_${selectedReportType}`,
            title: `Subject Comparison (${reportLabel})`,
            narrative: `Top performer is ${best.subject} (${best.score.toFixed(1)}% attendance over ${best.conductedSessions} conducted sessions) while weakest is ${weakest.subject} (${weakest.score.toFixed(1)}% over ${weakest.conductedSessions} sessions). ${fairnessPool.length >= 2 ? 'Ranking is fair-weighted to subjects with at least 2 conducted sessions.' : 'Low session volume detected; treat this ranking as directional.'}`,
            confidence: fairnessPool.length >= 2 ? 'HIGH' : 'MEDIUM',
        };
    }, [rawLogs, selectedReportType, selectedSubject, subjectClassMap, schedule]);

    const advancedInsights = useMemo(() => {
        const scoped = getReportScopedLogs(rawLogs);
        if (!scoped.length) return [];

        const subjectStats = {};
        const dayStats = {};

        scoped.forEach((log) => {
            const subject = log.mapped_subject
                ? getSubjectDisplayName(log.mapped_subject)
                : (log.subject_code || 'Unscheduled');
            if (!subjectStats[subject]) {
                subjectStats[subject] = {
                    entry: 0,
                    late: 0,
                    breakOut: 0,
                    absent: 0,
                };
            }
            const action = normalizeAttendanceAction(log);
            if (action === 'ENTRY') {
                subjectStats[subject].entry += 1;
                if (log.is_late) subjectStats[subject].late += 1;
            }
            if (action === 'BREAK_OUT') subjectStats[subject].breakOut += 1;
            if (action === 'ABSENT') subjectStats[subject].absent += 1;

            if (log.timestamp) {
                const dayName = new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
                if (!dayStats[dayName]) dayStats[dayName] = { late: 0, entry: 0 };
                if (action === 'ENTRY') {
                    dayStats[dayName].entry += 1;
                    if (log.is_late) dayStats[dayName].late += 1;
                }
            }
        });

        const entries = Object.entries(subjectStats);
        const result = [];

        if (entries.length >= 2) {
            const byLateRate = entries
                .map(([subject, s]) => ({
                    subject,
                    rate: s.entry > 0 ? (s.late / s.entry) * 100 : 0,
                    entry: s.entry,
                    late: s.late,
                }))
                .filter((row) => row.entry > 0)
                .sort((a, b) => b.rate - a.rate);

            if (byLateRate.length >= 2) {
                const highest = byLateRate[0];
                const lowest = byLateRate[byLateRate.length - 1];
                result.push({
                    insight_code: `LATE_CONTRAST_${selectedReportType}`,
                    title: 'Late Arrival Contrast',
                    narrative: `${highest.subject} has the highest late ratio (${highest.rate.toFixed(1)}%, ${highest.late}/${highest.entry}) while ${lowest.subject} is lowest (${lowest.rate.toFixed(1)}%).`,
                    confidence: highest.entry >= 3 && lowest.entry >= 3 ? 'HIGH' : 'MEDIUM',
                });
            }
        }

        const breakHeavy = entries
            .map(([subject, s]) => ({ subject, breaks: s.breakOut }))
            .sort((a, b) => b.breaks - a.breaks)[0];
        if (breakHeavy && breakHeavy.breaks > 0) {
            result.push({
                insight_code: `BREAK_PATTERN_${selectedReportType}`,
                title: 'Break Behavior Pattern',
                narrative: `${breakHeavy.subject} has the most break-out events (${breakHeavy.breaks}) in this window. Review if this aligns with longer class durations or concentration fatigue.`,
                confidence: breakHeavy.breaks >= 3 ? 'HIGH' : 'MEDIUM',
            });
        }

        const dayLateRows = Object.entries(dayStats)
            .map(([day, s]) => ({ day, rate: s.entry > 0 ? (s.late / s.entry) * 100 : 0, entry: s.entry }))
            .filter((row) => row.entry > 0)
            .sort((a, b) => b.rate - a.rate);
        if (dayLateRows.length >= 2 && dayLateRows[0].rate > dayLateRows[dayLateRows.length - 1].rate) {
            result.push({
                insight_code: `DAY_LATENESS_${selectedReportType}`,
                title: 'Day-of-Week Lateness Signal',
                narrative: `Highest lateness occurs on ${dayLateRows[0].day} (${dayLateRows[0].rate.toFixed(1)}%) versus ${dayLateRows[dayLateRows.length - 1].day} (${dayLateRows[dayLateRows.length - 1].rate.toFixed(1)}%).`,
                confidence: dayLateRows[0].entry >= 3 ? 'MEDIUM' : 'LOW',
            });
        }

        return result;
    }, [rawLogs, selectedReportType, selectedSubject, subjectClassMap, schedule]);

    const reportSpecificDeepInsights = useMemo(() => {
        const reportSpecific = new Set(['LATE_REPORT', 'BREAK_LOG', 'ABSENT_LOG']);
        if (!reportSpecific.has(selectedReportType)) return [];

        const scoped = getReportScopedLogs(rawLogs);
        if (!scoped.length) return [];

        const normalizeSubject = (log) => (
            log.mapped_subject
                ? getSubjectDisplayName(log.mapped_subject)
                : (log.subject_code
                    ? `${log.subject_code} - ${log.mapped_subject || 'Unscheduled'}`
                    : (log.mapped_subject || 'Unscheduled'))
        );

        const perSubject = {};
        const perDay = {};
        const perMonth = {};

        scoped.forEach((log) => {
            const subject = normalizeSubject(log);
            const action = normalizeAttendanceAction(log);
            if (!perSubject[subject]) {
                perSubject[subject] = { late: 0, absent: 0, breakOut: 0, breakIn: 0, entry: 0, total: 0 };
            }
            if (action === 'ENTRY') {
                perSubject[subject].entry += 1;
                if (log.is_late) perSubject[subject].late += 1;
            }
            if (action === 'ABSENT') perSubject[subject].absent += 1;
            if (action === 'BREAK_OUT') perSubject[subject].breakOut += 1;
            if (action === 'BREAK_IN') perSubject[subject].breakIn += 1;
            perSubject[subject].total += 1;

            const ts = log.timestamp ? new Date(log.timestamp) : null;
            if (ts) {
                const dayName = ts.toLocaleDateString('en-US', { weekday: 'long' });
                if (!perDay[dayName]) perDay[dayName] = { late: 0, absent: 0, breakOut: 0, total: 0 };
                if (action === 'ENTRY' && log.is_late) perDay[dayName].late += 1;
                if (action === 'ABSENT') perDay[dayName].absent += 1;
                if (action === 'BREAK_OUT') perDay[dayName].breakOut += 1;
                perDay[dayName].total += 1;

                const monthKey = ts.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                if (!perMonth[monthKey]) perMonth[monthKey] = { late: 0, absent: 0, breakOut: 0, total: 0 };
                if (action === 'ENTRY' && log.is_late) perMonth[monthKey].late += 1;
                if (action === 'ABSENT') perMonth[monthKey].absent += 1;
                if (action === 'BREAK_OUT') perMonth[monthKey].breakOut += 1;
                perMonth[monthKey].total += 1;
            }
        });

        const subjectRows = Object.entries(perSubject).map(([subject, v]) => ({
            subject,
            late: v.late,
            absent: v.absent,
            breakOut: v.breakOut,
            breakIn: v.breakIn,
            entry: v.entry,
            breakRoundTrips: Math.min(v.breakOut, v.breakIn),
            lateRate: v.entry > 0 ? (v.late / v.entry) * 100 : 0,
        }));

        const dayRows = Object.entries(perDay).map(([day, v]) => ({
            day,
            late: v.late,
            absent: v.absent,
            breakOut: v.breakOut,
            total: v.total,
        }));

        const monthRows = Object.entries(perMonth).map(([month, v]) => ({
            month,
            late: v.late,
            absent: v.absent,
            breakOut: v.breakOut,
            total: v.total,
        }));

        const insightsOut = [];

        if (selectedReportType === 'LATE_REPORT') {
            const ranked = subjectRows
                .filter((r) => r.entry > 0)
                .sort((a, b) => b.lateRate - a.lateRate);
            if (ranked.length) {
                const top = ranked[0];
                const bottom = ranked[ranked.length - 1];
                const gap = top.lateRate - bottom.lateRate;
                insightsOut.push({
                    insight_code: 'LATE_SUBJECT_RANKING',
                    title: 'Late Arrival Subject Ranking',
                    narrative: `Late-rate ranking places ${top.subject} highest at ${top.lateRate.toFixed(1)}% (${top.late}/${top.entry}) and ${bottom.subject} lowest at ${bottom.lateRate.toFixed(1)}% (${bottom.late}/${bottom.entry}). The spread is ${gap.toFixed(1)} percentage points, showing a clear subject-specific punctuality gap rather than random noise.`,
                    confidence: ranked.length >= 3 ? 'HIGH' : 'MEDIUM',
                });
            }
            if (dayRows.length) {
                const byLate = [...dayRows].sort((a, b) => b.late - a.late);
                const topDay = byLate[0];
                const lowDay = byLate[byLate.length - 1];
                insightsOut.push({
                    insight_code: 'LATE_TEMPORAL_PATTERN',
                    title: 'Late Arrival Temporal Pattern',
                    narrative: `Late arrivals peak on ${topDay.day} (${topDay.late}) and are lowest on ${lowDay.day} (${lowDay.late}). This recurring day-level concentration indicates schedule-friction periods and supports targeted arrival monitoring on peak days.`,
                    confidence: topDay.late >= 2 ? 'HIGH' : 'MEDIUM',
                });
            }
            if (monthRows.length >= 2) {
                const first = monthRows[0];
                const last = monthRows[monthRows.length - 1];
                insightsOut.push({
                    insight_code: 'LATE_MONTH_TREND',
                    title: 'Late Arrival Trend Over Time',
                    narrative: `Late counts moved from ${first.late} in ${first.month} to ${last.late} in ${last.month}. ${last.late > first.late ? 'The trend is worsening and may require intervention before high-load weeks.' : (last.late < first.late ? 'The trend is improving, suggesting recent punctuality controls are effective.' : 'The trend is flat, indicating persistent punctuality behavior without improvement.')}`,
                    confidence: 'MEDIUM',
                });
            }
        }

        if (selectedReportType === 'ABSENT_LOG') {
            const ranked = subjectRows
                .sort((a, b) => b.absent - a.absent);
            if (ranked.length) {
                const top = ranked[0];
                const bottom = ranked[ranked.length - 1];
                const totalAbs = ranked.reduce((acc, row) => acc + row.absent, 0);
                const share = totalAbs > 0 ? (top.absent / totalAbs) * 100 : 0;
                insightsOut.push({
                    insight_code: 'ABSENT_SUBJECT_CONTRIBUTION',
                    title: 'Absence Contribution by Subject',
                    narrative: `${top.subject} contributes the most absences (${top.absent}), while ${bottom.subject} has the lowest (${bottom.absent}). The top subject contributes ${share.toFixed(1)}% of all recorded absences in this scope, signaling concentration risk rather than evenly distributed misses.`,
                    confidence: totalAbs >= 4 ? 'HIGH' : 'MEDIUM',
                });
            }
            if (dayRows.length) {
                const byAbsent = [...dayRows].sort((a, b) => b.absent - a.absent);
                const topDay = byAbsent[0];
                insightsOut.push({
                    insight_code: 'ABSENT_DAY_CLUSTER',
                    title: 'Absence Day Cluster',
                    narrative: `${topDay.day} has the highest absence count (${topDay.absent}). Repeated misses on the same day are consistent with systemic friction (schedule overlap, commute constraint, or clustered workload) more than one-off events.`,
                    confidence: topDay.absent >= 2 ? 'HIGH' : 'MEDIUM',
                });
            }
            if (monthRows.length >= 2) {
                const byMonthAbs = [...monthRows].sort((a, b) => b.absent - a.absent);
                const peak = byMonthAbs[0];
                insightsOut.push({
                    insight_code: 'ABSENT_PERIOD_SPIKE',
                    title: 'Absence Critical Period',
                    narrative: `The highest monthly absence load is in ${peak.month} (${peak.absent}). This period should be treated as a risk window for continuity, with stricter check-ins and subject-level intervention planning.`,
                    confidence: peak.absent >= 2 ? 'MEDIUM' : 'LOW',
                });
            }
        }

        if (selectedReportType === 'BREAK_LOG') {
            const ranked = subjectRows
                .sort((a, b) => b.breakRoundTrips - a.breakRoundTrips);
            if (ranked.length) {
                const top = ranked[0];
                const bottom = ranked[ranked.length - 1];
                insightsOut.push({
                    insight_code: 'BREAK_SUBJECT_RANKING',
                    title: 'Break Behavior by Subject',
                    narrative: `${top.subject} records the most completed break cycles (${top.breakRoundTrips}), while ${bottom.subject} has the least (${bottom.breakRoundTrips}). This spread suggests subject-specific engagement or fatigue differences rather than uniform break behavior.`,
                    confidence: ranked.length >= 3 ? 'HIGH' : 'MEDIUM',
                });
            }
            if (dayRows.length) {
                const byBreak = [...dayRows].sort((a, b) => b.breakOut - a.breakOut);
                const topDay = byBreak[0];
                insightsOut.push({
                    insight_code: 'BREAK_DAY_PATTERN',
                    title: 'Break Day Pattern',
                    narrative: `Break-outs are highest on ${topDay.day} (${topDay.breakOut}), indicating concentration windows for in-session disengagement. Monitoring return compliance on this day can reduce late returns and continuity loss.`,
                    confidence: topDay.breakOut >= 2 ? 'MEDIUM' : 'LOW',
                });
            }
            if (subjectRows.some((row) => row.breakOut > row.breakIn)) {
                const problematic = subjectRows
                    .filter((row) => row.breakOut > row.breakIn)
                    .sort((a, b) => (b.breakOut - b.breakIn) - (a.breakOut - a.breakIn))[0];
                insightsOut.push({
                    insight_code: 'BREAK_COMPLIANCE_GAP',
                    title: 'Break Return Compliance Gap',
                    narrative: `${problematic.subject} shows a break-return gap (${problematic.breakOut} break-outs vs ${problematic.breakIn} break-ins). This mismatch is a direct indicator of unfinished break cycles and potential delayed return behavior impacting session continuity.`,
                    confidence: 'MEDIUM',
                });
            }
        }

        // Add one explicit recommendation insight derived from dominant pattern.
        if (insightsOut.length) {
            const recommendation = selectedReportType === 'LATE_REPORT'
                ? 'Prioritize punctuality interventions on the highest-late subject/day pair (arrival reminders 30 minutes before class, stricter first-10-minute monitoring).'
                : selectedReportType === 'ABSENT_LOG'
                    ? 'Target attendance intervention on the highest-absence subject and peak absence day (advisor follow-up, conflict audit, and mandatory check-ins in critical weeks).'
                    : 'Apply tighter break return controls on subjects with the highest break volume and any break-out/break-in mismatch (return timer, in-class return confirmation).';
            insightsOut.push({
                insight_code: `${selectedReportType}_ACTIONABLE_RECOMMENDATION`,
                title: 'Actionable Recommendation',
                narrative: recommendation,
                confidence: 'HIGH',
            });
        }

        return insightsOut;
    }, [rawLogs, selectedReportType, selectedSubject, subjectClassMap, schedule]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchServerReport = async () => {
            const userId = userProfile?.id || userProfile?.user_id;
            if (!userId) return;
            if (selectedSubject !== 'ALL' && !(subjectClassMap[selectedSubject] || []).length) return;

            const { dateFrom, dateTo } = resolveDateWindow();
            const scopedClassIds = selectedSubject !== 'ALL' ? (subjectClassMap[selectedSubject] || []) : [];
            const scopedClassKey = scopedClassIds.length
                ? scopedClassIds.slice().sort((a, b) => a - b).join(',')
                : 'ALL';
            const cacheKey = [
                userId,
                selectedReportType,
                scopedClassKey,
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
                        class_id:
                            selectedSubject !== 'ALL' && scopedClassIds.length === 1
                                ? scopedClassIds[0]
                                : undefined,
                        class_ids:
                            selectedSubject !== 'ALL' && scopedClassIds.length > 1
                                ? scopedClassIds.join(',')
                                : undefined,
                        limit: 250,
                    },
                });

                const payload = res.data || {};
                const rows = payload.visual_rows || payload.rows || [];

                const resolveSubjectTitle = (row) => {
                    if (row.subject_title) return row.subject_title;
                    if (!row.col2) return 'Unscheduled';

                    const col2Text = String(row.col2);
                    const codeCandidate = col2Text.includes('|')
                        ? col2Text.split('|').pop().trim()
                        : col2Text.trim();

                    const matchedSchedule = schedule.find((item) => (
                        (item.subject_code || '').toUpperCase() === codeCandidate.toUpperCase()
                    ));

                    return matchedSchedule?.subject_title || row.subject_code || col2Text;
                };

                const resolveSubjectCode = (row) => {
                    if (row.subject_code) return row.subject_code;
                    if (!row.col2) return null;
                    const col2Text = String(row.col2);
                    return col2Text.includes('|') ? col2Text.split('|').pop().trim() : null;
                };

                const resolveRoom = (row) => {
                    if (row.room) return row.room;
                    if (row.col2 && String(row.col2).includes('|')) {
                        return String(row.col2).split('|')[0].trim() || '—';
                    }
                    const subjectCode = resolveSubjectCode(row);
                    if (!subjectCode) return '—';
                    const matchedSchedule = schedule.find((item) => (
                        (item.subject_code || '').toUpperCase() === subjectCode.toUpperCase()
                    ));
                    return matchedSchedule?.room || '—';
                };

                const resolveFacultyName = (row) => {
                    if (row.faculty_name && row.faculty_name !== '—') return row.faculty_name;
                    const subjectCode = resolveSubjectCode(row);
                    if (!subjectCode) return '—';
                    const matchedSchedule = schedule.find((item) => (
                        (item.subject_code || '').toUpperCase() === subjectCode.toUpperCase()
                    ));
                    return matchedSchedule?.faculty_name || '—';
                };

                const resolveFallbackTimestamp = (row) => {
                    if (row.timestamp) return row.timestamp;
                    if (!row.col1) return null;

                    const datePart = String(row.col1).trim();
                    const timePart = row.col3 ? String(row.col3).trim() : null;

                    if (!timePart) {
                        return `${datePart}T00:00:00`;
                    }

                    const match = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                    if (!match) {
                        return `${datePart}T00:00:00`;
                    }

                    let hours = Number(match[1]);
                    const minutes = Number(match[2]);
                    const meridiem = match[3].toUpperCase();

                    if (meridiem === 'PM' && hours !== 12) hours += 12;
                    if (meridiem === 'AM' && hours === 12) hours = 0;

                    const hh = String(hours).padStart(2, '0');
                    const mm = String(minutes).padStart(2, '0');
                    return `${datePart}T${hh}:${mm}:00`;
                };

                const mapped = rows.map((row) => ({
                    timestamp: resolveFallbackTimestamp(row),
                    display_date: row.col1 || null,
                    display_time: row.col3 || null,
                    action: row.action || row.status,
                    status: row.status,
                    is_late: row.is_late || String(row.status || '').toUpperCase() === 'LATE',
                    class_id: row.class_id,
                    subject_code: resolveSubjectCode(row),
                    mapped_subject: resolveSubjectTitle(row),
                    mapped_room: resolveRoom(row),
                    faculty_name: resolveFacultyName(row),
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
    }, [selectedReportType, selectedSubject, filterDate, selectedSemester, academicYear, weeklyMonth, selectedWeekNumber, userProfile, subjectClassMap]);

    // --- FILTER LOGIC ---
    const getFilteredData = () => {
        let filtered = getReportScopedLogs(rawLogs);

        // Server already scopes report windows, so client only sorts for display.
        return filtered.sort((a, b) => {
            const aTime = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
            const bTime = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
            return aTime - bTime;
        });
    };

    const getMetricContext = (metric) => {
        const dict = metricDictionary[metric.metric_name] || {
            label: metric.metric_name.replaceAll('_', ' '),
            explanation: metric.explanation || 'Derived from report window records.',
            formula: metric.formula || 'N/A',
        };

        return {
            ...dict,
            metricName: metric.metric_name,
            value: metric.value,
            confidence: metric.confidence,
            formula: metric.formula || dict.formula,
            explanation: metric.explanation || dict.explanation,
        };
    };

    const renderServerInsightPanel = () => {
        const confidenceAllowed = new Set(['MEDIUM', 'HIGH']);
        const modelInsights = (insights || []).filter((insight) => confidenceAllowed.has(String(insight.confidence || '').toUpperCase()));
        const reportSpecificOnly = new Set(['LATE_REPORT', 'BREAK_LOG', 'ABSENT_LOG']).has(selectedReportType);
        const baseInsights = reportSpecificOnly
            ? [...reportSpecificDeepInsights, ...modelInsights]
            : (comparativeInsight ? [comparativeInsight, ...advancedInsights, ...modelInsights] : [...advancedInsights, ...modelInsights]);
        const deduped = [];
        const seenCodes = new Set();
        baseInsights.forEach((insight) => {
            const code = insight.insight_code || `${insight.title}-${insight.narrative}`;
            if (seenCodes.has(code)) return;
            seenCodes.add(code);
            deduped.push(insight);
        });
        const visibleInsights = deduped;
        if (!summaryMetrics.length && !visibleInsights.length) return null;

        const activeMetric = summaryMetrics.find((metric) => metric.metric_name === activeMetricName);
        const activeContext = activeMetric ? getMetricContext(activeMetric) : null;

        return (
            <div className="insight-panel">
                <div className="insight-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="insight-section-title" style={{ marginBottom: 0 }}>Performance Metrics</div>
                    {visibleInsights.length > 0 && (
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
                                <div className="insight-stat-sub">Confidence: {metric.confidence}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Metric Detail Modal */}
                {isMetricModalOpen && activeContext && (
                    <div className="metric-modal-overlay" onClick={() => setIsMetricModalOpen(false)}>
                        <div className="metric-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setIsMetricModalOpen(false)}>×</button>
                            <div className="metric-hover-title">{activeContext.label}</div>
                            <div className="metric-hover-line"><strong>Current Value:</strong> {activeContext.value}</div>
                            <div className="metric-hover-line"><strong>Formula:</strong> {activeContext.formula}</div>
                            <div className="metric-hover-line"><strong>Meaning:</strong> {activeContext.explanation}</div>
                            <div className="metric-hover-line"><strong>Confidence:</strong> {activeContext.confidence} - {confidenceMeaning[activeContext.confidence] || 'Data confidence from sample quality.'}</div>
                        </div>
                    </div>
                )}

                {/* Insights Detailed Modal */}
                {showInsightsModal && visibleInsights.length > 0 && (
                    <div className="metric-modal-overlay" onClick={() => setShowInsightsModal(false)}>
                        <div className="metric-modal-content insight-detailed-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setShowInsightsModal(false)}>×</button>
                            <div className="metric-hover-title">Explainable Insights</div>
                            <ul style={{ margin: '15px 0 0 0', paddingLeft: '18px' }}>
                                {visibleInsights.map((insight) => (
                                    <li key={insight.insight_code} style={{ marginBottom: '10px', fontSize: '0.9em', color: '#333' }}>
                                        <strong>{insight.title}:</strong> {insight.narrative} 
                                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>Confidence: {insight.confidence}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const getVisualTrendTitle = () => {
        if (selectedReportType === 'DAILY_REPORT') return 'Daily Activity Trend';
        if (selectedReportType === 'WEEKLY_SUMMARY') return 'Weekly Activity Trend';
        if (selectedReportType === 'MONTHLY_TRENDS') return 'Monthly Activity Trend';
        if (selectedReportType === 'SEM_REPORT') return 'Semestral Activity Trend';
        return 'Activity Trend';
    };

    const renderVisualSummary = () => {
        if (!rawLogs.length) return null;
        const visualWindow = resolveDateWindow();

        const statusItems = [
            { label: 'Entered', value: statusDistribution.ENTERED, color: '#2e7d32' },
            { label: 'Late', value: statusDistribution.LATE, color: '#e65100' },
            { label: 'Absent', value: statusDistribution.ABSENT, color: '#c62828' },
            { label: 'On Break (Out)', value: statusDistribution.BREAK_OUT, color: '#1565c0' },
            { label: 'From Break (In)', value: statusDistribution.BREAK_IN, color: '#00897b' },
            { label: 'Exited', value: statusDistribution.EXITED, color: '#6c757d' },
        ];
        const maxStatus = Math.max(...statusItems.map((item) => item.value), 1);
        const statusKeys = ['ENTERED', 'LATE', 'ABSENT', 'BREAK_OUT', 'BREAK_IN', 'EXITED'];
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
                        <div className="visual-title">{getVisualTrendTitle()}</div>
                        <div className="trend-note" style={{ marginBottom: '8px' }}>
                            Period: {visualWindow.dateFrom} to {visualWindow.dateTo}
                        </div>
                        {selectedReportType === 'SEM_REPORT' && (
                            <div className="visual-filter-row">
                                <label>Status Distribution:</label>
                                <select
                                    className="app-select"
                                    value={selectedVisualStatus}
                                    onChange={(event) => setSelectedVisualStatus(event.target.value)}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="ENTERED">Entered</option>
                                    <option value="LATE">Late</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="BREAK_OUT">Break Out</option>
                                    <option value="BREAK_IN">Break In</option>
                                    <option value="EXITED">Exited</option>
                                </select>
                            </div>
                        )}
                        <div className="grouped-cluster-scroll-wrap">
                            <div className="grouped-cluster-chart">
                                {dailyTrend.map((item) => (
                                    <div key={item.day} className="grouped-cluster-item">
                                        <div className="grouped-cluster-track">
                                            {['entered', 'late', 'absent', 'breakOut', 'breakIn', 'exited'].map(actionKey => {
                                                const value = item[actionKey] || 0;
                                                const styleKey = actionKey === 'entered'
                                                    ? 'ENTERED'
                                                    : actionKey === 'late'
                                                        ? 'LATE'
                                                        : actionKey === 'absent'
                                                            ? 'ABSENT'
                                                            : actionKey === 'breakOut'
                                                                ? 'BREAK_OUT'
                                                                : actionKey === 'breakIn'
                                                                    ? 'BREAK_IN'
                                                                    : 'EXITED';
                                                if (selectedReportType === 'SEM_REPORT' && selectedVisualStatus !== 'ALL' && selectedVisualStatus !== styleKey) return null;
                                                
                                                return (
                                                    <div
                                                        key={`${item.day}-${actionKey}`}
                                                        className="grouped-cluster-bar"
                                                        style={{
                                                            height: `${value === 0 ? 3 : (maxTrend === 0 ? 3 : (value / maxTrend) * 140)}px`,
                                                            backgroundColor: statusStyle[styleKey],
                                                            opacity: value === 0 ? 0.3 : 1,
                                                        }}
                                                        title={`${item.day} • ${actionKey.replace(/([A-Z])/g, ' $1')}: ${value}`}
                                                    >
                                                        <span className="grouped-cluster-value">{value}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="grouped-cluster-label">
                                            {item.isSubjectAxis
                                                ? item.day
                                                : new Date(item.day).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="trend-legend-row">
                            {Object.entries(statusStyle)
                                .filter(([key]) => selectedVisualStatus === 'ALL' || key === selectedVisualStatus)
                                .map(([key, color]) => (
                                    <span key={key} className="trend-legend-item">
                                        <span className="trend-legend-dot" style={{ background: color }} />
                                        {key.replace('_', ' ')}
                                    </span>
                                ))}
                        </div>
                        <div className="trend-note">
                            {dailyTrend[0]?.isSubjectAxis
                                ? 'Grouped by subject for selected report window'
                                : `Range: ${dailyTrend[0]?.day || 'N/A'} to ${dailyTrend[dailyTrend.length - 1]?.day || 'N/A'}`}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderConsistencyGuide = () => {
        if (selectedReportType !== 'CONSISTENCY') return null;

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

    // Helper: Map action to display status
    const getActionStatus = (action, isLate = false) => {
        if (!action) return { text: '—', isPresent: false };
        const upper = action.toUpperCase();
        if (upper === 'ENTRY') return { text: isLate ? 'LATE' : 'ENTERED', isPresent: !isLate };
        if (upper === 'ABSENT') return { text: 'ABSENT', isPresent: false };
        if (upper === 'BREAK_OUT') return { text: 'ON BREAK (OUT)', isPresent: false };
        if (upper === 'BREAK_IN') return { text: 'FROM BREAK (IN)', isPresent: true };
        if (upper === 'EXIT') return { text: 'EXITED', isPresent: false };
        return { text: action, isPresent: false };
    };

    const displayData = getFilteredData();
    const currentDesc = reportTypes.find(r => r.id === selectedReportType)?.desc;
    const isWeeklySummary = selectedReportType === 'WEEKLY_SUMMARY';
    const insightEnabledReports = new Set([
        'WEEKLY_SUMMARY',
        'MONTHLY_TRENDS',
        'SEM_REPORT',
        'ABSENT_LOG',
        'LATE_REPORT',
        'BREAK_LOG',
        'CONSISTENCY',
    ]);
    const shouldShowAnalytics = insightEnabledReports.has(selectedReportType);

    // --- GENERATE DATE RANGE STRING ---
    const getDateRangeString = () => {
        const d = new Date(filterDate);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };

        switch (selectedReportType) {
            case 'DAILY_REPORT':
                return d.toLocaleDateString('en-US', options);
            case 'LATE_REPORT':
            case 'BREAK_LOG':
                {
                    const window = resolveDateWindow();
                    return `${window.dateFrom} - ${window.dateTo}`;
                }
            case 'WEEKLY_SUMMARY':
                const weekRanges = getWeekRangesForMonth();
                const selectedWeek = weekRanges.find((item) => item.value === selectedWeekNumber) || weekRanges[0];
                return selectedWeek
                    ? `${selectedWeek.start.toLocaleDateString('en-US', options)} - ${selectedWeek.end.toLocaleDateString('en-US', options)}`
                    : d.toLocaleDateString('en-US', options);
            case 'ABSENT_LOG':
                {
                    const window = resolveDateWindow();
                    return `${window.dateFrom} - ${window.dateTo}`;
                }

            case 'MONTHLY_TRENDS':
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            case 'SEM_REPORT':
                {
                    const window = resolveDateWindow();
                    return `${window.dateFrom} - ${window.dateTo}`;
                }
            default:
                return d.toLocaleDateString('en-US', options);
        }
    };

    // --- RENDER DYNAMIC DATE FILTER ---
    const renderDateFilter = () => {
        if (selectedReportType === 'DAILY_REPORT') {
             return (
                 <div className="filter-item">
                     <label>Select Date:</label>
                     <input type="date" className="app-select big-select" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
        }

        if (selectedReportType === 'WEEKLY_SUMMARY') {
            const weekOptions = getWeekRangesForMonth();
             return (
                 <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                     <div className="filter-item">
                         <label>Select Month:</label>
                         <input
                             type="month"
                             className="app-select big-select"
                             value={weeklyMonth}
                             onChange={(e) => {
                                 setWeeklyMonth(e.target.value);
                                const [yearText, monthText] = e.target.value.split('-');
                                const y = Number(yearText);
                                const m = Number(monthText);
                                const isCurrentMonth = y === now.getFullYear() && m === (now.getMonth() + 1);
                                setSelectedWeekNumber(isCurrentMonth ? getWeekNumberInMonth(now) : '1');
                             }}
                         />
                     </div>
                     <div className="filter-item">
                         <label>Select Week:</label>
                         <select
                             className="app-select big-select"
                             value={selectedWeekNumber}
                             onChange={(e) => setSelectedWeekNumber(e.target.value)}
                         >
                             {weekOptions.map((week) => (
                                 <option key={week.value} value={week.value}>{week.label}</option>
                             ))}
                         </select>
                     </div>
                 </div>
             );
        }

        if (selectedReportType === 'MONTHLY_TRENDS') {
            return (
                <div className="filter-item">
                    <label>Select Month:</label>
                    <input type="month" className="app-select big-select" value={filterDate.substring(0, 7)} onChange={(e) => setFilterDate(e.target.value + '-01')} />
                </div>
            );
        }

        if (selectedReportType === 'SEM_REPORT' || selectedReportType === 'LATE_REPORT' || selectedReportType === 'BREAK_LOG' || selectedReportType === 'CONSISTENCY' || selectedReportType === 'ABSENT_LOG') {
             return (
                 <div style={{ display: 'flex', gap: '15px' }}>
                     <div className="filter-item">
                         <label>School Year:</label>
                         <select className="app-select big-select" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                             {[2023, 2024, 2025, 2026].map(y => (
                                 <option key={y} value={y}>{y} - {y+1}</option>
                             ))}
                         </select>
                     </div>
                     <div className="filter-item">
                         <label>Semester:</label>
                         <select className="app-select big-select" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
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
            const status = getActionStatus(log.action, log.is_late);
            return {
                "Date": log.display_date || new Date(log.timestamp).toLocaleDateString(),
                "Time": log.display_time || new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

                    <div className="filter-item" style={{ minWidth: '250px' }}>
                        <label>Filter Subject:</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="app-select big-select"
                            disabled={false}
                        >
                            <option value="ALL">All Enrolled Subjects</option>
                            {uniqueSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
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

            {!loading && displayData.length > 0 && shouldShowAnalytics && selectedReportType !== 'CONSISTENCY' && renderServerInsightPanel()}
            {!loading && displayData.length > 0 && shouldShowAnalytics && renderSessionCountReference()}
            {!loading && displayData.length > 0 && selectedReportType === 'CONSISTENCY' && renderVisualSummary()}
            {!loading && displayData.length > 0 && shouldShowAnalytics && renderConsistencyGuide()}
            {!loading && displayData.length > 0 && selectedReportType !== 'CONSISTENCY' && renderVisualSummary()}
            {!loading && isFetchingReport && (
                <div className="insight-panel">
                    <div className="insight-section-title">Loading Selected Report</div>
                    <div className="report-loading-skeleton">Fetching updated metrics and records...</div>
                </div>
            )}

            {/* TABLE CARD */}
            {selectedReportType !== 'CONSISTENCY' && (
            <div className="card recent-reports-card">
                <div className="recent-reports-header">
                    <h3 style={{ margin: 0 }}>Generated Records</h3>

                    <div className="recent-reports-filters">
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
                                            <div style={{ fontWeight: '500' }}>{log.display_date || new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.85em', color: '#888' }}>{log.display_time || new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#333' }}>
                                            {log.mapped_subject}
                                        </td>
                                        <td>{log.faculty_name || '—'}</td>
                                        <td>{log.mapped_room}</td>
                                        <td>
                                            {(() => {
                                                const status = getActionStatus(log.action, log.is_late);
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
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                        No records found for this view.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

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
