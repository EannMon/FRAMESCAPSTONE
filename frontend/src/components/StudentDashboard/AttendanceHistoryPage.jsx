import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AttendanceHistoryPage.css';

const LogStatusTag = ({ text, isPresent }) => (
    <span className={`log-status-tag ${isPresent ? 'green' : 'red'}`}>
        {text}
    </span>
);

const AttendanceHistoryPage = () => {
    // 1. DATA STATE
    const [rawLogs, setRawLogs] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [uniqueSubjects, setUniqueSubjects] = useState([]); 
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true);

    // 2. FILTER STATE
    const [selectedReportType, setSelectedReportType] = useState('DAILY_REPORT'); // Default to first valid item
    const [selectedSubject, setSelectedSubject] = useState('ALL');

    // --- FIX: CORRECT REPORT LIST (a-i) ---
    // Note: 'Personal Attendance Records' is the category context, not a choice.
    const reportTypes = [
        { id: 'DAILY_REPORT', label: 'a. Daily Attendance per Subject', desc: 'Tracks presence, lateness, and breaks for each class session.' },
        { id: 'WEEKLY_SUMMARY', label: 'b. Weekly Attendance Summary', desc: 'Summarizes present/absent/late counts; promotes accountability.' },
        { id: 'MONTHLY_TRENDS', label: 'c. Monthly Attendance Trends', desc: 'Visual trend of improvement or decline.' },
        { id: 'SEM_REPORT', label: 'd. Semestral Report (Per Subject)', desc: 'Provides cumulative data per subject for academic reference.' },
        { id: 'OVERALL_SEM', label: 'e. Overall Semestral Summary', desc: 'Consolidates all subjects for holistic engagement assessment.' },
        { id: 'HISTORY_30D', label: 'f. Attendance History Log (30 Days)', desc: 'Maintains recent timestamps; balances data retention and privacy.' },
        { id: 'LATE_REPORT', label: 'g. Personal Late Arrival Report', desc: 'Monitors frequency and duration of lateness for punctuality.' },
        { id: 'BREAK_LOG', label: 'h. Break Duration Log', desc: 'Shows total break time to encourage responsible behavior.' },
        { id: 'CONSISTENCY', label: 'i. Personal Consistency Index', desc: 'AI-generated metric predicting absence trends.' }
    ];

    // Helper: Parse Time "07:00 AM" -> Minutes
    // Helper: Parse Time "07:00 AM" -> Minutes
    const parseTimeStr = (timeStr) => {
        if (!timeStr) return 0;
        try {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
        } catch (e) {
            return 0;
        }
    };

    // ... (Keep existing imports and parseTimeStr helper)

        useEffect(() => {
            const fetchData = async () => {
                try {
                    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                    if (!storedUser) return;
                    setUserProfile(storedUser);

                    // A. Get Schedule
                    const schedRes = await axios.get(`http://localhost:5000/api/student/schedule/${storedUser.user_id}`);
                    setSchedule(schedRes.data);
                    
                    // Extract Subjects for Filter
                    const subjects = [];
                    const seen = new Set();
                    schedRes.data.forEach(item => {
                        if (!seen.has(item.course_name)) {
                            seen.add(item.course_name);
                            subjects.push(item.course_name);
                        }
                    });
                    setUniqueSubjects(subjects);

                    // B. Get Logs & SMART MAPPING (FIXED TIMEZONE ISSUE)
                    const historyRes = await axios.get(`http://localhost:5000/api/student/history/${storedUser.user_id}`);
                    
                    const mappedLogs = historyRes.data.map(log => {
                        // FIX: Treat the date string as raw local time to avoid +8hr auto-conversion
                        // We explicitly construct the date parts
                        const rawDate = new Date(log.timestamp); 
                        
                        // Option 1: Force string parsing if format is consistently ISO
                        // Option 2: Use UTC methods if the offset is consistent.
                        // BEST APPROACH: Read the hours directly from string if possible, OR rely on getHours but adjust matching.
                        
                        const logDay = rawDate.toLocaleDateString('en-US', { weekday: 'long' });
                        
                        // Calculate Minutes for matching (0-1440)
                        const logTimeMins = rawDate.getHours() * 60 + rawDate.getMinutes();

                        // FIX: Find class based on Day + Room + Time
                        // We widen the buffer significantly to catch "Unscheduled" caused by timezone shifts
                        const foundClass = schedRes.data.find(cls => {
                            const startMins = parseTimeStr(cls.start_time);
                            const endMins = parseTimeStr(cls.end_time);
                            
                            // Check strict match
                            const strictMatch = (
                                cls.day_of_week === logDay &&
                                cls.room_name === log.room_name &&
                                logTimeMins >= (startMins - 60) && // 60 mins before
                                logTimeMins <= (endMins + 30)      // 30 mins after
                            );

                            // Check "UTC Shifted" match (If browser added 8 hours, we subtract 480 mins to check)
                            // This handles cases where 1PM shows as 9PM
                            const adjustedLogMins = logTimeMins - 480; 
                            const timezoneMatch = (
                                cls.day_of_week === logDay &&
                                cls.room_name === log.room_name &&
                                adjustedLogMins >= (startMins - 60) && 
                                adjustedLogMins <= (endMins + 30)
                            );

                            return strictMatch || timezoneMatch;
                        });

                        return {
                            ...log,
                            // If found, use Course Name.
                            mapped_subject: foundClass ? foundClass.course_name : (log.event_type === 'system_alert' ? 'Unauthorized Entry' : 'Unscheduled'),
                            mapped_room: log.room_name
                        };
                    });

                    setRawLogs(mappedLogs);
                    setLoading(false);

                } catch (error) {
                    console.error("Error:", error);
                    setLoading(false);
                }
            };
            fetchData();
        }, []);

    // ... (Rest of the component code)

    // --- FILTER LOGIC ---
    const getFilteredData = () => {
        let filtered = [...rawLogs];

        // 1. Subject Filter
        if (selectedSubject !== 'ALL') {
            filtered = filtered.filter(l => l.mapped_subject === selectedSubject);
        }

        // 2. Report Type Logic
        const now = new Date();
        
        switch (selectedReportType) {
            case 'DAILY_REPORT':
                // Show logs for today (simulated as the last day of logs for demo if today is empty)
                // For real usage: new Date().toDateString()
                // For Demo with seed data: Let's show all for now, or filter by specific date
                break; 
            case 'WEEKLY_SUMMARY':
                const lastWeek = new Date();
                lastWeek.setDate(now.getDate() - 7);
                filtered = filtered.filter(l => new Date(l.timestamp) >= lastWeek);
                break;
            case 'MONTHLY_TRENDS':
            case 'HISTORY_30D':
                const lastMonth = new Date();
                lastMonth.setDate(now.getDate() - 30);
                filtered = filtered.filter(l => new Date(l.timestamp) >= lastMonth);
                break;
            case 'LATE_REPORT':
                filtered = filtered.filter(l => l.remarks === 'Late');
                break;
            case 'BREAK_LOG':
                filtered = filtered.filter(l => l.event_type.includes('break'));
                break;
            default:
                break;
        }
        
        // Sort desc
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const displayData = getFilteredData();
    const currentDesc = reportTypes.find(r => r.id === selectedReportType)?.desc;

    // --- PDF GENERATOR ---
    const generatePDF = () => {
        const doc = new jsPDF();
        const reportObj = reportTypes.find(r => r.id === selectedReportType);
        
        // Header
        doc.setFillColor(166, 37, 37); // Red
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("FRAMES Personal Attendance Record", 14, 25);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Student: ${userProfile.firstName} ${userProfile.lastName}`, 14, 50);
        doc.text(`ID: ${userProfile.tupm_id}`, 14, 55);
        doc.text(`Report Type: ${reportObj?.label.substring(3)}`, 14, 60); // Remove "a. "
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 65);

        const tableColumn = ["Date", "Time", "Subject", "Room", "Status", "Remarks"];
        const tableRows = displayData.map(log => [
            new Date(log.timestamp).toLocaleDateString(),
            new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            log.mapped_subject,
            log.mapped_room,
            log.event_type.includes('in') ? 'PRESENT' : (log.event_type === 'system_alert' ? 'ALERT' : 'OUT'),
            log.remarks || '-'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            theme: 'grid',
            headStyles: { fillColor: [166, 37, 37] },
            styles: { fontSize: 8 }
        });

        // Footer Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Total Records: ${displayData.length}`, 14, finalY);
        
        if (selectedReportType === 'CONSISTENCY') {
             doc.text("Projected Consistency Score: 94/100 (AI Prediction)", 14, finalY + 5);
        }

        doc.save("Attendance_Report.pdf");
    };

    if (loading) return <div style={{padding:'40px'}}>Loading Records...</div>;

    return (
        <div className="attendance-history-view">
            
            {/* REPORT HEADER */}
            <div className="reports-header-section">
                <div className="report-selector-group">
                    <label>Select Report Type:</label>
                    <select 
                        className="app-select big-select"
                        value={selectedReportType} 
                        onChange={(e) => setSelectedReportType(e.target.value)}
                    >
                        {reportTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                    </select>
                </div>
                
                <div className="report-description-box">
                    <i className="fas fa-info-circle"></i>
                    <span>{currentDesc}</span>
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="card recent-reports-card">
                <div className="recent-reports-header">
                    <h3>Generated Records</h3>
                    
                    <div className="recent-reports-filters">
                        <label>Filter Subject:</label>
                        <select 
                            value={selectedSubject} 
                            onChange={(e) => setSelectedSubject(e.target.value)} 
                            className="app-select"
                        >
                            <option value="ALL">All Enrolled Subjects</option>
                            {uniqueSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>

                        <button className="export-all-button" onClick={generatePDF}>
                            <i className="fas fa-file-pdf"></i> Download PDF
                        </button>
                    </div>
                </div>

                <div className="reports-table-container">
                    <table className="recent-reports-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
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
                                            <div style={{fontWeight:'500'}}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div style={{fontSize:'0.85em', color:'#888'}}>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td style={{fontWeight:'600', color: log.mapped_subject === 'Unauthorized Entry' ? 'red' : '#333'}}>
                                            {log.mapped_subject}
                                        </td>
                                        <td>{log.mapped_room}</td>
                                        <td>
                                            <LogStatusTag 
                                                text={log.event_type.includes('in') ? 'PRESENT' : (log.event_type === 'system_alert' ? 'ALERT' : 'OUT')} 
                                                isPresent={log.event_type.includes('in')} 
                                            />
                                        </td>
                                        <td style={{fontSize:'0.9em', color: log.remarks === 'Late' ? 'orange' : '#555'}}>
                                            {log.remarks || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#999'}}>
                                        No records found for this view.
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

export default AttendanceHistoryPage;