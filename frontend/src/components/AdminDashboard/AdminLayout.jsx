import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';
import '../Common/Utility.css';
import Header from '../Common/Header';
// TINANGGAL: import UserVerificationPage from './UserVerificationPage'; 
// Import other required page components here if using conditional rendering
// import AdminDashboardPage from './AdminDashboardPage'; 

// --- THEME & USER DEFINITION (RED THEME) ---
const adminTheme = {
    primary: '#A62525', // Primary Red
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Admin Sidebar Component (MODIFIED)
// ===========================================
// Ginawa nating prop ang user para magamit ang data
const AdminSidebar = ({ user }) => {
    // Nav items: TINANGGAL ang 'Verification' link
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/admin-dashboard' },
        { name: 'Application', icon: 'fas fa-file-alt', to: '/admin-application' },
        // TINANGGAL: { name: 'Verification', icon: 'fas fa-user-check', to: '/admin-verification' }, 
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
// 2. Main AdminLayout Component (The Parent Layout - SECURED)
// ===========================================
const AdminLayout = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- SECURITY CHECK ON LOAD (using AuthContext) ---
    useEffect(() => {
        if (!authUser) {
            navigate('/');
            return;
        }

        // HAKBANG 1: Check kung Admin (backend returns uppercase roles)
        if (authUser.role?.toLowerCase() !== 'admin') {
            alert("Access denied. You are not authorized to view the Admin dashboard.");
            navigate('/');
            return;
        }

        // HAKBANG 2: Check kung Verified
        if (authUser.verification_status !== 'Verified') {
            alert("Access denied. Your admin account is pending full verification.");
            navigate(`/register/${authUser.role}?s=${authUser.verification_status.toLowerCase()}`);
            return;
        }

        // Kung Verified, i-set ang user data at magpatuloy
        const firstName = authUser.first_name || authUser.firstName || '';
        const lastName = authUser.last_name || authUser.lastName || '';
        setUser({
            ...authUser,
            name: `${firstName} ${lastName}`.trim() || 'Admin',
            notifications: 0
        });
        setLoading(false);

    }, [authUser, navigate]);

    if (loading) {
        return <div style={{ textAlign: 'center', paddingTop: '100px' }}>Loading Admin Panel...</div>;
    }

    // Ang user state ay gagamitin na ngayon sa Header at Sidebar
    return (
        <div className="dashboard-container">
            <Header theme={adminTheme} user={user} />
            <div className="dashboard-body">
                <AdminSidebar user={user} />
                <div className="main-content-area">
                    {/* Ipasa ang user context sa Outlet */}
                    <Outlet context={{ user }} />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;