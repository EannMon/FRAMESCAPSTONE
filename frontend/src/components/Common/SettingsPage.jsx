import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SettingsPage.css';
import './Utility.css';
import Header from './Header';
import Footer from './Footer';

// --- Theme Definition ---
const redTheme = {
    primary: '#A62525',
    dark: '#c82333',
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

    // --- FIX: GET REAL USER FROM STORAGE ---
    // This connects the Settings Page to the real logged-in user
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });

    // Toggle States (Visual only for now)
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        push: true
    });

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
            {/* If embedded, don't show the internal Header */}
            {!isEmbedded && <Header theme={redTheme} user={user} setPanel={() => navigate('/')} />}

            <div className={`settings-page-container ${isEmbedded ? 'embedded' : ''} ${themeClass}`}>
                {/* Top Header Bar */}
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

                {/* Settings Grid */}
                <div className="settings-grid">

                    {/* Account Settings Card */}
                    <div className="card settings-card">
                        <h3>Account</h3>
                        <p>Manage your account and security settings.</p>

                        {/* Link to Profile for editing details */}
                        <Link to="/profile" className="settings-link-button">
                            <span>Go to My Profile</span>
                            <i className="fas fa-arrow-right"></i>
                        </Link>

                        {/* Since we implemented the password modal in MyProfilePage, 
                            we can redirect there or simply use a button that implies functionality */}
                        <button className="settings-action-button" onClick={() => navigate('/profile')}>
                            <i className="fas fa-key"></i> Change Password
                        </button>
                        <button className="settings-action-button">
                            <i className="fas fa-shield-alt"></i> Manage Two-Factor Auth
                        </button>
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
                            label="SMS Notifications"
                            isToggled={notifications.sms}
                            onToggle={() => handleToggle('sms')}
                        />
                        <ToggleSwitch
                            label="Push Notifications"
                            isToggled={notifications.push}
                            onToggle={() => handleToggle('push')}
                        />
                    </div>

                    {/* Theme Settings Card */}
                    <div className="card settings-card">
                        <h3>Theme & Appearance</h3>
                        <p>Customize the look and feel of the app.</p>
                        <div className="settings-field">
                            <label htmlFor="theme-select">Theme</label>
                            <select id="theme-select" className="settings-select-input">
                                <option>System Default</option>
                                <option>Light Mode</option>
                                <option>Dark Mode</option>
                            </select>
                        </div>
                    </div>

                    {/* Privacy Settings Card */}
                    <div className="card settings-card">
                        <h3>Privacy</h3>
                        <p>Control who can see your activity and profile.</p>
                        <button className="settings-action-button">
                            <i className="fas fa-user-secret"></i> Manage Privacy Settings
                        </button>
                        <button className="settings-action-button">
                            <i className="fas fa-history"></i> Manage Activity Data
                        </button>
                    </div>
                </div>
            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default SettingsPage;