import React from 'react';
import './SystemLogsPage.css'; // New CSS file for this page

// ===========================================
// Reusable Status Tag Component
// ===========================================

/**
 * Reusable status tags for the table (e.g., "ERROR", "INFO")
 */
const LogStatusTag = ({ text, colorClass }) => (
    <span className={`log-status-tag ${colorClass}`}>{text}</span>
);


// ===========================================
// Main System Logs Page Component
// ===========================================

const SystemLogsPage = () => {

    // Mock data for the logs table
    const logs = [
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

    return (
        // New container to match other pages
        <div className="system-logs-container">
            {/* Header and filters are now OUTSIDE the card */}
            <div className="logs-header">
                <div className="logs-filters">
                    <select className="logs-filter-select">
                        <option>All Levels</option>
                        <option>ERROR</option>
                        <option>WARN</option>
                        <option>INFO</option>
                        <option>DEBUG</option>
                    </select>
                    <select className="logs-filter-select">
                        <option>All Services</option>
                        <option>AuthService</option>
                        <option>RecognitionEngine</option>
                        <option>CameraService</option>
                    </select>
                    <div className="logs-search-bar">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Search logs..." />
                    </div>
                </div>
            </div>
            
            {/* The card now only contains the table */}
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
                            {logs.map((log, index) => (
                                <tr key={index}>
                                    <td className="log-timestamp">{log.timestamp}</td>
                                    <td><LogStatusTag text={log.level} colorClass={log.levelColor} /></td>
                                    <td className="log-service">{log.service}</td>
                                    <td className="log-message">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SystemLogsPage;