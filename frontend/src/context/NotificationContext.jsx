import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, user }) {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const readKey = `notif_read_${user?.id || user?.user_id || 0}`;
    const [readIds, setReadIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(readKey) || '[]');
        } catch {
            return [];
        }
    });

    // Listen to localStorage from OTHER tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === readKey) {
                try {
                    setReadIds(JSON.parse(e.newValue || '[]'));
                } catch {}
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [readKey]);

    const fetchNotifications = useCallback(async (signal) => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/api/users/notifications/${user.id}`, { signal });
            setNotifications(response.data || []);
            setError(null);
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                console.error("Error fetching notifications:", err);
                setError("Failed to load notifications.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user?.id) return;
        
        const controller = new AbortController();
        fetchNotifications(controller.signal);
        
        return () => {
            controller.abort();
        };
    }, [fetchNotifications, user]);

    const isRead = (notif) => notif.read || readIds.includes(notif.id);

    const markAsRead = async (notifId) => {
        if (!readIds.includes(notifId)) {
            const updated = [...readIds, notifId];
            setReadIds(updated);
            localStorage.setItem(readKey, JSON.stringify(updated));
            try {
                await api.post(`/api/users/notifications/${user.id}/read`, { notification_id: notifId });
            } catch (err) {
                console.error("Failed to mark notification as read in DB:", err);
            }
        }
    };

    const markAllAsRead = async () => {
        const allIds = notifications.map(n => n.id);
        const updated = [...new Set([...readIds, ...allIds])];
        setReadIds(updated);
        localStorage.setItem(readKey, JSON.stringify(updated));
        try {
            await api.post(`/api/users/notifications/${user.id}/read`, { all: true });
        } catch (err) {
            console.error("Failed to mark all notifications as read in DB:", err);
        }
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            readIds, 
            isLoading, 
            error, 
            fetchNotifications, 
            isRead, 
            markAsRead, 
            markAllAsRead 
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext;
