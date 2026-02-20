import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import './DeptHeadUserManagementPage.css';

// Helper for status colors
const getStatusColor = (status) => {
    if (!status) return 'yellow';
    switch (status) {
        case 'Verified':
        case 'Approved':
            return 'green';
        case 'Rejected':
        case 'Cancelled':
            return 'red';
        default:
            return 'yellow'; // Pending
    }
};

const DeptHeadUserManagementPage = () => {
    console.log("Details: DeptHeadUserManagementPage mounting");
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'verification'

    console.log("Details: Active Tab:", activeTab);

    // ==========================================
    // USER DIRECTORY STATE
    // ==========================================
    const [users, setUsers] = useState([]); // Empty initially, populated by API
    const [searchValue, setSearchValue] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    // ==========================================
    // USER VERIFICATION STATE
    // ==========================================
    const [verificationUsers, setVerificationUsers] = useState([]); // Kept for distinct filtering/view if needed, or could sync with users
    const [verificationLoading, setVerificationLoading] = useState(true);
    const [verificationError, setVerificationError] = useState(null);
    const [verificationSearch, setVerificationSearch] = useState("");
    const [verificationRoleFilter, setVerificationRoleFilter] = useState("All");
    const [verificationStatusFilter, setVerificationStatusFilter] = useState("Status");
    const [verificationOpenMenuId, setVerificationOpenMenuId] = useState(null);
    const [verificationModalUser, setVerificationModalUser] = useState(null);

    // ==========================================
    // EFFECT: Tab Handling & Initial Load
    // ==========================================
    useEffect(() => {
        if (location.state?.newUser) {
            setUsers(prev => [...prev, location.state.newUser]);
        }
        if (location.hash === '#verification') {
            setActiveTab('verification');
        }
    }, [location.state, location.hash]);

    useEffect(() => {
        // Fetch users on mount or when tab changes (to ensure freshness)
        // Optimization: Could check if data is already loaded
        fetchUsers();
    }, [activeTab]); // Refetch on tab change to keep in sync

    // ==========================================
    // SHARED FETCH HANDLER
    // ==========================================
    const fetchUsers = async () => {
        setVerificationLoading(true);
        setVerificationError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/verification/list');

            // Map for Verification Tab
            const mappedVerificationData = (response.data || []).map(user => ({
                id: user.id || user.user_id,
                name: `${user.first_name || ''} ${user.last_name || ''}`,
                email: user.email,
                role: user.role || 'N/A',
                roleColor: user.role === 'ADMIN' ? 'red' : (user.role === 'FACULTY' || user.role === 'HEAD') ? 'green' : 'blue', // CSS 'red' class now maps to Purple style
                department: user.department_name || user.program_name || 'N/A',
                status: user.verification_status || 'Pending',
                statusColor: getStatusColor(user.verification_status),
                date: user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A',
                tupm_id: user.tupm_id || 'N/A',
                ...user
            }));

            // Map for Directory Tab (Normalizing fields)
            const mappedDirectoryData = (response.data || []).map(user => ({
                name: `${user.first_name || ''} ${user.last_name || ''}`,
                email: user.email,
                role: user.role || 'N/A',
                roleColor: user.role === 'ADMIN' ? 'red' : (user.role === 'FACULTY' || user.role === 'HEAD') ? 'green' : 'blue',
                department: user.department_name || user.program_name || 'N/A',
                faceStatus: user.face_registered ? "Registered" : ((user.verification_status === 'VERIFIED' || user.verification_status === 'Verified') ? 'No Face' : 'Pending'),
                statusColor: user.face_registered ? "green" : ((user.verification_status === 'VERIFIED' || user.verification_status === 'Verified') ? 'blue' : 'yellow'),
                lastActive: user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never',
                ...user
            }));

            setVerificationUsers(mappedVerificationData);
            setUsers(mappedDirectoryData);

        } catch (err) {
            console.error("Failed to fetch users:", err);
            setVerificationError("Failed to load user data. Check backend connection.");
        } finally {
            setVerificationLoading(false);
        }
    };

    // ==========================================
    // DIRECTORY HANDLERS
    // ==========================================
    const [selectedUserForSummary, setSelectedUserForSummary] = useState(null);
    const [isPanelClosing, setIsPanelClosing] = useState(false);
    const [summarySchedule, setSummarySchedule] = useState([]);
    const [summaryScheduleLoading, setSummaryScheduleLoading] = useState(false);

    const closePanel = () => {
        setIsPanelClosing(true);
        setTimeout(() => {
            setSelectedUserForSummary(null);
            setIsPanelClosing(false);
        }, 300);
    };

    useEffect(() => {
        if (selectedUserForSummary) {
            const uid = selectedUserForSummary.id || selectedUserForSummary.user_id;
            setSummaryScheduleLoading(true);
            axios.get(`http://localhost:5000/api/dept/user-schedule/${uid}`)
                .then(res => setSummarySchedule(res.data || []))
                .catch(() => setSummarySchedule([]))
                .finally(() => setSummaryScheduleLoading(false));
        } else {
            setSummarySchedule([]);
        }
    }, [selectedUserForSummary]);

    const filteredUsers = users.filter(user => {
        const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
        const matchesSearch =
            (user.name && user.name.toLowerCase().includes(searchValue.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchValue.toLowerCase())) ||
            (user.department && user.department.toLowerCase().includes(searchValue.toLowerCase()));
        return matchesRole && matchesSearch;
    });



    // ==========================================
    // VERIFICATION HANDLERS
    // ==========================================
    const handleStatusUpdate = async (id, newStatus) => {
        setVerificationOpenMenuId(null);
        const endpoint = newStatus === 'Approved'
            ? 'http://localhost:5000/api/admin/verification/approve'
            : 'http://localhost:5000/api/admin/verification/reject';

        try {
            const apiStatus = newStatus === 'Approved' ? 'Verified' : 'Rejected';

            await axios.post(endpoint, {
                user_id: id,
                verification_status: apiStatus
            });

            // Update local state to match backend response logic
            setVerificationUsers(prev =>
                prev.map(app =>
                    app.id === id
                        ? {
                            ...app,
                            status: apiStatus, // 'Verified' or 'Rejected'
                            statusColor: getStatusColor(apiStatus),
                            verification_status: apiStatus // Ensure raw field is updated too
                        }
                        : app
                )
            );
            alert(`User ID ${id} set to ${apiStatus}.`);

        } catch (error) {
            console.error(`Error setting status to ${newStatus}:`, error);
            alert(`Failed to update status: ${error.response?.data?.error || 'Server error'}`);
        }
    };

    const deleteApplication = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user permanently?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/user/${id}`);
            setVerificationUsers(prev => prev.filter(app => app.id !== id));
            alert(`User ID ${id} deleted.`);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(`Failed to delete user: ${error.response?.data?.error || 'Server error'}`);
        }
        setVerificationOpenMenuId(null);
    };

    const filteredVerificationUsers = verificationUsers.filter((item) => {
        // Fix: backend returns uppercase roles (ADMIN, FACULTY), filter values are title case (All, Faculty)
        // Adjust filter check to handle both or normalize
        const roleMatch = verificationRoleFilter === "All" || item.role === verificationRoleFilter.toUpperCase();

        // DEFAULT: Show only Pending/Rejected unless explicitly filtering for Verified
        let statusMatch = true;
        if (verificationStatusFilter === "Status") {
            // Default view: exclude Verified/Approved to reduce clutter
            statusMatch = item.status !== 'Verified' && item.status !== 'Approved' && item.status !== 'VERIFIED';
        } else {
            statusMatch = item.status === verificationStatusFilter;
        }

        const searchMatch =
            (item.name && item.name.toLowerCase().includes(verificationSearch.toLowerCase())) ||
            (item.email && item.email.toLowerCase().includes(verificationSearch.toLowerCase())) ||
            (item.department && item.department.toLowerCase().includes(verificationSearch.toLowerCase()));

        return roleMatch && statusMatch && searchMatch;
    });


    return (
        <div className="user-management-container">
            {/* TABS HEADER */}
            <div className="user-management-tabs">
                <button
                    className={`tab-button ${activeTab === 'directory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('directory')}
                >
                    <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                    User Directory
                </button>
                <button
                    className={`tab-button ${activeTab === 'verification' ? 'active' : ''}`}
                    onClick={() => setActiveTab('verification')}
                >
                    <i className="fas fa-user-check" style={{ marginRight: '8px' }}></i>
                    User Verification
                </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'verification' ? (
                <div className="tab-content-verification">
                    {/* VERIFICATION CONTENT */}
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
                        <button className="refresh-button" onClick={fetchUsers} title="Refresh List">
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

                    {/* Verification Modal */}
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
            ) : (
                <>
                    {/* USER DIRECTORY CONTENT */}
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
                                                <button className="dept-action-button" onClick={() => setSelectedUserForSummary(user)} title="View Profile">
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

                    {/* REGISTER MODAL REPLACEMENT: Role Selection */}
                    {showAddUserModal && (
                        <div className="modal-backdrop" onClick={() => setShowAddUserModal(false)}>
                            <div className="modal-content role-selection-modal" onClick={e => e.stopPropagation()}>
                                <h3>Select User Role</h3>
                                <p className="role-selection-subtitle">Choose the type of user you want to register.</p>

                                <div className="role-cards-grid">
                                    {/* Faculty Card */}
                                    <div className="dept-role-card faculty" onClick={() => navigate('/register/faculty')}>
                                        <i className="fas fa-chalkboard-teacher"></i>
                                        <h3>Faculty</h3>
                                        <p>Register a new faculty member.</p>
                                    </div>

                                    {/* Student Card */}
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
            )}

            {/* SLIDE-UP PROFILE PANEL */}
            {selectedUserForSummary && (
                <div className={`profile-panel-overlay ${isPanelClosing ? 'closing' : ''}`} onClick={closePanel}>
                    <div className={`profile-panel ${isPanelClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>

                        {/* Pull-down handle to close */}
                        <div className="panel-pull-handle" onClick={closePanel}>
                            <i className="fas fa-chevron-down"></i>
                        </div>

                        {/* Panel Body — Two Column Grid */}
                        <div className="panel-body">
                            {/* LEFT: Identity Card */}
                            <div className="panel-identity-card">
                                <div className="panel-identity-header">
                                    <div className="panel-avatar">
                                        {selectedUserForSummary.first_name
                                            ? selectedUserForSummary.first_name[0].toUpperCase()
                                            : selectedUserForSummary.name
                                                ? selectedUserForSummary.name[0].toUpperCase()
                                                : '?'}
                                    </div>
                                    <h3 className="panel-user-name">{selectedUserForSummary.name}</h3>
                                    <span className={`role-tag ${selectedUserForSummary.roleColor}`}>{selectedUserForSummary.role}</span>
                                </div>

                                <div className="panel-identity-details">
                                    <div className="panel-detail-row">
                                        <i className="fas fa-envelope"></i>
                                        <div>
                                            <span className="panel-detail-label">Email</span>
                                            <span className="panel-detail-value">{selectedUserForSummary.email}</span>
                                        </div>
                                    </div>
                                    <div className="panel-detail-row">
                                        <i className="fas fa-building"></i>
                                        <div>
                                            <span className="panel-detail-label">Department</span>
                                            <span className="panel-detail-value">{selectedUserForSummary.department || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="panel-detail-row">
                                        <i className="fas fa-id-badge"></i>
                                        <div>
                                            <span className="panel-detail-label">TUPM ID</span>
                                            <span className="panel-detail-value">{selectedUserForSummary.tupm_id || selectedUserForSummary.user_id || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="panel-detail-row">
                                        <i className="fas fa-check-circle"></i>
                                        <div>
                                            <span className="panel-detail-label">Verification Status</span>
                                            <span className={`status-tag ${selectedUserForSummary.statusColor}`}>{selectedUserForSummary.status || 'Active'}</span>
                                        </div>
                                    </div>
                                    <div className="panel-detail-row">
                                        <i className="fas fa-camera"></i>
                                        <div>
                                            <span className="panel-detail-label">Face Registration</span>
                                            <span className={`status-tag ${selectedUserForSummary.face_registered ? 'green' : 'yellow'}`}>
                                                {selectedUserForSummary.face_registered ? 'Registered' : 'Not Registered'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Schedule Card */}
                            <div className="panel-schedule-card">
                                <div className="panel-schedule-header">
                                    <i className="fas fa-calendar-alt"></i>
                                    <h3>Class Schedule</h3>
                                </div>
                                <div className="panel-schedule-body">
                                    {summaryScheduleLoading ? (
                                        <div className="panel-schedule-empty">
                                            <i className="fas fa-spinner fa-spin"></i>
                                            <p>Loading schedule...</p>
                                        </div>
                                    ) : summarySchedule.length > 0 ? (
                                        <table className="panel-schedule-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Section</th>
                                                    <th>Day</th>
                                                    <th>Time</th>
                                                    <th>Room</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summarySchedule.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td><strong>{item.subject_code}</strong></td>
                                                        <td>{item.section}</td>
                                                        <td>{item.day}</td>
                                                        <td>{item.time}</td>
                                                        <td><span className="panel-room-badge">{item.room}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="panel-schedule-empty">
                                            <i className="fas fa-calendar-times"></i>
                                            <p>No schedule data available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DeptHeadUserManagementPage;