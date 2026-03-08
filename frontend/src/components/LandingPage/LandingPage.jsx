import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Common/ToastProvider';
import api from '../../services/api';
import './LandingPage.css';
import landingBg from '../../assets/images/landing_bg.png';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

// LandingPage.jsx

// === LOGIN COMPONENT (Task #6, #23: Role-based login credentials) ===
const LoginPanel = ({ isOpen, onClose, onSwitchToSignup, initialMode }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { login, logout } = useAuth();

    const [loginMode, setLoginMode] = useState(initialMode || 'faculty'); // 'student' or 'faculty'
    const [credential, setCredential] = useState('');     // email (faculty) or TUP-M ID (student)
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');

    // Sync loginMode when initialMode changes (e.g., hero button clicked)
    useEffect(() => {
        if (initialMode) {
            setLoginMode(initialMode);
            setCredential('');
            setPassword('');
            setErrorMessage('');
        }
    }, [initialMode]);

    // Reset form when mode changes
    const handleModeChange = (mode) => {
        setLoginMode(mode);
        setCredential('');
        setPassword('');
        setErrorMessage('');
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            setErrorMessage('');
            const userData = await login(credential, password);

            const userRole = userData.role.toUpperCase();
            const verificationStatus = userData.verification_status?.toUpperCase();

            if (verificationStatus === 'VERIFIED') {
                toast.success(`Welcome back, ${userData.first_name}!`);

                if (userRole === 'ADMIN') navigate('/admin-dashboard');
                else if (userRole === 'STUDENT') navigate('/student-dashboard');
                else if (userRole === 'FACULTY') navigate('/faculty-dashboard');
                else if (userRole === 'HEAD' || userRole === 'DEPT_HEAD') navigate('/dept-head-dashboard');
            } else {
                logout();
                if (verificationStatus === 'PENDING') {
                    setErrorMessage("Your account is still pending approval. Please wait for your Department Head to verify your account.");
                } else if (verificationStatus === 'REJECTED') {
                    setErrorMessage("Your account has been rejected. Please contact the administrator for details.");
                } else {
                    setErrorMessage("Account status is invalid. Please contact administrator.");
                }
            }
        } catch (error) {
            const detail = error.response?.data?.detail;
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                setErrorMessage("Server is taking longer than expected. Please try again in a moment.");
            } else if (!error.response) {
                setErrorMessage("Cannot connect to server. Please check your connection and try again.");
            } else if (detail?.error?.message) {
                setErrorMessage(detail.error.message);
            } else if (typeof detail === 'string') {
                setErrorMessage(detail);
            } else {
                setErrorMessage("Invalid credentials. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e) => {
        if (e) e.preventDefault();
        if (!forgotEmail.trim()) {
            setForgotMessage('Please enter your registered email address.');
            return;
        }
        try {
            setForgotMessage('Sending...');
            await api.post('/api/auth/forgot-password', { email: forgotEmail.trim() });
            setForgotMessage('If this email is registered, a password reset link has been sent. Please check your inbox.');
        } catch {
            setForgotMessage('An error occurred. Please try again later.');
        }
    };

    if (!isOpen) return null;

    if (showForgotPassword) {
        return (
            <div className="role-modal-overlay" onClick={onClose}>
                <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
                    <h3>Forgot Password</h3>
                    <p className="role-modal-subtitle">Enter the email address associated with your account</p>

                    {forgotMessage && (
                        <div className="login-error-msg" style={{ background: forgotMessage.includes('sent') ? '#d1fae5' : '#fee2e2', color: forgotMessage.includes('sent') ? '#065f46' : '#b91c1c' }}>
                            <i className={`fas ${forgotMessage.includes('sent') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i> {forgotMessage}
                        </div>
                    )}

                    <form onSubmit={handleForgotPassword}>
                        <div className="login-form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="example@tup.edu.ph"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                        <button type="submit" className="login-submit-btn">
                            Send Reset Link
                        </button>
                    </form>

                    <p className="login-switch-prompt">
                        <span onClick={() => { setShowForgotPassword(false); setForgotMessage(''); }}>
                            <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Back to Login
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="role-modal-overlay" onClick={onClose}>
            <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
                <h3>Welcome Back</h3>
                <p className="role-modal-subtitle">Sign in to your account</p>

                {/* Login Mode Toggle */}
                <div className="login-mode-toggle" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                        type="button"
                        className={`login-mode-btn ${loginMode === 'faculty' ? 'active' : ''}`}
                        onClick={() => handleModeChange('faculty')}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid',
                            borderColor: loginMode === 'faculty' ? '#3b82f6' : '#e2e8f0',
                            background: loginMode === 'faculty' ? '#eff6ff' : '#fff',
                            color: loginMode === 'faculty' ? '#1d4ed8' : '#64748b',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <i className="fas fa-chalkboard-teacher" style={{ marginRight: '6px' }}></i>
                        Faculty / Head
                    </button>
                    <button
                        type="button"
                        className={`login-mode-btn ${loginMode === 'student' ? 'active' : ''}`}
                        onClick={() => handleModeChange('student')}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid',
                            borderColor: loginMode === 'student' ? '#3b82f6' : '#e2e8f0',
                            background: loginMode === 'student' ? '#eff6ff' : '#fff',
                            color: loginMode === 'student' ? '#1d4ed8' : '#64748b',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <i className="fas fa-user-graduate" style={{ marginRight: '6px' }}></i>
                        Student
                    </button>
                </div>

                {errorMessage && (
                    <div className="login-error-msg">
                        <i className="fas fa-exclamation-circle"></i> {errorMessage}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="login-form-group">
                        <label>{loginMode === 'student' ? 'TUP-M ID' : 'Email'}</label>
                        <input
                            type={loginMode === 'student' ? 'text' : 'email'}
                            placeholder={loginMode === 'student' ? 'TUPM-XX-XXXX' : 'example@tup.edu.ph'}
                            value={credential}
                            onChange={(e) => setCredential(loginMode === 'student' ? e.target.value.toUpperCase() : e.target.value)}
                            autoComplete={loginMode === 'student' ? 'username' : 'email'}
                        />
                    </div>

                    <div className="login-form-group">
                        <label>Password</label>
                        <div className="login-password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <i
                                className={`login-password-icon fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                onClick={() => setShowPassword(!showPassword)}
                            ></i>
                        </div>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="login-switch-prompt">
                    Forgot password? <span onClick={() => setShowForgotPassword(true)}>Click here</span>
                </p>
            </div>
        </div>
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
        <div className="role-modal-overlay" onClick={onClose}>
            <div className="role-modal-card" onClick={(e) => e.stopPropagation()}>
                <h3>Select Your Role</h3>
                <p className="role-modal-subtitle">Please choose your role to continue registration</p>

                <div className="role-modal-grid">
                    {/* Faculty Card */}
                    <div className="role-modal-item faculty" onClick={() => handleSelect('faculty')}>
                        <i className="fas fa-chalkboard-teacher"></i>
                        <h3>Faculty</h3>
                        <p>Access to academic-related features.</p>
                    </div>
                    {/* Department Head Card */}
                    <div className="role-modal-item head" onClick={() => handleSelect('head')}>
                        <i className="fas fa-user-tie"></i>
                        <h3>Department Head</h3>
                        <p>Manage department faculty and classes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. HERO SECTION (UPDATED: Access Portal now opens Login)
// ==========================================
const HeroSection = ({ setPanel, setLoginMode }) => (
    <section className="hero-section" style={{ backgroundImage: `url(${landingBg})` }}>
        <div className="hero-content">
            <h1 className="hero-title">FRA<span className="hero-title-accent">MES</span></h1>
            <p className="hero-subtitle">
                Smart Campus Management System
            </p>
            <p className="hero-description">
                Revolutionary campus security powered by Raspberry Pi, featuring facial recognition, gesture control, and real-time monitoring for a safer, smarter educational environment.
            </p>

            <p className="hero-description" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i> <strong>Note:</strong> Student accounts are automatically generated by the system. Only Department Heads and Faculty Members may create an account.
            </p>

            <div className="cta-buttons">
                <button onClick={() => { setLoginMode('faculty'); setPanel('login'); }} className="cta-primary">
                    <i className="fas fa-chalkboard-teacher"></i> Faculty / Head Login
                </button>

                <button onClick={() => { setLoginMode('student'); setPanel('login'); }} className="cta-secondary" style={{ background: '#1e3a5f', color: '#fff', border: 'none' }}>
                    <i className="fas fa-user-graduate"></i> Student Login
                </button>
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

const FeaturesSection = ({ aboutRef }) => (
    <section className="features-section" ref={aboutRef}>
        <h2>About FRAMES</h2>
        <p className="features-subtitle">
            Advanced Features for Campus Security
        </p>
        <p className="features-description" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px', color: '#64748b' }}>
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
                iconClass="fas fa-chart-bar"
                title="Report Generation"
                description="Comprehensive attendance reports with analytics, trends, and exportable data for students, faculty members, and department heads."
            />
        </div>
    </section>
);

// ==========================================
// MAIN COMPONENT
// ==========================================
const LandingPage = () => {
    const [panel, setPanel] = useState(null); // 'login' or 'signup'
    const [initialLoginMode, setInitialLoginMode] = useState('faculty');
    const aboutRef = React.useRef(null);

    const scrollToAbout = () => {
        aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Safety net: always remove dark mode on landing page
    useEffect(() => {
        document.body.classList.remove('dark-mode');
    }, []);

    return (
        <>
            <div className="landing-page">
                <Header setPanel={setPanel} onAboutClick={scrollToAbout} />
                <main>
                    <HeroSection setPanel={setPanel} setLoginMode={setInitialLoginMode} />
                    <FeaturesSection aboutRef={aboutRef} />
                </main>

                {/* MODALS */}
                <LoginPanel
                    isOpen={panel === 'login'}
                    onClose={() => setPanel(null)}
                    onSwitchToSignup={() => setPanel('signup')}
                    initialMode={initialLoginMode}
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