import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../FacultyDashboard/FacultyDashboardPage.css'; // Reuse styles
import './DeptHeadDashboardPage.css'; // Specific styles
import '../Common/Utility.css';

// New Premium "Lovable" Card Component
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

const ReviewModal = ({ user, onClose, onAction }) => {
    if (!user) return null;

    return (
        <div className="v-modal-overlay" onClick={onClose}>
            <div className="v-modal-content" onClick={e => e.stopPropagation()}>
                <div className="v-modal-header">
                    <h2>Review User Registration</h2>
                    <button className="v-modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="v-modal-body">
                    <div className="v-detail-grid">
                        <span className="v-detail-label">Full Name:</span>
                        <span className="v-detail-value">{user.first_name} {user.last_name}</span>
                        
                        <span className="v-detail-label">TUPM ID:</span>
                        <span className="v-detail-value">{user.tupm_id}</span>
                        
                        <span className="v-detail-label">Email:</span>
                        <span className="v-detail-value">{user.email}</span>
                        
                        <span className="v-detail-label">Role:</span>
                        <span className="v-detail-value">{user.role}</span>
                        
                        <span className="v-detail-label">Department ID:</span>
                        <span className="v-detail-value">{user.department_id || 'N/A'}</span>
                        
                        <span className="v-detail-label">Registered:</span>
                        <span className="v-detail-value">{new Date(user.created_at).toLocaleString()}</span>
                    </div>

                    <div style={{ background: '#fef9c3', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#854d0e', border: '1px solid #fde68a' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                        Please verify the TUPM ID and role before approving this account.
                    </div>
                </div>
                <div className="v-modal-footer">
                    <button 
                        className="v-action-btn reject" 
                        onClick={() => onAction(user.id, 'reject', `${user.first_name} ${user.last_name}`)}
                    >
                        <i className="fas fa-times"></i> Reject
                    </button>
                    <button 
                        className="v-action-btn approve" 
                        onClick={() => onAction(user.id, 'approve', `${user.first_name} ${user.last_name}`)}
                    >
                        <i className="fas fa-check"></i> Approve Account
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeptHeadDashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pending_verifications: 0,
        total_faculty: 0,
        total_students: 0,
        issues_reported: 0
    });
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchData = async () => {
        setListLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/verification/list');
            const users = response.data || [];

            const pending = users.filter(u => u.verification_status === 'Pending');
            const facultyCount = users.filter(u => u.role === 'FACULTY').length;
            const studentCount = users.filter(u => u.role === 'STUDENT').length;
            
            setStats({
                pending_verifications: pending.length,
                total_faculty: facultyCount,
                total_students: studentCount,
                issues_reported: 0
            });
            setPendingUsers(pending);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (userId, action, name) => {
        const url = `http://localhost:5000/api/admin/verification/${action}`;

        if (!window.confirm(`Are you sure you want to ${action} ${name}'s account?`)) return;

        try {
            await axios.post(url, null, { params: { user_id: userId } });
            setSelectedUser(null);
            fetchData();
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Failed to ${action} user. Please try again.`);
        }
    };

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
                    badge={stats.pending_verifications > 0 ? { text: "Action Needed", type: "warning" } : null}
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
                        {listLoading ? (
                            <div className="loading-inline">
                                <i className="fas fa-spinner fa-spin"></i> Updating list...
                            </div>
                        ) : pendingUsers.length > 0 ? (
                            <div className="pending-verifications-list">
                                {pendingUsers.map(user => (
                                    <div key={user.id} className="verification-row">
                                        <div className="v-avatar">
                                            <i className="fas fa-user"></i>
                                        </div>
                                        <div className="v-info">
                                            <div className="v-name">{user.first_name} {user.last_name}</div>
                                            <div className="v-meta">
                                                <span className={`v-role-badge ${user.role.toLowerCase()}`}>
                                                    {user.role}
                                                </span>
                                                • {user.tupm_id} • Registered {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="v-actions">
                                            <button 
                                                className="v-btn-review" 
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="v-empty-state">
                                <i className="fas fa-check-circle"></i>
                                <p>All clear! No pending user verifications.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="classroom-alerts card">
                    <h3>Quick Actions</h3>
                    <div className="quick-action-item" onClick={() => navigate('/dept-head-reports')}>
                        <div className="quick-action-icon alert-type green">
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="quick-action-text">Generate Reports</div>
                    </div>
                    <div className="quick-action-item" onClick={() => navigate('/dept-head-management')}>
                        <div className="quick-action-icon alert-type blue">
                            <i className="fas fa-tasks"></i>
                        </div>
                        <div className="quick-action-text">Manage Department</div>
                    </div>
                </div>
            </div>

            {selectedUser && (
                <ReviewModal 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)} 
                    onAction={handleAction}
                />
            )}
        </div>
    );
};

export default DeptHeadDashboardPage;
