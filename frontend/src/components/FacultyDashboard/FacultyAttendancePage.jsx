import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../Common/ToastProvider';
import { generateFramesPDF } from '../../utils/ReportGenerator';
import '../StudentDashboard/AttendanceHistoryPage.css'; // Inheriting Student style

const FacultyAttendancePage = () => {
    const toast = useToast();
    // --- STATES ---
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // --- DATA STATES ---
    const [myClasses, setMyClasses] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [user, setUser] = useState(null);

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSchedule(parsedUser.user_id || parsedUser.id);
        }
    }, []);

    // --- 2. FETCH SCHEDULE (API) ---
    const fetchSchedule = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/schedule/${userId}`);
            setMyClasses(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading schedule:", error);
            setLoading(false);
        }
    };

    // --- 3. FETCH CLASS DETAILS (API) ---
    const handleClassChange = async (e) => {
        const clsId = e.target.value;
        setSelectedClassId(clsId);

        if (!clsId) {
            setSelectedClass(null);
            setStudentList([]);
            return;
        }

        const cls = myClasses.find(c => c.id.toString() === clsId);
        setSelectedClass(cls);
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/faculty/class-details/${clsId}`);
            setStudentList(response.data);
        } catch (error) {
            console.error("Error loading students:", error);
            toast.error("Could not load student list.");
        } finally {
            setLoading(false);
        }
    };

    // Export Single Class Report (FRAMES Template)
    const handleClassExport = () => {
        if (!selectedClass) return;
        const reportInfo = {
            title: `${selectedClass.subject_title} Attendance`,
            type: "CLASS ATTENDANCE REPORT",
            category: 'class',
            context: {
                classCode: selectedClass.subject_code,
                section: selectedClass.section
            },
            dateRange: new Date().toLocaleDateString()
        };

        const tableData = studentList.map(s => ({
            "Student Name": `${s.lastName}, ${s.firstName}`,
            "ID Number": s.tupm_id,
            "Time In": s.timeIn,
            "Status": s.status,
            "Remarks": s.remarks || ""
        }));

        generateFramesPDF(reportInfo, tableData);
    };


    if (!user) return <div className="loading">Please log in.</div>;

    return (
        <div className="attendance-history-view">
            {/* REPORT HEADER */}
            <div className="reports-header-section">

                {/* FLEX CONTAINER FOR ALIGNMENT */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '10px', width: '100%' }}>
                    <div className="report-selector-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label>Select Class Section:</label>
                        <select
                            className="app-select big-select"
                            value={selectedClassId}
                            onChange={handleClassChange}
                        >
                            <option value="">-- Choose a Class --</option>
                            {myClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.subject_title} ({cls.subject_code}) - {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedClass && (
                        <div className="dynamic-date-filter" style={{ marginTop: 0 }}>
                            <div className="filter-item">
                                <label>Search Student:</label>
                                <input
                                    type="text"
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '200px' }}
                                    placeholder="Search name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="report-description-box" style={{ marginTop: '0px' }}>
                    <i className="fas fa-users"></i>
                    <span>{selectedClass ? `Viewing today's attendance for ${selectedClass.subject_title} (${selectedClass.section}).` : "Select a class from the dropdown to view the enrolled students and their attendance status for today's session."}</span>
                </div>
            </div>

            {/* TABLE CARD */}
            {selectedClass && (
                <div className="card recent-reports-card">
                    <div className="recent-reports-header">
                        <h3>Class Attendance List</h3>

                        <div className="recent-reports-filters">
                            <button className="export-all-button" onClick={handleClassExport}>
                                <i className="fas fa-file-pdf"></i> Download Class Report
                            </button>
                        </div>
                    </div>

                    <div className="reports-table-container">
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>Loading Students...</div>
                        ) : (
                            <table className="recent-reports-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>ID Number</th>
                                        <th>Time In</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentList
                                        .filter(s =>
                                            s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            s.firstName.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((student) => (
                                            <tr key={student.user_id}>
                                                <td style={{ fontWeight: '600', color: '#333' }}>{student.lastName}, {student.firstName}</td>
                                                <td style={{ color: '#666' }}>{student.tupm_id}</td>
                                                <td>{student.timeIn}</td>
                                                <td>
                                                    <span className={`log-status-tag ${student.status === 'Present' ? 'green' : 'red'}`}>
                                                        {student.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#555' }}>{student.remarks || '-'}</td>
                                            </tr>
                                        ))}
                                    {studentList.length === 0 && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No students found in this class.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {!selectedClass && myClasses.length > 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                    <i className="fas fa-chalkboard-teacher" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '15px' }}></i>
                    <p>Please select a class from the dropdown menu to manage its attendance.</p>
                </div>
            )}
        </div>
    );
};

export default FacultyAttendancePage;