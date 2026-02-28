import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HelpSupportPage.css';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Header from './Header';
import Footer from './Footer';

// --- Theme Definition ---
const redTheme = {
    primary: '#A62525',
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ==========================================
// 1. ROLE-BASED CONTENT (Business Process)
// ==========================================

const roleFaqData = {
    student: [
        {
            question: 'How do I register my face for attendance?',
            answer: "It's a simple one-time setup. Go to your Face Enrollment page, and the camera will guide you to capture 15 frames. Once that's done, you can just walk into class to be marked present!"
        },
        {
            question: 'I was late. Will it affect my record?',
            answer: "If you arrive after the class starts, the system marks it as 'Late' automatically. You can check your Attendance History to see exactly when you arrived for each session."
        },
        {
            question: 'My consistency score went down. Why?',
            answer: "Your score reflects your habits. If you've missed a few classes recently or been arriving late, the score dips to alert you. Attending regularly and on time will bring it back up."
        },
        {
            question: 'How can I book a room for study?',
            answer: "You can request facilities directly from your dashboard. Just submit the details at least 24 hours ahead so the admin team has time to approve it."
        }
    ],
    faculty: [
        {
            question: 'How do I check my class attendance?',
            answer: "Your dashboard shows a real-time summary of your classes. You can click on any specific class to see who is present, late, or absent right now."
        },
        {
            question: 'How do I upload my class schedule?',
            answer: "Simply upload your official COR PDF in the 'My Classes' section. The system handles the rest—parsing the schedule and even creating accounts for your students if they are new."
        },
        {
            question: 'can I correct a student\'s attendance?',
            answer: "Yes. If the system missed someone (maybe due to lighting), you can manually update their status in the daily attendance view for that class."
        },
        {
            question: 'What is the "Instructor Delay" logging?',
            answer: "The system logs when classes start. If a session begins later than the scheduled time, it records it for your personal attendance report."
        }
    ],
    dept_head: [
        {
            question: 'Where can I see how my faculty is doing?',
            answer: "Your main dashboard gives you a high-level view of all faculty members. You can see attendance trends and punctuality stats at a glance without digging through records."
        },
        {
            question: 'How do I optimize room usage?',
            answer: "Check the Room Utilization Report. It highlights which rooms are empty and which are overcrowded, helping you plan room assignments better for next semester."
        },
        {
            question: 'Where do I handle faculty requests?',
            answer: "Pending requests appear right at the top of your dashboard. You can review the details and approve or reject them with a single click."
        }
    ],
    admin: [
        {
            question: 'How is the system performing right now?',
            answer: "Your System Logs page shows a real-time health check. You can see camera statuses, server uptime, and any recent errors immediately."
        },
        {
            question: 'Do I need to verify users manually?',
            answer: "Rarely. Most users are verified automatically when faculty upload their class schedules. You only need to manually check users who register individually."
        },
        {
            question: 'How do I spot security threats?',
            answer: "The Security Dashboard highlights unusual activity, like unrecognized faces or spoofing attempts, so you can address them quickly."
        }
    ]
};

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

    // --- USER CONTEXT ---
    const { user } = useAuth();

    // --- Contact form state ---
    const [formSubject, setFormSubject] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null); // { type: 'success' | 'error', text: '...' }

    const handleBack = () => {
        navigate(-1);
    };

    const handleFaqClick = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!formSubject.trim() || !formMessage.trim()) {
            setSubmitResult({ type: 'error', text: 'Please fill in both subject and message.' });
            return;
        }
        try {
            setSubmitting(true);
            setSubmitResult(null);
            await api.post('/api/users/support-ticket', {
                user_id: user?.id,
                subject: formSubject.trim(),
                message: formMessage.trim(),
            });
            setSubmitResult({ type: 'success', text: 'Your message has been sent! We will get back to you soon.' });
            setFormSubject('');
            setFormMessage('');
        } catch (err) {
            setSubmitResult({ type: 'error', text: err.userMessage || 'Failed to send message. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Determine Role & Theme
    const role = user?.role?.toLowerCase() || 'student'; // Default to student if null
    const isFaculty = ['faculty', 'dept_head', 'head', 'admin'].includes(role);
    const themeClass = isFaculty ? 'faculty-theme' : '';

    // Get Data based on Role
    // Map 'head' or 'dept_head' to dept_head data, else use role directly. Fallback to student.
    const dataKey = role === 'head' ? 'dept_head' : (roleFaqData[role] ? role : 'student');
    const currentFaqs = roleFaqData[dataKey] || roleFaqData.student;

    return (
        <>
            {!isEmbedded && <Header theme={redTheme} user={user} setPanel={() => navigate('/')} />}

            <div className={`help-page-container ${isEmbedded ? 'embedded' : ''} ${themeClass} fade-in`}>

                {/* Header Section - Only show if NOT embedded (Standalone Mode) */}
                {!isEmbedded && (
                    <div className="help-header-bar">
                        <button onClick={handleBack} className="help-back-button">
                            <i className="fas fa-arrow-left"></i>
                            <span>Back</span>
                        </button>
                        <h1>Help & Support</h1>
                    </div>
                )}

                {/* Quick Access Grid */}
                <div className="help-grid-top">
                    <div className="card help-card">
                        <div className="help-card-icon">
                            <i className="fas fa-question-circle"></i>
                        </div>
                        <h3>FAQ</h3>
                        <p>Common questions for {role}</p>
                    </div>
                    <div className="card help-card">
                        <div className="help-card-icon">
                            <i className="fas fa-headset"></i>
                        </div>
                        <h3>Contact Support</h3>
                        <p>Report technical issues</p>
                    </div>
                    {!isEmbedded && (
                        <div className="card help-card">
                            <div className="help-card-icon">
                                <i className="fas fa-video"></i>
                            </div>
                            <h3>Video Tutorials</h3>
                            <p>Watch step-by-step guides</p>
                        </div>
                    )}
                </div>

                <div className="faq-section-full">
                    <div className="section-title">
                        <i className="fas fa-comments"></i>
                        <h3>Frequently Asked Questions</h3>
                    </div>
                    <div className="card faq-list-card">
                        {currentFaqs.map((item, index) => (
                            <FaqItem
                                key={index}
                                item={item}
                                isOpen={openFaq === index}
                                onClick={() => handleFaqClick(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Contact Support Section */}
                <div className="contact-support-section">
                    <div className="section-title">
                        <i className="fas fa-paper-plane"></i>
                        <h3>Contact Support</h3>
                    </div>
                    <div className="card contact-form-card">
                        <p className="contact-subtitle">Can't find what you're looking for? Send us a message.</p>
                        {submitResult && (
                            <div className={`contact-result ${submitResult.type}`} style={{
                                padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
                                background: submitResult.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: submitResult.type === 'success' ? '#166534' : '#991b1b',
                            }}>
                                {submitResult.text}
                            </div>
                        )}
                        <form className="mock-contact-form" onSubmit={handleContactSubmit}>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Login Issue"
                                    className="form-input"
                                    value={formSubject}
                                    onChange={(e) => setFormSubject(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    placeholder="Describe your issue..."
                                    rows="4"
                                    className="form-input"
                                    value={formMessage}
                                    onChange={(e) => setFormMessage(e.target.value)}
                                    disabled={submitting}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn-submit-support" disabled={submitting}>
                                <i className="fas fa-paper-plane"></i> {submitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>

            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default HelpSupportPage;