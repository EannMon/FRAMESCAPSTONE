import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationsPage.css';
import './Utility.css';
import Header from './Header';
import Footer from './Footer';

// --- Theme Definition ---
const navyTheme = {
    primary: '#0F172A',
    dark: '#1E293B',
    lightBg: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF'
};

/**
 * NotificationsPage — displays real notifications from the backend.
 * Fetches from /api/users/notifications/{user_id} and supports
 * All / Unread filtering. Persists read state locally so they don't
 * vanish on refresh (Task 67).
 */
const NotificationsPage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();

    const [user] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });

    const { notifications, isLoading, error, isRead, markAsRead, markAllAsRead } = useNotifications();
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    const handleNotifClick = (notif) => {
        markAsRead(notif.id);
        // Navigation disabled per user request
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !isRead(n))
        : notifications;

    const unreadCount = notifications.filter(n => !isRead(n)).length;

    const handleGoBack = () => navigate(-1);

    return (
        <>
            {!isEmbedded && <Header theme={navyTheme} user={user} setPanel={() => navigate('/')} />}

            <div className={`notifications-page-container ${isEmbedded ? 'embedded' : ''}`}>
                {/* Top Header Bar */}
                <div className="notifications-header-bar">
                    {!isEmbedded && (
                        <div className="notifications-header-left">
                            <button className="notifications-back-button" onClick={handleGoBack}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h1 className="notifications-main-title">
                                Notifications {unreadCount > 0 && <span className="unread-count-badge">({unreadCount} unread)</span>}
                            </h1>
                        </div>
                    )}

                    <div className="notifications-header-right" style={isEmbedded ? { width: '100%', justifyContent: 'flex-start' } : {}}>
                        <button
                            className={`notification-filter-button ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >All</button>
                        <button
                            className={`notification-filter-button ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >Unread</button>
                        <button
                            className="notification-action-button"
                            style={{ marginLeft: 'auto' }}
                            onClick={markAllAsRead}
                        >Mark all as read</button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="card notifications-list-card">
                    {isLoading ? (
                        <div className="notification-status-message">
                            <i className="fas fa-spinner fa-spin"></i> Loading notifications...
                        </div>
                    ) : error ? (
                        <div className="notification-status-message error-text">
                            <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="notification-status-message">
                            <i className="fas fa-bell-slash"></i>
                            {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
                        </div>
                    ) : (
                        filteredNotifications.map((item) => (
                            <div
                                key={item.id}
                                className={`notification-item ${isRead(item) ? 'read' : 'unread'}`}
                                onClick={() => handleNotifClick(item)}
                                style={{ cursor: item.link ? 'pointer' : 'default' }}
                            >
                                <div className="notification-content">
                                    {item.title && <h4 className="notification-title">{item.title}</h4>}
                                    <p className="notification-text">{item.text}</p>
                                    <span className="notification-time">{item.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {!isEmbedded && <Footer />}
        </>
    );
};

export default NotificationsPage;