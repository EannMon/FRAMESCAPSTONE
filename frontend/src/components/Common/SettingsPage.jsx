import React, { useState, useEffect } from 'react';
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

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });

    // Notification Toggles
    const [notifications, setNotifications] = useState({
        email: true,
        push: true
    });

    // Dark Mode State - persisted in localStorage
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('frames-dark-mode') === 'true';
    });

    // Apply dark mode class to body whenever it changes
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('frames-dark-mode', darkMode.toString());
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
            {!isEmbedded && <Header theme={redTheme} user={user} setPanel={() => navigate('/')} />}

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