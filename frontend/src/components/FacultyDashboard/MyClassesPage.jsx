import React from 'react';
import './MyClassesPage.css';

const FacultyMyClassesPage = () => {

    const facultyMockClasses = [
        { id: 1, name: "Computer Science 101", code: "CS101", students: 32, room: "A-205", time: "09:00 AM", attendanceRate: 94 },
        { id: 2, name: "Data Structures", code: "CS201", students: 28, room: "B-301", time: "11:00 AM", attendanceRate: 89 },
        { id: 3, name: "Algorithms", code: "CS301", students: 25, room: "A-205", time: "02:00 PM", attendanceRate: 91 },
        { id: 4, name: "Software Engineering", code: "CS401", students: 30, room: "C-102", time: "04:00 PM", attendanceRate: 92 },
    ];

    const getAttendanceColor = (rate) => {
        if (rate >= 90) return "green";
        if (rate >= 80) return "orange";
        return "red";
    };

    return (
        <div className="faculty-my-classes-container">
            
            <div className="faculty-classes-grid">
                {facultyMockClasses.map((cls) => (
                    <div key={cls.id} className="card faculty-class-card">
                        <div className="faculty-class-header">
                            <h3>{cls.name}</h3>
                            <button className="faculty-class-options-btn">
                                <i className="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                        <div className="faculty-class-code-wrapper">
                           <div className="faculty-class-code">{cls.code}</div>
                        </div>
                        
                        <div className="faculty-class-details">
                            <div className="faculty-class-detail-item">
                                <i className="fas fa-users"></i>
                                <span>{cls.students} students enrolled</span>
                            </div>
                            <div className="faculty-class-detail-item">
                                <i className="fas fa-calendar-alt"></i>
                                <span>Mon, Wed, Fri - {cls.time}</span>
                            </div>
                            <div className="faculty-class-detail-item">
                                <i className="fas fa-door-open"></i>
                                <span>{cls.room}</span>
                            </div>
                        </div>

                        <div className="faculty-class-attendance-summary">
                            <div className="faculty-attendance-label">Avg. Attendance</div>
                            <div className={`faculty-attendance-percentage ${getAttendanceColor(cls.attendanceRate)}`}>
                                {cls.attendanceRate}%
                            </div>
                        </div>

                        <button className="faculty-take-attendance-btn">
                            <i className="fas fa-user-check"></i> Take Attendance
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FacultyMyClassesPage;