import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import api from '../../services/api';
import UserVerificationTab from './UserVerificationTab';
import UserDirectoryTab from './UserDirectoryTab';
import UserProfilePanel from './UserProfilePanel';
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
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('directory');

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
        const controller = new AbortController();
        fetchUsers(controller.signal);
        return () => controller.abort();
    }, [activeTab]);

    // ==========================================
    // SHARED FETCH HANDLER
    // ==========================================
    const fetchUsers = async (signal) => {
        setVerificationLoading(true);
        setVerificationError(null);
        try {
            const response = await api.get('/api/admin/verification/list', { signal });

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
            if (err.code !== 'ERR_CANCELED') {
                setVerificationError(err.userMessage || "Failed to load user data.");
            }
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
        if (!selectedUserForSummary) {
            setSummarySchedule([]);
            return;
        }
        const controller = new AbortController();
        const uid = selectedUserForSummary.id || selectedUserForSummary.user_id;
        setSummaryScheduleLoading(true);
        api.get(`/api/dept/user-schedule/${uid}`, { signal: controller.signal })
            .then(res => setSummarySchedule(res.data || []))
            .catch(err => {
                if (err.code !== 'ERR_CANCELED') setSummarySchedule([]);
            })
            .finally(() => setSummaryScheduleLoading(false));
        return () => controller.abort();
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
            ? '/api/admin/verification/approve'
            : '/api/admin/verification/reject';

        try {
            const apiStatus = newStatus === 'Approved' ? 'Verified' : 'Rejected';

            await api.post(endpoint, {
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
            alert(error.userMessage || `Failed to update status.`);
        }
    };

    const deleteApplication = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user permanently?")) return;
        try {
            await api.delete(`/api/admin/user/${id}`);
            setVerificationUsers(prev => prev.filter(app => app.id !== id));
            alert(`User ID ${id} deleted.`);
        } catch (error) {
            alert(error.userMessage || "Failed to delete user.");
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
                <UserVerificationTab
                    filteredVerificationUsers={filteredVerificationUsers}
                    verificationUsers={verificationUsers}
                    verificationLoading={verificationLoading}
                    verificationError={verificationError}
                    verificationRoleFilter={verificationRoleFilter}
                    setVerificationRoleFilter={setVerificationRoleFilter}
                    verificationStatusFilter={verificationStatusFilter}
                    setVerificationStatusFilter={setVerificationStatusFilter}
                    verificationSearch={verificationSearch}
                    setVerificationSearch={setVerificationSearch}
                    verificationOpenMenuId={verificationOpenMenuId}
                    setVerificationOpenMenuId={setVerificationOpenMenuId}
                    verificationModalUser={verificationModalUser}
                    setVerificationModalUser={setVerificationModalUser}
                    handleStatusUpdate={handleStatusUpdate}
                    deleteApplication={deleteApplication}
                    onRefresh={fetchUsers}
                />
            ) : (
                <UserDirectoryTab
                    users={users}
                    filteredUsers={filteredUsers}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    showAddUserModal={showAddUserModal}
                    setShowAddUserModal={setShowAddUserModal}
                    onSelectUser={setSelectedUserForSummary}
                />
            )}

            {/* SLIDE-UP PROFILE PANEL (extracted) */}
            <UserProfilePanel
                selectedUser={selectedUserForSummary}
                isPanelClosing={isPanelClosing}
                onClose={closePanel}
                summarySchedule={summarySchedule}
                summaryScheduleLoading={summaryScheduleLoading}
            />
        </div>
    );
};

export default DeptHeadUserManagementPage;