import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Header.css';

const LOGO_ICON = '/shield-icon-white.svg';

const mockNotifications = [
    { id: 1, icon: 'fas fa-user-shield', text: 'New admin alert: Unauthorized access attempt.', time: '5m ago', read: false },
    { id: 2, icon: 'fas fa-chalkboard-teacher', text: 'Prof. Cruz updated CS 101 grades.', time: '1h ago', read: false },
    { id: 3, icon: 'fas fa-calendar-check', text: 'Your room booking for tomorrow is confirmed.', time: '3h ago', read: true },
    { id: 4, icon: 'fas fa-exclamation-triangle', text: 'System Maintenance is scheduled for 8 PM.', time: '1d ago', read: true },
];

const Header = ({ user, setPanel, theme, showLogo = true, toggleSidebar, isSidebarCollapsed }) => {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/');
        window.location.reload();
    };

    const toggleProfile = () => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); };
    const toggleNotifications = () => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target)) setIsNotificationOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- THEME STYLES ---
    const dynamicStyle = theme ? {
        '--header-bg': theme.primary,
        '--header-text': theme.text,
        '--header-hover': theme.lightBg,
        '--border-color': theme.dark,
        '--logo-filter': 'none',
        '--notif-dot-bg': '#ffc107',
        '--notif-dot-text': '#333'
    } : {};

    // --- 1. NAME LOGIC ---
    // Backend returns snake_case (first_name, last_name), fallback to camelCase
    const firstName = user?.first_name || user?.firstName || '';
    const lastName = user?.last_name || user?.lastName || '';
    const displayName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : (user?.name || 'User');

    // --- 2. AVATAR LOGIC (MATCHES PROFILE PAGE) ---
    // Background is now fixed to A62525 (Red) instead of 'random'
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A62525&color=fff`;

    // --- 3. PAGE TITLE & DATE LOGIC (Student Context) ---
    const location = useLocation();
    
    const getPageTitle = (path) => {
        if (path.includes('/student-dashboard')) return 'Dashboard';
        if (path.includes('/student-schedule')) return 'Schedule';
        if (path.includes('/student-attendance')) return 'Attendance History';
        if (path.includes('/profile')) return 'My Profile';
        if (path.includes('/settings') || path.includes('/student-settings') || path.includes('/faculty-settings')) return 'Settings';
        if (path.includes('/help-support') || path.includes('/student-help') || path.includes('/faculty-help')) return 'Help & Support';
        
        // Faculty Routes
        if (path.includes('/faculty-dashboard')) return 'Dashboard';
        if (path.includes('/faculty-classes')) return 'My Classes';
        if (path.includes('/faculty-attendance')) return 'Attendance';
        if (path.includes('/faculty-reports')) return 'Reports';
        if (path.includes('/faculty-dept-management')) return 'Department Management';
        if (path.includes('/faculty-dept-reports')) return 'Department Reports';
        
        return '';
    };
    
    const pageTitle = getPageTitle(location.pathname);
    
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="universal-header" style={dynamicStyle}>
            {showLogo ? (
                <Link to={user ? (user.role === 'admin' ? "/admin-dashboard" : user.role === 'faculty' ? "/faculty-dashboard" : "/student-dashboard") : "/"} className="header-logo-link">
                    <div className="universal-header-logo">
                        <img src={LOGO_ICON} alt="Frames Logo" className="header-logo-icon" />
                        <span>FRAMES</span>
                    </div>
                </Link>
            ) : (
                /* Contextual Header for Student/Faculty (Logo Hidden) */
                <div className={`header-context-section ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                    {toggleSidebar && (
                        <button className="header-sidebar-toggle" onClick={toggleSidebar}>
                            <i className="fas fa-bars"></i>
                        </button>
                    )}
                    <div className="header-title-group">
                        <h1 className="header-page-title">{pageTitle}</h1>
                        <span className="header-current-date">{currentDate}</span>
                    </div>
                </div>
            )}

            <div className="universal-header-actions">
                {user ? (
                    <>
                        <div className="notification-bell-container" ref={notificationRef}>
                            <button className="icon-button notification-trigger" onClick={toggleNotifications}>
                                <i className="far fa-bell"></i>
                                {mockNotifications.some(n => !n.read) && (
                                    <span className="notification-count-text">
                                        {mockNotifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className="notification-dropdown-menu">
                                    <div className="notification-dropdown-header">
                                        <h3>Notifications</h3>
                                        <span className="mark-as-read">Mark all as read</span>
                                    </div>
                                    <div className="notification-list">
                                        {mockNotifications.map(notif => (
                                            <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                                                <div className="notification-icon-bg">
                                                    <i className={notif.icon}></i>
                                                </div>
                                                <div className="notification-content">
                                                    <p className="notification-text">{notif.text}</p>
                                                    <span className="notification-time">{notif.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="notification-dropdown-footer">
                                        <Link to="/notifications">View All Notifications</Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown Removed - Moved to Sidebar */}
                    </>
                ) : (
                    <nav className="guest-nav">
                        <button onClick={() => setPanel('login')} className="header-login-btn">Login</button>
                        <button onClick={() => setPanel('signup')} className="header-signup-btn">Get Started</button>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;