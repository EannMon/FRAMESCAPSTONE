import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './DeptHeadSystemLogsPage.css';

// Reusable Status Tag Component
const LogStatusTag = ({ text, colorClass }) => (
    <span className={`log-status-tag ${colorClass}`}>{text}</span>
);

// Level → CSS color-class mapping
const levelColorMap = {
    ERROR: 'red',
    WARN: 'yellow',
    INFO: 'green',
    DEBUG: 'grey',
};

const DeptHeadSystemLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [levelFilter, setLevelFilter] = useState('All Levels');
    const [serviceFilter, setServiceFilter] = useState('All Services');

    useEffect(() => {
        const controller = new AbortController();

        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await api.get('/api/admin/system-logs', {
                    signal: controller.signal,
                    params: { limit: 200 },
                });
                setLogs(res.data);
            } catch (err) {
                if (err.code !== 'ERR_CANCELED') {
                    setError(err.userMessage || 'Failed to load system logs.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        return () => controller.abort();
    }, []);

    // Derive unique service names from fetched data for the filter dropdown
    const serviceNames = [...new Set(logs.map((l) => l.service))];

    // Client-side filtering on the already-fetched data
    const filteredLogs = logs.filter((log) => {
        const levelMatch = levelFilter === 'All Levels' || log.level === levelFilter;
        const serviceMatch = serviceFilter === 'All Services' || log.service === serviceFilter;
        const searchMatch =
            (log.timestamp || '').toLowerCase().includes(searchValue.toLowerCase()) ||
            (log.service || '').toLowerCase().includes(searchValue.toLowerCase()) ||
            (log.message || '').toLowerCase().includes(searchValue.toLowerCase());
        return levelMatch && serviceMatch && searchMatch;
    });

    return (
        <div className="system-logs-container">
            {/* Header and filters */}
            <div className="logs-header">
                <div className="logs-filters">
                    <select className="logs-filter-select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                        <option>All Levels</option>
                        <option>ERROR</option>
                        <option>WARN</option>
                        <option>INFO</option>
                        <option>DEBUG</option>
                    </select>
                    <select className="logs-filter-select" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                        <option>All Services</option>
                        {serviceNames.map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </select>
                    <div className="logs-search-bar">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Search logs..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Loading / error states */}
            {loading && (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    Loading logs…
                </p>
            )}
            {error && (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
                    {error}
                </p>
            )}

            {/* Logs table */}
            {!loading && !error && (
                <div className="card logs-table-card">
                    <div className="logs-table-container">
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Level</th>
                                    <th>Service</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="log-timestamp">
                                                {log.timestamp
                                                    ? new Date(log.timestamp).toLocaleString()
                                                    : '—'}
                                            </td>
                                            <td>
                                                <LogStatusTag
                                                    text={log.level}
                                                    colorClass={levelColorMap[log.level] || 'grey'}
                                                />
                                            </td>
                                            <td className="log-service">{log.service}</td>
                                            <td className="log-message">{log.message}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            No logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeptHeadSystemLogsPage;
