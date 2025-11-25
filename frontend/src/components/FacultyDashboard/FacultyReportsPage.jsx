// Reports.jsx - Reports Page Component
import React from 'react';
import './FacultyReportsPage.css';

const FacultyReportsPage = () => {
    return (
        <div className="faculty-reports-container">
            <div className="faculty-reports-header">
                <button className="faculty-schedule-button faculty-monitor-button">
                    <i className="fas fa-plus"></i> Generate New Report
                </button>
            </div>

            {/* Quick Stats */}
            <div className="faculty-reports-stats-grid">
                <div className="faculty-report-stat-card">
                    <div className="faculty-stat-icon-wrapper red">
                        <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="faculty-stat-content">
                        <div className="faculty-stat-value">24</div>
                        <div className="faculty-stat-label">Total Reports</div>
                    </div>
                </div>
                <div className="faculty-report-stat-card">
                    <div className="faculty-stat-icon-wrapper blue">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="faculty-stat-content">
                        <div className="faculty-stat-value">3</div>
                        <div className="faculty-stat-label">Pending</div>
                    </div>
                </div>
                <div className="faculty-report-stat-card">
                    <div className="faculty-stat-icon-wrapper green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="faculty-stat-content">
                        <div className="faculty-stat-value">21</div>
                        <div className="faculty-stat-label">Completed</div>
                    </div>
                </div>
                <div className="faculty-report-stat-card">
                    <div className="faculty-stat-icon-wrapper orange">
                        <i className="fas fa-download"></i>
                    </div>
                    <div className="faculty-stat-content">
                        <div className="faculty-stat-value">156</div>
                        <div className="stat-label">Downloads</div>
                    </div>
                </div>
            </div>

            {/* Report Types */}
            <div className="faculty-card">
                <h3>Generate Report</h3>
                <div className="faculty-report-types-grid">
                    <div className="faculty-report-type-card">
                        <div className="faculty-report-type-icon">
                            <i className="fas fa-users"></i>
                        </div>
                        <h4>Attendance Report</h4>
                        <p>Generate detailed attendance reports for your classes</p>
                        <button className="faculty-generate-report-btn">
                            <i className="fas fa-chart-bar"></i> Generate
                        </button>
                    </div>

                    <div className="faculty-report-type-card">
                        <div className="faculty-report-type-icon">
                            <i className="fas fa-user-graduate"></i>
                        </div>
                        <h4>Student Performance</h4>
                        <p>View individual student attendance and participation</p>
                        <button className="faculty-generate-report-btn">
                            <i className="fas fa-chart-bar"></i> Generate
                        </button>
                    </div>

                    <div className="faculty-report-type-card">
                        <div className="faculty-report-type-icon">
                            <i className="fas fa-calendar-week"></i>
                        </div>
                        <h4>Weekly Summary</h4>
                        <p>Get weekly attendance summary across all classes</p>
                        <button className="faculty-generate-report-btn">
                            <i className="fas fa-chart-bar"></i> Generate
                        </button>
                    </div>

                    <div className="faculty-report-type-card">
                        <div className="faculty-report-type-icon">
                            <i className="fas fa-file-excel"></i>
                        </div>
                        <h4>Custom Export</h4>
                        <p>Export custom data in Excel or PDF format</p>
                        <button className="faculty-generate-report-btn">
                            <i className="fas fa-chart-bar"></i> Generate
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="faculty-card">
                <h3>Recent Reports</h3>
                <div className="faculty-recent-reports-list">
                    <div className="faculty-report-item">
                        <div className="faculty-report-icon">
                            <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className="faculty-report-info">
                            <div className="faculty-report-name">CS101 Attendance - November 2024</div>
                            <div className="faculty-report-meta">Generated on Nov 15, 2024 • 2.4 MB</div>
                        </div>
                        <div className="faculty-report-actions">
                            <button className="faculty-icon-btn" title="Download">
                                <i className="fas fa-download"></i>
                            </button>
                            <button className="faculty-icon-btn" title="View">
                                <i className="fas fa-eye"></i>
                            </button>
                            <button className="faculty-icon-btn" title="Share">
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <div className="faculty-report-item">
                        <div className="faculty-report-icon">
                            <i className="fas fa-file-excel"></i>
                        </div>
                        <div className="faculty-report-info">
                            <div className="faculty-report-name">All Classes Weekly Summary</div>
                            <div className="faculty-report-meta">Generated on Nov 13, 2024 • 1.8 MB</div>
                        </div>
                        <div className="faculty-report-actions">
                            <button className="faculty-icon-btn" title="Download">
                                <i className="fas fa-download"></i>
                            </button>
                            <button className="faculty-icon-btn" title="View">
                                <i className="fas fa-eye"></i>
                            </button>
                            <button className="faculty-icon-btn" title="Share">
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <div className="faculty-report-item">
                        <div className="faculty-report-icon">
                            <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className="faculty-report-info">
                            <div className="faculty-report-name">Student Performance Analysis</div>
                            <div className="faculty-report-meta">Generated on Nov 10, 2024 • 3.1 MB</div>
                        </div>
                        <div className="faculty-report-actions">
                            <button className="faculty-icon-btn" title="Download">
                                <i className="fas fa-download"></i>
                            </button>
                            <button className="faculty-icon-btn" title="View">
                                <i className="fas fa-eye"></i>
                            </button>
                            <button className="faculty-icon-btn" title="Share">
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <div className="faculty-report-item">
                        <div className="faculty-report-icon">
                            <i className="fas fa-file-excel"></i>
                        </div>
                        <div className="faculty-report-info">
                            <div className="faculty-report-name">Data Structures Attendance</div>
                            <div className="faculty-report-meta">Generated on Nov 8, 2024 • 1.5 MB</div>
                        </div>
                        <div className="faculty-report-actions">
                            <button className="faculty-icon-btn" title="Download">
                                <i className="fas fa-download"></i>
                            </button>
                            <button className="faculty-icon-btn" title="View">
                                <i className="fas fa-eye"></i>
                            </button>
                            <button className="faculty-icon-btn" title="Share">
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <div className="faculty-report-item">
                        <div className="faculty-report-icon">
                            <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className="faculty-report-info">
                            <div className="faculty-report-name">Semester Overview Report</div>
                            <div className="faculty-report-meta">Generated on Nov 1, 2024 • 4.2 MB</div>
                        </div>
                        <div className="faculty-report-actions">
                            <button className="faculty-icon-btn" title="Download">
                                <i className="fas fa-download"></i>
                            </button>
                            <button className="faculty-icon-btn" title="View">
                                <i className="fas fa-eye"></i>
                            </button>
                            <button className="faculty-icon-btn" title="Share">
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyReportsPage;