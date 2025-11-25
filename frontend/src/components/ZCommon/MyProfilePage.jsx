import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './MyProfilePage.css'; // New CSS file for this page
import LoggedInHeader from './LoggedInHeader'; // Import the universal header
import '../ZCommon/Utility.css';
import Footer from './Footer'; // <-- 1. IMPORT FOOTER
// ===========================================
// Reusable Read-only Form Field
// ===========================================
const ProfileField = ({ label, value, type = 'text' }) => (
    <div className="profile-field">
        <label>{label}</label>
        <input type={type} value={value} disabled className="profile-input-disabled" />
    </div>
);

// --- Mock Theme & User for Header ---
// Since this page isn't nested, we define a mock theme/user
// We use RED to match the "Edit Profile" button
const redTheme = {
    primary: '#A62525',
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};
const mockUser = {
    name: 'Michael Chen',
    avatar: 'https://placehold.co/100x100/e0e0e0/333?text=MC',
    notifications: 3
};


// ===========================================
// Main My Profile Page Component
// ===========================================
const MyProfilePage = () => {
    // --- EDITED: Setup navigation ---
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate(-1); // This goes back one step in history
    };

    // Mock data based on the image
    const user = {
        name: "Michael Chen",
        id: "2024001",
        program: "Computer Science - 2nd Year",
        status: "Active Student",
        avatar: "https://placehold.co/100x100/e0e0e0/333?text=MC", // Placeholder avatar
        personal: {
            fullName: "Michael Chen",
            studentId: "2024001",
            email: "michael.chen@student.edu",
            phone: "+1 (555) 123-4567",
            dob: "2002-03-15", // HTML date inputs need YYYY-MM-DD
            address: "123 University Avenue, Campus City, State 12345"
        },
        academic: {
            program: "Bachelor of Engineering",
            major: "Computer Science",
            year: "2nd Year",
            expectedGrad: "May 2026",
            gpa: "3.75",
            advisor: "Dr. Sarah Johnson"
        },
        emergency: {
            name: "Jennifer Chen",
            relationship: "Mother",
            phone: "+1 (555) 987-6543",
            email: "jennifer.chen@email.com"
        }
    };

    return (
        // --- EDITED: Wrapped in React.Fragment ---
        <>
            <LoggedInHeader theme={redTheme} user={mockUser} />
            <div className="profile-page-container">
                {/* Top Header Bar */}
                <div className="profile-header-bar">
                    {/* --- EDITED: Added Back button and left-side wrapper --- */}
                    <div className="profile-header-left">
                        <button className="profile-back-button" onClick={handleGoBack}>
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h1 className="profile-main-title">My Profile</h1>
                    </div>
                    <button className="profile-edit-button">
                        <i className="fas fa-pen"></i> Edit Profile
                    </button>
                </div>

                {/* User Summary Card */}
                <div className="card profile-summary-card">
                    <img src={user.avatar} alt="User Avatar" className="profile-avatar" />
                    <div className="profile-summary-info">
                        <h2 className="profile-name">{user.name}</h2>
                        <p className="profile-sub-details">Student ID: {user.id}</p>
                        <p className="profile-sub-details">{user.program}</p>
                        <div className="profile-status-tag">
                            <i className="fas fa-check-circle"></i> {user.status}
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="profile-info-grid">
                    {/* Personal Information Card */}
                    <div className="card profile-info-card">
                        <h3>Personal Information</h3>
                        <ProfileField label="Full Name" value={user.personal.fullName} />
                        <ProfileField label="Student ID" value={user.personal.studentId} />
                        <ProfileField label="Email" value={user.personal.email} type="email" />
                        <ProfileField label="Phone" value={user.personal.phone} type="tel" />
                        <ProfileField label="Date of Birth" value={user.personal.dob} type="date" />
                        <div className="profile-field">
                            <label>Address</label>
                            <textarea value={user.personal.address} disabled className="profile-input-disabled" rows="3"></textarea>
                        </div>
                    </div>

                    {/* Academic Information Card */}
                    <div className="card profile-info-card">
                        <h3>Academic Information</h3>
                        <ProfileField label="Program" value={user.academic.program} />
                        <ProfileField label="Major" value={user.academic.major} />
                        <ProfileField label="Year" value={user.academic.year} />
                        <ProfileField label="Expected Graduation" value={user.academic.expectedGrad} />
                        <ProfileField label="GPA" value={user.academic.gpa} />
                        <ProfileField label="Academic Advisor" value={user.academic.advisor} />
                    </div>
                </div>

                {/* Emergency Contact Card */}
                <div className="card profile-info-card full-width-card">
                    <h3>Emergency Contact</h3>
                    <div className="profile-info-grid"> {/* Nested grid */}
                        <ProfileField label="Contact Name" value={user.emergency.name} />
                        <ProfileField label="Relationship" value={user.emergency.relationship} />
                        <ProfileField label="Phone Number" value={user.emergency.phone} />
                        <ProfileField label="Email" value={user.emergency.email} />
                    </div>
                </div>

                {/* Account Settings Card */}
                <div className="card profile-info-card full-width-card">
                    <h3>Account Settings</h3>
                    
                    {/* Setting Row 1 */}
                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Password</strong>
                            <span>Last changed 30 days ago</span>
                        </div>
                        <button className="setting-button">
                            <i className="fas fa-key"></i> Change Password
                        </button>
                    </div>
                    
                    {/* Setting Row 2 */}
                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Two-Factor Authentication</strong>
                            <span>Add an extra layer of security</span>
                        </div>
                        <button className="setting-button">
                            <i className="fas fa-shield-alt"></i> Enable 2FA
                        </button>
                    </div>

                    {/* Setting Row 3 */}
                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Privacy Settings</strong>
                            <span>Control who can see your information</span>
                        </div>
                        <button className="setting-button">
                            <i className="fas fa-user-secret"></i> Manage Privacy
                        </button>
                    </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="profile-action-buttons">
                    <button className="profile-cancel-button">
                        <i className="fas fa-times"></i> Cancel
                    </button>
                    <button className="profile-save-button">
                        <i className="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
            <Footer /> {/* 2. ADD FOOTER HERE */}
        </>
    );
};

export default MyProfilePage;