import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FacultyDashboardPage.css';
import '../Common/Utility.css';

// --- COMPONENTS ---

const WelcomeBanner = ({ facultyName, facultyId, faceRegistered }) => (
    <div className="card welcome-banner">
        <div className="welcome-avatar">
            <i className="fas fa-chalkboard-teacher"></i>
        </div>
        <div className="welcome-info">
            <h3>Welcome back, {facultyName}!</h3>
            <p>Faculty ID: {facultyId}</p>
        </div>
        <div className="welcome-status">
            <span className={`face-status ${faceRegistered ? 'registered' : 'not-registered'}`}>
                <i className={`fas ${faceRegistered ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                {faceRegistered ? 'Face Registered' : 'Face Not Registered'}
            </span>
        </div>
    </div>
);

const FacultySummaryCard = ({ iconClass, title, value, subValue, subValueColor, iconBgClass, badge }) => (
    <div className="summary-card premium">
        <div className="summary-content-left">
            <div className="summary-title">{title}</div>
            <div className="summary-value-row">
                <span className="summary-value">{value}</span>
                {subValue && <span className="summary-sub" style={{ color: subValueColor || '#888' }}>{subValue}</span>}
            </div>
        </div>
        <div className={`summary-icon-circle ${iconBgClass || ''}`}>
            <i className={iconClass}></i>
            {badge && <span className="summary-badge">{badge}</span>}
        </div>
    </div>
);

// --- SVG LINE CHART (Student-style) ---
const AttendanceTrendChart = ({ logs, filter, setFilter }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [typeFilter, setTypeFilter] = useState('ALL');

    const chartData = useMemo(() => {
        const safeLogs = logs || [];
        const now = new Date();
        const dataPoints = [];

        if (filter === 'weekly') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dayStr = days[d.getDay()];
                const dateStr = d.toLocaleDateString();
                const dayLogs = safeLogs.filter(l => new Date(l.timestamp).toLocaleDateString() === dateStr);
                dataPoints.push({
                    label: dayStr,
                    present: dayLogs.filter(l => !l.is_late && (l.event_type === 'entry' || l.event_type === 'attendance_in')).length,
                    late: dayLogs.filter(l => l.is_late).length,
                    break: dayLogs.filter(l => l.event_type && l.event_type.includes('break')).length,
                    total: dayLogs.length
                });
            }
        } else if (filter === 'monthly') {
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
                    return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() >= q.start && d.getDate() <= q.end;
                });
                dataPoints.push({
                    label: q.label,
                    present: qLogs.filter(l => !l.is_late && (l.event_type === 'entry' || l.event_type === 'attendance_in')).length,
                    late: qLogs.filter(l => l.is_late).length,
                    break: qLogs.filter(l => l.event_type && l.event_type.includes('break')).length,
                    total: qLogs.length
                });
            });
        } else {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentYear = now.getFullYear();
            months.forEach((m, idx) => {
                const mLogs = safeLogs.filter(l => {
                    const d = new Date(l.timestamp);
                    return d.getFullYear() === currentYear && d.getMonth() === idx;
                });
                dataPoints.push({
                    label: m,
                    present: mLogs.filter(l => !l.is_late && (l.event_type === 'entry' || l.event_type === 'attendance_in')).length,
                    late: mLogs.filter(l => l.is_late).length,
                    break: mLogs.filter(l => l.event_type && l.event_type.includes('break')).length,
                    total: mLogs.length
                });
            });
        }

        if (safeLogs.length === 0) {
            if (filter === 'yearly') {
                return dataPoints.map(d => ({ ...d, present: Math.floor(Math.random() * 30) + 20, late: Math.floor(Math.random() * 8), break: Math.floor(Math.random() * 10) }));
            } else if (filter === 'monthly') {
                return dataPoints.map(d => ({ ...d, present: Math.floor(Math.random() * 10) + 5, late: Math.floor(Math.random() * 3), break: Math.floor(Math.random() * 5) }));
            }
            return dataPoints.map(d => ({ ...d, present: Math.floor(Math.random() * 5) + 1, late: Math.floor(Math.random() * 2), break: Math.floor(Math.random() * 2) }));
        }
        return dataPoints;
    }, [logs, filter]);

    const insightText = useMemo(() => {
        const total = chartData.reduce((acc, curr) => acc + curr.present, 0);
        if (filter === 'yearly') return `Total ${total} attendances recorded this year.`;
        if (filter === 'monthly') return `${total} attendance records this month.`;
        return `Last 7 days: ${total} present records.`;
    }, [chartData, filter]);

    const height = 300;
    const width = 800;
    const padding = 50;
    const rawMax = Math.max(...chartData.map(d => Math.max(d.present, d.late, d.break)), 5);
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

    const colors = { present: '#2E7D32', late: '#C62828', break: '#F9A825' };

    return (
        <div className="card attendance-trend-chart-card">
            <div className="trend-chart-header">
                <h3><i className="fas fa-chart-line"></i> Attendance Trends</h3>
                <div className="chart-filters-group">
                    <div className="filter-pill-group">
                        {['weekly', 'monthly', 'yearly'].map(t => (
                            <button key={t} className={`filter-pill ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="type-filter-bar">
                {['ALL', 'PRESENT', 'LATE', 'BREAK'].map(t => (
                    <button key={t} className={`type-text-btn ${typeFilter === t ? 'active-type' : ''}`} onClick={() => setTypeFilter(t)}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="svg-chart-container" style={{ height: '220px' }}>
                <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
                    <defs>
                        <linearGradient id="fGradPresent" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.present} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.present} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="fGradLate" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.late} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.late} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="fGradBreak" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.break} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.break} stopOpacity="0" />
                        </linearGradient>
                        <filter id="fLineShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                        <filter id="fTooltipShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
                        </filter>
                    </defs>

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
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" strokeWidth="2" strokeLinecap="round" />

                    {(typeFilter === 'ALL' || typeFilter === 'LATE') &&
                        <path d={`${makePath('late')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#fGradLate)" stroke="none" />}
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') &&
                        <path d={`${makePath('break')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#fGradBreak)" stroke="none" />}
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') &&
                        <path d={`${makePath('present')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#fGradPresent)" stroke="none" />}

                    {(typeFilter === 'ALL' || typeFilter === 'LATE') &&
                        <path d={makePath('late')} fill="none" stroke={colors.late} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#fLineShadow)" />}
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') &&
                        <path d={makePath('break')} fill="none" stroke={colors.break} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />}
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') &&
                        <path d={makePath('present')} fill="none" stroke={colors.present} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#fLineShadow)" />}

                    {chartData.map((d, i) => {
                        const { x: xp, y: yp } = getCoords(d.present, i);
                        const { x: xl, y: yl } = getCoords(d.late, i);
                        const { x: xb, y: yb } = getCoords(d.break, i);
                        return (
                            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                                <rect x={xp - (width / chartData.length / 2)} y={0} width={width / chartData.length} height={height} fill="transparent" />
                                <text x={xp} y={height - 15} textAnchor="middle" fill="#777" fontSize="12" fontWeight="500">{d.label}</text>
                                {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && <circle cx={xp} cy={yp} r="4" fill={colors.present} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'LATE') && <circle cx={xl} cy={yl} r="4" fill={colors.late} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'BREAK') && <circle cx={xb} cy={yb} r="4" fill={colors.break} stroke="#fff" strokeWidth="2" />}
                                {hoveredIndex === i && (
                                    <g transform={`translate(${xp}, 20)`}>
                                        <rect x="-60" y="-10" width="120" height="70" rx="5" fill="rgba(255,255,255,0.95)" filter="url(#fTooltipShadow)" stroke="#eee" />
                                        <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">{d.label}</text>
                                        <rect x="-50" y="18" width="8" height="8" rx="2" fill={colors.present} />
                                        <text x="-38" y="26" textAnchor="start" fontSize="10" fill="#555">Present: {d.present}</text>
                                        <rect x="10" y="18" width="8" height="8" rx="2" fill={colors.late} />
                                        <text x="22" y="26" textAnchor="start" fontSize="10" fill="#555">Late: {d.late}</text>
                                        <rect x="-50" y="32" width="8" height="8" rx="2" fill={colors.break} />
                                        <text x="-38" y="40" textAnchor="start" fontSize="10" fill="#555">Break: {d.break}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="chart-footer">
                <div className="chart-insight"><i className="fas fa-lightbulb"></i> {insightText}</div>
                <div className="chart-legends">
                    <div className="legend-item"><span className="dot" style={{ background: colors.present }}></span> Present</div>
                    <div className="legend-item"><span className="dot" style={{ background: colors.late }}></span> Late</div>
                    <div className="legend-item"><span className="dot" style={{ background: colors.break }}></span> Break</div>
                </div>
            </div>
        </div>
    );
};










// --- LIVE STATUS WITH DOTS ---
const LiveRoomStatus = ({ rooms }) => {
    if (!rooms || rooms.length === 0) {
        return (
            <div className="card live-status-card">
                <div className="live-status-header">
                    <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                    <span className="live-pulse-badge">
                        <span className="live-pulse-dot"></span> LIVE
                    </span>
                </div>
                <div className="empty-state-mini">
                    <i className="fas fa-coffee"></i>
                    <p>No active classrooms right now</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card live-status-card">
            <div className="live-status-header">
                <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                <span className="live-pulse-badge">
                    <span className="live-pulse-dot"></span> LIVE
                </span>
            </div>
            <div className="live-rooms-container">
                {rooms.map((room, idx) => (
                    <div key={idx} className="live-room-box">
                        <div className="live-room-label">{room.room}</div>
                        <div className="live-room-subject">{room.subject_code}</div>
                        <div className="live-dots-area">
                            {/* Green dots for present people */}
                            {room.present.map((p, i) => (
                                <span
                                    key={`p-${i}`}
                                    className="live-dot live-dot-green"
                                    title={`${p.name} (Present)`}
                                    style={{
                                        left: `${10 + ((i * 37) % 80)}%`,
                                        top: `${15 + ((i * 53) % 60)}%`,
                                        animationDelay: `${i * 0.3}s`
                                    }}
                                ></span>
                            ))}
                            {/* Yellow dots for on-break people */}
                            {room.on_break.map((p, i) => (
                                <span
                                    key={`b-${i}`}
                                    className="live-dot live-dot-yellow"
                                    title={`${p.name} (On Break)`}
                                    style={{
                                        left: `${5 + ((i * 43 + 20) % 80)}%`,
                                        top: `${10 + ((i * 47 + 30) % 60)}%`,
                                        animationDelay: `${i * 0.4 + 0.2}s`
                                    }}
                                ></span>
                            ))}
                            {room.present_count === 0 && room.break_count === 0 && (
                                <div className="live-dots-empty">No one detected</div>
                            )}
                        </div>
                        <div className="live-room-counts">
                            <span className="live-count-present">
                                <span className="live-dot-inline live-dot-green"></span>
                                {room.present_count} Present
                            </span>
                            <span className="live-count-break">
                                <span className="live-dot-inline live-dot-yellow"></span>
                                {room.break_count} On Break
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};



// --- RECENT ACTIVITY ---
const RecentActivity = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="card recent-activity-card">
                <h3><i className="fas fa-history"></i> Recent Activity</h3>
                <div className="empty-state-mini">
                    <i className="fas fa-inbox"></i>
                    <p>No recent attendance activity</p>
                </div>
            </div>
        );
    }

    const getEventIcon = (type) => {
        switch (type) {
            case 'entry': return 'fa-sign-in-alt';
            case 'exit': return 'fa-sign-out-alt';
            case 'break_out': return 'fa-coffee';
            case 'break_in': return 'fa-undo';
            default: return 'fa-circle';
        }
    };

    return (
        <div className="card recent-activity-card">
            <h3><i className="fas fa-history"></i> Recent Activity</h3>
            <div className="activity-list">
                {activities.map((act, i) => (
                    <div key={i} className={`activity-item ${act.is_late ? 'late' : ''}`}>
                        <div className="activity-icon">
                            <i className={`fas ${getEventIcon(act.event_type)}`}></i>
                        </div>
                        <div className="activity-details">
                            <strong>{act.student_name}</strong>
                            <span>{act.subject_code} • {act.room_name || 'N/A'}</span>
                        </div>
                        <div className="activity-time">
                            <span>{act.time}</span>
                            {act.is_late && <span className="late-badge">LATE</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- QUICK ACTIONS ---
const QuickActions = ({ navigate }) => {
    return (
        <div className="card quick-actions-card">
            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
            <div className="quick-action-item" onClick={() => navigate('/faculty-reports')}>
                <div className="quick-action-icon" style={{ background: 'rgba(0,168,89,0.1)', color: '#00A859' }}>
                    <i className="fas fa-file-pdf"></i>
                </div>
                <div className="quick-action-text">Download Reports</div>
            </div>
            <div className="quick-action-item" onClick={() => navigate('/faculty-classes')}>
                <div className="quick-action-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                    <i className="fas fa-chalkboard"></i>
                </div>
                <div className="quick-action-text">My Classes</div>
            </div>
            <div className="quick-action-item" onClick={() => navigate('/faculty-attendance')}>
                <div className="quick-action-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                    <i className="fas fa-clipboard-list"></i>
                </div>
                <div className="quick-action-text">View Attendance</div>
            </div>
        </div>
    );
};


// ============================================
// MAIN DASHBOARD PAGE
// ============================================
const FacultyDashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [liveRooms, setLiveRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartFilter, setChartFilter] = useState('weekly');

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    // Live face_registered check from API
    const [faceRegistered, setFaceRegistered] = useState(user?.face_registered || false);

    useEffect(() => {
        if (!user?.id) return;
        const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Refresh face_registered from DB
        axios.get(`${API}/api/users/${user.id}`).then(res => {
            const fresh = res.data?.face_registered ?? false;
            setFaceRegistered(fresh);
            // Update localStorage too
            if (fresh !== user.face_registered) {
                const updated = { ...user, face_registered: fresh };
                localStorage.setItem('currentUser', JSON.stringify(updated));
            }
        }).catch(() => { });

        const fetchData = async () => {
            try {
                const [statsRes, schedRes] = await Promise.all([
                    axios.get(`${API}/api/faculty/dashboard-stats/${user.id}`),
                    axios.get(`${API}/api/faculty/schedule/${user.id}`).catch(() => ({ data: [] }))
                ]);
                setStats(statsRes.data);
                setSchedule(schedRes.data || []);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Live room status polling
        const fetchLiveRooms = async () => {
            try {
                const res = await axios.get(`${API}/api/faculty/live-room-status/${user.id}`);
                setLiveRooms(res.data.rooms || []);
            } catch (err) {
                console.error('Live room status error:', err);
            }
        };
        fetchLiveRooms();
        const liveInterval = setInterval(fetchLiveRooms, 10000); // Poll every 10s

        return () => clearInterval(liveInterval);
    }, [user]);

    if (loading) {
        return (
            <div className="faculty-dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const displayName = user ? `${user.first_name} ${user.last_name}` : 'Faculty';
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div className="faculty-dashboard-page">
            {/* Welcome Banner */}
            <WelcomeBanner
                facultyName={displayName}
                facultyId={user?.tupm_id || 'N/A'}
                faceRegistered={faceRegistered}
            />

            {/* Summary Cards */}
            <div className="summary-cards-row">
                <FacultySummaryCard
                    iconClass="fas fa-calendar-day"
                    title="Today's Classes"
                    value={stats?.todays_classes ?? 0}
                    subValue={todayName}
                    iconBgClass="icon-bg-blue"
                />
                <FacultySummaryCard
                    iconClass="fas fa-percentage"
                    title="Avg Attendance"
                    value={`${stats?.average_attendance ?? 0}%`}
                    subValue={stats?.average_attendance >= 80 ? '↑ Good' : stats?.average_attendance > 0 ? '↓ Needs Improvement' : 'No Data'}
                    subValueColor={stats?.average_attendance >= 80 ? '#00A859' : '#ef4444'}
                    iconBgClass="icon-bg-green"
                />
                <FacultySummaryCard
                    iconClass="fas fa-chalkboard"
                    title="Active Classes"
                    value={stats?.total_classes ?? 0}
                    subValue="This Semester"
                    iconBgClass="icon-bg-purple"
                />
                <FacultySummaryCard
                    iconClass="fas fa-user-graduate"
                    title="Total Students"
                    value={stats?.total_students ?? 0}
                    subValue="Enrolled"
                    iconBgClass="icon-bg-orange"
                />
            </div>

            {/* Two Column Layout: Live Status (left) + Chart (right) */}
            <div className="dashboard-two-col">
                <LiveRoomStatus rooms={liveRooms} />
                <AttendanceTrendChart
                    logs={stats?.all_logs || []}
                    filter={chartFilter}
                    setFilter={setChartFilter}
                />
            </div>

            {/* Bottom Row: Recent Activity (left) + Quick Actions (right) */}
            <div className="dashboard-two-col">
                <RecentActivity activities={stats?.recent_attendance || []} />
                <QuickActions navigate={navigate} />
            </div>
        </div>
    );
};

export default FacultyDashboardPage;
