import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import '../FacultyDashboard/FacultyDashboardPage.css';
import './StudentDashboardPage.css';

// --- HERO WELCOME BANNER ---
const WelcomeBanner = ({ studentName, studentId, todayName, todayDate }) => (
    <div className="fd-hero-banner">
        <div className="fd-hero-shape fd-hero-shape-1"></div>
        <div className="fd-hero-shape fd-hero-shape-2"></div>
        <div className="fd-hero-shape fd-hero-shape-3"></div>
        <div className="fd-hero-content">
            <div className="fd-hero-left">
                <div className="fd-hero-text">
                    <p className="fd-hero-greeting">Welcome back,</p>
                    <h2 className="fd-hero-name">{studentName}</h2>
                    <p className="fd-hero-id">Student ID: {studentId}</p>
                </div>
            </div>
            <div className="fd-hero-right">
                <span className="fd-face-badge registered">
                    <i className="fas fa-check-circle"></i>
                    Face Registered
                </span>
            </div>
        </div>
    </div>
);

// --- RIBBON STAT ITEM ---
const StudentStatItem = ({ title, value, subValue, subValueColor }) => (
    <div className="fd-ribbon-item">
        <span className="fd-ribbon-label">{title}</span>
        <span className="fd-ribbon-value">{value}</span>
        {subValue && <span className="fd-ribbon-sub" style={{ color: subValueColor || '#64748b' }}>{subValue}</span>}
    </div>
);

// --- SESSION BREAKDOWN BAR ---
const BreakdownBar = ({ label, current, total, color, subLabel }) => {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div className="sd-bar-metric">
            <div className="sd-bar-top">
                <span className="sd-bar-label">{label}</span>
                <div className="sd-bar-right">
                    <span className="sd-bar-count">{current} / {total}</span>
                    {subLabel && <span className="sd-bar-sub-tag">{subLabel}</span>}
                </div>
            </div>
            <div className="sd-bar-track">
                <div className="sd-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}>
                    {pct > 8 && <span className="sd-bar-pct">{pct}%</span>}
                </div>
                {pct <= 8 && <span className="sd-bar-pct-outside" style={{ color }}>{pct}%</span>}
            </div>
        </div>
    );
};

// --- SESSION BREAKDOWN PANEL ---
const SessionBreakdown = ({ metrics }) => {
    if (!metrics) return null;

    const attended = metrics.sessions_attended || 0;
    const total = metrics.total_sessions || 0;
    const missed = total - attended;
    const onTime = metrics.on_time_arrivals || 0;
    const late = metrics.late_arrivals || 0;

    return (
        <div className="fd-card sd-metrics-card">
            <div className="fd-card-header">
                <h3>Session Breakdown</h3>
            </div>
            <div className="sd-bars-container">
                <BreakdownBar
                    label="Sessions Attended"
                    current={attended}
                    total={total}
                    color="#00A859"
                    subLabel={missed > 0 ? `${missed} missed` : 'Perfect'}
                />
                <BreakdownBar
                    label="On-Time Arrivals"
                    current={onTime}
                    total={attended}
                    color="#3b82f6"
                    subLabel={late > 0 ? `${late} late` : 'All on time'}
                />
            </div>
        </div>
    );
};

