import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from './ToastProvider';
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
    const toast = useToast();
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

    // Step 1: Verify Current Password (skip auto-logout on 401)
    const handleVerify = async () => {
        if (!currentPassword.trim()) {
            setError('Please enter your current password');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/api/users/verify-password', {
                user_id: userId,
                password: currentPassword
            }, { skipAuthRedirect: true });
            // If successful, move to step 2
            setStep(2);
        } catch (err) {
            if (err.response?.status === 429) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.response?.data?.error?.message || err.response?.data?.error || 'Incorrect password. Please try again.');
            }
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
            await api.put('/api/users/change-password', {
                user_id: userId,
                new_password: newPassword
            });
            toast.success("Password Changed Successfully!");
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

/**
 * Derives program name from section code.
 * For example: 'BSIT-3A-M' → 'Bachelor of Science in Information Technology'
 */
const PROGRAM_MAP = {
    'BSIT': 'Bachelor of Science in Information Technology',
    'BSCPE': 'Bachelor of Science in Computer Engineering',
    'BSEE': 'Bachelor of Science in Electrical Engineering',
    'BSECE': 'Bachelor of Science in Electronics Engineering',
    'BSME': 'Bachelor of Science in Mechanical Engineering',
    'BSCE': 'Bachelor of Science in Civil Engineering',
    'BSIE': 'Bachelor of Science in Industrial Engineering',
    'BSARCH': 'Bachelor of Science in Architecture',
    'BET': 'Bachelor of Engineering Technology',
    'BSCS': 'Bachelor of Science in Computer Science',
};

const deriveProgramFromSection = (section) => {
    if (!section) return 'N/A';
    // Extract program code from section (e.g., 'BSIT-3A-M' → 'BSIT')
    const code = section.split('-')[0]?.toUpperCase();
    return PROGRAM_MAP[code] || code || 'N/A';
};

/**
 * Derives year level from section code.
 * For example: 'BSIT-3A-M' → '3rd Year'
 */
const deriveYearFromSection = (section) => {
    if (!section) return 'N/A';
    // Find the first digit after the program code
    const parts = section.split('-');
    if (parts.length >= 2) {
        const yearMatch = parts[1].match(/(\d)/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1], 10);
            const suffix = year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th';
            return `${year}${suffix} Year`;
        }
    }
    return 'N/A';
};

const MyProfilePage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const toast = useToast();

    // --- States ---
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // Modal State

    // --- Background Refresh ---
    useEffect(() => {
        const controller = new AbortController();
        const fetchLatestData = async () => {
            if (!user) return;
            try {
                const response = await api.get(`/api/users/${user.id || user.user_id}`, { signal: controller.signal });
                setUser(prev => ({ ...prev, ...response.data }));
                localStorage.setItem('currentUser', JSON.stringify(response.data));
            } catch (error) {
                if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
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
            localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update profile.");
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

                {/* Email Warning for Students */}
                {isStudent && !user.email && (
                    <div className="profile-email-warning" style={{
                        background: '#FEF3CD', border: '1px solid #FFC107', borderRadius: '8px',
                        padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <i className="fas fa-exclamation-triangle" style={{ color: '#856404' }}></i>
                        <span style={{ color: '#856404', fontSize: '0.9rem' }}>
                            Your TUP email is not set up. Please update your email in the profile below to receive notifications and enable password recovery.
                        </span>
                    </div>
                )}

                {/* Summary Card */}
                <div className="card profile-summary-card" style={{ position: 'relative' }}>
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || user.firstName || '')}+${encodeURIComponent(user.last_name || user.lastName || '')}&background=0F172A&color=fff`}
                        alt="User Avatar"
                        className="profile-avatar"
                    />
                    <div className="profile-summary-info">
                        <h2 className="profile-name">{user.first_name || user.firstName} {user.middle_name ? user.middle_name + ' ' : ''}{user.last_name || user.lastName}</h2>
                        {/* Show Employee ID for faculty/head, TUP-M ID for students */}
                        {isStudent ? (
                            <p className="profile-sub-details">TUP-M ID: {user.tupm_id || 'N/A'}</p>
                        ) : (
                            <p className="profile-sub-details">Employee ID: {user.employee_id || 'N/A'}</p>
                        )}
                        <p className="profile-sub-details">
                            {user.college_name || ''}{user.college_name && user.department_name ? ' - ' : ''}{user.department_name || ''}
                        </p>

                        <div className="profile-status-tag" style={{ textTransform: 'capitalize' }}>
                            <i className="fas fa-check-circle"></i> {user.student_status || user.faculty_status || 'Active'}
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="profile-info-grid">
                    <div className="card profile-info-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0 }}>Personal Information</h3>
                            {/* Edit button positioned in Personal Information header */}
                            {!isEditing ? (
                                <button className="profile-edit-button" onClick={() => setIsEditing(true)}>
                                    <i className="fas fa-pen"></i> Edit
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="profile-cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button className="profile-save-button" onClick={handleSave}>
                                        <i className="fas fa-save"></i> Save
                                    </button>
                                </div>
                            )}
                        </div>
                        <ProfileField label="First Name" name="first_name" value={user.first_name} onChange={handleChange} isEditing={isEditing} />
                        <ProfileField label="Middle Name" name="middle_name" value={user.middle_name} onChange={handleChange} isEditing={isEditing} />
                        <ProfileField label="Last Name" name="last_name" value={user.last_name} onChange={handleChange} isEditing={isEditing} />
                        {/* Show the correct ID field based on role */}
                        {isStudent ? (
                            <ProfileField label="TUP-M ID" value={user.tupm_id} disabled={true} isEditing={isEditing} />
                        ) : (
                            <ProfileField label="Employee ID" value={user.employee_id} disabled={true} isEditing={isEditing} />
                        )}
                        <ProfileField label="Email" name="email" value={user.email} onChange={handleChange} isEditing={isStudent && isEditing} disabled={!isStudent} />
                    </div>

                    {/* ACADEMIC INFO: Enriched with college, program, year extraction */}
                    <div className="card profile-info-card">
                        <h3>Academic Information</h3>
                        <ProfileField label="College" value={user.college_name || user.department_name || 'N/A'} disabled={true} isEditing={isEditing} />
                        <ProfileField label="Department" value={user.department_name || 'N/A'} disabled={true} isEditing={isEditing} />

                        {/* Student-specific academic fields */}
                        {isStudent && (
                            <>
                                <ProfileField label="Course / Program" value={user.program_name || deriveProgramFromSection(user.section)} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Year Level" value={deriveYearFromSection(user.section)} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Section" value={user.section} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Academic Year" value={user.academic_year || 'N/A'} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Semester" value={user.semester || 'N/A'} disabled={true} isEditing={isEditing} />
                            </>
                        )}

                        {/* Faculty/Head: show programs under their department */}
                        {!isStudent && (
                            <>
                                <ProfileField label="Programs" value={user.programs_list || user.program_name || 'N/A'} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Academic Year" value={user.academic_year || 'N/A'} disabled={true} isEditing={isEditing} />
                                <ProfileField label="Semester" value={user.semester || 'N/A'} disabled={true} isEditing={isEditing} />
                            </>
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