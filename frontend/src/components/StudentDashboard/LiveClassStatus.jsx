import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * LiveClassStatus — Polls the student's real-time class/room status
 * every 30 seconds via AbortController-based fetch.
 */
const LiveClassStatus = ({ userId }) => {
    const [liveStatus, setLiveStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const controller = new AbortController();
        let pollTimer = null;

        const fetchLiveStatus = async () => {
            try {
                const response = await api.get(
                    `/api/student/live-status/${userId}`,
                    { signal: controller.signal }
                );
                setLiveStatus(response.data);
                setStatusError(null);
            } catch (err) {
                if (err.code !== 'ERR_CANCELED') {
                    setStatusError(err.userMessage || 'Unable to fetch live status');
                    console.error('Live status fetch error:', err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setStatusLoading(false);
                }
            }
        };

        // Initial fetch
        fetchLiveStatus();

        // Poll every 30 seconds for real-time updates
        pollTimer = setInterval(() => {
            if (!controller.signal.aborted) {
                fetchLiveStatus();
            }
        }, 30000);

        return () => {
            controller.abort();
            if (pollTimer) clearInterval(pollTimer);
        };
    }, [userId]);

    // Color mapping from API status_color to actual CSS colors
    const colorMap = {
        green: '#2E7D32',
        amber: '#F9A825',
        grey: '#999',
    };

    // Derive display values from live status or defaults
    const status = liveStatus?.status || 'IDLE';
    const statusColor = colorMap[liveStatus?.status_color] || '#999';
    const statusText = liveStatus?.status_text || 'Not currently in any class';
    const roomName = liveStatus?.room || '---';
    const subjectInfo = liveStatus?.subject_code
        ? `${liveStatus.subject_code} — ${liveStatus.subject_title || ''}`
        : null;

    // Show/hide blinking dot based on status
    const showDot = status === 'PRESENT' || status === 'BREAK';

    if (statusLoading) {
        return (
            <div className="card live-status-card">
                <div className="live-header">
                    <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                </div>
                <div className="live-body" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    <i className="fas fa-spinner fa-spin"></i> Loading...
                </div>
            </div>
        );
    }

    if (statusError) {
        return (
            <div className="card live-status-card">
                <div className="live-header">
                    <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                </div>
                <div className="live-body" style={{ padding: '20px', textAlign: 'center', color: '#C62828' }}>
                    <i className="fas fa-exclamation-circle"></i> {statusError}
                </div>
            </div>
        );
    }

    return (
        <div className="card live-status-card">
            <div className="live-header">
                <h3><i className="fas fa-satellite-dish"></i> Live Status</h3>
                <div className="live-indicator">
                    {showDot && (
                        <span className="blink-dot" style={{ backgroundColor: statusColor }}></span>
                    )}
                    <span style={{ color: statusColor, fontWeight: 'bold' }}>{status}</span>
                </div>
            </div>
            <div className="live-body">
                <div className="room-display">
                    <i className="fas fa-chalkboard-teacher room-icon" style={{ color: showDot ? statusColor : '#ccc' }}></i>
                    <div className="room-info">
                        <h4>{roomName}</h4>
                        <p>{statusText}</p>
                        {subjectInfo && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{subjectInfo}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveClassStatus;
