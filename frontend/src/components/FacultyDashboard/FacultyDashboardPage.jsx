import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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

// --- SVG CHART ---
const AttendanceTrendChart = ({ logs, filter, setFilter }) => {
    const chartData = useMemo(() => {
        if (!logs || logs.length === 0) return [];

        const now = new Date();
        let buckets = [];

        if (filter === 'weekly') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                buckets.push({ key, label, present: 0, late: 0 });
            }
        } else if (filter === 'monthly') {
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                const label = d.getDate().toString();
                buckets.push({ key, label, present: 0, late: 0 });
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = d.toISOString().slice(0, 7);
                const label = d.toLocaleDateString('en-US', { month: 'short' });
                buckets.push({ key, label, present: 0, late: 0 });
            }
        }

        logs.forEach(log => {
            const ts = log.timestamp ? log.timestamp.slice(0, filter === 'yearly' ? 7 : 10) : null;
            if (!ts) return;
            const bucket = buckets.find(b => b.key === ts);
            if (bucket) {
                if (log.is_late) bucket.late++;
                else bucket.present++;
            }
        });

        return buckets;
    }, [logs, filter]);

    if (!chartData.length) {
        return (
            <div className="card chart-card">
                <div className="chart-header">
                    <h3><i className="fas fa-chart-area"></i> Attendance Trends</h3>
                </div>
                <div className="chart-empty">
                    <i className="fas fa-chart-line"></i>
                    <p>No attendance data available yet</p>
                </div>
            </div>
        );
    }

    const maxVal = Math.max(...chartData.map(d => d.present + d.late), 1);
    const chartWidth = 600;
    const chartHeight = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const barWidth = Math.max(plotWidth / chartData.length - 4, 8);

    return (
        <div className="card chart-card">
            <div className="chart-header">
                <h3><i className="fas fa-chart-area"></i> Attendance Trends</h3>
                <div className="chart-filters">
                    {['weekly', 'monthly', 'yearly'].map(f => (
                        <button key={f} className={`chart-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="chart-legend">
                <span className="legend-dot present"></span> On Time
                <span className="legend-dot late"></span> Late
            </div>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="trend-chart-svg">
                {/* Y-axis gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                    <g key={i}>
                        <line x1={padding.left} y1={padding.top + plotHeight * (1 - pct)} x2={chartWidth - padding.right} y2={padding.top + plotHeight * (1 - pct)} stroke="#e2e8f0" strokeWidth="1" />
                        <text x={padding.left - 5} y={padding.top + plotHeight * (1 - pct) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(maxVal * pct)}</text>
                    </g>
                ))}
                {/* Bars */}
                {chartData.map((d, i) => {
                    const x = padding.left + (plotWidth / chartData.length) * i + (plotWidth / chartData.length - barWidth) / 2;
                    const totalH = ((d.present + d.late) / maxVal) * plotHeight;
                    const lateH = (d.late / maxVal) * plotHeight;
                    const presentH = totalH - lateH;
                    return (
                        <g key={i}>
                            {/* Present bar */}
                            <rect x={x} y={padding.top + plotHeight - totalH} width={barWidth} height={presentH} fill="var(--frames-accent, #00A859)" rx="2" opacity="0.85">
                                <title>{`${d.label}: ${d.present} on-time, ${d.late} late`}</title>
                            </rect>
                            {/* Late bar (stacked on top) */}
                            <rect x={x} y={padding.top + plotHeight - lateH} width={barWidth} height={lateH} fill="#ef4444" rx="2" opacity="0.85">
                                <title>{`${d.label}: ${d.late} late`}</title>
                            </rect>
                            {/* X label */}
                            <text x={x + barWidth / 2} y={chartHeight - 5} textAnchor="middle" fontSize="9" fill="#64748b">{d.label}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// --- LIVE STATUS ---
const LiveClassStatus = ({ classes, todayName }) => {
    const todayClasses = classes.filter(c => c.day_of_week === todayName);

    if (todayClasses.length === 0) {
        return (
            <div className="card live-status-card">
                <h3><i className="fas fa-broadcast-tower"></i> Today's Classes</h3>
                <div className="empty-state-mini">
                    <i className="fas fa-coffee"></i>
                    <p>No classes scheduled today</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card live-status-card">
            <h3><i className="fas fa-broadcast-tower"></i> Today's Classes</h3>
            <div className="live-list">
                {todayClasses.map((cls, i) => (
                    <div key={i} className="live-item">
                        <div className="live-dot"></div>
                        <div className="live-info">
                            <strong>{cls.subject_code}</strong>
                            <span>{cls.room || 'No Room'} • {cls.start_time && cls.end_time ? `${cls.start_time} - ${cls.end_time}` : 'TBA'}</span>
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


// ============================================
// MAIN DASHBOARD PAGE
// ============================================
const FacultyDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [schedule, setSchedule] = useState([]);
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

            {/* Two Column Layout: Chart + Live Status */}
            <div className="dashboard-two-col">
                <AttendanceTrendChart
                    logs={stats?.all_logs || []}
                    filter={chartFilter}
                    setFilter={setChartFilter}
                />
                <div className="dashboard-right-col">
                    <LiveClassStatus classes={schedule} todayName={todayName} />
                    <RecentActivity activities={stats?.recent_attendance || []} />
                </div>
            </div>
        </div>
    );
};

export default FacultyDashboardPage;
