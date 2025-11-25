import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationsPage.css'; // New CSS file for this page
import '../ZCommon/Utility.css';
import LoggedInHeader from './LoggedInHeader';
import Footer from './Footer';

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

// --- Mock Notification Data ---
const mockNotifications = [
    { id: 1, icon: 'fas fa-file-alt', text: 'New application received from "Jay Rubert".', time: '15m ago', read: false },
    { id: 2, icon: 'fas fa-user-check', text: 'User "Maam May Garcia" was approved.', time: '1h ago', read: false },
    { id: 3, icon: 'fas fa-user-times', text: 'User "Prof. Emman Wilson" was cancelled.', time: '3h ago', read: false },
    { id: 4, icon: 'fas fa-exclamation-triangle', text: 'System Maintenance is scheduled for 8 PM.', time: '1d ago', read: true },
    { id: 5, icon: 'fas fa-chart-bar', text: 'Your "Monthly Attendance" report is ready.', time: '2d ago', read: true },
    { id: 6, icon: 'fas fa-bell', text: 'A new device was logged into your account.', time: '5d ago', read: true },
];

// ===========================================
// Main Notifications Page Component
// ===========================================
const NotificationsPage = () => {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate(-1); // Go back one step in history
    };

    return (
        <>
            <LoggedInHeader theme={redTheme} user={mockUser} />
            <div className="notifications-page-container">
                {/* Top Header Bar */}
                <div className="notifications-header-bar">
                    <div className="notifications-header-left">
                        <button className="notifications-back-button" onClick={handleGoBack}>
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h1 className="notifications-main-title">Notifications</h1>
                    </div>
                    <div className="notifications-header-right">
                        <button className="notification-filter-button active">All</button>
                        <button className="notification-filter-button">Unread</button>
                        <button className="notification-action-button">Mark all as read</button>
                    </div>
                </div>

                {/* Notifications List Card */}
                <div className="card notifications-list-card">
                    {mockNotifications.map((item) => (
                        <div key={item.id} className={`notification-item ${item.read ? 'read' : 'unread'}`}>
                            <div className={`notification-icon ${item.read ? 'read-icon' : ''}`}>
                                <i className={item.icon}></i>
                            </div>
                            <div className="notification-content">
                                <p className="notification-text">{item.text}</p>
                                <span className="notification-time">{item.time}</span>
                            </div>
                            {!item.read && <div className="notification-unread-dot"></div>}
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default NotificationsPage;