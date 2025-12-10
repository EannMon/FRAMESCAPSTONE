import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DeptHeadManagePage.css';

const DeptHeadManagePage = () => {
    // --- STATE MANAGEMENT ---
    const [department] = useState("College of Science (COS)"); // Fixed Department
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    
    // Form States
    const [newCourse, setNewCourse] = useState({
        code: '', name: '', units: 3, type: 'Lecture', category: 'Major'
    });

    // --- MOCK DATA (DATABASE) ---
    const [courses, setCourses] = useState([
        { id: 1, code: 'IT 321', name: 'Information Assurance', units: 3, type: 'Lecture', category: 'Major', assignedTo: 'Mr. Juan Cruz' },
        { id: 2, code: 'MATH 1', name: 'Calculus 1', units: 5, type: 'Lecture', category: 'Math', assignedTo: null },
        { id: 3, code: 'GE 4', name: 'Mathematics in Modern World', units: 3, type: 'Lecture', category: 'GenEd', assignedTo: 'Ms. Ana Santos' },
    ]);

    const [facultyList] = useState([
        { id: 101, name: 'Mr. Juan Cruz', status: 'Active' },
        { id: 102, name: 'Ms. Ana Santos', status: 'Active' },
        { id: 103, name: 'Sir. Benigno Aquino', status: 'Active' },
        { id: 104, name: 'Ms. Clara Oswald', status: 'On Leave' },
    ]);

    const [logs, setLogs] = useState([
        { time: '10:00 AM', action: 'System initialized', user: 'System' },
        { time: '10:05 AM', action: 'Created course IT 321', user: 'You' },
    ]);

    // --- FUNCTIONS ---

    // 1. Add Log Helper
    const addLog = (action) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLogs(prev => [{ time, action, user: 'You' }, ...prev]);
    };

    // 2. Create Course
    const handleCreateCourse = (e) => {
        e.preventDefault();
        const courseObj = { ...newCourse, id: Date.now(), assignedTo: null };
        setCourses([...courses, courseObj]);
        addLog(`Created new course: ${newCourse.code}`);
        setShowCreateModal(false);
        setNewCourse({ code: '', name: '', units: 3, type: 'Lecture', category: 'Major' }); // Reset
    };

    // 3. Open Assign Modal
    const openAssignModal = (courseId) => {
        setSelectedCourseId(courseId);
        setShowAssignModal(true);
    };

    // 4. Assign Teacher
    const handleAssignTeacher = (teacherName) => {
        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourseId) {
                return { ...course, assignedTo: teacherName };
            }
            return course;
        });
        setCourses(updatedCourses);
        const courseCode = courses.find(c => c.id === selectedCourseId).code;
        addLog(`Assigned ${teacherName} to ${courseCode}`);
        setShowAssignModal(false);
    };

    // 5. Delete Course (With Confirmation)
    const handleDeleteCourse = (id, code) => {
        if (window.confirm(`Are you sure you want to DELETE course ${code}? This cannot be undone.`)) {
            setCourses(courses.filter(c => c.id !== id));
            addLog(`Deleted course: ${code}`);
        }
    };

    // 6. Generate PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Department Course List: ${department}`, 14, 20);
        
        const tableColumn = ["Code", "Description", "Units", "Type", "Category", "Instructor"];
        const tableRows = [];

        courses.forEach(course => {
            const courseData = [
                course.code,
                course.name,
                course.units,
                course.type,
                course.category,
                course.assignedTo || "Unassigned"
            ];
            tableRows.push(courseData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [166, 37, 37] }
        });

        doc.save('Dept_Course_List.pdf');
    };

    return (
        <div className="dept-mgmt-container">
            {/* --- HEADER --- */}
            <div className="mgmt-header">
                <div>
                    <h2>Course Management</h2>
                    <span className="dept-badge"><i className="fas fa-building"></i> {department}</span>
                </div>
                <div className="header-actions">
                    <button className="mgmt-btn outline" onClick={handleDownloadPDF}>
                        <i className="fas fa-file-pdf"></i> Download List
                    </button>
                    <button className="mgmt-btn primary" onClick={() => setShowCreateModal(true)}>
                        <i className="fas fa-plus"></i> Create New Course
                    </button>
                </div>
            </div>

            <div className="mgmt-layout">
                {/* --- LEFT: COURSE LIST --- */}
                <div className="course-list-section card">
                    <h3>All Courses ({courses.length})</h3>
                    <div className="table-responsive">
                        <table className="mgmt-table">
                            <thead>
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th>Assigned Faculty</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(course => (
                                    <tr key={course.id}>
                                        <td><span className="code-pill">{course.code}</span></td>
                                        <td>
                                            <div className="course-desc">{course.name}</div>
                                            <small className="course-cat">{course.category} • {course.units} Units</small>
                                        </td>
                                        <td>{course.type}</td>
                                        <td>
                                            {course.assignedTo ? (
                                                <div className="assigned-pill">
                                                    <i className="fas fa-user-check"></i> {course.assignedTo}
                                                </div>
                                            ) : (
                                                <span className="unassigned-text">No Instructor</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-row">
                                                <button 
                                                    className="icon-action assign" 
                                                    title="Assign Faculty"
                                                    onClick={() => openAssignModal(course.id)}
                                                >
                                                    <i className="fas fa-user-plus"></i>
                                                </button>
                                                <button 
                                                    className="icon-action delete" 
                                                    title="Delete Course"
                                                    onClick={() => handleDeleteCourse(course.id, course.code)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- RIGHT: ACTIVITY LOGS --- */}
                <div className="logs-section card">
                    <h3>Recent Activity</h3>
                    <div className="logs-list">
                        {logs.map((log, index) => (
                            <div key={index} className="log-item">
                                <div className="log-icon">
                                    <i className="fas fa-history"></i>
                                </div>
                                <div className="log-details">
                                    <span className="log-action">{log.action}</span>
                                    <span className="log-meta">{log.time} • By {log.user}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MODAL 1: CREATE COURSE --- */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3>Add New Course Curriculum</h3>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group">
                                <label>Subject Code</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. ITE 001" 
                                    value={newCourse.code}
                                    onChange={e => setNewCourse({...newCourse, code: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Descriptive Title</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Introduction to Computing" 
                                    value={newCourse.name}
                                    onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Units</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={newCourse.units}
                                        onChange={e => setNewCourse({...newCourse, units: e.target.value})}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Type</label>
                                    <select 
                                        value={newCourse.type}
                                        onChange={e => setNewCourse({...newCourse, type: e.target.value})}
                                    >
                                        <option>Lecture</option>
                                        <option>Laboratory</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Classification</label>
                                <select 
                                    value={newCourse.category}
                                    onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                                >
                                    <option>Major</option>
                                    <option>Minor</option>
                                    <option>GenEd</option>
                                    <option>Math</option>
                                    <option>Science</option>
                                    <option>PE / NSTP</option>
                                </select>
                            </div>
                            <button type="submit" className="submit-btn full">Add to Curriculum</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: ASSIGN FACULTY --- */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3>Select Faculty Instructor</h3>
                            <button className="close-btn" onClick={() => setShowAssignModal(false)}>&times;</button>
                        </div>
                        <div className="faculty-select-list">
                            {facultyList.map(faculty => (
                                <button 
                                    key={faculty.id} 
                                    className="faculty-option-btn"
                                    onClick={() => handleAssignTeacher(faculty.name)}
                                >
                                    <div className="fac-avatar">{faculty.name.charAt(0)}</div>
                                    <div className="fac-info">
                                        <span className="fac-name">{faculty.name}</span>
                                        <span className={`fac-status ${faculty.status === 'Active' ? 'green' : 'red'}`}>
                                            {faculty.status}
                                        </span>
                                    </div>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeptHeadManagePage;