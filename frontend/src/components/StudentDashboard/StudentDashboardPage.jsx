import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './StudentDashboardPage.css';

// --- COMPONENTS ---

const WelcomeBanner = ({ studentName, studentId }) => (
    <div className="card welcome-banner">
        <div className="welcome-avatar">
            <i className="fas fa-user"></i>
        </div>
        <div className="welcome-info">
            <h3>Welcome back, {studentName}!</h3>
            <p>Student ID: {studentId}</p>
            <p>Face Registration: <span className="status-tag green">Registered</span></p>
        </div>
    </div>
);

const StudentSummaryCard = ({ iconClass, value, title, iconBgClass }) => (
    <div className="card student-summary-card">
        <div className={`summary-icon-container ${iconBgClass}`}>
            <i className={iconClass}></i>
        </div>
        <div className="summary-value">{value}</div>
        <div className="summary-title">{title}</div>
    </div>
);

const StudentSummaryCards = ({ stats }) => (
    <div className="student-summary-cards-container">
        <StudentSummaryCard iconClass="fas fa-user-check" value={stats.attendanceRate} title="Attendance Rate" iconBgClass="s-attendance-bg" />
        <StudentSummaryCard iconClass="fas fa-book" value={stats.courses} title="Enrolled Courses" iconBgClass="s-courses-bg" />
        <StudentSummaryCard iconClass="fas fa-clock" value="On Time" title="Punctuality" iconBgClass="s-access-bg" />
    </div>
);

// --- RIGHT PANEL COMPONENTS ---

