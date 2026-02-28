import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Common/ToastProvider';
import '../FacultyDashboard/FacultyDashboardPage.css';
import './DeptHeadDashboardPage.css';
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

// --- SVG CHART (same as faculty) ---
const AttendanceTrendChart = ({ logs, filter, setFilter }) => {
    const chartData = useMemo(() => {
        if (!logs || logs.length === 0) return [];
        const now = new Date();
        let buckets = [];
        if (filter === 'weekly') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now); d.setDate(d.getDate() - i);
                buckets.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { weekday: 'short' }), present: 0, late: 0 });
            }
        } else if (filter === 'monthly') {
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now); d.setDate(d.getDate() - i);
                buckets.push({ key: d.toISOString().slice(0, 10), label: d.getDate().toString(), present: 0, late: 0 });
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                buckets.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short' }), present: 0, late: 0 });
            }
        }
        logs.forEach(log => {
            const ts = log.timestamp ? log.timestamp.slice(0, filter === 'yearly' ? 7 : 10) : null;
            const bucket = buckets.find(b => b.key === ts);
            if (bucket) { if (log.is_late) bucket.late++; else bucket.present++; }
        });
        return buckets;
    }, [logs, filter]);

    if (!chartData.length) {
        return (
            <div className="card chart-card">
                <div className="chart-header"><h3><i className="fas fa-chart-area"></i> Department Attendance</h3></div>
                <div className="chart-empty"><i className="fas fa-chart-line"></i><p>No attendance data available yet</p></div>
            </div>
        );
    }

    const maxVal = Math.max(...chartData.map(d => d.present + d.late), 1);
    const W = 600, H = 200, pad = { t: 20, r: 20, b: 30, l: 40 };
    const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
    const bW = Math.max(pW / chartData.length - 4, 8);

    return (
        <div className="card chart-card">
            <div className="chart-header">
                <h3><i className="fas fa-chart-area"></i> Department Attendance</h3>
                <div className="chart-filters">
                    {['weekly', 'monthly', 'yearly'].map(f => (
                        <button key={f} className={`chart-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="chart-legend"><span className="legend-dot present"></span> On Time <span className="legend-dot late"></span> Late</div>
            <svg viewBox={`0 0 ${W} ${H}`} className="trend-chart-svg">
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                    <g key={i}>
                        <line x1={pad.l} y1={pad.t + pH * (1 - pct)} x2={W - pad.r} y2={pad.t + pH * (1 - pct)} stroke="#e2e8f0" strokeWidth="1" />
                        <text x={pad.l - 5} y={pad.t + pH * (1 - pct) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(maxVal * pct)}</text>
                    </g>
                ))}
                {chartData.map((d, i) => {
                    const x = pad.l + (pW / chartData.length) * i + (pW / chartData.length - bW) / 2;
                    const tH = ((d.present + d.late) / maxVal) * pH, lH = (d.late / maxVal) * pH;
                    return (
                        <g key={i}>
                            <rect x={x} y={pad.t + pH - tH} width={bW} height={tH - lH} fill="var(--frames-accent, #00A859)" rx="2" opacity="0.85" />
                            <rect x={x} y={pad.t + pH - lH} width={bW} height={lH} fill="#ef4444" rx="2" opacity="0.85" />
                            <text x={x + bW / 2} y={H - 5} textAnchor="middle" fontSize="9" fill="#64748b">{d.label}</text>
                        </g>
                    );
                })}
            </svg>
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
    const toast = useToast();
    const [stats, setStats] = useState({ pending_verifications: 0, total_faculty: 0, total_students: 0, issues_reported: 0 });
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [chartFilter, setChartFilter] = useState('weekly');
    const [allLogs, setAllLogs] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    // Live face_registered check from API
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

            // Faculty stats for chart & activity
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
        // Refresh face_registered from DB
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
    }, []);

    const handleAction = async (userId, action, name) => {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const confirmed = await toast.confirm(`Are you sure you want to ${action} ${name}'s account?`);
        if (!confirmed) return;
        try {
            await axios.post(`${API}/api/admin/verification/${action}`, null, { params: { user_id: userId } });
            setSelectedUser(null);
            fetchData();
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            toast.error(`Failed to ${action} user. Please try again.`);
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

            {/* Chart + Activity */}
            <div className="dashboard-two-col">
                <AttendanceTrendChart logs={allLogs} filter={chartFilter} setFilter={setChartFilter} />
                <div className="dashboard-right-col">
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
