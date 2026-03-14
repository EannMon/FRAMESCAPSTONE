import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Common/ToastProvider';
import '../FacultyDashboard/FacultyDashboardPage.css';
import './DeptHeadDashboardPage.css';
import '../Common/Utility.css';

// Summary Card Component — clickable when onClick is provided
const SummaryCard = ({ iconClass, title, value, subValue, iconBgClass, badge, onClick }) => (
    <div className={`summary-card premium ${onClick ? 'clickable' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
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
const AttendanceTrendChart = ({ logs, filter, setFilter, trendView, setTrendView }) => {
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
            // Semestral view — show months for the current semester period
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

        // Return real data (zeros if no logs exist — never show fake data)
        return dataPoints;
    }, [logs, filter]);

    const viewLabels = { department: 'Department', faculty: 'Faculty', personal: 'Personal', classroom: 'Classroom' };
    const trendLabel = viewLabels[trendView] || 'Department';

    const insightText = useMemo(() => {
        const total = chartData.reduce((acc, curr) => acc + curr.present, 0);
        if (filter === 'semestral') return `${trendLabel}: ${total} attendances this semester.`;
        if (filter === 'monthly') return `${trendLabel}: ${total} attendance records this month.`;
        return `${trendLabel}: Last 7 days — ${total} present records.`;
    }, [chartData, filter, trendLabel]);

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
            <div className="trend-chart-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3><i className="fas fa-chart-line"></i> Attendance Trends</h3>
                <div className="chart-filters-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <select
                        value={trendView}
                        onChange={(e) => setTrendView(e.target.value)}
                        className="dh-filter-select"
                        style={{ minWidth: '160px' }}
                    >
                        <option value="department">Department</option>
                        <option value="faculty">Faculty</option>
                        <option value="personal">Personal</option>
                        <option value="classroom">Classroom</option>
                    </select>
                    <div className="filter-pill-group">
                        {['weekly', 'monthly', 'semestral'].map(t => (
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

            <div className="svg-chart-container dh-chart-container">
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



// --- LIVE STATUS FOR DEPT HEAD (3 views: Personal, Classroom, Department) ---
const DeptHeadLiveStatus = ({ rooms, personalStatus }) => {
    const [viewMode, setViewMode] = useState('wide'); // 'wide' or 'single'
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [statusView, setStatusView] = useState('department'); // 'personal', 'classroom', 'department'

    // Classroom = rooms the dept head personally teaches. Department = ALL rooms with active schedules
    // Since we pass all dept rooms, for "classroom" we can filter to only the current user's classes
    // For now, both classroom and department show the rooms data (classroom is a subset if needed)
    const displayRooms = viewMode === 'single' && selectedRoom
        ? rooms.filter(r => r.room === selectedRoom)
        : rooms;

    // Personal live status view (like student module)
    const renderPersonalStatus = () => {
        const ps = personalStatus || {};
        const status = ps.status || 'IDLE';
        const statusColor = ps.status_color || 'grey';
        const statusText = ps.status_text || 'No activity today';
        const roomName = ps.room || '---';

        return (
            <div className="personal-live-status-body">
                <div className="live-header live-header-flex">
                    <div className="live-indicator live-indicator-flex">
                        <span className="blink-dot" style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block',
                            backgroundColor: statusColor, animation: status !== 'IDLE' && status !== 'EXITED' ? 'blink 1.5s infinite' : 'none' 
                        }}></span>
                        <span className="live-status-label" style={{ '--status-color': statusColor }}>{status}</span>
                    </div>
                </div>
                <div className={`room-display room-display-${status.toLowerCase()}`}>
                    <i className={`fas fa-chalkboard-teacher room-icon-large ${status === 'PRESENT' ? 'active' : 'inactive'}`} style={{ '--active-color': statusColor }}></i>
                    <div className="room-details">
                        <h4 className="room-name">{roomName}</h4>
                        <p className="room-status-text">{statusText}</p>
                        {ps.subject_code && (
                            <p className="room-subject-info">
                                <i className="fas fa-book"></i>
                                {ps.subject_code}{ps.subject_title ? ` — ${ps.subject_title}` : ''}
                            </p>
                        )}
                        {ps.last_timestamp && (
                            <p className="room-timestamp">
                                <i className="fas fa-clock"></i>
                                Last: {new Date(ps.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card dh-live-status-card">
            <div className="live-status-header">
                <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                <div className="dh-live-controls">
                    <select
                        className="dh-filter-select"
                        value={statusView}
                        onChange={(e) => setStatusView(e.target.value)}
                    >
                        <option value="personal">Personal</option>
                        <option value="classroom">Classroom</option>
                        <option value="department">Department</option>
                    </select>
                    <span className="live-pulse-badge">
                        <span className="live-pulse-dot"></span> LIVE
                    </span>
                    {statusView !== 'personal' && (
                        <>
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
                            {viewMode === 'single' && (
                                <div className="dh-room-selector">
                                    <select
                                        value={selectedRoom || ''}
                                        onChange={(e) => setSelectedRoom(e.target.value)}
                                    >
                                        <option value="">Select a classroom...</option>
                                        {rooms.map((r, idx) => (
                                            <option key={idx} value={r.room}>{r.room} — {r.subject_code}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {statusView === 'personal' ? (
                renderPersonalStatus()
            ) : (
                <>
                    {(!rooms || rooms.length === 0) ? (
                        <div className="empty-state-mini">
                            <i className="fas fa-coffee"></i>
                            <p>No active classrooms right now</p>
                        </div>
                    ) : (
                        <div className={`dh-rooms-grid ${viewMode === 'single' ? 'single-mode' : 'wide-mode'} dh-live-scrollable`}>
                            {displayRooms.map((room, idx) => (
                                <div key={idx} className={`dh-room-box ${viewMode === 'single' ? 'dh-room-large' : ''} ${room.is_overcrowded ? 'dh-room-overcrowded' : ''}`}>
                                    <div className="live-room-label">
                                        {room.room}
                                        {room.is_overcrowded && (
                                            <span className="overcrowding-badge" title={`Capacity: ${room.room_capacity}`}>
                                                <i className="fas fa-exclamation-triangle"></i> OVERCROWDED
                                            </span>
                                        )}
                                    </div>
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
                                        {room.room_capacity && (
                                            <span className={`live-count-capacity ${room.is_overcrowded ? 'overcrowded' : ''}`}>
                                                <i className="fas fa-users"></i> {room.present_count}/{room.room_capacity}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};



const DeptHeadDashboardPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [stats, setStats] = useState({ total_faculty: 0, total_students: 0, issues_reported: 0 });
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [chartFilter, setChartFilter] = useState('weekly');
    const [trendView, setTrendView] = useState('department');
    const [allLogs, setAllLogs] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [liveRooms, setLiveRooms] = useState([]);
    const [personalStatus, setPersonalStatus] = useState(null);

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    const [faceRegistered, setFaceRegistered] = useState(user?.face_registered || false);

    const fetchData = async (signal) => {
        setListLoading(true);
        try {
            const [facultyStatsRes] = await Promise.all([
                user?.id ? api.get(`/api/faculty/dashboard-stats/${user.id}`, { signal }).catch(() => ({ data: {} })) : Promise.resolve({ data: {} })
            ]);

            const fStats = facultyStatsRes.data;
            // Note: Since we don't fetch users from verification list here anymore, 
            // stats for total faculty and students should optimally come from facultyStatsRes
            // For now, if default stats don't contain it, we fallback to 0.
            
            setStats({
                total_faculty: fStats.total_faculty || 0,
                total_students: fStats.total_students || 0,
                total_teaching_students: fStats.total_teaching_students || 0,
                issues_reported: 0
            });

            setAllLogs(fStats.all_logs || []);
            setRecentActivity(fStats.recent_attendance || []);
        } catch (error) {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error("Error fetching dashboard data:", error);
            }
        } finally {
            if (!signal || !signal.aborted) {
                setLoading(false);
                setListLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        let liveInterval = null;

        if (user?.id) {
            api.get(`/api/users/${user.id}`, { signal: controller.signal }).then(res => {
                const fresh = res.data?.face_registered ?? false;
                setFaceRegistered(fresh);
                if (fresh !== user.face_registered) {
                    const updated = { ...user, face_registered: fresh };
                    localStorage.setItem('currentUser', JSON.stringify(updated));
                }
            }).catch((err) => {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    // silently ignore
                }
            });
        }
        fetchData(controller.signal);

        // Live room status + personal status polling for dept head
        const fetchLiveData = async () => {
            try {
                const deptId = user?.department_id || 1;
                const [deptRes, personalRes] = await Promise.all([
                    api.get(`/api/faculty/live-room-status-dept/${deptId}`, { signal: controller.signal })
                        .catch(() => api.get(`/api/faculty/live-room-status/${user?.id}`, { signal: controller.signal }).catch(() => ({ data: { rooms: [] } }))),
                    api.get(`/api/faculty/personal-live-status/${user?.id}`, { signal: controller.signal }).catch(() => ({ data: null })),
                ]);
                setLiveRooms(deptRes.data.rooms || []);
                setPersonalStatus(personalRes.data);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    console.error('Live status error:', err);
                }
            }
        };
        if (user?.id) {
            fetchLiveData();
            liveInterval = setInterval(fetchLiveData, 10000);
        }

        return () => {
            controller.abort();
            if (liveInterval) clearInterval(liveInterval);
        };
    }, []);



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
                    <p>Department Head • {user?.college_name || 'COS'}</p>
                </div>
                <div className="welcome-status">
                    <span className={`face-status ${faceRegistered ? 'registered' : 'not-registered'}`}>
                        <i className={`fas ${faceRegistered ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {faceRegistered ? 'Face Registered' : 'Face Not Registered'}
                    </span>
                </div>
            </div>

            {/* Face Registration Required Gate */}
            {!faceRegistered && (
                <div className="card face-registration-warning">
                    <i className="fas fa-exclamation-triangle warning-icon"></i>
                    <div className="warning-content">
                        <div className="warning-title">
                            Face Registration Required
                        </div>
                        <p className="warning-message">
                            FRAMES requires facial recognition enrollment before you can fully access the system.
                            Please visit a registration kiosk or use the face enrollment feature in <strong>Settings</strong> to register your face.
                            Dashboard features are limited until registration is complete.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/head-settings')}
                        className="warning-action-btn"
                    >
                        Go to Settings
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="summary-cards-row dh-summary-cards-row">
                <SummaryCard iconClass="fas fa-chalkboard-teacher" title="Faculty Members" value={stats.total_faculty}
                    subValue="In department" iconBgClass="icon-bg-blue"
                    onClick={() => navigate('/dept-head-users')} />
                <SummaryCard iconClass="fas fa-user-graduate" title="Total Students" value={stats.total_students}
                    subValue="In department" iconBgClass="icon-bg-green"
                    onClick={() => navigate('/dept-head-users')} />
                <SummaryCard iconClass="fas fa-chalkboard" title="My Students" value={stats.total_teaching_students || 0}
                    subValue="Teaching" iconBgClass="icon-bg-purple"
                    onClick={() => navigate('/dept-head-my-classes')} />
            </div>

            {/* Lower Section: 50:50 Layout */}
            <div className="dh-lower-layout" style={{ marginTop: '20px' }}>
                {/* Left Column: Live Status */}
                <DeptHeadLiveStatus rooms={liveRooms} personalStatus={personalStatus} />
                
                {/* Right Column: Trends + Recent Activity */}
                <AttendanceTrendChart logs={allLogs} filter={chartFilter} setFilter={setChartFilter} trendView={trendView} setTrendView={setTrendView} />
                    
                {/* Recent Activity */}
                <div className="card recent-activity-card dh-recent-activity">
                    <h3><i className="fas fa-history"></i> Recent Activity</h3>
                    {recentActivity.length > 0 ? (
                        <div className="activity-list dh-activity-scrollable">
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
            </div>
        </div>
    );
};

export default DeptHeadDashboardPage;
