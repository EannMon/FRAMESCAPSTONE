import React, { useState } from 'react';
import StudentReportModal from './StudentReportModal';

/**
 * LogStatusTag — color-coded status badge for attendance log rows.
 */
const LogStatusTag = ({ text, isPresent, type }) => {
    let statusClass = 'neutral';
    if (isPresent) statusClass = 'success';
    else if (type === 'system_alert') statusClass = 'danger';
    else if (type === 'break_out') statusClass = 'warning';
    else statusClass = 'neutral';

    return (
        <span className={`log-status-tag ${statusClass}`}>
            {text}
        </span>
    );
};

/**
 * AttendanceTableView — Table card with subject filter, export button,
 * report generation modal, and attendance log rows.
 */
const AttendanceTableView = ({
    displayData,
    uniqueSubjects,
    selectedSubject,
    onSubjectChange,
    userProfile,
    selectedReportType,
    reportTypes,
    dateRangeString
}) => {
    const [showReportModal, setShowReportModal] = useState(false);

    // --- REPORT GENERATION HANDLER ---
    const handleGenerateReport = (format) => {
        const tableInput = displayData.map(log => ({
            "Date": new Date(log.timestamp).toLocaleDateString(),
            "Time": new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            "Subject": log.mapped_subject,
            "Room": log.mapped_room || 'N/A',
            "Status": log.event_type.includes('in') ? 'PRESENT' : (log.event_type === 'system_alert' ? 'ALERT' : 'OUT'),
            "Remarks": log.remarks || '-'
        }));

        const reportObj = reportTypes.find(r => r.id === selectedReportType);
        const reportTitle = reportObj?.label.replace(/^[a-z]\.\s/, '') || "Attendance Report";

        const reportInfo = {
            title: reportTitle,
            type: "PERSONAL ATTENDANCE RECORD",
            category: 'personal',
            context: {
                name: `${userProfile.first_name || userProfile.firstName} ${userProfile.last_name || userProfile.lastName}`,
                id: userProfile.tupm_id
            },
            dateRange: dateRangeString
        };

        if (format === 'PDF') {
            import('../../utils/ReportGenerator').then(({ generateFramesPDF }) => {
                generateFramesPDF(reportInfo, tableInput);
            });
        } else if (format === 'CSV') {
            import('../../utils/ReportGenerator').then(({ generateCSV }) => {
                generateCSV(reportInfo, tableInput);
            });
        }

        setShowReportModal(false);
    };

    return (
        <div className="card recent-reports-card">
            <div className="recent-reports-header">
                <h3>Generated Records</h3>

                <div className="recent-reports-filters">
                    <label>Filter Subject:</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => onSubjectChange(e.target.value)}
                        className="app-select"
                    >
                        <option value="ALL">All Enrolled Subjects</option>
                        {uniqueSubjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>

                    <button className="export-all-button" onClick={() => setShowReportModal(true)}>
                        <i className="fas fa-file-pdf"></i> Generate Official Report
                    </button>
                </div>
            </div>

            <div className="reports-table-container">
                <table className="recent-reports-table">
                    <thead>
                        <tr>
                            <th>Date &amp; Time</th>
                            <th>Subject</th>
                            <th>Room</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.length > 0 ? (
                            displayData.map((log, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.85em', color: '#888' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td style={{ fontWeight: '600', color: log.mapped_subject === 'Unauthorized Entry' ? '#C62828' : '#333' }}>
                                        {log.mapped_subject}
                                    </td>
                                    <td>{log.mapped_room}</td>
                                    <td>
                                        <LogStatusTag
                                            text={log.event_type.includes('in') ? 'PRESENT' : (log.event_type === 'system_alert' ? 'ALERT' : 'OUT')}
                                            isPresent={log.event_type.includes('in')}
                                            type={log.event_type}
                                        />
                                    </td>
                                    <td style={{ fontSize: '0.9em', color: log.remarks === 'Late' ? 'orange' : '#555' }}>
                                        {log.remarks || '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                    No records found for this view.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* REPORT GENERATION MODAL */}
            <StudentReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onGenerate={handleGenerateReport}
                defaultReportType={reportTypes.find(r => r.id === selectedReportType)?.label}
                defaultSubject={selectedSubject === 'ALL' ? 'All Enrolled Subjects' : selectedSubject}
                defaultDate={dateRangeString}
                filters="All Statuses"
            />
        </div>
    );
};

export default AttendanceTableView;
