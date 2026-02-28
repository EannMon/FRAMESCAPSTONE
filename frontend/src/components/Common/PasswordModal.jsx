import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

/**
 * Change Password Modal — extracted from MyProfilePage
 * to keep the parent page under the 300-line limit.
 *
 * Step 1: Verify current password
 * Step 2: Set + confirm new password
 */
const PasswordModal = ({ isOpen, onClose, userId }) => {
    const [step, setStep] = useState(1);
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
            await api.post('/api/users/verify-password', {
                user_id: userId,
                password: currentPassword,
            });
            setStep(2);
        } catch (err) {
            setError(err.userMessage || 'Incorrect password.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Save New Password
    const handleSave = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.put('/api/users/change-password', {
                user_id: userId,
                new_password: newPassword,
            });
            alert('Password Changed Successfully!');
            onClose();
        } catch (err) {
            setError(err.userMessage || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-box" ref={modalRef}>
                <div className="modal-header">
                    <h3>{step === 1 ? 'Verify Identity' : 'Create New Password'}</h3>
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
                            {loading ? 'Verifying...' : 'Next'}
                        </button>
                    ) : (
                        <button className="modal-btn primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Change Password'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;
