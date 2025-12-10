import React, { useState } from 'react';
import './ReportsPage.css';

// ===========================================
// Report Data Catalog (Static Config)
// ===========================================
const reportCatalog = {
    attendance: {
        icon: 'fa-users',
        title: 'Attendance Reports',
        description: 'Organizational reports on attendance rates and lateness.',
        color: 'blue',
        types: [
            { name: 'Attendance Summary Report', desc: 'Summary for Students, Faculty, Sections, and Departments.', filterTarget: ['organization'] },
            { name: 'Late Arrival/Early Exit Log', desc: 'Detects habitual lateness or premature logouts across all users.', filterTarget: ['user', 'section'] },
            { name: 'Missed Attendance Check', desc: 'Cross-checks data inconsistencies (Present in Break, Not in Class).', filterTarget: ['system'] },
        ]
    },
    security: {
        icon: 'fa-shield-alt',
        title: 'Security Auditing & Access',
        description: 'Comprehensive logs on access attempts and security anomalies.',
        color: 'red',
        types: [
            { name: 'Recognized User Access Log', desc: 'Tracks all facial scan attempts for verified users.', filterTarget: ['user'] },
            { name: 'Unrecognized User/Access Log', desc: 'Tracks entry attempts from non-registered individuals.', filterTarget: ['system'] },
            { name: 'Spoof Attempt Detection', desc: 'Captures mismatched recognition attempts for security alerts.', filterTarget: ['system'] },
            { name: 'System Activity Audit', desc: 'Logs all administrative actions (add/edit users, export data).', filterTarget: ['user'] },
            { name: 'Security Breach Patterns', desc: 'Detects suspicious access frequency by location or time pattern.', filterTarget: ['system'] },
        ]
    },
    usage: {
        icon: 'fa-chart-pie',
        title: 'Utilization & Analytics',
        description: 'Insights into room utilization, break trends, and system performance.',
        color: 'purple',
        types: [
            { name: 'Room Occupancy Reports', desc: 'Displays per-room and per-building utilization rates.', filterTarget: ['room'] },
            { name: 'Room Utilization vs. Schedule', desc: 'Detects empty scheduled rooms or underutilized spaces.', filterTarget: ['room', 'section'] },
            { name: 'Overcrowding Reports', desc: 'Safety and resource optimization alerts.', filterTarget: ['room'] },
            { name: 'Break Abuse/Extended Break Log', desc: 'Monitors behavioral anomalies for policy enforcement.', filterTarget: ['user'] },
            { name: 'System Error and Recognition Trend', desc: 'Summarizes error rates per room or lighting condition.', filterTarget: ['system'] },
            { name: 'Gesture Usage Frequency Analysis', desc: 'Determines which gestures are most/least used.', filterTarget: ['system'] },
        ]
    },
};

// ===========================================
// Reusable Sub-Components
// ===========================================

const ReportTag = ({ text, colorClass }) => (
    <span className={`report-tag ${colorClass}`}>{text}</span>
);

const StatusTag = ({ text, colorClass }) => (
    <span className={`status-tag ${colorClass}`}>{text}</span>
);

const ReportTypeCard = ({ category, onOpen }) => (
    <div className="card report-type-card" onClick={() => onOpen(category)}>
        <div className={`report-type-icon ${category.color}-bg`}>
            <i className={`fas ${category.icon}`}></i>
        </div>
        <h3 className="report-type-title">{category.title}</h3>
        <p className="report-type-description">{category.description}</p>
        <button className="view-reports-button">
            <i className="fas fa-eye"></i> View Reports
        </button>
    </div>
);

