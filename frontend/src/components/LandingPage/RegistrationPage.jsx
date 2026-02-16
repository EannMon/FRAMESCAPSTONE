import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';
import './RegistrationPage.css';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

const RegistrationPage = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Status query (pending / rejected redirect)
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('s');

    // Redirect invalid roles
    useEffect(() => {
        if (role !== 'student' && role !== 'faculty') {
            if (!status) navigate('/');
        }
    }, [role, navigate, status]);

    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showRetypePassword, setShowRetypePassword] = useState(false);

    // Validation & Alert
    const [errors, setErrors] = useState({});
    const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '', type: 'error' });

    const showAlert = (title, message, type = 'error') => {
        setAlertConfig({ show: true, title, message, type });
    };
    const closeAlert = () => {
        setAlertConfig({ ...alertConfig, show: false });
    };

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        tupmYear: '',
        tupmSerial: '',
        email: '',
    });

    // Scroll top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const handleInputChange = (field, value) => {
        if (['tupmYear', 'tupmSerial'].includes(field)) {
            if (value && !/^\d*$/.test(value)) return;
        }
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const validateStep = (currentStep) => {
        const newErrors = {};
        if (currentStep === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = true;
            if (!formData.lastName.trim()) newErrors.lastName = true;
            if (!formData.email.trim()) newErrors.email = true;
            if (!formData.tupmYear.trim()) newErrors.tupmYear = true;
            if (!formData.tupmSerial.trim()) newErrors.tupmSerial = true;
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(prev => prev - 1);
        else navigate('/');
    };

    const handleFinish = async () => {
        if (password !== retypePassword || password.length < 6) {
            showAlert("Invalid Password", "Passwords must match and be at least 6 characters long.", "warning");
            return;
        }

        try {
            const payload = {
                email: formData.email,
                password: password,
                tupm_id: `TUPM-${formData.tupmYear}-${formData.tupmSerial}`,
                role: role.toUpperCase(),
                first_name: formData.firstName,
                last_name: formData.lastName,
                middle_name: formData.middleName || null,
                department_id: null,
                program_id: null,
            };

            const response = await axios.post('http://localhost:5000/api/auth/register', payload);
            if (response.data.message) {
                navigate('/register/status?s=pending');
            }
        } catch (error) {
            console.error("Error registering:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
            if (errorMsg.includes("already exists")) {
                showAlert("Registration Failed", "Email or TUPM ID already exists.", "error");
            } else {
                showAlert("Registration Failed", errorMsg, "error");
            }
        }
    };

    // --- Status page (pending / rejected) ---
    if (status) {
        let title, message, iconClass, iconColor;
        if (status === 'pending') {
            title = "Verification Pending";
            message = "Thank you for registering! Your account is currently under review. You will be notified once verified.";
            iconClass = "fas fa-user-clock";
            iconColor = "#f59e0b";
        } else if (status === 'rejected') {
            title = "Access Denied";
            message = "Your registration was rejected. Please contact the administrator for details.";
            iconClass = "fas fa-times-circle";
            iconColor = "#dc3545";
        } else {
            title = "Invalid Status";
            message = "An unexpected error occurred.";
            iconClass = "fas fa-exclamation-triangle";
            iconColor = "#6c757d";
        }

        return (
            <div className="registration-page-wrapper">
                <Header user={null} setPanel={() => navigate('/')} />
                <div className="registration-container" style={{ paddingTop: '40px' }}>
                    <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
                        <i className={iconClass} style={{ fontSize: '3em', color: iconColor, marginBottom: '20px' }}></i>
                        <h2>{title}</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>{message}</p>
                        <button onClick={() => navigate('/')} className="reg-submit-button">
                            Return to Login
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Registration Form ---
    return (
        <div className="registration-page-wrapper">
            <Header user={null} setPanel={() => navigate('/')} />

            <div className="registration-container">

                {/* Alert Overlay */}
                {alertConfig.show && (
                    <div className="custom-alert-overlay" onClick={closeAlert}>
                        <div className="custom-alert-box" onClick={e => e.stopPropagation()}>
                            <div className={`custom-alert-icon ${alertConfig.type}`}>
                                {alertConfig.type === 'success' && '✅'}
                                {alertConfig.type === 'error' && '❌'}
                                {alertConfig.type === 'warning' && '⚠️'}
                            </div>
                            <h3 className="custom-alert-title">{alertConfig.title}</h3>
                            <p className="custom-alert-message">{alertConfig.message}</p>
                            <button className="custom-alert-close-btn" onClick={closeAlert}>Close</button>
                        </div>
                    </div>
                )}

                <div className="form-card">
                    {/* Back Button */}
                    <button type="button" className="return-btn" onClick={handleBack}>
                        <i className="fas fa-arrow-left"></i> Back
                    </button>

                    <h2 className="page-title">
                        {role === 'student' ? 'Student' : 'Faculty'} Registration
                    </h2>

                    {/* Step Indicators */}
                    <div className="signup-step-indicators">
                        {[1, 2].map(n => (
                            <div key={n} className={`step-circle ${step >= n ? "active" : ""}`}>{n}</div>
                        ))}
                    </div>

                    {/* === STEP 1: PERSONAL INFO === */}
                    {step === 1 && (
                        <>
                            <h3 className="step-title">Personal Information</h3>
                            <div className="signup-step">
                                <div className="reg-form-group">
                                    <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Juan"
                                        value={formData.firstName}
                                        onChange={e => handleInputChange('firstName', e.target.value)}
                                        className={errors.firstName ? 'input-error' : ''}
                                    />
                                </div>
                                <div className="reg-form-group">
                                    <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Dela Cruz"
                                        value={formData.lastName}
                                        onChange={e => handleInputChange('lastName', e.target.value)}
                                        className={errors.lastName ? 'input-error' : ''}
                                    />
                                </div>
                                <div className="reg-form-group full-width">
                                    <label>Middle Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                    <input
                                        type="text"
                                        placeholder="Santos"
                                        value={formData.middleName}
                                        onChange={e => handleInputChange('middleName', e.target.value)}
                                    />
                                </div>
                                <div className="reg-form-group">
                                    <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="email"
                                        placeholder="example@tup.edu.ph"
                                        value={formData.email}
                                        onChange={e => handleInputChange('email', e.target.value)}
                                        className={errors.email ? 'input-error' : ''}
                                    />
                                </div>
                                <div className="reg-form-group">
                                    <label>TUPM ID <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className={`tupm-id-wrapper ${errors.tupmYear || errors.tupmSerial ? 'input-error-wrapper' : ''}`}>
                                        <span className="tupm-prefix">TUPM-</span>
                                        <input
                                            type="text"
                                            placeholder="YY"
                                            maxLength="2"
                                            value={formData.tupmYear}
                                            onChange={e => handleInputChange('tupmYear', e.target.value)}
                                            className={`tupm-year-input ${errors.tupmYear ? 'input-error' : ''}`}
                                        />
                                        <span className="tupm-sep">-</span>
                                        <input
                                            type="text"
                                            placeholder="####"
                                            maxLength="4"
                                            value={formData.tupmSerial}
                                            onChange={e => handleInputChange('tupmSerial', e.target.value)}
                                            className={`tupm-serial-input ${errors.tupmSerial ? 'input-error' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* === STEP 2: PASSWORD === */}
                    {step === 2 && (
                        <>
                            <h3 className="step-title">Set Your Password</h3>
                            <div className="signup-step">
                                <div className="reg-form-group full-width">
                                    <label>Password <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="reg-password-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="At least 6 characters"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="reg-password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="reg-form-group full-width">
                                    <label>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="reg-password-wrapper">
                                        <input
                                            type={showRetypePassword ? "text" : "password"}
                                            placeholder="Retype your password"
                                            value={retypePassword}
                                            onChange={e => setRetypePassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="reg-password-toggle"
                                            onClick={() => setShowRetypePassword(!showRetypePassword)}
                                        >
                                            <i className={showRetypePassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="summary-section" style={{ marginTop: '25px' }}>
                                <div className="summary-item"><span className="summary-label">Name:</span> <span>{formData.firstName} {formData.middleName} {formData.lastName}</span></div>
                                <div className="summary-item"><span className="summary-label">Email:</span> <span>{formData.email}</span></div>
                                <div className="summary-item"><span className="summary-label">TUPM ID:</span> <span>TUPM-{formData.tupmYear}-{formData.tupmSerial}</span></div>
                                <div className="summary-item"><span className="summary-label">Role:</span> <span style={{ textTransform: 'capitalize' }}>{role}</span></div>
                            </div>
                        </>
                    )}

                    {/* Navigation buttons */}
                    <div className="step-buttons" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                        {step < 2 ? (
                            <button className="reg-submit-button" onClick={handleNext}>
                                Next <i className="fas fa-arrow-right"></i>
                            </button>
                        ) : (
                            <button className="reg-submit-button" onClick={handleFinish}>
                                Register <i className="fas fa-check"></i>
                            </button>
                        )}
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RegistrationPage;