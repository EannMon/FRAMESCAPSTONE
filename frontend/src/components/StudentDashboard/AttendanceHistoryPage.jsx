import React, { useState, useEffect } from 'react';
import './AttendanceHistoryPage.css';

// Component for the top summary cards
const SummaryCard = ({ value, title, subtitle, colorClass }) => (
    <div className={`card attendance-summary-card`}>
        <div className={`summary-value ${colorClass}`}>{value}</div>
        <div className="summary-title">{title}</div>
        {subtitle && <div className={`summary-subtitle ${colorClass}`}>{subtitle}</div>}
    </div>
);

// Component for a single course row
const CourseAttendanceItem = ({ title, code, attended, total, percentage, barColor, onCourseClick }) => {
    const handleClick = () => onCourseClick?.(code);

    return (
        <div 
            className="course-attendance-item clickable-course" 
            onClick={handleClick}
            role="button" 
            tabIndex={0} 
        >
            <div className="course-details">
                <span className="course-title">{title}</span>
                <span className="course-meta">{code} • {attended}/{total} classes</span>
            </div>
            <div className="attendance-bar-container">
                <div 
                    className="attendance-bar" 
                    style={{ width: `${percentage}%`, backgroundColor: barColor }}
                ></div>
            </div>
            <div className="attendance-percentage" style={{ color: barColor }}>{percentage}%</div>
        </div>
    );
};

