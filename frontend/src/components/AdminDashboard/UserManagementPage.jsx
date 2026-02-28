import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './UserManagementPage.css';

// Role → tag CSS color class
const roleColorMap = { ADMIN: 'red', FACULTY: 'green', STUDENT: 'blue', HEAD: 'purple' };
const faceStatusColor = (registered) => (registered ? 'green' : 'yellow');

const UserManagementPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);

    // Fetch users from real API with server-side filters
    const fetchUsers = useCallback(
        async (signal) => {
            try {
                setLoading(true);
                setError('');

                const params = {};
                if (roleFilter !== 'All Roles') params.role = roleFilter;
                if (searchValue.trim()) params.search = searchValue.trim();

                const res = await api.get('/api/admin/users', { params, signal });
                setUsers(res.data);
            } catch (err) {
                if (err.code !== 'ERR_CANCELED') {
                    setError(err.userMessage || 'Failed to load users.');
                }
            } finally {
                setLoading(false);
            }
        },
        [roleFilter, searchValue],
    );

    // Initial fetch + re-fetch when filters change (debounced via AbortController)
    useEffect(() => {
        const controller = new AbortController();
        fetchUsers(controller.signal);
        return () => controller.abort();
    }, [fetchUsers]);

    // If navigating back from registration with a new user, refresh the list
    useEffect(() => {
        if (location.state?.newUser) {
            const controller = new AbortController();
            fetchUsers(controller.signal);
            return () => controller.abort();
        }
    }, [location.state, fetchUsers]);

    // Derived role counts from fetched data
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const facultyCount = users.filter((u) => u.role === 'FACULTY').length;
    const studentCount = users.filter((u) => u.role === 'STUDENT').length;

    const goToRegistration = (role) => {
        setShowAddUserDropdown(false);
        navigate(`/register/${role}`);
    };

    return (
        <div className="user-management-container">
            {/* Summary cards — counts derived from real data */}
            <div className="user-summary-cards">
                <div className="card user-summary-card">
                    <span className="user-summary-value">{adminCount}</span>
                    <span className="user-summary-title">Administrators</span>
                </div>
                <div className="card user-summary-card">
                    <span className="user-summary-value">{facultyCount}</span>
                    <span className="user-summary-title">Faculty Members</span>
                </div>
                <div className="card user-summary-card">
                    <span className="user-summary-value">{studentCount}</span>
                    <span className="user-summary-title">Students</span>
                </div>
            </div>

            <div className="card user-list-card">
                <div className="user-list-header">
                    <h2>All Users</h2>

                    <div className="user-list-actions">
                        <div className="user-search-bar">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>

                        <select
                            className="user-role-filter"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option>All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="FACULTY">Faculty</option>
                            <option value="STUDENT">Student</option>
                        </select>

                        <div className="add-user-dropdown-wrapper">
                            <button
                                className="user-list-button add-user-button"
                                onClick={() => setShowAddUserDropdown((prev) => !prev)}
                            >
                                <i className="fas fa-plus"></i> Add User
                            </button>

                            {showAddUserDropdown && (
                                <div className="add-user-dropdown">
                                    <button onClick={() => goToRegistration('student')}>
                                        Register Student
                                    </button>
                                    <button onClick={() => goToRegistration('faculty')}>
                                        Register Faculty
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading / error feedback */}
                {loading && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                        Loading users…
                    </p>
                )}
                {error && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
                        {error}
                    </p>
                )}

                {/* Users table */}
                {!loading && !error && (
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
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-info-cell">
                                                <i className="fas fa-user-circle user-table-avatar"></i>
                                                <div>
                                                    <span className="user-table-name">
                                                        {user.first_name} {user.last_name}
                                                    </span>
                                                    <span className="user-table-email">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-tag ${roleColorMap[user.role] || 'blue'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{user.department_name || '—'}</td>
                                        <td>
                                            <span className={`status-tag ${faceStatusColor(user.face_registered)}`}>
                                                {user.face_registered ? 'Registered' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.last_active
                                                ? new Date(user.last_active).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td>
                                            <button className="action-button">
                                                <i className="fas fa-pen"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        style={{ textAlign: 'center', padding: '20px', color: '#888' }}
                                    >
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManagementPage;
