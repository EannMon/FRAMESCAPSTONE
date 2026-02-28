import React from 'react';

/**
 * Verification tab content for DeptHeadUserManagementPage.
 * Extracted to keep the parent page under the 300-line limit.
 */
const UserVerificationTab = ({
    filteredVerificationUsers,
    verificationUsers,
    verificationLoading,
    verificationError,
    verificationRoleFilter,
    setVerificationRoleFilter,
    verificationStatusFilter,
    setVerificationStatusFilter,
    verificationSearch,
    setVerificationSearch,
    verificationOpenMenuId,
    setVerificationOpenMenuId,
    verificationModalUser,
    setVerificationModalUser,
    handleStatusUpdate,
    deleteApplication,
    onRefresh,
}) => (
    <div className="tab-content-verification">
        {/* Filter Bar */}
        <div className="app-filter-bar">
            <div className="app-filter-left">
                <select className="app-filter-select" value={verificationRoleFilter} onChange={(e) => setVerificationRoleFilter(e.target.value)}>
                    <option>All</option>
                    <option>Faculty</option>
                    <option>Student</option>
                    <option>Admin</option>
                </select>
                <select className="app-filter-select" value={verificationStatusFilter} onChange={(e) => setVerificationStatusFilter(e.target.value)}>
                    <option>Status</option>
                    <option>Pending</option>
                    <option>Verified</option>
                    <option>Rejected</option>
                </select>
                <div className="app-search-bar">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search..." value={verificationSearch} onChange={(e) => setVerificationSearch(e.target.value)} />
                </div>
            </div>
            <button className="refresh-button" onClick={onRefresh} title="Refresh List">
                <i className="fas fa-sync-alt"></i> Refresh
            </button>
        </div>

        {verificationLoading ? (
            <div className="loading-spinner">Loading Applications...</div>
        ) : verificationError ? (
            <div className="error-message">{verificationError}</div>
        ) : (
            <div className="card app-list-card">
                <div className="app-list-header">
                    <h2>User Verification List ({filteredVerificationUsers.length})</h2>
                    <p>Pending review: {verificationUsers.filter(a => a.status === 'Pending').length}</p>
                </div>

                <div className="app-table-container">
                    <table className="app-table">
                        <thead>
                            <tr>
                                <th>User ID / Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Verification Status</th>
                                <th>Date Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVerificationUsers.map((app) => (
                                <tr key={app.id} className="user-row" onClick={() => setVerificationModalUser(app)}>
                                    <td className="user-cell">
                                        <div className="user-info-cell">
                                            <div className="user-table-avatar">{(app.role && app.role[0]) ? app.role[0].toUpperCase() : '?'}</div>
                                            <div>
                                                <span className="user-table-name">{app.name}</span>
                                                <span className="user-table-email">ID: {app.tupm_id || app.user_id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`role-tag ${app.roleColor}`}>{app.role}</span></td>
                                    <td>{app.department}</td>
                                    <td><span className={`status-tag ${app.statusColor}`}>{app.status}</span></td>
                                    <td>{app.date}</td>
                                    <td className="actions-cell">
                                        <div className="dropdown-container">
                                            <button className="dept-action-button" onClick={(e) => { e.stopPropagation(); setVerificationOpenMenuId(verificationOpenMenuId === app.id ? null : app.id); }}>
                                                <i className="fas fa-ellipsis-h"></i>
                                            </button>
                                            {verificationOpenMenuId === app.id && (
                                                <div className="action-dropdown">
                                                    {app.status !== 'Verified' && app.status !== 'Approved' && <button onClick={() => handleStatusUpdate(app.id, "Approved")}><i className="fas fa-check"></i> Approve</button>}
                                                    {app.status !== 'Rejected' && <button onClick={() => handleStatusUpdate(app.id, "Rejected")}><i className="fas fa-times"></i> Reject</button>}
                                                    <button onClick={() => deleteApplication(app.id)} className="delete"><i className="fas fa-trash"></i> Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVerificationUsers.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center", padding: 20, color: "#888" }}>No results found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Verification Detail Modal */}
        {verificationModalUser && (
            <div className="modal-backdrop" onClick={() => setVerificationModalUser(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3>User Details: {verificationModalUser.name}</h3>
                    <div className="modal-body">
                        <p><strong>Status:</strong> <span className={`status-tag ${verificationModalUser.statusColor}`}>{verificationModalUser.status}</span></p>
                        <p><strong>Email:</strong> {verificationModalUser.email}</p>
                        <p><strong>TUPM ID:</strong> {verificationModalUser.tupm_id}</p>
                        <p><strong>Role:</strong> {verificationModalUser.role}</p>
                        <p><strong>Department:</strong> {verificationModalUser.department}</p>
                        <p><strong>Date Registered:</strong> {verificationModalUser.date}</p>
                    </div>
                    <button className="modal-close-button" onClick={() => setVerificationModalUser(null)}>Close</button>
                </div>
            </div>
        )}
    </div>
);

export default UserVerificationTab;
