import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../FacultyDashboard/FacultyReportsPage.css';
import FacultyReportModal from '../FacultyDashboard/FacultyReportModal';
import { generateFramesPDF, generateCSV } from '../../utils/ReportGenerator';

// ============================================
// DEPARTMENT HEAD REPORT OPTIONS
// ============================================
const reportOptions = [
    // --- Faculty Oversight ---
    { id: 'FACULTY_SUMMARY', label: 'Faculty Performance Summary', desc: 'Overview of all faculty attendance punctuality.', category: 'Faculty Oversight' },
    { id: 'FACULTY_LATE', label: 'Faculty Late Arrivals Report', desc: 'Reports on faculty who arrive late to classes.', category: 'Faculty Oversight' },
    { id: 'FACULTY_CONSISTENCY', label: 'Faculty Consistency Index', desc: 'AI-computed metric of attendance regularity per faculty.', category: 'Faculty Oversight' },

    // --- Facility & Room Analytics ---
    { id: 'ROOM_OCCUPANCY', label: 'Room Occupancy Report', desc: 'Usage metrics per room based on attendance data.', category: 'Facility & Room Analytics' },
    { id: 'PEAK_USAGE', label: 'Peak Hour / Room Usage', desc: 'Identifies peak attendance times per room.', category: 'Facility & Room Analytics' },
    { id: 'ROOM_UTILIZATION', label: 'Room Utilization Rate', desc: 'How efficiently rooms are scheduled vs. used.', category: 'Facility & Room Analytics' },
    { id: 'OVERCROWDING', label: 'Overcrowding Alerts', desc: 'Rooms exceeding capacity thresholds.', category: 'Facility & Room Analytics' },

    // --- Departmental Strategy ---
    { id: 'DEPT_ACTIVITY', label: 'Department-Wide Activity', desc: 'Cross-course attendance and engagement overview.', category: 'Departmental Strategy' },
];

const getColumnConfig = () => ({
    headers: ['ID', 'Name / Room', 'Detail', 'Status', 'Metric', 'Remarks'],
    keys: ['id', 'col1', 'col2', 'status', 'col3', 'remarks']
});

const DeptHeadReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [room, setRoom] = useState('');
    const [rooms, setRooms] = useState([]);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const user = useMemo(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }, []);

    // Fetch room list
    useEffect(() => {
        axios.get(`${API}/api/dept/management-data`).then(res => {
            setRooms(res.data?.rooms || []);
        }).catch(() => { });
    }, []);

    const groupedReports = useMemo(() => {
        const groups = {};
        reportOptions.forEach(opt => {
            if (!groups[opt.category]) groups[opt.category] = [];
            groups[opt.category].push(opt);
        });
        return groups;
    }, []);

    const fetchReportData = async (reportId) => {
        setLoading(true);
        try {
            const params = { report_type: reportId };
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (room) params.room = room;

            const res = await axios.get(`${API}/api/dept/reports/data`, { params });
            setReportData(res.data || []);
        } catch (err) {
            console.error('Dept report fetch error:', err);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        fetchReportData(report.id);
    };

    const handleRefresh = () => {
        if (selectedReport) fetchReportData(selectedReport.id);
    };

    const config = getColumnConfig();

    const handleDownloadPDF = async () => {
        if (!selectedReport || reportData.length === 0) return;
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });
        const reportInfo = {
            title: selectedReport.label,
            type: 'Department Head Report',
            category: 'dept',
            dateRange: `${dateFrom || 'Start'} — ${dateTo || 'Present'}`,
            context: { name: user ? `${user.first_name} ${user.last_name}` : 'Dept Head', id: user?.tupm_id || '' }
        };
        await generateFramesPDF(reportInfo, tableData, 'download');
    };

    const handleDownloadCSV = () => {
        if (!selectedReport || reportData.length === 0) return;
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });
        generateCSV({ title: selectedReport.label }, tableData);
    };

    const handlePreviewPDF = async () => {
        if (!selectedReport || reportData.length === 0) return;
        const tableData = reportData.map(row => {
            const obj = {};
            config.keys.forEach((key, i) => { obj[config.headers[i]] = row[key] || 'N/A'; });
            return obj;
        });
        const reportInfo = {
            title: selectedReport.label,
            type: 'Department Head Report',
            category: 'dept',
            dateRange: `${dateFrom || 'Start'} — ${dateTo || 'Present'}`,
            context: { name: user ? `${user.first_name} ${user.last_name}` : 'Dept Head', id: user?.tupm_id || '' }
        };
        const url = await generateFramesPDF(reportInfo, tableData, 'view');
        setPreviewUrl(url);
        setModalOpen(true);
    };

    return (
        <div className="faculty-reports-page">
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Department Reports</h2>
                    <p className="reports-subtitle">Faculty oversight, facility analytics, and departmental strategy reports</p>
                </div>
                <div className="academic-year-badge">
                    <i className="fas fa-calendar-alt"></i> A.Y. 2025-2026
                </div>
            </div>

            <div className="reports-filters-bar">
                <div className="filter-group">
                    <label>Report Type</label>
                    <select
                        value={selectedReport?.id || ''}
                        onChange={e => handleSelectReport(reportOptions.find(opt => opt.id === e.target.value))}
                        className="filter-select"
                        style={{ minWidth: '240px' }}
                    >
                        <option value="" disabled>Select a report...</option>
                        {Object.entries(groupedReports).map(([category, options]) => (
                            <optgroup key={category} label={category}>
                                {options.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Room</label>
                    <select value={room} onChange={e => setRoom(e.target.value)} className="filter-select">
                        <option value="">All Rooms</option>
                        {rooms.map((r, i) => <option key={i} value={r.room_name}>{r.room_name}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-input" />
                </div>
                <div className="filter-group">
                    <label>To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-input" />
                </div>
                <button className="filter-refresh-btn" onClick={handleRefresh} disabled={!selectedReport} style={{ opacity: !selectedReport ? 0.5 : 1 }}>
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            <div className="reports-layout-full">
                <div className="reports-content">
                    {!selectedReport ? (
                        <div className="reports-empty-state">
                            <i className="fas fa-chart-pie"></i>
                            <h3>Select a Report</h3>
                            <p>Choose a report type from the sidebar to view department-wide data.</p>
                        </div>
                    ) : (
                        <>
                            <div className="report-content-header">
                                <div>
                                    <h3>{selectedReport.label}</h3>
                                    <p>{selectedReport.desc}</p>
                                </div>
                                <div className="report-actions">
                                    <button className="report-action-btn preview" onClick={handlePreviewPDF} disabled={reportData.length === 0}>
                                        <i className="fas fa-eye"></i> Preview
                                    </button>
                                    <button className="report-action-btn pdf" onClick={handleDownloadPDF} disabled={reportData.length === 0}>
                                        <i className="fas fa-file-pdf"></i> PDF
                                    </button>
                                    <button className="report-action-btn csv" onClick={handleDownloadCSV} disabled={reportData.length === 0}>
                                        <i className="fas fa-file-csv"></i> CSV
                                    </button>
                                </div>
                            </div>

                            <div className="report-table-container">
                                {loading ? (
                                    <div className="report-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading report data...</p></div>
                                ) : reportData.length === 0 ? (
                                    <div className="report-no-data">
                                        <i className="fas fa-database"></i>
                                        <h4>No Data Available</h4>
                                        <p>No records found for the selected filters. Adjust the date range or room filter.</p>
                                    </div>
                                ) : (
                                    <table className="report-table">
                                        <thead><tr>{config.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                                        <tbody>
                                            {reportData.map((row, i) => (
                                                <tr key={i}>
                                                    {config.keys.map(key => (
                                                        <td key={key} className={key === 'status' ? `status-cell status-${(row[key] || '').toLowerCase().replace(/\s+/g, '-')}` : ''}>{row[key] || 'N/A'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {reportData.length > 0 && (
                                <div className="report-footer"><span>{reportData.length} record(s) found</span></div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {modalOpen && <FacultyReportModal previewUrl={previewUrl} onClose={() => setModalOpen(false)} />}
        </div>
    );
};

export default DeptHeadReportsPage;
