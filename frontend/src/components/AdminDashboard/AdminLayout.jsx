import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css'; // Use the layout CSS file
import '../ZCommon/Utility.css';
import LoggedInHeader from '../ZCommon/LoggedInHeader'; 

// --- THEME & USER DEFINITION (RED THEME) ---
const adminTheme = {
    primary: '#A62525', // Primary Red
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

const adminUser = {
    name: 'Admin User',
    avatar: 'https://placehold.co/100x100/f8d7da/dc3545?text=A', // Placeholder avatar
    notifications: 3 
};


// ===========================================
// 1. Admin Sidebar Component (*** UPDATED ***)
// ===========================================
const AdminSidebar = () => {
    // Nav items updated to match your new image
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/admin-dashboard' },
        { name: 'Application', icon: 'fas fa-file-alt', to: '/admin-application' }, // <-- NEW
        { name: 'User Management', icon: 'fas fa-users', to: '/admin-user-management' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/admin-reports' },
        { name: 'System Logs', icon: 'fas fa-clipboard-list', to: '/admin-logs' },
    ];

    return (
        <aside className="sidebar">
            <div className="admin-role-tag">
                Administrator
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink 
                                to={item.to} 
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <i className={item.icon}></i>
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

// ===========================================
// 2. Main AdminLayout Component (The Parent Layout)
// ===========================================
const AdminLayout = () => {
    return (
        <div className="dashboard-container">
            <LoggedInHeader theme={adminTheme} user={adminUser} />
            <div className="dashboard-body">
                <AdminSidebar />
                <div className="main-content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;