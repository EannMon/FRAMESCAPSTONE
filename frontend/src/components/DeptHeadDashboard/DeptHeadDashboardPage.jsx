import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../FacultyDashboard/FacultyDashboardPage.css'; // Reuse styles
import '../Common/Utility.css';

// New Premium "Lovable" Card Component (Matches FacultyDashboard)
const SummaryCard = ({ iconClass, title, value, subValue, iconBgClass, badge }) => (
    <div className="summary-card premium">
        <div className="summary-content-left">
            <div className="summary-title">{title}</div>
            <div className="summary-value-row">
                <span className="summary-value">{value}</span>
                {badge && <span className={`summary-badge ${badge.type}`}>{badge.text}</span>}
            </div>
            {subValue && (
                <div className="summary-sub-value">
                    {subValue}
                </div>
            )}
        </div>
        <div className={`summary-icon-container ${iconBgClass}`}>
            <i className={iconClass}></i>
        </div>
    </div>
);

const DeptHeadDashboardPage = () => {
    const [stats, setStats] = useState({
        pending_verifications: 0,
        total_faculty: 0,
        total_students: 0,
        issues_reported: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Reuse the verification list endpoint to get all user data
                const response = await axios.get('http://localhost:5000/api/admin/verification/list');
                const users = response.data || [];

                const pending = users.filter(u => u.verification_status === 'Pending').length;
                const faculty = users.filter(u => u.role === 'FACULTY').length;
                const students = users.filter(u => u.role === 'STUDENT').length;
                // Issues reported is still mock/placeholder for now
                const issues = 0;

                setStats({
                    pending_verifications: pending,
                    total_faculty: faculty,
                    total_students: students,
                    issues_reported: issues
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    return (
        <div className="faculty-content-grid">
            <div className="summary-cards-container">
                <SummaryCard
                    iconClass="fas fa-user-clock"
                    title="Pending Approvals"
                    value={stats.pending_verifications}
                    subValue="Users waiting for verification"
                    iconBgClass="f-icon-soft-orange"
                    badge={{ text: "Action Needed", type: "warning" }}
                />
                <SummaryCard
                    iconClass="fas fa-chalkboard-teacher"
                    title="Faculty Members"
                    value={stats.total_faculty}
                    subValue="Active in department"
                    iconBgClass="f-icon-soft-blue"
                />
                <SummaryCard
                    iconClass="fas fa-user-graduate"
                    title="Total Students"
                    value={stats.total_students}
                    subValue="Enrolled this semester"
                    iconBgClass="f-icon-soft-green"
                />
                <SummaryCard
                    iconClass="fas fa-exclamation-triangle"
                    title="System Issues"
                    value={stats.issues_reported}
                    subValue="Reported anomalies"
                    iconBgClass="f-icon-soft-red"
                    badge={stats.issues_reported > 0 ? { text: "Alert", type: "danger" } : null}
                />
            </div>

            <div className="dashboard-columns">
                <div className="recent-attendance card">
                    <h3>Pending User Verifications</h3>
                    <div className="recent-list-container">
                        {/* Mock List */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="recent-activity-row">
                                <div className="activity-icon">
                                    <i className="fas fa-user-plus"></i>
                                </div>
                                <div className="activity-details">
                                    <strong>New Faculty Registration</strong>
                                    <span className="activity-time">2 hours ago • Dr. New Hire</span>
                                </div>
                                <div className="activity-status">
                                    <button className="btn-sm primary">Review</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeptHeadDashboardPage;
