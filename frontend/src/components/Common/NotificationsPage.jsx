import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './NotificationsPage.css';
import './Utility.css';
import Header from './Header';
import Footer from './Footer';

// --- Theme Definition ---
const navyTheme = {
    primary: '#0F172A', // Navy
    dark: '#1E293B',    // Darker Navy
    lightBg: 'rgba(255, 255, 255, 0.1)', // Light Hover
    text: '#FFFFFF'     // White Text
};

// ===========================================
// Main Notifications Page Component
// ===========================================
const NotificationsPage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();

    // --- GET REAL USER FROM AUTH CONTEXT ---
    const { user } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    // Fetch real notifications from backend
    useEffect(() => {
        const controller = new AbortController();

        const fetchNotifications = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const response = await api.get(`/api/users/notifications/${user.id}`, { signal: controller.signal });
                setNotifications(response.data || []);
                setError(null);
            } catch (err) {
                if (err.code !== 'ERR_CANCELED') {
                    setError(err.userMessage || 'Failed to load notifications.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
        return () => controller.abort();
    }, [user]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Apply filter
    const displayed = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    return (
        <>
            {/* Pass real user to Header */}
            {!isEmbedded && <Header theme={navyTheme} user={user} setPanel={() => navigate('/')} />}

            <div className={`notifications-page-container ${isEmbedded ? 'embedded' : ''}`}>
                {/* Top Header Bar */}
                <div className="notifications-header-bar">
                    {/* Only show Left Header (Back + Title) if NOT embedded */}
                    {!isEmbedded && (
                        <div className="notifications-header-left">
                            <button className="notifications-back-button" onClick={handleGoBack}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h1 className="notifications-main-title">Notifications</h1>
                        </div>
                    )}

                    {/* Filter Buttons - Always Show */}
                    <div className="notifications-header-right" style={isEmbedded ? { width: '100%', justifyContent: 'flex-start' } : {}}>
                        <button
                            className={`notification-filter-button ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >All</button>
                        <button
                            className={`notification-filter-button ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >Unread</button>
                        <button className="notification-action-button" style={{ marginLeft: 'auto' }} onClick={handleMarkAllRead}>Mark all as read</button>
                    </div>
                </div>

                {/* Notifications List Card */}
                <div className="card notifications-list-card">
                    {loading && <div className="notification-item" style={{ justifyContent: 'center', color: '#94a3b8' }}>Loading notifications...</div>}
                    {error && <div className="notification-item" style={{ justifyContent: 'center', color: '#ef4444' }}>{error}</div>}
                    {!loading && !error && displayed.length === 0 && (
                        <div className="notification-item" style={{ justifyContent: 'center', color: '#94a3b8' }}>No notifications to show.</div>
                    )}
                    {!loading && !error && displayed.map((item) => (
                        <div
                            key={item.id}
                            className={`notification-item ${item.read ? 'read' : 'unread'}`}
                            onClick={() => item.link && navigate(item.link)}
                            style={{ cursor: item.link ? 'pointer' : 'default' }}
                        >
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
            {!isEmbedded && <Footer />}
        </>
    );
};

export default NotificationsPage;