// ===========================================
// 1. Report GENERATOR Modal
// ===========================================
const ReportGeneratorModal = ({ category, onClose }) => {
    const [selectedType, setSelectedType] = useState(category.types[0]);
    const [targetType, setTargetType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const isUserFilter = ['individual-student', 'individual-faculty'].includes(targetType);
    const isSectionFilter = targetType === 'section';

    const renderUserSearch = () => {
        if (!isUserFilter && !isSectionFilter) return null;
        const placeholder = isSectionFilter
            ? "Search section code (e.g., CS101, MATH201)"
            : `Search ${targetType.split('-')[1]} name or ID...`;

        return (
            <div className="filter-group-row">
                <div className="filter-search-input">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="report-modal-overlay">
            <div className="report-modal-content">
                <div className="modal-header">
                    <h2>{category.title} Generator</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body-grid">
                    <div className="report-type-list-wrapper">
                        <h3>Report Types</h3>
                        <div className="report-type-list">
                            {category.types.map(type => (
                                <div
                                    key={type.name}
                                    className={`report-type-item ${selectedType.name === type.name ? 'selected' : ''}`}
                                    onClick={() => setSelectedType(type)}
                                >
                                    <h4>{type.name}</h4>
                                    <p>{type.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="report-filter-panel">
                        <h3>Generate: {selectedType.name}</h3>
                        {selectedType.filterTarget && selectedType.filterTarget.some(target => ['organization', 'user', 'section'].includes(target)) && (
                            <div className="filter-group">
                                <label>Target Scope</label>
                                <select className="filter-select" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                                    <option value="all">All Users/Organization</option>
                                    <option value="faculty">All Faculty</option>
                                    <option value="students">All Students</option>
                                    <option value="individual-faculty">Individual Faculty Member</option>
                                    <option value="individual-student">Individual Student</option>
                                    <option value="section">Specific Section/Course</option>
                                </select>
                            </div>
                        )}
                        {renderUserSearch()}
                        <div className="filter-group">
                            <label>Date Range</label>
                            <div className="filter-group-row">
                                <input type="date" className="filter-select" defaultValue="2025-11-01" />
                                <input type="date" className="filter-select" defaultValue="2025-11-30" />
                            </div>
                        </div>
                        <div className="filter-group">
                            <label>Export Format</label>
                            <select className="filter-select">
                                <option>PDF (.pdf)</option>
                                <option>Excel (.xlsx)</option>
                                <option>CSV (.csv)</option>
                            </select>
                        </div>
                        <button className="generate-report-btn-modal">
                            <i className="fas fa-magic"></i> Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===========================================
// 2. Report VIEWER Modal
// ===========================================
const ReportViewModal = ({ report, onClose }) => {
    if (!report) return null;

    return (
        <div className="report-modal-overlay" style={{ zIndex: 2000 }}>
            <div className="report-modal-content" style={{ maxWidth: '500px', height: 'auto' }}>
                <div className="modal-header">
                    <h2>Report Details</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#666' }}>Report Name</label>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{report.name}</div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#666' }}>Type</label>
                        <ReportTag text={report.type} colorClass={report.typeColor} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#666' }}>Date Range</label>
                        <div>{report.date}</div>
                    </div>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#666' }}>Status</label>
                        <StatusTag text={report.status} colorClass={report.statusColor} />
                    </div>
                    
                    <button 
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#f3f4f6',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// ===========================================
// Main Reports Page Component
// ===========================================

const ReportsPage = () => {
    // Modal States
    const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
    const [selectedGeneratorCategory, setSelectedGeneratorCategory] = useState(null);
    const [viewReportData, setViewReportData] = useState(null);

    // Filter States (Defaulted to "All")
    const [frequencyFilter, setFrequencyFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    // --- Action Handlers ---

    const handleOpenGenerator = (categoryKey) => {
        setSelectedGeneratorCategory(reportCatalog[categoryKey]);
        setGeneratorModalOpen(true);
    };

    // 1️⃣ Download Logic
    const handleDownload = (e, report) => {
        e.stopPropagation();
        const blob = new Blob(
            [`FAKE REPORT CONTENT\n\nName: ${report.name}\nDate: ${report.date}\nGenerated: ${new Date().toISOString()}`], 
            { type: 'application/pdf' }
        );
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'report.pdf'); 
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    // 2️⃣ View Logic
    const handleView = (e, report) => {
        e.stopPropagation();
        setViewReportData(report);
    };

    // 3️⃣ Direct Share Logic (Email Only)
    const handleShareEmail = (e, report) => {
        e.stopPropagation();
        // Opens default email client with pre-filled subject/body
        window.location.href = `mailto:?subject=Sharing Report: ${report.name}&body=Check out this report generated on ${report.date}.`;
    };

    // Mock Data
    const recentReports = [
        {
            name: "Weekly Attendance Summary",
            type: "Attendance",
            typeColor: "blue",
            date: "Nov 15-21, 2024",
            generated: "2 hours ago",
            status: "Ready",
            statusColor: "green",
            frequency: "Weekly"
        },
        {
            name: "Security Incident Report",
            type: "Security",
            typeColor: "red",
            date: "Nov 1-21, 2024",
            generated: "1 day ago",
            status: "Ready",
            statusColor: "green",
            frequency: "Monthly"
        },
        {
            name: "Facility Usage Analytics",
            type: "Usage",
            typeColor: "purple",
            date: "Oct 2024",
            generated: "3 days ago",
            status: "Ready",
            statusColor: "green",
            frequency: "Monthly"
        },
    ];

    // Filter Logic
    const filteredReports = recentReports.filter(report => {
        const matchesFrequency = frequencyFilter === "All" || report.frequency === frequencyFilter;
        const matchesCategory = categoryFilter === "All" || report.type === categoryFilter;
        return matchesFrequency && matchesCategory;
    });

    return (
        <div className="reports-container">
            {/* Top Cards */}
            <div className="reports-card-grid">
                {Object.keys(reportCatalog).map(key => (
                    <ReportTypeCard
                        key={key}
                        category={reportCatalog[key]}
                        onOpen={() => handleOpenGenerator(key)}
                    />
                ))}
            </div>

            {/* Recent Reports Table */}
            <div className="card recent-reports-card">
                <div className="recent-reports-header">
                    <h2>Generated Reports</h2>
                    <div className="recent-reports-filters">
                        
                        {/* Frequency Filter */}
                        <select
                            value={frequencyFilter}
                            onChange={(e) => setFrequencyFilter(e.target.value)}
                        >
                            <option value="All">All Frequencies</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Semester">Semester</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            <option value="Attendance">Attendance</option>
                            <option value="Security">Security</option>
                            <option value="Usage">Usage</option>
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
                            {filteredReports.length > 0 ? (
                                filteredReports.map((report, index) => (
                                    <tr key={index}>
                                        <td>{report.name}</td>
                                        <td><ReportTag text={report.type} colorClass={report.typeColor} /></td>
                                        <td>{report.date}</td>
                                        <td>{report.generated}</td>
                                        <td><StatusTag text={report.status} colorClass={report.statusColor} /></td>
                                        <td>
                                            <div className="action-buttons-wrapper">
                                                
                                                {/* Download */}
                                                <button 
                                                    className="action-button download-button" 
                                                    title="Download PDF"
                                                    onClick={(e) => handleDownload(e, report)}
                                                >
                                                    <i className="fas fa-download"></i>
                                                </button>

                                                {/* View */}
                                                <button 
                                                    className="action-button view-button" 
                                                    title="View Details"
                                                    onClick={(e) => handleView(e, report)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>

                                                {/* Share (Direct Email) */}
                                                <button 
                                                    className="action-button share-button"
                                                    title="Share via Email"
                                                    onClick={(e) => handleShareEmail(e, report)}
                                                >
                                                    <i className="fas fa-share-alt"></i>
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                                        No reports found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generators & Viewers */}
            {generatorModalOpen && selectedGeneratorCategory && (
                <ReportGeneratorModal
                    category={selectedGeneratorCategory}
                    onClose={() => setGeneratorModalOpen(false)}
                />
            )}

            {viewReportData && (
                <ReportViewModal
                    report={viewReportData}
                    onClose={() => setViewReportData(null)}
                />
            )}
        </div>
    );
};

export default ReportsPage;