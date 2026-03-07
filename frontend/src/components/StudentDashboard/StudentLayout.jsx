import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../Common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import './StudentLayout.css';
import '../Common/Utility.css';
import '../Common/GlobalDashboard.css'; // Import Global Styles
import Header from '../Common/Header';
import Logo from '../Common/Logo';

// --- THEME DEFINITION ---
const studentTheme = {
    primary: '#FFFFFF', // White Header
    dark: '#E2E8F0',    // Light Border
    lightBg: '#F1F5F9', // Hover Color
    text: '#0F172A'     // Dark Navy Text
};

// ===========================================
// 1. Student Sidebar Component
// ===========================================
const StudentSidebar = ({ user, isMobileOpen, toggleMobile, isCollapsed }) => {
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
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/student-dashboard' },
        { name: 'My Profile', icon: 'fas fa-user', to: '/student-profile' },
        { name: 'Schedule', icon: 'fas fa-calendar-alt', to: '/student-schedule' },
        { name: 'Attendance History', icon: 'fas fa-history', to: '/student-attendance' },
        { type: 'divider' },
        { name: 'Settings', icon: 'fas fa-cog', to: '/student-settings' },
        { name: 'Help & Support', icon: 'fas fa-question-circle', to: '/student-help' },
    ];

    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    // Construct Name
    const firstName = user?.first_name || user?.firstName || '';
    const lastName = user?.last_name || user?.lastName || '';
    const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : (user?.name || 'Student');

    // Avatar
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=fff`;

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            <div
                className={`frames-sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
                onClick={toggleMobile}
            ></div>

            <aside className={`frames-sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                {/* BRANDING HEADER */}
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
                        STUDENT
                    </div>
                )}

                <nav className="student-nav">
                    <ul>
                        {navItems.map((item, index) => (
                            item.type === 'divider' ? (
                                <li key={`divider-${index}`} className="nav-divider"></li>
                            ) : (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.to}
                                        end={item.to === '/student-dashboard'}
                                        onClick={() => isMobileOpen && toggleMobile()} // Close on click mobile
                                        className={({ isActive }) => `frames-sidebar-link ${isActive ? 'active' : ''}`} // Use Global Class
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
                        to="/student-profile"
                        className="sidebar-user-info"
                        title="View Profile"
                        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                        onClick={(e) => {
                            if (isCollapsed) {
                                e.preventDefault();
                                setShowPopup(!showPopup);
                            }
                        }}
                    >
                        <img src={avatarSrc} alt="Profile" className="sidebar-user-avatar" />
                        {!isCollapsed && (
                            <div className="sidebar-user-details">
                                <span className="sidebar-user-name">{displayName}</span>
                                <span className="sidebar-user-role">{user?.email || 'Student Account'}</span>
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
                                <span className="popup-user-email">{user?.email || 'Student Account'}</span>
                            </div>
                            <div className="popup-menu-list">
                                <Link to="/student-profile" className="popup-menu-item" onClick={() => setShowPopup(false)}>
                                    <i className="fas fa-user-cog"></i> Account Settings
                                </Link>
                                <button className="popup-menu-item logout-item" onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside >
        </>
    );
};

// ===========================================
// 2. Main StudentLayout Component
// ===========================================
const StudentLayout = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user: authUser, isLoading: authLoading, logout: authLogout } = useAuth();

    // State for user data and loading status
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed State

    const toggleSidebar = () => {
        if (window.innerWidth <= 992) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    // FETCH USER DATA & SECURITY CHECK (uses AuthContext)
    useEffect(() => {
        if (authLoading) return; // Wait for AuthContext to initialize

        if (!authUser) {
            navigate('/');
            return;
        }

        // --- SECURITY CHECK: VERIFICATION STATUS ---
        if (authUser.verification_status !== 'Verified') {
            toast.error("Access denied. Your account is still pending verification.");
            authLogout();
            navigate('/');
            return;
        }

        // --- SECURITY CHECK: FACE ENROLLMENT ---
        if (!authUser.face_registered) {
            navigate('/face-enrollment');
            return;
        }

        // --- FETCH LIVE NOTIFICATIONS ---
        const controller = new AbortController();
        const fetchNotifications = async () => {
            let notifCount = 0;
            try {
                const userId = authUser.id || authUser.user_id;
                const response = await api.get(`/api/student/dashboard/${userId}`, { signal: controller.signal });
                const notifs = response.data.notifications || [];
                notifCount = notifs.filter(n => !n.is_read).length;
            } catch (error) {
                if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                    console.error("Failed to fetch notification count", error);
                }
            }

            // --- UPDATE STATE ---
            if (!controller.signal.aborted) {
                setUser({
                    ...authUser,
                    notifications: notifCount
                });
                setLoading(false);
            }
        };

        fetchNotifications();

        return () => controller.abort();
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
            <Header
                user={user}
                setPanel={() => { }}
                theme={studentTheme}
                showLogo={false}
                toggleSidebar={toggleSidebar}
                isSidebarCollapsed={isCollapsed}
            />

            <div className="dashboard-body">
                <StudentSidebar
                    user={user}
                    isMobileOpen={isMobileOpen}
                    toggleMobile={() => setIsMobileOpen(false)}
                    isCollapsed={isCollapsed}
                />
                <main className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
                    <Outlet context={{ user }} />
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;