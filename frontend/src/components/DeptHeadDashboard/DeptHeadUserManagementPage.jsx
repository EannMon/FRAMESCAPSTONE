import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Common/ToastProvider';
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
    const toast = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'verification'

    console.log("Details: Active Tab:", activeTab);

    // ==========================================
    // USER DIRECTORY STATE
    // ==========================================
    const [users, setUsers] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [roleFilter, setRoleFilter] = useState("FACULTY"); // Default to Faculty per Task 40
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    // Inline Invite State
    const [inviteEmails, setInviteEmails] = useState('');
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [inviteResult, setInviteResult] = useState(null);
    const [inviteError, setInviteError] = useState('');

    const [selectedDirectoryUser, setSelectedDirectoryUser] = useState(null); // Row click detail

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
        const controller = new AbortController();
        // Fetch users on mount or when tab changes (to ensure freshness)
        // Optimization: Could check if data is already loaded
        fetchUsers(controller.signal);
        return () => controller.abort();
    }, [activeTab]); // Refetch on tab change to keep in sync

    // ==========================================
    // SHARED FETCH HANDLER
    // ==========================================
    const fetchUsers = async (signal = null) => {
        setVerificationLoading(true);
        setVerificationError(null);
        try {
            // Use dept-scoped endpoint — Dept Head should only see their own department's users
            const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const deptId = storedUser.department_id;
            if (!deptId) {
                setVerificationError("No department assigned to your account.");
                setVerificationLoading(false);
                return;
            }
            const reqConfig = signal ? { signal } : {};

            // Fetch users and invites concurrently
            const [usersResponse, invitesResponse] = await Promise.all([
                api.get(`/api/dept/users?dept_id=${deptId}`, reqConfig),
                api.get(`/api/invites?department_id=${deptId}`, reqConfig).catch(err => {
                    console.error("Failed to fetch invites:", err);
                    return { data: [] }; // Fallback to empty array if invites endpoint fails
                })
            ]);

            // Map standard users for Verification Tab
            const mappedVerificationData = (usersResponse.data || []).map(user => ({
                id: user.id || user.user_id,
                name: `${user.first_name || ''} ${user.last_name || ''}`,
                email: user.email,
                role: user.role || 'N/A',
                roleColor: user.role === 'ADMIN' ? 'red' : (user.role === 'FACULTY' || user.role === 'HEAD') ? 'green' : 'blue',
                department: user.department_name || user.program_name || 'N/A',
                status: user.verification_status || 'Pending',
                statusColor: getStatusColor(user.verification_status),
                date: user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A',
                tupm_id: user.tupm_id || 'N/A',
                method: 'Manual Add',
                isInvite: false,
                ...user
            }));

            // Map invites for Verification Tab
            const mappedInvitesData = (invitesResponse.data || []).map(invite => ({
                id: `invite-${invite.id}`,
                name: 'Invited User', // Placeholder name until they register
                email: invite.email,
                role: invite.role || 'FACULTY',
                roleColor: 'green',
                department: 'N/A',
                status: invite.status,
                statusColor: invite.status === 'Registered' ? 'green' : (invite.status === 'Expired' ? 'red' : 'yellow'),
                date: invite.created_at ? new Date(invite.created_at).toLocaleString() : 'N/A',
                tupm_id: 'N/A',
                method: 'Email Invite',
                isInvite: true,
                ...invite
            }));

            // Map for Directory Tab (Normalizing fields) - Only standard users
            const mappedDirectoryData = (usersResponse.data || []).map(user => ({
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

            // Combine users and invites, sort by date descending
            const combinedVerificationData = [...mappedVerificationData, ...mappedInvitesData].sort((a, b) => {
                const dateA = new Date(a.created_at || new Date(0));
                const dateB = new Date(b.created_at || new Date(0));
                return dateB - dateA;
            });

            setVerificationUsers(combinedVerificationData);
            setUsers(mappedDirectoryData);

        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                console.error("Failed to fetch users:", err);
                setVerificationError("Failed to load user data. Check backend connection.");
            }
        } finally {
            if (!signal || !signal.aborted) {
                setVerificationLoading(false);
            }
        }
    };

    // ==========================================
    // UTILITIES & DERIVED DATA
    // ==========================================
    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // ==========================================
    // INLINE INVITE HANDLER
    // ==========================================
    const handleSendInvites = async (e) => {
        e.preventDefault();
        setInviteError('');
        setInviteResult(null);

        const emailList = inviteEmails
            .split(/[\n,]+/)
            .map(email => email.trim())
            .filter(email => email !== '');

        if (emailList.length === 0) {
            setInviteError('Please enter at least one email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emailList.filter(email => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
            setInviteError(`Invalid email format: ${invalidEmails.join(', ')}`);
            return;
        }

        setIsSendingInvite(true);
        try {
            const response = await api.post('/api/invites/send', {
                emails: emailList,
                department_id: storedUser.department_id
            });
            setInviteResult(response.data.results);
            if (response.data.results.failed.length === 0) {
                setInviteEmails('');
            }
        } catch (err) {
            setInviteError(err.response?.data?.detail || 'Failed to send invitations. Please try again.');
        } finally {
            setIsSendingInvite(false);
        }
    };

    // ==========================================
    // DIRECTORY HANDLERS
    // ==========================================

    const [newUser, setNewUser] = useState({
        first_name: "", middle_name: "", last_name: "", email: "",
        password: "", confirmPassword: "", role: "FACULTY",
        employee_id: "", tupm_id: "", program_id: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Auto-uppercase name fields
        const uppercaseFields = ['first_name', 'middle_name', 'last_name'];
        const finalValue = uppercaseFields.includes(name) ? value.toUpperCase() : value;
        setNewUser(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (newUser.password !== newUser.confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        if (newUser.password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }

        try {
            const payload = {
                first_name: newUser.first_name,
                middle_name: newUser.middle_name || '-',
                last_name: newUser.last_name,
                email: newUser.email || null,
                password: newUser.password,
                role: newUser.role,
                department_id: storedUser.department_id,
            };

            // Add role-specific ID
            if (newUser.role === 'STUDENT') {
                payload.tupm_id = newUser.tupm_id;
            } else {
                payload.employee_id = newUser.employee_id;
            }

            if (newUser.program_id) {
                payload.program_id = parseInt(newUser.program_id, 10);
            }

            await api.post('/api/auth/register', payload);
            toast.success('User registered successfully.');
            setShowAddUserModal(false);
            setNewUser({
                first_name: "", middle_name: "", last_name: "", email: "",
                password: "", confirmPassword: "", role: "FACULTY",
                employee_id: "", tupm_id: "", program_id: ""
            });
            // Refresh user list
            fetchUsers(new AbortController().signal);
        } catch (err) {
            const detail = err.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : (detail?.message || 'Registration failed.');
            toast.error(msg);
        }
    };

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
            ? '/api/admin/verification/approve'
            : '/api/admin/verification/reject';

        try {
            const apiStatus = newStatus === 'Approved' ? 'Verified' : 'Rejected';

            await api.post(endpoint, {
                user_id: id,
                verification_status: apiStatus
            });

            setVerificationUsers(prev =>
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
            toast.success(`User ID ${id} set to ${apiStatus}.`);

        } catch (error) {
            console.error(`Error setting status to ${newStatus}:`, error);
            toast.error(`Failed to update status: ${error.response?.data?.error || 'Server error'}`);
        }
    };

    const deleteApplication = async (id) => {
        const confirmed = await toast.confirm("Are you sure you want to delete this user permanently?");
        if (!confirmed) return;
        try {
            await api.delete(`/api/admin/user/${id}`);
            setVerificationUsers(prev => prev.filter(app => app.id !== id));
            toast.success(`User ID ${id} deleted successfully.`);
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error(`Failed to delete user: ${error.response?.data?.error || 'Server error'}`);
        }
        setVerificationOpenMenuId(null);
    };

    const filteredVerificationUsers = verificationUsers.filter((item) => {
        const roleMatch = verificationRoleFilter === "All" || item.role === verificationRoleFilter.toUpperCase(); // Fixed: match API role case
        const statusMatch = verificationStatusFilter === "Status" || item.status === verificationStatusFilter;
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
                    <i className="fas fa-envelope-open-text" style={{ marginRight: '8px' }}></i>
                    Invitations & Requests
                </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'verification' ? (
                <div className="tab-content-verification">

                    {/* INLINE INVITE SECTION */}
                    <div className="card invite-section-card" style={{ marginBottom: '24px', padding: '24px 28px', backgroundColor: '#f4f9ff', border: '1px solid #bfdbfe', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 500px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
                                    <div style={{ backgroundColor: '#eff6ff', color: '#163269', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #bfdbfe' }}>
                                        <i className="fas fa-envelope"></i>
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', color: '#163269', margin: 0, fontWeight: '700', letterSpacing: '0.01em' }}>Invite Faculty Members</h3>
                                </div>
                                <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.6' }}>
                                    Send out unique registration links to faculty members via email to fast-track their onboarding process. Enter email addresses separated by commas or new lines.
                                </p>
                                <textarea
                                    value={inviteEmails}
                                    onChange={(e) => setInviteEmails(e.target.value)}
                                    placeholder="e.g., faculty1@tup.edu.ph, faculty2@tup.edu.ph"
                                    rows={3}
                                    style={{ width: '100%', padding: '14px', border: '1px solid #93c5fd', borderRadius: '8px', resize: 'vertical', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#ffffff', color: '#334155' }}
                                    disabled={isSendingInvite}
                                    onFocus={(e) => e.target.style.borderColor = '#163269'}
                                    onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                                />
                                {inviteError && <div style={{ color: '#dc2626', marginTop: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fee2e2', padding: '8px 12px', borderRadius: '6px' }}><i className="fas fa-exclamation-circle"></i>{inviteError}</div>}
                                {inviteResult && (
                                    <div style={{ marginTop: '16px', fontSize: '0.95rem', padding: '16px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        {inviteResult.sent.length > 0 && <div style={{ color: '#059669', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fas fa-check-circle"></i><strong>Successfully Sent To:</strong> <span style={{ color: '#334155' }}>{inviteResult.sent.join(', ')}</span></div>}
                                        {inviteResult.failed.length > 0 && (
                                            <div style={{ color: '#dc2626' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fas fa-times-circle"></i><strong>Failed:</strong></div>
                                                <ul style={{ margin: '8px 0 0 24px', padding: 0, color: '#475569' }}>
                                                    {inviteResult.failed.map((f, i) => <li key={i}><strong>{f.email}</strong> <span style={{ color: '#64748b' }}>- {f.reason}</span></li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '180px', marginTop: '10px' }}>
                                <button
                                    onClick={handleSendInvites}
                                    disabled={isSendingInvite || inviteEmails.trim() === ''}
                                    style={{ padding: '12px 20px', background: '#163269', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', fontWeight: '500', transition: 'background-color 0.2s, opacity 0.2s', opacity: (isSendingInvite || inviteEmails.trim() === '') ? 0.6 : 1, boxShadow: '0 4px 6px -1px rgba(22, 50, 105, 0.1)' }}
                                    onMouseEnter={(e) => { if (!isSendingInvite && inviteEmails.trim() !== '') e.target.style.background = '#1e3a8a' }}
                                    onMouseLeave={(e) => { if (!isSendingInvite && inviteEmails.trim() !== '') e.target.style.background = '#163269' }}
                                >
                                    <i className={isSendingInvite ? "fas fa-circle-notch fa-spin" : "fas fa-paper-plane"}></i>
                                    {isSendingInvite ? 'Sending...' : 'Send Invites'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* VERIFICATION CONTENT */}
                    <div className="app-filter-bar">
                        <div className="app-filter-left">
                            <select className="app-filter-select" value={verificationRoleFilter} onChange={(e) => setVerificationRoleFilter(e.target.value)}>
                                <option>All</option>
                                <option>Faculty</option>
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
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowAddUserModal(true)}
                                style={{ padding: '8px 16px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                onMouseEnter={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#94a3b8'; }}
                                onMouseLeave={(e) => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#cbd5e1'; }}
                            >
                                <i className="fas fa-user-plus"></i> Manual Add
                            </button>
                            <button className="refresh-button" onClick={() => fetchUsers()} title="Refresh List" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>

                    {verificationLoading ? (
                        <div className="loading-spinner">Loading Applications...</div>
                    ) : verificationError ? (
                        <div className="error-message">{verificationError}</div>
                    ) : (
                        <div className="card app-list-card">
                            <div className="app-list-header">
                                <h2>Pending Requests & Invited Faculty ({filteredVerificationUsers.length})</h2>
                                <p>Action required: {verificationUsers.filter(a => a.status === 'Pending').length}</p>
                            </div>

                            <div className="table-responsive">
                                <table className="user-table">
                                    <thead>
                                        <tr>
                                            <th>Email / Name</th>
                                            <th>Method</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Date Registered / Invited</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVerificationUsers.map((app) => (
                                            <tr key={app.id || app.email} className="user-row" onClick={() => setVerificationModalUser(app)}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <div className="user-table-avatar">{(app.role && app.role[0]) ? app.role[0].toUpperCase() : '?'}</div>
                                                        <div>
                                                            <span className="user-table-name" style={{ fontWeight: app.isInvite ? 'normal' : '500', fontStyle: app.isInvite ? 'italic' : 'normal', color: app.name === 'Invited User' ? '#64748b' : 'inherit' }}>{app.name}</span>
                                                            <span className="user-table-email">{app.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        backgroundColor: app.isInvite ? '#f0f9ff' : '#f8fafc',
                                                        color: app.isInvite ? '#0284c7' : '#64748b',
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', border: `1px solid ${app.isInvite ? '#bae6fd' : '#cbd5e1'}`,
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                    }}>
                                                        <i className={app.isInvite ? "fas fa-envelope" : "fas fa-user-plus"}></i>
                                                        {app.method}
                                                    </span>
                                                </td>
                                                <td><span className={`role-tag ${app.roleColor}`}>{app.role}</span></td>
                                                <td><span className={`status-tag ${app.statusColor}`}>{app.status}</span></td>
                                                <td>{app.date}</td>
                                                <td className="actions-cell">
                                                    <div className="dropdown-container">
                                                        <button
                                                            className="action-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Don't show dropdown for invites, only full users
                                                                if (!app.isInvite) {
                                                                    setVerificationOpenMenuId(verificationOpenMenuId === app.id ? null : app.id);
                                                                }
                                                            }}
                                                            disabled={app.isInvite}
                                                            style={{ opacity: app.isInvite ? 0.3 : 1, cursor: app.isInvite ? 'default' : 'pointer' }}
                                                        >
                                                            <i className={app.isInvite ? "fas fa-clock" : "fas fa-ellipsis-h"}></i>
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
                                        {filteredVerificationUsers.length === 0 && <tr><td colSpan="6" className="td-empty-state" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No requests or invitations found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Verification Modal */}
                    {verificationModalUser && (
                        <div className="modal-backdrop" onClick={() => setVerificationModalUser(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3>{verificationModalUser.isInvite ? 'Invitation Details' : `User Details: ${verificationModalUser.name}`}</h3>
                                <div className="modal-body">
                                    <p><strong>Status:</strong> <span className={`status-tag ${verificationModalUser.statusColor}`}>{verificationModalUser.status}</span></p>
                                    <p><strong>Email:</strong> {verificationModalUser.email}</p>
                                    {!verificationModalUser.isInvite && <p><strong>TUPM ID / Employee ID:</strong> {verificationModalUser.tupm_id || verificationModalUser.employee_id || 'N/A'}</p>}
                                    <p><strong>Role:</strong> {verificationModalUser.role}</p>
                                    <p><strong>Method:</strong> {verificationModalUser.method}</p>
                                    {verificationModalUser.isInvite && <p><strong>Expiration:</strong> {verificationModalUser.date}</p>}
                                    {!verificationModalUser.isInvite && <p><strong>Date Registered:</strong> {verificationModalUser.date}</p>}
                                </div>
                                <div className="modal-actions modal-actions-flex">
                                    {/* Approve — only shown if not already verified and not an invite */}
                                    {!verificationModalUser.isInvite && verificationModalUser.status !== 'Verified' && verificationModalUser.status !== 'Approved' && (
                                        <button
                                            className="action-btn-approve"
                                            onClick={() => {
                                                handleStatusUpdate(verificationModalUser.id, 'Approved');
                                                setVerificationModalUser(null);
                                            }}
                                        >
                                            <i className="fas fa-check"></i> Approve
                                        </button>
                                    )}
                                    {/* Reject — only shown if not already rejected */}
                                    {verificationModalUser.status !== 'Rejected' && (
                                        <button
                                            className="action-btn-reject"
                                            onClick={() => {
                                                handleStatusUpdate(verificationModalUser.id, 'Rejected');
                                                setVerificationModalUser(null);
                                            }}
                                        >
                                            <i className="fas fa-times"></i> Reject
                                        </button>
                                    )}
                                    <button
                                        className="modal-close-button modal-close-auto"
                                        onClick={() => setVerificationModalUser(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* USER DIRECTORY CONTENT */}
                    <div className="user-summary-cards">
                        <div className="card user-summary-card">
                            <span className="user-summary-value">{users.filter(u => u.role === "FACULTY" || u.role === "HEAD").length}</span>
                            <span className="user-summary-title">Faculty Members</span>
                        </div>
                        <div className="card user-summary-card">
                            <span className="user-summary-value">{users.filter(u => u.role === "STUDENT").length}</span>
                            <span className="user-summary-title">Students</span>
                        </div>
                        <div className="card user-summary-card">
                            <span className="user-summary-value">{users.length}</span>
                            <span className="user-summary-title">Total Users</span>
                        </div>
                    </div>

                    <div className="card user-list-card">
                        <div className="user-list-header">
                            <h2>User Directory</h2>
                            <div className="user-list-actions">
                                <div className="user-search-bar">
                                    <i className="fas fa-search"></i>
                                    <input type="text" placeholder="Search users..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
                                </div>
                                <select className="user-role-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                                    <option>All Roles</option>
                                    <option value="FACULTY">Faculty</option>
                                    <option value="HEAD">Dept Head</option>
                                    <option value="STUDENT">Student</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-responsive">
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
                                            <tr key={index} className="user-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedDirectoryUser(user)}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <div className="user-table-avatar">{(user.role && user.role[0]) ? user.role[0].toUpperCase() : '?'}</div>
                                                        <div>
                                                            <span className="user-table-name">{user.name}</span>
                                                            <span className="user-table-email">{user.email || 'No email'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className={`role-tag ${user.roleColor}`}>{user.role}</span></td>
                                                <td>{user.department}</td>
                                                <td><span className={`status-tag ${user.statusColor}`}>{user.faceStatus}</span></td>
                                                <td>{user.lastActive}</td>
                                                <td>
                                                    <button className="action-button" onClick={(e) => { e.stopPropagation(); setSelectedDirectoryUser(user); }}>
                                                        <i className="fas fa-eye"></i>
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
                    </div>

                    {/* DIRECTORY USER DETAIL MODAL */}
                    {selectedDirectoryUser && (
                        <div className="modal-backdrop" onClick={() => setSelectedDirectoryUser(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3>User Details: {selectedDirectoryUser.name}</h3>
                                <div className="modal-body">
                                    <p><strong>Email:</strong> {selectedDirectoryUser.email || 'Not set'}</p>
                                    <p><strong>TUP-M ID:</strong> {selectedDirectoryUser.tupm_id || 'N/A'}</p>
                                    <p><strong>Employee ID:</strong> {selectedDirectoryUser.employee_id || 'N/A'}</p>
                                    <p><strong>Role:</strong> <span className={`role-tag ${selectedDirectoryUser.roleColor}`}>{selectedDirectoryUser.role}</span></p>
                                    <p><strong>Department:</strong> {selectedDirectoryUser.department}</p>
                                    <p><strong>Face Status:</strong> <span className={`status-tag ${selectedDirectoryUser.statusColor}`}>{selectedDirectoryUser.faceStatus}</span></p>
                                    <p><strong>Verification:</strong> {selectedDirectoryUser.verification_status || 'N/A'}</p>
                                    <p><strong>Last Active:</strong> {selectedDirectoryUser.lastActive}</p>
                                </div>
                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button className="modal-close-button" onClick={() => setSelectedDirectoryUser(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* REGISTER MODAL - Placed outside the tab condition so it works anywhere */}
            {showAddUserModal && <AddUserModal
                newUser={newUser}
                handleInputChange={handleInputChange}
                handleAddUser={handleAddUser}
                onClose={() => setShowAddUserModal(false)}
                departmentId={storedUser.department_id}
                toast={toast}
            />}
        </div>
    );
};

/**
 * Add User Modal — separated for clarity.
 * Fetches programs from API for the department, provides role-specific fields.
 */
const AddUserModal = ({ newUser, handleInputChange, handleAddUser, onClose, departmentId, toast }) => {
    const [programs, setPrograms] = useState([]);
    const [step, setStep] = useState(1); // Manage 2-step process

    useEffect(() => {
        const controller = new AbortController();
        if (departmentId) {
            api.get(`/api/auth/programs?department_id=${departmentId}`, { signal: controller.signal })
                .then(res => setPrograms(res.data || []))
                .catch(err => {
                    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                        console.error('Failed to fetch programs:', err);
                    }
                });
        }
        return () => controller.abort();
    }, [departmentId]);

    const handleNext = (e) => {
        e.preventDefault();
        // Check basic required fields for step 1
        if (!newUser.first_name || !newUser.last_name ||
            (newUser.role === 'STUDENT' ? !newUser.tupm_id : !newUser.employee_id)) {
            if (toast && typeof toast.error === 'function') {
                toast.error("Please fill in all required fields to continue.");
            } else {
                alert("Please fill in all required fields to continue.");
            }
            return;
        }
        setStep(2);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Final validation before submit
        if (!newUser.password || !newUser.confirmPassword) {
            if (toast && typeof toast.error === 'function') toast.error("Please fill in the password fields.");
            else alert("Please fill in the password fields.");
            return;
        }

        if (newUser.password.length < 6) {
            if (toast && typeof toast.error === 'function') toast.error("Password must be at least 6 characters.");
            else alert("Password must be at least 6 characters.");
            return;
        }

        if (newUser.password !== newUser.confirmPassword) {
            if (toast && typeof toast.error === 'function') toast.error("Passwords do not match.");
            else alert("Passwords do not match.");
            return;
        }

        handleAddUser(e);
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                {/* HEADER ROW */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', boxSizing: 'border-box' }}>
                    <h3 style={{ margin: 0, paddingBottom: 0, borderBottom: 'none', color: '#1e293b', flex: 1, whiteSpace: 'nowrap' }}>Register New User</h3>
                    <div style={{ padding: '0', margin: '0', display: 'flex', alignItems: 'flex-start' }}>
                        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer', outline: 'none', padding: '0', margin: '0' }} title="Close">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Step Indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', backgroundColor: '#163269', borderRadius: '4px' }}></div>
                    <div style={{ flex: 1, height: '4px', backgroundColor: step === 2 ? '#163269' : '#e2e8f0', borderRadius: '4px', transition: 'background-color 0.3s' }}></div>
                </div>

                <form onSubmit={handleSubmit} className="add-user-form">

                    {step === 1 && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <label>Role <span style={{ color: '#163269' }}>*</span></label>
                            <select name="role" value={newUser.role} onChange={handleInputChange}>
                                <option value="FACULTY">Faculty</option>
                                <option value="STUDENT">Student</option>
                            </select>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label>First Name <span style={{ color: '#163269' }}>*</span></label>
                                    <input type="text" name="first_name" placeholder="First Name" value={newUser.first_name} onChange={handleInputChange} required />
                                </div>
                                <div>
                                    <label>Middle Name</label>
                                    <input type="text" name="middle_name" placeholder="Middle Name" value={newUser.middle_name} onChange={handleInputChange} />
                                </div>
                            </div>

                            <label>Last Name <span style={{ color: '#163269' }}>*</span></label>
                            <input type="text" name="last_name" placeholder="Last Name" value={newUser.last_name} onChange={handleInputChange} required />

                            {newUser.role === 'STUDENT' ? (
                                <>
                                    <label>TUP-M ID <span style={{ color: '#163269' }}>*</span></label>
                                    <input type="text" name="tupm_id" placeholder="e.g. TUPM-21-1234" value={newUser.tupm_id} onChange={handleInputChange} required />
                                </>
                            ) : (
                                <>
                                    <label>Employee ID <span style={{ color: '#163269' }}>*</span></label>
                                    <input type="text" name="employee_id" placeholder="Employee ID" value={newUser.employee_id} onChange={handleInputChange} required />
                                </>
                            )}

                            <label>Email ID</label>
                            <input type="email" name="email" placeholder="user@tup.edu.ph" value={newUser.email} onChange={handleInputChange} />

                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button type="button" onClick={handleNext} style={{ flex: 1, padding: '12px', background: '#163269', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#1e3a8a'} onMouseLeave={(e) => e.target.style.background = '#163269'}>Next Step <i className="fas fa-arrow-right" style={{ marginLeft: '6px' }}></i></button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            {programs.length > 0 && (
                                <>
                                    <label>Program</label>
                                    <select name="program_id" value={newUser.program_id} onChange={handleInputChange}>
                                        <option value="">-- Select Program --</option>
                                        {programs.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                        ))}
                                    </select>
                                </>
                            )}

                            <label>Password <span style={{ color: '#163269' }}>*</span></label>
                            <input type="password" name="password" placeholder="Min. 6 characters" value={newUser.password} onChange={handleInputChange} required />

                            <label>Confirm Password <span style={{ color: '#163269' }}>*</span></label>
                            <input type="password" name="confirmPassword" placeholder="Re-enter password" value={newUser.confirmPassword} onChange={handleInputChange} required />

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#163269', border: '1px solid #163269', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(22, 50, 105, 0.05)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i> Back</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#163269', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#1e3a8a'} onMouseLeave={(e) => e.target.style.background = '#163269'}>Confirm <i className="fas fa-check" style={{ marginLeft: '6px' }}></i></button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default DeptHeadUserManagementPage;
