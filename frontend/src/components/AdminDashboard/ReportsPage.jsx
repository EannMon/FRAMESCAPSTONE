import React, { useState } from 'react';
import jsPDF from 'jspdf'; // Import para sa PDF generation
import autoTable from 'jspdf-autotable'; // Import para sa table sa PDF
import './ReportsPage.css';

// ===========================================
// Report Data Catalog (Static Config)
// ===========================================
const reportCatalog = {
    attendance: {
        icon: 'fa-users',
        title: 'Attendance & Compliance Reports',
        description: 'Comprehensive reports on attendance, compliance, and time logs across all organizational units.',
        color: 'blue',
        types: [
            { name: 'Attendance Summary Reports', desc: 'Summary for Students, Sections, Faculty, and Departments (full organizational visibility).', filterTarget: ['organization'] },
            { name: 'Late Arrival and Early Exit Reports', desc: 'Detects habitual lateness or premature logouts across all users.', filterTarget: ['user', 'section'] },
            { name: 'Missed Attendance but Present in BreakLogs', desc: 'Cross-checks data inconsistencies (e.g., Present in Break, Not in Class).', filterTarget: ['system'] },
        ]
    },
    security: {
        icon: 'fa-shield-alt',
        title: 'Security Auditing & Access Control',
        description: 'Detailed logs on facial recognition events, unauthorized access, and administrative actions.',
        color: 'red',
        types: [
            { name: 'Recognized & Unrecognized User Logs', desc: 'Tracks all facial scan attempts for both verified and unknown users for security traceability.', filterTarget: ['user', 'system'] },
            { name: 'Unrecognized Face and Unauthorized Access Attempts', desc: 'Tracks entry attempts from non-registered individuals or failed recognition attempts.', filterTarget: ['system'] },
            { name: 'Spoof Attempt Detection Report', desc: 'Captures mismatched recognition attempts (face + invalid gesture) for security alerts.', filterTarget: ['system'] },
            { name: 'System Activity Audit Report', desc: 'Logs all administrative actions (add/edit users, modify schedules, export data) for accountability.', filterTarget: ['user'] },
            { name: 'Security Breach Pattern Report', desc: 'Detects suspicious access frequency by location or time pattern.', filterTarget: ['system'] },
        ]
    },
    usage: {
        icon: 'fa-chart-pie',
        title: 'System Health & Utilization Analytics',
        description: 'Insights into physical space utilization, system performance, and Hand Gesture Control usage.',
        color: 'purple',
        types: [
            { name: 'Room Occupancy Trends & Peak Usage Hours', desc: 'Predictive insights for scheduling and resource management.', filterTarget: ['room'] },
            { name: 'Room Utilization vs. Schedule Report', desc: 'Detects empty scheduled rooms or underutilized spaces.', filterTarget: ['room', 'section'] },
            { name: 'Overcrowding and Empty-but-Scheduled Reports', desc: 'Safety and resource optimization alerts.', filterTarget: ['room'] },
            { name: 'Break Abuse and Extended Break Reports', desc: 'Monitors behavioral anomalies for policy enforcement.', filterTarget: ['user'] },
            { name: 'System Error and Recognition Trend Report', desc: 'Summarizes error rates per room or lighting condition—helps model calibration.', filterTarget: ['system', 'room'] },
            { name: 'Unrecognized Gesture Attempts', desc: 'Detects possible misuse or recognition errors (for debugging gesture models).', filterTarget: ['system'] },
            { name: 'Gesture Usage Frequency Analysis', desc: 'Determines which gestures are most/least used—guides UI/UX optimization.', filterTarget: ['system'] },
            { name: 'System Health and Performance Insight (Smart)', desc: 'AI-generated metrics showing uptime, latency, and recognition accuracy trends.', filterTarget: ['system'] },
        ]
    },
};

// ===========================================
// DYNAMIC MOCK DATA
// ===========================================

// 1. Attendance Reports
const attendancePreviewData = [
    { name: "Terana, Angelica", id: "2021-001", rate: "98%", status: "Present" },
    { name: "Llana, Elena", id: "2021-002", rate: "95%", status: "Present" },
    { name: "Calingal, Karl", id: "2021-003", rate: "88%", status: "Late" }, 
];
const lateExitMockData = [
    { name: "Calingal, Karl", id: "2021-003", time: "09:15", schedule: "09:00", deviation: "+15m (Late)", status: "Non-Compliant" },
    { name: "Llana, Elena", id: "2021-002", time: "11:45", schedule: "12:00", deviation: "-15m (Exit Early)", status: "Non-Compliant" },
];
const missedAttendanceMockData = [
    { name: "Sablan, Mel", id: "2021-005", classTime: "08:00 (Missed)", breakTime: "08:15 (Present)", location: "Break Area 1", anomaly: "High Risk" },
    { name: "Lopez, Denice", id: "2021-006", classTime: "10:30 (Missed)", breakTime: "10:35 (Present)", location: "Canteen Camera", anomaly: "Low Risk" },
];

