import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
    const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]); // End Date
    const [selectedSemester, setSelectedSemester] = useState('1ST'); // 1ST, 2ND, SUMMER
    const [academicYear, setAcademicYear] = useState(new Date().getFullYear());

    // ... (reportTypes array remains same) ...
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!storedUser) return;
                setUserProfile(storedUser);

                // A. Get Schedule & Pre-process
                const userId = storedUser.id || storedUser.user_id;
                const schedRes = await axios.get(`http://localhost:5000/api/student/schedule/${userId}`);
                
                // OPTIMIZATION: Pre-calculate start/end minutes for schedule
                const processedSchedule = (schedRes.data || []).map(cls => ({
                    ...cls,
                    startMins: parseTimeStr(cls.start_time),
                    endMins: parseTimeStr(cls.end_time)
                }));
                setSchedule(processedSchedule);

                // Extract Subjects for Filter
                const subjects = [];
                const seen = new Set();
                processedSchedule.forEach(item => {
                    if (!seen.has(item.course_name)) {
                        seen.add(item.course_name);
                        subjects.push(item.course_name);
                    }
                });
                setUniqueSubjects(subjects);

                // B. Get Logs & SMART MAPPING
                const historyRes = await axios.get(`http://localhost:5000/api/student/history/${userId}`);
                const rawLogData = historyRes.data || [];

                const mappedLogs = rawLogData.map(log => {
                    // 1. Create Date object manually to avoid Timezone Shift
                    const t = log.timestamp.split(/[- :]/);
                    const logDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

                    const logDay = logDate.toLocaleDateString('en-US', { weekday: 'long' });
                    const logTimeMins = logDate.getHours() * 60 + logDate.getMinutes();

                    // 2. Find Class Match (Using Pre-processed Schedule)
                    const foundClass = processedSchedule.find(cls => {
                        // Check Day first (Fast fail)
                        if (cls.day_of_week !== logDay) return false;

                        // Check Room (If room data exists in log)
                        if (log.room_name && cls.room_name && log.room_name !== cls.room_name) return false;

                        // Check Time (Buffer: 60 mins before, 60 mins after class starts/ends)
                        return (
                            logTimeMins >= (cls.startMins - 60) &&
                            logTimeMins <= (cls.endMins + 60)
                        );
                    });

                    return {
                        ...log,
                        mapped_subject: foundClass ? foundClass.title : (log.event_type === 'system_alert' ? 'Unauthorized Entry' : 'Unscheduled'),
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

    // --- FILTER LOGIC ---
    const getFilteredData = () => {
        let filtered = [...rawLogs];

        // 1. Subject Filter
        if (selectedSubject !== 'ALL') {
            filtered = filtered.filter(l => l.mapped_subject === selectedSubject);
        }

        // 2. Report Type Logic
        const selectedDate = new Date(filterDate);
        // Helper: Reset hours for accurate date comparison
        selectedDate.setHours(0, 0, 0, 0);

        switch (selectedReportType) {
            case 'DAILY_REPORT':
            case 'LATE_REPORT':
            case 'BREAK_LOG':
                filtered = filtered.filter(l => {
                    const logDate = new Date(l.timestamp);
                    return logDate.toDateString() === selectedDate.toDateString();
                });
                break;
            case 'WEEKLY_SUMMARY':
                // Match week (Start date -> +7 days)
                const weekEnd = new Date(selectedDate);
                weekEnd.setDate(weekEnd.getDate() + 6);
                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    return d >= selectedDate && d <= weekEnd;
                });
                break;
            case 'HISTORY_30D':
                // History: filterDate is END DATE. Limit to prev 30 days.
                const last30 = new Date(selectedDate);
                last30.setHours(0,0,0,0);
                last30.setDate(last30.getDate() - 30);
                // selectedDate (End) should include end of day
                const rangeEnd = new Date(selectedDate);
                rangeEnd.setHours(23, 59, 59, 999);

                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    return d >= last30 && d <= rangeEnd;
                });
                break;
            case 'MONTHLY_TRENDS':
                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    // filterDate format "YYYY-MM-DD", works for specific month
                    return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                });
                break;
            case 'SEM_REPORT':
                // Specific Semester (Year + Sem)
                const year = parseInt(academicYear);
                let semStart, semEnd;
                
                if (selectedSemester === '1ST') {
                    semStart = new Date(year, 7, 1); // Aug 1
                    semEnd = new Date(year, 11, 31); // Dec 31
                } else if (selectedSemester === '2ND') {
                    semStart = new Date(year + 1, 0, 1); // Jan 1 (Next Year)
                    semEnd = new Date(year + 1, 4, 31); // May 31
                } else { // SUMMER
                    semStart = new Date(year + 1, 5, 1); // Jun 1
                    semEnd = new Date(year + 1, 6, 31); // Jul 31
                }

                filtered = filtered.filter(l => {
                    const d = new Date(l.timestamp);
                    return d >= semStart && d <= semEnd;
                });
                break;
            case 'OVERALL_SEM':
                // Whole Academic Year (Aug 1 to Jul 31 next year)
                const acYear = parseInt(academicYear);
                const acStart = new Date(acYear, 7, 1);
                const acEnd = new Date(acYear + 1, 6, 31);
                
                filtered = filtered.filter(l => {
                     const d = new Date(l.timestamp);
                     return d >= acStart && d <= acEnd;
                });
                break;
            default:
                break;
        }

        // Sort desc
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const displayData = getFilteredData();
    const currentDesc = reportTypes.find(r => r.id === selectedReportType)?.desc;

    // --- GENERATE DATE RANGE STRING ---
    const getDateRangeString = () => {
        const d = new Date(filterDate);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };

        switch (selectedReportType) {
            case 'DAILY_REPORT':
            case 'LATE_REPORT':
            case 'BREAK_LOG':
                return d.toLocaleDateString('en-US', options);
            case 'WEEKLY_SUMMARY':
                const weekEnd = new Date(d);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return `${d.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
            case 'HISTORY_30D':
                const last30 = new Date(d);
                last30.setDate(last30.getDate() - 30);
                return `${last30.toLocaleDateString('en-US', options)} - ${d.toLocaleDateString('en-US', options)}`;
            case 'MONTHLY_TRENDS':
                return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            case 'SEM_REPORT':
                return `${selectedSemester === '1ST' ? '1st' : (selectedSemester === '2ND' ? '2nd' : 'Summer')} Semester ${academicYear}-${parseInt(academicYear) + 1}`;
            case 'OVERALL_SEM':
                return `Academic Year ${academicYear}-${parseInt(academicYear) + 1}`;
            default:
                return d.toLocaleDateString('en-US', options);
        }
    };

    // --- RENDER DYNAMIC DATE FILTER ---
    const renderDateFilter = () => {
        const style = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '160px' };
        
        // A. Single Date Input (Used for Daily, Weekly Start, History End)
        if (['DAILY_REPORT', 'LATE_REPORT', 'BREAK_LOG'].includes(selectedReportType)) {
             return (
                 <div className="filter-item">
                     <label>Select Date:</label>
                     <input type="date" style={style} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
        }
        if (selectedReportType === 'WEEKLY_SUMMARY') {
             return (
                 <div className="filter-item">
                     <label>Week Starting:</label>
                     <input type="date" style={style} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
        }
        if (selectedReportType === 'HISTORY_30D') {
             return (
                 <div className="filter-item">
                     <label>Reference Date (End):</label>
                     <input type="date" style={style} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                 </div>
             );
        }

        // B. Month Picker
        if (selectedReportType === 'MONTHLY_TRENDS') {
             const monthVal = filterDate.slice(0, 7); 
             return (
                 <div className="filter-item">
                     <label>Select Month:</label>
                     <input type="month" style={style} value={monthVal} onChange={(e) => setFilterDate(e.target.value + "-01")} />
                 </div>
             );
        }

        // C. Academic Year Only (Overall Sem)
        if (selectedReportType === 'OVERALL_SEM') {
             return (
                 <div className="filter-item">
                     <label>School Year:</label>
                     <select style={style} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                         {[2023, 2024, 2025, 2026].map(y => (
                             <option key={y} value={y}>{y} - {y+1}</option>
                         ))}
                     </select>
                 </div>
             );
        }

        // D. Semester Selector (Sem Report)
        if (selectedReportType === 'SEM_REPORT') {
             return (
                 <div style={{ display: 'flex', gap: '15px' }}>
                     <div className="filter-item">
                         <label>School Year:</label>
                         <select style={style} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                             {[2023, 2024, 2025, 2026].map(y => (
                                 <option key={y} value={y}>{y} - {y+1}</option>
                             ))}
                         </select>
                     </div>
                     <div className="filter-item">
                         <label>Semester:</label>
                         <select style={style} value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                             <option value="1ST">1st Semester</option>
                             <option value="2ND">2nd Semester</option>
                             <option value="SUMMER">Summer</option>
                         </select>
                     </div>
                 </div>
             );
        }
        return null; 
    };

    // --- PDF GENERATOR ---
    const generatePDF = () => {
        // ... (PDF logic uses newly defined getDateRangeString) ...
        // 1. Get Current Report Info
        const reportObj = reportTypes.find(r => r.id === selectedReportType);

        // 2. Map Data for Report (Matching keys to headers)
        const tableInput = displayData.map(log => ({
            "Date": new Date(log.timestamp).toLocaleDateString(),
            "Time": new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            "Subject": log.mapped_subject,
            "Room": log.mapped_room || 'N/A',
            "Status": log.event_type.includes('in') ? 'PRESENT' : (log.event_type === 'system_alert' ? 'ALERT' : 'OUT'),
            "Remarks": log.remarks || '-'
        }));

        // 3. Generate PDF using Shared Utility
        import('../../utils/ReportGenerator').then(({ generateFramesPDF }) => {
            generateFramesPDF({
                title: reportObj?.label.replace(/^[a-z]\.\s/, '') || "Attendance Report", 
                type: "PERSONAL ATTENDANCE RECORD",
                category: 'personal',
                context: {
                    name: `${userProfile.first_name || userProfile.firstName} ${userProfile.last_name || userProfile.lastName}`,
                    id: userProfile.tupm_id
                },
                dateRange: getDateRangeString() 
            }, tableInput);
        });
    };

    if (loading) return <div style={{ padding: '40px' }}>Loading Records...</div>;

    return (
        <div className="attendance-history-view">

            {/* REPORT HEADER */}
            <div className="reports-header-section">
                
                {/* FLEX CONTAINER FOR ALIGNMENT */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <div className="report-selector-group" style={{ marginBottom: 0 }}>
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

                    {/* DYNAMIC DATE FILTER */}
                    <div className="dynamic-date-filter" style={{ marginTop: 0 }}>
                        {renderDateFilter()}
                    </div>
                </div>

                <div className="report-description-box" style={{marginTop: '0px'}}>
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
                                            <div style={{ fontWeight: '500' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.85em', color: '#888' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: log.mapped_subject === 'Unauthorized Entry' ? 'red' : '#333' }}>
                                            {log.mapped_subject}
                                        </td>
                                        <td>{log.mapped_room}</td>
                                        <td>
                                            <LogStatusTag
                                                text={log.event_type.includes('in') ? 'PRESENT' : (log.event_type === 'system_alert' ? 'ALERT' : 'OUT')}
                                                isPresent={log.event_type.includes('in')}
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
            </div>
        </div>
    );
};

export default AttendanceHistoryPage;