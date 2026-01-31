import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';

const LOGO_ICON = '/shield-icon-white.svg'; 

const mockNotifications = [
    { id: 1, icon: 'fas fa-user-shield', text: 'New admin alert: Unauthorized access attempt.', time: '5m ago', read: false },
    { id: 2, icon: 'fas fa-chalkboard-teacher', text: 'Prof. Cruz updated CS 101 grades.', time: '1h ago', read: false },
    { id: 3, icon: 'fas fa-calendar-check', text: 'Your room booking for tomorrow is confirmed.', time: '3h ago', read: true },
    { id: 4, icon: 'fas fa-exclamation-triangle', text: 'System Maintenance is scheduled for 8 PM.', time: '1d ago', read: true },
];

const Header = ({ user, setPanel, theme }) => {
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
    const displayName = (user?.firstName && user?.lastName) 
        ? `${user.firstName} ${user.lastName}`
        : (user?.name || 'User');

    // --- 2. AVATAR LOGIC (MATCHES PROFILE PAGE) ---
    // Background is now fixed to A62525 (Red) instead of 'random'
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A62525&color=fff`;

    return (
        <header className="universal-header" style={dynamicStyle}>
            
            <Link to={user ? "/faculty-dashboard" : "/"} className="header-logo-link">
                <div className="universal-header-logo">
                    <img src={LOGO_ICON} alt="Frames Logo" className="header-logo-icon" />
                    <span>FRAMES</span>
                </div>
            </Link>

            <div className="universal-header-actions">
                {user ? (
                    <>
                        <div className="notification-bell-container" ref={notificationRef}>
                            <button className="icon-button circular-icon-button" onClick={toggleNotifications}>
                                <i className="fas fa-bell"></i>
                                {mockNotifications.some(n => !n.read) && (
                                    <span className="notification-dot">
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

                        <div className="profile-menu-container" ref={profileRef}>
                            <div className="user-menu" onClick={toggleProfile}>
                                <img 
                                    src={avatarSrc} 
                                    alt="User Avatar" 
                                    className="user-avatar" 
                                />
                                <span className="user-role">{displayName}</span>
                                <i className={`fas fa-chevron-down dropdown-icon ${isProfileOpen ? 'open' : ''}`}></i>
                            </div>

                            {isProfileOpen && (
                                <div className="header-dropdown-menu">
                                    <Link to="/profile" className="header-dropdown-item"><i className="fas fa-user"></i> My Profile</Link>
                                    <Link to="/help-support" className="header-dropdown-item"><i className="fas fa-question-circle"></i> Help & Support</Link>
                                    <Link to="/settings" className="header-dropdown-item"><i className="fas fa-cog"></i> Settings</Link>
                                    <button onClick={handleLogout} className="header-dropdown-item dropdown-logout-button">
                                        <i className="fas fa-sign-out-alt"></i> Log-out
                                    </button>
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