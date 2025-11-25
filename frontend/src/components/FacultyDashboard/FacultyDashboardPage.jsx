// Dashboard.jsx - Dashboard Page Component
import React from 'react';
import './FacultyDashboardPage.css';
import '../ZCommon/Utility.css';

// Summary Card Component
const FacultySummaryCard = ({ iconClass, title, value, subValue, subValueColor, iconBgClass }) => (
    <div className="card summary-card">
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

// Summary Cards Section
const FacultySummaryCards = () => (
    <div className="summary-cards-container">
        <FacultySummaryCard 
            iconClass="fas fa-calendar-day" 
            title="Today's Classes" 
            value="5" 
            subValue="2 upcoming" 
            subValueColor="#1a73e8" 
            iconBgClass="f-classes-bg" 
        />
        <FacultySummaryCard 
            iconClass="fas fa-user-check" 
            title="Attendance Rate" 
            value="87%" 
            subValue="+3% vs last week" 
            subValueColor="#28a745" 
            iconBgClass="f-attendance-bg" 
        />
        <FacultySummaryCard 
            iconClass="fas fa-users" 
            title="Total Students" 
            value="156" 
            subValue="Across 3 courses" 
            subValueColor="#555" 
            iconBgClass="f-students-bg" 
        />
        <FacultySummaryCard 
            iconClass="fas fa-bell" 
            title="Pending Alerts" 
            value="2" 
            subValue="Requires attention" 
            subValueColor="#dc3545" 
            iconBgClass="f-alerts-bg" 
        />
    </div>
);

// Schedule Item Component
const ScheduleItem = ({ time, title, details, showMonitor }) => (
    <div className="schedule-item">
        <div className="schedule-time-dot">
            <span className="dot"></span>
            <span className="time">{time}</span>
        </div>
        <div className="schedule-details">
            <span className="schedule-title">{title}</span>
            <span className="schedule-meta">{details}</span>
        </div>
        <div className="schedule-actions">
            <button className="schedule-button view-button">
                <i className="fas fa-eye"></i> View
            </button>
            {showMonitor && (
                <button className="schedule-button monitor-button">
                    <i className="fas fa-video"></i> Monitor
                </button>
            )}
        </div>
    </div>
);

// Today's Schedule Section
const TodaySchedule = () => (
    <div className="card today-schedule">
        <h3>Today's Schedule</h3>
        <div className="schedule-list">
            <ScheduleItem 
                time="09:00 - 10:30" 
                title="Computer Science 101" 
                details="Room A-205 • 32 students" 
                showMonitor={false} 
            />
            <ScheduleItem 
                time="11:00 - 12:30" 
                title="Data Structures" 
                details="Room B-301 • 28 students" 
                showMonitor={false} 
            />
            <ScheduleItem 
                time="02:00 - 03:30" 
                title="Algorithms" 
                details="Room A-205 • 25 students" 
                showMonitor={true} 
            />
            <ScheduleItem 
                time="04:00 - 05:30" 
                title="Software Engineering" 
                details="Lab C-102 • 30 students" 
                showMonitor={true} 
            />
        </div>
    </div>
);

// Attendance Item Component
const AttendanceItem = ({ title, time, ratio, percent, percentColor }) => (
    <div className="attendance-item">
        <div className="attendance-details">
            <span className="attendance-title">{title}</span>
            <span className="attendance-time">{time}</span>
        </div>
        <div className="attendance-stats">
            <span className="attendance-ratio">{ratio}</span>
            <span className="attendance-percent" style={{ color: percentColor }}>{percent}</span>
        </div>
    </div>
);

// Recent Attendance Section
const RecentAttendance = () => (
    <div className="card recent-attendance">
        <h3>Recent Attendance</h3>
        <AttendanceItem 
            title="Computer Science 101" 
            time="Today, 9:00 AM" 
            ratio="30/32" 
            percent="94%" 
            percentColor="#28a745" 
        />
        <AttendanceItem 
            title="Data Structures" 
            time="Yesterday, 11:00 AM" 
            ratio="26/28" 
            percent="93%" 
            percentColor="#28a745" 
        />
        <AttendanceItem 
            title="Algorithms" 
            time="Yesterday, 2:00 PM" 
            ratio="22/25" 
            percent="88%" 
            percentColor="#ffc107" 
        />
    </div>
);

// Classroom Alerts Section
const ClassroomAlerts = () => (
    <div className="card classroom-alerts">
        <h3>Classroom Alerts</h3>
        <div className="alert-item">
            <span className="alert-type yellow"></span>
            <div className="alert-details">
                <div className="alert-description"><strong>High occupancy in Room A-205</strong></div>
                <div className="alert-time">15 min ago</div>
            </div>
        </div>
        <div className="alert-item">
            <span className="alert-type blue"></span>
            <div className="alert-details">
                <div className="alert-description"><strong>New student registered for CS 101</strong></div>
                <div className="alert-time">1 hour ago</div>
            </div>
        </div>
        <div className="alert-item">
            <span className="alert-type green"></span>
            <div className="alert-details">
                <div className="alert-description"><strong>Perfect attendance recorded</strong></div>
                <div className="alert-time">2 hours ago</div>
            </div>
        </div>
    </div>
);

// Main Dashboard Component
const FacultyDashboardPage = () => {
    return (
        <div className="faculty-content-grid">
            <FacultySummaryCards />
            <TodaySchedule />
            <RecentAttendance />
            <ClassroomAlerts />
        </div>
    );
};

export default FacultyDashboardPage;