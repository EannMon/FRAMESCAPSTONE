import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SettingsPage.css'; // New CSS file for this page
import '../ZCommon/Utility.css';
import LoggedInHeader from './LoggedInHeader';
import Footer from './Footer'; // <-- 1. IMPORT FOOTER

// --- Mock Theme & User for Header ---
const redTheme = {
    primary: '#A62525',
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};
const mockUser = {
    name: 'Admin User',
    avatar: 'https://placehold.co/100x100/f8d7da/dc3545?text=A',
    notifications: 3
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
const SettingsPage = () => {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate(-1); // Go back one step in history
    };

    return (
        <>
            <LoggedInHeader theme={redTheme} user={mockUser} />
            <div className="settings-page-container">
                {/* Top Header Bar */}
                <div className="settings-header-bar">
                    <div className="settings-header-left">
                        <button className="settings-back-button" onClick={handleGoBack}>
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h1 className="settings-main-title">Settings</h1>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="settings-grid">
                    {/* Account Settings Card */}
                    <div className="card settings-card">
                        <h3>Account</h3>
                        <p>Manage your account and security settings.</p>
                        <Link to="/profile" className="settings-link-button">
                            <span>Go to My Profile</span>
                            <i className="fas fa-arrow-right"></i>
                        </Link>
                        <button className="settings-action-button">
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
                        <ToggleSwitch label="Email Notifications" isToggled={true} />
                        <ToggleSwitch label="SMS Notifications" isToggled={false} />
                        <ToggleSwitch label="Push Notifications" isToggled={true} />
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
            <Footer /> {/* <-- 2. ADD FOOTER */}
        </>
    );
};

export default SettingsPage;