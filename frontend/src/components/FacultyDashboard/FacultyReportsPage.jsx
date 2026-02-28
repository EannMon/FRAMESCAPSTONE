import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import reportOptions from './reportConfig';
import FacultyReportModal from './FacultyReportModal';
import './FacultyReportsPage.css';

const FacultyReportsPage = () => {
    const { user: authUser } = useAuth();

    // --- DATA & FILTER STATES ---
    const [classLogs, setClassLogs] = useState([]);
    const [personalLogs, setPersonalLogs] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReportId, setSelectedReportId] = useState('CLASS_MONTHLY');
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [selectedSection, setSelectedSection] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [validationError, setValidationError] = useState('');

    const currentReport = reportOptions.find(r => r.id === selectedReportId);
    const isPersonal = currentReport?.type === 'PERSONAL';

    // --- FETCH DATA ---
    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            if (!authUser) { setLoading(false); return; }
            const userId = authUser.id || authUser.user_id;
            try {
                const [classRes, personalRes, subjectRes] = await Promise.all([
                    api.get(`/api/faculty/reports/class-logs/${userId}`, { signal: controller.signal }),
                    api.get(`/api/faculty/reports/personal-logs/${userId}`, { signal: controller.signal }),
                    api.get(`/api/faculty/reports/subjects/${userId}`, { signal: controller.signal }),
                ]);
                setClassLogs(classRes.data);
                setPersonalLogs(personalRes.data);
                setSubjects(subjectRes.data);
            } catch (error) {
                if (error.code === 'ERR_CANCELED') return;
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        return () => controller.abort();
    }, [authUser]);

    // --- FILTER & DISPLAY DATA ---
    const getDisplayData = () => {
        let data = isPersonal ? [...personalLogs] : [...classLogs];
        // Subject filter (class reports only)
        if (!isPersonal && selectedSubject !== 'All') {
            data = data.filter(d => d.subjectCode === selectedSubject);
        }
        // Section filter (class reports only)
        if (!isPersonal && selectedSection !== 'All') {
            data = data.filter(d => d.col2 === selectedSection);
        }
        // Status filter
        if (statusFilter !== 'All') {
            if (statusFilter === 'Issues') {
                data = data.filter(d => ['Late', 'Absent', 'Alert', 'Security'].includes(d.status));
            } else if (statusFilter === 'Present') {
                data = data.filter(d => ['Present', 'On Time'].includes(d.status));
            } else {
                data = data.filter(d => d.status === statusFilter);
            }
        }
        // Report-specific filters
        if (selectedReportId === 'UNRECOGNIZED_LOGS') return data.filter(d => d.status === 'Security');
        if (selectedReportId === 'CLASS_LATE' || selectedReportId === 'INSTRUCTOR_DELAY') return data.filter(d => d.status === 'Late');

        return data;
    };
    const displayData = getDisplayData();

    const handleGenerateClick = () => {
        setValidationError('');
        if (['PERSONAL_DAILY', 'CLASS_LATE'].includes(selectedReportId) && !dateFilter) {
            setValidationError('Please select a specific date for this report type.');
            return;
        }
        if (selectedReportId.includes('MONTHLY') && !monthFilter) {
            setValidationError('Please select a month for the monthly report.');
            return;
        }
        setShowModal(true);
    };
    const handleConfirmGeneration = (format) => {
        if (format === 'PDF') handleDownloadPDF();
        else if (format === 'CSV') handleDownloadCSV();
        setShowModal(false);
    };

    // Build table row objects for export (reused by PDF and CSV)
    const buildTableRows = (forCsv = false) => displayData.map(row => {
        if (isPersonal) {
            return forCsv
                ? { "Date": row.col1, "Subject_Room": row.col2, "Status": row.status.toUpperCase(), "Time_In": row.col3, "Remarks": row.remarks }
                : { "Date": row.col1, "Subject/Room": row.col2, "Status": row.status.toUpperCase(), "Time In": row.col3, "Remarks": row.remarks };
        }
        return forCsv
            ? { "Student_Name": row.col1, "Section": row.col2, "Status": row.status.toUpperCase(), "Time_In_Out": row.col3, "Remarks": row.remarks }
            : { "Student Name": row.col1, "Section": row.col2, "Status": row.status.toUpperCase(), "Time In/Out": row.col3, "Remarks": row.remarks };
    });

    const handleDownloadPDF = () => {
        import('../../utils/ReportGenerator').then(({ generateFramesPDF }) => {
            generateFramesPDF({
                title: currentReport.label,
                type: isPersonal ? "PERSONAL FACULTY REPORT" : "CLASS MONITORING REPORT",
                category: isPersonal ? 'personal' : 'class',
                context: isPersonal
                    ? { name: `${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || "Faculty User", id: "FAC-SELF" }
                    : { classCode: selectedSubject, section: selectedSection === 'All' ? 'All Sections' : selectedSection },
                dateRange: dateFilter || monthFilter || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }, buildTableRows());
        });
    };
    const handleDownloadCSV = () => {
        import('../../utils/ReportGenerator').then(({ generateCSV }) => {
            generateCSV({ title: currentReport.label }, buildTableRows(true));
        });
    };

    const uniqueSections = [...new Set(classLogs.map(d => d.col2).filter(Boolean))];
    if (loading) return <div className="loading">Loading report data...</div>;

    return (
        <div className="fac-reports-container fade-in">
            {/* HEADER & CONTROLS */}
            <div className="fac-reports-header">
                {/* LEFT COLUMN */}
                <div className="fac-control-column">
                    <div className="fac-input-group">
                        <label>Select Report Type</label>
                        <select className="fac-select" value={selectedReportId} onChange={(e) => setSelectedReportId(e.target.value)}>
                            <optgroup label="Class Specific Reports (Students)">
                                {reportOptions.filter(r => r.type === 'CLASS').map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Personal Faculty Reports (Self)">
                                {reportOptions.filter(r => r.type === 'PERSONAL').map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {!isPersonal && (
                        <div className="fac-input-group">
                            <label>Filter Subject</label>
                            <select className="fac-select" style={{ width: '100%' }} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                                <option value="All">All Subjects</option>
                                {subjects.map(s => (
                                    <option key={s.code} value={s.code}>{s.code} - {s.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="fac-input-group">
                        <label>Date Selection <span style={{ color: 'red' }}>*</span></label>
                        {selectedReportId.includes('MONTHLY') || selectedReportId.includes('SEM') ? (
                            <input type="month" className="fac-select" style={{ width: '100%' }} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                        ) : (
                            <input type="date" className="fac-select" style={{ width: '100%' }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                        )}
                    </div>

                    {isPersonal && (
                        <div className="fac-input-group">
                            <label>Status Category</label>
                            <select className="fac-select" style={{ width: '100%' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="All">All Statuses</option>
                                <option value="Present">Present / On Time</option>
                                <option value="Issues">Issues Only (Late/Absent/Alert)</option>
                                <option value="Late">Late Only</option>
                                <option value="Absent">Absent Only</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="fac-control-column-right">
                    <div className="fac-report-info-compact">
                        <div className="info-header-row">
                            <i className={`fas ${isPersonal ? 'fa-user-lock' : 'fa-chalkboard-teacher'}`}></i>
                            <h4>{currentReport.label}</h4>
                        </div>
                        <p>{currentReport.desc}</p>
                        {isPersonal ? (
                            <span className="personal-tag"><i className="fas fa-lock"></i> Private Faculty Record</span>
                        ) : (
                            <span className="class-tag"><i className="fas fa-users"></i> Class Monitoring</span>
                        )}
                    </div>

                    {!isPersonal && (
                        <div className="fac-secondary-filters">
                            <div className="fac-input-group">
                                <label>Section / Group</label>
                                <select className="fac-select" style={{ width: '100%' }} value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                                    <option value="All">All Sections</option>
                                    {uniqueSections.map(sec => (
                                        <option key={sec} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="fac-input-group">
                                <label>Status Category</label>
                                <select className="fac-select" style={{ width: '100%' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="All">All Statuses</option>
                                    <option value="Present">Present / On Time</option>
                                    <option value="Issues">Issues Only (Late/Absent/Alert)</option>
                                    <option value="Late">Late Only</option>
                                    <option value="Absent">Absent Only</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {validationError && (
                    <div className="validation-error" style={{ width: '100%', marginTop: '10px' }}>
                        <i className="fas fa-exclamation-circle"></i> {validationError}
                    </div>
                )}
            </div>

            {/* DATA TABLE */}
            <div className="fac-table-card">
                <div className="fac-card-header">
                    <h3>{isPersonal ? "My Personal Logs" : `Student List: ${selectedSubject === 'All' ? 'All Subjects' : selectedSubject}`}</h3>
                    <button className="btn-export" onClick={handleGenerateClick}>
                        <i className="fas fa-file-pdf"></i> Generate Official Report
                    </button>
                </div>
                <div className="fac-table-wrapper">
                    <table className="fac-table">
                        <thead>
                            {isPersonal ? (
                                <tr><th>Date</th><th>Subject / Room</th><th>Status</th><th>Time In</th><th>Details / Delay</th></tr>
                            ) : (
                                <tr><th>Student Name</th><th>Section</th><th>Status</th><th>Time In / Out</th><th>Remarks</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {displayData.length > 0 ? (
                                displayData.map((row, index) => (
                                    <tr key={row.id || index}>
                                        <td><div style={{ fontWeight: 'bold' }}>{row.col1}</div></td>
                                        <td>{row.col2}</td>
                                        <td>
                                            <span className={`status-pill ${row.status === 'Late' ? 'late' : row.status === 'Absent' ? 'absent' : row.status === 'Alert' || row.status === 'Security' ? 'alert' : 'present'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td>{row.col3}</td>
                                        <td className="remarks-text">{row.remarks}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                        No data available for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIRMATION MODAL */}
            <FacultyReportModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onGenerate={handleConfirmGeneration}
                reportTitle={currentReport.label}
                scope={isPersonal ? 'My Personal Logs' : selectedSubject}
                dateRange={dateFilter || monthFilter || "All Time"}
                filters={`${selectedSection !== 'All' ? selectedSection : 'All Sections'}, ${statusFilter !== 'All' ? statusFilter : 'All Statuses'}`}
            />
        </div>
    );
};

export default FacultyReportsPage;
