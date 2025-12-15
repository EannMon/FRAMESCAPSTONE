import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './FacultyLayout.css'; 
import '../ZCommon/Utility.css'; 
import Header from '../ZCommon/Header'; 

// NOTE: Kailangan i-define ang DEFAULT_AVATAR
const DEFAULT_AVATAR = 'https://placehold.co/100x100/f8d7da/dc3545?text=No+Img';

// --- THEME DEFINITION ---
const facultyTheme = {
    primary: '#A62525', 
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Faculty Sidebar Component (Merged Logic)
// ===========================================
const FacultySidebar = ({ user }) => {
    // --- LOGIC: Check if user is a Department Head ---
    // Pinagsama ang lahat ng kondisyon: faculty_status O role
    const isDeptHead = user?.faculty_status === 'Head' || 
                       user?.faculty_status === 'Department Head' || 
                       user?.role === 'dept_head';

    // Base Navigation Items
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports' },
    ];

    // CONDITIONAL: Add Dept Management tab if Head
    if (isDeptHead) {
        navItems.push({ 
            name: 'Department Mgmt', 
            icon: 'fas fa-university', 
            to: '/faculty-dept-management' 
        });
    }

    return (
        <aside className="faculty-sidebar">
            {/* Dynamic Role Tag */}
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
// 2. Main FacultyLayout Component (Merged Security & Loading)
// ===========================================
const FacultyLayout = () => {
    const navigate = useNavigate();
    
    // NEW STATES: Loading state at initial user state
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null); 

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const role = parsedUser.role?.toLowerCase();
            
            // --- HAKBANG 1: VERIFICATION STATUS CHECK ---
            if (parsedUser.verification_status !== 'Verified') {
                alert("Access denied. Your account is still pending verification.");
                navigate(`/register/${role}?s=${parsedUser.verification_status.toLowerCase()}`); 
                setLoading(false); 
                return; 
            }
            // --- END VERIFICATION CHECK ---

            // --- HAKBANG 2: ROLE CHECK ---
            if (role !== 'faculty' && role !== 'dept_head') {
                navigate('/'); 
                setLoading(false);
                return;
            }

            // Set User Data (Pinagsama ang data structure para sa sidebar/header)
            setUser({
                ...parsedUser, 
                name: `${parsedUser.firstName} ${parsedUser.lastName}`,
                avatar: parsedUser.avatar || DEFAULT_AVATAR,
                faculty_status: parsedUser.faculty_status || 'Regular',
                notifications: parsedUser.notifications || 0
            });
            setLoading(false); 

        } else {
            navigate('/');
            setLoading(false); 
        }
    }, [navigate]);

    // HAKBANG 3: Loading Screen 
    if (loading || !user) {
        return <div style={{textAlign: 'center', paddingTop: '100px'}}>Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Tiyakin na gumagamit ng tamang Header component */}
            <Header theme={facultyTheme} user={user} />
            
            <div className="dashboard-body">
                <FacultySidebar user={user} />
                
                <div className="main-content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;