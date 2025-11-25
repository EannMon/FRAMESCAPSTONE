// Attendance.jsx - Attendance Management Page Component
import React from 'react';
import './FacultyAttendancePage.css';

const FacultyAttendancePage = () => {
    return (
        <div className="attendance-management">
            {/* Header */}
            <div className="attendance-header">
                <div className="attendance-actions">
                    <button className="schedule-button view-button">
                        <i className="fas fa-file-export"></i> Export Report
                    </button>
                    <button className="schedule-button monitor-button">
                        <i className="fas fa-user-check"></i> Take Attendance
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="attendance-stats-grid">
                <div className="attendance-stat-card">
                    <div className="stat-label">Today</div>
                    <div className="stat-value green">94%</div>
                    <div className="stat-sub">Yesterday</div>
                </div>
                <div className="attendance-stat-card">
                    <div className="stat-label">Total Classes</div>
                    <div className="stat-value">156</div>
                    <div className="stat-sub">This Semester</div>
                </div>
                <div className="attendance-stat-card">
                    <div className="stat-label">Absent Today</div>
                    <div className="stat-value red">12</div>
                    <div className="stat-sub">Students</div>
                </div>
                <div className="attendance-stat-card">
                    <div className="stat-label">Alerts</div>
                    <div className="stat-value orange">8</div>
                    <div className="stat-sub">Low Attendance</div>
                </div>
                <div className="attendance-stat-card">
                    <div className="stat-label">Unread Alerts</div>
                    <div className="stat-value">4</div>
                    <div className="stat-sub">Pending</div>
                </div>
            </div>

            {/* Today's Classes */}
            <div className="card">
                <h3>Today&apos;s Classes</h3>
                <div className="today-classes-list">
                    <div className="today-class-item">
                        <div className="class-info">
                            <h4>Computer Science 101</h4>
                            <p>09:00 - 10:30 • Room A-205</p>
                        </div>
                        <div className="class-attendance-rate">95%</div>
                        <div className="attendance-progress">
                            <div className="progress-bar" style={{width: '95%'}}></div>
                        </div>
                        <div className="class-actions">
                            <button className="action-btn">
                                <i className="fas fa-eye"></i> View Details
                            </button>
                            <button className="action-btn">
                                <i className="fas fa-edit"></i> Edit
                            </button>
                            <button className="action-btn">
                                <i className="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>

                    <div className="today-class-item">
                        <div className="class-info">
                            <h4>Data Structures</h4>
                            <p>11:00 - 12:30 • Room B-301</p>
                        </div>
                        <div className="class-attendance-rate">90%</div>
                        <div className="attendance-progress">
                            <div className="progress-bar" style={{width: '90%'}}></div>
                        </div>
                        <div className="class-actions">
                            <button className="action-btn">
                                <i className="fas fa-eye"></i> View Details
                            </button>
                            <button className="action-btn">
                                <i className="fas fa-edit"></i> Edit
                            </button>
                            <button className="action-btn">
                                <i className="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>

                    <div className="today-class-item upcoming">
                        <div className="class-info">
                            <h4>Algorithms</h4>
                            <p>02:00 - 03:30 • Room A-205</p>
                        </div>
                        <button className="take-attendance-btn">
                            <i className="fas fa-user-check"></i> Take Attendance
                        </button>
                    </div>

                    <div className="today-class-item upcoming">
                        <div className="class-info">
                            <h4>Software Engineering</h4>
                            <p>04:00 - 05:30 • Lab C-102</p>
                        </div>
                        <button className="take-attendance-btn">
                            <i className="fas fa-user-check"></i> Take Attendance
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Attendance History Table */}
            <div className="card">
                <h3>Recent Attendance History</h3>
                <div className="attendance-table-wrapper">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Classes</th>
                                <th>Time</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Today</td>
                                <td>Computer Science 101</td>
                                <td>09:00 AM</td>
                                <td>30</td>
                                <td>2</td>
                                <td><span className="rate-badge green">94%</span></td>
                                <td><button className="icon-btn"><i className="fas fa-chevron-right"></i></button></td>
                            </tr>
                            <tr>
                                <td>Nov 13</td>
                                <td>Data Structures</td>
                                <td>11:00 AM</td>
                                <td>26</td>
                                <td>2</td>
                                <td><span className="rate-badge green">93%</span></td>
                                <td><button className="icon-btn"><i className="fas fa-chevron-right"></i></button></td>
                            </tr>
                            <tr>
                                <td>Nov 13</td>
                                <td>Computer Science 101</td>
                                <td>02:00 PM</td>
                                <td>29</td>
                                <td>3</td>
                                <td><span className="rate-badge green">91%</span></td>
                                <td><button className="icon-btn"><i className="fas fa-chevron-right"></i></button></td>
                            </tr>
                            <tr>
                                <td>Nov 12</td>
                                <td>Algorithms</td>
                                <td>02:00 PM</td>
                                <td>22</td>
                                <td>3</td>
                                <td><span className="rate-badge orange">88%</span></td>
                                <td><button className="icon-btn"><i className="fas fa-chevron-right"></i></button></td>
                            </tr>
                            <tr>
                                <td>Nov 12</td>
                                <td>Software Engineering</td>
                                <td>04:00 PM</td>
                                <td>28</td>
                                <td>2</td>
                                <td><span className="rate-badge green">93%</span></td>
                                <td><button className="icon-btn"><i className="fas fa-chevron-right"></i></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Section: Low Attendance & Trends */}
            <div className="attendance-bottom-grid">
                <div className="card">
                    <h3>Students with Low Attendance</h3>
                    <div className="low-attendance-list">
                        <div className="low-attendance-item">
                            <div className="student-info">
                                <div className="student-name">Sarah Williams</div>
                                <div className="student-class">Computer Science 101</div>
                            </div>
                            <div className="student-rate red">72%</div>
                        </div>
                        <div className="low-attendance-item">
                            <div className="student-info">
                                <div className="student-name">David Liu</div>
                                <div className="student-class">Data Structures</div>
                            </div>
                            <div className="student-rate red">68%</div>
                        </div>
                        <div className="low-attendance-item">
                            <div className="student-info">
                                <div className="student-name">Jessica Martinez</div>
                                <div className="student-class">Algorithms</div>
                            </div>
                            <div className="student-rate orange">75%</div>
                        </div>
                        <div className="low-attendance-item">
                            <div className="student-info">
                                <div className="student-name">Robert Chen</div>
                                <div className="student-class">Software Engineering</div>
                            </div>
                            <div className="student-rate orange">78%</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3>Attendance Trends</h3>
                    <div className="trends-list">
                        <div className="trend-item">
                            <span className="trend-label">First Hour</span>
                            <div className="trend-right">
                                <span className="trend-rate green">89%</span>
                                <button className="icon-btn"><i className="fas fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div className="trend-item">
                            <span className="trend-label">Last Hour</span>
                            <div className="trend-right">
                                <span className="trend-rate orange">82%</span>
                                <button className="icon-btn"><i className="fas fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div className="trend-item">
                            <span className="trend-label">Tuesdays</span>
                            <div className="trend-right">
                                <span className="trend-rate green">86%</span>
                                <button className="icon-btn"><i className="fas fa-chevron-right"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyAttendancePage;