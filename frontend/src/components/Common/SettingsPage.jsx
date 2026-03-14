import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
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
        email: user?.email_notifications_enabled ?? true,
        inApp: user?.in_app_notifications_enabled ?? true
    });

    // Update notifications state when user data changes
    useEffect(() => {
        if (user) {
            setNotifications({
                email: user.email_notifications_enabled ?? true,
                inApp: user.in_app_notifications_enabled ?? true
            });
        }
    }, [user]);


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

    const handleToggle = async (type) => {
        const fieldMap = {
            email: 'email_notifications_enabled',
            inApp: 'in_app_notifications_enabled'
        };
        
        const newValue = !notifications[type];
        const fieldName = fieldMap[type];

        try {
            // Update Backend
            await api.put(`/api/users/${user.id}`, { [fieldName]: newValue });
            
            // Update Local State
            setNotifications(prev => ({ ...prev, [type]: newValue }));
            
            // Update User Object and LocalStorage
            const updatedUser = { ...user, [fieldName]: newValue };
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
        } catch (err) {
            console.error(`Failed to update ${type} notifications:`, err);
            alert(`Failed to update ${type} notifications. Please try again.`);
        }
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
                            label="In-App Notifications"
                            isToggled={notifications.inApp}
                            onToggle={() => handleToggle('inApp')}
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