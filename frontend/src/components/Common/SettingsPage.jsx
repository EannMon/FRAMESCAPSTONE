import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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

    // --- GET REAL USER FROM AUTH CONTEXT ---
    const { user } = useAuth();

    // Settings state — loaded from backend
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        push: true
    });
    const [theme, setTheme] = useState('system');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch settings from backend on mount
    useEffect(() => {
        const controller = new AbortController();

        const fetchSettings = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const response = await api.get(`/api/users/settings/${user.id}`, { signal: controller.signal });
                const data = response.data;
                setNotifications({
                    email: data.email_notifications ?? true,
                    sms: data.sms_notifications ?? false,
                    push: data.push_notifications ?? true,
                });
                setTheme(data.theme || 'system');
                setError(null);
            } catch (err) {
                if (err.code !== 'ERR_CANCELED') {
                    setError(err.userMessage || 'Failed to load settings.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
        return () => controller.abort();
    }, [user]);

    const handleGoBack = () => {
        navigate(-1);
    };

    // Persist toggle change to backend
    const handleToggle = async (type) => {
        const updated = { ...notifications, [type]: !notifications[type] };
        setNotifications(updated);

        try {
            setSaving(true);
            await api.put(`/api/users/settings/${user.id}`, {
                email_notifications: updated.email,
                sms_notifications: updated.sms,
                push_notifications: updated.push,
            });
        } catch (err) {
            // Revert on failure
            setNotifications(notifications);
            setError(err.userMessage || 'Failed to save setting.');
        } finally {
            setSaving(false);
        }
    };

    // Persist theme change to backend
    const handleThemeChange = async (e) => {
        const newTheme = e.target.value;
        setTheme(newTheme);

        try {
            setSaving(true);
            await api.put(`/api/users/settings/${user.id}`, { theme: newTheme });
        } catch (err) {
            setError(err.userMessage || 'Failed to save theme.');
        } finally {
            setSaving(false);
        }
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

                    {loading && (
                        <div className="card settings-card" style={{ textAlign: 'center', color: '#94a3b8' }}>
                            Loading settings...
                        </div>
                    )}

                    {error && (
                        <div className="card settings-card" style={{ color: '#ef4444' }}>
                            {error}
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Account Settings Card */}
                            <div className="card settings-card">
                                <h3>Account</h3>
                                <p>Manage your account and security settings.</p>
                            </div>

                            {/* Notification Settings Card */}
                            <div className="card settings-card">
                                <h3>Notifications</h3>
                                <p>Control how you receive notifications.{saving && ' Saving...'}</p>
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
                                    <select id="theme-select" className="settings-select-input" value={theme} onChange={handleThemeChange}>
                                        <option value="system">System Default</option>
                                        <option value="light">Light Mode</option>
                                        <option value="dark">Dark Mode</option>
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
                        </>
                    )}
                </div>
            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default SettingsPage;