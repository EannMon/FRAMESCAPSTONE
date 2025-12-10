import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import './UserManagementPage.css';

const UserManagementPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const initialUsers = [
        { name: "Admin User", email: "admin@university.edu", role: "Admin", roleColor: "red", department: "IT Services", faceStatus: "Registered", statusColor: "green", lastActive: "5 min ago" },
        { name: "Dr. Sarah Johnson", email: "sarah.johnson@university.edu", role: "Faculty", roleColor: "green", department: "Computer Science", faceStatus: "Registered", statusColor: "green", lastActive: "2 hours ago" },
        { name: "Michael Chen", email: "michael.chen@student.edu", role: "Student", roleColor: "blue", department: "Engineering", faceStatus: "Pending", statusColor: "yellow", lastActive: "1 day ago" }
    ];

    const [users, setUsers] = useState(initialUsers);
    const [searchValue, setSearchValue] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");

    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);

    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Student",
        department: "",
        faceStatus: "Pending"
    });

    useEffect(() => {
        if (location.state?.newUser) {
            setUsers(prev => [...prev, location.state.newUser]);
        }
    }, [location.state]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAddUser = (e) => {
        e.preventDefault();

        if (newUser.password !== newUser.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const roleColor = newUser.role === "Admin" ? "red" : newUser.role === "Faculty" ? "green" : "blue";
        const statusColor = newUser.faceStatus === "Registered" ? "green" : newUser.faceStatus === "Pending" ? "yellow" : "red";

        const userToAdd = {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            roleColor,
            department: newUser.department,
            faceStatus: newUser.faceStatus,
            statusColor,
            lastActive: "Just now"
        };

        setUsers(prev => [...prev, userToAdd]);
        setShowAddUserModal(false);
        setNewUser({ name: "", email: "", password: "", confirmPassword: "", role: "Student", department: "", faceStatus: "Pending" });
    };

    const filteredUsers = users.filter(user => {
        const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
        const matchesSearch =
            user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            user.email.toLowerCase().includes(searchValue.toLowerCase()) ||
            user.department.toLowerCase().includes(searchValue.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const goToRegistration = (role) => {
        setShowAddUserDropdown(false);
        navigate(`/register/${role}`);
    };

    return (
        <div className="user-management-container">
            <div className="user-summary-cards">
                <div className="card user-summary-card">
                    <span className="user-summary-value">{users.filter(u => u.role === "Admin").length}</span>
                    <span className="user-summary-title">Administrators</span>
                </div>
                <div className="card user-summary-card">
                    <span className="user-summary-value">{users.filter(u => u.role === "Faculty").length}</span>
                    <span className="user-summary-title">Faculty Members</span>
                </div>
                <div className="card user-summary-card">
                    <span className="user-summary-value">{users.filter(u => u.role === "Student").length}</span>
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
                            <option>Admin</option>
                            <option>Faculty</option>
                            <option>Student</option>
                        </select>

                        {/* ADD USER DROPDOWN BUTTON */}
                        <div className="add-user-dropdown-wrapper">
                            <button
                                className="user-list-button add-user-button"
                                onClick={() => setShowAddUserDropdown(prev => !prev)}
                            >
                                <i className="fas fa-plus"></i> Add User
                            </button>

                            {showAddUserDropdown && (
                                <div className="add-user-dropdown">
                                    <button onClick={() => goToRegistration("student")}>
                                        Register Student
                                    </button>
                                    <button onClick={() => goToRegistration("faculty")}>
                                        Register Faculty
                                    </button>
                                </div>
                            )}
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
                                            <i className="fas fa-user-circle user-table-avatar"></i>
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
                                        <button className="action-button"><i className="fas fa-pen"></i></button>
                                        <button className="action-button delete-button"><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ORIGINAL MODAL (unchanged, still works if needed) */}
            {showAddUserModal && (
                <div className="modal-backdrop" onClick={() => setShowAddUserModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Register New User</h3>
                        <form onSubmit={handleAddUser} className="add-user-form">
                            <input type="text" name="name" placeholder="Full Name" value={newUser.name} onChange={handleInputChange} required />
                            <input type="email" name="email" placeholder="Email" value={newUser.email} onChange={handleInputChange} required />
                            <input type="password" name="password" placeholder="Password" value={newUser.password} onChange={handleInputChange} required />
                            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={newUser.confirmPassword} onChange={handleInputChange} required />
                            <input type="text" name="department" placeholder="Department" value={newUser.department} onChange={handleInputChange} required />
                            <select name="role" value={newUser.role} onChange={handleInputChange}>
                                <option>Admin</option>
                                <option>Faculty</option>
                                <option>Student</option>
                            </select>
                            <button type="submit" className="add-user-submit">Register</button>
                            <button type="button" className="add-user-cancel" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
