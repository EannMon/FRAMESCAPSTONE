import React from 'react';
import './ReportsPage.css'; // New CSS file for this page

// ===========================================
// Reusable Components
// ===========================================

/**
 * A reusable card for the top grid (Attendance, Security, etc.)
 */
const ReportTypeCard = ({ icon, title, description, iconBgColor }) => (
    <div className="card report-type-card">
        <div className="report-type-icon" style={{ backgroundColor: iconBgColor }}>
            <i className={`fas ${icon}`}></i>
        </div>
        <h3 className="report-type-title">{title}</h3>
        <p className="report-type-description">{description}</p>
        <button className="view-reports-button">
            <i className="fas fa-eye"></i> View Reports
        </button>
    </div>
);

/**
 * Reusable tags for the table (e.g., "Attendance", "Security")
 */
const ReportTag = ({ text, colorClass }) => (
    <span className={`report-tag ${colorClass}`}>{text}</span>
);

/**
 * Reusable status tags for the table (e.g., "Ready", "Archived")
 */
const StatusTag = ({ text, colorClass }) => (
    <span className={`status-tag ${colorClass}`}>{text}</span>
);


// ===========================================
// Main Reports Page Component
// ===========================================

const ReportsPage = () => {

    // Mock data for the recent reports table
    const recentReports = [
        {
            name: "Weekly Attendance Summary",
            type: "Attendance",
            typeColor: "blue",
            date: "Nov 15-21, 2024",
            generated: "2 hours ago",
            status: "Ready",
            statusColor: "green"
        },
        {
            name: "Security Incident Report",
            type: "Security",
            typeColor: "red",
            date: "Nov 1-21, 2024",
            generated: "1 day ago",
            status: "Ready",
            statusColor: "green"
        },
        {
            name: "Facility Usage Analytics",
            type: "Analytics",
            typeColor: "purple",
            date: "Oct 2024",
            generated: "3 days ago",
            status: "Ready",
            statusColor: "green"
        },
        {
            name: "Monthly Access Log",
            type: "Security",
            typeColor: "red",
            date: "Oct 2024",
            generated: "1 week ago",
            status: "Ready",
            statusColor: "green"
        },
        {
            name: "Student Attendance Trends",
            type: "Attendance",
            typeColor: "blue",
            date: "Sep-Oct 2024",
            generated: "2 weeks ago",
            status: "Archived",
            statusColor: "grey"
        },
    ];

    return (
        <div className="reports-container">

            {/* Top Report Type Cards */}
            <div className="reports-card-grid">
                <ReportTypeCard
                    icon="fa-calendar-check"
                    title="Attendance Reports"
                    description="General attendance analytics"
                    iconBgColor="#e6f7ff" // Light Blue
                />
                <ReportTypeCard
                    icon="fa-shield-alt"
                    title="Security Reports"
                    description="Access logs and security incidents"
                    iconBgColor="#e6f7ec" // Light Green
                />
                <ReportTypeCard
                    icon="fa-chart-pie"
                    title="Usage Analytics"
                    description="Facility utilization and trends"
                    iconBgColor="#f4e8ff" // Light Purple
                />
            </div>

            {/* Recent Reports Table */}
            <div className="card recent-reports-card">
                <div className="recent-reports-header">
                    <h2>Recent Reports</h2>
                    <div className="recent-reports-filters">
                        <select>
                            <option>Weekly</option>
                            <option>Monthly</option>
                            <option>Yearly</option>
                        </select>
                        <select>
                            <option>General</option>
                            <option>Attendance</option>
                            <option>Security</option>
                        </select>
                        <button className="export-all-button">
                            <i className="fas fa-upload"></i> Export All
                        </button>
                    </div>
                </div>

                <div className="reports-table-container">
                    <table className="recent-reports-table">
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Type</th>
                                <th>Date Range</th>
                                <th>Generated</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReports.map((report, index) => (
                                <tr key={index}>
                                    <td>{report.name}</td>
                                    <td><ReportTag text={report.type} colorClass={report.typeColor} /></td>
                                    <td>{report.date}</td>
                                    <td>{report.generated}</td>
                                    <td><StatusTag text={report.status} colorClass={report.statusColor} /></td>
                                    <td>
                                        <button className="action-button download-button">
                                            <i className="fas fa-download"></i>
                                        </button>
                                        <button className="action-button delete-button">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                        <button className="action-button share-button">
                                            <i className="fas fa-share-square"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;