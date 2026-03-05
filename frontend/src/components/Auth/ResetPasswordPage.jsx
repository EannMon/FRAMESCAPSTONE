import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ResetPasswordPage.css';

/**
 * ResetPasswordPage — Standalone page for resetting password via email link.
 * URL: /reset-password?token=<jwt_reset_token>
 *
 * Validates the token, accepts a new password, and calls the reset endpoint.
 */
const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);

    // Redirect if no token is present
    useEffect(() => {
        if (!token) {
            setIsError(true);
            setMessage('Invalid or missing reset link. Please request a new password reset.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Client-side validation
        if (newPassword.length < 8) {
            setMessage('Password must be at least 8 characters.');
            setIsError(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match.');
            setIsError(true);
            return;
        }

        setIsSubmitting(true);
        setMessage('');
        setIsError(false);

        try {
            const response = await api.post('/api/auth/reset-password', {
                token,
                new_password: newPassword,
            });
            setIsSuccess(true);
            setMessage(response.data.message || 'Password has been reset successfully!');
        } catch (err) {
            setIsError(true);
            const detail = err.response?.data?.detail;
            if (detail?.error?.message) {
                setMessage(detail.error.message);
            } else if (typeof detail === 'string') {
                setMessage(detail);
            } else {
                setMessage('Failed to reset password. The link may have expired. Please request a new one.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="reset-password-page">
            <div className="reset-password-card">
                <div className="reset-password-header">
                    <h1 className="reset-brand">FRA<span className="reset-brand-accent">MES</span></h1>
                    <p className="reset-subtitle">Smart Campus Management System</p>
                </div>

                <div className="reset-password-body">
                    <h2>{isSuccess ? 'Password Reset!' : 'Reset Your Password'}</h2>

                    {message && (
                        <div className={`reset-message ${isSuccess ? 'success' : ''} ${isError ? 'error' : ''}`}>
                            <i className={`fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                            {message}
                        </div>
                    )}

                    {isSuccess ? (
                        <div className="reset-success-actions">
                            <p>You can now log in with your new password.</p>
                            <button onClick={() => navigate('/')} className="reset-submit-btn">
                                <i className="fas fa-sign-in-alt"></i> Go to Login
                            </button>
                        </div>
                    ) : !isError || token ? (
                        <form onSubmit={handleSubmit}>
                            <div className="reset-form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className="reset-password-input-wrapper">
                                    <input
                                        id="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter new password (min 8 chars)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={8}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="reset-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="reset-form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={8}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="reset-submit-btn"
                                disabled={isSubmitting || !token}
                            >
                                {isSubmitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Resetting...</>
                                ) : (
                                    <><i className="fas fa-lock"></i> Reset Password</>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="reset-success-actions">
                            <button onClick={() => navigate('/')} className="reset-submit-btn">
                                <i className="fas fa-arrow-left"></i> Back to Home
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
