import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';
import landingBg from '../../assets/images/landing_bg.png';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

// LandingPage.jsx

// === LOGIN COMPONENT ===
const LoginPanel = ({ isOpen, onClose, onSwitchToSignup }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        try {
            setErrorMessage('');
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email, password
            });

            if (response.data.message === "Login Successful") {
                const userData = response.data.user;
                const userRole = userData.role.toUpperCase();
                const verificationStatus = userData.verification_status;

                if (verificationStatus === 'Verified') {
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    alert(`Welcome back, ${userData.first_name}!`);

                    if (userRole === 'ADMIN') navigate('/admin-dashboard');
                    else if (userRole === 'STUDENT') navigate('/student-dashboard');
                    else if (userRole === 'FACULTY') navigate('/faculty-dashboard');
                    else if (userRole === 'HEAD' || userRole === 'DEPT_HEAD') navigate('/dept-head-dashboard');
                } else if (verificationStatus === 'Pending') {
                    navigate(`/register/${userRole.toLowerCase()}?s=pending`);
                } else if (verificationStatus === 'Rejected') {
                    navigate(`/register/${userRole.toLowerCase()}?s=rejected`);
                } else {
                    setErrorMessage("Account status is invalid. Please contact administrator.");
                }
            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMessage(error.response?.data?.detail || "Something went wrong. Try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="role-modal-overlay" onClick={onClose}>
            <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
                <h3>Welcome Back</h3>
                <p className="role-modal-subtitle">Sign in to your account</p>

                {errorMessage && (
                    <div className="login-error-msg">
                        <i className="fas fa-exclamation-circle"></i> {errorMessage}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="login-form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="example@tup.edu.ph"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="login-form-group">
                        <label>Password</label>
                        <div className="login-password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
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

                    <button type="submit" className="login-submit-btn">Log In</button>
                </form>

                <p className="login-switch-prompt">
                    Don't have an account? <span onClick={onSwitchToSignup}>Sign Up</span>
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
                    {/* Student Card */}
                    <div className="role-modal-item student" onClick={() => handleSelect('student')}>
                        <i className="fas fa-user-graduate"></i>
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
    <section className="hero-section" style={{ backgroundImage: `url(${landingBg})` }}>
        <div className="hero-content">
            <h1 className="hero-title">FRA<span className="hero-title-accent">MES</span></h1>
            <p className="hero-subtitle">
                Smart Campus Management System
            </p>
            <p className="hero-description">
                Revolutionary campus security powered by Raspberry Pi, featuring facial recognition, gesture control, and real-time monitoring for a safer, smarter educational environment.
            </p>

            <div className="cta-buttons">
                <button onClick={() => setPanel('login')} className="cta-primary">
                    <i className="fas fa-lock"></i> Access Portal
                </button>

                <button className="cta-secondary">
                    <i className="fas fa-play-circle"></i> Watch Demo
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