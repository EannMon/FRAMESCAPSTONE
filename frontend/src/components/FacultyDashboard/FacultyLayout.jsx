import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import './FacultyLayout.css'; 
import '../ZCommon/Utility.css'; 
import Header from '../ZCommon/Header'; 

// --- THEME DEFINITION ---
const facultyTheme = {
    primary: '#A62525', 
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Faculty Sidebar Component
// ===========================================
const FacultySidebar = ({ user }) => {
    // --- LOGIC: Check if user is a Department Head ---
    const isDeptHead = user?.faculty_status === 'Head' || 
                       user?.faculty_status === 'Department Head' || 
                       user?.role === 'dept_head';

    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports' },
    ];

    if (isDeptHead) {
        navItems.push({ 
            name: 'Department Mgmt', 
            icon: 'fas fa-university', 
            to: '/faculty-dept-management' 
        });
    }

    return (
        <aside className="faculty-sidebar">
            <div className="faculty-role-tag">
                {isDeptHead ? "Department Head" : "Faculty Member"}
            </div>

            <nav className="faculty-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
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
// 2. Main FacultyLayout Component
// ===========================================
const FacultyLayout = () => {
    const navigate = useNavigate();
    
    // States for user data and loading
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            const storedUserJson = localStorage.getItem('currentUser');
            
            if (!storedUserJson) {
                navigate('/');
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(storedUserJson);
            const role = parsedUser.role?.toLowerCase();

            // --- 1. SECURITY CHECK: VERIFICATION ---
            if (parsedUser.verification_status !== 'Verified') {
                alert("Access denied. Your account is still pending verification.");
                localStorage.removeItem('currentUser'); // Force logout
                navigate('/'); 
                setLoading(false); 
                return; 
            }

            // --- 2. SECURITY CHECK: ROLE ---
            if (role !== 'faculty' && role !== 'dept_head') {
                alert("Access denied. Authorized for Faculty only.");
                navigate('/'); 
                setLoading(false);
                return;
            }

            // --- 3. FETCH LIVE STATS (Optional) ---
            // You can fetch notification counts here if needed, similar to StudentLayout
            // For now, we assume notifications are inside the user object or handled by Header

            // Set User Data
            setUser({
                ...parsedUser, 
                // Fix: Remove hardcoded default avatar. 
                // Let Header generate initials if avatar is null/empty.
                faculty_status: parsedUser.faculty_status || 'Regular' 
            });
            
            setLoading(false); 
        };

        loadUserData();
    }, [navigate]);

    if (loading) {
        return <div style={{textAlign: 'center', paddingTop: '100px', color: '#666'}}>Loading dashboard...</div>;
    }

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <Header theme={facultyTheme} user={user} />
            
            <div className="dashboard-body">
                <FacultySidebar user={user} />
                
                <div className="main-content-area">
                    <Outlet context={{ user }} />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;