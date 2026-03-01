import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Header.css';
import Logo from './Logo';

const Header = ({ user, setPanel, theme, showLogo = true, toggleSidebar, isSidebarCollapsed }) => {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.id) return;
            try {
                const response = await axios.get(`http://localhost:5000/api/users/notifications/${user.id}`);
                setNotifications(response.data || []);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchNotifications();
        // Optional: Poll for new notifications
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

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

    const firstName = user?.first_name || user?.firstName || '';
    const lastName = user?.last_name || user?.lastName || '';
    const displayName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : (user?.name || 'User');

    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A62525&color=fff`;

    const location = useLocation();

    const getPageTitle = (path) => {
        if (path.includes('/student-dashboard')) return 'Dashboard';
        if (path.includes('/student-schedule')) return 'Schedule';
        if (path.includes('/student-attendance')) return 'Attendance History';
        if (path.includes('/profile') || path.includes('/student-profile') || path.includes('/faculty-profile')) return 'My Profile';
        if (path.includes('/settings') || path.includes('/student-settings') || path.includes('/faculty-settings')) return 'Settings';
        if (path.includes('/help-support') || path.includes('/student-help') || path.includes('/faculty-help')) return 'Help & Support';

        // Faculty Routes
        if (path.includes('/faculty-dashboard')) return 'Dashboard';
        if (path.includes('/faculty-classes')) return 'My Classes';
        if (path.includes('/faculty-attendance')) return 'Attendance';
        if (path.includes('/faculty-reports')) return 'Reports';
        if (path.includes('/faculty-dept-management')) return 'Department Management';
        if (path.includes('/faculty-dept-reports')) return 'Department Reports';

        // Dept Head Routes
        if (path.includes('/dept-head-dashboard')) return 'Dashboard';
        if (path.includes('/dept-head-management')) return 'Department Management';
        if (path.includes('/dept-head-verification')) return 'User Verification';
        if (path.includes('/dept-head-users')) return 'User Management';
        if (path.includes('/dept-head-reports')) return 'Reports';
        if (path.includes('/dept-head-logs')) return 'System Logs';
        if (path.includes('/dept-head-settings')) return 'Settings';
        if (path.includes('/dept-head-help')) return 'Help & Support';
        if (path.includes('/dept-head-profile')) return 'My Profile';

        return '';
    };

    const pageTitle = getPageTitle(location.pathname);

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const handleNotificationClick = (link) => {
        if (link) {
            navigate(link);
            setIsNotificationOpen(false);
        }
    };

    return (
        <header className="universal-header" style={dynamicStyle}>
            {showLogo ? (
                <Link to={user ? (user.role === 'admin' ? "/admin-dashboard" : user.role === 'faculty' ? "/faculty-dashboard" : "/student-dashboard") : "/"} className="header-logo-link">
                    <div className="universal-header-logo">
                        <Logo className="header-logo-icon" size={42} colorShift />
                        <span>FRAMES</span>
                    </div>
                </Link>
            ) : (
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
                                {notifications.some(n => !n.read) && (
                                    <span className="notification-count-text">
                                        {notifications.filter(n => !n.read).length}
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
                                        {notifications.length > 0 ? (
                                            notifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                                                    onClick={() => handleNotificationClick(notif.link)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="notification-icon-bg">
                                                        <i className={notif.icon}></i>
                                                    </div>
                                                    <div className="notification-content">
                                                        <p className="notification-text">{notif.text}</p>
                                                        <span className="notification-time">{notif.time}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="notification-item" style={{ justifyContent: 'center', color: '#94a3b8' }}>
                                                No new notifications
                                            </div>
                                        )}
                                    </div>
                                    <div className="notification-dropdown-footer">
                                        <Link to={
                                            user?.role?.toLowerCase() === 'student' ? '/student-notifications' :
                                                (user?.role?.toLowerCase() === 'faculty' || user?.role?.toLowerCase() === 'head' || user?.role?.toLowerCase() === 'dept_head') ? '/dept-head-logs' :
                                                    '/notifications'
                                        }>View All Logs</Link>
                                    </div>
                                </div>
                            )}
                        </div>
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
