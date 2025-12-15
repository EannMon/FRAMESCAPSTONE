import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import './LandingPage.css';
import heroImageUrl from '../../assets/images/TUP_Background.jpg';
import Header from '../ZCommon/Header'; 
import Footer from '../ZCommon/Footer';   

// LandingPage.jsx

// === LOGIN COMPONENT (MODIFIED) ===
const LoginPanel = ({ isOpen, onClose, onSwitchToSignup }) => {
    const navigate = useNavigate();
    
    // States for inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    // Password Visibility State
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        try {
            setErrorMessage(''); 

            const response = await axios.post('http://localhost:5000/login', {
                email: email,
                password: password
            });

            if (response.data.message === "Login Successful") {
                const userData = response.data.user;
                const userRole = userData.role;
                const verificationStatus = userData.verification_status; // Mula sa backend

                // --- NEW VERIFICATION CHECK LOGIC ---
                if (verificationStatus === 'Verified') {
                    // HAKBANG 1: VERIFIED - Payagan ang access sa Dashboard
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    alert(`Welcome back, ${userData.firstName}!`);

                    if (userRole === 'admin') {
                        navigate('/admin-dashboard');
                    } else if (userRole === 'student') {
                        navigate('/student-dashboard');
                    } else if (userRole === 'faculty' || userRole === 'dept_head') {
                        // Routing for Faculty and Dept Head (as per ClassSchedule table)
                        navigate('/faculty-dashboard'); 
                    } 
                } else if (verificationStatus === 'Pending') {
                    // HAKBANG 2: PENDING - I-redirect sa Registration page para sa status message
                    // Gagamitin ang role para sa routing ng RegistrationPage.jsx
                    navigate(`/register/${userRole}?s=pending`); 
                } else if (verificationStatus === 'Rejected') {
                    // HAKBANG 3: REJECTED - I-redirect sa Registration page para sa status message
                    navigate(`/register/${userRole}?s=rejected`);
                } else {
                    // Fallback
                    setErrorMessage("Account status is invalid. Please contact administrator.");
                }

            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMessage(error.response?.data?.error || "Something went wrong. Try again.");
        }
    };

    return (
        <>
            <div 
                className={`auth-slider-overlay login-overlay ${isOpen ? 'visible' : ''}`} 
                onClick={onClose}
            >
                <div 
                    className={`auth-panel login-panel ${isOpen ? 'visible' : ''}`} 
                    onClick={(e) => e.stopPropagation()} 
                >
                    <div className="auth-form-container">
                        <h2 className="auth-form-title">Welcome <span className="auth-title-highlight">Back!</span></h2>
                        
                        {errorMessage && (
                            <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center', background: '#ffe6e6', padding: '5px', borderRadius: '5px' }}>
                                <i className="fas fa-exclamation-circle"></i> {errorMessage}
                            </div>
                        )}

                        <div className="auth-form-group">
                            <label className="auth-form-label">Email</label>
                            <input 
                                className="auth-form-input" 
                                type="email" 
                                placeholder="example@tup.edu.ph"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* PASSWORD FIELD SECTION */}
                        <div className="auth-form-group">
                            <label className="auth-form-label">Password</label>
                            <div className="auth-password-wrapper">
                                <input 
                                    className="auth-form-input" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <i 
                                    className={`auth-password-icon fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ cursor: 'pointer' }}
                                ></i>
                            </div>
                        </div>
                        
                        <div className="auth-options-row">
                            <label className="auth-checkbox-group">
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" className="auth-forgot-link">Forgot Password?</a>
                        </div>

                        <button className="auth-submit-button" onClick={handleLogin}>Log In</button>
                        
                        <p className="auth-switch-prompt">
                            Don't have an account? <span onClick={onSwitchToSignup}>Sign Up</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

// ==========================================
// 2. ROLE SELECTION MODAL (Keep this for "Get Started/Sign Up")
// ==========================================
const RoleSelectionModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleSelect = (role) => {
        navigate(`/register/${role}`); 
    };

    if (!isOpen) return null;

    return (
        <div className="auth-slider-overlay signup-overlay visible" onClick={onClose}>
            <div className="signup-panel" onClick={(e) => e.stopPropagation()}>
                <h2 className="auth-form-title">Select Your Role</h2>
                <p className="role-selection-subtitle">Please choose your role to continue registration</p>
                
                <div className="role-cards-grid-auth">
                    {/* Faculty Card */}
                    <div className="role-card-auth faculty" onClick={() => handleSelect('faculty')}>
                        <i className="fas fa-chalkboard-teacher role-icon-auth"></i>
                        <h3>Faculty</h3>
                        <p>Access to academic-related features.</p>
                    </div>
                    {/* Student Card */}
                    <div className="role-card-auth student" onClick={() => handleSelect('student')}>
                        <i className="fas fa-user-graduate role-icon-auth"></i>
                        <h3>Student</h3>
                        <p>View personal schedules and campus info.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. HERO SECTION (UPDATED: Access Portal now opens Login)
// ==========================================
const HeroSection = ({ setPanel }) => ( 
    <section className="hero-section" style={{ backgroundImage: `url(${heroImageUrl})` }}>
        <div className="hero-overlay">
            <div className="hero-content">
                <h1 className="hero-title">FRA<span className="hero-title-red">MES</span></h1>
                <p>
                    Revolutionary campus security powered by Raspberry Pi, featuring facial recognition, gesture control, and Real-time monitoring for a safer, smarter educational environment.
                </p>
                
                <div className="cta-buttons">
                    {/* UPDATED: Changed from Link to Button calling setPanel('login') */}
                    <button onClick={() => setPanel('login')} className="cta-primary">
                    <i className="fas fa-lock"></i> Access Portal
                    </button>
                    
                    <button className="cta-secondary">
                        <i className="fas fa-play-circle"></i> Watch Demo
                    </button>
                </div>

            </div>
        </div>
    </section>
);

// ==========================================
// 4. FEATURES SECTION
// ==========================================
const FeatureCard = ({ iconClass, title, description }) => (
    <div className="feature-card">
        <div className="icon-container">
            <i className={iconClass}></i>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
);
  
const FeaturesSection = () => (
    <section className="features-section">
        <h2>Advanced Features for Campus Security</h2>
        <p className="features-subtitle">
            Our comprehensive system combines cutting-edge AI technology with reliable hardware to deliver unparalleled campus monitoring and access control capabilities.
        </p>
        <div className="features-grid">
            <FeatureCard 
                iconClass="fas fa-user-shield" 
                title="Facial Recognition" 
                description="Advanced AI-powered facial recognition for secure access control and automated attendance tracking across campus facilities."
            />
            <FeatureCard 
                iconClass="fas fa-hand-paper" 
                title="Gesture Control" 
                description="Intuitive hand gesture controls for contactless interaction with campus systems, enhancing hygiene and user experience."
            />
            <FeatureCard 
                iconClass="fas fa-video" 
                title="Real-time Monitoring" 
                description="Continuous surveillance and monitoring of campus activities with instant alerts and comprehensive security coverage."
            />
            <FeatureCard 
                iconClass="fas fa-bell" 
                title="Emergency Alerts" 
                description="Instant emergency notification system with automated threat detection and rapid response coordination capabilities."
            />
        </div>
    </section>
);

// ==========================================
// MAIN COMPONENT
// ==========================================
const LandingPage = () => {
    const [panel, setPanel] = useState(null); // 'login' or 'signup'

    return (
        <>
            <div className="landing-page">
                <Header setPanel={setPanel} />
                <main>
                    {/* Passed setPanel to HeroSection so buttons work */}
                    <HeroSection setPanel={setPanel} />
                    <FeaturesSection />
                </main>

                {/* MODALS */}
                <LoginPanel 
                    isOpen={panel === 'login'} 
                    onClose={() => setPanel(null)} 
                    onSwitchToSignup={() => setPanel('signup')}
                />

                {/* Kept this for 'Get Started' button so new users can choose their role */}
                <RoleSelectionModal 
                    isOpen={panel === 'signup'} 
                    onClose={() => setPanel(null)}
                />
            </div>
            <Footer />
        </>
    );
};

export default LandingPage;