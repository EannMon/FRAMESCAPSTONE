import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * User Directory tab content for DeptHeadUserManagementPage.
 * Shows summary cards, searchable user table, and add-user modal.
 */
const UserDirectoryTab = ({
    users,
    filteredUsers,
    searchValue,
    setSearchValue,
    roleFilter,
    setRoleFilter,
    showAddUserModal,
    setShowAddUserModal,
    onSelectUser,
}) => {
    const navigate = useNavigate();

    return (
        <>
            {/* Summary Cards */}
            <div className="user-summary-cards">
                <div className="card user-summary-card">
                    <span className="user-summary-value">{users.filter(u => u.role === "ADMIN").length}</span>
                    <span className="user-summary-title">Administrators</span>
                </div>
                <div className="card user-summary-card">
                    <span className="user-summary-value">{users.filter(u => u.role === "FACULTY" || u.role === "HEAD").length}</span>
                    <span className="user-summary-title">Faculty Members</span>
                </div>
                <div className="card user-summary-card">
                    <span className="user-summary-value">{users.filter(u => u.role === "STUDENT").length}</span>
                    <span className="user-summary-title">Students</span>
                </div>
            </div>

            <div className="card user-list-card">
                <div className="user-list-header">
                    <h2>Dept. User Directory</h2>
                    <div className="user-list-actions">
                        <div className="user-search-bar">
                            <i className="fas fa-search"></i>
                            <input type="text" placeholder="Search users..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
                        </div>
                        <select className="user-role-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option>All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="FACULTY">Faculty</option>
                            <option value="STUDENT">Student</option>
                        </select>
                        <div className="add-user-dropdown-wrapper">
                            <button className="user-list-button add-user-button" onClick={() => setShowAddUserModal(true)}>
                                <i className="fas fa-plus"></i> Manual Add
                            </button>
                        </div>
                    </div>
                </div>

                <table className="user-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Face Status</th>
                            <th>Last Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-table-avatar">{(user.role && user.role[0]) ? user.role[0].toUpperCase() : '?'}</div>
                                            <div>
                                                <span className="user-table-name">{user.name}</span>
                                                <span className="user-table-email">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`role-tag ${user.roleColor}`}>{user.role}</span></td>
                                    <td>{user.department}</td>
                                    <td><span className={`status-tag ${user.statusColor}`}>{user.faceStatus}</span></td>
                                    <td>{user.lastActive}</td>
                                    <td>
                                        <button className="dept-action-button" onClick={() => onSelectUser(user)} title="View Profile">
                                            <i className="fas fa-id-card"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#888" }}>No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Role Selection Modal */}
            {showAddUserModal && (
                <div className="modal-backdrop" onClick={() => setShowAddUserModal(false)}>
                    <div className="modal-content role-selection-modal" onClick={e => e.stopPropagation()}>
                        <h3>Select User Role</h3>
                        <p className="role-selection-subtitle">Choose the type of user you want to register.</p>

                        <div className="role-cards-grid">
                            <div className="dept-role-card faculty" onClick={() => navigate('/register/faculty')}>
                                <i className="fas fa-chalkboard-teacher"></i>
                                <h3>Faculty</h3>
                                <p>Register a new faculty member.</p>
                            </div>
                            <div className="dept-role-card student" onClick={() => navigate('/register/student')}>
                                <i className="fas fa-user-graduate"></i>
                                <h3>Student</h3>
                                <p>Register a new student.</p>
                            </div>
                        </div>

                        <button className="modal-close-button" onClick={() => setShowAddUserModal(false)} style={{ marginTop: '30px' }}>Cancel</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserDirectoryTab;
