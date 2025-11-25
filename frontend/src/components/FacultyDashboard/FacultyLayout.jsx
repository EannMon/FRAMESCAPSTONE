import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './FacultyLayout.css';
import '../ZCommon/Utility.css'; // Global utility styles
import LoggedInHeader from '../ZCommon/LoggedInHeader';

// --- PLACEHOLDERS (UPDATE THESE PATHS) ---
const FACULTY_AVATAR = 'https://placehold.co/100x100/f8d7da/dc3545?text=F';

// --- THEME & USER DEFINITION (RED THEME) ---
const facultyTheme = {
    primary: '#A62525', // Primary Red
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

const facultyUser = {
    name: 'Dr. Sarah Johnson',
    avatar: FACULTY_AVATAR,
    notifications: 2
};

// ===========================================
// 1. Faculty Sidebar Component
// ===========================================
const FacultySidebar = () => {
    // Nav items updated to reflect the correct flat routing paths
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports', notification: 2 },
    ];

    return (
        <aside className="faculty-sidebar">
            <div className="faculty-role-tag">
                Faculty Member
            </div>

            <nav className="faculty-nav">
             <ul>
                {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.to}
                                // Use 'end' to prevent the parent path from staying active
                                end={item.to === '/faculty-dashboard'}
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <i className={item.icon}></i>
                                <span>{item.name}</span>
                                {item.notification && <span className="notification-badge">{item.notification}</span>}
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
// 2. Main FacultyLayout Component (The Parent)
// ===========================================
const FacultyLayout = () => {
    return (
        <div className="dashboard-container">
            <LoggedInHeader theme={facultyTheme} user={facultyUser} />
            <div className="dashboard-body">
                <FacultySidebar />
                 <div className="main-content-area">
                    {/* All child pages will render here */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;