import React from 'react';
import { NavLink, Outlet } from 'react-router-dom'; // Import NavLink and Outlet
import './StudentLayout.css'; // New CSS file for the layout
import '../ZCommon/Utility.css'; // Global utility styles
import LoggedInHeader from '../ZCommon/LoggedInHeader';

// --- PLACEHOLDERS (UPDATE THESE PATHS) ---
const STUDENT_AVATAR = 'https://placehold.co/100x100/f8d7da/dc3545?text=S';

// --- THEME & USER DEFINITION ---
const studentTheme = {
    primary: '#A62525', // Primary Red
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

const studentUser = {
    name: 'Michael Chen',
    avatar: STUDENT_AVATAR,
    notifications: 3
};

// ===========================================
// 1. Student Sidebar Component (Updated for Routing)
// ===========================================
const StudentSidebar = () => {
    // Nav items updated to reflect the new, simplified structure
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/student-dashboard' },
        { name: 'Schedule', icon: 'fas fa-calendar-alt', to: '/student-schedule' },
        { name: 'Attendance History', icon: 'fas fa-history', to: '/student-attendance' },
    ];

    return (
        <aside className="student-sidebar">
            <div className="student-sidebar-toggle">
                <i className="fas fa-bars"></i>
            </div>
            <div className="student-role-tag">
                Student
            </div>
            <nav className="student-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            {/* Use NavLink for automatic active class */}
                            <NavLink 
                                to={item.to} 
                                // Use "end" prop for the dashboard link to prevent
                                // it from matching all other routes
                                end={item.to === '/student-dashboard'}
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <i className={item.icon}></i>
                                <span>{item.name}</span>
                             </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                SmartCampus v2.1.0
            </div>
        </aside>
    );
};


// ===========================================
// 2. Main StudentLayout Component (The Parent)
// ===========================================
const StudentLayout = () => {
    return (
        <div className="dashboard-container">
            <LoggedInHeader theme={studentTheme} user={studentUser} />
            <div className="dashboard-body">
                <StudentSidebar />
                <div className="main-content-area">
                    {/* All child pages will render here */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default StudentLayout;