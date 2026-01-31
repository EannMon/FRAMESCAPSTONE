import React, { useState } from 'react';
import './SystemLogsPage.css'; // New CSS file for this page

// ===========================================
// Reusable Status Tag Component
// ===========================================
const LogStatusTag = ({ text, colorClass }) => (
    <span className={`log-status-tag ${colorClass}`}>{text}</span>
);

// ===========================================
// Main System Logs Page Component
// ===========================================
const SystemLogsPage = () => {
    // Mock data for the logs table
    const logsData = [
        {
            timestamp: "2025-11-13 10:30:01",
            level: "ERROR",
            levelColor: "red",
            service: "AuthService",
            message: "Failed login attempt for user 'admin' from IP 198.51.100.1"
        },
        {
            timestamp: "2025-11-13 10:29:45",
            level: "INFO",
            levelColor: "green",
            service: "RecognitionEngine",
            message: "Face recognized: student_id 2024001 at 'Library Entrance'"
        },
        {
            timestamp: "2025-11-13 10:28:10",
            level: "WARN",
            levelColor: "yellow",
            service: "CameraService",
            message: "Camera 'CAM-04B' connection reset. Re-establishing..."
        },
        {
            timestamp: "2025-11-13 10:25:00",
            level: "INFO",
            levelColor: "green",
            service: "AuthService",
            message: "User 'prof.emma.wilson' logged in successfully."
        },
        {
            timestamp: "2025-11-13 10:22:15",
            level: "DEBUG",
            levelColor: "grey",
            service: "GestureControl",
            message: "Gesture 'WAVE' detected from user_id 892."
        },
        {
            timestamp: "2025-11-13 10:20:00",
            level: "INFO",
            levelColor: "green",
            service: "ApplicationService",
            message: "New application received from 'alex.cunsani@student.edu'."
        }
    ];

    const [logs, setLogs] = useState(logsData);
    const [searchValue, setSearchValue] = useState("");
    const [levelFilter, setLevelFilter] = useState("All Levels");
    const [serviceFilter, setServiceFilter] = useState("All Services");

    // Filtered logs based on search and dropdown filters
    const filteredLogs = logs.filter((log) => {
        const levelMatch = levelFilter === "All Levels" || log.level === levelFilter;
        const serviceMatch = serviceFilter === "All Services" || log.service === serviceFilter;
        const searchMatch =
            log.timestamp.toLowerCase().includes(searchValue.toLowerCase()) ||
            log.service.toLowerCase().includes(searchValue.toLowerCase()) ||
            log.message.toLowerCase().includes(searchValue.toLowerCase());
        return levelMatch && serviceMatch && searchMatch;
    });

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
                        <option>AuthService</option>
                        <option>RecognitionEngine</option>
                        <option>CameraService</option>
                        <option>GestureControl</option>
                        <option>ApplicationService</option>
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
                                filteredLogs.map((log, index) => (
                                    <tr key={index}>
                                        <td className="log-timestamp">{log.timestamp}</td>
                                        <td>
                                            <LogStatusTag
                                                text={log.level}
                                                colorClass={log.levelColor}
                                            />
                                        </td>
                                        <td className="log-service">{log.service}</td>
                                        <td className="log-message">{log.message}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                                        No logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SystemLogsPage;
