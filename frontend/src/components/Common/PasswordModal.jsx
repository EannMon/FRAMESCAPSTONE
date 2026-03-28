import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useToast } from './ToastProvider';

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
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            console.log("AUTH | Attempting password change for userId:", userId);
            await api.put('/api/users/change-password', {
                user_id: userId,
                new_password: newPassword
            });
            toast.success("Password Changed Successfully!");
            onClose();
        } catch (err) {
            console.error("AUTH | Password Update Error:", err);
            let detailedError = "";

            if (err.response) {
                // The server responded with a status code other than 2xx
                detailedError = err.response.data?.detail?.error?.message ||
                    err.response.data?.error?.message ||
                    err.response.data?.detail ||
                    "Server error. Please check backend logs.";
            } else if (err.request) {
                // The request was made but no response was received
                detailedError = "Cannot connect to server. Please check if backend is running.";
            } else {
                // Something else happened
                detailedError = err.message;
            }

            setError("Failed to update password: " + detailedError);
            alert("Error: " + detailedError + "\n\nTip: If you continue to see old errors, please reload the page (Ctrl+F5).");
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

export default PasswordModal;
