import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import '../FacultyDashboard/FacultyLayout.css'; // Reuse Faculty Styles for now
import '../Common/Utility.css';
import '../Common/GlobalDashboard.css';
import Header from '../Common/Header';
import Logo from '../Common/Logo';

// --- THEME DEFINITION (Dept Head - Navy/Gold Accent?) ---
const deptHeadTheme = {
    primary: '#FFFFFF',
    dark: '#E2E8F0',
    lightBg: '#F1F5F9',
    text: '#163269'
};

const DeptHeadSidebar = ({ user, isCollapsed }) => {
    // Navigation Items for Department Head
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/dept-head-dashboard' },
        { name: 'Department Mgmt', icon: 'fas fa-university', to: '/dept-head-management' },

        { name: 'User Management', icon: 'fas fa-users-cog', to: '/dept-head-users' },
        { name: 'Reports', icon: 'fas fa-chart-line', to: '/dept-head-reports' },
        { name: 'System Logs', icon: 'fas fa-clipboard-list', to: '/dept-head-logs' },
        { type: 'divider' },
        { name: 'Settings', icon: 'fas fa-cog', to: '/dept-head-settings' },
        { name: 'Help & Support', icon: 'fas fa-question-circle', to: '/dept-head-help' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    const firstName = user?.first_name || user?.firstName || '';
    const lastName = user?.last_name || user?.lastName || '';
    const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : (user?.name || 'Dept Head');
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=163269&color=fff`;

    return (
        <aside className={`frames-sidebar dept-head-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* BRANDING */}
            <div className="sidebar-brand">
                <div className="sidebar-logo-container">
                    <Logo className="sidebar-logo-icon" size={42} colorShift />
                </div>
                {!isCollapsed && (
                    <div className="sidebar-brand-text-group">
                        <span className="sidebar-brand-title">FRAMES</span>
                        <span className="sidebar-brand-subtitle">DEPT HEAD</span>
                    </div>
                )}
            </div>

            {/* Role Tag */}
            {!isCollapsed && (
                <div className="frames-role-tag">
                    Department Head
                </div>
            )}

            <nav className="faculty-nav">
                <ul>
                    {navItems.map((item, index) => (
                        item.type === 'divider' ? (
                            <li key={`divider-${index}`} className="nav-divider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '10px 20px' }}></li>
                        ) : (
                            <li key={item.name}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) => `frames-sidebar-link ${isActive ? 'active' : ''}`}
                                    title={isCollapsed ? item.name : ''}
                                >
                                    <i className={item.icon}></i>
                                    <span>{item.name}</span>
                                </NavLink>
                            </li>
                        )
                    ))}
                </ul>
            </nav>

            {/* USER PROFILE FOOTER */}
            <div className="sidebar-user-footer">
                <Link to="/dept-head-profile" className="sidebar-user-info" title="View Profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, color: 'inherit', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                    <img src={avatarSrc} alt="Profile" className="sidebar-user-avatar" />
                    {!isCollapsed && (
                        <div className="sidebar-user-details" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="sidebar-user-name" style={{ fontWeight: '600', fontSize: '0.9rem' }}>{displayName}</span>
                            <span className="sidebar-user-role" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Dept. Head</span>
                        </div>
                    )}
                </Link>
                {!isCollapsed && (
                    <button onClick={handleLogout} className="sidebar-logout-btn" title="Logout">
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                )}
            </div>
        </aside>
    );
};

const DeptHeadLayout = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            const storedUserJson = localStorage.getItem('currentUser');

            if (!storedUserJson) {
                navigate('/');
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(storedUserJson);
            const role = parsedUser.role?.toLowerCase();

            // Strict Role Check
            if (role !== 'head' && role !== 'dept_head') {
                alert("Access denied. Authorized for Department Heads only.");
                navigate('/');
                return;
            }

            setUser({
                ...parsedUser,
                name: `${parsedUser.first_name} ${parsedUser.last_name}`
            });
            setLoading(false);
        };

        loadUserData();
    }, [navigate]);

    if (loading) return <div style={{ textAlign: 'center', paddingTop: '100px', color: '#666' }}>Loading dashboard...</div>;
    if (!user) return null;

    return (
        <div className="dashboard-container">
            <Header
                theme={deptHeadTheme}
                user={user}
                showLogo={false}
                toggleSidebar={() => setIsCollapsed(!isCollapsed)}
                isSidebarCollapsed={isCollapsed}
            />
            <div className="dashboard-body">
                <DeptHeadSidebar user={user} isCollapsed={isCollapsed} />
                <main className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DeptHeadLayout;
