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
        if (role !== 'head' && role !== 'faculty') {
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
        departmentId: '',
        programId: '',
        currentTerm: ''
    });

    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const deptRes = await axios.get('http://localhost:5000/api/auth/departments');
                setDepartments(deptRes.data);
                const progRes = await axios.get('http://localhost:5000/api/auth/programs');
                setPrograms(progRes.data);
            } catch (error) {
                console.error("Error fetching dropdowns:", error);
            }
        };
        fetchDropdowns();
    }, []);

    // Filter programs based on selected department
    const filteredPrograms = formData.departmentId
        ? programs.filter(p => p.department_id === parseInt(formData.departmentId))
        : programs;

    // Scroll top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const handleInputChange = (field, value) => {
        if (['tupmYear', 'tupmSerial'].includes(field)) {
            if (value && !/^\d*$/.test(value)) return;
        }
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear dependent program if department changes
        if (field === 'departmentId') {
            setFormData(prev => ({ ...prev, programId: '' }));
        }

        if (errors[field]) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const validateStep = (currentStep) => {
        const newErrors = {};
        if (currentStep === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = true;
            if (!formData.lastName.trim()) newErrors.lastName = true;
            if (!formData.email.trim()) {
                newErrors.email = true;
            } else {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(formData.email)) {
                    newErrors.email = true;
                    showAlert("Invalid Email", "Please enter a valid email address (e.g., name@example.com).", "warning");
                    setErrors(newErrors);
                    return false;
                }
            }
            if (!formData.tupmYear.trim() || formData.tupmYear.length !== 2) newErrors.tupmYear = true;
            if (!formData.tupmSerial.trim() || formData.tupmSerial.length !== 4) newErrors.tupmSerial = true;
            if (!formData.departmentId) newErrors.departmentId = true;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showAlert("Incomplete Fields", "Please fill in all required fields indicated by the red asterisk (*).", "warning");
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
                department_id: formData.departmentId ? parseInt(formData.departmentId) : null,
                program_id: formData.programId ? parseInt(formData.programId) : null,
                current_term: formData.currentTerm || null
            };

            const response = await axios.post('http://localhost:5000/api/auth/register', payload);
            if (response.data.message) {
                // If HEAD, they are auto-verified
                if (role === 'head') {
                    showAlert("Registration Successful", "Department Head account created successfully. You can now log in.", "success");
                    setTimeout(() => navigate('/'), 2000);
                } else {
                    navigate('/register/status?s=pending');
                }
            }
        } catch (error) {
            console.error("Error registering:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
            if (errorMsg.includes("already exists")) {
                showAlert("Registration Failed", "Email or TUPM ID already exists in the system.", "error");
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
            message = "Thank you for registering! Your account is currently under review. You will receive an email once verified.";
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
                        {role === 'head' ? 'Department Head' : 'Faculty'} Registration
                    </h2>

                    {/* Step Indicators */}
                    <div className="signup-step-indicators">
                        {[1, 2].map(n => (
                            <div key={n} className={`step-circle ${step >= n ? "active" : ""}`}>{n}</div>
                        ))}
                    </div>
                    <div className="signup-step-labels" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', fontSize: '12px', color: '#64748b' }}>
                        <span>Personal & Academic Info</span>
                        <span>Password</span>
                    </div>

                    {/* === STEP 1: PERSONAL & ACADEMIC INFO === */}
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

                            <h3 className="step-title" style={{ marginTop: '24px' }}>Academic Details</h3>
                            <div className="signup-step">
                                <div className="reg-form-group full-width">
                                    <label>Department <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={e => handleInputChange('departmentId', e.target.value)}
                                        className={errors.departmentId ? 'input-error' : ''}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                </div>
                                {role === 'faculty' && (
                                    <div className="reg-form-group full-width">
                                        <label>Program <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                        <select
                                            value={formData.programId}
                                            onChange={e => handleInputChange('programId', e.target.value)}
                                            disabled={!formData.departmentId}
                                        >
                                            <option value="">Select Program</option>
                                            {filteredPrograms.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="reg-form-group full-width">
                                    <label>Current Term <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                    <select
                                        value={formData.currentTerm}
                                        onChange={e => handleInputChange('currentTerm', e.target.value)}
                                    >
                                        <option value="">Select Term</option>
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
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

                            <div className="summary-section">
                                <h4>Registration Summary</h4>
                                <div className="summary-grid">
                                    <div className="summary-item">
                                        <span className="summary-label">Role</span>
                                        <span className="summary-value" style={{ textTransform: 'capitalize' }}>
                                            {role === 'head' ? 'Department Head' : role}
                                        </span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Name</span>
                                        <span className="summary-value">{formData.firstName} {formData.lastName}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">TUPM ID</span>
                                        <span className="summary-value">TUPM-{formData.tupmYear}-{formData.tupmSerial}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Email</span>
                                        <span className="summary-value">{formData.email}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Department</span>
                                        <span className="summary-value">
                                            {departments.find(d => d.id === parseInt(formData.departmentId))?.code || 'Not specified'}
                                        </span>
                                    </div>
                                    {formData.programId && (
                                        <div className="summary-item">
                                            <span className="summary-label">Program</span>
                                            <span className="summary-value">
                                                {programs.find(p => p.id === parseInt(formData.programId))?.code || '—'}
                                            </span>
                                        </div>
                                    )}
                                    {formData.currentTerm && (
                                        <div className="summary-item">
                                            <span className="summary-label">Current Term</span>
                                            <span className="summary-value">{formData.currentTerm}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        {step < 2 ? (
                            <button type="button" className="reg-submit-button" onClick={handleNext}>
                                Next Step <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                            </button>
                        ) : (
                            <button type="button" className="reg-submit-button" onClick={handleFinish}>
                                Complete Registration
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
