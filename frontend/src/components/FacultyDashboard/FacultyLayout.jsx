import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './FacultyLayout.css'; 
import '../ZCommon/Utility.css'; 
import Header from '../ZCommon/Header'; 

// --- THEME DEFINITION ---
const facultyTheme = {
    primary: '#A62525', 
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Faculty Sidebar Component
// ===========================================
const FacultySidebar = ({ user }) => {
    // --- LOGIC: Check if user is a Department Head ---
    // Checks database field 'faculty_status' OR 'role'
    const isDeptHead = user?.faculty_status === 'Head' || 
                       user?.faculty_status === 'Department Head' || 
                       user?.role === 'dept_head';

    // Base Navigation Items
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports' },
    ];

    // CONDITIONAL: Add Dept Management tab if Head
    if (isDeptHead) {
        navItems.push({ 
            name: 'Department Mgmt', 
            icon: 'fas fa-university', 
            to: '/faculty-dept-management' 
        });
    }

    return (
        <aside className="faculty-sidebar">
            {/* Dynamic Role Tag */}
            <div className="faculty-role-tag">
                {isDeptHead ? "Department Head" : "Faculty Member"}
            </div>

            <nav className="faculty-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
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
// 2. Main FacultyLayout Component
// ===========================================
const FacultyLayout = () => {
    const navigate = useNavigate();
    
    // --- FIX: GET REAL USER FROM STORAGE ---
    // We no longer manually construct the object or use a default avatar.
    // The Header component handles the avatar generation automatically.
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        if (!user) {
            navigate('/'); // Redirect if not logged in
        } else {
            // Optional: Strict Role Check
            // Allow both 'faculty' and 'dept_head' roles
            const role = user.role?.toLowerCase();
            if (role !== 'faculty' && role !== 'dept_head') {
                navigate('/');
            }
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="dashboard-container">
            {/* Pass real user to Header for correct Red Initials Avatar */}
            <Header theme={facultyTheme} user={user} />
            
            <div className="dashboard-body">
                {/* Pass user to Sidebar to determine Dept Head status */}
                <FacultySidebar user={user} />
                
                <div className="main-content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;