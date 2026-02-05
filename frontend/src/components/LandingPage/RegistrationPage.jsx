import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';
import './RegistrationPage.css';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

// --- HELPER DATA FOR BIRTHDAY ---
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 70 }, (_, i) => currentYear - i);

const RegistrationPage = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // HAKBANG 1 (Step 3.2): Kunin ang status query parameter
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('s');

    // Validate role immediately
    useEffect(() => {
        if (role !== 'student' && role !== 'faculty') {
            // Only redirect if there's no status query, otherwise show the status message
            if (!status) navigate('/');
        }
    }, [role, navigate, status]);

    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showRetypePassword, setShowRetypePassword] = useState(false);

    // Validation & Alert State
    const [errors, setErrors] = useState({});
    const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '', type: 'error' });

    const showAlert = (title, message, type = 'error') => {
        setAlertConfig({ show: true, title, message, type });
    };

    const closeAlert = () => {
        setAlertConfig({ ...alertConfig, show: false });
    };

    // Camera functionality removed


    // Add these states inside RegistrationPage component
    const [faceValid, setFaceValid] = useState(false); // Green box indicator
    const [isValidating, setIsValidating] = useState(false); // Loading spinner

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        streetNumber: '', streetName: '', barangay: '', city: '', zipCode: '',
        tupmYear: '', tupmSerial: '',
        email: '',
        contactNumber: '+63 ',
        birthday: '',
        courseCode: '', year: '', section: '', college: '',
        status: '', term: '', facultyStatus: ''
    });

    // Dropdown Data
    const collegeOptions = [
        { code: "CIT", name: "College of Industrial Technology" },
        { code: "CIE", name: "College of Industrial Education" },
        { code: "COE", name: "College of Engineering" },
        { code: "CLA", name: "College of Liberal Arts" },
        { code: "COS", name: "College of Science" },
        { code: "CAFA", name: "College of Architecture and Fine Arts" },
    ];

    // --- UPDATED COURSE DATA WITH SECTIONS ---
    const availableCourses = [
        // College of Science (COS)
        {
            code: "BSIT",
            name: "BS Information Technology",
            college: "COS",
            sections: ["BSIT-1A", "BSIT-1B", "BSIT-2A", "BSIT-2B", "BSIT-3A", "BSIT-4A", "BSIT-4B"]
        },
        {
            code: "BSCS",
            name: "BS Computer Science",
            college: "COS",
            sections: ["BSCS-1A", "BSCS-1B", "BSCS-2A", "BSCS-4A"]
        },

        // College of Engineering (COE) - REQUESTED
        {
            code: "BSIE",
            name: "BS Industrial Engineering",
            college: "COE",
            sections: ["BSIE-1A", "BSIE-1B", "BSIE-2A", "BSIE-3A", "BSIE-5A"]
        },
        {
            code: "BSCE",
            name: "BS Civil Engineering",
            college: "COE",
            sections: ["BSCE-1A", "BSCE-1B", "BSCE-4A", "BSCE-5A"]
        },

        // College of Industrial Education (CIE)
        {
            code: "BSED",
            name: "BS Industrial Education",
            college: "CIE",
            sections: ["BSED-1A", "BSED-2A", "BSED-3A"]
        },
        // ... pwede mo dagdagan pa ibang courses dito
    ];

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    // --- BIRTHDAY LOGIC ---
    const [bYear, bMonth, bDay] = formData.birthday ? formData.birthday.split('-') : ['', '', ''];

    const handleBirthdayChange = (type, value) => {
        let newYear = bYear || currentYear;
        let newMonth = bMonth || '01';
        let newDay = bDay || '01';

        if (type === 'year') newYear = value;
        if (type === 'month') newMonth = value;
        if (type === 'day') newDay = value.padStart(2, '0');

        setFormData({ ...formData, birthday: `${newYear}-${newMonth}-${newDay}` });
    };

    // Handlers
    const handleInputChange = (field, value) => {
        // Numeric Restriction for IDs and Zip
        if (['tupmYear', 'tupmSerial', 'zipCode'].includes(field)) {
            if (value && !/^\d*$/.test(value)) return; // Only allow digits
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error for this field if it exists
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateStep = (currentStep) => {
        const newErrors = {};
        let isValid = true;

        if (currentStep === 1) {
            if (!formData.firstName) newErrors.firstName = true;
            if (!formData.lastName) newErrors.lastName = true;
            // Middle name might be optional? Let's assume strict for now based on prev impl or loose. 
            // Usually First/Last are required.
            if (!formData.email) newErrors.email = true;
            if (!formData.tupmYear) newErrors.tupmYear = true;
            if (!formData.tupmSerial) newErrors.tupmSerial = true;
            // Address parts
            // if (!formData.streetNumber) newErrors.streetNumber = true; // Maybe optional?
            // if (!formData.barangay) newErrors.barangay = true;
            // if (!formData.city) newErrors.city = true;
        }

        if (currentStep === 2) {
            if (!formData.college) newErrors.college = true;
            if (role === 'student') {
                if (!formData.courseCode) newErrors.courseCode = true;
                if (!formData.year) newErrors.year = true;
                if (!formData.section) newErrors.section = true;
                if (!formData.status) newErrors.status = true;
                if (!formData.term) newErrors.term = true;
            } else if (role === 'faculty') {
                if (!formData.facultyStatus) newErrors.facultyStatus = true;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            isValid = false;
        }

        return isValid;
    };
    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        } else {
            // Optional: Shake effect or focus is handled by CSS class
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        } else {
            navigate('/'); // Return to landing page
        }
    };

    // HAKBANG 5 (Step 3.3 Revised): Pag-handle ng pag-finish at pag-redirect
    const handleFinish = async () => {
        // Face capture check removed


        // Add password validation here if needed
        if (password !== retypePassword || password.length < 6) {
            showAlert("Invalid Password", "Passwords must match and be at least 6 characters long.", "warning");
            return;
        }

        try {
            // 2. PAYLOAD PREPARATION
            const payload = {
                email: formData.email,
                password: password,
                tupm_id: `TUPM-${formData.tupmYear}-${formData.tupmSerial}`,
                role: role.toUpperCase(), // Ensure uppercase for Enum
                first_name: formData.firstName,
                last_name: formData.lastName,
                middle_name: formData.middleName || null,
                department_id: null, // Optional, can be implemented later if needed
                program_id: null,    // Optional
                // Extra fields stored in separate tables or ignored by basic user schema
                // If backend needs them in a different way, we'd add them here.
                // For now, based on UserRegister schema, this is what's required.
            };

            console.log("Sending Payload:", payload); // Para makita mo sa console

            // 3. SEND TO BACKEND
            const response = await axios.post('http://localhost:5000/api/auth/register', payload);

            if (response.data.message) {
                // SUCCESS: Redirect sa Status Page na may 'pending' flag
                navigate('/register/status?s=pending');
            }
        } catch (error) {
            console.error("Error registering:", error);
            // Handling specific MySQL errors from backend
            const errorMsg = error.response?.data?.error || error.message;
            if (errorMsg.includes("Email or TUPM ID already exists.")) {
                showAlert("Registration Failed", "Email or TUPM ID already exists.", "error");
            } else {
                showAlert("Registration Failed", errorMsg, "error");
            }
        }
    };

    // Camera Logic removed


    // Filter Courses based on selected College
    const filteredCourses = availableCourses.filter(c => c.college === formData.college);

    // Get Sections based on selected Course
    const currentCourseData = availableCourses.find(c => c.code === formData.courseCode);
    const filteredSections = currentCourseData ? currentCourseData.sections : [];

    // HAKBANG 4 (Step 3.2): Conditional Status View
    if (status) {
        let title, message, iconClass, iconColor;

        if (status === 'pending') {
            title = "Verification Pending";
            message = "Thank you for registering! Your account is currently under review by the Administrator/Department Head. You will receive an email notification once it is Verified and ready for full access.";
            iconClass = "fas fa-user-clock";
            iconColor = "#f59e0b"; // Orange/Yellow
        } else if (status === 'rejected') {
            title = "Access Denied";
            message = "We regret to inform you that your registration was rejected. Please contact the system administrator for more details.";
            iconClass = "fas fa-times-circle";
            iconColor = "#dc3545"; // Red
        } else {
            // Default fallback for invalid query
            title = "Invalid Status";
            message = "An unexpected error occurred or the status link is invalid.";
            iconClass = "fas fa-exclamation-triangle";
            iconColor = "#6c757d"; // Gray
        }

        return (
            <div className="registration-page-wrapper">
                <Header user={null} setPanel={() => navigate('/')} />
                <div className="registration-container" style={{ paddingTop: '100px' }}>
                    <div className="form-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
                        <i className={iconClass} style={{ fontSize: '3em', color: iconColor, marginBottom: '20px' }}></i>
                        <h2>{title}</h2>
                        <p>{message}</p>

                        <p style={{ marginTop: '30px' }}>
                            <button
                                onClick={() => navigate('/')}
                                className="auth-submit-button"
                                style={{ backgroundColor: '#A62525', borderColor: '#A62525' }}
                            >
                                Return to Login
                            </button>
                        </p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // HAKBANG 5: Ipagpatuloy ang pag-render ng registration form kung walang status query
    return (
        <div className="registration-page-wrapper">

            <Header user={null} setPanel={() => navigate('/')} />

            <div className="registration-container">

                {/* Custom Alert Overlay */}
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
                            <button className="custom-alert-close-btn" onClick={closeAlert}>
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <div className="form-card">
                    {/* Back button RESTORED to Top Left */}
                    <button
                        type="button"
                        className="return-btn"
                        onClick={handleBack}
                    >
                        <i className="fas fa-arrow-left"></i> Back
                    </button>

                    <h2 className="page-title">
                        {role === 'student' ? 'Student' : 'Faculty'} Registration
                    </h2>

                    {/* Step Indicators */}
                    <div className="signup-step-indicators">
                        {[1, 2, 3].map(n => (
                            <div key={n} className={`step-circle ${step >= n ? "active" : ""}`}>{n}</div>
                        ))}
                    </div>

                    {/* === STEP 1: PERSONAL INFORMATION === */}
                    {step === 1 && (
                        <>
                            <h3 className="step-title">Step 1: Personal Information</h3>
                            <div className="signup-step">

                                {/* Row 1: First & Last Name */}
                                <div className="auth-form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => handleInputChange('firstName', e.target.value)}
                                        className={errors.firstName ? 'input-error' : ''}
                                    />
                                </div>
                                <div className="auth-form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => handleInputChange('lastName', e.target.value)}
                                        className={errors.lastName ? 'input-error' : ''}
                                    />
                                </div>

                                {/* Row 2: Middle Name (Full) & Birthday */}
                                <div className="auth-form-group">
                                    <label>Middle Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter middle name"
                                        value={formData.middleName}
                                        onChange={e => handleInputChange('middleName', e.target.value)}
                                    />
                                </div>

                                <div className="auth-form-group">
                                    <label>Birthday</label>
                                    <div className="birthday-wrapper">
                                        <select className="birthday-select" value={bMonth} onChange={(e) => handleBirthdayChange('month', e.target.value)}>
                                            <option value="" disabled>Month</option>
                                            {months.map((m, index) => (
                                                <option key={m} value={String(index + 1).padStart(2, '0')}>{m}</option>
                                            ))}
                                        </select>
                                        <select className="birthday-select" value={bDay ? parseInt(bDay).toString() : ""} onChange={(e) => handleBirthdayChange('day', e.target.value)}>
                                            <option value="" disabled>Day</option>
                                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <select className="birthday-select" value={bYear} onChange={(e) => handleBirthdayChange('year', e.target.value)}>
                                            <option value="" disabled>Year</option>
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 3: Email (Left) & TUPM ID (Right) */}
                                <div className="auth-form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleInputChange('email', e.target.value)}
                                        className={errors.email ? 'input-error' : ''}
                                    />
                                </div>

                                <div className="auth-form-group">
                                    <label>TUPM ID</label>
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

                                {/* === UPDATED ADDRESS SECTION (Split Fields) === */}
                                {/* Row 4: House No. & Street Name */}
                                <div className="auth-form-group">
                                    <label>House / Unit No.</label>
                                    <input
                                        type="text"
                                        placeholder="ex. 123"
                                        value={formData.streetNumber}
                                        onChange={e => setFormData({ ...formData, streetNumber: e.target.value })}
                                    />
                                </div>
                                <div className="auth-form-group">
                                    <label>Street Name</label>
                                    <input
                                        type="text"
                                        placeholder="ex. Ayala Blvd"
                                        value={formData.streetName}
                                        onChange={e => setFormData({ ...formData, streetName: e.target.value })}
                                    />
                                </div>

                                {/* Row 5: Barangay & City */}
                                <div className="auth-form-group">
                                    <label>Barangay</label>
                                    <input
                                        type="text"
                                        value={formData.barangay}
                                        onChange={e => setFormData({ ...formData, barangay: e.target.value })}
                                    />
                                </div>
                                <div className="auth-form-group">
                                    <label>City / Municipality</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>

                                {/* Row 6: Zip Code (Solo) */}
                                <div className="auth-form-group">
                                    <label>Zip Code</label>
                                    <input
                                        type="text"
                                        maxLength="4"
                                        value={formData.zipCode}
                                        onChange={e => handleInputChange('zipCode', e.target.value)}
                                    />
                                </div>

                            </div>
                        </>
                    )}

                    {/* === STEP 2: PROGRAM DETAILS === */}
                    {step === 2 && (
                        <>
                            <h3 className="step-title">Step 2: {role === 'student' ? 'Program' : 'Department'} Details</h3>
                            <div className="signup-step">

                                {/* 1. COLLEGE (Full Width) */}
                                <div className="auth-form-group full-width">
                                    <label>College</label>
                                    <select
                                        value={formData.college}
                                        onChange={e => {
                                            handleInputChange('college', e.target.value);
                                            handleInputChange('courseCode', '');
                                            handleInputChange('section', '');
                                        }}
                                        className={errors.college ? 'input-error' : ''}
                                    >
                                        <option value="">Select College</option>
                                        {collegeOptions.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* STUDENT SPECIFIC FIELDS */}
                                {role === 'student' && (
                                    <>
                                        {/* 2. COURSE (Full Width) */}
                                        <div className="auth-form-group full-width">
                                            <label>Course</label>
                                            <select
                                                value={formData.courseCode}
                                                onChange={e => {
                                                    handleInputChange('courseCode', e.target.value);
                                                    handleInputChange('section', '');
                                                }}
                                                disabled={!formData.college}
                                                className={errors.courseCode ? 'input-error' : ''}
                                            >
                                                <option value="">Select Course</option>
                                                {filteredCourses.map(c => (
                                                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 3. YEAR & SECTION (Side-by-Side) */}
                                        <div className="auth-form-group">
                                            <label>Year Level</label>
                                            <select
                                                value={formData.year}
                                                onChange={e => handleInputChange('year', e.target.value)}
                                                className={errors.year ? 'input-error' : ''}
                                            >
                                                <option value="">Select Year</option>
                                                <option value="1">1st Year</option>
                                                <option value="2">2nd Year</option>
                                                <option value="3">3rd Year</option>
                                                <option value="4">4th Year</option>
                                                <option value="5">5th Year</option> {/* Added 5th Year */}
                                            </select>
                                        </div>

                                        <div className="auth-form-group">
                                            <label>Section</label>
                                            <select
                                                value={formData.section}
                                                onChange={e => handleInputChange('section', e.target.value)}
                                                disabled={!formData.courseCode}
                                                className={errors.section ? 'input-error' : ''}
                                            >
                                                <option value="">Select Section</option>
                                                {/* Dito lumalabas ang dynamic sections base sa course */}
                                                {filteredSections.map(sec => (
                                                    <option key={sec} value={sec}>{sec}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 4. STATUS & TERM (Side-by-Side) - NEW REQUEST */}
                                        <div className="auth-form-group">
                                            <label>Student Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={e => handleInputChange('status', e.target.value)}
                                                className={errors.status ? 'input-error' : ''}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="Regular">Regular</option>
                                                <option value="Irregular">Irregular</option>
                                            </select>
                                        </div>

                                        <div className="auth-form-group">
                                            <label>Current Term</label>
                                            <select
                                                value={formData.term}
                                                onChange={e => handleInputChange('term', e.target.value)}
                                                className={errors.term ? 'input-error' : ''}
                                            >
                                                <option value="">Select Term</option>
                                                <option value="1st">1st Semester</option>
                                                <option value="2nd">2nd Semester</option>
                                                <option value="3rd">3rd Term (Summer)</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* FACULTY FIELDS (Mananatili ito) */}
                                {role === 'faculty' && (
                                    <div className="auth-form-group full-width">
                                        <label>Position</label>
                                        <select value={formData.facultyStatus} onChange={e => setFormData({ ...formData, facultyStatus: e.target.value })}>
                                            <option value="">Select Position</option>
                                            <option value="regular">Regular Faculty</option>
                                            <option value="head">Dept Head</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* === STEP 3: SUMMARY & PASSWORD === */}
                    {step === 3 && (
                        <>
                            <h3 className="step-title">Step 3: Review & Password</h3>
                            <div className="summary-section">
                                <div className="summary-item"><span className="summary-label">Name:</span> <span>{formData.firstName} {formData.middleName} {formData.lastName}</span></div>
                                <div className="summary-item"><span className="summary-label">Birthday:</span> <span>{formData.birthday}</span></div>
                                <div className="summary-item"><span className="summary-label">Role:</span> <span style={{ textTransform: 'capitalize' }}>{role}</span></div>
                                <div className="summary-item"><span className="summary-label">Address:</span> <span>{formData.streetNumber} {formData.streetName}, {formData.barangay}, {formData.city}</span></div>
                            </div>

                            <div className="signup-step" style={{ marginTop: '20px' }}>
                                <div className="auth-form-group full-width">
                                    <label>Password</label>
                                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <div className="auth-form-group full-width">
                                    <label>Retype Password</label>
                                    <input type={showRetypePassword ? "text" : "password"} value={retypePassword} onChange={e => setRetypePassword(e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* BUTTONS (Bottom Navigation - Next Only) */}
                    <div className="step-buttons" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                        {/* Back button removed from bottom */}

                        {step < 3 ? (
                            <button className="auth-submit-button" onClick={handleNext}>
                                Next <i className="fas fa-arrow-right"></i>
                            </button>
                        ) : (
                            <button className="auth-submit-button" onClick={handleFinish}>
                                Finish <i className="fas fa-check"></i>
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