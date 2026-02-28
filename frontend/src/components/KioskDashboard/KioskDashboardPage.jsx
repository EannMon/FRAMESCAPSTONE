import React, { useState, useEffect } from 'react';
import './KioskDashboardPage.css';

const KioskDashboardPage = () => {
    const [kioskState, setKioskState] = useState({
        status: 'offline', // idle, active, offline
        active_class: null,
        room: null,
        recognized_user: null,
        tupm_id: null,
        greeting_type: null, // 'welcome' | 'bye'
        required_gestures: [],
        recent_checkins: [],
        message: 'Starting up...'
    });
    const [offline, setOffline] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const WS_URL = BACKEND_URL.replace(/^http/, 'ws') + '/ws/status';
    const VIDEO_STREAM_URL = `${BACKEND_URL}/video_feed`;

    // Clock effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // WebSocket connection
    useEffect(() => {
        let ws = null;
        let reconnectTimeout = null;
        // Guard flag — prevents reconnect attempts after the component unmounts
        let destroyed = false;

        const connectWebSocket = () => {
            if (destroyed) return;

            console.log('Connecting to WebSocket...', WS_URL);
            ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                if (destroyed) { ws.close(); return; }
                console.log('WebSocket connected');
                setOffline(false);
            };

            ws.onmessage = (event) => {
                if (destroyed) return;
                try {
                    const data = JSON.parse(event.data);
                    setKioskState(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message', error);
                }
            };

            ws.onclose = () => {
                if (destroyed) return;
                console.warn('WebSocket disconnected. Reconnecting in 3s...');
                setOffline(true);
                reconnectTimeout = setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = () => {
                // onerror is ALWAYS followed by onclose — do NOT call ws.close() here.
                // Calling close() on a still-connecting socket causes the
                // "WebSocket is closed before the connection is established" warning.
            };
        };

        connectWebSocket();

        return () => {
            destroyed = true;
            clearTimeout(reconnectTimeout);
            if (ws) {
                // Null out onclose so closing during cleanup doesn't schedule another reconnect
                ws.onclose = null;
                ws.close();
            }
        };
    }, [WS_URL]);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isGestureActive = (gestureName) => {
        return kioskState.required_gestures && kioskState.required_gestures.includes(gestureName);
    };

    return (
        <div className="kiosk-container">
            {/* LEFT: Video Stream */}
            <div className="kiosk-video-section">
                <div className="kiosk-video-header">
                    <h1>
                        {kioskState.recognized_user
                            ? (kioskState.greeting_type === 'bye'
                                ? `Bye, ${kioskState.recognized_user}!`
                                : `Welcome, ${kioskState.recognized_user}!`)
                            : 'FRAMES Attendance Kiosk'}
                    </h1>
                    {kioskState.recognized_user && kioskState.tupm_id && (
                        <div className="kiosk-video-id">{kioskState.tupm_id}</div>
                    )}
                    {kioskState.recognized_user && !kioskState.tupm_id && kioskState.device_id && (
                        <div className="kiosk-video-id">Device ID: {kioskState.device_id}</div>
                    )}
                </div>

                <div className="kiosk-video-wrapper">
                    {offline && (
                        <div className="kiosk-offline-banner">
                            ⚠️ OFFLINE - System is disconnected
                        </div>
                    )}
                    {kioskState.message && !offline && (
                        <div className="kiosk-offline-banner" style={{ background: 'rgba(0, 150, 255, 0.8)' }}>
                            {kioskState.message}
                        </div>
                    )}
                    <img
                        src={offline ? '' : VIDEO_STREAM_URL}
                        alt="Kiosk Camera Feed"
                        className="kiosk-video-feed"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        onLoad={(e) => { e.target.style.display = 'block'; }}
                    />
                </div>
            </div>

            {/* RIGHT: Status Panels */}
            <div className="kiosk-sidebar">
                {/* Time & Date Panel */}
                <div className="kiosk-panel kiosk-datetime">
                    <div className="kiosk-time-value">{formatTime(currentTime)}</div>
                    <div className="kiosk-date-value">{formatDate(currentTime)}</div>
                </div>

                {/* Subject / Room Panel */}
                <div className="kiosk-panel">
                    <h3>Subject Room</h3>
                    {kioskState.active_class ? (
                        <>
                            <h2 className="kiosk-subject-title">{kioskState.active_class}</h2>
                            <div className="kiosk-room-name">{kioskState.room || 'Room Unknown'}</div>
                        </>
                    ) : (
                        <h2 className="kiosk-subject-title" style={{ color: '#94a3b8' }}>No Active Class</h2>
                    )}
                </div>

                {/* Gestures Panel: ✌️ break out, 👍 break in, ✋ exit; no gesture for entry */}
                <div className="kiosk-panel">
                    <h3>Gesture</h3>
                    <p className="kiosk-gesture-entry-note">No gesture needed for entry.</p>
                    <div className="kiosk-gestures-grid">
                        <div className={`kiosk-gesture-card ${isGestureActive('BREAK_OUT') ? 'active' : ''} ${!kioskState.required_gestures?.length ? 'disabled' : ''}`} title="Peace sign">
                            <div className="kiosk-gesture-icon">✌️</div>
                            <div className="kiosk-gesture-label">BREAK OUT</div>
                        </div>
                        <div className={`kiosk-gesture-card ${isGestureActive('BREAK_IN') ? 'active' : ''} ${!kioskState.required_gestures?.length ? 'disabled' : ''}`} title="Thumbs up">
                            <div className="kiosk-gesture-icon">👍</div>
                            <div className="kiosk-gesture-label">BREAK IN</div>
                        </div>
                        <div className={`kiosk-gesture-card ${isGestureActive('EXIT') ? 'active' : ''} ${!kioskState.required_gestures?.length ? 'disabled' : ''}`} title="Open palm">
                            <div className="kiosk-gesture-icon">✋</div>
                            <div className="kiosk-gesture-label">EXIT</div>
                        </div>
                    </div>
                </div>

                {/* Recent Check-ins Panel */}
                <div className="kiosk-panel" style={{ flexGrow: 1 }}>
                    <h3>Recent Check-ins</h3>
                    <div className="kiosk-checkins-list">
                        {kioskState.recent_checkins && kioskState.recent_checkins.length > 0 ? (
                            kioskState.recent_checkins.map((checkin, idx) => (
                                <div key={idx} className="kiosk-checkin-item">
                                    <div className="kiosk-checkin-info">
                                        <span className="kiosk-checkin-name">{checkin.name}</span>
                                        <span className="kiosk-checkin-time">{checkin.timestamp}</span>
                                    </div>
                                    <span className="kiosk-checkin-badge" style={{
                                        backgroundColor: checkin.status === 'LATE' ? '#ef4444' : '#4CAF50'
                                    }}>
                                        {checkin.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default KioskDashboardPage;
