import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import heroImageUrl from '../../assets/images/TUP_Background.jpg'; // Make sure tama path mo dito

// LandingPage.jsx

// === LOGIN COMPONENT (Now a Centered Modal) ===
const LoginPanel = ({ isOpen, onClose, onSwitchToSignup }) => {
    return (
        <>
            {/* Overlay Background (Clicking here closes the modal) */}
            <div 
                className={`auth-slider-overlay login-overlay ${isOpen ? 'visible' : ''}`} 
                onClick={onClose}
            >
                {/* White Panel Box (Clicking here DOES NOT close modal) */}
                <div 
                    className={`auth-panel login-panel ${isOpen ? 'visible' : ''}`} 
                    onClick={(e) => e.stopPropagation()} 
                >
                    <div className="auth-form-container">
                        <h2 className="auth-form-title">Welcome <span className="auth-title-highlight">Back!</span></h2>
                        
                        {/* Input fields */}
                        <div className="auth-form-group">
                            <label className="auth-form-label">Email</label>
                            <input className="auth-form-input" type="email" placeholder="example@tup.edu.ph"/>
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-form-label">Password</label>
                            <div className="auth-password-wrapper">
                                <input className="auth-form-input" type="password" placeholder="••••••••"/>
                                <i className="auth-password-icon fas fa-eye"></i>
                            </div>
                        </div>
                        
                        <div className="auth-options-row">
                            <label className="auth-checkbox-group">
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" className="auth-forgot-link">Forgot Password?</a>
                        </div>

                        <button className="auth-submit-button">Log In</button>
                        
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
// 2. ROLE SELECTION MODAL (The Overlay)
// ==========================================
const RoleSelectionModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleSelect = (role) => {
        // Dito na papasok yung separate Registration Page na ginawa natin kanina
        navigate(`/register/${role}`); 
    };

    if (!isOpen) return null;

    return (
        <div className="auth-slider-overlay signup-overlay visible" onClick={onClose}>
             {/* stopPropagation prevents closing when clicking INSIDE the box */}
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
// 3. HERO SECTION (RESTORED BUTTONS!)
// ==========================================
const HeroSection = ({ setPanel }) => ( 
  <section className="hero-section" style={{ backgroundImage: `url(${heroImageUrl})` }}>
    <div className="hero-overlay">
      <div className="hero-content">
        <h1 className="hero-title">FRA<span className="hero-title-red">MES</span></h1>
        <p>
          Revolutionary campus security powered by Raspberry Pi, featuring facial recognition, gesture control, and Real-time monitoring for a safer, smarter educational environment.
        </p>
        
        {/* --- DITO KO BINALIK YUNG BUTTONS MO --- */}
        <div className="cta-buttons">
          {/* Access Portal: Opens the Role Selection Modal */}
          <button onClick={() => setPanel('signup')} className="cta-primary">
            <i className="fas fa-lock"></i> Access Portal
          </button>
          
          {/* Watch Demo: Restored Visual Only */}
          <button className="cta-secondary">
            <i className="fas fa-play-circle"></i> Watch Demo
          </button>
        </div>
        {/* ---------------------------------------- */}
      </div>
    </div>
  </section>
);

// ==========================================
// 4. HEADER COMPONENT
// ==========================================
const Header = ({ setPanel }) => (
  <header className="header">
    <div className="logo"><span>FRAMES</span></div>
    <nav className="nav-links">
      <button onClick={() => setPanel('login')} className="login-link">Login</button>
      <button onClick={() => setPanel('signup')} className="get-started-button">Get Started</button>
    </nav>
  </header>
);

// ==========================================
// 5. FEATURES SECTION
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

      <RoleSelectionModal 
        isOpen={panel === 'signup'} 
        onClose={() => setPanel(null)}
      />
    </div>
  );
};

export default LandingPage;