const LiveClassStatus = ({ userId }) => {
    const [liveStatus, setLiveStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const controller = new AbortController();
        let pollTimer = null;

        const fetchLiveStatus = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:5000/api/student/live-status/${userId}`,
                    { signal: controller.signal }
                );
                setLiveStatus(response.data);
                setStatusError(null);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    setStatusError('Unable to fetch live status');
                    console.error('Live status fetch error:', err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setStatusLoading(false);
                }
            }
        };

        // Initial fetch
        fetchLiveStatus();

        // Poll every 30 seconds for real-time updates
        pollTimer = setInterval(() => {
            if (!controller.signal.aborted) {
                fetchLiveStatus();
            }
        }, 30000);

        return () => {
            controller.abort();
            if (pollTimer) clearInterval(pollTimer);
        };
    }, [userId]);

    // Color mapping from API status_color to actual CSS colors
    const colorMap = {
        green: '#2E7D32',
        amber: '#F9A825',
        grey: '#999',
    };

    // Derive display values from live status or defaults
    const status = liveStatus?.status || 'IDLE';
    const statusColor = colorMap[liveStatus?.status_color] || '#999';
    const statusText = liveStatus?.status_text || 'Not currently in any class';
    const roomName = liveStatus?.room || '---';
    const subjectInfo = liveStatus?.subject_code
        ? `${liveStatus.subject_code} — ${liveStatus.subject_title || ''}`
        : null;

    // Show/hide blinking dot based on status
    const showDot = status === 'PRESENT' || status === 'BREAK';

    if (statusLoading) {
        return (
            <div className="card live-status-card">
                <div className="live-header">
                    <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                </div>
                <div className="live-body" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    <i className="fas fa-spinner fa-spin"></i> Loading...
                </div>
            </div>
        );
    }

    if (statusError) {
        return (
            <div className="card live-status-card">
                <div className="live-header">
                    <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                </div>
                <div className="live-body" style={{ padding: '20px', textAlign: 'center', color: '#C62828' }}>
                    <i className="fas fa-exclamation-circle"></i> {statusError}
                </div>
            </div>
        );
    }

    return (
        <div className="card live-status-card">
            <div className="live-header">
                <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                <div className="live-indicator">
                    {showDot && (
                        <span className="blink-dot" style={{ backgroundColor: statusColor }}></span>
                    )}
                    <span style={{ color: statusColor, fontWeight: 'bold' }}>{status}</span>
                </div>
            </div>
            <div className="live-body">
                <div className="room-display">
                    <i className="fas fa-chalkboard-teacher room-icon" style={{ color: showDot ? statusColor : '#ccc' }}></i>
                    <div className="room-info">
                        <h4>{roomName}</h4>
                        <p>{statusText}</p>
                        {subjectInfo && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{subjectInfo}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... (Recent Attendance Component skipped as it mostly depends on CSS) ... 
const StudentRecentAttendance = ({ logs }) => (
    <div className="card student-recent-attendance">
        <h3>Recent Activity</h3>
        <div className="recent-activity-list">
            {logs.length > 0 ? (
                logs.slice(0, 5).map((log, index) => {
                    const action = log.action || 'ENTRY';
                    const isEntry = action === 'ENTRY' || action === 'BREAK_IN';
                    const displayType = action.replace('_', ' ');

                    return (
                        <div key={index} className="student-attendance-item">
                            <div className="attendance-details">
                                <span className="attendance-day">{new Date(log.timestamp).toLocaleDateString()}</span>
                                <span className="attendance-time">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="attendance-stats">
                                <span className="attendance-percent" style={{
                                    color: isEntry ? '#2E7D32' : '#666',
                                    fontSize: '0.8em',
                                    backgroundColor: isEntry ? 'rgba(46, 125, 50, 0.1)' : '#f0f0f0'
                                }}>
                                    {displayType}
                                </span>
                            </div>
                        </div>
                    );
                })
            ) : (
                <p style={{ color: '#888', padding: '10px' }}>No recent records found.</p>
            )}
        </div>
    </div>
);

// --- ADVANCED CHART COMPONENT ---

const AttendanceTrendChart = ({ logs }) => {
    // 1. Local State for Filters
    const [timeFilter, setTimeFilter] = useState('MONTHLY'); // 'WEEKLY', 'MONTHLY', 'YEARLY'
    const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'PRESENT', 'ABSENT', 'BREAK'
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // 2. Process Data based on Filters (Memoized)
    const chartData = useMemo(() => {
        const safeLogs = logs || [];
        const now = new Date();
        const dataPoints = [];

        if (timeFilter === 'WEEKLY') {
            // Logic: Show days of the current week (or last 7 days). 
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dayStr = days[d.getDay()];
                const dateStr = d.toLocaleDateString();

                const dayLogs = safeLogs.filter(l => new Date(l.timestamp).toLocaleDateString() === dateStr);
                
                dataPoints.push({
                    label: dayStr,
                    present: dayLogs.filter(l => l.action === 'ENTRY' || l.action === 'BREAK_IN').length,
                    absent: 0,
                    break: dayLogs.filter(l => l.action === 'BREAK_OUT').length,
                    total: dayLogs.length
                });
            }

        } else if (timeFilter === 'MONTHLY') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const quarters = [
                { label: 'Week 1', start: 1, end: 7 },
                { label: 'Week 2', start: 8, end: 14 },
                { label: 'Week 3', start: 15, end: 21 },
                { label: 'Week 4', start: 22, end: 31 }
            ];

            quarters.forEach(q => {
                const qLogs = safeLogs.filter(l => {
                    const d = new Date(l.timestamp);
                    return d.getFullYear() === currentYear && 
                           d.getMonth() === currentMonth && 
                           d.getDate() >= q.start && 
                           d.getDate() <= q.end;
                });

                dataPoints.push({
                    label: q.label,
                    present: qLogs.filter(l => l.action === 'ENTRY' || l.action === 'BREAK_IN').length,
                    absent: 0,
                    break: qLogs.filter(l => l.action === 'BREAK_OUT').length,
                    total: qLogs.length
                });
            });

        } else if (timeFilter === 'YEARLY') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentYear = now.getFullYear();

            months.forEach((m, idx) => {
                const mLogs = safeLogs.filter(l => {
                    const d = new Date(l.timestamp);
                    return d.getFullYear() === currentYear && d.getMonth() === idx;
                });

                dataPoints.push({
                    label: m,
                    present: mLogs.filter(l => l.action === 'ENTRY' || l.action === 'BREAK_IN').length,
                    absent: 0,
                    break: mLogs.filter(l => l.action === 'BREAK_OUT').length,
                    total: mLogs.length
                });
            });
        }
        
        if (safeLogs.length === 0) {
            // Generate realistic dummy data based on filter
            if (timeFilter === 'YEARLY') {
                 return dataPoints.map(d => ({ ...d, present: Math.floor(Math.random() * 30) + 20, break: Math.floor(Math.random() * 10) }));
            } else if (timeFilter === 'MONTHLY') {
                 return dataPoints.map(d => ({ ...d, present: Math.floor(Math.random() * 10) + 5, break: Math.floor(Math.random() * 5) }));
            }
             return dataPoints.map(d => ({ ...d, present: Math.floor(Math.random() * 5), break: Math.floor(Math.random() * 2) }));
        }

        return dataPoints;
    }, [logs, timeFilter]);

    // 3. Determine Insight Text
    const insightText = useMemo(() => {
        const total = chartData.reduce((acc, curr) => acc + curr.present, 0);
        if (timeFilter === 'YEARLY') return `Total ${total} attendances recorded this year.`;
        if (timeFilter === 'MONTHLY') return `You have attended ${total} classes this month.`;
        return `Performance for the last 7 days: ${total} present.`;
    }, [chartData, timeFilter]);

    // 4. Chart Rendering Config
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

    const colors = {
        present: '#2E7D32', // Success Green
        break: '#F9A825',   // Warning Amber
        absent: '#C62828'   // Danger Red
    };

    return (
        <div className="card attendance-trend-chart-card">
            {/* TOP BAR: Title + Filters */}
            <div className="trend-chart-header">
                <h3><i className="fas fa-chart-line"></i> Attendance Trends</h3>
                
                <div className="chart-filters-group">
                    <div className="filter-pill-group">
                        {['WEEKLY', 'MONTHLY', 'YEARLY'].map(t => (
                            <button 
                                key={t} 
                                className={`filter-pill ${timeFilter === t ? 'active' : ''}`}
                                onClick={() => setTimeFilter(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECONDARY FILTER: TYPE */}
            <div className="type-filter-bar">
                {['ALL', 'PRESENT', 'ABSENT', 'BREAK'].map(t => (
                    <button 
                         key={t}
                         className={`type-text-btn ${typeFilter === t ? 'active-type' : ''}`}
                         onClick={() => setTypeFilter(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* CHART AREA */}
            <div className="svg-chart-container" style={{ height: '250px' }}>
                <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
                    <defs>
                        {/* Gradients for Area Fills */}
                        <linearGradient id="gradPresent" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.present} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.present} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradBreak" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.break} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.break} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradAbsent" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.absent} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.absent} stopOpacity="0" />
                        </linearGradient>
                        
                        {/* Drop Shadow for Lines */}
                        <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                    </defs>

                    {/* Y-Axis Labels & Horizontal Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                         const val = Math.round(maxVal * t);
                         const y = height - padding - (t * (height - 2 * padding));
                         return (
                            <g key={i}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f5f5f5" strokeDasharray="5,5" />
                                <text x={padding - 10} y={y + 5} textAnchor="end" fontSize="11" fill="#999" fontWeight="500">{val}</text>
                            </g>
                         );
                    })}
                    
                    {/* Base Axis Line */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" strokeWidth="2" strokeLinecap="round" />

                    {/* PATHS - Render Areas First */}
                    {(typeFilter === 'ALL' || typeFilter === 'ABSENT') && 
                        <path d={`${makePath('absent')} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#gradAbsent)" stroke="none" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') && 
                        <path d={`${makePath('break')} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#gradBreak)" stroke="none" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && 
                        <path d={`${makePath('present')} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#gradPresent)" stroke="none" />
                    }

                    {/* PATHS - Render Lines on Top */}
                    {(typeFilter === 'ALL' || typeFilter === 'ABSENT') && 
                        <path d={makePath('absent')} fill="none" stroke={colors.absent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') && 
                        <path d={makePath('break')} fill="none" stroke={colors.break} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && 
                        <path d={makePath('present')} fill="none" stroke={colors.present} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)" />
                    }

                    {/* POINTS (Hover Layer) */}
                    {chartData.map((d, i) => {
                        const { x: xp, y: yp } = getCoords(d.present, i);
                        const { x: xb, y: yb } = getCoords(d.break, i);
                        const { x: xa, y: ya } = getCoords(d.absent, i);

                        return (
                            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                                {/* Hit Area vertical stripe */}
                                <rect x={xp - (width / chartData.length / 2)} y={0} width={width / chartData.length} height={height} fill="transparent" />
                                
                                {/* X-Axis Label */}
                                <text x={xp} y={height - 15} textAnchor="middle" fill="#777" fontSize="12" fontWeight="500">{d.label}</text>

                                {/* Visible Dots */}
                                {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && <circle cx={xp} cy={yp} r="4" fill={colors.present} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'BREAK') && <circle cx={xb} cy={yb} r="4" fill={colors.break} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'ABSENT') && <circle cx={xa} cy={ya} r="4" fill={colors.absent} stroke="#fff" strokeWidth="2" />}

                                {/* TOOLTIP */}
                                {hoveredIndex === i && (
                                    <g transform={`translate(${xp}, 20)`}>
                                        <rect x="-60" y="-10" width="120" height="70" rx="5" fill="rgba(255,255,255,0.95)" filter="url(#shadow)" stroke="#eee" />
                                        <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">{d.label}</text>
                                        <rect x="-50" y="18" width="8" height="8" rx="2" fill={colors.present} />
                                        <text x="-38" y="26" textAnchor="start" fontSize="10" fill="#555">Present: {d.present}</text>
                                        
                                        <rect x="10" y="18" width="8" height="8" rx="2" fill={colors.break} />
                                        <text x="22" y="26" textAnchor="start" fontSize="10" fill="#555">Break: {d.break}</text>

                                        <rect x="-50" y="32" width="8" height="8" rx="2" fill={colors.absent} />
                                        <text x="-38" y="40" textAnchor="start" fontSize="10" fill="#555">Absent: {d.absent}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
                        </filter>
                    </defs>
                </svg>
            </div>

            {/* BOTTOM: INSIGHTS & LEGEND */}
            <div className="chart-footer">
                <div className="chart-insight">
                    <i className="fas fa-lightbulb"></i> {insightText}
                </div>
                <div className="chart-legends">
                    <div className="legend-item"><span className="dot" style={{background: colors.present}}></span> Present</div>
                    <div className="legend-item"><span className="dot" style={{background: colors.break}}></span> Break</div>
                    <div className="legend-item"><span className="dot" style={{background: colors.absent}}></span> Absent</div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
const StudentDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        attendance_rate: "0%",
        enrolled_courses: 0,
        notifications: [],
        recent_attendance: []
    });
    const [userData, setUserData] = useState({ firstName: "Student", tupm_id: "..." });
    const [allLogs, setAllLogs] = useState([]);

    // Derive userId once for child components
    const userId = userData.id || userData.user_id || null;

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!storedUser) {
                    setError('No user session found. Please log in.');
                    setLoading(false);
                    return;
                }
                setUserData(storedUser);

                const uid = storedUser.id || storedUser.user_id;

                const [dashRes, histRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/student/dashboard/${uid}`, { signal: controller.signal }),
                    axios.get(`http://localhost:5000/api/student/history/${uid}`, { signal: controller.signal })
                ]);

                setDashboardData(prev => ({
                    ...prev,
                    ...dashRes.data,
                    recent_attendance: dashRes.data.recent_attendance || [],
                    notifications: dashRes.data.notifications || []
                }));

                setAllLogs(histRes.data || []);
                setError(null);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    setError('Failed to load dashboard data. Please try again.');
                    console.error("Error fetching dashboard:", err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchData();

        return () => controller.abort();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><i className="fas fa-spinner fa-spin"></i> Loading Dashboard...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#C62828' }}><i className="fas fa-exclamation-circle"></i> {error}</div>;

    return (
        <div className="student-content-grid">
            <WelcomeBanner studentName={userData.first_name || userData.firstName} studentId={userData.tupm_id} />

            <StudentSummaryCards stats={{
                attendanceRate: dashboardData.attendance_rate || "0%",
                courses: dashboardData.enrolled_courses || 0,
                notifCount: (dashboardData.notifications || []).filter(n => !n.is_read).length
            }} />

            {/* NEW 2-COLUMN LAYOUT */}
            <div className="dashboard-main-layout">
                {/* LEFT: 70% Chart */}
                <div className="dashboard-left-column">
                    <AttendanceTrendChart logs={allLogs} />
                </div>

                {/* RIGHT: 30% Status & History */}
                <div className="dashboard-right-column">
                    <LiveClassStatus userId={userId} />
                    <StudentRecentAttendance logs={dashboardData.recent_attendance} />
                </div>
            </div>
        </div>
    );
};

export default StudentDashboardPage;