// --- LIVE CLASS STATUS ---
const LiveClassStatus = ({ recentLog }) => {
    let status = 'IDLE';
    let statusColor = 'grey';
    let statusText = 'Not currently in any class';
    let roomName = '---';

    if (recentLog && recentLog.action) {
        const logTime = new Date(recentLog.timestamp);
        const now = new Date();
        const diffHours = (now - logTime) / 1000 / 60 / 60;

        if (diffHours < 4) {
            roomName = recentLog.room || 'Unknown Room';
            if (recentLog.action === 'ENTRY' || recentLog.action === 'BREAK_IN') {
                status = 'ACTIVE';
                statusColor = '#2E7D32';
                statusText = `Currently Detected in ${roomName}`;
            } else if (recentLog.action === 'BREAK_OUT') {
                status = 'BREAK';
                statusColor = '#F9A825';
                statusText = `On Break from ${roomName}`;
            } else if (recentLog.event_type === 'attendance_out') {
                status = 'OUT';
                statusColor = 'grey';
                statusText = 'Class Session Ended';
                roomName = '---';
            }
        }
    }

    return (
        <div className="fd-card sd-live-card">
            <div className="fd-card-header">
                <h3>Live Status</h3>
                <div className="sd-live-indicator">
                    <span className="fd-blink-dot" style={{ backgroundColor: statusColor }}></span>
                    <span className="sd-status-text" style={{ color: statusColor }}>{status}</span>
                </div>
            </div>
            <div className="sd-live-body">
                <div className={`fd-room-display fd-room-${status.toLowerCase()}`}>
                    <i className={`fas fa-chalkboard-teacher fd-room-icon ${status === 'ACTIVE' ? 'active' : 'inactive'}`} style={{ '--active-color': statusColor }}></i>
                    <div className="fd-room-details">
                        <h4>{roomName}</h4>
                        <p className="fd-room-status-text">{statusText}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- RECENT ACTIVITY (TIMELINE) ---
const StudentRecentActivity = ({ logs }) => {
    const getEventColor = (action) => {
        switch (action) {
            case 'ENTRY': case 'BREAK_IN': return '#00A859';
            case 'BREAK_OUT': return '#f59e0b';
            case 'EXIT': return '#64748b';
            default: return '#94a3b8';
        }
    };

    const getEventIcon = (action) => {
        switch (action) {
            case 'ENTRY': return 'fa-sign-in-alt';
            case 'BREAK_IN': return 'fa-undo';
            case 'BREAK_OUT': return 'fa-coffee';
            case 'EXIT': return 'fa-sign-out-alt';
            default: return 'fa-circle';
        }
    };

    return (
        <div className="fd-card fd-activity-card">
            <div className="fd-card-header">
                <h3>Recent Activity</h3>
            </div>
            {(!logs || logs.length === 0) ? (
                <div className="fd-empty-state">
                    <p>No recent records found.</p>
                </div>
            ) : (
                <div className="fd-timeline">
                    {logs.slice(0, 5).map((log, i) => {
                        const action = log.action || 'ENTRY';
                        const color = getEventColor(action);
                        return (
                            <div key={i} className="fd-timeline-item">
                                <div className="fd-timeline-line">
                                    <div className="fd-timeline-dot" style={{ backgroundColor: color, boxShadow: `0 0 0 4px ${color}22` }}>
                                        <i className={`fas ${getEventIcon(action)}`}></i>
                                    </div>
                                    {i < Math.min(logs.length, 5) - 1 && <div className="fd-timeline-connector"></div>}
                                </div>
                                <div className="fd-timeline-content">
                                    <div className="fd-timeline-top">
                                        <strong>{action.replace('_', ' ')}</strong>
                                        <span className="fd-timeline-time">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <span className="fd-timeline-meta">
                                        {new Date(log.timestamp).toLocaleDateString()} • {log.room || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


// --- ATTENDANCE TREND CHART ---
const AttendanceTrendChart = ({ logs, semesterWindow }) => {
    const [timeFilter, setTimeFilter] = useState('MONTHLY');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const chartData = useMemo(() => {
        const safeLogs = logs || [];
        const now = new Date();
        const dataPoints = [];
        const semesterStart = semesterWindow?.start ? new Date(`${semesterWindow.start}T00:00:00`) : null;
        const semesterEnd = semesterWindow?.end ? new Date(`${semesterWindow.end}T23:59:59`) : null;
        const effectiveEnd = semesterEnd && now > semesterEnd ? semesterEnd : now;

        if (timeFilter === 'WEEKLY') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(effectiveEnd);
                d.setDate(d.getDate() - i);
                if (semesterStart && d < semesterStart) continue;
                const dayStr = days[d.getDay()];
                const dateStr = d.toLocaleDateString();
                const dayLogs = safeLogs.filter(l => new Date(l.timestamp).toLocaleDateString() === dateStr);
                const presentCount = dayLogs.filter(l => (l.action || '').toUpperCase() === 'ENTRY').length;
                dataPoints.push({
                    label: dayStr,
                    present: presentCount,
                    absent: dayLogs.filter(l => (l.action || '').toUpperCase() === 'ABSENT').length,
                    break: dayLogs.filter(l => (l.action || '').includes('BREAK')).length,
                    total: dayLogs.length
                });
            }
        } else if (timeFilter === 'MONTHLY') {
            const currentMonth = effectiveEnd.getMonth();
            const currentYear = effectiveEnd.getFullYear();
            const quarters = [
                { label: 'Week 1', start: 1, end: 7 },
                { label: 'Week 2', start: 8, end: 14 },
                { label: 'Week 3', start: 15, end: 21 },
                { label: 'Week 4', start: 22, end: 31 }
            ];
            quarters.forEach(q => {
                const qLogs = safeLogs.filter(l => {
                    const d = new Date(l.timestamp);
                    return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() >= q.start && d.getDate() <= q.end;
                });
                const presentCount = qLogs.filter(l => (l.action || '').toUpperCase() === 'ENTRY').length;
                dataPoints.push({
                    label: q.label,
                    present: presentCount,
                    absent: qLogs.filter(l => (l.action || '').toUpperCase() === 'ABSENT').length,
                    break: qLogs.filter(l => (l.action || '').includes('BREAK')).length,
                    total: qLogs.length
                });
            });
        } else if (timeFilter === 'SEMESTRAL') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const startMonth = semesterStart ? semesterStart.getMonth() : 0;
            const endMonth = semesterEnd ? semesterEnd.getMonth() : 11;
            const yearForSemester = semesterStart ? semesterStart.getFullYear() : now.getFullYear();
            months.forEach((m, idx) => {
                if (idx < startMonth || idx > endMonth) return;
                const mLogs = safeLogs.filter(l => {
                    const d = new Date(l.timestamp);
                    return d.getFullYear() === yearForSemester && d.getMonth() === idx;
                });
                const presentCount = mLogs.filter(l => (l.action || '').toUpperCase() === 'ENTRY').length;
                dataPoints.push({
                    label: m,
                    present: presentCount,
                    absent: mLogs.filter(l => (l.action || '').toUpperCase() === 'ABSENT').length,
                    break: mLogs.filter(l => (l.action || '').includes('BREAK')).length,
                    total: mLogs.length
                });
            });
        }

        // Return real data (zeros if no logs exist — never show fake data)
        return dataPoints;
    }, [logs, timeFilter, semesterWindow]);

    const periodLabel = useMemo(() => {
        if (!chartData.length) return 'No period data available';
        const semesterStart = semesterWindow?.start;
        const semesterEnd = semesterWindow?.end;
        const now = new Date();

        if (timeFilter === 'WEEKLY') {
            const end = semesterEnd ? new Date(`${semesterEnd}T23:59:59`) : now;
            const effectiveEnd = now > end ? end : now;
            const start = new Date(effectiveEnd);
            start.setDate(start.getDate() - 6);
            return `Period: ${start.toLocaleDateString()} - ${effectiveEnd.toLocaleDateString()}`;
        }
        if (timeFilter === 'MONTHLY') {
            const end = semesterEnd ? new Date(`${semesterEnd}T23:59:59`) : now;
            const effectiveEnd = now > end ? end : now;
            const start = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1);
            const monthEnd = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth() + 1, 0);
            return `Period: ${start.toLocaleDateString()} - ${monthEnd.toLocaleDateString()}`;
        }
        return `Period: ${semesterStart || 'N/A'} - ${semesterEnd || 'N/A'}`;
    }, [chartData, timeFilter, semesterWindow]);

    const insightText = useMemo(() => {
        const total = chartData.reduce((acc, curr) => acc + curr.present, 0);
        if (timeFilter === 'SEMESTRAL') return `Total ${total} attendances recorded this semester.`;
        if (timeFilter === 'MONTHLY') return `You have attended ${total} classes this month.`;
        return `Performance for the last 7 days: ${total} present.`;
    }, [chartData, timeFilter]);

    const height = 300;
    const width = 800;
    const padding = 50;
    const rawMax = Math.max(...chartData.map(d => Math.max(d.present, d.break, d.absent)), 5);
    const maxVal = Math.ceil(rawMax / 5) * 5;

    const getCoords = (val, idx) => {
        const x = (idx / (chartData.length - 1 || 1)) * (width - 2 * padding) + padding;
        const y = height - padding - (val / maxVal) * (height - 2 * padding);
        return { x, y };
    };

    const makePath = (key) => chartData.map((d, i) => {
        const { x, y } = getCoords(d[key], i);
        return (i === 0 ? `M ${x},${y}` : `L ${x},${y}`);
    }).join(' ');

    const colors = { present: '#2E7D32', break: '#F9A825', absent: '#C62828' };

    return (
        <div className="fd-card fd-chart-card">
            <div className="fd-card-header">
                <h3>Attendance Trends</h3>
                <div className="fd-chart-controls">
                    <div className="fd-pill-group">
                        {['WEEKLY', 'MONTHLY', 'SEMESTRAL'].map(t => (
                            <button key={t} className={`fd-pill ${timeFilter === t ? 'active' : ''}`} onClick={() => setTimeFilter(t)}>
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fd-type-filter-bar">
                {['ALL', 'PRESENT', 'ABSENT', 'BREAK'].map(t => (
                    <button key={t} className={`fd-type-btn ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                        {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <div className="fd-svg-container">
                <svg viewBox={`0 0 ${width} ${height}`} className="fd-trend-svg">
                    <defs>
                        <linearGradient id="sGradPresent" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.present} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.present} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="sGradBreak" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.break} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.break} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="sGradAbsent" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.absent} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.absent} stopOpacity="0" />
                        </linearGradient>
                        <filter id="sLineShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                        <filter id="sTooltipShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
                        </filter>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                        const val = Math.round(maxVal * t);
                        const y = height - padding - (t * (height - 2 * padding));
                        return (
                            <React.Fragment key={i}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--chart-grid, #e2e8f0)" strokeDasharray="5,5" />
                                <text x={padding - 10} y={y + 5} textAnchor="end" fontSize="11" fill="var(--chart-text, #64748b)" fontWeight="500">{val}</text>
                            </React.Fragment>
                        );
                    })}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--chart-axis, #cbd5e1)" strokeWidth="2" strokeLinecap="round" />

                    {(typeFilter === 'ALL' || typeFilter === 'ABSENT') &&
                        <path d={`${makePath('absent')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#sGradAbsent)" stroke="none" />}
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') &&
                        <path d={`${makePath('break')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#sGradBreak)" stroke="none" />}
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') &&
                        <path d={`${makePath('present')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#sGradPresent)" stroke="none" />}

                    {(typeFilter === 'ALL' || typeFilter === 'ABSENT') &&
                        <path d={makePath('absent')} fill="none" stroke={colors.absent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#sLineShadow)" />}
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') &&
                        <path d={makePath('break')} fill="none" stroke={colors.break} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />}
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') &&
                        <path d={makePath('present')} fill="none" stroke={colors.present} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#sLineShadow)" />}

                    {chartData.map((d, i) => {
                        const { x: xp, y: yp } = getCoords(d.present, i);
                        const { x: xb, y: yb } = getCoords(d.break, i);
                        const { x: xa, y: ya } = getCoords(d.absent, i);
                        return (
                            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                                <rect x={xp - (width / chartData.length / 2)} y={0} width={width / chartData.length} height={height} fill="transparent" />
                                <text x={xp} y={height - 15} textAnchor="middle" fill="var(--chart-text, #64748b)" fontSize="12" fontWeight="500">{d.label}</text>
                                {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && <circle cx={xp} cy={yp} r="4" fill={colors.present} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'BREAK') && <circle cx={xb} cy={yb} r="4" fill={colors.break} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'ABSENT') && <circle cx={xa} cy={ya} r="4" fill={colors.absent} stroke="#fff" strokeWidth="2" />}
                                {hoveredIndex === i && (
                                    <g transform={`translate(${xp}, 20)`}>
                                        <rect x="-60" y="-10" width="120" height="70" rx="5" fill="var(--chart-tooltip-bg, white)" filter="url(#sTooltipShadow)" stroke="var(--chart-tooltip-border, #e2e8f0)" />
                                        <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--chart-tooltip-text, #0F172A)">{d.label}</text>
                                        <rect x="-50" y="18" width="8" height="8" rx="2" fill={colors.present} />
                                        <text x="-38" y="26" textAnchor="start" fontSize="10" fill="var(--chart-text, #64748b)">Present: {d.present}</text>
                                        <rect x="10" y="18" width="8" height="8" rx="2" fill={colors.break} />
                                        <text x="22" y="26" textAnchor="start" fontSize="10" fill="var(--chart-text, #64748b)">Break: {d.break}</text>
                                        <rect x="-50" y="32" width="8" height="8" rx="2" fill={colors.absent} />
                                        <text x="-38" y="40" textAnchor="start" fontSize="10" fill="var(--chart-text, #64748b)">Absent: {d.absent}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="fd-chart-footer">
                <div className="fd-chart-insight" style={{ fontSize: '0.8rem', color: '#64748b' }}>{periodLabel}</div>
                <div className="fd-chart-insight">{insightText}</div>
                <div className="fd-chart-legends">
                    <div className="fd-legend-item"><span className="fd-legend-dot" style={{ background: colors.present }}></span> Present</div>
                    <div className="fd-legend-item"><span className="fd-legend-dot" style={{ background: colors.break }}></span> Break</div>
                    <div className="fd-legend-item"><span className="fd-legend-dot" style={{ background: colors.absent }}></span> Absent</div>
                </div>
            </div>
        </div>
    );
};


// ============================================
// MAIN STUDENT DASHBOARD PAGE
// ============================================
const StudentDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        attendance_rate: "0%",
        enrolled_courses: 0,
        notifications: [],
        recent_attendance: []
    });
    const [userData, setUserData] = useState({ firstName: "Student", tupm_id: "..." });
    const [allLogs, setAllLogs] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [semesterWindow, setSemesterWindow] = useState({ start: null, end: null });

    const getFallbackSemesterWindow = () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        if (month >= 1 && month <= 6) {
            return { start: `${year}-01-01`, end: `${year}-06-30` };
        }
        if (month >= 8 && month <= 12) {
            return { start: `${year}-08-01`, end: `${year}-12-31` };
        }
        return { start: `${year}-06-01`, end: `${year}-07-31` };
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!storedUser) return;
                setUserData(storedUser);

                const userId = storedUser.id || storedUser.user_id;
                const departmentId = storedUser.department_id;

                let semStart = null;
                let semEnd = null;
                if (departmentId) {
                    try {
                        const acadRes = await api.get('/api/dept/academic-year', {
                            signal: controller.signal,
                            params: { dept_id: departmentId },
                        });
                        semStart = acadRes.data?.semester_start_date || null;
                        semEnd = acadRes.data?.semester_end_date || null;
                    } catch (err) {
                        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                            console.warn('Failed to fetch department semester window for trend chart.', err);
                        }
                    }
                }

                if (!semStart || !semEnd) {
                    const fallback = getFallbackSemesterWindow();
                    semStart = semStart || fallback.start;
                    semEnd = semEnd || fallback.end;
                }

                const [dashRes, histRes, metricsRes, semReportRes] = await Promise.all([
                    api.get(`/api/student/dashboard/${userId}`, { signal: controller.signal }),
                    api.get(`/api/student/history/${userId}`, { signal: controller.signal }),
                    api.get(`/api/student/metrics/${userId}`, { signal: controller.signal }).catch(() => null),
                    api.get(`/api/student/reports/data/${userId}`, {
                        signal: controller.signal,
                        params: {
                            report_type: 'SEM_REPORT',
                            date_from: semStart,
                            date_to: semEnd,
                            limit: 100,
                        },
                    }).catch(() => null),
                ]);

                setDashboardData(prev => ({
                    ...prev,
                    ...dashRes.data,
                    recent_attendance: dashRes.data.recent_attendance || [],
                    notifications: dashRes.data.notifications || []
                }));

                const semRows = semReportRes?.data?.visual_rows || [];
                setAllLogs(semRows.length ? semRows : (histRes.data || []));
                setSemesterWindow({ start: semStart, end: semEnd });
                if (metricsRes && metricsRes.data) {
                    setMetrics(metricsRes.data);
                }
                setLoading(false);
            } catch (error) {
                if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                    console.error("Error fetching dashboard:", error);
                    setLoading(false);
                }
            }
        };
        fetchData();

        return () => controller.abort();
    }, []);

    if (loading) return (
        <div className="fd-loading">
            <div className="fd-spinner"></div>
            <p>Loading dashboard...</p>
        </div>
    );

    const latestLog = dashboardData.recent_attendance && dashboardData.recent_attendance.length > 0
        ? dashboardData.recent_attendance[0]
        : null;

    const attRate = metrics ? `${metrics.attendance_rate}%` : (dashboardData.attendance_rate || "0%");
    const puncRate = metrics ? `${metrics.punctuality_rate}%` : '--';
    const attTier = metrics ? metrics.attendance_tier : null;
    const puncTier = metrics ? metrics.punctuality_tier : null;
    const attColor = metrics ? metrics.attendance_tier_color : '#64748b';
    const puncColor = metrics ? metrics.punctuality_tier_color : '#64748b';

    const now = new Date();
    const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="fd-page">
            {/* ===== HERO SECTION ===== */}
            <div className="fd-hero-section">
                <WelcomeBanner
                    studentName={userData.first_name || userData.firstName}
                    studentId={userData.tupm_id}
                    todayName={todayName}
                    todayDate={todayDate}
                />

                {/* Inline Ribbon Stats */}
                <div className="fd-stats-ribbon">
                    <StudentStatItem
                        title="Attendance Rate"
                        value={attRate}
                        subValue={attTier}
                        subValueColor={attColor}
                    />
                    <div className="fd-ribbon-divider"></div>
                    <StudentStatItem
                        title="Enrolled Courses"
                        value={dashboardData.enrolled_courses || 0}
                        subValue="This Semester"
                    />
                    <div className="fd-ribbon-divider"></div>
                    <StudentStatItem
                        title="Punctuality Rate"
                        value={puncRate}
                        subValue={puncTier}
                        subValueColor={puncColor}
                    />
                </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="sd-main-grid">
                <AttendanceTrendChart logs={allLogs} semesterWindow={semesterWindow} />
                <LiveClassStatus recentLog={latestLog} />
                <SessionBreakdown metrics={metrics} />
                <StudentRecentActivity logs={dashboardData.recent_attendance} />
            </div>
        </div>
    );
};

export default StudentDashboardPage;