// 2. Security Reports
const recognizedUnrecognizedMockData = [
    { time: "2025-11-20 07:01:05", event: "Recognized User (Check-in)", user: "T. Tupas (Faculty)", confidence: "98%", status: "ACCESS GRANTED" },
    { time: "2025-11-20 07:01:45", event: "Unrecognized Face", user: "N/A", confidence: "15%", status: "ACCESS DENIED" },
];
const unauthorizedAccessMockData = [
    { time: "2025-11-20 07:01:45", camera: "LAB-201-CAM01", confidence: "15%", status: "Unrecognized Face" },
    { time: "2025-11-20 07:05:30", camera: "GATE-01-CAM03", confidence: "30%", status: "Unauthorized Dept." },
];
const spoofDetectionMockData = [
    { time: "2025-11-20 10:15:45", camera: "GATE-01-CAM03", faceMatch: "90% (Match)", gestureStatus: "Gesture Failed/Still Image", status: "CRITICAL ALERT" },
    { time: "2025-11-20 11:50:00", camera: "LAB-201-CAM01", faceMatch: "40% (Mismatch)", gestureStatus: "Gesture Valid", status: "HIGH ALERT (Face Mismatch)" },
];
const breachPatternMockData = [
    { location: "LAB-201-CAM01", timeRange: "07:00 - 07:30", attempts: 15, failureRate: "70%", pattern: "Morning Rush Anomaly" },
    { location: "GATE-01-CAM03", timeRange: "18:00 - 20:00", attempts: 22, failureRate: "95%", pattern: "After Hours Unauth. Access" },
];
const auditLogMockData = [
    { time: "2025-11-20 10:05", admin: "A. Reyes (Admin)", action: "Modified Class Schedule (CS101)", module: "Scheduling" },
    { time: "2025-11-20 10:15", admin: "J. Doe (Admin)", action: "Exported 'Attendance Summary'", module: "Reports" },
];


// 3. Usage Reports
const occupancyTrendsMockData = [
    { room: "LAB-201", timeRange: "10:00 - 11:00", count: 45, capacity: 50, status: "Peak (90%)" },
    { room: "RM-105", timeRange: "13:00 - 14:00", count: 12, capacity: 30, status: "Low (40%)" },
    { room: "LAB-302", timeRange: "15:00 - 15:30", count: 52, capacity: 50, status: "OVERCROWDING" },
];
const utilizationVsScheduleMockData = [
    { room: "RM-105", schedule: "CS101 (09:00-10:30)", expected: 30, actual: 0, discrepancy: "Empty/Missed Schedule", status: "Alert" },
    { room: "LAB-201", schedule: "IT202 (13:00-14:30)", expected: 40, actual: 38, discrepancy: "Normal Use", status: "Compliant" },
];
const systemHealthTrendsMockData = [
    { system: "LAB-201 Camera", metric: "Recognition Failure Rate", value: "1.2%", status: "Low" },
    { system: "LAB-201 Camera", metric: "Lighting Condition Error", value: "5 events", status: "Warning" },
    { system: "Server Health", metric: "Uptime (Server)", value: "99.9%", status: "Excellent" },
];
const breakAbuseMockData = [
    { name: "Calingal, Karl", id: "2021-003", breakIn: "10:00", breakOut: "11:30", duration: "90 min", limit: "60 min", status: "Abused" },
    { name: "Llana, Elena", id: "2021-002", breakIn: "10:00", breakOut: "10:45", duration: "45 min", limit: "60 min", status: "Compliant" },
];
const unrecognizedGestureMockData = [
    { time: "2025-11-20 09:30", camera: "LAB-201-CAM01", gesture: "Waving", error: "Mismatch", status: "Needs Debug" },
    { time: "2025-11-20 11:45", camera: "RM-105-CAM02", gesture: "Two Fingers", error: "Not Registered", status: "Needs Training" },
];
const gestureFrequencyMockData = [
    { gesture: "Open Palm (Check-in)", count: 1200, percent: "75%", trend: "High Use" },
    { gesture: "Fist (Break In)", count: 300, percent: "18.75%", trend: "Normal" },
];


// ===========================================
// Reusable Sub-Components (Only classes inside are changed)
// ===========================================

