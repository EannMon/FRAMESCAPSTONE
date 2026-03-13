import React, { useState, useEffect } from 'react';
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
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true);

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
        { id: 'SEM_REPORT', label: 'Semestral Report (Per Subject)', desc: 'Provides cumulative data per subject for academic reference.' },
        { id: 'OVERALL_SEM', label: 'Overall Semestral Summary', desc: 'Consolidates all subjects for holistic engagement assessment.' },
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
                processedSchedule.forEach(item => {
                    if (item.subject_title && !seen.has(item.subject_title)) {
                        seen.add(item.subject_title);
                        subjects.push(item.subject_title);
                    }
                });
                setUniqueSubjects(subjects);

                // B. Get Logs & SMART MAPPING
                const historyRes = await api.get(`/api/student/history/${userId}`, { signal: controller.signal });
                const rawLogData = historyRes.data || [];

                const mappedLogs = rawLogData.map(log => {
                    // 1. Create Date object manually to avoid Timezone Shift
                    const t = log.timestamp.split(/[- :]/);
                    const logDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

                    const logDay = logDate.toLocaleDateString('en-US', { weekday: 'long' });
                    const logTimeMins = logDate.getHours() * 60 + logDate.getMinutes();

                    // 2. Find Class Match (Using Pre-processed Schedule)
                    const foundClass = processedSchedule.find(cls => {
                        // Check Day first (Fast fail)
                        if (cls.day_of_week !== logDay) return false;

                        // Check Room (If room data exists in log)
                        if (log.room && cls.room && log.room !== cls.room) return false;

                        // Check Time (Buffer: 60 mins before, 60 mins after class starts/ends)
                        return (
                            logTimeMins >= (cls.startMins - 60) &&
                            logTimeMins <= (cls.endMins + 60)
                        );
                    });

                    return {
                        ...log,
                        mapped_subject: foundClass ? foundClass.subject_title : (log.class_name || 'Unscheduled'),
                        mapped_room: log.room || '—'
                    };
                });

                setRawLogs(mappedLogs);
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

    // --- FILTER LOGIC ---
    const getFilteredData = () => {
        let filtered = [...rawLogs];

        // 1. Subject Filter
        if (selectedSubject !== 'ALL') {
            filtered = filtered.filter(l => l.mapped_subject === selectedSubject);
        }

        // 2. Report Type Logic
        const selectedDate = new Date(filterDate);
        // Helper: Reset hours for accurate date comparison
        selectedDate.setHours(0, 0, 0, 0);

        switch (selectedReportType) {
            case 'DAILY_REPORT':
            case 'LATE_REPORT':
            case 'BREAK_LOG':
                filtered = filtered.filter(l => {
                    const logDate = new Date(l.timestamp);
                    return logDate.toDateString() === selectedDate.toDateString();
                });
                break;
            case 'WEEKLY_SUMMARY':
                // Match week (Start date -> +7 days)
                const weekEnd = new Date(selectedDate);
                weekEnd.setDate(weekEnd.getDate() + 6);
                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    return d >= selectedDate && d <= weekEnd;
                });
                break;
            case 'HISTORY_30D':
                // History: filterDate is END DATE. Limit to prev 30 days.
                const last30 = new Date(selectedDate);
                last30.setHours(0,0,0,0);
                last30.setDate(last30.getDate() - 30);
                // selectedDate (End) should include end of day
                const rangeEnd = new Date(selectedDate);
                rangeEnd.setHours(23, 59, 59, 999);

                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    return d >= last30 && d <= rangeEnd;
                });
                break;

            case 'SEM_REPORT':
                // Specific Semester (Year + Sem)
                const year = parseInt(academicYear);
                let semStart, semEnd;
                
                if (selectedSemester === '1ST') {
                    semStart = new Date(year, 7, 1); // Aug 1
                    semEnd = new Date(year, 11, 31); // Dec 31
                } else if (selectedSemester === '2ND') {
                    semStart = new Date(year + 1, 0, 1); // Jan 1 (Next Year)
                    semEnd = new Date(year + 1, 4, 31); // May 31
                } else { // SUMMER
                    semStart = new Date(year + 1, 5, 1); // Jun 1
                    semEnd = new Date(year + 1, 6, 31); // Jul 31
                }

                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    return d >= semStart && d <= semEnd;
                });
                break;
            case 'MONTHLY_TRENDS':
                // Filter by selected month using filterDate (year-month from month picker)
                const mtDate = new Date(filterDate);
                const mtMonthStart = new Date(mtDate.getFullYear(), mtDate.getMonth(), 1);
                const mtMonthEnd = new Date(mtDate.getFullYear(), mtDate.getMonth() + 1, 0, 23, 59, 59, 999);
                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    return d >= mtMonthStart && d <= mtMonthEnd;
                });
                break;
            case 'OVERALL_SEM':
                // Whole Academic Year (Aug 1 to Jul 31 next year)
                const acYear = parseInt(academicYear);
                const acStart = new Date(acYear, 7, 1);
                const acEnd = new Date(acYear + 1, 6, 31);
                
                filtered = filtered.filter(l => {
                     const d = new Date(l.timestamp);
                     return d >= acStart && d <= acEnd;
                });
                break;
            default:
                break;
        }

        // Sort ascending (oldest first — chronological reading order)
        return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    };

    // ─── INSIGHT COMPUTATIONS ────────────────────────────────────────────
    // Computes summary stats from filtered data for the insight panel.
    const getInsights = (data) => {
        if (!data.length) return null;

        const entries   = data.filter(l => l.action?.toUpperCase() === 'ENTRY');
        const exits     = data.filter(l => l.action?.toUpperCase() === 'EXIT');
        const breakOuts = data.filter(l => l.action?.toUpperCase() === 'BREAK_OUT');
        const lates     = entries.filter(l => l.is_late);
        const onTime    = entries.filter(l => !l.is_late);
        const earlyExit = exits.filter(l => l.remarks === 'Early exit');

        // Unique session days
        const sessionDays = [...new Set(entries.map(l => new Date(l.timestamp).toDateString()))];

        // Attendance rate across unique days with entries
        const allDays = [...new Set(data.map(l => new Date(l.timestamp).toDateString()))];
        const attendanceRate = allDays.length ? Math.round((sessionDays.length / allDays.length) * 100) : 0;

        // Punctuality rate
        const punctualityRate = entries.length ? Math.round((onTime.length / entries.length) * 100) : 0;

        // Per-subject breakdown
        const bySubject = {};
        entries.forEach(l => {
            const subj = l.mapped_subject || 'Unknown';
            if (!bySubject[subj]) bySubject[subj] = { present: 0, late: 0, earlyExit: 0, breaks: 0 };
            bySubject[subj].present++;
            if (l.is_late) bySubject[subj].late++;
        });
        earlyExit.forEach(l => {
            const subj = l.mapped_subject || 'Unknown';
            if (bySubject[subj]) bySubject[subj].earlyExit++;
        });
        breakOuts.forEach(l => {
            const subj = l.mapped_subject || 'Unknown';
            if (bySubject[subj]) bySubject[subj].breaks++;
        });

        // Weekly breakdown (for weekly/monthly views)
        const byWeek = {};
        entries.forEach(l => {
            const d = new Date(l.timestamp);
            const weekKey = `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            if (!byWeek[weekKey]) byWeek[weekKey] = { present: 0, late: 0 };
            byWeek[weekKey].present++;
            if (l.is_late) byWeek[weekKey].late++;
        });

        // Daily breakdown for weekly view
        const byDay = {};
        const dayOrder = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        entries.forEach(l => {
            const d = new Date(l.timestamp);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            if (!byDay[dayName]) byDay[dayName] = { present: 0, late: 0 };
            byDay[dayName].present++;
            if (l.is_late) byDay[dayName].late++;
        });

        return {
            totalSessions: sessionDays.length,
            totalEntries: entries.length,
            lateCount: lates.length,
            onTimeCount: onTime.length,
            earlyExitCount: earlyExit.length,
            breakCount: breakOuts.length,
            attendanceRate,
            punctualityRate,
            bySubject,
            byWeek,
            byDay: dayOrder.filter(d => byDay[d]).map(d => ({ day: d.slice(0, 3), ...byDay[d] })),
        };
    };

    // ─── INSIGHT PANEL RENDERER ─────────────────────────────────────────
    const renderInsightPanel = (data) => {
        const ins = getInsights(data);
        if (!ins) return null;

        // ── Stat Card helper ──
        const StatCard = ({ label, value, sub, color, icon }) => (
            <div className="insight-stat-card" style={{ borderTop: `3px solid ${color}` }}>
                <div className="insight-stat-icon" style={{ color }}>{icon}</div>
                <div className="insight-stat-value" style={{ color }}>{value}</div>
                <div className="insight-stat-label">{label}</div>
                {sub && <div className="insight-stat-sub">{sub}</div>}
            </div>
        );

        // ── Bar-chart helper (pure CSS, no library) ──
        const BarChart = ({ items, maxVal, colorFn, labelKey, valueKey, height = 80 }) => {
            if (!items.length) return null;
            const max = maxVal || Math.max(...items.map(i => i[valueKey]), 1);
            return (
                <div className="insight-barchart">
                    {items.map((item, i) => (
                        <div key={i} className="insight-bar-col">
                            <div className="insight-bar-track" style={{ height }}>
                                <div
                                    className="insight-bar-fill"
                                    style={{
                                        height: `${Math.round((item[valueKey] / max) * 100)}%`,
                                        background: colorFn ? colorFn(item) : '#163269'
                                    }}
                                />
                            </div>
                            <div className="insight-bar-val">{item[valueKey]}</div>
                            <div className="insight-bar-lbl">{item[labelKey]}</div>
                        </div>
                    ))}
                </div>
            );
        };

        // ── Donut / ring helper ──
        const DonutRing = ({ pct, color, label }) => {
            const r = 32, cx = 40, cy = 40;
            const circ = 2 * Math.PI * r;
            const dash = (pct / 100) * circ;
            return (
                <div className="insight-donut-wrap">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eee" strokeWidth="9" />
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
                            strokeDasharray={`${dash} ${circ}`}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${cx} ${cy})`} />
                        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{pct}%</text>
                    </svg>
                    <div className="insight-donut-lbl">{label}</div>
                </div>
            );
        };

        // Subject rows
        const subjectRows = Object.entries(ins.bySubject).map(([subj, d]) => ({
            subj,
            present: d.present,
            late: d.late,
            onTime: d.present - d.late,
            earlyExit: d.earlyExit,
            breaks: d.breaks,
            pctLate: d.present ? Math.round((d.late / d.present) * 100) : 0
        }));

        // ── Contextual insight text ──
        const getVerdict = () => {
            if (ins.attendanceRate >= 90 && ins.punctualityRate >= 85) return { text: 'Excellent standing — keep it up!', color: '#2e7d32' };
            if (ins.attendanceRate >= 75 && ins.punctualityRate >= 70) return { text: 'Good standing — minor improvements needed.', color: '#1565c0' };
            if (ins.attendanceRate >= 60) return { text: 'Fair — attendance needs attention.', color: '#e65100' };
            return { text: 'At risk — consider speaking with your instructor.', color: '#c62828' };
        };

        const verdict = getVerdict();

        return (
            <div className="insight-panel">
                {/* ── Verdict banner ── */}
                <div className="insight-verdict" style={{ borderLeft: `4px solid ${verdict.color}`, color: verdict.color }}>
                    <i className="fas fa-chart-line" style={{ marginRight: 8 }} />
                    <strong>Summary: </strong>{verdict.text}
                </div>

                {/* ── Stat cards row ── */}
                <div className="insight-stats-row">
                    <StatCard label="Sessions Attended" value={ins.totalSessions} color="#163269" icon="📅" />
                    <StatCard label="On Time" value={ins.onTimeCount} sub={`${ins.punctualityRate}% punctual`} color="#2e7d32" icon="✅" />
                    <StatCard label="Late Arrivals" value={ins.lateCount} sub={ins.totalEntries ? `${Math.round((ins.lateCount/ins.totalEntries)*100)}% of entries` : ''} color="#e65100" icon="⏰" />
                    <StatCard label="Early Exits" value={ins.earlyExitCount} color="#7b1fa2" icon="🚪" />
                    <StatCard label="Breaks Taken" value={ins.breakCount} color="#0277bd" icon="☕" />
                </div>

                {/* ── Donut rings ── */}
                <div className="insight-rings-row">
                    <DonutRing pct={ins.attendanceRate} color="#163269" label="Attendance Rate" />
                    <DonutRing pct={ins.punctualityRate} color="#2e7d32" label="Punctuality Rate" />
                    <DonutRing pct={ins.earlyExitCount && ins.totalSessions ? Math.round((ins.earlyExitCount / ins.totalSessions) * 100) : 0} color="#7b1fa2" label="Early Exit Rate" />
                </div>

                {/* ── Per-subject breakdown (only if multiple subjects) ── */}
                {subjectRows.length > 0 && (
                    <div className="insight-section">
                        <div className="insight-section-title">Per-Subject Breakdown</div>
                        <table className="insight-subject-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Sessions Present</th>
                                    <th>On Time</th>
                                    <th>Late</th>
                                    <th>Early Exits</th>
                                    <th>Breaks</th>
                                    <th>Late Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjectRows.map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{row.subj}</td>
                                        <td>{row.present}</td>
                                        <td style={{ color: '#2e7d32', fontWeight: 600 }}>{row.onTime}</td>
                                        <td style={{ color: row.late > 0 ? '#e65100' : '#aaa' }}>{row.late}</td>
                                        <td style={{ color: row.earlyExit > 0 ? '#7b1fa2' : '#aaa' }}>{row.earlyExit}</td>
                                        <td>{row.breaks}</td>
                                        <td>
                                            <div className="insight-mini-bar-wrap">
                                                <div className="insight-mini-bar" style={{ width: `${row.pctLate}%`, background: row.pctLate > 30 ? '#c62828' : '#e65100' }} />
                                                <span>{row.pctLate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Day-of-week bar chart (for weekly/monthly/semester views) ── */}
                {ins.byDay.length > 0 && !['DAILY_REPORT', 'LATE_REPORT', 'BREAK_LOG'].includes(selectedReportType) && (
                    <div className="insight-section">
                        <div className="insight-section-title">Attendance by Day of Week</div>
                        <BarChart
                            items={ins.byDay}
                            labelKey="day"
                            valueKey="present"
                            colorFn={(item) => item.late > 0 ? '#e65100' : '#163269'}
                            height={70}
                        />
                    </div>
                )}
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
            case 'LATE_REPORT':
            case 'BREAK_LOG':
                return d.toLocaleDateString('en-US', options);
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
            case 'OVERALL_SEM':
                return `Academic Year ${academicYear}-${parseInt(academicYear) + 1}`;
            default:
                return d.toLocaleDateString('en-US', options);
        }
    };

    // --- RENDER DYNAMIC DATE FILTER ---
    const renderDateFilter = () => {
        const style = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '160px' };
        
        // A. Single Date Input (Used for Daily, Weekly Start, History End)
        if (['DAILY_REPORT', 'LATE_REPORT', 'BREAK_LOG'].includes(selectedReportType)) {
             return (
                 <div className="filter-item">
                     <label>Select Date:</label>
                     <input type="date" style={style} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
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

        // C. Academic Year Only (Overall Sem)
        if (selectedReportType === 'OVERALL_SEM') {
             return (
                 <div className="filter-item">
                     <label>School Year:</label>
                     <select style={style} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                         {[2023, 2024, 2025, 2026].map(y => (
                             <option key={y} value={y}>{y} - {y+1}</option>
                         ))}
                     </select>
                 </div>
             );
        }

        // D. Semester Selector (Sem Report)
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
            </div>

            {/* INSIGHT PANEL */}
            {!loading && displayData.length > 0 && renderInsightPanel(displayData)}

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
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
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