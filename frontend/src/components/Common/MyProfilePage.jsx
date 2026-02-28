import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './ToastProvider';
import api from '../../services/api';
import PasswordModal from './PasswordModal';
import './MyProfilePage.css';
import Header from './Header';
import './Utility.css';
import Footer from './Footer';

// ===========================================
// Reusable Form Field
// ===========================================
const ProfileField = ({ label, name, value, onChange, type = 'text', isEditing, disabled = false }) => (
    <div className="profile-field">
        <label>{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            disabled={!isEditing || disabled}
            className={isEditing && !disabled ? "profile-input-editable" : "profile-input-disabled"}
        />
    </div>
);

// ===========================================
// MAIN PAGE COMPONENT
// ===========================================
const MyProfilePage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const { user: authUser, updateUser } = useAuth();
    const toast = useToast();

    // --- States ---
    const [user, setUser] = useState(authUser);
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // Modal State

    // --- Background Refresh ---
    useEffect(() => {
        if (!user) return;
        const controller = new AbortController();

        const fetchLatestData = async () => {
            try {
                const response = await api.get(`/api/users/${user.id || user.user_id}`, { signal: controller.signal });
                setUser(prev => ({ ...prev, ...response.data }));
                updateUser(response.data);
            } catch (error) {
                if (error.code !== 'ERR_CANCELED') {
                    console.error("Background sync failed:", error);
                }
            }
        };
        fetchLatestData();
        return () => controller.abort();
    }, []);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };



    const handleSave = async () => {
        try {
            await api.put(`/api/users/${user.id || user.user_id}`, user);
            toast.success("Profile Updated Successfully!");
            setIsEditing(false);
            updateUser(user);
        } catch (error) {
            toast.error(error.userMessage || "Failed to update profile.");
        }
    };

    const handleGoBack = () => navigate(-1);

    const theme = {
        primary: '#0F172A', // Navy
        dark: '#1E293B',    // Darker Navy
        lightBg: 'rgba(255, 255, 255, 0.1)', // Light Hover
        text: '#FFFFFF'     // White Text for Header
    };

    if (!user) return <div style={{ padding: '20px' }}>Please log in again.</div>;

    // Helper: Check Role
    const isStudent = user.role?.toLowerCase() === 'student';

    return (
        <>
            {!isEmbedded && <Header theme={theme} user={user} />}

            <div className={`profile-page-container ${isEmbedded ? 'embedded' : ''}`}>
                {/* Header - Only show if NOT embedded (Back button and Title) */}
                {!isEmbedded && (
                    <div className="profile-header-bar">
                        <div className="profile-header-left">
                            <button className="profile-back-button" onClick={handleGoBack}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h1 className="profile-main-title">My Profile</h1>
                        </div>
                    </div>
                )}

                {/* Summary Card */}
                <div className="card profile-summary-card" style={{ position: 'relative' }}>

                    {/* --- MOVED: EDIT BUTTONS TO TOP RIGHT OF CARD --- */}
                    <div style={{ position: 'absolute', top: '25px', right: '25px' }}>
                        {!isEditing ? (
                            <button className="profile-edit-button" onClick={() => setIsEditing(true)}>
                                <i className="fas fa-pen"></i> Edit Profile
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="profile-cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button className="profile-save-button" onClick={handleSave}>
                                    <i className="fas fa-save"></i> Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0F172A&color=fff`}
                        alt="User Avatar"
                        className="profile-avatar"
                    />
                    <div className="profile-summary-info">
                        <h2 className="profile-name">{user.first_name || user.firstName} {user.last_name || user.lastName}</h2>
                        <p className="profile-sub-details">ID: {user.tupm_id}</p>
                        <p className="profile-sub-details">{user.department_name || user.college} - {user.program_name || user.course}</p>

                        {/* --- EDITED: CAPITALIZED STATUS --- */}
                        <div className="profile-status-tag" style={{ textTransform: 'capitalize' }}>
                            <i className="fas fa-check-circle"></i> {user.student_status || user.faculty_status || 'Active'}
                        </div>

                    </div>
                </div>

                {/* Info Grid */}
                <div className="profile-info-grid">
                    <div className="card profile-info-card">
                        <h3>Personal Information</h3>
                        <ProfileField label="First Name" name="first_name" value={user.first_name} onChange={handleChange} isEditing={isEditing} />
                        <ProfileField label="Last Name" name="last_name" value={user.last_name} onChange={handleChange} isEditing={isEditing} />
                        <ProfileField label="TUPM ID" value={user.tupm_id} disabled={true} isEditing={isEditing} />
                        <ProfileField label="Email" value={user.email} disabled={true} isEditing={isEditing} />
                        <ProfileField label="Phone" name="contact_number" value={user.contact_number || ''} onChange={handleChange} isEditing={isEditing} />
                        <ProfileField label="Birthday" name="birthday" type="date" value={user.birthday ? user.birthday.split('T')[0] : ''} onChange={handleChange} isEditing={isEditing} />
                        <div className="profile-field">
                            <label>Home Address</label>
                            <textarea name="home_address" value={user.home_address || ''} onChange={handleChange} disabled={!isEditing} className={isEditing ? "profile-input-editable" : "profile-input-disabled"} rows="3"></textarea>
                        </div>
                    </div>

                    {/* ACADEMIC INFO: Filter based on Role */}
                    <div className="card profile-info-card">
                        <h3>Academic Information</h3>
                        <ProfileField label="College" value={user.department_name} disabled={true} isEditing={isEditing} />

                        {/* Show these only if Student */}
                        {isStudent && (
                            <>
                                <ProfileField label="Course" value={user.program_name} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Year Level" value={user.year_level} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Section" value={user.section} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Term" value={user.current_term} disabled={true} isEditing={isEditing} />
                                {user.academic_advisor && <ProfileField label="Advisor" value={user.academic_advisor} disabled={true} isEditing={isEditing} />}
                                {user.gpa && <ProfileField label="GPA" value={user.gpa} disabled={true} isEditing={isEditing} />}
                            </>
                        )}

                        {/* Optional: Add specific Faculty fields here if needed */}
                        {!isStudent && user.department_name && (
                            <ProfileField label="Department" value={user.department_name} disabled={true} isEditing={isEditing} />
                        )}
                    </div>
                </div>

                {/* Emergency Contact Removed */}

                {/* Account Settings - UPDATED */}
                <div className="card profile-info-card full-width-card">
                    <h3>Account Settings</h3>
                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Password</strong>
                            <span>Secure your account</span>
                        </div>
                        {/* --- EDITED: CLICKING THIS OPENS MODAL --- */}
                        <button className="setting-button" onClick={() => setIsPasswordModalOpen(true)}>
                            <i className="fas fa-key"></i> Change Password
                        </button>
                    </div>
                </div>
            </div>

            {!isEmbedded && <Footer />}

            {/* --- ADDED: PASSWORD MODAL --- */}
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                userId={user.user_id || user.id}
            />
        </>
    );
};

export default MyProfilePage;