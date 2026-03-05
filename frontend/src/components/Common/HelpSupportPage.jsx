import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastProvider';
import api from '../../services/api';
import './HelpSupportPage.css';
import Header from './Header';
import Footer from './Footer';

// --- Theme Definition ---
const navyTheme = {
    primary: '#0F172A',
    dark: '#163269',
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
    const toast = useToast();
    const [openFaq, setOpenFaq] = useState(null);

    // Contact form state
    const [contactSubject, setContactSubject] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [contactError, setContactError] = useState('');
    const [contactFiles, setContactFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [myTickets, setMyTickets] = useState([]);
    const [showTickets, setShowTickets] = useState(false);

    // --- USER CONTEXT ---
    const [user] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    const handleBack = () => {
        navigate(-1);
    };

    // Fetch user's existing tickets
    const fetchMyTickets = async () => {
        if (!user?.id) return;
        try {
            const res = await api.get(`/api/support-tickets?user_id=${user.id}`);
            setMyTickets(res.data?.items || []);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        }
    };

    useEffect(() => {
        if (user?.id) fetchMyTickets();
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // File selection handler
    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files || []);
        const hasPdf = selected.some(f => f.type === 'application/pdf');
        const hasImages = selected.some(f => f.type.startsWith('image/'));

        if (hasPdf && hasImages) {
            toast.error('Upload either images or a PDF, not both.');
            e.target.value = '';
            return;
        }
        if (hasPdf && selected.filter(f => f.type === 'application/pdf').length > 1) {
            toast.error('Only 1 PDF file is allowed.');
            e.target.value = '';
            return;
        }
        if (hasImages && selected.filter(f => f.type.startsWith('image/')).length > 3) {
            toast.error('Maximum 3 image files allowed.');
            e.target.value = '';
            return;
        }
        setContactFiles(selected);
    };

    // Submit ticket via API
    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        setContactError('');

        if (!contactSubject.trim()) { setContactError('Subject is required.'); return; }
        if (!contactMessage.trim()) { setContactError('Message is required.'); return; }
        if (submitting) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('user_id', user?.id || 0);
            formData.append('subject', contactSubject.trim());
            formData.append('message', contactMessage.trim());
            contactFiles.forEach(file => formData.append('files', file));

            await api.post('/api/support-tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Support ticket submitted successfully!');
            setContactSubject('');
            setContactMessage('');
            setContactFiles([]);
            fetchMyTickets();
        } catch (err) {
            const msg = err.response?.data?.detail?.error?.message || err.message;
            toast.error('Failed to submit ticket: ' + msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFaqClick = (index) => {
        setOpenFaq(openFaq === index ? null : index);
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
            {!isEmbedded && <Header theme={navyTheme} user={user} setPanel={() => navigate('/')} />}

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

                {/* Contact Support Section — submits to support_tickets table */}
                <div className="contact-support-section">
                    <div className="section-title">
                        <i className="fas fa-paper-plane"></i>
                        <h3>Submit a Support Ticket</h3>
                    </div>
                    <div className="card contact-form-card">
                        <p className="contact-subtitle">
                            Describe your issue and our team will get back to you. You may attach evidence (up to 3 JPG/PNG images or 1 PDF).
                        </p>
                        <form className="mock-contact-form" onSubmit={handleSubmitTicket}>
                            {contactError && (
                                <div style={{ color: '#d63031', background: '#ffe6e6', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.9rem' }}>
                                    {contactError}
                                </div>
                            )}
                            <div className="form-group">
                                <label>Subject <span style={{ color: '#d63031' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g., Login Issue, Camera Not Working"
                                    className="form-input"
                                    value={contactSubject}
                                    onChange={(e) => setContactSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Message <span style={{ color: '#d63031' }}>*</span></label>
                                <textarea
                                    placeholder="Describe your issue in detail..."
                                    rows="4"
                                    className="form-input"
                                    value={contactMessage}
                                    onChange={(e) => setContactMessage(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Evidence (optional)</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    multiple
                                    onChange={handleFileChange}
                                />
                                <p style={{ fontSize: '0.78em', color: '#888', marginTop: 4 }}>
                                    Up to 3 images (JPG/PNG) or 1 PDF. Max 5MB each.
                                </p>
                            </div>
                            <button type="submit" className="btn-submit-support" disabled={submitting}>
                                <i className="fas fa-paper-plane"></i> {submitting ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* My Tickets Section */}
                <div className="contact-support-section" style={{ marginTop: 20 }}>
                    <div className="section-title" style={{ cursor: 'pointer' }} onClick={() => setShowTickets(!showTickets)}>
                        <i className="fas fa-ticket-alt"></i>
                        <h3>My Tickets ({myTickets.length})</h3>
                        <i className={`fas fa-chevron-down ${showTickets ? 'open' : ''}`} style={{ marginLeft: 'auto' }}></i>
                    </div>
                    {showTickets && (
                        <div className="card faq-list-card">
                            {myTickets.length === 0 ? (
                                <p style={{ padding: 16, color: '#888', textAlign: 'center' }}>No tickets submitted yet.</p>
                            ) : (
                                myTickets.map(t => (
                                    <div key={t.id} style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '0.92em' }}>{t.subject}</strong>
                                            <span style={{
                                                fontSize: '0.78em', padding: '3px 10px', borderRadius: 12,
                                                background: t.status === 'OPEN' ? '#e6f4ea' : t.status === 'IN_PROGRESS' ? '#fff8e1' : t.status === 'RESOLVED' ? '#e3f2fd' : '#f5f5f5',
                                                color: t.status === 'OPEN' ? '#2e7d32' : t.status === 'IN_PROGRESS' ? '#f57f17' : t.status === 'RESOLVED' ? '#1565c0' : '#666',
                                            }}>{t.status}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85em', color: '#555', margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>
                                            {t.message.length > 120 ? t.message.slice(0, 120) + '...' : t.message}
                                        </p>
                                        <div style={{ fontSize: '0.75em', color: '#aaa', marginTop: 4 }}>
                                            {t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                                            {t.evidence_files?.length > 0 && (
                                                <span style={{ marginLeft: 10 }}>
                                                    <i className="fas fa-paperclip"></i> {t.evidence_files.length} file(s)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default HelpSupportPage;