import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HelpSupportPage.css';
import Header from './Header';
import Footer from './Footer';

// --- Theme Definition ---
const redTheme = {
    primary: '#A62525',
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// --- FAQ Data ---
const faqData = [
    {
        question: 'How do I register my face for campus access?',
        answer: "Go to your profile page and follow the 3-step face registration process. You'll need to verify your identity, capture your face, and complete the setup."
    },
    {
        question: 'Why is my attendance not showing correctly?',
        answer: "Attendance is automatically recorded when you enter classrooms. If there's an issue, contact your instructor or submit a support ticket with the specific date and class details."
    },
    {
        question: 'How do I request access to campus facilities?',
        answer: 'Use the Access Requests page to submit requests for labs, study rooms, and other facilities. Requests must be submitted 24 hours in advance.'
    },
    {
        question: 'Can I change my notification preferences?',
        answer: 'Yes, go to the Notifications page and scroll down to Notification Preferences to customize your email and push notification settings.'
    },
    {
        question: "What should I do if I'm locked out of my account?",
        answer: 'Contact the IT support team immediately or submit an urgent support ticket. You can also visit the campus IT help desk for immediate assistance.'
    }
];

// --- Single FAQ Item Component ---
const FaqItem = ({ item, isOpen, onClick }) => {
    return (
        <div className="faq-item">
            <button className="faq-question" onClick={onClick}>
                <span>{item.question}</span>
                <i className={`fas fa-chevron-down ${isOpen ? 'open' : ''}`}></i>
            </button>
            <div className={`faq-answer ${isOpen ? 'open' : ''}`}>
                <p>{item.answer}</p>
            </div>
        </div>
    );
};

// --- Main Help & Support Page Component ---
const HelpSupportPage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    // --- FIX: GET REAL USER FROM STORAGE ---
    // This ensures the Header shows the logged-in user's Name & Red Avatar
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    });

    const handleBack = () => {
        navigate(-1);
    };

    const handleFaqClick = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <>
            {!isEmbedded && <Header theme={redTheme} user={user} setPanel={() => navigate('/')} />}

            <div className={`help-page-container ${isEmbedded ? 'embedded' : ''}`}>
                {!isEmbedded && (
                    <div className="help-header-bar">
                        <button onClick={handleBack} className="help-back-button">
                            <i className="fas fa-arrow-left"></i>
                            <span>Back</span>
                        </button>
                        <h1>Help & Support</h1>
                    </div>
                )}

                <div className="help-grid-top">
                    <div className="card help-card">
                        <div className="help-card-icon">
                            <i className="fas fa-question-circle"></i>
                        </div>
                        <h3>FAQ</h3>
                        <p>Find answers to common questions</p>
                    </div>
                    <div className="card help-card">
                        <div className="help-card-icon">
                            <i className="fas fa-book-open"></i>
                        </div>
                        <h3>User Guide</h3>
                        <p>Step-by-step tutorials and guides</p>
                    </div>
                </div>

                <div className="faq-section">
                    <h2>Frequently Asked Questions</h2>
                    <div className="card faq-list-card">
                        {faqData.map((item, index) => (
                            <FaqItem
                                key={index}
                                item={item}
                                isOpen={openFaq === index}
                                onClick={() => handleFaqClick(index)}
                            />
                        ))}
                    </div>
                </div>

            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default HelpSupportPage;