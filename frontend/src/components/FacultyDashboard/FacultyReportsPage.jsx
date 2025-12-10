import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './FacultyReportsPage.css';

const FacultyReportsPage = () => {
    // --- STATES ---
    const [viewMode, setViewMode] = useState('main'); // 'main' | 'preview'
    const [selectedReport, setSelectedReport] = useState(null);

    // --- MOCK DATA ---
    const recentReports = [
        { id: 1, title: "CS101 Attendance Summary", date: "Nov 15, 2024", size: "2.4 MB", type: "PDF", status: "Ready" },
        { id: 2, title: "Weekly Class Performance", date: "Nov 13, 2024", size: "1.8 MB", type: "Excel", status: "Ready" },
        { id: 3, title: "Student Risk Analysis", date: "Nov 10, 2024", size: "3.1 MB", type: "PDF", status: "Ready" },
        { id: 4, title: "Data Structures Log", date: "Nov 08, 2024", size: "1.5 MB", type: "Excel", status: "Archived" },
    ];

    const previewData = [
        { name: "Terana, Angelica", id: "2021-001", rate: "98%", status: "Excellent" },
        { name: "Llana, Elena", id: "2021-002", rate: "95%", status: "Good" },
        { name: "Calingal, Karl", id: "2021-003", rate: "88%", status: "Average" },
        { name: "Lungay, Emmanuel", id: "2021-004", rate: "92%", status: "Good" },
    ];

    // --- HANDLERS ---
    const handleViewReport = (report) => {
        setSelectedReport(report);
        setViewMode('preview');
    };

    const handleBack = () => {
        setViewMode('main');
        setSelectedReport(null);
    };

    const handleDownloadPDF = (title = "Report") => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(title.toUpperCase(), 105, 20, null, null, "center");
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

        const rows = previewData.map(d => [d.name, d.id, d.rate, d.status]);
        autoTable(doc, {
            head: [["Student Name", "ID", "Attendance", "Status"]],
            body: rows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [166, 37, 37] } // Red Theme
        });
        doc.save(`${title.replace(/ /g, "_")}.pdf`);
    };

    // --- RENDERERS ---

    // VIEW A: MAIN DASHBOARD
    const renderMainView = () => (
        <div className="fade-in">
            {/* Header Action Only (No Title) */}
            <div className="reports-top-bar">
                <div className="spacer"></div> {/* Pushes button to right */}
                <button className="rep-btn primary" onClick={() => handleDownloadPDF("Custom_Report")}>
                    <i className="fas fa-plus"></i> Create Custom Report
                </button>
            </div>

            {/* Stats Grid */}
            <div className="rep-stats-grid">
                <div className="rep-stat-card">
                    <div className="stat-icon red"><i className="fas fa-file-alt"></i></div>
                    <div><div className="stat-val">24</div><div className="stat-lbl">Total Reports</div></div>
                </div>
                <div className="rep-stat-card">
                    <div className="stat-icon blue"><i className="fas fa-clock"></i></div>
                    <div><div className="stat-val">3</div><div className="stat-lbl">Pending</div></div>
                </div>
                <div className="rep-stat-card">
                    <div className="stat-icon green"><i className="fas fa-check-circle"></i></div>
                    <div><div className="stat-val">21</div><div className="stat-lbl">Completed</div></div>
                </div>
                <div className="rep-stat-card">
                    <div className="stat-icon orange"><i className="fas fa-download"></i></div>
                    <div><div className="stat-val">156</div><div className="stat-lbl">Downloads</div></div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rep-card">
                <h3>Quick Generate</h3>
                <div className="rep-types-grid">
                    {[
                        { icon: "fas fa-users", title: "Attendance", desc: "Class logs summary" },
                        { icon: "fas fa-user-graduate", title: "Performance", desc: "Student analytics" },
                        { icon: "fas fa-calendar-week", title: "Weekly", desc: "7-day overview" },
                        { icon: "fas fa-file-excel", title: "Raw Data", desc: "Export to Excel" }
                    ].map((item, idx) => (
                        <div key={idx} className="rep-type-item">
                            <div className="type-icon"><i className={item.icon}></i></div>
                            <h4>{item.title}</h4>
                            <p>{item.desc}</p>
                            <button className="rep-btn outline small" onClick={() => handleDownloadPDF(item.title)}>
                                Generate
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Reports List */}
            <div className="rep-card">
                <h3>Recent Reports</h3>
                <div className="rep-list">
                    {recentReports.map((report) => (
                        <div key={report.id} className="rep-list-item">
                            <div className="rep-file-icon">
                                <i className={`fas ${report.type === 'PDF' ? 'fa-file-pdf text-red' : 'fa-file-excel text-green'}`}></i>
                            </div>
                            <div className="rep-info">
                                <div className="rep-name">{report.title}</div>
                                <div className="rep-meta">{report.date} • {report.size}</div>
                            </div>
                            <div className="rep-actions">
                                <button className="icon-action" title="View" onClick={() => handleViewReport(report)}>
                                    <i className="fas fa-eye"></i>
                                </button>
                                <button className="icon-action" title="Download" onClick={() => handleDownloadPDF(report.title)}>
                                    <i className="fas fa-download"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // VIEW B: PREVIEW MODE
    const renderPreviewView = () => (
        <div className="fade-in">
            <div className="preview-toolbar">
                <button className="rep-btn outline" onClick={handleBack}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <button className="rep-btn primary" onClick={() => handleDownloadPDF(selectedReport.title)}>
                    <i className="fas fa-download"></i> Download PDF
                </button>
            </div>

            <div className="preview-paper">
                <div className="paper-head">
                    <h2>{selectedReport.title}</h2>
                    <p>Status: <span className="status-tag">{selectedReport.status}</span></p>
                </div>
                <table className="rep-table">
                    <thead>
                        <tr><th>Student Name</th><th>ID Number</th><th>Attendance</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {previewData.map((d, i) => (
                            <tr key={i}>
                                <td>{d.name}</td><td>{d.id}</td><td>{d.rate}</td>
                                <td><span className={`status-dot ${d.status === 'Average' ? 'orange' : 'green'}`}></span> {d.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="faculty-reports-container">
            {viewMode === 'main' ? renderMainView() : renderPreviewView()}
        </div>
    );
};

export default FacultyReportsPage;