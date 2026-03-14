import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
import '../LandingPage/LandingPage.css';
import '../LandingPage/RegistrationPage.css';

const FacultyInviteRegistrationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    const [isValidating, setIsValidating] = useState(true);
    const [inviteInfo, setInviteInfo] = useState(null);
    const [inviteError, setInviteError] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        employeeId: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setInviteError('Invalid or missing invitation token.');
            setIsValidating(false);
            return;
        }

        const validateToken = async () => {
            try {
                const response = await api.get(`/api/invites/validate?token=${token}`);
                if (response.data.valid) {
                    setInviteInfo(response.data);
                } else {
                    setInviteError(response.data.message || 'Invitation is invalid or has expired.');
                }
            } catch (err) {
                setInviteError('Failed to validate invitation. Please try again later.');
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token, queryParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const upperCaseFields = ['firstName', 'lastName', 'middleName'];

        let finalValue = value;
        if (upperCaseFields.includes(name)) {
            finalValue = value.toUpperCase();
        } else if (name === 'employeeId') {
            finalValue = value.replace(/\D/g, ''); // Numbers only
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }

        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
        if (!strongPasswordRegex.test(formData.password)) {
            setFormError('Password must be 8-15 characters long, include at least one uppercase letter, one number, and one special character.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');

        try {
            await api.post(`/api/auth/register-invited?token=${token}`, {
                email: inviteInfo.email,
                password: formData.password,
                employee_id: formData.employeeId,
                role: 'FACULTY',
                first_name: formData.firstName,
                last_name: formData.lastName,
                middle_name: formData.middleName || null,
                department_id: inviteInfo.department_id
            });
            setRegistrationSuccess(true);
        } catch (err) {
            setFormError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidating) {
        return (
            <div className="registration-page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header user={null} />
                <div className="registration-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                    <div className="form-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '16px', textAlign: 'center', padding: '50px 40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#0F172A', marginBottom: '20px' }}></i>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', marginBottom: '10px' }}>Validating Invitation</h2>
                        <p style={{ color: '#64748b', margin: 0 }}>Please wait while we verify your secure token...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (registrationSuccess) {
        return (
            <div className="registration-page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header user={null} />
                <div className="registration-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                    <div className="form-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '16px', textAlign: 'center', padding: '50px 40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                            <i className="fas fa-check" style={{ fontSize: '2.5rem', color: '#16a34a' }}></i>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Registration Successful!</h2>
                        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.05rem' }}>
                            Your faculty account has been created and verified. You can now securely log in to the FRAMES system.
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

    if (inviteError) {
        return (
            <div className="registration-page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header user={null} />
                <div className="registration-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                    <div className="form-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '16px', textAlign: 'center', padding: '50px 40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#dc2626' }}></i>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Invalid Invitation</h2>
                        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.05rem' }}>{inviteError}</p>
                        <button onClick={() => navigate('/')} style={{ backgroundColor: '#1e293b', color: 'white', padding: '14px 32px', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}>
                            Return to Login Page
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
                            <i className="fas fa-chalkboard-teacher"></i>
                        </div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', fontWeight: '700', letterSpacing: '0.01em' }}>Faculty Registration</h2>
                        <p style={{ margin: 0, color: '#bfdbfe', fontSize: '1.05rem', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
                            Complete your profile to join <strong>{inviteInfo.department_name}</strong>
                        </p>
                    </div>

                    {/* Form Section */}
                    <div style={{ padding: '40px 40px 50px 40px' }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>

                                {/* Section 1: Pre-filled Info */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-info-circle" style={{ color: '#0F172A' }}></i> Invitation Details
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#64748b' }}>Email</label>
                                            <input type="text" value={inviteInfo.email} disabled style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' }} />
                                        </div>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#64748b' }}>Department</label>
                                            <input type="text" value={inviteInfo.department_name} disabled style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Personal Profile */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-user" style={{ color: '#0F172A' }}></i> Personal Information
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>First Name <span style={{ color: '#0F172A' }}>*</span></label>
                                            <input type="text" name="firstName" placeholder="JUAN" value={formData.firstName} onChange={handleInputChange} required style={{ borderColor: '#cbd5e1' }} />
                                        </div>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>Last Name <span style={{ color: '#0F172A' }}>*</span></label>
                                            <input type="text" name="lastName" placeholder="DELA CRUZ" value={formData.lastName} onChange={handleInputChange} required style={{ borderColor: '#cbd5e1' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>Middle Name</label>
                                            <input type="text" name="middleName" placeholder="Leave blank if none" value={formData.middleName} onChange={handleInputChange} style={{ borderColor: '#cbd5e1' }} />
                                        </div>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>Employee ID <span style={{ color: '#0F172A' }}>*</span></label>
                                            <input type="text" name="employeeId" placeholder="e.g. 123456" value={formData.employeeId} onChange={handleInputChange} required maxLength="20" style={{ borderColor: '#cbd5e1' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Security */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-lock" style={{ color: '#0F172A' }}></i> Security Setup
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>Password <span style={{ color: '#0F172A' }}>*</span></label>
                                            <div className="reg-password-wrapper">
                                                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleInputChange} required style={{ borderColor: '#cbd5e1' }} />
                                                <button type="button" className="reg-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                                    <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                                                Password must be 8-15 characters long and include at least:
                                                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                                    <li>One uppercase letter</li>
                                                    <li>One number</li>
                                                    <li>One special character (e.g., @$!%*?&)</li>
                                                </ul>
                                            </div>                                        </div>
                                        <div className="reg-form-group">
                                            <label style={{ color: '#334155' }}>Confirm Password <span style={{ color: '#0F172A' }}>*</span></label>
                                            <div className="reg-password-wrapper">
                                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Retype password" value={formData.confirmPassword} onChange={handleInputChange} required style={{ borderColor: '#cbd5e1' }} />
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
                                <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#0F172A', color: 'white', padding: '14px 32px', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(22, 50, 105, 0.2)' }} onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(22, 50, 105, 0.3)'; }} onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(22, 50, 105, 0.2)'; }}>
                                    {isSubmitting ? <><i className="fas fa-circle-notch fa-spin"></i> Processing...</> : <><i className="fas fa-user-check"></i> Complete Registration</>}
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

export default FacultyInviteRegistrationPage;
