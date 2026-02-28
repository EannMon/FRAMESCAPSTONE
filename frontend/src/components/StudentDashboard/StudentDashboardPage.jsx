import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LiveClassStatus from './LiveClassStatus';
import AttendanceTrendChart from './AttendanceTrendChart';
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

// --- MAIN PAGE COMPONENT ---
const StudentDashboardPage = () => {
    const { user: authUser } = useAuth();

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
                if (!authUser) {
                    setError('No user session found. Please log in.');
                    setLoading(false);
                    return;
                }
                setUserData(authUser);

                const uid = authUser.id || authUser.user_id;

                const [dashRes, histRes] = await Promise.all([
                    api.get(`/api/student/dashboard/${uid}`, { signal: controller.signal }),
                    api.get(`/api/student/history/${uid}`, { signal: controller.signal })
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
                if (err.code !== 'ERR_CANCELED') {
                    setError(err.userMessage || 'Failed to load dashboard data.');
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
