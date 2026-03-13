import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
import '../LandingPage/RegistrationPage.css';

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
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    const [formError, setFormError] = useState('');

    // Pre-validate token existence
    useEffect(() => {
        if (searchParams.get('preview') === 'true') {
            setIsError(false);
            setMessage('');
            return;
        }
        if (!token) {
            setIsError(true);
            setMessage('Invalid or missing reset link. Please request a new password reset.');
        }
    }, [token, searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Client-side validation
        if (newPassword.length < 8) {
            setFormError('Password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');
        setMessage('');

        try {
            const response = await api.post('/api/auth/reset-password', {
                token,
                new_password: newPassword,
            }, {
                skipAuthRedirect: true
            });
            setIsSuccess(true);
            setMessage(response.data.message || 'Password has been reset successfully!');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (detail?.error?.message) {
                setFormError(detail.error.message);
            } else if (typeof detail === 'string') {
                setFormError(detail);
            } else {
                setFormError('Failed to reset password. The link may have expired. Please request a new one.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isError || (!token && searchParams.get('preview') !== 'true' && !isSuccess)) {
        return (
            <div className="registration-page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header user={null} />
                <div className="registration-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                    <div className="form-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '16px', textAlign: 'center', padding: '50px 40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#dc2626' }}></i>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Invalid Request</h2>
                        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.05rem' }}>{message}</p>
                        <button onClick={() => navigate('/')} style={{ backgroundColor: '#1e293b', color: 'white', padding: '14px 32px', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}>
                            Return to Login Page
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="registration-page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header user={null} />
                <div className="registration-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                    <div className="form-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '16px', textAlign: 'center', padding: '50px 40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                            <i className="fas fa-check" style={{ fontSize: '2.5rem', color: '#16a34a' }}></i>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Password Reset!</h2>
                        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.05rem' }}>
                            {message || 'Your password has been securely updated. You can now log into the FRAMES system.'}
                        </p>
                        <button onClick={() => navigate('/')} style={{ backgroundColor: '#0F172A', color: 'white', padding: '14px 32px', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}>
                            Proceed to Login
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="registration-page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header user={null} />
            <div className="registration-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div className="form-card" style={{ width: '100%', maxWidth: '700px', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: 0 }}>

                    {/* Header Section */}
                    <div style={{ backgroundColor: '#0F172A', color: 'white', padding: '40px 30px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '1.8rem' }}>
                            <i className="fas fa-key"></i>
                        </div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', fontWeight: '700', letterSpacing: '0.01em' }}>Reset Password</h2>
                        <p style={{ margin: 0, color: '#bfdbfe', fontSize: '1.05rem', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
                            Create a strong, secure password for your FRAMES account
                        </p>
                    </div>

                    {/* Form Section */}
                    <div style={{ padding: '40px 40px 50px 40px' }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-lock" style={{ color: '#0F172A' }}></i> New Security Setup
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>New Password <span style={{ color: '#0F172A' }}>*</span></label>
                                            <div className="reg-password-wrapper">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Min. 8 characters"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    style={{ borderColor: '#cbd5e1' }}
                                                />
                                                <button type="button" className="reg-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                                    <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>Confirm Password <span style={{ color: '#0F172A' }}>*</span></label>
                                            <div className="reg-password-wrapper">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder="Retype password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    style={{ borderColor: '#cbd5e1' }}
                                                />
                                                <button type="button" className="reg-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                    <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {formError && <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginTop: '30px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-exclamation-circle"></i> {formError}
                            </div>}

                            <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
                                <button type="submit" disabled={isSubmitting && searchParams.get('preview') !== 'true'} style={{ backgroundColor: '#0F172A', color: 'white', padding: '14px 32px', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)' }} onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(15, 23, 42, 0.3)'; }} onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(15, 23, 42, 0.2)'; }}>
                                    {isSubmitting ? <><i className="fas fa-circle-notch fa-spin"></i> Processing...</> : <><i className="fas fa-key"></i> Set Password</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResetPasswordPage;
