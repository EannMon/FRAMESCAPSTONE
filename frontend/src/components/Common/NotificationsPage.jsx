import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    // Local read state — persists in localStorage per user
    const readKey = `notif_read_${user?.id || 0}`;
    const [readIds, setReadIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(readKey) || '[]');
        } catch {
            return [];
        }
    });

    const fetchNotifications = useCallback(async (signal) => {
        if (!user?.id && !user?.user_id) return;
        setIsLoading(true);
        setError(null);
        try {
            const userId = user.user_id || user.id;
            const response = await api.get(`/api/users/notifications/${userId}`, { signal });
            setNotifications(response.data || []);
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                console.error('Failed to fetch notifications:', err);
                setError('Failed to load notifications.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const controller = new AbortController();
        fetchNotifications(controller.signal);
        return () => controller.abort();
    }, [fetchNotifications]);

    // Persist read IDs to localStorage
    useEffect(() => {
        localStorage.setItem(readKey, JSON.stringify(readIds));
    }, [readIds, readKey]);

    /** Merge backend read status with local read state */
    const isRead = (notif) => notif.read || readIds.includes(notif.id);

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setReadIds(prev => [...new Set([...prev, ...allIds])]);
    };

    const markAsRead = (notifId) => {
        if (!readIds.includes(notifId)) {
            setReadIds(prev => [...prev, notifId]);
        }
    };

    const handleNotifClick = (notif) => {
        markAsRead(notif.id);
        if (notif.link) {
            navigate(notif.link);
        }
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
                                Notifications {unreadCount > 0 && <span style={{ fontSize: '0.7em', color: '#ef4444' }}>({unreadCount} unread)</span>}
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
                        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Loading notifications...
                        </div>
                    ) : error ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#ef4444' }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }}></i> {error}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                            <i className="fas fa-bell-slash" style={{ marginRight: 8 }}></i>
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
                                <div className={`notification-icon ${isRead(item) ? 'read-icon' : ''}`}>
                                    <i className={item.icon || 'fas fa-bell'}></i>
                                </div>
                                <div className="notification-content">
                                    <p className="notification-text">{item.text}</p>
                                    <span className="notification-time">{item.time}</span>
                                </div>
                                {!isRead(item) && <div className="notification-unread-dot"></div>}
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