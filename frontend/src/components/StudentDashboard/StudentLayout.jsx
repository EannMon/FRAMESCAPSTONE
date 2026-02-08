import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './StudentLayout.css';
import '../Common/Utility.css';
import '../Common/GlobalDashboard.css'; // Import Global Styles
import Header from '../Common/Header';

// --- THEME DEFINITION ---
const studentTheme = {
    primary: '#FFFFFF', // White Header
    dark: '#E2E8F0',    // Light Border
    lightBg: '#F1F5F9', // Hover Color
    text: '#0F172A'     // Dark Navy Text
};

// ===========================================
// 1. Student Sidebar Component
// ===========================================
const StudentSidebar = ({ user, isMobileOpen, toggleMobile, isCollapsed }) => {
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/student-dashboard' },
        { name: 'Schedule', icon: 'fas fa-calendar-alt', to: '/student-schedule' },
        { name: 'Attendance History', icon: 'fas fa-history', to: '/student-attendance' },
        { type: 'divider' }, // Visual separator
        { name: 'Settings', icon: 'fas fa-cog', to: '/student-settings' },
        { name: 'Help & Support', icon: 'fas fa-question-circle', to: '/student-help' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    // Construct Name
    const firstName = user?.first_name || user?.firstName || '';
    const lastName = user?.last_name || user?.lastName || '';
    const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : (user?.name || 'Student');
    
    // Avatar
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A62525&color=fff`;

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            <div 
                className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`} 
                onClick={toggleMobile}
            ></div>

            <aside className={`frames-sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                {/* BRANDING HEADER */}
                <div className="sidebar-brand">
                    <div className="sidebar-logo-container">
                        <img src="/shield-icon-white.svg" alt="Frames Logo" className="sidebar-logo-icon" />
                    </div>
                    {!isCollapsed && (
                        <div className="sidebar-brand-text-group">
                            <span className="sidebar-brand-title">FRAMES</span>
                        </div>
                    )}
                    {/* Mobile Close Button */}
                    <button className="mobile-sidebar-close" onClick={toggleMobile}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Role Tag */}
                {!isCollapsed && (
                    <div className="frames-role-tag">
                        STUDENT
                    </div>
                )}

                <nav className="student-nav">
                    <ul>
                        {navItems.map((item, index) => (
                            item.type === 'divider' ? (
                                <li key={`divider-${index}`} className="nav-divider"></li>
                            ) : (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.to}
                                        end={item.to === '/student-dashboard'}
                                        onClick={() => isMobileOpen && toggleMobile()} // Close on click mobile
                                        className={({ isActive }) => `frames-sidebar-link ${isActive ? 'active' : ''}`} // Use Global Class
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <i className={item.icon}></i>
                                        <span>{item.name}</span>
                                    </NavLink>
                                </li>
                            )
                        ))}
                    </ul>
                </nav>

                {/* USER PROFILE FOOTER */}
                <div className="sidebar-user-footer">
                    <Link to="/profile" className="sidebar-user-info" title="View Profile" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                        <img src={avatarSrc} alt="Profile" className="sidebar-user-avatar" />
                        {!isCollapsed && (
                            <div className="sidebar-user-details">
                                <span className="sidebar-user-name">{displayName}</span>
                                <span className="sidebar-user-role">Student</span>
                            </div>
                        )}
                    </Link>
                    {!isCollapsed && (
                        <button onClick={handleLogout} className="sidebar-logout-btn" title="Logout">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

// ===========================================
// 2. Main StudentLayout Component
// ===========================================
const StudentLayout = () => {
    const navigate = useNavigate();

    // State for user data and loading status
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed State

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    // FETCH USER DATA & SECURITY CHECK
    useEffect(() => {
        const loadUserData = async () => {
            const storedUserJson = localStorage.getItem('currentUser');

            if (!storedUserJson) {
                navigate('/');
                setLoading(false);
                return;
            }

            const storedUser = JSON.parse(storedUserJson);

            // --- SECURITY CHECK: VERIFICATION STATUS ---
            // If the user is logged in but not Verified (e.g., Pending/Rejected), block access.
            if (storedUser.verification_status !== 'Verified') {
                alert("Access denied. Your account is still pending verification.");
                // Redirect to a specific status page if you have one, or back to login
                // navigate(`/register/${storedUser.role}?s=${storedUser.verification_status.toLowerCase()}`); 
                navigate('/');
                localStorage.removeItem('currentUser'); // Force logout
                setLoading(false);
                return;
            }

            // --- SECURITY CHECK: FACE ENROLLMENT ---
            // Mandatory face enrollment before dashboard access
            if (!storedUser.face_registered) {
                navigate('/face-enrollment');
                setLoading(false);
                return;
            }

            // --- FETCH LIVE NOTIFICATIONS ---
            let notifCount = 0;
            try {
                // Fetch dashboard data to get accurate notification count
                const userId = storedUser.id || storedUser.user_id;
                const response = await axios.get(`http://localhost:5000/api/student/dashboard/${userId}`);
                const notifs = response.data.notifications || [];
                notifCount = notifs.filter(n => !n.is_read).length;
            } catch (error) {
                console.error("Failed to fetch notification count", error);
            }

            // --- UPDATE STATE ---
            setUser({
                ...storedUser,
                // We pass the raw data. The <Header> component will handle generating 
                // the Red Avatar based on firstName/lastName if avatar is null.
                notifications: notifCount
            });

            setLoading(false);
        };

        loadUserData();
    }, [navigate]);

    if (loading) {
        return <div style={{ textAlign: 'center', paddingTop: '100px', color: '#666' }}>Loading dashboard...</div>;
    }

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <Header 
                user={user} 
                setPanel={() => {}} 
                theme={studentTheme} 
                showLogo={false}
                toggleSidebar={toggleSidebar}
                isSidebarCollapsed={isCollapsed}
            />
            
            {/* Mobile Header Toggle (Visible only on mobile) */}
            <button className="mobile-menu-toggle" onClick={toggleMobile}>
                <i className="fas fa-bars"></i>
            </button>

            <div className="dashboard-body">
                <StudentSidebar 
                    user={user} 
                    isMobileOpen={isMobileOpen} 
                    toggleMobile={toggleMobile}
                    isCollapsed={isCollapsed}
                />
                <main className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
                    <Outlet context={{ user }} />
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;