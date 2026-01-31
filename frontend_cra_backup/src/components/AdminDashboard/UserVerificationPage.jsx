import React, { useState, useEffect } from 'react';
// I-import ang inyong CSS file dito, e.g., 'ReportsPage.css' o 'UserManagementPage.css'
// Note: Assuming na ang classes na 'admin-reports-container', 'admin-recent-reports-table', atbp. ay available.

const API_BASE_URL = 'http://127.0.0.1:5000'; // Palitan base sa inyong Flask URL
// NOTE: Kailangan mo ring i-pass ang ID ng naka-login na Admin para sa SystemAudit log.

const UserVerificationPage = ({ adminUser }) => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const adminId = adminUser ? adminUser.user_id : 1; // Default to 1 if adminUser is null for testing

    // [NEW API CALL] Fetch Users with verification_status = 'Pending'
    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/pending`);
            if (!response.ok) throw new Error('Failed to fetch pending users');
            
            const data = await response.json();
            setPendingUsers(data);
        } catch (error) {
            console.error("Error fetching pending users:", error);
            alert("Error fetching pending users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    // [NEW API CALL] Handle Approve/Reject Action
    const handleAction = async (userId, status, name) => {
        const action = status === 'Verified' ? 'Approve' : 'Reject';

        if (!window.confirm(`Are you sure you want to ${action} the account for ${name}?`)) return;

        try {
            // 1. Update verification_status
            const verifyResponse = await fetch(`${API_BASE_URL}/api/admin/users/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status })
            });

            if (!verifyResponse.ok) throw new Error('Verification API failed');

            // 2. Log the action to SystemAudit
            await fetch(`${API_BASE_URL}/api/admin/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    admin_id: adminId, 
                    action_type: `USER_VERIFICATION_${status.toUpperCase()}`,
                    target_id: userId,
                    details: `${status} user ${userId}: ${name}` 
                })
            });

            alert(`User ${name} successfully ${status}.`);
            fetchPendingUsers(); // Refresh the list
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            alert(`Failed to ${action} user. Check console for details.`);
        }
    };

    return (
        <div className="admin-reports-container">
            <div className="card admin-recent-reports-card" style={{ gridColumn: '1 / -1' }}>
                <div className="admin-recent-reports-header">
                    <h2>Pending User Verification ({pendingUsers.length})</h2>
                </div>

                <div className="admin-reports-table-container">
                    <table className="admin-recent-reports-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>TUPM ID</th>
                                <th>Role</th>
                                <th>Date Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Loading pending users...</td></tr>
                            ) : pendingUsers.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No pending accounts requiring verification.</td></tr>
                            ) : (
                                pendingUsers.map(user => (
                                    <tr key={user.user_id}>
                                        <td>{user.lastName}, {user.firstName}</td>
                                        <td>{user.tupm_id}</td>
                                        <td>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                                        <td>{user.date_registered}</td>
                                        <td>
                                            <div className="admin-recent-reports-table .action-buttons-wrapper">
                                                <button 
                                                    className="admin-action-button" 
                                                    style={{ color: '#28a745' }}
                                                    title="Approve Account"
                                                    onClick={() => handleAction(user.user_id, 'Verified', `${user.lastName}, ${user.firstName}`)}
                                                >
                                                    <i className="fas fa-check"></i> 
                                                </button>
                                                <button 
                                                    className="admin-action-button" 
                                                    style={{ color: '#dc3545' }}
                                                    title="Reject Account"
                                                    onClick={() => handleAction(user.user_id, 'Rejected', `${user.lastName}, ${user.firstName}`)}
                                                >
                                                    <i className="fas fa-times"></i> 
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserVerificationPage;