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

                <div className="settings-grid">

                    {/* Account Settings Card */}
                    <div className="card settings-card">
                        <h3>Account</h3>
                        <p>Manage your account and security settings.</p>
                        
                        <div className="account-info-section">
                            <div className="account-info-item">
                                <label>Email Address</label>
                                <span className="account-info-value">{user?.email || 'Not set'}</span>
                            </div>
                            <div className="account-info-item">
                                <label>Full Name</label>
                                <span className="account-info-value">
                                    {user?.first_name && user?.last_name 
                                        ? `${user.first_name} ${user.last_name}` 
                                        : 'Not set'}
                                </span>
                            </div>
                            <div className="account-info-item">
                                <label>Account Type</label>
                                <span className="account-info-value account-role">
                                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        <div className="account-actions">
                            <button className="settings-action-button">
                                <i className="fas fa-key"></i>
                                <span>Change Password</span>
                                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto' }}></i>
                            </button>
                            <button className="settings-action-button">
                                <i className="fas fa-envelope"></i>
                                <span>Change Email</span>
                                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto' }}></i>
                            </button>
                            <button className="settings-action-button">
                                <i className="fas fa-shield-alt"></i>
                                <span>Security Settings</span>
                                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto' }}></i>
                            </button>
                        </div>
                    </div>

                    {/* Notification Settings Card */}
                    <div className="card settings-card">
                        <h3>Notifications</h3>
                        <p>Control how you receive notifications.</p>
                        <ToggleSwitch
                            label="Email Notifications"
                            isToggled={notifications.email}
                            onToggle={() => handleToggle('email')}
                        />
                        <ToggleSwitch
                            label="Push Notifications"
                            isToggled={notifications.push}
                            onToggle={() => handleToggle('push')}
                        />
                    </div>

                    {/* Theme Settings Card - with functional dark mode */}
                    <div className="card settings-card">
                        <h3>Theme & Appearance</h3>
                        <p>Customize the look and feel of the app.</p>
                        <ToggleSwitch
                            label="Dark Mode"
                            isToggled={darkMode}
                            onToggle={() => setDarkMode(!darkMode)}
                        />
                    </div>

                </div>
            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default SettingsPage;