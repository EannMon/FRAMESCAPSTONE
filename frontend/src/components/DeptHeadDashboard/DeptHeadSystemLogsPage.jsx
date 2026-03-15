import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import './DeptHeadSystemLogsPage.css';

const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
        return new Date(ts).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch {
        return ts;
    }
};

const DeptHeadSystemLogsPage = () => {
    const [allLogs, setAllLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [levelFilter, setLevelFilter] = useState('');
    const [roomFilter, setRoomFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [rooms, setRooms] = useState([]);

    // Fetch rooms for filter
    useEffect(() => {
        const controller = new AbortController();
        api.get('/api/dept/management-data', { signal: controller.signal }).then(res => {
            setRooms(res.data?.rooms || []);
        }).catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                // silently ignore
            }
        });
        return () => controller.abort();
    }, []);

    const fetchLogs = async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            // Only send date filters to backend to keep cards constant
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const res = await api.get('/api/dept/system-logs', { params, signal });
            setAllLogs(res.data || []);
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                console.error('System logs fetch error:', err);
                setError('Failed to load system logs. Please try again.');
                setAllLogs([]);
            }
        } finally {
            if (!signal || !signal.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchLogs(controller.signal);
        return () => controller.abort();
    }, []);

    // Stats computed from ALL logs for the period
    const stats = useMemo(() => {
        const total = allLogs.length;
        const errors = allLogs.filter(l => l.level === 'ERROR').length;
        const warns = allLogs.filter(l => l.level === 'WARN').length;
        const infos = allLogs.filter(l => l.level === 'INFO').length;
        return { total, errors, warns, infos };
    }, [allLogs]);

    // Client-side filtering for the list
    const filteredLogs = useMemo(() => {
        return allLogs.filter(log => {
            const matchLevel = !levelFilter || log.level === levelFilter;
            const matchRoom = !roomFilter || log.room === roomFilter;
            
            let matchSearch = true;
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                matchSearch = (
                    log.message?.toLowerCase().includes(s) || 
                    log.service?.toLowerCase().includes(s) || 
                    log.user_name?.toLowerCase().includes(s) ||
                    log.action_type?.toLowerCase().includes(s)
                );
            }
            
            return matchLevel && matchRoom && matchSearch;
        });
    }, [allLogs, levelFilter, roomFilter, searchTerm]);

    const getLevelIcon = (level) => {
        switch (level) {
            case 'ERROR': return { icon: 'fa-times-circle', color: '#ef4444' };
            case 'WARN': return { icon: 'fa-exclamation-triangle', color: '#f59e0b' };
            case 'INFO': return { icon: 'fa-info-circle', color: '#3b82f6' };
            default: return { icon: 'fa-circle', color: '#94a3b8' };
        }
    };

    return (
        <div className="system-logs-page">
            <div className="logs-header" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="logs-refresh-btn" onClick={() => fetchLogs()}>
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            {/* Stats Bar */}
            <div className="logs-stats-bar">
                <div className="logs-stat">
                    <span className="stat-count">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="logs-stat info">
                    <span className="stat-count">{stats.infos}</span>
                    <span className="stat-label">Info</span>
                </div>
                <div className="logs-stat warn">
                    <span className="stat-count">{stats.warns}</span>
                    <span className="stat-label">Warnings</span>
                </div>
                <div className="logs-stat error">
                    <span className="stat-count">{stats.errors}</span>
                    <span className="stat-label">Errors</span>
                </div>
            </div>

            {/* Filters */}
            <div className="logs-filters">
                <div className="logs-search-wrap">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="logs-filter-select">
                    <option value="">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                </select>
                <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="logs-filter-select">
                    <option value="">All Rooms</option>
                    {rooms.map((r, i) => <option key={i} value={r.room_name}>{r.room_name}</option>)}
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="logs-filter-input" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="logs-filter-input" />
                <button className="logs-apply-btn" onClick={() => fetchLogs()}>
                    <i className="fas fa-filter"></i> Apply
                </button>
            </div>

            {/* Logs List */}
            <div className="logs-list-container">
                {loading ? (
                    <div className="logs-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading system logs...</p>
                    </div>
                ) : error ? (
                    <div className="logs-empty" style={{ color: '#ef4444' }}>
                        <i className="fas fa-exclamation-circle"></i>
                        <h4>Failed to Load Logs</h4>
                        <p>{error}</p>
                        <button className="logs-refresh-btn" onClick={() => fetchLogs()} style={{ marginTop: '12px' }}>
                            <i className="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="logs-empty">
                        <i className="fas fa-check-circle"></i>
                        <h4>No Logs Found</h4>
                        <p>No system logs match the current filters. Adjust your filters or check back later.</p>
                    </div>
                ) : (
                    <div className="logs-list">
                        {filteredLogs.map((log, i) => {
                            const { icon, color } = getLevelIcon(log.level);
                            return (
                                <div key={log.id ?? i} className={`log-entry level-${log.level?.toLowerCase()}`}>
                                    <div className="log-icon" style={{ color }}>
                                        <i className={`fas ${icon}`}></i>
                                    </div>
                                    <div className="log-content">
                                        <div className="log-message">{log.message}</div>
                                        <div className="log-meta">
                                            <span className="log-service">{log.service}</span>
                                            {log.room && <span className="log-room">{log.room}</span>}
                                            {log.source && <span className="log-source">{log.source}</span>}
                                            {log.user_name && <span className="log-user">{log.user_name}</span>}
                                        </div>
                                    </div>
                                    <div className="log-time">
                                        <span className={`log-level-badge ${log.level?.toLowerCase()}`}>{log.level}</span>
                                        <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {filteredLogs.length > 0 && (
                <div className="logs-footer">
                    Showing {filteredLogs.length} of {allLogs.length} log entries
                </div>
            )}
        </div>
    );
};

export default DeptHeadSystemLogsPage;
