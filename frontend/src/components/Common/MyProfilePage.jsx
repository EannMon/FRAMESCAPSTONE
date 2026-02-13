import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
// NEW: Change Password Modal Component
// ===========================================
const PasswordModal = ({ isOpen, onClose, userId }) => {
    const [step, setStep] = useState(1); // Step 1: Verify, Step 2: New Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const modalRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Step 1: Verify Current Password
    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/api/users/verify-password', {
                user_id: userId,
                password: currentPassword
            });
            // If successful, move to step 2
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || "Incorrect Password");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Save New Password
    const handleSave = async () => {
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await axios.put('http://localhost:5000/api/users/change-password', {
                user_id: userId,
                new_password: newPassword
            });
            alert("Password Changed Successfully!");
            onClose();
        } catch (err) {
            setError("Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-box" ref={modalRef}>
                <div className="modal-header">
                    <h3>{step === 1 ? "Verify Identity" : "Create New Password"}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="error-msg">{error}</div>}

                    {step === 1 ? (
                        <div className="form-group">
                            <label>Enter Current Password</label>
                            <input
                                type="password"
                                className="modal-input"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="modal-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New password"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    className="modal-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    {step === 1 ? (
                        <button className="modal-btn primary" onClick={handleVerify} disabled={loading}>
                            {loading ? "Verifying..." : "Next"}
                        </button>
                    ) : (
                        <button className="modal-btn primary" onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Change Password"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ===========================================
// MAIN PAGE COMPONENT
// ===========================================
const MyProfilePage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();

    // --- States ---
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // Modal State

    // --- Background Refresh ---
    useEffect(() => {
        const fetchLatestData = async () => {
            if (!user) return;
            try {
                const response = await axios.get(`http://localhost:5000/api/users/${user.id || user.user_id}`);
                setUser(prev => ({ ...prev, ...response.data }));
                localStorage.setItem('currentUser', JSON.stringify(response.data));
            } catch (error) {
                console.error("Background sync failed:", error);
            }
        };
        fetchLatestData();
    }, []);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };



    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/users/${user.id || user.user_id}`, user);
            alert("Profile Updated Successfully!");
            setIsEditing(false);
            localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update profile.");
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