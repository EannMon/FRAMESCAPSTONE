import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ReportsPage.css';

// ===========================================
// CONFIGURATION CATALOG
// ===========================================
const reportCatalog = {
    attendance: {
        icon: 'fa-users',
        title: 'Attendance & Compliance',
        description: 'Reports on student/faculty attendance, lateness, and absences.',
        color: 'blue',
        types: [
            { name: 'Attendance Summary Reports', desc: 'Present vs Absent rates per user.', filterTarget: ['organization'] },
            { name: 'Late Arrival and Early Exit Reports', desc: 'Habitual punctuality issues.', filterTarget: ['user', 'section'] },
            { name: 'Missed Attendance but Present in BreakLogs', desc: 'Data inconsistency checks.', filterTarget: ['system'] },
        ]
    },
    security: {
        icon: 'fa-shield-alt',
        title: 'Security & Auditing',
        description: 'Logs on unauthorized access, spoofing, and system audits.',
        color: 'red',
        types: [
            { name: 'Recognized & Unrecognized User Logs', desc: 'Full access log history.', filterTarget: ['user', 'system'] },
            { name: 'Unrecognized Face and Unauthorized Access Attempts', desc: 'Security alerts for unknown faces.', filterTarget: ['system'] },
            { name: 'Spoof Attempt Detection Report', desc: 'Failed liveness checks.', filterTarget: ['system'] },
            { name: 'System Activity Audit Report', desc: 'Admin actions and system changes.', filterTarget: ['user'] },
            { name: 'Security Breach Pattern Report', desc: 'Repeated failures by location.', filterTarget: ['system'] },
        ]
    },
    usage: {
        icon: 'fa-chart-pie',
        title: 'System & Resource Usage',
        description: 'Room utilization, gesture analytics, and system health.',
        color: 'purple',
        types: [
            { name: 'Room Occupancy Trends & Peak Usage Hours', desc: 'Heatmap of busy hours.', filterTarget: ['room'] },
            { name: 'Room Utilization vs. Schedule Report', desc: 'Scheduled vs Actual usage.', filterTarget: ['room', 'section'] },
            { name: 'Break Abuse and Extended Break Reports', desc: 'Overstaying break limits.', filterTarget: ['user'] },
            { name: 'Gesture Usage Frequency Analysis', desc: 'Most used hand gestures.', filterTarget: ['system'] },
            { name: 'Unrecognized Gesture Attempts', desc: 'Failed gesture commands.', filterTarget: ['system'] },
            { name: 'System Health and Performance Insight (Smart)', desc: 'Server and model performance metrics.', filterTarget: ['system'] },
        ]
    },
};

