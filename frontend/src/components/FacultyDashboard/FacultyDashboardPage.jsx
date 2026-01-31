import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FacultyDashboardPage.css';
import '../Common/Utility.css';

const FacultySummaryCard = ({ iconClass, title, value, subValue, subValueColor, iconBgClass }) => (
    <div className="summary-card">
        <div className={`summary-icon-container ${iconBgClass}`}>
            <i className={iconClass}></i>
        </div>
        <div className="summary-content">
            <div className="summary-title">{title}</div>
            <div className="summary-value">{value}</div>
            {subValue && (
                <div className="summary-sub-value" style={{ color: subValueColor }}>
                    {subValue}
                </div>
            )}
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

    // --- SUB-COMPONENTS (Defined inside to access 'stats') ---

    const FacultySummaryCards = () => (
        <div className="summary-cards-container">
            <FacultySummaryCard
                iconClass="fas fa-calendar-day"
                title="Today's Classes"
                value={stats.todays_classes || 0}
                subValue="Scheduled"
                subValueColor="#dc3545"
                iconBgClass="f-icon-red"
            />
            <FacultySummaryCard
                iconClass="fas fa-user-check"
                title="Attendance Rate"
                value={`${stats.average_attendance || 0}%`}
                subValue="Last 30 Days"
                subValueColor="#198754"
                iconBgClass="f-icon-green"
            />
            <FacultySummaryCard
                iconClass="fas fa-users"
                title="Total Students"
                value={stats.total_students || 0}
                subValue="Active Enrollees"
                subValueColor="#6f42c1"
                iconBgClass="f-icon-purple"
            />
            <FacultySummaryCard
                iconClass="fas fa-book"
                title="Total Classes"
                value={stats.total_classes || 0}
                subValue="This Semester"
                subValueColor="#0d6efd"
                iconBgClass="f-icon-alert"
            />
        </div>
    );

    const RecentAttendance = () => {
        const recentList = stats.recent_attendance || [];
        return (
            <div className="recent-attendance">
                <h3>Recent Activity</h3>
                {recentList.length > 0 ? (
                    recentList.map((log, index) => (
                        <div key={index} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{log.subject_code || 'Class'}</strong>
                                <span style={{ color: 'green', fontWeight: 'bold' }}>Present</span>
                            </div>
                            <small style={{ color: '#888' }}>{log.time || ''} • {log.subject_description || ''}</small>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '20px', color: '#888' }}>No recent activity.</div>
                )}
            </div>
        );
    };

    const ClassroomAlerts = () => (
        <div className="classroom-alerts">
            <h3>System Alerts</h3>
            <div style={{ display: 'flex', gap: '10px', padding: '10px 0' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28a745', marginTop: '6px' }}></div>
                <div>
                    <div style={{ fontSize: '0.95em' }}><strong>System Normal</strong></div>
                    <div style={{ fontSize: '0.8em', color: '#888' }}>All systems operational</div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    return (
        <div className="faculty-content-grid">
            <FacultySummaryCards />
            <RecentAttendance />
            <ClassroomAlerts />
        </div>
    );
};

export default FacultyDashboardPage;