// Modal component for detailed attendance
const AttendanceModal = ({ subject, attendanceData, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{subject} - Attendance Details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attendanceData.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.date}</td>
                            <td style={{ color: item.status === "Present" ? "#28a745" : "#dc3545" }}>
                                {item.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="close-modal-btn" onClick={onClose}>Close</button>
        </div>
    </div>
);

const AttendanceHistoryPage = () => {
    const [selectedSemester, setSelectedSemester] = useState("This Semester");
    const [selectedReportType, setSelectedReportType] = useState("OVERALL_SUMMARY"); 
    const [selectedSubject, setSelectedSubject] = useState("ALL_SUBJECTS"); 
    const [modalSubject, setModalSubject] = useState(null);

    const reportOptions = [
        { label: "Overall Semestral Summary (All Subjects)", value: "OVERALL_SUMMARY", requiresSubject: false },
        { label: "Personal Attendance Records", value: "PERSONAL_RECORDS", requiresSubject: false },
        { label: "Daily Attendance Report (Per Subject)", value: "DAILY_REPORT_SUBJECT", requiresSubject: true },
        { label: "Weekly Attendance Summary (Per Subject)", value: "WEEKLY_SUMMARY_SUBJECT", requiresSubject: true },
        { label: "Semestral Attendance Report (Per Subject)", value: "SEM_REPORT_SUBJECT", requiresSubject: true },
        { label: "Monthly Attendance Trends", value: "MONTHLY_TRENDS", requiresSubject: false },
        { label: "Attendance History Log (30 Days Validity)", value: "HISTORY_LOG_30D", requiresSubject: false },
        { label: "Personal Late Arrival Report", value: "LATE_ARRIVAL_REPORT", requiresSubject: false },
        { label: "Break Duration Log", value: "BREAK_LOG", requiresSubject: false },
        { label: "Personal Consistency Index (Smart Insight)", value: "CONSISTENCY_INDEX", requiresSubject: false },
    ];

    const showSubjectSelect = reportOptions.find(opt => opt.value === selectedReportType)?.requiresSubject;

    const courseData = [
        { title: "Computer Science 101", code: "CS101", attended: 28, total: 30, percentage: 93, barColor: "#4CAF50" }, 
        { title: "Mathematics", code: "MATH201", attended: 25, total: 28, percentage: 89, barColor: "#FFC107" }, 
        { title: "Physics Lab", code: "PHYS301", attended: 22, total: 26, percentage: 85, barColor: "#FFC107" }, 
        { title: "English Literature", code: "ENG101", attended: 24, total: 26, percentage: 92, barColor: "#4CAF50" }, 
        { title: "Data Structures", code: "CS201", attended: 20, total: 24, percentage: 83, barColor: "#FFC107" }, 
        { title: "Chemistry", code: "CHEM101", attended: 18, total: 22, percentage: 82, barColor: "#FFC107" },
        { title: "Physical Education", code: "PE101", attended: 10, total: 20, percentage: 50, barColor: "#dc3545" },
    ];

    useEffect(() => {
        if (showSubjectSelect && selectedSubject === "ALL_SUBJECTS" && courseData.length > 0) {
            setSelectedSubject(courseData[0].code);
        } else if (!showSubjectSelect) {
            setSelectedSubject("ALL_SUBJECTS");
        }
    }, [selectedReportType, showSubjectSelect, selectedSubject, courseData]);

    const handleExportReport = () => {
        const reportLabel = reportOptions.find(opt => opt.value === selectedReportType).label;
        const subjectName = selectedSubject !== "ALL_SUBJECTS" 
            ? courseData.find(course => course.code === selectedSubject)?.title || selectedSubject
            : 'All Subjects';
        alert(`Requesting report: ${reportLabel} for ${selectedSemester}${showSubjectSelect ? ', Subject: ' + subjectName : ''}`);
    };

    const handleCourseDrilldown = (courseCode) => {
        const course = courseData.find(c => c.code === courseCode);
        if (course) setModalSubject(course.title);
    };

    const closeModal = () => setModalSubject(null);

    const overallStats = {
        percentage: 89,
        attended: 127,
        total: 143,
        absences: 16,
        excused: 3
    };

    // Dummy detailed attendance for modal (can be replaced with API)
    const attendanceDetails = [
        { date: "Nov 17", status: "Present" },
        { date: "Nov 18", status: "Absent" },
        { date: "Nov 19", status: "Present" },
        { date: "Nov 20", status: "Present" },
        { date: "Nov 21", status: "Absent" },
    ];

    const isGenerateDisabled = showSubjectSelect && selectedSubject === "ALL_SUBJECTS";

    return (
        <div className="attendance-history-view">
            <div className="report-controls-row">
                <div className="report-filters">
                    <select 
                        className="app-select semester-select" 
                        value={selectedSemester} 
                        onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                        <option value="This Semester">This Semester</option>
                        <option value="Last Semester">Last Semester</option>
                    </select>

                    <select 
                        className="app-select report-type-select" 
                        value={selectedReportType} 
                        onChange={(e) => setSelectedReportType(e.target.value)}
                    >
                        {reportOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {showSubjectSelect && (
                        <select 
                            className="app-select subject-select" 
                            value={selectedSubject} 
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="ALL_SUBJECTS" disabled>Select Subject...</option>
                            {courseData.map(course => (
                                <option key={course.code} value={course.code}>
                                    {course.title} ({course.code})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <button className="export-button" onClick={handleExportReport} disabled={isGenerateDisabled}>
                    <i className="fas fa-file-export"></i> Generate Report
                </button>
            </div>

            <div className="attendance-summary-container">
                <SummaryCard value={`${overallStats.percentage}%`} title="Overall Attendance" subtitle="Above average" colorClass="green-text" />
                <SummaryCard value={overallStats.attended} title="Classes Attended" subtitle={`Out of ${overallStats.total} total`} colorClass="blue-text" />
                <SummaryCard value={overallStats.absences} title="Absences" subtitle={`${overallStats.excused} excused`} colorClass="red-text" />
            </div>

            <div className="card course-attendance-section">
                <h3>Course-wise Attendance</h3>
                <div className="course-list">
                    {courseData.map((course, index) => (
                        <CourseAttendanceItem
                            key={index}
                            title={course.title}
                            code={course.code}
                            attended={course.attended}
                            total={course.total}
                            percentage={course.percentage}
                            barColor={course.barColor}
                            onCourseClick={handleCourseDrilldown}
                        />
                    ))}
                </div>
            </div>

            {modalSubject && (
                <AttendanceModal 
                    subject={modalSubject} 
                    attendanceData={attendanceDetails} 
                    onClose={closeModal} 
                />
            )}
        </div>
    );
};

export default AttendanceHistoryPage;