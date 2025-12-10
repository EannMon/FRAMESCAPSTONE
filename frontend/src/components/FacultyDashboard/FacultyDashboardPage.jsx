// FILE: FacultyDashboardPage.jsx
import React from 'react';
import './FacultyDashboardPage.css';
import '../ZCommon/Utility.css';

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

const FacultySummaryCards = () => (
    <div className="summary-cards-container">
        <FacultySummaryCard 
            iconClass="fas fa-calendar-day" 
            title="Today's Classes" 
            value="5" 
            subValue="2 upcoming" 
            subValueColor="#dc3545" 
            iconBgClass="f-icon-red" /* Uses #f8d7da bg */
        />
        <FacultySummaryCard 
            iconClass="fas fa-user-check" 
            title="Attendance Rate" 
            value="87%" 
            subValue="+3% vs last week" 
            subValueColor="#198754" 
            iconBgClass="f-icon-green" /* Uses #a7e0aa bg */
        />
        <FacultySummaryCard 
            iconClass="fas fa-users" 
            title="Total Students" 
            value="156" 
            subValue="Across 3 courses" 
            subValueColor="#6f42c1" 
            iconBgClass="f-icon-purple" /* Uses #d8c7f0 bg */
        />
        <FacultySummaryCard 
            iconClass="fas fa-bell" 
            title="Alerts" 
            value="2" 
            subValue="Requires attention" 
            subValueColor="#dc3545" 
            iconBgClass="f-icon-alert" /* Uses #f7a39b bg (Darker Salmon) */
        />
    </div>
);

// ... (Rest of your component: RecentAttendance, ClassroomAlerts)
// Use the exact same RecentAttendance and ClassroomAlerts code provided previously.

const RecentAttendance = () => (
    <div className="recent-attendance">
        <h3>Recent Attendance</h3>
        {/* Placeholder Content */}
        <div style={{padding: '10px 0', borderBottom: '1px solid #eee'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <strong>Computer Science 101</strong>
                <span style={{color:'green', fontWeight:'bold'}}>94%</span>
            </div>
            <small style={{color:'#888'}}>Today, 9:00 AM</small>
        </div>
    </div>
);

const ClassroomAlerts = () => (
    <div className="classroom-alerts">
        <h3>Alerts</h3>
        <div style={{display:'flex', gap:'10px', padding:'10px 0'}}>
            <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#ffc107', marginTop:'6px'}}></div>
            <div>
                <div style={{fontSize:'0.95em'}}><strong>High occupancy in Room A-205</strong></div>
                <div style={{fontSize:'0.8em', color:'#888'}}>15 min ago</div>
            </div>
        </div>
    </div>
);

const FacultyDashboardPage = () => {
    return (
        <div className="faculty-content-grid">
            <FacultySummaryCards />
            <RecentAttendance />
            <ClassroomAlerts />
        </div>
    );
};

export default FacultyDashboardPage;