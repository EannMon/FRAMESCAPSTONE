import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApplicationPage.css';

// Helper function para sa kulay batay sa status
const getStatusColor = (status) => {
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

const ApplicationPage = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("Status");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [modalUser, setModalUser] = useState(null);

    // --- FETCH DATA ON LOAD ---
    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            // Tiyakin na ang API endpoint na ito ay nagbabalik ng LAHAT ng users (Pending, Verified, Rejected)
            const response = await axios.get('http://localhost:5000/admin/verification/list');
            
            // Map the data to match frontend requirements (name, roleColor, etc.)
            const mappedData = response.data.map(user => ({
                id: user.user_id, // Gamitin ang user_id bilang key
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
                // Assign role color based on logic (optional, for visual flair)
                roleColor: user.role === 'admin' ? 'red' : user.role === 'faculty' ? 'green' : 'blue',
                department: user.college || user.course, // Gamitin ang college o course
                status: user.verification_status, // Gamitin ang verification_status
                statusColor: getStatusColor(user.verification_status),
                date: new Date(user.date_registered).toLocaleString(), // Format ang date
                // Other fields for modal
                ...user 
            }));

            setApplications(mappedData);
        } catch (err) {
            console.error("Failed to fetch applications:", err);
            setError("Failed to load user data. Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    // --- ACTION HANDLERS (UPDATED TO USE API) ---
    const handleStatusUpdate = async (id, newStatus) => {
        setOpenMenuId(null);
        const endpoint = newStatus === 'Approved' 
            ? 'http://localhost:5000/admin/verification/approve' 
            : 'http://localhost:5000/admin/verification/reject';

        try {
            // Gumamit ng 'Verified' sa API kung 'Approved'
            const apiStatus = newStatus === 'Approved' ? 'Verified' : 'Rejected';
            
            await axios.post(endpoint, { 
                user_id: id, 
                verification_status: apiStatus 
            });

            // Update state agad sa Frontend
            setApplications(prev =>
                prev.map(app =>
                    app.id === id
                        ? {
                            ...app,
                            status: apiStatus,
                            statusColor: getStatusColor(apiStatus)
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
             // Assuming you have a DELETE endpoint (e.g., /user/delete/:id)
            await axios.delete(`http://localhost:5000/admin/user-delete/${id}`); 
            setApplications(prev => prev.filter(app => app.id !== id));
            alert(`User ID ${id} deleted.`);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(`Failed to delete user: ${error.response?.data?.error || 'Server error'}`);
        }
        setOpenMenuId(null);
    };


    // FILTERING LOGIC
    const filteredApps = applications.filter((item) => {
        const roleMatch = roleFilter === "All" || item.role === roleFilter.toLowerCase();
        const statusMatch = statusFilter === "Status" || item.status === statusFilter;
        const searchMatch =
            item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            item.email.toLowerCase().includes(searchValue.toLowerCase()) ||
            item.department.toLowerCase().includes(searchValue.toLowerCase());

        return roleMatch && statusMatch && searchMatch;
    });

    // --- LOADING AND ERROR HANDLING RENDERING ---
    if (loading) {
        return <div className="application-container"><div className="loading-spinner">Loading Applications...</div></div>;
    }

    if (error) {
        return <div className="application-container"><div className="error-message">{error}</div></div>;
    }
    // 

    return (
        <div className="application-container">

            {/* Filter Bar */}
            <div className="app-filter-bar">
                <div className="app-filter-left">
                    <select
                        className="app-filter-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option>All</option>
                        <option>Faculty</option>
                        <option>Student</option>
                        <option>Admin</option>
                    </select>

                    <select
                        className="app-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {/* Statuses are based on DB: Pending, Verified, Rejected */}
                        <option>Status</option> 
                        <option>Pending</option>
                        <option>Verified</option>
                        <option>Rejected</option>
                        {/* Cancelled is now handled as Rejected or can be filtered out */}
                    </select>

                    <div className="app-search-bar">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>
                </div>
                <button className="refresh-button" onClick={fetchApplications}>
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            {/* Applications Table */}
            <div className="card app-list-card">
                <div className="app-list-header">
                    <h2>User Verification List ({filteredApps.length} Results)</h2>
                    <p>Total users pending review: {applications.filter(a => a.status === 'Pending').length}</p>
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
                            {filteredApps.map((app) => (
                                <tr key={app.id} className="user-row" onClick={() => setModalUser(app)}>
                                    {/* Entire user cell clickable */}
                                    <td 
                                        className="user-cell" 
                                    >
                                        <div className="user-info-cell">
                                            <div className="user-table-avatar">
                                                {/* Gumamit ng first letter ng role */}
                                                {app.role[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="user-table-name">{app.name}</span>
                                                <span className="user-table-email">ID: {app.tupm_id || app.user_id}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td><span className={`role-tag ${app.roleColor}`}>{app.role}</span></td>
                                    <td>{app.department}</td>
                                    <td>
                                        <span className={`status-tag ${app.statusColor}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td>{app.date}</td>

                                    {/* Small dropdown actions */}
                                    <td className="actions-cell">
                                        <div className="dropdown-container">
                                            <button
                                                className="action-button"
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    setOpenMenuId(openMenuId === app.id ? null : app.id);
                                                }}
                                            >
                                                <i className="fas fa-ellipsis-h"></i>
                                            </button>

                                            {openMenuId === app.id && (
                                                <div className="action-dropdown">
                                                    {app.status !== 'Verified' && (
                                                        <button onClick={() => handleStatusUpdate(app.id, "Approved")}>
                                                            <i className="fas fa-check"></i> Approve
                                                        </button>
                                                    )}
                                                    {app.status !== 'Rejected' && (
                                                        <button onClick={() => handleStatusUpdate(app.id, "Rejected")}>
                                                            <i className="fas fa-times"></i> Reject
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteApplication(app.id)} className="delete">
                                                        <i className="fas fa-trash"></i> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredApps.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: 20, color: "#888" }}>
                                        No results found.
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Details Modal (Para ipakita ang lahat ng data) */}
            {modalUser && (
                <div className="modal-backdrop" onClick={() => setModalUser(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>User Details: {modalUser.name}</h3>
                        <div className="modal-body">
                            <p><strong>Status:</strong> <span className={`status-tag ${modalUser.statusColor}`}>{modalUser.status}</span></p>
                            <p><strong>Email:</strong> {modalUser.email}</p>
                            <p><strong>TUPM ID:</strong> {modalUser.tupm_id}</p>
                            <p><strong>Role:</strong> {modalUser.role}</p>
                            <p><strong>College:</strong> {modalUser.college}</p>
                            <p><strong>Course:</strong> {modalUser.course}</p>
                            <p><strong>Date Registered:</strong> {modalUser.date}</p>
                            {/* Optional: Add button to view captured face image */}
                        </div>
                        <button className="modal-close-button" onClick={() => setModalUser(null)}>Close</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ApplicationPage;