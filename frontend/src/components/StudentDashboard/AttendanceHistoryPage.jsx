import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { reportTypes, parseTimeStr, getFilteredData, getDateRangeString } from './attendanceReportConfig';
import AttendanceTableView from './AttendanceTableView';

import './AttendanceHistoryPage.css';

const AttendanceHistoryPage = () => {
    const { user: authUser } = useAuth();

    // 1. DATA STATE
    const [rawLogs, setRawLogs] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [uniqueSubjects, setUniqueSubjects] = useState([]);
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. FILTER STATE
    const [selectedReportType, setSelectedReportType] = useState('DAILY_REPORT');
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSemester, setSelectedSemester] = useState('1ST');
    const [academicYear, setAcademicYear] = useState(new Date().getFullYear());

    // --- DATA FETCH (with AbortController) ---
    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                if (!authUser) return;
                setUserProfile(authUser);

                const userId = authUser.id || authUser.user_id;

                // A. Get Schedule & Pre-process
                const schedRes = await api.get(`/api/student/schedule/${userId}`, { signal: controller.signal });
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

                // B. Get Logs & Smart Mapping
                const historyRes = await api.get(`/api/student/history/${userId}`, { signal: controller.signal });
                const rawLogData = historyRes.data || [];

                const mappedLogs = rawLogData.map(log => {
                    const t = log.timestamp.split(/[- :]/);
                    const logDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
                    const logDay = logDate.toLocaleDateString('en-US', { weekday: 'long' });
                    const logTimeMins = logDate.getHours() * 60 + logDate.getMinutes();

                    const foundClass = processedSchedule.find(cls => {
                        if (cls.day_of_week !== logDay) return false;
                        if (log.room_name && cls.room_name && log.room_name !== cls.room_name) return false;
                        return (logTimeMins >= (cls.startMins - 60) && logTimeMins <= (cls.endMins + 60));
                    });

                    return {
                        ...log,
                        mapped_subject: foundClass ? foundClass.title : (log.event_type === 'system_alert' ? 'Unauthorized Entry' : 'Unscheduled'),
                        mapped_room: log.room_name
                    };
                });

                setRawLogs(mappedLogs);
                setError(null);
            } catch (err) {
                if (err.code !== 'ERR_CANCELED') {
                    setError(err.userMessage || 'Failed to load attendance records.');
                    console.error('Error fetching attendance data:', err);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, []);

    // --- COMPUTED VALUES ---
    const displayData = getFilteredData({ rawLogs, selectedSubject, filterDate, selectedReportType, academicYear, selectedSemester });
    const currentDesc = reportTypes.find(r => r.id === selectedReportType)?.desc;
    const dateRangeString = getDateRangeString({ filterDate, selectedReportType, academicYear, selectedSemester });

    // --- RENDER DYNAMIC DATE FILTER ---
    const renderDateFilter = () => {
        const style = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '160px' };

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
        if (selectedReportType === 'OVERALL_SEM') {
            return (
                <div className="filter-item">
                    <label>School Year:</label>
                    <select style={style} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y} - {y + 1}</option>
                        ))}
                    </select>
                </div>
            );
        }
        if (selectedReportType === 'SEM_REPORT') {
            return (
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="filter-item">
                        <label>School Year:</label>
                        <select style={style} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                            {[2023, 2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y} - {y + 1}</option>
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

    if (loading) return <div style={{ padding: '40px' }}>Loading Records...</div>;
    if (error) return <div style={{ padding: '40px', color: '#C62828' }}><i className="fas fa-exclamation-circle"></i> {error}</div>;

    return (
        <div className="attendance-history-view">
            {/* REPORT HEADER */}
            <div className="reports-header-section">
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

                    <div className="dynamic-date-filter" style={{ marginTop: 0 }}>
                        {renderDateFilter()}
                    </div>
                </div>

                <div className="report-description-box" style={{ marginTop: '0px' }}>
                    <i className="fas fa-info-circle"></i>
                    <span>{currentDesc}</span>
                </div>
            </div>

            {/* TABLE + MODAL (extracted component) */}
            <AttendanceTableView
                displayData={displayData}
                uniqueSubjects={uniqueSubjects}
                selectedSubject={selectedSubject}
                onSubjectChange={setSelectedSubject}
                userProfile={userProfile}
                selectedReportType={selectedReportType}
                reportTypes={reportTypes}
                dateRangeString={dateRangeString}
            />
        </div>
    );
};

export default AttendanceHistoryPage;
