import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SettingsPage.css';
import './Utility.css';
import Header from './Header';
import Footer from './Footer';

// --- Theme Definition ---
const navyTheme = {
    primary: '#0F172A',
    dark: '#163269',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// Reusable Toggle Switch Component
// ===========================================
const ToggleSwitch = ({ label, isToggled, onToggle }) => (
    <div className="toggle-switch-container">
        <label className="toggle-switch-label">{label}</label>
        <label className="toggle-switch">
            <input type="checkbox" checked={isToggled} onChange={onToggle} />
            <span className="toggle-slider"></span>
        </label>
    </div>
);

// ===========================================
// Main Settings Page Component
// ===========================================
const SettingsPage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });

    // Notification Toggles
    const [notifications, setNotifications] = useState({
        email: true,
        push: true
    });

    // Dark Mode State - persisted per user in localStorage
    const getDarkModeKey = () => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                const u = JSON.parse(stored);
                return `frames-dark-mode-${u.id}`;
            } catch { return null; }
        }
        return null;
    };

    const [darkMode, setDarkMode] = useState(() => {
        const key = getDarkModeKey();
        return key ? localStorage.getItem(key) === 'true' : false;
    });

    // Apply dark mode class to body whenever it changes
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        const key = getDarkModeKey();
        if (key) localStorage.setItem(key, darkMode.toString());
    }, [darkMode]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleToggle = (type) => {
        setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const role = user?.role?.toLowerCase();
    const isFaculty = role === 'faculty' || role === 'dept_head' || role === 'head';
    const themeClass = isFaculty ? 'faculty-theme' : '';

    return (
        <>
            {!isEmbedded && <Header theme={navyTheme} user={user} setPanel={() => navigate('/')} />}

            <div className={`settings-page-container ${isEmbedded ? 'embedded' : ''} ${themeClass}`}>
                {!isEmbedded && (
                    <div className="settings-header-bar">
                        <div className="settings-header-left">
                            <button className="settings-back-button" onClick={handleGoBack}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h1 className="settings-main-title">Settings</h1>
                        </div>
                    </div>
                )}

                <div className="settings-content-wrapper">
                    {/* Unified Settings Container */}
                    <div className="settings-main-container">
                        
                        {/* Profile Section */}
                        <section className="settings-section">
                            <h2 className="section-title">Profile Information</h2>
                            <div className="settings-item-group">
                                <div className="settings-item">
                                    <div className="settings-item-info">
                                        <label>Full Name</label>
                                        <p>
                                            {user?.first_name && user?.last_name 
                                                ? `${user.first_name} ${user.last_name}` 
                                                : 'Not set'}
                                        </p>
                                    </div>
                                </div>
                                <div className="settings-item">
                                    <div className="settings-item-info">
                                        <label>Email Address</label>
                                        <p>{user?.email || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="settings-item">
                                    <div className="settings-item-info">
                                        <label>Account Role</label>
                                        <div className="role-chip">
                                            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="settings-divider" />

                        {/* Notifications Section */}
                        <section className="settings-section">
                            <h2 className="section-title">Notifications</h2>
                            <div className="settings-item-group">
                                <div className="settings-item">
                                    <div className="settings-item-info">
                                        <label>Email Alerts</label>
                                        <p>Receive updates and security alerts via email</p>
                                    </div>
                                    <ToggleSwitch
                                        isToggled={notifications.email}
                                        onToggle={() => handleToggle('email')}
                                    />
                                </div>
                                <div className="settings-item">
                                    <div className="settings-item-info">
                                        <label>Push Notifications</label>
                                        <p>Get real-time browser notifications for important events</p>
                                    </div>
                                    <ToggleSwitch
                                        isToggled={notifications.push}
                                        onToggle={() => handleToggle('push')}
                                    />
                                </div>
                            </div>
                        </section>

                        <hr className="settings-divider" />

                        {/* Appearance Section */}
                        <section className="settings-section">
                            <h2 className="section-title">Appearance</h2>
                            <div className="settings-item-group">
                                <div className="settings-item">
                                    <div className="settings-item-info">
                                        <label>Dark Mode</label>
                                        <p>Switch between light and dark themes</p>
                                    </div>
                                    <ToggleSwitch
                                        isToggled={darkMode}
                                        onToggle={() => setDarkMode(!darkMode)}
                                    />
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default SettingsPage;