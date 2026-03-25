import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SettingsPage.css';
import './Utility.css';
import Header from './Header';
import Footer from './Footer';
import PasswordModal from './PasswordModal';

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

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
                            <button className="settings-action-button" onClick={() => setIsPasswordModalOpen(true)}>
                                <i className="fas fa-key"></i>
                                <span>Change Password</span>
                                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto' }}></i>
                            </button>
                        </div>
                    </div>

                    {/* Preferences Card (consolidated Notifications + Theme) */}
                    <div className="card settings-card">
                        <h3>Preferences</h3>
                        <p>Notifications and appearance settings.</p>
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
                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0' }}></div>
                        <ToggleSwitch
                            label="Dark Mode"
                            isToggled={darkMode}
                            onToggle={() => setDarkMode(!darkMode)}
                        />
                    </div>

                </div>
            </div>

            {!isEmbedded && <Footer />}

            {/* Password Modal */}
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                userId={user?.user_id || user?.id}
            />
        </>
    );
};

export default SettingsPage;