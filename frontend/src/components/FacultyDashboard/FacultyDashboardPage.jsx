import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './FacultyDashboardPage.css';
import '../Common/Utility.css';

// --- COMPONENTS ---

const WelcomeBanner = ({ facultyName, facultyId, faceRegistered, todayName, todayDate }) => (
    <div className="fd-hero-banner">
        {/* Decorative shapes */}
        <div className="fd-hero-shape fd-hero-shape-1"></div>
        <div className="fd-hero-shape fd-hero-shape-2"></div>
        <div className="fd-hero-shape fd-hero-shape-3"></div>

        <div className="fd-hero-content">
            <div className="fd-hero-left">
                <div className="fd-hero-text">
                    <p className="fd-hero-greeting">Welcome back,</p>
                    <h2 className="fd-hero-name">{facultyName}</h2>
                    <p className="fd-hero-id">Employee ID: {facultyId}</p>
                </div>
            </div>
            <div className="fd-hero-right">
                <span className={`fd-face-badge ${faceRegistered ? 'registered' : 'not-registered'}`}>
                    <i className={`fas ${faceRegistered ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    {faceRegistered ? 'Face Registered' : 'Face Not Registered'}
                </span>
            </div>
        </div>
    </div>
);

const FacultyStatItem = ({ title, value, subValue, subValueColor }) => (
    <div className="fd-ribbon-item">
        <span className="fd-ribbon-label">{title}</span>
        <span className="fd-ribbon-value">{value}</span>
        {subValue && <span className="fd-ribbon-sub" style={{ color: subValueColor || '#64748b' }}>{subValue}</span>}
    </div>
);

// --- SVG LINE CHART ---
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

        return dataPoints;
    }, [logs, filter]);

    const trendLabel = trendView === 'personal' ? 'Personal' : 'Classroom';

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
        <div className="fd-card fd-chart-card">
            <div className="fd-card-header">
                <h3>Attendance Trends</h3>
                <div className="fd-chart-controls">
                    <select
                        value={trendView}
                        onChange={(e) => setTrendView(e.target.value)}
                        className="fd-select"
                    >
                        <option value="personal">Personal</option>
                        <option value="classroom">Classroom</option>
                    </select>
                    <div className="fd-pill-group">
                        {['weekly', 'monthly', 'semestral'].map(t => (
                            <button key={t} className={`fd-pill ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fd-type-filter-bar">
                {['ALL', 'PRESENT', 'LATE', 'BREAK'].map(t => (
                    <button key={t} className={`fd-type-btn ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                        {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <div className="fd-svg-container">
                <svg viewBox={`0 0 ${width} ${height}`} className="fd-trend-svg">
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
                            <React.Fragment key={i}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--chart-grid, #e2e8f0)" strokeDasharray="5,5" />
                                <text x={padding - 10} y={y + 5} textAnchor="end" fontSize="11" fill="var(--chart-text, #64748b)" fontWeight="500">{val}</text>
                            </React.Fragment>
                        );
                    })}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--chart-axis, #cbd5e1)" strokeWidth="2" strokeLinecap="round" />

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
                                <text x={xp} y={height - 15} textAnchor="middle" fill="var(--chart-text, #64748b)" fontSize="12" fontWeight="500">{d.label}</text>

                                {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && <circle cx={xp} cy={yp} r="4" fill={colors.present} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'LATE') && <circle cx={xl} cy={yl} r="4" fill={colors.late} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'BREAK') && <circle cx={xb} cy={yb} r="4" fill={colors.break} stroke="#fff" strokeWidth="2" />}
                                {hoveredIndex === i && (
                                    <g transform={`translate(${xp}, 20)`}>
                                        <rect x="-60" y="-10" width="120" height="70" rx="5" fill="var(--chart-tooltip-bg, white)" filter="url(#fTooltipShadow)" stroke="var(--chart-tooltip-border, #e2e8f0)" />
                                        <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--chart-tooltip-text, #0F172A)">{d.label}</text>
                                        <rect x="-50" y="18" width="8" height="8" rx="2" fill={colors.present} />
                                        <text x="-38" y="26" textAnchor="start" fontSize="10" fill="var(--chart-text, #64748b)">Present: {d.present}</text>
                                        <rect x="10" y="18" width="8" height="8" rx="2" fill={colors.late} />
                                        <text x="22" y="26" textAnchor="start" fontSize="10" fill="var(--chart-text, #64748b)">Late: {d.late}</text>
                                        <rect x="-50" y="32" width="8" height="8" rx="2" fill={colors.break} />
                                        <text x="-38" y="40" textAnchor="start" fontSize="10" fill="var(--chart-text, #64748b)">Break: {d.break}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="fd-chart-footer">
                <div className="fd-chart-insight">{insightText}</div>
                <div className="fd-chart-legends">
                    <div className="fd-legend-item"><span className="fd-legend-dot" style={{ background: colors.present }}></span> Present</div>
                    <div className="fd-legend-item"><span className="fd-legend-dot" style={{ background: colors.late }}></span> Late</div>
                    <div className="fd-legend-item"><span className="fd-legend-dot" style={{ background: colors.break }}></span> Break</div>
                </div>
            </div>
        </div>
    );
};

// --- LIVE STATUS WITH DOTS ---
const LiveRoomStatus = ({ rooms, personalStatus }) => {
    const [viewMode, setViewMode] = useState('wide');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [statusView, setStatusView] = useState('classroom');

    const displayRooms = viewMode === 'single' && selectedRoom
        ? rooms.filter(r => r.room === selectedRoom)
        : rooms;

    const renderPersonalStatus = () => {
        const ps = personalStatus || {};
        const status = ps.status || 'IDLE';
        const statusColor = ps.status_color || 'grey';
        const statusText = ps.status_text || 'No activity today';
        const roomName = ps.room || '---';

        return (
            <div className="fd-personal-status">
                <div className="fd-personal-indicator">
                    <span className="fd-blink-dot" style={{
                        backgroundColor: statusColor,
                        animation: status !== 'IDLE' && status !== 'EXITED' ? 'blink 1.5s infinite' : 'none'
                    }}></span>
                    <span className="fd-status-label" style={{ color: statusColor }}>{status}</span>
                </div>
                <div className={`fd-room-display fd-room-${status.toLowerCase()}`}>
                    <i className={`fas fa-chalkboard-teacher fd-room-icon ${status === 'PRESENT' ? 'active' : 'inactive'}`} style={{ '--active-color': statusColor }}></i>
                    <div className="fd-room-details">
                        <h4>{roomName}</h4>
                        <p className="fd-room-status-text">{statusText}</p>
                        {ps.subject_code && (
                            <p className="fd-room-subject">
                                <i className="fas fa-book"></i>
                                {ps.subject_code}{ps.subject_title ? ` — ${ps.subject_title}` : ''}
                            </p>
                        )}
                        {ps.last_timestamp && (
                            <p className="fd-room-time">
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
        <div className="fd-card fd-live-card">
            <div className="fd-card-header">
                <h3>Live Status</h3>
                <div className="fd-live-controls">
                    <select className="fd-select" value={statusView} onChange={(e) => setStatusView(e.target.value)}>
                        <option value="personal">Personal</option>
                        <option value="classroom">Classroom</option>
                    </select>
                    <span className="fd-live-badge">
                        <span className="fd-live-pulse"></span> LIVE
                    </span>
                    {statusView === 'classroom' && (
                        <>
                            <div className="fd-view-toggle">
                                <button className={`fd-view-btn ${viewMode === 'wide' ? 'active' : ''}`} onClick={() => { setViewMode('wide'); setSelectedRoom(null); }} title="Wide View">
                                    <i className="fas fa-th"></i>
                                </button>
                                <button className={`fd-view-btn ${viewMode === 'single' ? 'active' : ''}`} onClick={() => setViewMode('single')} title="Single View">
                                    <i className="fas fa-square"></i>
                                </button>
                            </div>
                            {viewMode === 'single' && (
                                <select className="fd-select" value={selectedRoom || ''} onChange={(e) => setSelectedRoom(e.target.value)}>
                                    <option value="">Select a classroom...</option>
                                    {rooms.map((r, idx) => (
                                        <option key={idx} value={r.room}>{r.room} — {r.subject_code}</option>
                                    ))}
                                </select>
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
                        <div className="fd-empty-state">
                            <p>No active classrooms right now</p>
                        </div>
                    ) : (
                        <div className={`fd-rooms-grid ${viewMode === 'single' ? 'single-mode' : 'wide-mode'}`}>
                            {displayRooms.map((room, idx) => (
                                <div key={idx} className={`fd-room-box ${viewMode === 'single' ? 'fd-room-large' : ''} ${room.is_overcrowded ? 'fd-room-overcrowded' : ''}`}>
                                    <div className="fd-room-label">
                                        {room.room}
                                        {room.is_overcrowded && (
                                            <span className="fd-overcrowd-badge">
                                                <i className="fas fa-exclamation-triangle"></i> OVERCROWDED
                                            </span>
                                        )}
                                    </div>
                                    <div className="fd-room-meta">
                                        <span className="fd-room-subject-tag">{room.subject_code}</span>
                                        {room.faculty_name && (
                                            <span className="fd-room-faculty">
                                                <i className="fas fa-chalkboard-teacher"></i> {room.faculty_name}
                                            </span>
                                        )}
                                        {room.start_time && room.end_time && (
                                            <span className="fd-room-time-tag">
                                                <i className="fas fa-clock"></i> {room.start_time} - {room.end_time}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`fd-dots-area ${viewMode === 'single' ? 'fd-dots-large' : ''}`}>
                                        {room.present.map((p, i) => (
                                            <span key={`p-${i}`} className="fd-dot fd-dot-green" title={`${p.name} (Present)`}
                                                style={{ left: `${8 + ((i * 31 + 7) % 82)}%`, top: `${12 + ((i * 47 + 13) % 65)}%`, animationDelay: `${i * 0.25}s` }}></span>
                                        ))}
                                        {room.on_break.map((p, i) => (
                                            <span key={`b-${i}`} className="fd-dot fd-dot-yellow" title={`${p.name} (On Break)`}
                                                style={{ left: `${5 + ((i * 41 + 23) % 82)}%`, top: `${8 + ((i * 53 + 17) % 65)}%`, animationDelay: `${i * 0.3 + 0.15}s` }}></span>
                                        ))}
                                        {room.present_count === 0 && room.break_count === 0 && (
                                            <div className="fd-dots-empty">No one detected</div>
                                        )}
                                    </div>
                                    <div className="fd-room-counts">
                                        <span className="fd-count-present">
                                            <span className="fd-dot-inline fd-dot-green"></span> {room.present_count} Present
                                        </span>
                                        <span className="fd-count-break">
                                            <span className="fd-dot-inline fd-dot-yellow"></span> {room.break_count} On Break
                                        </span>
                                        {room.room_capacity && (
                                            <span className={`fd-count-cap ${room.is_overcrowded ? 'overcrowded' : ''}`}>
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

// --- RECENT ACTIVITY (TIMELINE STYLE) ---
const RecentActivity = ({ activities }) => {
    const getEventIcon = (type) => {
        switch (type) {
            case 'entry': return 'fa-sign-in-alt';
            case 'exit': return 'fa-sign-out-alt';
            case 'break_out': return 'fa-coffee';
            case 'break_in': return 'fa-undo';
            default: return 'fa-circle';
        }
    };

    const getEventColor = (type, isLate) => {
        if (isLate) return '#ef4444';
        switch (type) {
            case 'entry': return '#00A859';
            case 'exit': return '#64748b';
            case 'break_out': return '#f59e0b';
            case 'break_in': return '#3b82f6';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="fd-card fd-activity-card">
            <div className="fd-card-header">
                <h3>Recent Activity</h3>
            </div>
            {(!activities || activities.length === 0) ? (
                <div className="fd-empty-state">
                    <p>No recent attendance activity</p>
                </div>
            ) : (
                <div className="fd-timeline">
                    {activities.map((act, i) => {
                        const color = getEventColor(act.event_type, act.is_late);
                        return (
                            <div key={i} className="fd-timeline-item">
                                <div className="fd-timeline-line">
                                    <div className="fd-timeline-dot" style={{ backgroundColor: color, boxShadow: `0 0 0 4px ${color}22` }}>
                                        <i className={`fas ${getEventIcon(act.event_type)}`}></i>
                                    </div>
                                    {i < activities.length - 1 && <div className="fd-timeline-connector"></div>}
                                </div>
                                <div className="fd-timeline-content">
                                    <div className="fd-timeline-top">
                                        <strong>{act.student_name}</strong>
                                        <span className="fd-timeline-time">{act.time}</span>
                                    </div>
                                    <span className="fd-timeline-meta">{act.subject_code} • {act.room_name || 'N/A'}</span>
                                    {act.is_late && <span className="fd-late-tag">LATE</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


// --- QUICK ACTIONS (GRADIENT TILES) ---
const QuickActions = ({ navigate }) => {
    const actions = [
        { label: 'Download Reports', icon: 'fas fa-file-pdf', gradient: 'linear-gradient(135deg, #00A859 0%, #34d399 100%)', path: '/faculty-reports' },
        { label: 'My Classes', icon: 'fas fa-chalkboard', gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', path: '/faculty-classes' },
        { label: 'View Attendance', icon: 'fas fa-clipboard-list', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', path: '/faculty-attendance' },
    ];

    return (
        <div className="fd-card fd-actions-card">
            <div className="fd-card-header">
                <h3>Quick Actions</h3>
            </div>
            <div className="fd-actions-grid">
                {actions.map((a, i) => (
                    <div key={i} className="fd-action-tile" onClick={() => navigate(a.path)}>
                        <div className="fd-action-icon-wrap" style={{ background: a.gradient }}>
                            <i className={a.icon}></i>
                        </div>
                        <span className="fd-action-label">{a.label}</span>
                    </div>
                ))}
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
    const [personalStatus, setPersonalStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartFilter, setChartFilter] = useState('weekly');
    const [trendView, setTrendView] = useState('classroom');

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    const [faceRegistered, setFaceRegistered] = useState(user?.face_registered || false);

    useEffect(() => {
        if (!user?.id) return;
        const controller = new AbortController();

        api.get(`/api/users/${user.id}`, { signal: controller.signal }).then(res => {
            const fresh = res.data?.face_registered ?? false;
            setFaceRegistered(fresh);
            if (fresh !== user.face_registered) {
                const updated = { ...user, face_registered: fresh };
                localStorage.setItem('currentUser', JSON.stringify(updated));
            }
        }).catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                console.error('Failed to refresh face_registered:', err);
            }
        });

        const fetchData = async () => {
            try {
                const [statsRes, schedRes] = await Promise.all([
                    api.get(`/api/faculty/dashboard-stats/${user.id}`, { signal: controller.signal }),
                    api.get(`/api/faculty/schedule/${user.id}`, { signal: controller.signal }).catch((err) => {
                        if (err.name === 'AbortError' || err.name === 'CanceledError') throw err;
                        return { data: [] };
                    })
                ]);
                setStats(statsRes.data);
                setSchedule(schedRes.data || []);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    console.error('Dashboard fetch error:', err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchData();

        const fetchLiveData = async () => {
            try {
                const [roomRes, personalRes] = await Promise.all([
                    api.get(`/api/faculty/live-room-status/${user.id}`, { signal: controller.signal }).catch(() => ({ data: { rooms: [] } })),
                    api.get(`/api/faculty/personal-live-status/${user.id}`, { signal: controller.signal }).catch(() => ({ data: null })),
                ]);
                setLiveRooms(roomRes.data.rooms || []);
                setPersonalStatus(personalRes.data);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    console.error('Live status error:', err);
                }
            }
        };
        fetchLiveData();
        const liveInterval = setInterval(fetchLiveData, 10000);

        return () => {
            controller.abort();
            clearInterval(liveInterval);
        };
    }, [user]);

    if (loading) {
        return (
            <div className="fd-loading">
                <div className="fd-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const displayName = user ? `${user.first_name} ${user.last_name}` : 'Faculty';
    const now = new Date();
    const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="fd-page">
            {/* ===== HERO SECTION ===== */}
            <div className="fd-hero-section">
                <WelcomeBanner
                    facultyName={displayName}
                    facultyId={user?.employee_id || 'N/A'}
                    faceRegistered={faceRegistered}
                    todayName={todayName}
                    todayDate={todayDate}
                />

                {/* Inline Ribbon Stats */}
                <div className="fd-stats-ribbon">
                    <FacultyStatItem
                        title="Today's Classes"
                        value={stats?.todays_classes ?? 0}
                        subValue={todayName}
                    />
                    <div className="fd-ribbon-divider"></div>
                    <FacultyStatItem
                        title="Avg Attendance"
                        value={`${stats?.average_attendance ?? 0}%`}
                        subValue={stats?.average_attendance >= 80 ? '↑ Good' : stats?.average_attendance > 0 ? '↓ Needs Improvement' : 'No Data'}
                        subValueColor={stats?.average_attendance >= 80 ? '#00A859' : '#ef4444'}
                    />
                    <div className="fd-ribbon-divider"></div>
                    <FacultyStatItem
                        title="Active Classes"
                        value={stats?.total_classes ?? 0}
                        subValue="This Semester"
                    />
                    <div className="fd-ribbon-divider"></div>
                    <FacultyStatItem
                        title="Total Students"
                        value={stats?.total_students ?? 0}
                        subValue="Enrolled"
                    />
                </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="fd-main-grid">
                <LiveRoomStatus rooms={liveRooms} personalStatus={personalStatus} />
                <AttendanceTrendChart
                    logs={stats?.all_logs || []}
                    filter={chartFilter}
                    setFilter={setChartFilter}
                    trendView={trendView}
                    setTrendView={setTrendView}
                />
            </div>

            <div className="fd-bottom-grid">
                <RecentActivity activities={stats?.recent_attendance || []} />
                <QuickActions navigate={navigate} />
            </div>
        </div>
    );
};

export default FacultyDashboardPage;
