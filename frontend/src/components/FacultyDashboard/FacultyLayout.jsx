import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../Common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import './FacultyLayout.css';
import '../Common/Utility.css';
import '../Common/GlobalDashboard.css'; // Import Global Styles
import Header from '../Common/Header';
import Logo from '../Common/Logo';

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
const FacultySidebar = ({ user, isCollapsed, isMobileOpen, toggleMobile }) => {
    // Popup state
    const [showPopup, setShowPopup] = useState(false);
    const popupRef = useRef(null);

    // Click outside to close popup
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
            }
        };

        if (showPopup) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPopup]);

    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Profile', icon: 'fas fa-user', to: '/faculty-profile' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports' },
        { type: 'divider' },
        { name: 'Settings', icon: 'fas fa-cog', to: '/faculty-settings' },
        { name: 'Help & Support', icon: 'fas fa-question-circle', to: '/faculty-help' },
    ];

    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    // Construct Name for Profile Section
    const firstName = user?.first_name || user?.firstName || '';
    const lastName = user?.last_name || user?.lastName || '';
    const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : (user?.name || 'Faculty');
    // Avatar
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=163269&color=fff`;

    return (
        <aside className={`frames-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
            {/* BRANDING (Matched to Student Module) */}
            <div className="sidebar-brand">
                <div className="sidebar-logo-container">
                    <Logo className="sidebar-logo-icon" size={42} colorShift />
                </div>
                {!isCollapsed && (
                    <div className="sidebar-brand-text-group">
                        <span className="sidebar-brand-title">FRAMES</span>
                    </div>
                )}
                {/* Mobile Close Button */}
                <button className="mobile-sidebar-close" onClick={toggleMobile}>
                    <i className="fas fa-chevron-left"></i>
                </button>
            </div>

            {/* Role Tag */}
            {!isCollapsed && (
                <div className="frames-role-tag">
                    Faculty Member
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
            <div className="sidebar-user-footer" ref={popupRef}>
                <Link
                    to="/faculty-profile"
                    className="sidebar-user-info"
                    title="View Profile"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, color: 'inherit', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                    onClick={(e) => {
                        if (isCollapsed) {
                            e.preventDefault();
                            setShowPopup(!showPopup);
                        }
                    }}
                >
                    <img src={avatarSrc} alt="Profile" className="sidebar-user-avatar" />
                    {!isCollapsed && (
                        <div className="sidebar-user-details" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="sidebar-user-name" style={{ fontWeight: '600', fontSize: '0.9rem' }}>{displayName}</span>
                            <span className="sidebar-user-role" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{user?.email || 'Faculty Account'}</span>
                        </div>
                    )}
                </Link>
                {!isCollapsed && (
                    <button onClick={handleLogout} className="sidebar-logout-btn" title="Logout">
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                )}

                {/* POPUP MENU */}
                {isCollapsed && showPopup && (
                    <div className="sidebar-profile-popup">
                        <div className="popup-user-info">
                            <span className="popup-user-name">{displayName}</span>
                            <span className="popup-user-email">{user?.email || 'Faculty Account'}</span>
                        </div>
                        <div className="popup-menu-list">
                            <Link to="/faculty-profile" className="popup-menu-item" onClick={() => setShowPopup(false)}>
                                <i className="fas fa-user-cog"></i> Account Settings
                            </Link>
                            <button className="popup-menu-item logout-item" onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
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
    const toast = useToast();
    const { user: authUser, isLoading: authLoading, logout: authLogout } = useAuth();

    // States for user data and loading
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

    useEffect(() => {
        if (authLoading) return; // Wait for AuthContext to initialize

        if (!authUser) {
            navigate('/');
            return;
        }

        const role = authUser.role?.toLowerCase();

        // --- 1. SECURITY CHECK ---
        if (authUser.verification_status !== 'Verified') {
            toast.error("Access denied. Pending verification.");
            authLogout();
            navigate('/');
            return;
        }

        if (role !== 'faculty' && role !== 'head' && role !== 'dept_head') {
            alert("Access denied. Authorized for Faculty only.");
            navigate('/');
            return;
        }

        // --- 2. FACE ENROLLMENT CHECK ---
        if (!authUser.face_registered) {
            navigate('/face-enrollment');
            return;
        }

        const firstName = authUser.first_name || authUser.firstName || '';
        const lastName = authUser.last_name || authUser.lastName || '';
        setUser({
            ...authUser,
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`.trim() || 'Faculty',
            faculty_status: authUser.faculty_status || 'Regular'
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
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    if (!user) return null;

    return (
        <div className="dashboard-container">
            {/* Header: Pass theme props and hide logo to show Page Title */}
            <Header
                theme={facultyTheme}
                user={user}
                showLogo={false}
                toggleSidebar={toggleSidebar}
                isSidebarCollapsed={isCollapsed}
            />

            <div className="dashboard-body">
                {/* Mobile overlay */}
                <div
                    className={`frames-sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
                    onClick={() => setIsMobileOpen(false)}
                ></div>

                <FacultySidebar user={user} isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} toggleMobile={() => setIsMobileOpen(false)} />

                <div className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
                    <Outlet context={{ user }} />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;