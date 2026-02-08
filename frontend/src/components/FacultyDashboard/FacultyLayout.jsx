import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './FacultyLayout.css';
import '../Common/Utility.css';
import '../Common/GlobalDashboard.css'; // Import Global Styles
import Header from '../Common/Header';

// --- THEME DEFINITION (Navy) ---
const facultyTheme = {
    primary: '#FFFFFF', // White Header (Admin Style)
    dark: '#E2E8F0',    // Light Border
    lightBg: '#F1F5F9', // Hover Color
    text: '#163269'     // Navy Text
};

// ===========================================
// 1. Faculty Sidebar Component
// ===========================================
const FacultySidebar = ({ user, isCollapsed, toggleSidebar }) => {
    const role = user?.role?.toUpperCase();
    const isDeptHead = role === 'HEAD' ||
        user?.faculty_status === 'Head' ||
        user?.faculty_status === 'Department Head' ||
        role === 'DEPT_HEAD';

    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports' },
        { type: 'divider' },
        { name: 'Settings', icon: 'fas fa-cog', to: '/faculty-settings' },
        { name: 'Help & Support', icon: 'fas fa-question-circle', to: '/faculty-help' },
    ];

    if (isDeptHead) {
        // Insert Department Management items before divider
        const insertIndex = 4; // Before divider
        navItems.splice(insertIndex, 0, 
            { name: 'Department Mgmt', icon: 'fas fa-university', to: '/faculty-dept-management' },
            { name: 'Dept Reports', icon: 'fas fa-file-alt', to: '/faculty-dept-reports' }
        );
    }

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    // Construct Name for Profile Section
    const firstName = user?.first_name || user?.firstName || '';
    const lastName = user?.last_name || user?.lastName || '';
    const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : (user?.name || 'Faculty');
    // Avatar
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=163269&color=fff`;

    return (
        <aside className={`frames-sidebar ${isDeptHead ? 'dept-head-sidebar' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            
            {/* BRANDING (Matched to Student Module) */}
            <div className="sidebar-brand">
                <div className="sidebar-logo-container">
                    <img src="/shield-icon-white.svg" alt="Frames Logo" className="sidebar-logo-icon" />
                </div>
                {!isCollapsed && (
                    <div className="sidebar-brand-text-group">
                        <span className="sidebar-brand-title">FRAMES</span>
                    </div>
                )}
            </div>

            {/* Role Tag */}
            {!isCollapsed && (
                <div className="frames-role-tag">
                    {isDeptHead ? "Department Head" : "Faculty Member"}
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
                <Link to="/profile" className="sidebar-user-info" title="View Profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, color: 'inherit', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                    <img src={avatarSrc} alt="Profile" className="sidebar-user-avatar" />
                    {!isCollapsed && (
                        <div className="sidebar-user-details" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="sidebar-user-name" style={{ fontWeight: '600', fontSize: '0.9rem' }}>{displayName}</span>
                            <span className="sidebar-user-role" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{isDeptHead ? "Dept. Head" : "Faculty"}</span>
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

// ===========================================
// 2. Main FacultyLayout Component
// ===========================================
const FacultyLayout = () => {
    const navigate = useNavigate();

    // States for user data and loading
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

            // --- 1. SECURITY CHECK ---
            if (parsedUser.verification_status !== 'Verified') {
                alert("Access denied. Pending verification.");
                localStorage.removeItem('currentUser');
                navigate('/');
                return;
            }

            if (role !== 'faculty' && role !== 'head' && role !== 'dept_head') {
                alert("Access denied. Authorized for Faculty only.");
                navigate('/');
                return;
            }

            // --- 2. FACE ENROLLMENT CHECK ---
            if (!parsedUser.face_registered) {
                navigate('/face-enrollment');
                return;
            }

            const firstName = parsedUser.first_name || parsedUser.firstName || '';
            const lastName = parsedUser.last_name || parsedUser.lastName || '';
            setUser({
                ...parsedUser,
                first_name: firstName,
                last_name: lastName,
                name: `${firstName} ${lastName}`.trim() || 'Faculty',
                faculty_status: parsedUser.faculty_status || 'Regular'
            });

            setLoading(false);
        };

        loadUserData();
    }, [navigate]);

    if (loading) {
        return <div style={{ textAlign: 'center', paddingTop: '100px', color: '#666' }}>Loading dashboard...</div>;
    }

    if (!user) return null;

    return (
        <div className="dashboard-container">
            {/* Header: Pass theme props and hide logo to show Page Title */ }
            <Header 
                theme={facultyTheme} 
                user={user} 
                showLogo={false} 
                toggleSidebar={() => setIsCollapsed(!isCollapsed)} 
                isSidebarCollapsed={isCollapsed} 
            />

            <div className="dashboard-body">
                <FacultySidebar user={user} isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />

                <div className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
                    <Outlet context={{ user }} />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;