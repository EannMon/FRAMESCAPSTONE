import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FacultyDashboardPage.css';
import '../Common/Utility.css';

// New Premium "Lovable" Card Component
const FacultySummaryCard = ({ iconClass, title, value, subValue, subValueColor, iconBgClass, badge }) => (
    <div className="summary-card premium">
        <div className="summary-content-left">
            <div className="summary-title">{title}</div>
            <div className="summary-value-row">
                <span className="summary-value">{value}</span>
                {badge && <span className={`summary-badge ${badge.type}`}>{badge.text}</span>}
            </div>
            {subValue && (
                <div className="summary-sub-value">
                    {subValue}
                </div>
            )}
        </div>
        <div className={`summary-icon-container ${iconBgClass}`}>
            <i className={iconClass}></i>
        </div>
    </div>
);

const FacultyDashboardPage = () => {
    // --- STATE (with safe defaults) ---
    const [stats, setStats] = useState({
        todays_classes: 0,
        average_attendance: 0,
        total_students: 0,
        total_classes: 0,
        alerts: 0,
        recent_attendance: []
    });
    const [loading, setLoading] = useState(true);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchStats = async () => {
            const storedUser = localStorage.getItem('currentUser');
            if (!storedUser) {
                setLoading(false);
                return;
            }
            const user = JSON.parse(storedUser);
            const userId = user.id || user.user_id;

            try {
                const response = await axios.get(`http://localhost:5000/api/faculty/dashboard-stats/${userId}`);
                // Merge with defaults to prevent undefined errors
                setStats(prev => ({
                    ...prev,
                    ...response.data,
                    recent_attendance: response.data.recent_attendance || []
                }));
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // --- SUB-COMPONENTS ---

    const FacultySummaryCards = () => (
        <div className="summary-cards-container">
            <FacultySummaryCard
                iconClass="fas fa-calendar-check"
                title="Today's Classes"
                value={stats.todays_classes || 0}
                subValue="Scheduled for today"
                iconBgClass="f-icon-soft-green"
                badge={{ text: "Active", type: "success" }}
            />
            <FacultySummaryCard
                iconClass="fas fa-clock"
                title="Avg. Attendance"
                value={`${stats.average_attendance || 0}%`}
                subValue="Last 30 Days"
                iconBgClass="f-icon-soft-amber"
                badge={{ text: "On Track", type: "warning" }}
            />
            <FacultySummaryCard
                iconClass="fas fa-door-open"
                title="Active Classes"
                value={stats.total_classes || 0}
                subValue="Currently active courses"
                iconBgClass="f-icon-soft-blue"
            />
            <FacultySummaryCard
                iconClass="fas fa-users"
                title="Total Enrolled"
                value={stats.total_students || 0}
                subValue="Students across sections"
                iconBgClass="f-icon-soft-navy"
            />
        </div>
    );

    const RecentAttendance = () => {
        const recentList = stats.recent_attendance || [];
        return (
            <div className="recent-attendance card">
                <h3>Recent Activity</h3>
                <div className="recent-list-container">
                    {recentList.length > 0 ? (
                        recentList.map((log, index) => (
                            <div key={index} className="recent-activity-row">
                                <div className="activity-icon">
                                    <i className="fas fa-graduation-cap"></i>
                                </div>
                                <div className="activity-details">
                                    <strong>{log.subject_code || 'Class'}</strong>
                                    <span className="activity-time">{log.time || ''} • {log.subject_description || ''}</span>
                                </div>
                                <div className="activity-status">
                                    <span className="status-pill success">Present</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>No recent activity.</div>
                    )}
                </div>
            </div>
        );
    };

    const ClassroomAlerts = () => (
        <div className="classroom-alerts card">
            <h3>System Status</h3>
            <div className="system-status-row">
                <div className="status-indicator pulse-green"></div>
                <div>
                    <div className="status-text-main">System Normal</div>
                    <div className="status-text-sub">All systems operational</div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    return (
        <div className="faculty-content-grid">
            <FacultySummaryCards />
            <div className="dashboard-columns">
                <RecentAttendance />
                <ClassroomAlerts />
            </div>
        </div>
    );
};

export default FacultyDashboardPage;
