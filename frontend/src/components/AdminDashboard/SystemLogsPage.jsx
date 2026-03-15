import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './SystemLogsPage.css';

/**
 * Status tag for log levels (INFO, WARN, ERROR, DEBUG).
 */
const LogStatusTag = ({ text }) => {
    const colorMap = { ERROR: 'red', WARN: 'yellow', INFO: 'green', DEBUG: 'grey' };
    return <span className={`log-status-tag ${colorMap[text] || 'grey'}`}>{text}</span>;
};

/**
 * SystemLogsPage — Displays audit trail from the backend.
 * Data source: GET /api/admin/system-logs (audit_logs table).
 */
const SystemLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 50;

    // Filters
    const [searchValue, setSearchValue] = useState('');
    const [levelFilter, setLevelFilter] = useState('All Levels');
    const [serviceFilter, setServiceFilter] = useState('All Services');

    useEffect(() => {
        const controller = new AbortController();

        const fetchLogs = async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/admin/system-logs', {
                    params: { skip: page * pageSize, limit: pageSize },
                    signal: controller.signal,
                });
                setLogs(res.data.items || []);
                setTotal(res.data.total || 0);
                setError(null);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    setError('Failed to load system logs');
                    console.error('System logs fetch error:', err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchLogs();
        return () => controller.abort();
    }, [page]);

    // Client-side filtering on fetched page
    const filteredLogs = logs.filter((log) => {
        const levelMatch = levelFilter === 'All Levels' || log.level === levelFilter;
        const serviceMatch = serviceFilter === 'All Services' || log.service === serviceFilter;
        const searchMatch =
            !searchValue ||
            (log.timestamp || '').toLowerCase().includes(searchValue.toLowerCase()) ||
            (log.service || '').toLowerCase().includes(searchValue.toLowerCase()) ||
            (log.message || '').toLowerCase().includes(searchValue.toLowerCase());
        return levelMatch && serviceMatch && searchMatch;
    });

    // Extract unique services from current page for filter dropdown
    const serviceOptions = [...new Set(logs.map(l => l.service).filter(Boolean))];

    if (loading) {
        return (
            <div className="system-logs-container">
                <div className="admin-empty-state" style={{ padding: '60px 20px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading system logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="system-logs-container">
                <div className="admin-error-state admin-empty-state">
                    <i className="fas fa-exclamation-triangle error-text" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                    <p className="error-text">{error}</p>
                    <button onClick={() => setPage(0)} className="submit-btn" style={{ marginTop: 12 }}>Retry</button>
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="system-logs-container">
            {/* Header and filters */}
            <div className="logs-header">
                <div className="logs-filters">
                    <select
                        className="logs-filter-select"
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                    >
                        <option>All Levels</option>
                        <option>ERROR</option>
                        <option>WARN</option>
                        <option>INFO</option>
                        <option>DEBUG</option>
                    </select>
                    <select
                        className="logs-filter-select"
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                    >
                        <option>All Services</option>
                        {serviceOptions.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <div className="logs-search-bar">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Logs table */}
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
                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                                        </td>
                                        <td>
                                            <LogStatusTag text={log.level} />
                                        </td>
                                        <td className="log-service">{log.service}</td>
                                        <td className="log-message">{log.message}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="admin-empty-state empty-state-text">
                                        {logs.length === 0
                                            ? 'No audit logs recorded yet. Logs are created when system actions occur (user verification, schedule uploads, device changes, etc.).'
                                            : 'No logs match your filters.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '16px 0' }}>
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="submit-btn" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                            <i className="fas fa-chevron-left"></i> Previous
                        </button>
                        <span className="pagination-text">Page {page + 1} of {totalPages} ({total} total)</span>
                        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="submit-btn" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                            Next <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemLogsPage;
