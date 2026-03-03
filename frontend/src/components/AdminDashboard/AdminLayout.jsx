import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useToast } from '../Common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';
import '../Common/Utility.css';
import Header from '../Common/Header';
// TINANGGAL: import UserVerificationPage from './UserVerificationPage'; 
// Import other required page components here if using conditional rendering
// import AdminDashboardPage from './AdminDashboardPage'; 

// --- THEME & USER DEFINITION (NAVY THEME) ---
const adminTheme = {
    primary: '#0F172A', // Primary Navy
    dark: '#163269',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Admin Sidebar Component (MODIFIED)
// ===========================================
// Ginawa nating prop ang user para magamit ang data
const AdminSidebar = ({ user, isCollapsed, isMobileOpen }) => {
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
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
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
    const toast = useToast();
    const { user: authUser, isLoading: authLoading, logout: authLogout } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 992) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    // --- SECURITY CHECK ON LOAD (uses AuthContext) ---
    useEffect(() => {
        if (authLoading) return; // Wait for AuthContext to initialize

        if (!authUser) {
            navigate('/');
            return;
        }

        // HAKBANG 1: Check kung Admin (backend returns uppercase roles)
        if (authUser.role?.toLowerCase() !== 'admin') {
            toast.error("Access denied. You are not authorized to view the Admin dashboard.");
            navigate('/');
            return;
        }

        // HAKBANG 2: Check kung Verified
        if (authUser.verification_status !== 'Verified') {
            toast.error("Access denied. Your admin account is pending full verification.");
            navigate(`/register/${authUser.role}?s=${authUser.verification_status.toLowerCase()}`);
            return;
        }

        // Kung Verified, i-set ang user data at magpatuloy
        // Handle both snake_case (backend) and camelCase (legacy) field names
        const firstName = authUser.first_name || authUser.firstName || '';
        const lastName = authUser.last_name || authUser.lastName || '';
        setUser({
            ...authUser,
            name: `${firstName} ${lastName}`.trim() || 'Admin', // Ensure name is formatted for Header
            notifications: 0 // Placeholder or fetch actual count if necessary
        });
        setLoading(false);

    }, [authUser, authLoading, navigate]);

    // Apply dark mode for logged-in user (per-user setting)
    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                const u = JSON.parse(stored);
                if (localStorage.getItem(`frames-dark-mode-${u.id}`) === 'true') {
                    document.body.classList.add('dark-mode');
                }
            } catch { }
        }
        return () => document.body.classList.remove('dark-mode');
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', paddingTop: '100px' }}>Loading Admin Panel...</div>;
    }

    // Ang user state ay gagamitin na ngayon sa Header at Sidebar
    return (
        <div className="dashboard-container">
            <Header theme={adminTheme} user={user} showLogo={false} toggleSidebar={toggleSidebar} isSidebarCollapsed={isCollapsed} />
            <div className="dashboard-body">
                <div
                    className={`frames-sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
                    onClick={() => setIsMobileOpen(false)}
                ></div>

                <AdminSidebar user={user} isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} />
                <div className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
                    {/* Ipasa ang user context sa Outlet */}
                    <Outlet context={{ user }} />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;