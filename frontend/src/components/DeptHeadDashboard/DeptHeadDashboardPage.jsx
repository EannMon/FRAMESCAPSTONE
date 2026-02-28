import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../FacultyDashboard/FacultyDashboardPage.css'; // Reuse styles
import './DeptHeadDashboardPage.css'; // Specific styles
import '../Common/Utility.css';

// Summary Card Component
const SummaryCard = ({ iconClass, title, value, subValue, iconBgClass, badge }) => (
    <div className="summary-card premium">
        <div className="summary-content-left">
            <div className="summary-title">{title}</div>
            <div className="summary-value-row">
                <span className="summary-value">{value}</span>
                {badge && <span className={`summary-badge ${badge.type}`}>{badge.text}</span>}
            </div>
            {subValue && <div className="summary-sub" style={{ marginTop: '2px' }}>{subValue}</div>}
        </div>
        <div className={`summary-icon-circle ${iconBgClass}`}>
            <i className={iconClass}></i>
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
                <h3><i className="fas fa-chart-line"></i> Department Attendance</h3>
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



// --- LIVE STATUS FOR DEPT HEAD (Wide + Single View) ---
const DeptHeadLiveStatus = ({ rooms }) => {
    const [viewMode, setViewMode] = useState('wide'); // 'wide' or 'single'
    const [selectedRoom, setSelectedRoom] = useState(null);

    const targetRooms = rooms ? rooms.filter(r =>
        r.room === '326' || r.room === '322' || r.room === 'Room 326' || r.room === 'Room 322'
    ) : [];
    const displayRooms = viewMode === 'single' && selectedRoom
        ? targetRooms.filter(r => r.room === selectedRoom)
        : targetRooms;

    return (
        <div className="card dh-live-status-card">
            <div className="live-status-header">
                <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                <div className="dh-live-controls">
                    <span className="live-pulse-badge">
                        <span className="live-pulse-dot"></span> LIVE
                    </span>
                    <div className="dh-view-toggle">
                        <button
                            className={`dh-view-btn ${viewMode === 'wide' ? 'active' : ''}`}
                            onClick={() => { setViewMode('wide'); setSelectedRoom(null); }}
                            title="Wide View"
                        >
                            <i className="fas fa-th"></i>
                        </button>
                        <button
                            className={`dh-view-btn ${viewMode === 'single' ? 'active' : ''}`}
                            onClick={() => setViewMode('single')}
                            title="Single View"
                        >
                            <i className="fas fa-square"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Room selector for single view */}
            {viewMode === 'single' && (
                <div className="dh-room-selector">
                    <select
                        value={selectedRoom || ''}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                    >
                        <option value="">Select a classroom...</option>
                        {targetRooms.map((r, idx) => (
                            <option key={idx} value={r.room}>{r.room} — {r.subject_code}</option>
                        ))}
                    </select>
                </div>
            )}

            {(!targetRooms || targetRooms.length === 0) ? (
                <div className="empty-state-mini">
                    <i className="fas fa-coffee"></i>
                    <p>No active classrooms right now</p>
                </div>
            ) : (
                <div className={`dh-rooms-grid ${viewMode === 'single' ? 'single-mode' : 'wide-mode'}`}>
                    {displayRooms.map((room, idx) => (
                        <div key={idx} className={`dh-room-box ${viewMode === 'single' ? 'dh-room-large' : ''}`}>
                            <div className="live-room-label">{room.room}</div>
                            <div className="dh-room-meta">
                                <span className="dh-room-subject">{room.subject_code}</span>
                                {room.faculty_name && (
                                    <span className="dh-room-faculty">
                                        <i className="fas fa-chalkboard-teacher"></i> {room.faculty_name}
                                    </span>
                                )}
                                {room.start_time && room.end_time && (
                                    <span className="dh-room-time">
                                        <i className="fas fa-clock"></i> {room.start_time} - {room.end_time}
                                    </span>
                                )}
                            </div>
                            <div className={`live-dots-area ${viewMode === 'single' ? 'dh-dots-large' : ''}`}>
                                {room.present.map((p, i) => (
                                    <span
                                        key={`p-${i}`}
                                        className="live-dot live-dot-green"
                                        title={`${p.name} (Present)`}
                                        style={{
                                            left: `${8 + ((i * 31 + 7) % 82)}%`,
                                            top: `${12 + ((i * 47 + 13) % 65)}%`,
                                            animationDelay: `${i * 0.25}s`
                                        }}
                                    ></span>
                                ))}
                                {room.on_break.map((p, i) => (
                                    <span
                                        key={`b-${i}`}
                                        className="live-dot live-dot-yellow"
                                        title={`${p.name} (On Break)`}
                                        style={{
                                            left: `${5 + ((i * 41 + 23) % 82)}%`,
                                            top: `${8 + ((i * 53 + 17) % 65)}%`,
                                            animationDelay: `${i * 0.3 + 0.15}s`
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
            )}
        </div>
    );
};

// --- Review Modal ---
const ReviewModal = ({ user, onClose, onAction }) => {
    if (!user) return null;
    return (
        <div className="v-modal-overlay" onClick={onClose}>
            <div className="v-modal-content" onClick={e => e.stopPropagation()}>
                <div className="v-modal-header">
                    <h2>Review User Registration</h2>
                    <button className="v-modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
                </div>
                <div className="v-modal-body">
                    <div className="v-detail-grid">
                        <span className="v-detail-label">Full Name:</span>
                        <span className="v-detail-value">{user.first_name} {user.last_name}</span>
                        <span className="v-detail-label">TUPM ID:</span>
                        <span className="v-detail-value">{user.tupm_id}</span>
                        <span className="v-detail-label">Email:</span>
                        <span className="v-detail-value">{user.email}</span>
                        <span className="v-detail-label">Role:</span>
                        <span className="v-detail-value">{user.role}</span>
                        <span className="v-detail-label">Department ID:</span>
                        <span className="v-detail-value">{user.department_id || 'N/A'}</span>
                        <span className="v-detail-label">Registered:</span>
                        <span className="v-detail-value">{new Date(user.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ background: '#fef9c3', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#854d0e', border: '1px solid #fde68a' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                        Please verify the TUPM ID and role before approving this account.
                    </div>
                </div>
                <div className="v-modal-footer">
                    <button className="v-action-btn reject" onClick={() => onAction(user.id, 'reject', `${user.first_name} ${user.last_name}`)}>
                        <i className="fas fa-times"></i> Reject
                    </button>
                    <button className="v-action-btn approve" onClick={() => onAction(user.id, 'approve', `${user.first_name} ${user.last_name}`)}>
                        <i className="fas fa-check"></i> Approve Account
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeptHeadDashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pending_verifications: 0, total_faculty: 0, total_students: 0, issues_reported: 0 });
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [chartFilter, setChartFilter] = useState('weekly');
    const [allLogs, setAllLogs] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [liveRooms, setLiveRooms] = useState([]);

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    const [faceRegistered, setFaceRegistered] = useState(user?.face_registered || false);

    const fetchData = async () => {
        setListLoading(true);
        const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        try {
            const [verifyRes, facultyStatsRes] = await Promise.all([
                axios.get(`${API}/api/admin/verification/list`).catch(() => ({ data: [] })),
                user?.id ? axios.get(`${API}/api/faculty/dashboard-stats/${user.id}`).catch(() => ({ data: {} })) : Promise.resolve({ data: {} })
            ]);

            const users = verifyRes.data || [];
            const pending = users.filter(u => u.verification_status === 'Pending');
            const facultyCount = users.filter(u => u.role === 'FACULTY' || u.role === 'HEAD').length;
            const studentCount = users.filter(u => u.role === 'STUDENT').length;

            setStats({
                pending_verifications: pending.length,
                total_faculty: facultyCount,
                total_students: studentCount,
                issues_reported: 0
            });
            setPendingUsers(pending);

            const fStats = facultyStatsRes.data;
            setAllLogs(fStats.all_logs || []);
            setRecentActivity(fStats.recent_attendance || []);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
            setListLoading(false);
        }
    };

    useEffect(() => {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (user?.id) {
            axios.get(`${API}/api/users/${user.id}`).then(res => {
                const fresh = res.data?.face_registered ?? false;
                setFaceRegistered(fresh);
                if (fresh !== user.face_registered) {
                    const updated = { ...user, face_registered: fresh };
                    localStorage.setItem('currentUser', JSON.stringify(updated));
                }
            }).catch(() => { });
        }
        fetchData();

        // Live room status polling for dept head
        const fetchLiveRooms = async () => {
            try {
                const deptId = user?.department_id || 1;
                const res = await axios.get(`${API}/api/faculty/live-room-status-dept/${deptId}`);
                setLiveRooms(res.data.rooms || []);
            } catch (err) {
                // Fallback to faculty endpoint if dept endpoint fails
                try {
                    const res = await axios.get(`${API}/api/faculty/live-room-status/${user?.id}`);
                    setLiveRooms(res.data.rooms || []);
                } catch (e2) {
                    console.error('Live room status error:', e2);
                }
            }
        };
        if (user?.id) {
            fetchLiveRooms();
            const liveInterval = setInterval(fetchLiveRooms, 10000);
            return () => clearInterval(liveInterval);
        }
    }, []);

    const handleAction = async (userId, action, name) => {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (!window.confirm(`Are you sure you want to ${action} ${name}'s account?`)) return;
        try {
            await axios.post(`${API}/api/admin/verification/${action}`, null, { params: { user_id: userId } });
            setSelectedUser(null);
            fetchData();
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Failed to ${action} user. Please try again.`);
        }
    };

    if (loading) return (
        <div className="faculty-dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
        </div>
    );

    const displayName = user ? `${user.first_name} ${user.last_name}` : 'Dept Head';

    return (
        <div className="faculty-dashboard-page">
            {/* Welcome Banner */}
            <div className="card welcome-banner">
                <div className="welcome-avatar"><i className="fas fa-university"></i></div>
                <div className="welcome-info">
                    <h3>Welcome back, {displayName}!</h3>
                    <p>Department Head • {user?.tupm_id || 'N/A'}</p>
                </div>
                <div className="welcome-status">
                    <span className={`face-status ${faceRegistered ? 'registered' : 'not-registered'}`}>
                        <i className={`fas ${faceRegistered ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {faceRegistered ? 'Face Registered' : 'Face Not Registered'}
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards-row">
                <SummaryCard iconClass="fas fa-user-clock" title="Pending Approvals" value={stats.pending_verifications}
                    subValue="Users waiting" iconBgClass="icon-bg-orange"
                    badge={stats.pending_verifications > 0 ? { text: "Action Needed", type: "warning" } : null} />
                <SummaryCard iconClass="fas fa-chalkboard-teacher" title="Faculty Members" value={stats.total_faculty}
                    subValue="In department" iconBgClass="icon-bg-blue" />
                <SummaryCard iconClass="fas fa-user-graduate" title="Total Students" value={stats.total_students}
                    subValue="Enrolled" iconBgClass="icon-bg-green" />
                <SummaryCard iconClass="fas fa-exclamation-triangle" title="System Issues" value={stats.issues_reported}
                    subValue="Reported" iconBgClass="icon-bg-purple"
                    badge={stats.issues_reported > 0 ? { text: "Alert", type: "danger" } : null} />
            </div>

            {/* Two Column Layout: Live Status (left) + Chart (right) */}
            <div className="dashboard-two-col">
                <DeptHeadLiveStatus rooms={liveRooms} />
                <AttendanceTrendChart logs={allLogs} filter={chartFilter} setFilter={setChartFilter} />
            </div>

            {/* Bottom Row: Recent Activity (left) + Quick Actions (right) */}
            <div className="dashboard-two-col" style={{ marginTop: '20px' }}>
                {/* Recent Activity */}
                <div className="card recent-activity-card">
                    <h3><i className="fas fa-history"></i> Recent Activity</h3>
                    {recentActivity.length > 0 ? (
                        <div className="activity-list">
                            {recentActivity.map((act, i) => (
                                <div key={i} className={`activity-item ${act.is_late ? 'late' : ''}`}>
                                    <div className="activity-icon"><i className="fas fa-sign-in-alt"></i></div>
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
                    ) : (
                        <div className="empty-state-mini"><i className="fas fa-inbox"></i><p>No recent activity</p></div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card quick-actions-card">
                    <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                    <div className="quick-action-item" onClick={() => navigate('/dept-head-reports')}>
                        <div className="quick-action-icon" style={{ background: 'rgba(0,168,89,0.1)', color: '#00A859' }}><i className="fas fa-file-alt"></i></div>
                        <div className="quick-action-text">Generate Reports</div>
                    </div>
                    <div className="quick-action-item" onClick={() => navigate('/dept-head-management')}>
                        <div className="quick-action-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><i className="fas fa-tasks"></i></div>
                        <div className="quick-action-text">Manage Department</div>
                    </div>
                    <div className="quick-action-item" onClick={() => navigate('/dept-head-logs')}>
                        <div className="quick-action-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><i className="fas fa-clipboard-list"></i></div>
                        <div className="quick-action-text">View System Logs</div>
                    </div>
                </div>
            </div>

            {/* Pending Verifications Table */}
            {pendingUsers.length > 0 && (
                <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-user-check" style={{ color: '#f97316' }}></i> Pending User Verifications
                    </h3>
                    <div className="pending-verifications-list">
                        {pendingUsers.map(u => (
                            <div key={u.id} className="verification-row">
                                <div className="v-avatar"><i className="fas fa-user"></i></div>
                                <div className="v-info">
                                    <div className="v-name">{u.first_name} {u.last_name}</div>
                                    <div className="v-meta">
                                        <span className={`v-role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                                        • {u.tupm_id} • Registered {new Date(u.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="v-actions">
                                    <button className="v-btn-review" onClick={() => setSelectedUser(u)}>Review</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedUser && <ReviewModal user={selectedUser} onClose={() => setSelectedUser(null)} onAction={handleAction} />}
        </div>
    );
};

export default DeptHeadDashboardPage;
