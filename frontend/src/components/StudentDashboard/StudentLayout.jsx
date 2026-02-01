import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentLayout.css';
import '../Common/Utility.css';
import Header from '../Common/Header';

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
// 2. Main StudentLayout Component
// ===========================================
const StudentLayout = () => {
    const navigate = useNavigate();

    // State for user data and loading status
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            {/* Header handles the Avatar and Dropdown logic */}
            <Header theme={studentTheme} user={user} />

            <div className="dashboard-body">
                <StudentSidebar />
                <div className="main-content-area">
                    {/* Pass user context to child pages */}
                    <Outlet context={{ user }} />
                </div>
            </div>
        </div>
    );
};

export default StudentLayout;