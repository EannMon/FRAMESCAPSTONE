import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './FacultyLayout.css'; // Ensure this file contains content from AdminLayout.css
import '../ZCommon/Utility.css'; 
import Header from '../ZCommon/Header';

// --- FALLBACK ONLY ---
const DEFAULT_AVATAR = 'https://placehold.co/100x100/f8d7da/dc3545?text=No+Img';

// --- THEME DEFINITION (RED THEME) ---
const facultyTheme = {
    primary: '#A62525', 
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Faculty Sidebar Component (Layout matched to Admin)
// ===========================================
const FacultySidebar = () => {
    // Nav items specific to Faculty Access
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports', notification: 2 },
    ];

    return (
        // CHANGED: Class name 'sidebar' to match Admin CSS
        <aside className="sidebar">
            {/* CHANGED: Class 'admin-role-tag' to match Admin style */}
            <div className="admin-role-tag">
                Faculty Member
            </div>

            {/* CHANGED: Class 'sidebar-nav' to match Admin style */}
            <nav className="sidebar-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.to}
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
        </aside>
    );
};

// ===========================================
// 2. Main FacultyLayout Component
// ===========================================
const FacultyLayout = () => {
    const navigate = useNavigate();
    
    const [user, setUser] = useState({
        name: 'Loading...',
        avatar: DEFAULT_AVATAR, 
        notifications: 0
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');

        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            
            if (parsedUser.role !== 'faculty') {
                alert("Access Denied: This area is for Faculty members only.");
                navigate('/'); 
                return;
            }

            setUser({
                name: `${parsedUser.firstName} ${parsedUser.lastName}`, 
                avatar: parsedUser.avatar ? parsedUser.avatar : DEFAULT_AVATAR,
                notifications: 3 
            });
        } else {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <Header theme={facultyTheme} user={user} />
            
            <div className="dashboard-body">
                <FacultySidebar />
                <div className="main-content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;