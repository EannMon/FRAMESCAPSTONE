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
// ROLE-BASED FAQ DATA (FRAMES features only)
// ==========================================

const roleFaqData = {
    student: [
        {
            question: 'How do I register my face for attendance?',
            answer: "After logging in for the first time, you will be redirected to the Face Enrollment page. The system captures 15 frames from your webcam automatically. Make sure you are in a well-lit area and facing the camera directly. Once enrolled, the kiosk will recognize you when you enter the classroom."
        },
        {
            question: 'How does the kiosk mark my attendance?',
            answer: "When you stand in front of the classroom kiosk, the system recognizes your face and automatically logs your Entry. For subsequent actions — Break-out (peace sign), Break-in (thumbs-up), and Exit (open palm) — you need to show the corresponding hand gesture to confirm the action."
        },
        {
            question: 'What happens if I arrive late to class?',
            answer: "The system compares your entry time against the scheduled class start time. If you arrive after the grace period, your attendance is automatically flagged as 'Late'. You can view the exact timestamp in your Attendance History page."
        },
        {
            question: 'How do I check my attendance records?',
            answer: "Go to your Student Dashboard and click on 'Attendance History'. You can view your attendance per class, see your on-time vs. late entries, and check your overall attendance rate for the semester."
        },
        {
            question: 'What does my attendance rate percentage mean?',
            answer: "Your attendance rate is calculated as the number of classes you attended (on-time or late) divided by the total number of class sessions held. It does not count sessions that were cancelled or not conducted."
        },
        {
            question: 'The kiosk did not recognize me. What should I do?',
            answer: "This can happen due to poor lighting, a significant change in appearance, or camera angle. Try adjusting your position so your face is clearly visible. If the issue persists, you may need to re-enroll your face from your dashboard under Face Enrollment."
        },
        {
            question: 'How do I change my default password?',
            answer: "Your initial password is your surname in lowercase. After logging in, go to your Profile and use the Change Password option to set a new secure password."
        },
        {
            question: 'Can I download my attendance records?',
            answer: "Yes. In your Attendance History page, you can export your records in CSV or PDF format for your personal documentation."
        }
    ],
    faculty: [
        {
            question: 'How do I upload my class schedule?',
            answer: "Go to 'My Classes' and click 'Upload Schedule'. Upload your official Certificate of Registration (COR) PDF exported from the TUP portal. The system will automatically parse the schedule, create class records, and auto-enroll students listed in the document."
        },
        {
            question: 'How are student accounts created?',
            answer: "When you upload your COR PDF, the system reads the enrolled student list. For students who do not have existing accounts, FRAMES automatically creates their accounts using their TUPM-ID as username and their surname (lowercase) as the default password. Students are auto-verified and can log in immediately."
        },
        {
            question: 'How do I check attendance for a specific class?',
            answer: "From your Faculty Dashboard, click on any class card to view real-time attendance. You can see which students are present, late, on break, or absent for the current session."
        },
        {
            question: 'Can I view attendance reports across multiple sessions?',
            answer: "Yes. Go to the Reports section and select the class and date range. You can generate per-class attendance summaries showing trends over time and export them as CSV or PDF."
        },
        {
            question: 'What happens if a student\'s face was not recognized by the kiosk?',
            answer: "The kiosk flags unrecognized faces as anomalies and displays a notification. The student will not have an attendance record for that session. If this is a recurring issue, advise the student to re-enroll their face from their dashboard."
        },
        {
            question: 'How does the auto-exit mechanism work?',
            answer: "When a class reaches its scheduled end time, any students still marked as 'present' (who did not scan an Exit gesture) are automatically logged out with an AUTO_TIMEOUT status. This ensures all sessions have a clean close."
        },
        {
            question: 'Can I have multiple class sections?',
            answer: "Yes. Each section is treated as a separate class in FRAMES. When you upload your COR, the system creates individual records per section, each with its own schedule, room, and enrolled student list."
        }
    ],
    dept_head: [
        {
            question: 'How do I invite faculty members to the system?',
            answer: "Go to Faculty Management and use the 'Invite Faculty' feature. Enter the faculty member's email address and the system sends a unique registration link valid for 48 hours. When they register through that link, their account is automatically verified — no manual approval needed."
        },
        {
            question: 'How do I monitor department-wide attendance?',
            answer: "Your Department Head Dashboard shows aggregated attendance data across all faculty and classes in your department. You can view overall attendance rates, faculty punctuality, and class conduct summaries at a glance."
        },
        {
            question: 'Can I see which rooms are being utilized?',
            answer: "Yes. The Reports section includes room utilization data based on actual attendance logs — showing which rooms have active classes and how many students attended per session."
        },
        {
            question: 'How do I verify or manage user accounts?',
            answer: "Go to User Management in your dashboard. You can view all users in your department, check their verification status, and manage faculty or student accounts as needed."
        },
        {
            question: 'How do I generate department reports?',
            answer: "Navigate to Reports and select the type of report you need — attendance summary, faculty compliance, or class-level breakdown. Reports can be filtered by date range and exported as CSV or PDF."
        },
        {
            question: 'What notifications will I receive?',
            answer: "You will see notifications for anomaly detections (unrecognized faces at the kiosk), pending faculty invitations, and system alerts. These appear on your dashboard and notification panel."
        },
        {
            question: 'Can I view a specific faculty member\'s classes?',
            answer: "Yes. In Faculty Management, click on any faculty member to see their uploaded schedule, class sections, and per-class attendance statistics."
        }
    ],
    admin: [
        {
            question: 'How do I manage user accounts?',
            answer: "The User Management page lists all registered users. You can filter by role (Student, Faculty, Department Head), check verification status, and take actions like approving or deactivating accounts."
        },
        {
            question: 'Where can I view system activity logs?',
            answer: "The System Logs page shows recent system events including user registrations, attendance logs, kiosk activity, and any errors or anomalies detected by the system."
        },
        {
            question: 'How do I handle user verification requests?',
            answer: "Pending verification requests appear in the Applications section. Review the user's details and approve or reject their registration. Faculty members invited via the token system are auto-verified and do not appear here."
        },
        {
            question: 'Can I generate system-wide reports?',
            answer: "Yes. The Reports section allows you to generate attendance reports across all departments, view overall system usage statistics, and export data for administrative review."
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
    const [activeTab, setActiveTab] = useState('faq'); // 'faq' or 'contact'

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
    const role = user?.role?.toLowerCase() || 'student';
    const isFaculty = ['faculty', 'dept_head', 'head', 'admin'].includes(role);
    const themeClass = isFaculty ? 'faculty-theme' : '';

    // Get Data based on Role
    const dataKey = role === 'head' ? 'dept_head' : (roleFaqData[role] ? role : 'student');
    const currentFaqs = roleFaqData[dataKey] || roleFaqData.student;

    // Role display name for tab header
    const roleDisplayName = {
        student: 'Student',
        faculty: 'Faculty',
        dept_head: 'Department Head',
        head: 'Department Head',
        admin: 'Admin'
    }[role] || 'Student';

    return (
        <>
            {!isEmbedded && <Header theme={navyTheme} user={user} setPanel={() => navigate('/')} />}

            <div className={`help-page-container ${isEmbedded ? 'embedded' : ''} ${themeClass} fade-in`}>

                {/* Header Section - Only show if NOT embedded */}
                {!isEmbedded && (
                    <div className="help-header-bar">
                        <button onClick={handleBack} className="help-back-button">
                            <i className="fas fa-arrow-left"></i>
                            <span>Back</span>
                        </button>
                        <h1>Help & Support</h1>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="help-tab-nav">
                    <button
                        className={`help-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('faq'); setOpenFaq(null); }}
                    >
                        <i className="fas fa-question-circle"></i>
                        <span>FAQ</span>
                    </button>
                    <button
                        className={`help-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('contact')}
                    >
                        <i className="fas fa-headset"></i>
                        <span>Contact Support</span>
                    </button>
                </div>

                {/* ===== FAQ TAB ===== */}
                {activeTab === 'faq' && (
                    <div className="faq-section-full">
                        <div className="section-title">
                            <i className="fas fa-comments"></i>
                            <h3>Frequently Asked Questions — {roleDisplayName} Module</h3>
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
                )}

                {/* ===== CONTACT SUPPORT TAB ===== */}
                {activeTab === 'contact' && (
                    <>
                        {/* Submit Ticket Form */}
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
                                <h3>My Support Tickets ({myTickets.length})</h3>
                                <i className={`fas fa-chevron-down ${showTickets ? 'open' : ''}`} style={{ marginLeft: 'auto' }}></i>
                            </div>
                            {showTickets && (
                                <div className="card faq-list-card">
                                    {myTickets.length === 0 ? (
                                        <p style={{ padding: 16, color: '#888', textAlign: 'center' }}>No tickets submitted yet.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {myTickets.map(t => (
                                                <div 
                                                    key={t.id}
                                                    style={{ 
                                                        padding: '14px 16px', 
                                                        borderBottom: '1px solid #eee',
                                                        cursor: 'pointer',
                                                        borderLeft: '3px solid',
                                                        borderLeftColor: t.status === 'OPEN' ? '#10b981' : t.status === 'IN_PROGRESS' ? '#f59e0b' : t.status === 'RESOLVED' ? '#3b82f6' : '#9ca3af',
                                                        backgroundColor: 'transparent',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                                                        <div style={{flex: 1}}>
                                                            <strong style={{ fontSize: '0.95em', color: '#0f172a' }}>#{t.id} - {t.subject}</strong>
                                                            <p style={{ fontSize: '0.85em', color: '#475569', margin: '6px 0 0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                                                {t.message.length > 100 ? t.message.slice(0, 100) + '...' : t.message}
                                                            </p>
                                                            <div style={{ fontSize: '0.75em', color: '#94a3b8', marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                <span>{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
                                                                {t.evidence_files?.length > 0 && (
                                                                    <span><i className="fas fa-paperclip"></i> {t.evidence_files.length} file(s)</span>
                                                                )}
                                                                {(t.replies?.length || 0) > 0 && (
                                                                    <span><i className="fas fa-reply"></i> {t.replies.length} reply(ies)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.8em', 
                                                            padding: '4px 12px', 
                                                            borderRadius: '14px',
                                                            fontWeight: '600',
                                                            whiteSpace: 'nowrap',
                                                            background: t.status === 'OPEN' ? '#d1fae5' : t.status === 'IN_PROGRESS' ? '#fef3c7' : t.status === 'RESOLVED' ? '#dbeafe' : '#f3f4f6',
                                                            color: t.status === 'OPEN' ? '#065f46' : t.status === 'IN_PROGRESS' ? '#92400e' : t.status === 'RESOLVED' ? '#0c4a6e' : '#374151',
                                                        }}>
                                                            {t.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>

            {!isEmbedded && <Footer />}
        </>
    );
};

export default HelpSupportPage;