import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import Axios para sa live notification count
import './StudentLayout.css';
import '../ZCommon/Utility.css';
import Header from '../ZCommon/Header'; 

// --- THEME DEFINITION ---
const studentTheme = {
    primary: '#A62525', // Primary Red
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Student Sidebar Component
// ===========================================
const StudentSidebar = () => {
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/student-dashboard' },
        { name: 'Schedule', icon: 'fas fa-calendar-alt', to: '/student-schedule' },
        { name: 'Attendance History', icon: 'fas fa-history', to: '/student-attendance' },
    ];

    return (
        <aside className="student-sidebar">
            <div className="student-sidebar-toggle">
                <i className="fas fa-bars"></i>
            </div>
            <div className="student-role-tag">
                Student
            </div>
            <nav className="student-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink 
                                to={item.to} 
                                end={item.to === '/student-dashboard'}
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <i className={item.icon}></i>
                                <span>{item.name}</span>
                             </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                SmartCampus v2.1.0
            </div>
        </aside>
    );
};

// ===========================================
// 2. Main StudentLayout Component (UPDATED with Verification Check)
// ===========================================
const StudentLayout = () => {
    const navigate = useNavigate();
    
    // NEW STATES: user (for authenticated data) at loading (para sa initial check)
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. FETCH USER DATA & SECURITY CHECK ON MOUNT
    useEffect(() => {
        const loadUserData = async () => {
            const storedUserJson = localStorage.getItem('currentUser');
            
            if (!storedUserJson) {
                // Walang naka-login, ibalik sa landing page
                navigate('/');
                setLoading(false); // End loading for failed attempt
                return;
            }

            const storedUser = JSON.parse(storedUserJson);

            // --- HAKBANG 1: SECURITY CHECK (ADDED) ---
            if (storedUser.verification_status !== 'Verified') {
                alert("Access denied. Your account is still pending verification.");
                // Redirect sa Registration Status page
                navigate(`/register/${storedUser.role}?s=${storedUser.verification_status.toLowerCase()}`); 
                setLoading(false); 
                return;
            }
            // --- END SECURITY CHECK ---

            // B. (Optional) Fetch Live Notification Count form Backend
            let notifCount = 0;
            try {
                // Re-using the dashboard endpoint to get notification count
                const response = await axios.get(`http://localhost:5000/api/student/dashboard/${storedUser.user_id}`);
                const notifs = response.data.notifications || [];
                // Count unread notifications
                notifCount = notifs.filter(n => !n.is_read).length;
            } catch (error) {
                console.error("Failed to fetch notification count", error);
                // Patuloy pa rin kahit may error sa notif count
            }

            // C. Update State
            setUser({
                ...storedUser, // Ilagay ang lahat ng user data
                name: `${storedUser.firstName} ${storedUser.lastName}`,
                // Gamitin ang avatar galing DB kung meron, or generated one based on Initials
                avatar: storedUser.avatar || `https://ui-avatars.com/api/?name=${storedUser.firstName}+${storedUser.lastName}&background=f8d7da&color=dc3545`,
                notifications: notifCount
            });
            setLoading(false);
        };

        loadUserData();
    }, [navigate]);

    // HAKBANG 2: Loading Screen
    if (loading || !user) {
        return <div style={{textAlign: 'center', paddingTop: '100px'}}>Loading dashboard...</div>;
    }


    return (
        <div className="dashboard-container">
            {/* Pass the DYNAMIC 'user' state to the Header */}
            <Header theme={studentTheme} user={user} />
            
            <div className="dashboard-body">
                <StudentSidebar />
                <div className="main-content-area">
                    {/* I-pass ang user object sa Outlet context para magamit sa mga child components */}
                    <Outlet context={{ user }} /> 
                </div>
            </div>
            {/* Tiyakin na ang Footer ay nandiyan pa rin kung saan ito nararapat, bagama't wala sa snippet ninyo */}
            {/* <Footer /> */} 
        </div>
    );
};

export default StudentLayout;