// ===========================================
// SUB-COMPONENTS
// ===========================================
const ReportTag = ({ text, colorClass }) => <span className={`admin-report-tag ${colorClass}`}>{text}</span>;
const StatusTag = ({ text }) => {
    let color = 'blue';
    const lower = text ? String(text).toLowerCase() : '';
    if (['late', 'risk', 'denied', 'critical', 'alert', 'abused', 'overcrowding', 'waste'].some(k => lower.includes(k))) color = 'red';
    else if (['warning', 'mismatch', 'check', 'debug', 'underutilized'].some(k => lower.includes(k))) color = 'orange';
    else if (['present', 'good', 'granted', 'normal', 'compliant', 'optimized', 'excellent'].some(k => lower.includes(k))) color = 'green';
    
    return <span className={`admin-status-tag ${color}`}>{text}</span>;
};

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
// GENERATOR MODAL
// ===========================================
const ReportGeneratorModal = ({ category, onClose, onGenerate }) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [selectedType, setSelectedType] = useState(category.types[0]);
    const [dateFrom, setDateFrom] = useState(firstDay);
    const [dateTo, setDateTo] = useState(today);
    const [loading, setLoading] = useState(false);

    const handleGenerateClick = async () => {
        setLoading(true);
        await onGenerate(selectedType.name, category.color, { dateFrom, dateTo });
        setLoading(false);
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
                        <h3>Select Report Type</h3>
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
                        <h3>Configuration</h3>
                        <div className="admin-filter-group">
                            <label>Date Range Coverage</label>
                            <div className="admin-filter-group-row">
                                <input type="date" className="admin-filter-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                <span style={{alignSelf:'center', color:'#888'}}>to</span>
                                <input type="date" className="admin-filter-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                        </div>
                        <button 
                            className="admin-generate-report-btn-modal"
                            onClick={handleGenerateClick}
                            disabled={loading}
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>} 
                            {loading ? " Processing..." : " Generate Report"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===========================================
// MAIN REPORTS PAGE COMPONENT
// ===========================================
const ReportsPage = () => {
    const [viewMode, setViewMode] = useState('main'); 
    const [selectedReport, setSelectedReport] = useState(null); 
    const [reportData, setReportData] = useState([]);
    
    // History & Modals
    const [recentReports, setRecentReports] = useState([]);
    const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
    const [selectedGeneratorCategory, setSelectedGeneratorCategory] = useState(null);

    // --- ACTIONS ---

    const handleOpenGenerator = (categoryKey) => {
        setSelectedGeneratorCategory(reportCatalog[categoryKey]);
        setGeneratorModalOpen(true);
    };

    // 1. GENERATE REPORT (API CALL)
    const handleGenerateFromModal = async (reportName, categoryColor, filters) => {
        try {
            const response = await axios.post('http://localhost:5000/api/admin/reports/generate', {
                report_type: reportName,
                date_from: filters.dateFrom,
                date_to: filters.dateTo
            });

            const newData = response.data.data;

            const newReport = {
                id: Date.now(),
                name: reportName,
                typeColor: categoryColor,
                date: `${filters.dateFrom} to ${filters.dateTo}`,
                generated: new Date().toLocaleString(),
                status: newData.length > 0 ? "Ready" : "No Data",
                statusColor: newData.length > 0 ? "green" : "orange",
                filters: filters,
                data: newData
            };

            setRecentReports(prev => [newReport, ...prev]);
            setGeneratorModalOpen(false);
            
            if (newData.length > 0) {
                handleView(null, newReport);
            } else {
                alert(`Report generated successfully, but no records were found for the selected dates.\n\nTry expanding the date range.`);
            }

        } catch (error) {
            console.error("Report Gen Error:", error);
            alert("Failed to generate report. Please check the backend connection.");
        }
    };

    // 2. VIEW REPORT (PREVIEW)
    const handleView = (e, report) => {
        if (e) e.stopPropagation();
        setSelectedReport(report);
        setReportData(report.data || []);
        setViewMode('preview');
    };

    // 3. DOWNLOAD PDF (DYNAMIC)
    const handleDownloadPDF = (report) => {
        const doc = new jsPDF();
        const title = report.name;
        const dataRows = report.data;

        // Header
        doc.setFillColor(166, 37, 37); // Brand Red
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text(title.toUpperCase(), 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Generated: ${report.generated}`, 14, 30);
        doc.text(`Period: ${report.date}`, 14, 35);

        // Body
        if (dataRows.length > 0) {
            // Extract headers dynamically from the first object keys
            const columns = Object.keys(dataRows[0]).map(key => key.replace(/_/g, ' ').toUpperCase());
            const rows = dataRows.map(obj => Object.values(obj));

            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 45,
                theme: 'grid',
                headStyles: { fillColor: [166, 37, 37] },
                styles: { fontSize: 8 }
            });
        } else {
            doc.setTextColor(0, 0, 0);
            doc.text("No data records found.", 14, 50);
        }

        doc.save(`${title.replace(/ /g, "_")}.pdf`);
    };

    // --- RENDER: PREVIEW MODE (DYNAMIC TABLE) ---
    const renderPreviewView = () => {
        if (!selectedReport) return null;

        // Get dynamic columns
        const columns = reportData.length > 0 ? Object.keys(reportData[0]) : ['Message'];

        return (
            <div className="admin-reports-container fade-in">
                <div className="admin-preview-toolbar">
                    <div className="admin-preview-toolbar-left">
                        <button className="admin-preview-btn admin-back-btn" onClick={() => setViewMode('main')}>
                            <i className="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                    </div>
                    <div className="admin-preview-toolbar-right">
                        <button 
                            className="admin-preview-btn admin-download-btn"
                            onClick={() => handleDownloadPDF(selectedReport)}
                        >
                            <i className="fas fa-file-pdf"></i> Download PDF
                        </button>
                    </div>
                </div>

                <div className="preview-paper card">
                    <div className="paper-head">
                        <h2>{selectedReport.name}</h2>
                        <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                            <ReportTag text={selectedReport.typeColor.toUpperCase()} colorClass={selectedReport.typeColor} />
                            <span className="meta-text"><i className="far fa-calendar-alt"></i> {selectedReport.date}</span>
                        </div>
                        <hr/>
                    </div>

                    <div className="table-responsive">
                        <table className="rep-table admin-recent-reports-table">
                            <thead>
                                <tr>
                                    {columns.map((col, idx) => (
                                        <th key={idx}>{col.replace(/_/g, " ").toUpperCase()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.length > 0 ? (
                                    reportData.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                            {columns.map((col, colIdx) => {
                                                const val = row[col];
                                                // Check if value is status-like to render a tag
                                                const isStatus = ['status', 'type', 'risk', 'anomaly'].some(k => col.toLowerCase().includes(k));
                                                return (
                                                    <td key={colIdx}>
                                                        {isStatus ? <StatusTag text={val} /> : val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} style={{textAlign:'center', padding:'30px', color:'#999'}}>
                                            <i className="fas fa-search" style={{marginBottom:'10px', fontSize:'20px'}}></i><br/>
                                            No data found for the selected criteria.
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

    // --- RENDER: MAIN DASHBOARD ---
    const renderMainView = () => (
        <div className="admin-reports-container fade-in">
            {/* 1. Category Cards */}
            <div className="admin-reports-card-grid">
                {Object.keys(reportCatalog).map(key => (
                    <ReportTypeCard
                        key={key}
                        category={reportCatalog[key]}
                        onOpen={() => handleOpenGenerator(key)}
                    />
                ))}
            </div>

            {/* 2. Session History */}
            <div className="card admin-recent-reports-card">
                <div className="admin-recent-reports-header">
                    <h2>Generated Reports History (This Session)</h2>
                </div>
                <div className="admin-reports-table-container">
                    <table className="admin-recent-reports-table">
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Date Range</th>
                                <th>Generated At</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReports.length > 0 ? (
                                recentReports.map((report) => (
                                    <tr key={report.id}>
                                        <td>{report.name}</td>
                                        <td>{report.date}</td>
                                        <td>{report.generated}</td>
                                        <td><StatusTag text={report.status} /></td>
                                        <td>
                                            <div className="action-buttons-wrapper">
                                                <button className="admin-action-button view-button" onClick={(e) => handleView(e, report)} title="View">
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button className="admin-action-button download-button" onClick={() => handleDownloadPDF(report)} title="Download">
                                                    <i className="fas fa-download"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                                        No reports generated yet. Click a card above to start.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {generatorModalOpen && selectedGeneratorCategory && (
                <ReportGeneratorModal
                    category={selectedGeneratorCategory}
                    onClose={() => setGeneratorModalOpen(false)}
                    onGenerate={handleGenerateFromModal}
                />
            )}
        </div>
    );

    return (
        <>
            {viewMode === 'main' ? renderMainView() : renderPreviewView()}
        </>
    );
};

export default ReportsPage;