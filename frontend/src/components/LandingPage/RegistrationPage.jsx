import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        employeeId: '',
        email: '',
        collegeId: '',
        departmentId: '',
        departmentName: '',
        departmentCode: '',
        programId: '',
    });

    // Dropdown data
    const [colleges, setColleges] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);

    // Dept head program setup section
    const [newPrograms, setNewPrograms] = useState([]);
    const [programInput, setProgramInput] = useState({ name: '', code: '' });

    // Total steps: head gets 3 steps (Personal, Academic + Programs, Password), faculty gets 2 (Personal + Academic, Password)
    const totalSteps = role === 'head' ? 3 : 2;

    // Fetch colleges on mount
    useEffect(() => {
        const controller = new AbortController();
        const fetchColleges = async () => {
            try {
                const res = await api.get('/api/auth/colleges', { signal: controller.signal });
                setColleges(res.data);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    console.error('Failed to fetch colleges:', err);
                }
            }
        };
        fetchColleges();
        return () => controller.abort();
    }, []);

    // Fetch departments when college changes (faculty: cascading dropdown)
    useEffect(() => {
        if (role !== 'faculty' || !formData.collegeId) {
            if (role === 'faculty') setDepartments([]);
            return;
        }
        const controller = new AbortController();
        const fetchDepts = async () => {
            try {
                const res = await api.get(`/api/auth/departments?college_id=${formData.collegeId}`, { signal: controller.signal });
                setDepartments(res.data);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    console.error('Failed to fetch departments:', err);
                }
            }
        };
        fetchDepts();
        return () => controller.abort();
    }, [formData.collegeId, role]);

    // Fetch programs when department changes (faculty: cascading dropdown)
    useEffect(() => {
        if (role !== 'faculty' || !formData.departmentId) {
            if (role === 'faculty') setPrograms([]);
            return;
        }
        const controller = new AbortController();
        const fetchProgs = async () => {
            try {
                const res = await api.get(`/api/auth/programs?department_id=${formData.departmentId}`, { signal: controller.signal });
                setPrograms(res.data);
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    console.error('Failed to fetch programs:', err);
                }
            }
        };
        fetchProgs();
        return () => controller.abort();
    }, [formData.departmentId, role]);

    // Auto-generate department code from name (for dept head)
    const generateDeptCode = (name) => {
        const words = name.trim().toUpperCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return '';
        return words.map(w => w[0]).join('') + 'D';
    };

    // Auto-generate program code from name
    const generateProgramCode = (name) => {
        const words = name.trim().toUpperCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return '';
        return words.filter(w => w.length > 2).map(w => w[0]).join('');
    };

    // Scroll top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    /**
     * Handle input changes with auto-uppercase for all fields except email/password.
     * Employee ID is numbers-only.
     */
    const handleInputChange = (field, value) => {
        // Employee ID: numbers only
        if (field === 'employeeId') {
            if (value && !/^\d*$/.test(value)) return;
            setFormData(prev => ({ ...prev, employeeId: value }));
            if (errors.employeeId) setErrors(prev => { const n = { ...prev }; delete n.employeeId; return n; });
            return;
        }

        // Department name (for dept head): auto-uppercase + auto-generate code
        if (field === 'departmentName') {
            const upperVal = value.toUpperCase();
            setFormData(prev => ({
                ...prev,
                departmentName: upperVal,
                departmentCode: generateDeptCode(upperVal),
            }));
            if (errors.departmentName) setErrors(prev => { const n = { ...prev }; delete n.departmentName; return n; });
            return;
        }

        // College/Department/Program selects (faculty)
        if (['collegeId', 'departmentId', 'programId'].includes(field)) {
            setFormData(prev => {
                const updated = { ...prev, [field]: value };
                // Reset dependent dropdowns
                if (field === 'collegeId') {
                    updated.departmentId = '';
                    updated.programId = '';
                }
                if (field === 'departmentId') {
                    updated.programId = '';
                }
                return updated;
            });
            if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
            return;
        }

        // Auto-uppercase for name fields (not email/password)
        const upperCaseFields = ['firstName', 'lastName', 'middleName'];
        const finalValue = upperCaseFields.includes(field) ? value.toUpperCase() : value;

        setFormData(prev => ({ ...prev, [field]: finalValue }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    /**
     * Validate each step before proceeding.
     */
    const validateStep = (currentStep) => {
        const newErrors = {};

        if (currentStep === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = true;
            if (!formData.lastName.trim()) newErrors.lastName = true;

            // Middle name is required — prompt dash if none
            if (!formData.middleName.trim()) {
                newErrors.middleName = true;
            }

            // Email validation: must be @tup.edu.ph
            if (!formData.email.trim()) {
                newErrors.email = true;
            } else {
                const tupEmailRegex = /^[a-zA-Z0-9._%+-]+@tup\.edu\.ph$/i;
                if (!tupEmailRegex.test(formData.email)) {
                    newErrors.email = true;
                    showAlert('Invalid Email', 'Please enter a valid TUP email address (e.g., name@tup.edu.ph).', 'warning');
                    setErrors(newErrors);
                    return false;
                }
            }

            // Employee ID required
            if (!formData.employeeId.trim()) {
                newErrors.employeeId = true;
            }

            // Academic fields
            if (role === 'head') {
                if (!formData.collegeId) newErrors.collegeId = true;
                if (!formData.departmentName.trim()) newErrors.departmentName = true;
            } else {
                // Faculty
                if (!formData.collegeId) newErrors.collegeId = true;
                if (!formData.departmentId) newErrors.departmentId = true;
            }
        }

        // Step 2 for head: program setup — at least 1 program required
        if (role === 'head' && currentStep === 2) {
            if (newPrograms.length === 0) {
                showAlert('Programs Required', 'Please add at least one program under your department. You can configure more later.', 'warning');
                return false;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showAlert('Incomplete Fields', 'Please fill in all required fields indicated by the red asterisk (*).', 'warning');
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

    /**
     * Add a program to the dept head's program setup list.
     */
    const handleAddProgram = () => {
        const name = programInput.name.trim().toUpperCase();
        const code = programInput.code.trim().toUpperCase() || generateProgramCode(name);
        if (!name) {
            showAlert('Program Name Required', 'Please enter the program name.', 'warning');
            return;
        }
        if (!code) {
            showAlert('Program Code Required', 'Please enter or auto-generate a program code.', 'warning');
            return;
        }
        // Check for duplicate codes
        if (newPrograms.some(p => p.code === code)) {
            showAlert('Duplicate Code', `A program with code "${code}" already exists in your list.`, 'warning');
            return;
        }
        setNewPrograms(prev => [...prev, { name, code }]);
        setProgramInput({ name: '', code: '' });
    };

    const handleRemoveProgram = (index) => {
        setNewPrograms(prev => prev.filter((_, i) => i !== index));
    };

    const handleFinish = async () => {
        if (isSubmitting) return;

        // Password Validation 
        // 1.) Must be minimum length of 8-15 characters
        // 2.) Must include uppercase
        // 3.) Special character
        // 4.) Number
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;

        if (!strongPasswordRegex.test(password)) {
            showAlert(
                'Weak Password', 
                'Password must be 8-15 characters long, include at least one uppercase letter, one number, and one special character.', 
                'warning'
            );
            return;
        }

        if (password !== retypePassword) {
            showAlert('Password Mismatch', 'Passwords do not match.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            let departmentId = formData.departmentId ? parseInt(formData.departmentId) : null;

            // For dept head: find or create department
            if (role === 'head') {
                const deptRes = await api.post('/api/auth/departments', {
                    name: formData.departmentName.trim().toUpperCase(),
                    code: formData.departmentCode,
                    college_id: parseInt(formData.collegeId),
                });
                departmentId = deptRes.data.id;

                // Create programs under the department
                for (const prog of newPrograms) {
                    await api.post('/api/auth/programs', {
                        name: prog.name,
                        code: prog.code,
                        department_id: departmentId,
                    });
                }
            }

            // Register the user
            const payload = {
                email: formData.email,
                password: password,
                employee_id: formData.employeeId,
                role: role.toUpperCase(),
                first_name: formData.firstName,
                last_name: formData.lastName,
                middle_name: formData.middleName || null,
                department_id: departmentId,
                program_id: formData.programId ? parseInt(formData.programId) : null,
            };

            const response = await api.post('/api/auth/register', payload);
            if (response.data.message) {
                if (role === 'head') {
                    showAlert('Registration Successful', 'Department Head account created successfully. You can now log in.', 'success');
                    setTimeout(() => navigate('/'), 2000);
                } else {
                    navigate('/register/status?s=pending');
                }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error?.message
                || error.response?.data?.detail
                || error.message;
            if (typeof errorMsg === 'string' && errorMsg.includes('already exists')) {
                showAlert('Registration Failed', 'Email or Employee ID already exists in the system.', 'error');
            } else {
                showAlert('Registration Failed', errorMsg || 'An unexpected error occurred.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Status page (pending / rejected) ---
    if (status) {
        let title, message, iconClass, iconColor;
        if (status === 'pending') {
            title = 'Verification Pending';
            message = 'Thank you for registering! Your account is currently under review. You will receive an email once verified.';
            iconClass = 'fas fa-user-clock';
            iconColor = '#f59e0b';
        } else if (status === 'rejected') {
            title = 'Access Denied';
            message = 'Your registration was rejected. Please contact the administrator for details.';
            iconClass = 'fas fa-times-circle';
            iconColor = '#dc3545';
        } else {
            title = 'Invalid Status';
            message = 'An unexpected error occurred.';
            iconClass = 'fas fa-exclamation-triangle';
            iconColor = '#6c757d';
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

    // Determine step labels based on role
    const stepLabels = role === 'head'
        ? ['Personal & Academic Info', 'Program Setup', 'Password']
        : ['Personal & Academic Info', 'Password'];

    // Get selected college/department/program names for summary
    const selectedCollege = colleges.find(c => c.id === parseInt(formData.collegeId));
    const selectedDepartment = role === 'head'
        ? { name: formData.departmentName, code: formData.departmentCode }
        : departments.find(d => d.id === parseInt(formData.departmentId));
    const selectedProgram = programs.find(p => p.id === parseInt(formData.programId));

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
                                {alertConfig.type === 'success' && <i className="fas fa-check-circle"></i>}
                                {alertConfig.type === 'error' && <i className="fas fa-times-circle"></i>}
                                {alertConfig.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
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
                        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
                            <div key={n} className={`step-circle ${step >= n ? 'active' : ''}`}>{n}</div>
                        ))}
                    </div>
                    <div className="signup-step-labels" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', fontSize: '12px', color: '#64748b' }}>
                        {stepLabels.map((label, i) => (
                            <span key={i}>{label}</span>
                        ))}
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
                                        placeholder="JUAN"
                                        value={formData.firstName}
                                        onChange={e => handleInputChange('firstName', e.target.value)}
                                        className={errors.firstName ? 'input-error' : ''}
                                    />
                                </div>
                                <div className="reg-form-group">
                                    <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="DELA CRUZ"
                                        value={formData.lastName}
                                        onChange={e => handleInputChange('lastName', e.target.value)}
                                        className={errors.lastName ? 'input-error' : ''}
                                    />
                                </div>
                                <div className="reg-form-group full-width">
                                    <label>Middle Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Enter middle name or type - if none"
                                        value={formData.middleName}
                                        onChange={e => handleInputChange('middleName', e.target.value)}
                                        className={errors.middleName ? 'input-error' : ''}
                                    />
                                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                        If you have no middle name, please enter a dash ( - )
                                    </span>
                                </div>
                                <div className="reg-form-group">
                                    <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="email"
                                        placeholder="name@tup.edu.ph"
                                        value={formData.email}
                                        onChange={e => handleInputChange('email', e.target.value)}
                                        className={errors.email ? 'input-error' : ''}
                                    />
                                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                        Must be a valid TUP email (@tup.edu.ph)
                                    </span>
                                </div>
                                <div className="reg-form-group">
                                    <label>Employee ID <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 12345"
                                        value={formData.employeeId}
                                        onChange={e => handleInputChange('employeeId', e.target.value)}
                                        className={errors.employeeId ? 'input-error' : ''}
                                        maxLength="20"
                                    />
                                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                        Numbers only
                                    </span>
                                </div>
                            </div>

                            <h3 className="step-title" style={{ marginTop: '24px' }}>Academic Details</h3>
                            <div className="signup-step">
                                {/* College Dropdown — same for both roles */}
                                <div className="reg-form-group full-width">
                                    <label>College <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select
                                        value={formData.collegeId}
                                        onChange={e => handleInputChange('collegeId', e.target.value)}
                                        className={errors.collegeId ? 'input-error' : ''}
                                    >
                                        <option value="">Select College</option>
                                        {colleges.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Department — different UI for head vs faculty */}
                                {role === 'head' ? (
                                    <div className="reg-form-group full-width">
                                        <label>Department <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input
                                                type="text"
                                                placeholder="e.g. COMPUTER STUDIES"
                                                value={formData.departmentName}
                                                onChange={e => handleInputChange('departmentName', e.target.value)}
                                                className={errors.departmentName ? 'input-error' : ''}
                                                style={{ flex: 1 }}
                                            />
                                            {formData.departmentCode && (
                                                <span style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    background: '#e0f2fe',
                                                    color: '#0369a1',
                                                    fontWeight: 600,
                                                    fontSize: '13px',
                                                    whiteSpace: 'nowrap',
                                                    border: '1px solid #bae6fd'
                                                }}>
                                                    {formData.departmentCode}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="reg-form-group full-width">
                                        <label>Department <span style={{ color: '#ef4444' }}>*</span></label>
                                        <select
                                            value={formData.departmentId}
                                            onChange={e => handleInputChange('departmentId', e.target.value)}
                                            className={errors.departmentId ? 'input-error' : ''}
                                            disabled={!formData.collegeId}
                                        >
                                            <option value="">{formData.collegeId ? 'Select Department' : 'Select a college first'}</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Program selection removed for faculty - now handled by Dept Head */}
                            </div>
                        </>
                    )}

                    {/* === STEP 2 (HEAD ONLY): PROGRAM SETUP === */}
                    {role === 'head' && step === 2 && (
                        <>
                            <h3 className="step-title">Program Setup</h3>
                            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                                Add the academic programs offered under your department.
                                You must add at least one program. You can configure more later in your module.
                            </p>
                            <div className="signup-step">
                                <div className="reg-form-group full-width">
                                    <label>Program Name</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="e.g. BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY"
                                            value={programInput.name}
                                            onChange={e => {
                                                const upper = e.target.value.toUpperCase();
                                                setProgramInput(prev => ({
                                                    ...prev,
                                                    name: upper,
                                                    code: generateProgramCode(upper),
                                                }));
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        {programInput.code && (
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                background: '#e0f2fe',
                                                color: '#0369a1',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                whiteSpace: 'nowrap',
                                                border: '1px solid #bae6fd'
                                            }}>
                                                {programInput.code}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="reg-form-group full-width" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label>Code</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. BSIT"
                                            value={programInput.code}
                                            onChange={e => setProgramInput(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddProgram}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#163269',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Add
                                    </button>
                                </div>
                            </div>

                            {/* Program List */}
                            {newPrograms.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#334155', marginBottom: '12px' }}>
                                        Programs Added ({newPrograms.length})
                                    </h4>
                                    {newPrograms.map((prog, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 14px',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            border: '1px solid #e2e8f0',
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: 600, color: '#0369a1', marginRight: '8px' }}>{prog.code}</span>
                                                <span style={{ color: '#475569', fontSize: '13px' }}>{prog.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProgram(index)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                }}
                                                title="Remove program"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* === PASSWORD STEP (last step for both roles) === */}
                    {step === totalSteps && (
                        <>
                            <h3 className="step-title">Set Your Password</h3>
                            <div className="signup-step">
                                <div className="reg-form-group full-width">
                                    <label>Password <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="reg-password-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="reg-password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
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
                                    </div>
                                </div>
                                <div className="reg-form-group full-width">
                                    <label>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="reg-password-wrapper">
                                        <input
                                            type={showRetypePassword ? 'text' : 'password'}
                                            placeholder="Retype your password"
                                            value={retypePassword}
                                            onChange={e => setRetypePassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="reg-password-toggle"
                                            onClick={() => setShowRetypePassword(!showRetypePassword)}
                                        >
                                            <i className={showRetypePassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
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
                                            {role === 'head' ? 'Department Head' : 'Faculty'}
                                        </span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Name</span>
                                        <span className="summary-value">
                                            {formData.firstName} {formData.middleName && formData.middleName !== '-' ? formData.middleName + ' ' : ''}{formData.lastName}
                                        </span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Employee ID</span>
                                        <span className="summary-value">{formData.employeeId}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Email</span>
                                        <span className="summary-value">{formData.email}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">College</span>
                                        <span className="summary-value">
                                            {selectedCollege ? `${selectedCollege.name} (${selectedCollege.code})` : '-'}
                                        </span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Department</span>
                                        <span className="summary-value">
                                            {selectedDepartment
                                                ? `${selectedDepartment.name}${selectedDepartment.code ? ` (${selectedDepartment.code})` : ''}`
                                                : '-'}
                                        </span>
                                    </div>
                                    {role === 'head' && newPrograms.length > 0 && (
                                        <div className="summary-item">
                                            <span className="summary-label">Programs</span>
                                            <span className="summary-value">
                                                {newPrograms.map(p => p.code).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        {step < totalSteps ? (
                            <button type="button" className="reg-submit-button" onClick={handleNext}>
                                Next Step <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                            </button>
                        ) : (
                            <button type="button" className="reg-submit-button" onClick={handleFinish} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Complete Registration'}
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
