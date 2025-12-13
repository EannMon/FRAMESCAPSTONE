import React, { useState, useEffect } from 'react';
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

// --- NEW COMPONENT: LIVE STATUS BOX ---
const LiveClassStatus = ({ recentLog }) => {
    // Determine Status based on latest log
    let status = 'IDLE';
    let statusColor = 'grey';
    let statusText = 'Not currently in any class';
    let roomName = '---';

    if (recentLog && recentLog.event_type) {
        const logTime = new Date(recentLog.timestamp);
        const now = new Date();
        const diffHours = (now - logTime) / 1000 / 60 / 60;

        // If log is within last 4 hours (assumption for class duration)
        if (diffHours < 4) {
            roomName = recentLog.room_name || 'Unknown Room';
            if (recentLog.event_type === 'attendance_in' || recentLog.event_type === 'break_in') {
                status = 'ACTIVE';
                statusColor = '#28a745'; // Green
                statusText = `Currently Detected in ${roomName}`;
            } else if (recentLog.event_type === 'break_out') {
                status = 'BREAK';
                statusColor = '#ffc107'; // Yellow
                statusText = `On Break from ${roomName}`;
            } else if (recentLog.event_type === 'attendance_out') {
                status = 'OUT';
                statusColor = 'grey';
                statusText = 'Class Session Ended';
                roomName = '---';
            }
        }
    }

    return (
        <div className="card live-status-card">
            <div className="live-header">
                <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                <div className="live-indicator">
                    <span className="blink-dot" style={{backgroundColor: statusColor}}></span>
                    <span style={{color: statusColor, fontWeight: 'bold'}}>{status}</span>
                </div>
            </div>
            <div className="live-body">
                <div className="room-display">
                    <i className="fas fa-chalkboard-teacher room-icon" style={{color: status === 'ACTIVE' ? statusColor : '#ccc'}}></i>
                    <div className="room-info">
                        <h4>{roomName}</h4>
                        <p>{statusText}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- FIXED COMPONENT HERE ---
const StudentRecentAttendance = ({ logs }) => (
    <div className="card student-recent-attendance">
        <h3>Recent Activity</h3>
        {logs.length > 0 ? (
            logs.map((log, index) => {
                // SAFETY CHECK: Ensure event_type exists, defaulting to empty string if missing
                const eventType = log.event_type || 'attendance_in'; 
                const isEntry = eventType.includes('in');
                const displayType = eventType.replace('attendance_', '').toUpperCase();

                return (
                    <div key={index} className="student-attendance-item">
                        <div className="attendance-details">
                            <span className="attendance-day">{new Date(log.timestamp).toLocaleDateString()}</span>
                            <span className="attendance-time">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.course_name || log.room_name || 'Gate'}
                            </span>
                        </div>
                        <div className="attendance-stats">
                            <span className="attendance-percent" style={{ 
                                color: isEntry ? '#28a745' : '#666', 
                                backgroundColor: isEntry ? '#e6f7ec' : '#f0f0f0' 
                            }}>
                                {displayType}
                            </span>
                        </div>
                    </div>
                );
            })
        ) : (
            <p style={{color: '#888', padding: '10px'}}>No recent records found.</p>
        )}
    </div>
);

// --- MAIN PAGE COMPONENT ---
const StudentDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        attendance_rate: "0%",
        enrolled_courses: 0,
        notifications: [],
        recent_attendance: []
    });
    const [userData, setUserData] = useState({ firstName: "Student", tupm_id: "..." });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!storedUser) return;
                setUserData(storedUser);

                const response = await axios.get(`http://localhost:5000/api/student/dashboard/${storedUser.user_id}`);
                setDashboardData(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div style={{padding: '40px'}}>Loading Dashboard...</div>;

    // Get the very last log for the Live Status box
    const latestLog = dashboardData.recent_attendance && dashboardData.recent_attendance.length > 0 
        ? dashboardData.recent_attendance[0] 
        : null;

    return (
        <div className="student-content-grid">
            <WelcomeBanner studentName={userData.firstName} studentId={userData.tupm_id} />
            
            <StudentSummaryCards stats={{
                attendanceRate: dashboardData.attendance_rate,
                courses: dashboardData.enrolled_courses,
                notifCount: dashboardData.notifications.filter(n => !n.is_read).length
            }} />
            
            {/* NEW LAYOUT: Live Status on Left, History on Right */}
            <div className="dashboard-split-row">
                <LiveClassStatus recentLog={latestLog} />
                <StudentRecentAttendance logs={dashboardData.recent_attendance} />
            </div>
        </div>
    );
};

export default StudentDashboardPage;