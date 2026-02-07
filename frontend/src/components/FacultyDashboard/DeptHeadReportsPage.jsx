import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import Axios
import { generateFramesPDF } from '../../utils/ReportGenerator';
import './DeptHeadReportsPage.css';

const DeptHeadReportsPage = () => {

    // --- STATES ---
    const [selectedReportId, setSelectedReportId] = useState('FAC_PERFORMANCE');
    const [reportData, setReportData] = useState([]); // Holds DB data
    const [loading, setLoading] = useState(false);

    // --- REPORT CONFIGURATION ---
    const reportOptions = [
        // FACULTY REPORTS (Matching TestPDFPage Template)
        { id: 'FAC_PERFORMANCE', label: 'Faculty Attendance Performance', desc: 'Aggregates attendance and punctuality of instructors.', type: 'FACULTY', endpoint: '/reports/faculty-summary' },
        { id: 'FAC_LATE', label: 'Faculty Late Arrival Report', desc: 'Identifies recurring delays by faculty.', type: 'FACULTY', endpoint: '/reports/faculty-summary' },

        // ROOM REPORTS
        { id: 'ROOM_OCCUPANCY', label: 'Room Utilization & Occupancy', desc: 'Tracks occupants per room vs capacity.', type: 'ROOM', endpoint: '/reports/room-occupancy' },
        { id: 'OVERCROWDING', label: 'Overcrowding Alerts', desc: 'Detects rooms exceeding safety capacity.', type: 'ROOM', endpoint: '/reports/room-occupancy' }
    ];

    const currentReport = reportOptions.find(r => r.id === selectedReportId);
    const isRoomReport = currentReport?.type === 'ROOM';

    // --- FETCH DATA FROM DB ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch from the specific endpoint defined in options
                const response = await axios.get(`http://localhost:5000${currentReport.endpoint}`);
                setReportData(response.data);
            } catch (error) {
                console.error("Error fetching report:", error);
                setReportData([]); // Fallback to empty if DB fails
            } finally {
                setLoading(false);
            }
        };

        if (currentReport?.endpoint) {
            fetchData();
        }
    }, [selectedReportId, currentReport]);

    // --- PDF GENERATOR ---
    const handleDownloadPDF = () => {
        // 1. Map Data for Report
        let tableInput = [];

        if (isRoomReport) {
            // Match TestPDFPage Keys: Room, Capacity, Current, Utilization, Status
            tableInput = reportData.map(r => ({
                "Room": r.room_name,
                "Capacity": r.capacity.toString(),
                "Current": r.peak_hour, // Mapping peak_hour to Current for now, or use utilization derived
                "Utilization": `${r.utilization}%`,
                "Status": r.status
            }));
        } else {
            // Match TestPDFPage Keys: Faculty, Subject_Load, Attendance, Average_Lates, Status
            tableInput = reportData.map(f => ({
                "Faculty": f.name,
                "Subject_Load": `${f.subject_load} Units`,
                "Attendance": `${f.attendance_rate}%`,
                "Average_Lates": f.lates.toString(), // Mapping lates to Average_Lates
                "Status": f.remarks // Mapping Remarks to Status
            }));
        }

        // 2. Generate PDF
        // 2. Generate PDF
        generateFramesPDF({
            title: currentReport.label,
            type: isRoomReport ? "FACILITY REPORT" : "DEPARTMENT REPORT",
            category: 'system', // Triggers "Scope" context in ReportGenerator
            context: {
                scope: "Computer Studies Department" // Hardcoded for now, could be dynamic
            },
            dateRange: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }, tableInput);
    };

    return (
        <div className="dept-reports-container fade-in">
            <div className="dept-reports-header">
                <div className="dept-control-group">
                    <label>Select Report Type</label>
                    <select
                        className="dept-select"
                        value={selectedReportId}
                        onChange={(e) => setSelectedReportId(e.target.value)}
                    >
                        <optgroup label="Faculty Reports">
                            {reportOptions.filter(r => r.type === 'FACULTY').map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Facility Reports">
                            {reportOptions.filter(r => r.type === 'ROOM').map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                <div className="dept-report-info">
                    <i className={`fas ${isRoomReport ? 'fa-building' : 'fa-chalkboard-teacher'}`}></i>
                    <div className="info-content">
                        <h4>{currentReport.label}</h4>
                        <p>{currentReport.desc}</p>
                    </div>
                </div>
            </div>

            <div className="dept-table-card">
                <div className="dept-card-header">
                    <h3>Report Data {loading && <span style={{ fontSize: '0.7em', color: '#888' }}>(Loading...)</span>}</h3>
                    <button className="btn-export" onClick={handleDownloadPDF} disabled={reportData.length === 0}>
                        <i className="fas fa-file-pdf"></i> Generate Official Report
                    </button>
                </div>

                <div className="dept-table-wrapper">
                    <table className="dept-table">
                        <thead>
                            {isRoomReport ? (
                                <tr>
                                    <th>Room</th>
                                    <th>Capacity</th>
                                    <th>Current</th>
                                    <th>Utilization</th>
                                    <th>Status</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>Faculty</th>
                                    <th>Subject Load</th>
                                    <th>Attendance %</th>
                                    <th>Average Lates</th>
                                    <th>Status</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map((row, index) => (
                                    <tr key={index}>
                                        {isRoomReport ? (
                                            <>
                                                <td style={{ fontWeight: 'bold' }}>{row.room_name}</td>
                                                <td>{row.capacity}</td>
                                                <td>{row.peak_hour}</td>
                                                <td>
                                                    <span className={`status-pill ${parseInt(row.utilization) > 90 ? 'alert' : 'present'}`}>
                                                        {row.utilization}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-text ${row.status === 'Overcrowded' ? 'red-text' : 'green-text'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ fontWeight: 'bold' }}>{row.name}</td>
                                                <td>{row.subject_load} Subjects</td>
                                                <td>{row.attendance_rate}</td>
                                                <td>
                                                    <span className={`status-pill ${row.lates > 3 ? 'late' : 'present'}`}>
                                                        {row.lates}
                                                    </span>
                                                </td>
                                                <td>{row.remarks}</td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                        {loading ? "Fetching data..." : "No records found in database."}
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

export default DeptHeadReportsPage;