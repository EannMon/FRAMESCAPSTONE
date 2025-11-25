import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LandingPage.css'; 
import './Registration.css'; 

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
  
  // Validate role immediately
  useEffect(() => {
    if (role !== 'student' && role !== 'faculty') {
      navigate('/'); 
    }
  }, [role, navigate]);

  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  // Camera Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [faceCapture, setFaceCapture] = useState(null);

const [formData, setFormData] = useState({
    firstName: '', 
    lastName: '', 
    middleName: '', // Change: middleInitial -> middleName
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

  const availableSections = ['BSIT-5A', 'BSIT-5B', 'BSIT-4A', 'BSIT-4B', 'BSIT-1A'];

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
  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  const handleFinish = () => { alert("Done!"); navigate('/'); };

  // Camera Logic
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            videoRef.current.play();
        }
      } catch (err) { console.error(err); }
    };
    if (step === 3) startCamera();
    else {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    }
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [step]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        setFaceCapture(canvas.toDataURL('image/png'));
    }
  };

  // Filter Courses based on selected College
  const filteredCourses = availableCourses.filter(c => c.college === formData.college);
  
  // Get Sections based on selected Course
  // Hahanapin nito yung course sa array at kukunin yung 'sections' list niya
  const currentCourseData = availableCourses.find(c => c.code === formData.courseCode);
  const filteredSections = currentCourseData ? currentCourseData.sections : [];

  return (
    <div className="registration-page-wrapper">
        
        {/* --- HEADER --- */}
        <header className="reg-header">
            <div className="logo" onClick={() => navigate('/')}>
                <span>FRAMES</span>
            </div>
            <a href="#" className="header-right-link" onClick={(e) => e.preventDefault()}>
                <i className="fas fa-question-circle"></i> Need Help?
            </a>
        </header>

        <div className="registration-container">
            <div className="form-card">
                
                {/* TOP LEFT BACK BUTTON (Steps 2-4) */}
                {step > 1 && (
                    <button className="top-back-btn" onClick={handleBack}>
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                )}

                <h2 className="page-title">
                    {role === 'student' ? 'Student' : 'Faculty'} Registration
                </h2>

                {/* Step Indicators */}
                <div className="signup-step-indicators">
                    {[1, 2, 3, 4].map(n => (
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
                                <input type="text" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} />
                            </div>
                            <div className="auth-form-group">
                                <label>Last Name</label>
                                <input type="text" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} />
                            </div>

                            {/* Row 2: Middle Initial & Birthday (Red Calendar) */}
                            <div className="auth-form-group">
                                <label>Middle Initial</label>
                                <input 
                                    type="text" 
                                    maxLength="2" 
                                    placeholder=" "
                                    value={formData.middleInitial} 
                                    onChange={e=>setFormData({...formData, middleInitial: e.target.value})} 
                                    style={{textTransform: 'uppercase'}} 
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
                                <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
                            </div>

                            <div className="auth-form-group">
                                <label>TUPM ID</label>
                                <div className="tupm-id-wrapper">
                                    <span className="tupm-prefix">TUPM-</span>
                                    <input type="text" placeholder="YY" maxLength="2" value={formData.tupmYear} onChange={e=>setFormData({...formData, tupmYear: e.target.value})} className="tupm-year-input"/>
                                    <span className="tupm-sep">-</span>
                                    <input type="text" placeholder="####" maxLength="4" value={formData.tupmSerial} onChange={e=>setFormData({...formData, tupmSerial: e.target.value})} className="tupm-serial-input"/>
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
                                    onChange={e=>setFormData({...formData, streetNumber: e.target.value})} 
                                />
                            </div>
                            <div className="auth-form-group">
                                <label>Street Name</label>
                                <input 
                                    type="text" 
                                    placeholder="ex. Ayala Blvd"
                                    value={formData.streetName} 
                                    onChange={e=>setFormData({...formData, streetName: e.target.value})} 
                                />
                            </div>

                            {/* Row 5: Barangay & City */}
                            <div className="auth-form-group">
                                <label>Barangay</label>
                                <input 
                                    type="text" 
                                    value={formData.barangay} 
                                    onChange={e=>setFormData({...formData, barangay: e.target.value})} 
                                />
                            </div>
                            <div className="auth-form-group">
                                <label>City / Municipality</label>
                                <input 
                                    type="text" 
                                    value={formData.city} 
                                    onChange={e=>setFormData({...formData, city: e.target.value})} 
                                />
                            </div>

                            {/* Row 6: Zip Code (Solo) */}
                            <div className="auth-form-group">
                                <label>Zip Code</label>
                                <input 
                                    type="text" 
                                    maxLength="4"
                                    value={formData.zipCode} 
                                    onChange={e=>setFormData({...formData, zipCode: e.target.value})} 
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
                                    onChange={e => setFormData({
                                        ...formData, 
                                        college: e.target.value, 
                                        courseCode: '', // Reset course pag nagpalit ng college
                                        section: ''     // Reset section pag nagpalit ng college
                                    })}
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
                                            onChange={e=>setFormData({...formData, courseCode: e.target.value, section: ''})} // Reset section pag nagpalit course
                                            disabled={!formData.college} // Disable kung wala pang college
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
                                        <select value={formData.year} onChange={e=>setFormData({...formData, year: e.target.value})}>
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
                                            onChange={e=>setFormData({...formData, section: e.target.value})}
                                            disabled={!formData.courseCode} // Disable kung wala pang course
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
                                        <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                                            <option value="">Select Status</option>
                                            <option value="Regular">Regular</option>
                                            <option value="Irregular">Irregular</option>
                                        </select>
                                    </div>

                                    <div className="auth-form-group">
                                        <label>Current Term</label>
                                        <select value={formData.term} onChange={e=>setFormData({...formData, term: e.target.value})}>
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
                                    <select value={formData.facultyStatus} onChange={e=>setFormData({...formData, facultyStatus: e.target.value})}>
                                        <option value="">Select Position</option>
                                        <option value="regular">Regular Faculty</option>
                                        <option value="head">Dept Head</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* === STEP 3: CAMERA === */}
                {step === 3 && (
                    <>
                        <h3 className="step-title">Step 3: Face Capture</h3>
                        <div className="camera-capture-section">
                            <div className="camera-preview">
                                <video ref={videoRef} playsInline muted className="camera-video" />
                                <canvas ref={canvasRef} style={{display: 'none'}} />
                            </div>
                            <div className="camera-actions">
                                <button className="auth-submit-button" onClick={handleCapture}>Capture</button>
                                <button className="auth-back-button" onClick={()=>setFaceCapture(null)}>Reset</button>
                            </div>
                            {faceCapture && <img src={faceCapture} alt="captured" className="captured-image" />}
                        </div>
                    </>
                )}

                {/* === STEP 4: SUMMARY & PASSWORD === */}
                {step === 4 && (
                    <>
                        <h3 className="step-title">Step 4: Review & Password</h3>
                        <div className="summary-section">
                            <div className="summary-item"><span className="summary-label">Name:</span> <span>{formData.firstName} {formData.middleInitial}. {formData.lastName}</span></div>
                            <div className="summary-item"><span className="summary-label">Birthday:</span> <span>{formData.birthday}</span></div>
                            <div className="summary-item"><span className="summary-label">Role:</span> <span style={{textTransform:'capitalize'}}>{role}</span></div>
                            <div className="summary-item"><span className="summary-label">Address:</span> <span>{formData.streetNumber} {formData.streetName}, {formData.barangay}, {formData.city}</span></div>
                        </div>

                        <div className="signup-step" style={{marginTop: '20px'}}>
                             <div className="auth-form-group full-width">
                                <label>Password</label>
                                <input type={showPassword ? "text":"password"} value={password} onChange={e=>setPassword(e.target.value)} />
                             </div>
                             <div className="auth-form-group full-width">
                                <label>Retype Password</label>
                                <input type={showRetypePassword ? "text":"password"} value={retypePassword} onChange={e=>setRetypePassword(e.target.value)} />
                             </div>
                        </div>
                    </>
                )}

                {/* BUTTONS (Bottom Right Next/Finish) */}
                <div className="step-buttons">
                    {step < 4 ? (
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

        {/* --- FOOTER --- */}
        <footer className="reg-footer">
            <div className="footer-content">
                <div className="footer-left">
                    <strong>Technological University of the Philippines</strong>
                    <span>Ayala Blvd, Ermita, Manila</span>
                    <span>1000 Metro Manila</span>
                </div>
                <div className="footer-right">
                    <strong>Contact Us</strong>
                    <span><i className="fas fa-phone-alt"></i> (02) 8524 4611</span>
                    <span><i className="fas fa-envelope"></i> helpdesk@tup.edu.ph</span>
                </div>
            </div>
            <div className="footer-copyright">
                © 2024 FRAMES Security System. All Rights Reserved.
            </div>
        </footer>
    </div>
  );
};

export default RegistrationPage;