const ReportTag = ({ text, colorClass }) => (
    <span className={`admin-report-tag ${colorClass}`}>{text}</span>
);

const StatusTag = ({ text, colorClass }) => (
    <span className={`admin-status-tag ${colorClass}`}>{text}</span>
);

const ReportTypeCard = ({ category, onOpen }) => (
    <div className="card admin-report-type-card" onClick={() => onOpen(category)}>
        <div className={`admin-report-type-icon ${category.color}-bg`}>
            <i className={`fas ${category.icon}`}></i>
        </div>
        <h3 className="admin-report-type-title">{category.title}</h3>
        <p className="admin-report-type-description">{category.description}</p>
        <button className="admin-view-reports-button">
            <i className="fas fa-eye"></i> View Reports
        </button>
    </div>
);

// ===========================================
// 1. Report GENERATOR Modal - UPDATED
// ===========================================
const ReportGeneratorModal = ({ category, onClose, onGenerate }) => {
    const defaultDate = "2025-11-01";
    const today = "2025-11-30";

    // --- NEW STATES ---
    const [selectedType, setSelectedType] = useState(category.types[0]);
    const [targetType, setTargetType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState(defaultDate);
    const [dateTo, setDateTo] = useState(today);
    const [exportFormat, setExportFormat] = useState('PDF (.pdf)');
    const [frequencyType, setFrequencyType] = useState('Monthly'); // NEW FREQUENCY STATE

    const isUserFilter = ['individual-student', 'individual-faculty'].includes(targetType);
    const isSectionFilter = targetType === 'section';
    
    // Define available frequencies
    const availableFrequencies = ["Daily", "Weekly", "Monthly", "Yearly", "Per Semester"];

    const renderUserSearch = () => {
        if (!isUserFilter && !isSectionFilter) return null;
        const placeholder = isSectionFilter
            ? "Search section code (e.g., CS101, MATH201)"
            : `Search ${targetType.split('-')[1]} name or ID...`;

        return (
            <div className="admin-filter-group-row">
                <div className="admin-filter-search-input">
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

    const handleGenerateClick = () => {
        onGenerate(
            selectedType.name, 
            category.color,
            {
                targetType,
                searchQuery,
                dateFrom,
                dateTo,
                exportFormat,
                frequencyType // Pass new filter
            }
        );
    };

    return (
        <div className="admin-report-modal-overlay">
            <div className="admin-report-modal-content">
                <div className="modal-header">
                    <h2>{category.title} Generator</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="admin-modal-body-grid">
                    <div className="admin-report-type-list-wrapper">
                        <h3>Report Types</h3>
                        <div className="admin-report-type-list">
                            {category.types.map(type => (
                                <div
                                    key={type.name}
                                    className={`admin-report-type-item ${selectedType.name === type.name ? 'selected' : ''}`}
                                    onClick={() => setSelectedType(type)}
                                >
                                    <h4>{type.name}</h4>
                                    <p>{type.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="admin-report-filter-panel">
                        <h3>Generate: {selectedType.name}</h3>
                        
                        {/* Target Scope */}
                        {selectedType.filterTarget && selectedType.filterTarget.some(target => ['organization', 'user', 'section'].includes(target)) && (
                            <div className="admin-filter-group">
                                <label>Target Scope</label>
                                <select className="admin-filter-select" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
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
                        
                        {/* Frequency Dropdown (NEW) */}
                        <div className="admin-filter-group">
                            <label>Frequency</label>
                            <select className="admin-filter-select" value={frequencyType} onChange={(e) => setFrequencyType(e.target.value)}>
                                {availableFrequencies.map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Date Range */}
                        <div className="admin-filter-group">
                            <label>Date Range</label>
                            <div className="admin-filter-group-row">
                                <input type="date" className="admin-filter-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                <input type="date" className="admin-filter-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                        </div>
                        
                        {/* Export Format */}
                        <div className="admin-filter-group">
                            <label>Export Format</label>
                            <select className="admin-filter-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                                <option>PDF (.pdf)</option>
                                <option>Excel (.xlsx)</option>
                                <option>CSV (.csv)</option>
                            </select>
                        </div>
                        
                        <button 
                            className="admin-generate-report-btn-modal"
                            onClick={handleGenerateClick}
                        >
                            <i className="fas fa-magic"></i> Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ===========================================
// Main Reports Page Component
// ===========================================

const ReportsPage = () => {
    // --- States para sa full-page View Mode ---
    const [viewMode, setViewMode] = useState('main'); 
    const [selectedReport, setSelectedReport] = useState(null); 
    
    // Modal States
    const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
    const [selectedGeneratorCategory, setSelectedGeneratorCategory] = useState(null);

    // Filter States
    const [frequencyFilter, setFrequencyFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    // --- HELPER FUNCTION ---
    const mapReportNameToCategory = (reportName) => {
        for (const key of Object.keys(reportCatalog)) {
            for (const type of reportCatalog[key].types) {
                if (type.name === reportName) {
                    return reportCatalog[key].title; 
                }
            }
        }
        return 'Attendance & Compliance Reports'; 
    };

    // --- ACTION HANDLERS ---

    const handleOpenGenerator = (categoryKey) => {
        setSelectedGeneratorCategory(reportCatalog[categoryKey]);
        setGeneratorModalOpen(true);
    };
    
    // 1. Report Download Logic (UPDATED: Added filters to PDF metadata)
    const handleDownloadReport = (report) => {
        const title = report.name || "Custom_Report";
        const doc = new jsPDF();
        const filters = report.filters || {};
        
        // Function to determine content based on report name
        const getReportContent = (reportName) => {
            switch (reportName) {
                // ATTENDANCE REPORTS
                case 'Late Arrival and Early Exit Reports':
                    return {
                        head: [["Name", "ID", "Time Logged", "Scheduled Time", "Deviation", "Status"]],
                        data: lateExitMockData.map(d => [d.name, d.id, d.time, d.schedule, d.deviation, d.status]),
                        headStyles: { fillColor: [52, 152, 219] }
                    };
                case 'Missed Attendance but Present in BreakLogs':
                    return {
                        head: [["Name", "ID", "Class Log", "Break Log", "Location", "Anomaly Status"]],
                        data: missedAttendanceMockData.map(d => [d.name, d.id, d.classTime, d.breakTime, d.location, d.anomaly]),
                        headStyles: { fillColor: [52, 152, 219] }
                    };
                case 'Attendance Summary Reports':
                    return { 
                        head: [["Student Name", "ID", "Attendance Rate", "Status"]],
                        data: attendancePreviewData.map(d => [d.name, d.id, d.rate, d.status]),
                        headStyles: { fillColor: [52, 152, 219] }
                    };

                // SECURITY REPORTS
                case 'System Activity Audit Report':
                    return { 
                        head: [["Timestamp", "Admin User", "Action Performed", "Module Affected"]],
                        data: auditLogMockData.map(d => [d.time, d.admin, d.action, d.module]),
                        headStyles: { fillColor: [231, 76, 60] }
                    };
                case 'Recognized & Unrecognized User Logs':
                    return { 
                        head: [["Timestamp", "Event Type", "User/Target", "Confidence (%)", "Status"]],
                        data: recognizedUnrecognizedMockData.map(d => [d.time, d.event, d.user, d.confidence, d.status]),
                        headStyles: { fillColor: [231, 76, 60] }
                    };
                case 'Unrecognized Face and Unauthorized Access Attempts':
                    return { 
                        head: [["Timestamp", "Camera ID", "Confidence (%)", "Reason/Status"]],
                        data: unauthorizedAccessMockData.map(d => [d.time, d.camera, d.confidence, d.status]),
                        headStyles: { fillColor: [231, 76, 60] }
                    };
                case 'Spoof Attempt Detection Report':
                    return { 
                        head: [["Timestamp", "Camera ID", "Face Match Score", "Gesture Confirmation", "Alert Level"]],
                        data: spoofDetectionMockData.map(d => [d.time, d.camera, d.faceMatch, d.gestureStatus, d.status]),
                        headStyles: { fillColor: [231, 76, 60] }
                    };
                case 'Security Breach Pattern Report':
                    return { 
                        head: [["Location/Camera", "Time Range", "Failed Attempts Count", "Failure Rate", "Detected Pattern"]],
                        data: breachPatternMockData.map(d => [d.location, d.timeRange, d.attempts, d.failureRate, d.pattern]),
                        headStyles: { fillColor: [231, 76, 60] }
                    };

                // USAGE REPORTS
                case 'Break Abuse and Extended Break Reports':
                    return {
                        head: [["Name", "ID", "Break In", "Break Out", "Duration", "Compliance Status"]],
                        data: breakAbuseMockData.map(d => [d.name, d.id, d.breakIn, d.breakOut, d.duration, d.status]),
                        headStyles: { fillColor: [155, 89, 182] }
                    };
                case 'Unrecognized Gesture Attempts':
                    return {
                        head: [["Timestamp", "Camera ID", "Gesture Attempted", "Error Type", "Status"]],
                        data: unrecognizedGestureMockData.map(d => [d.time, d.camera, d.gesture, d.error, d.status]),
                        headStyles: { fillColor: [155, 89, 182] }
                    };
                case 'Gesture Usage Frequency Analysis':
                    return {
                        head: [["Gesture Type", "Frequency Count", "Percentage of Total", "Usage Trend"]],
                        data: gestureFrequencyMockData.map(d => [d.gesture, d.count, d.percent, d.trend]),
                        headStyles: { fillColor: [155, 89, 182] }
                    };
                case 'Room Occupancy Trends & Peak Usage Hours':
                case 'Overcrowding and Empty-but-Scheduled Reports':
                    return { // Occupancy and Overcrowding
                        head: [["Room ID", "Time Range", "Actual Count", "Max Capacity", "Status"]],
                        data: occupancyTrendsMockData.map(d => [d.room, d.timeRange, d.count, d.capacity, d.status]),
                        headStyles: { fillColor: [155, 89, 182] }
                    };
                case 'Room Utilization vs. Schedule Report':
                    return { // Utilization vs Schedule
                        head: [["Room ID", "Schedule Info", "Expected Count", "Actual Count", "Discrepancy", "Status"]],
                        data: utilizationVsScheduleMockData.map(d => [d.room, d.schedule, d.expected, d.actual, d.discrepancy, d.status]),
                        headStyles: { fillColor: [155, 89, 182] }
                    };
                case 'System Error and Recognition Trend Report':
                case 'System Health and Performance Insight (Smart)':
                    return { // System Health and Errors
                        head: [["System/Location", "Metric", "Value/Rate", "Status"]],
                        data: systemHealthTrendsMockData.map(d => [d.system, d.metric, d.value, d.status]),
                        headStyles: { fillColor: [155, 89, 182] }
                    };

                default:
                    return { 
                        head: [["Metric", "Value", "Status"]],
                        data: [['N/A', 'No Data Found', 'Error']],
                        headStyles: { fillColor: [100, 100, 100] }
                    };
            }
        };

        const reportContent = getReportContent(title);

        doc.setFontSize(16);
        doc.text(title.toUpperCase(), 105, 20, null, null, "center");
        // ===============================
// PROFESSIONAL METADATA HEADER
// ===============================
doc.setFontSize(10);

// Format dates nicely
const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    });

const generatedDate = formatDate(new Date());
const dateFrom = filters.dateFrom ? formatDate(filters.dateFrom) : 'N/A';
const dateTo = filters.dateTo ? formatDate(filters.dateTo) : 'N/A';

// Header block positioning
            let metaY = 32;

            doc.text("Generated On :", 14, metaY);
            doc.text(generatedDate, 55, metaY);

            metaY += 6;
            doc.text("Report Scope :", 14, metaY);
            doc.text(filters.targetType ? filters.targetType.replace('-', ' ').toUpperCase() : 'ALL USERS / ORGANIZATION', 55, metaY);

            metaY += 6;
            doc.text("Frequency :", 14, metaY);
            doc.text(filters.frequencyType || 'N/A', 55, metaY);

            metaY += 6;
            doc.text("Date Range :", 14, metaY);
            doc.text(`${dateFrom} – ${dateTo}`, 55, metaY);

            // Divider line
            doc.setLineWidth(0.5);
            doc.line(14, metaY + 4, 196, metaY + 4);


        // Adjust starting Y position for autoTable
        autoTable(doc, {
            head: reportContent.head,
            body: reportContent.data,
            startY: metaY + 10,
            theme: 'grid',
            headStyles: reportContent.headStyles
        });
        
        doc.save(`${title.replace(/ /g, "_")}.pdf`);
    };

    // Handler para sa table button clicks
    const handleDownload = (e, report) => {
        e.stopPropagation();
        handleDownloadReport(report);
    };
    
    // Handler para sa 'Generate Report' button sa loob ng modal (UPDATED: Accepts filters)
    const handleGenerateFromModal = (reportName, categoryColor, filters) => {
    const categoryTitle = mapReportNameToCategory(reportName);

    const newReport = {
        name: reportName,
        type: categoryTitle,
        typeColor: categoryColor,
        date: `${filters.dateFrom} to ${filters.dateTo}`,
        generated: "Just now",
        status: "Ready",
        statusColor: "green",
        frequency: filters.frequencyType || "Custom",
        filters: filters
    };

    // 🔥 ADD TO GENERATED REPORTS TABLE (TOP)
    setRecentReports(prev => [newReport, ...prev]);

    // 🔽 KEEP EXISTING BEHAVIOR
    handleDownloadReport(newReport);

    setGeneratorModalOpen(false);
};


    // 2. Report View Logic (Nagpapalit sa 'preview' mode)
    const handleView = (e, report) => {
        e.stopPropagation();
        setSelectedReport(report);
        setViewMode('preview');
    };
    
    // 3. Back Handler (Pabalik sa main view)
    const handleBack = () => {
        setViewMode('main');
        setSelectedReport(null);
    };

    // 4. Direct Share Logic (Email Only)
    const handleShareEmail = (e, report) => {
        e.stopPropagation();
        window.location.href = `mailto:?subject=Sharing Report: ${report.name}&body=Check out this report generated on ${report.date}.`;
    };

    // Mock Data (Para sa Recent Reports Table) - Retaining previous structure for demonstration purposes
    const [recentReports, setRecentReports] = useState([
    {
        name: "Attendance Summary Reports",
        type: reportCatalog.attendance.title,
        typeColor: reportCatalog.attendance.color,
        date: "Nov 15-21, 2024",
        generated: "2 hours ago",
        status: "Ready",
        statusColor: "green",
        frequency: "Weekly",
        filters: {
            targetType: 'all',
            dateFrom: '2024-11-15',
            dateTo: '2024-11-21',
            exportFormat: 'PDF (.pdf)',
            frequencyType: 'Weekly'
        }
    },
    {
        name: "Security Breach Pattern Report",
        type: reportCatalog.security.title,
        typeColor: reportCatalog.security.color,
        date: "Nov 1-21, 2024",
        generated: "1 day ago",
        status: "Ready",
        statusColor: "green",
        frequency: "Monthly",
        filters: {
            targetType: 'system',
            dateFrom: '2024-11-01',
            dateTo: '2024-11-21',
            exportFormat: 'PDF (.pdf)',
            frequencyType: 'Monthly'
        }
    }
]);


    // Filter Logic
    const filteredReports = recentReports.filter(report => {
        const matchesFrequency = frequencyFilter === "All" || report.frequency === frequencyFilter;
        const matchesCategory = categoryFilter === "All" || report.type.includes(categoryFilter);
        return matchesFrequency && matchesCategory;
    });
    
    // --- RENDERERS ---
    
    // VIEW A: MAIN DASHBOARD
    const renderMainView = () => (
        <div className="admin-reports-container">
            {/* Top Cards */}
            <div className="admin-reports-card-grid">
                {Object.keys(reportCatalog).map(key => (
                    <ReportTypeCard
                        key={key}
                        category={reportCatalog[key]}
                        onOpen={() => handleOpenGenerator(key)}
                    />
                ))}
            </div>

            {/* Recent Reports Table */}
            <div className="card admin-recent-reports-card">
                <div className="admin-recent-reports-header">
                    <h2>Generated Reports</h2>
                    <div className="admin-recent-reports-filters">
                        
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
                            <option value="Utilization">Usage</option> 
                        </select>

                        <button className="admin-export-all-button">
                            <i className="fas fa-upload"></i> Export All
                        </button>
                    </div>
                </div>

                <div className="admin-reports-table-container">
                    <table className="admin-recent-reports-table">
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
                                        <td><ReportTag text={report.type.split(' ')[0]} colorClass={report.typeColor} /></td>
                                        <td>{report.date}</td>
                                        <td>{report.generated}</td>
                                        <td><StatusTag text={report.status} colorClass={report.statusColor} /></td>
                                        <td>
                                            <div className="action-buttons-wrapper">
                                                
                                                {/* Download */}
                                                <button 
                                                    className="admin-action-button download-button" 
                                                    title="Download PDF"
                                                    onClick={(e) => handleDownload(e, report)}
                                                >
                                                    <i className="fas fa-download"></i>
                                                </button>

                                                {/* View */}
                                                <button 
                                                    className="admin-action-button view-button" 
                                                    title="View Details"
                                                    onClick={(e) => handleView(e, report)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>

                                                {/* Share (Direct Email) */}
                                                <button 
                                                    className="admin-action-button share-button"
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
            
            {/* Generators */}
            {generatorModalOpen && selectedGeneratorCategory && (
                <ReportGeneratorModal
                    category={selectedGeneratorCategory}
                    onClose={() => setGeneratorModalOpen(false)}
                    onGenerate={handleGenerateFromModal} 
                />
            )}
        </div>
    );
    
    // VIEW B: PREVIEW MODE (UPDATED: Added filters to preview display)
    const renderPreviewView = () => {
        const filters = selectedReport.filters || {};
        
        const getPreviewTable = (reportName) => {
            let head, data, body;

            switch (reportName) {
                // ATTENDANCE REPORTS
                case 'Late Arrival and Early Exit Reports':
                    head = ["Name", "ID", "Time Logged", "Scheduled Time", "Deviation", "Status"];
                    data = lateExitMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.name}</td><td>{d.id}</td><td>{d.time}</td><td>{d.schedule}</td><td>{d.deviation}</td>
                            <td><StatusTag text={d.status} colorClass={d.status === 'Compliant' ? 'green' : 'orange'} /></td>
                        </tr>
                    ));
                    break;
                case 'Missed Attendance but Present in BreakLogs':
                    head = ["Name", "ID", "Class Log", "Break Log", "Location", "Anomaly Status"];
                    data = missedAttendanceMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.name}</td><td>{d.id}</td><td>{d.classTime}</td><td>{d.breakTime}</td><td>{d.location}</td>
                            <td><StatusTag text={d.anomaly} colorClass={d.anomaly.includes('Risk') ? 'red' : 'yellow'} /></td>
                        </tr>
                    ));
                    break;
                case 'Attendance Summary Reports':
                    head = ["Student Name", "ID Number", "Attendance Rate", "Status"];
                    data = attendancePreviewData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.name}</td><td>{d.id}</td><td>{d.rate}</td>
                            <td><span className={`status-dot ${d.status === 'Late' ? 'orange' : 'green'}`}></span> {d.status}</td>
                        </tr>
                    ));
                    break;
                
                // SECURITY REPORTS
                case 'System Activity Audit Report':
                    head = ["Timestamp", "Admin User", "Action Performed", "Module Affected"];
                    data = auditLogMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.time}</td><td>{d.admin}</td><td>{d.action}</td>
                            <td><StatusTag text={d.module} colorClass={'blue'} /></td>
                        </tr>
                    ));
                    break;
                case 'Recognized & Unrecognized User Logs':
                    head = ["Timestamp", "Event Type", "User/Target", "Confidence (%)", "Status"];
                    data = recognizedUnrecognizedMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.time}</td><td>{d.event}</td><td>{d.user}</td><td>{d.confidence}</td>
                            <td><StatusTag text={d.status} colorClass={d.status.includes('DENIED') ? 'red' : 'green'} /></td>
                        </tr>
                    ));
                    break;
                case 'Unrecognized Face and Unauthorized Access Attempts':
                    head = ["Timestamp", "Camera ID", "Confidence (%)", "Reason/Status"];
                    data = unauthorizedAccessMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.time}</td><td>{d.camera}</td><td>{d.confidence}</td>
                            <td><StatusTag text={d.status} colorClass={'red'} /></td>
                        </tr>
                    ));
                    break;
                case 'Spoof Attempt Detection Report':
                    head = ["Timestamp", "Camera ID", "Face Match Score", "Gesture Confirmation", "Alert Level"];
                    data = spoofDetectionMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.time}</td><td>{d.camera}</td><td>{d.faceMatch}</td><td>{d.gestureStatus}</td>
                            <td><StatusTag text={d.status} colorClass={d.status.includes('CRITICAL') ? 'red' : 'orange'} /></td>
                        </tr>
                    ));
                    break;
                case 'Security Breach Pattern Report':
                    head = ["Location/Camera", "Time Range", "Failed Attempts Count", "Failure Rate", "Detected Pattern"];
                    data = breachPatternMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.location}</td><td>{d.timeRange}</td><td>{d.attempts}</td><td>{d.failureRate}</td>
                            <td><StatusTag text={d.pattern} colorClass={d.pattern.includes('Anomaly') ? 'red' : 'orange'} /></td>
                        </tr>
                    ));
                    break;


                // USAGE REPORTS
                case 'Break Abuse and Extended Break Reports':
                    head = ["Name", "ID", "Break In", "Break Out", "Duration", "Compliance Status"];
                    data = breakAbuseMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.name}</td><td>{d.id}</td><td>{d.breakIn}</td><td>{d.breakOut}</td><td>{d.duration}</td>
                            <td><StatusTag text={d.status} colorClass={d.status === 'Abused' ? 'red' : 'green'} /></td>
                        </tr>
                    ));
                    break;
                case 'Unrecognized Gesture Attempts':
                    head = ["Timestamp", "Camera ID", "Gesture Attempted", "Error Type", "Status"];
                    data = unrecognizedGestureMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.time}</td><td>{d.camera}</td><td>{d.gesture}</td><td>{d.error}</td>
                            <td><StatusTag text={d.status} colorClass={d.status.includes('Debug') ? 'orange' : 'blue'} /></td>
                        </tr>
                    ));
                    break;
                case 'Gesture Usage Frequency Analysis':
                    head = ["Gesture Type", "Frequency Count", "Percentage of Total", "Usage Trend"];
                    data = gestureFrequencyMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.gesture}</td><td>{d.count}</td><td>{d.percent}</td>
                            <td><StatusTag text={d.trend} colorClass={d.trend === 'High Use' ? 'green' : 'yellow'} /></td>
                        </tr>
                    ));
                    break;
                case 'Room Occupancy Trends & Peak Usage Hours':
                case 'Overcrowding and Empty-but-Scheduled Reports':
                    head = ["Room ID", "Time Range", "Actual Count", "Max Capacity", "Status"];
                    data = occupancyTrendsMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.room}</td><td>{d.timeRange}</td><td>{d.count}</td><td>{d.capacity}</td>
                            <td><StatusTag text={d.status} colorClass={d.status.includes('OVERCROWDING') ? 'red' : d.status.includes('Peak') ? 'orange' : 'green'} /></td>
                        </tr>
                    ));
                    break;
                case 'Room Utilization vs. Schedule Report':
                    head = ["Room ID", "Schedule Info", "Expected Count", "Actual Count", "Discrepancy", "Status"];
                    data = utilizationVsScheduleMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.room}</td><td>{d.schedule}</td><td>{d.expected}</td><td>{d.actual}</td><td>{d.discrepancy}</td>
                            <td><StatusTag text={d.status} colorClass={d.status.includes('Alert') ? 'red' : d.status.includes('Warning') ? 'yellow' : 'green'} /></td>
                        </tr>
                    ));
                    break;
                case 'System Error and Recognition Trend Report':
                case 'System Health and Performance Insight (Smart)':
                    head = ["System/Location", "Metric", "Value/Rate", "Status"];
                    data = systemHealthTrendsMockData;
                    body = data.map((d, i) => (
                        <tr key={i}>
                            <td>{d.system}</td><td>{d.metric}</td><td>{d.value}</td>
                            <td><StatusTag text={d.status} colorClass={d.status.includes('Warning') ? 'orange' : 'green'} /></td>
                        </tr>
                    ));
                    break;

                default:
                    head = ["Metric", "Value", "Status"];
                    data = [['N/A', 'No Data Found', 'Error']];
                    body = data.map((d, i) => <tr key={i}><td>{d[0]}</td><td>{d[1]}</td><td>{d[2]}</td></tr>);
            }

            return (
                <table className="rep-table admin-recent-reports-table" style={{ marginTop: '20px' }}>
                    <thead>
                        <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {body}
                    </tbody>
                </table>
            );
        };
        
        return (
            <div className="admin-reports-container fade-in">
                <div className="admin-preview-toolbar">
                    <div className="admin-preview-toolbar-left">
                        <button className="admin-preview-btn admin-back-btn" onClick={handleBack}>
                            <i className="fas fa-arrow-left"></i>
                            <span>Back to Reports</span>
                        </button>
                    </div>

                    <div className="admin-preview-toolbar-right">
                        <button 
                            className="admin-preview-btn admin-download-btn"
                            onClick={(e) => handleDownload(e, selectedReport)}
                        >
                            <i className="fas fa-file-pdf"></i>
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>


                <div className="preview-paper card">
                    <div className="paper-head">
                        <h2>{selectedReport.name}</h2>
                        <p>Type: <ReportTag text={selectedReport.type.split(' ')[0]} colorClass={selectedReport.typeColor} /></p>
                        <p>Status: <StatusTag text={selectedReport.status} colorClass={selectedReport.statusColor} /></p>
                        <hr/>
                        {/* NEW: Display filters here */}
                        <div className="filter-summary">
                            <p><strong>Scope:</strong> {filters.targetType || 'All Users/Organization'}</p>
                            <p><strong>Frequency:</strong> {filters.frequencyType || 'N/A'}</p>
                            <p><strong>Date Range:</strong> {filters.dateFrom || 'N/A'} to {filters.dateTo || 'N/A'}</p>
                            <p><strong>Export Format:</strong> {filters.exportFormat || 'N/A'}</p>
                        </div>
                        <hr/>
                        <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#555' }}>
                            *Sample Data for **{selectedReport.name}** (Demonstration View)
                        </p>
                    </div>
                    {/* Dynamic Table Content based on report name */}
                    {getPreviewTable(selectedReport.name)}
                </div>
            </div>
        );
    };


    return (
        // Conditional rendering batay sa viewMode
        <>
            {viewMode === 'main' ? renderMainView() : renderPreviewView()}
        </>
    );
};

export default ReportsPage;