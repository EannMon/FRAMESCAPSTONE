import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Common/ToastProvider';
import api from '../../services/api';
import './LandingPage.css';
import landingBg from '../../assets/images/Untitled1005_20260305145507.jpg';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

// LandingPage.jsx

// === FACULTY LOGIN MODAL ===
const FacultyLoginModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { login, logout } = useAuth();

    const [credential, setCredential] = useState('');     // email
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');

    // Reset forgot password state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setShowForgotPassword(false);
            setForgotMessage('');
            setForgotEmail('');
        }
    }, [isOpen]);

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
                if (userRole === 'ADMIN' || userRole === 'FACULTY' || userRole === 'HEAD' || userRole === 'DEPT_HEAD') {
                    toast.success(`Welcome back, ${userData.first_name}!`);
                    if (userRole === 'ADMIN') navigate('/admin-dashboard');
                    else if (userRole === 'FACULTY') navigate('/faculty-dashboard');
                    else if (userRole === 'HEAD' || userRole === 'DEPT_HEAD') navigate('/dept-head-dashboard');
                } else {
                    logout();
                    setErrorMessage("This portal is for Faculty and Department Heads only. Students should use the Student Login portal.");
                }
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
            if (!error.response) {
                setErrorMessage("Cannot connect to the server. Please check your internet connection and try again.");
            } else if (error.response.status === 401 || error.response.status === 404) {
                setErrorMessage("Invalid email or password. Please try again.");
            } else {
                setErrorMessage(error.response?.data?.detail || "An unexpected error occurred during login.");
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
                    <p className="role-modal-subtitle">Enter the email address associated with your faculty account</p>
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
                                required
                            />
                        </div>
                        <button type="submit" className="login-submit-btn">Send Reset Link</button>
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
                <div className="login-modal-type-badge faculty">FACULTY / HEAD</div>
                <h3>Welcome Back</h3>
                <p className="role-modal-subtitle">Sign in to your faculty account</p>

                {errorMessage && (
                    <div className="login-error-msg">
                        <i className="fas fa-exclamation-circle"></i> {errorMessage}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="login-form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="example@tup.edu.ph"
                            value={credential}
                            onChange={(e) => setCredential(e.target.value)}
                            autoComplete="email"
                            required
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
                                required
                            />
                            <i className={`login-password-icon fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowPassword(!showPassword)}></i>
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

// === STUDENT LOGIN MODAL ===
const StudentLoginModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { login, logout } = useAuth();

    const [credential, setCredential] = useState('');     // TUP-M ID
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');

    // Reset forgot password state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setShowForgotPassword(false);
            setForgotMessage('');
            setForgotEmail('');
        }
    }, [isOpen]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            setErrorMessage('');
            const userData = await login(credential, password);
            const userRole = userData.role.toUpperCase();

            if (userRole === 'STUDENT') {
                toast.success(`Welcome back, ${userData.first_name}!`);
                navigate('/student-dashboard');
            } else {
                logout();
                setErrorMessage("This portal is for Students only. Faculty and Department Heads should use the Faculty/Head Login portal.");
            }
        } catch (error) {
            if (!error.response) {
                setErrorMessage("Cannot connect to the server. Please check your internet connection and try again.");
            } else if (error.response.status === 401 || error.response.status === 404) {
                setErrorMessage("Invalid TUP-M ID or password. Please try again.");
            } else {
                setErrorMessage(error.response?.data?.detail || "An unexpected error occurred during login.");
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
            // Send email-based password reset
            await api.post('/api/auth/forgot-password', { email: forgotEmail.trim(), type: 'student' });
            setForgotMessage('If this email is registered, a password reset link has been sent. Please check your inbox.');
        } catch (error) {
            setForgotMessage(error.response?.data?.detail || 'An error occurred. Please try again later.');
        }
    };

    if (!isOpen) return null;

    if (showForgotPassword) {
        return (
            <div className="role-modal-overlay" onClick={onClose}>
                <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
                    <div className="login-modal-type-badge student">STUDENT PORTAL</div>
                    <h3>Forgot Password</h3>
                    <p className="role-modal-subtitle">Enter the email address associated with your student account</p>

                    {forgotMessage && (
                        <div className="login-error-msg" style={{ background: forgotMessage.includes('sent') ? '#ecfdf5' : '#fee2e2', color: forgotMessage.includes('sent') ? '#065f46' : '#b91c1c' }}>
                            <i className={`fas ${forgotMessage.includes('sent') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i> {forgotMessage}
                        </div>
                    )}

                    <form onSubmit={handleForgotPassword}>
                        <div className="login-form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="example@student.tup.edu.ph"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                        <button type="submit" className="login-submit-btn">
                            Send Reset Link
                        </button>
                    </form>

                    <p className="login-switch-prompt">
                        <span onClick={() => { setShowForgotPassword(false); setForgotEmail(''); setForgotMessage(''); }}>
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
                <div className="login-modal-type-badge student">STUDENT PORTAL</div>
                <h3>Student Login</h3>
                <p className="role-modal-subtitle">Enter your TUP-M ID and password</p>

                {errorMessage && (
                    <div className="login-error-msg">
                        <i className="fas fa-exclamation-circle"></i> {errorMessage}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="login-form-group">
                        <label>TUP-M ID</label>
                        <input
                            type="text"
                            placeholder="TUPM-XX-XXXX"
                            value={credential}
                            onChange={(e) => setCredential(e.target.value.toUpperCase())}
                            autoComplete="username"
                            required
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
                                required
                            />
                            <i className={`login-password-icon fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowPassword(!showPassword)}></i>
                        </div>
                    </div>
                    <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
                <p className="login-switch-prompt">
                    Forgot password? <span onClick={() => setShowForgotPassword(true)}>Click here</span>
                </p>
                <div className="login-footer-info" style={{ marginTop: '20px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                    <i className="fas fa-info-circle"></i> Student accounts are automatically created. Default password is your Last Name if not yet changed.
                </div>
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

// === HERO SECTION ===
const HeroSection = ({ setPanel }) => (
    <section className="hero-section" style={{ backgroundImage: `url(${landingBg})` }}>
        <div className="scaling-overlay"></div>
        <div className="scanning-overlay">
            <div className="scanning-line"></div>
            <div className="scanning-dots"></div>
        </div>
        <div className="hero-content reveal-on-scroll">
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
                <button onClick={() => setPanel('faculty-login')} className="cta-primary">
                    <i className="fas fa-chalkboard-teacher"></i> Faculty / Head Login
                </button>

                <button onClick={() => setPanel('student-login')} className="cta-secondary">
                    <i className="fas fa-user-graduate"></i> Student Login
                </button>
            </div>
        </div>
    </section>
);

// ==========================================
// 4. FEATURES SECTION
// ==========================================
const FeatureCard = ({ title, description, delay }) => (
    <div className="feature-card reveal-on-scroll" style={{ transitionDelay: `${delay}ms` }}>
        <div className="tech-corners">
            <div className="tech-corner top-left"></div>
            <div className="tech-corner top-right"></div>
            <div className="tech-corner bottom-left"></div>
            <div className="tech-corner bottom-right"></div>
        </div>
        <div className="card-scanning-line"></div>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="card-data-point"></div>
    </div>
);

const FeaturesSection = ({ aboutRef }) => (
    <section className="features-section" ref={aboutRef}>
        <div className="reveal-on-scroll">
            <h2>About FRAMES</h2>
            <p className="features-subtitle">
                Advanced Features for Campus Security
            </p>
        </div>
        <p className="features-description" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px', color: '#64748b' }}>
            Our comprehensive system combines cutting-edge AI technology with reliable hardware to deliver unparalleled campus monitoring and access control capabilities.
        </p>
        <div className="features-grid">
            <FeatureCard
                title="Facial Recognition"
                description="Advanced AI-powered facial recognition for secure access control and automated attendance tracking across campus facilities."
                delay={0}
            />
            <FeatureCard
                title="Gesture Control"
                description="Intuitive hand gesture controls for contactless interaction with campus systems, enhancing hygiene and user experience."
                delay={100}
            />
            <FeatureCard
                title="Real-time Monitoring"
                description="Continuous surveillance and monitoring of campus activities with instant alerts and comprehensive security coverage."
                delay={200}
            />
            <FeatureCard
                title="Report Generation"
                description="Comprehensive attendance reports with analytics, trends, and exportable data for students, faculty members, and department heads."
                delay={300}
            />
        </div>
    </section>
);

// ==========================================
// WATCH DEMO MODAL
// Embeds the FRAMES demo video via Google Drive preview (no download needed).
// ==========================================
const DEMO_VIDEO_EMBED_URL = 'https://drive.google.com/file/d/1oKM-sy2aMLf6Sdwmetv69WJxTtR3zcUJ/preview';

const WatchDemoModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="role-modal-overlay" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    backgroundColor: '#0F172A',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    width: '90vw',
                    maxWidth: '960px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: '1px solid #1e293b',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-play-circle" style={{ color: '#38bdf8', fontSize: '1.2rem' }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', letterSpacing: '0.4px' }}>
                            FRAMES — System Demo
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            lineHeight: 1,
                            padding: '4px',
                            transition: 'color 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#FFFFFF'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                        aria-label="Close demo"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* 16:9 responsive video container */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, backgroundColor: '#000' }}>
                    <iframe
                        src={DEMO_VIDEO_EMBED_URL}
                        title="FRAMES System Demo"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const LandingPage = () => {
    const [panel, setPanel] = useState(null); // 'faculty-login', 'student-login', or 'signup'
    const aboutRef = React.useRef(null);

    const scrollToAbout = () => {
        aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll Reveal Logic
    useEffect(() => {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    // Safety net: always remove dark mode on landing page
    useEffect(() => {
        document.body.classList.remove('dark-mode');
    }, []);

    return (
        <>
            <div className="landing-page">
                <Header showLogo={true} setPanel={setPanel} onAboutClick={scrollToAbout} />
                <main>
                    <HeroSection setPanel={setPanel} />
                    <FeaturesSection aboutRef={aboutRef} />
                </main>

                {/* MODALS */}
                <WatchDemoModal
                    isOpen={panel === 'watch-demo'}
                    onClose={() => setPanel(null)}
                />

                <FacultyLoginModal
                    isOpen={panel === 'faculty-login'}
                    onClose={() => setPanel(null)}
                />

                <StudentLoginModal
                    isOpen={panel === 'student-login'}
                    onClose={() => setPanel(null)}
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