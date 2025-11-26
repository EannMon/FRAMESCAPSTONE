import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './FacultyLayout.css';
import '../ZCommon/Utility.css'; // Global utility styles
import LoggedInHeader from '../ZCommon/LoggedInHeader';

// --- FALLBACK ONLY (Gagamitin lang kapag walang picture sa Database) ---
const DEFAULT_AVATAR = 'https://placehold.co/100x100/f8d7da/dc3545?text=No+Img';

// --- THEME DEFINITION (RED THEME) ---
const facultyTheme = {
    primary: '#A62525', // Primary Red
    dark: '#c82333',
    lightBg: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF'
};

// ===========================================
// 1. Faculty Sidebar Component
// ===========================================
const FacultySidebar = () => {
    // Nav items updated to reflect the correct flat routing paths
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-th-large', to: '/faculty-dashboard' },
        { name: 'My Classes', icon: 'fas fa-book-reader', to: '/faculty-classes' },
        { name: 'Attendance', icon: 'fas fa-user-check', to: '/faculty-attendance' },
        { name: 'Reports', icon: 'fas fa-chart-bar', to: '/faculty-reports', notification: 2 },
    ];

    return (
        <aside className="faculty-sidebar">
            <div className="faculty-role-tag">
                Faculty Member
            </div>

            <nav className="faculty-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.to}
                                // Use 'end' to prevent the parent path from staying active
                                end={item.to === '/faculty-dashboard'}
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <i className={item.icon}></i>
                                <span>{item.name}</span>
                                {item.notification && <span className="notification-badge">{item.notification}</span>}
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
// 2. Main FacultyLayout Component (The Parent)
// ===========================================
const FacultyLayout = () => {
    const navigate = useNavigate();
    
    // Initial State (Placeholder muna habang naglo-load)
    const [user, setUser] = useState({
        name: 'Loading...',
        avatar: DEFAULT_AVATAR, 
        notifications: 0
    });

    useEffect(() => {
        // 1. Retrieve data from Local Storage (Galing sa Login)
        const storedUser = localStorage.getItem('currentUser');

        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            
            // 2. CHECK ROLE (Security)
            // Kung student ang nag-login pero pinuntahan ang /faculty-dashboard, sipain palabas!
            if (parsedUser.role !== 'faculty') {
                alert("Access Denied: This area is for Faculty members only.");
                navigate('/'); // Redirect to login
                return;
            }

            // 3. SET USER DATA FROM DB
            // Dito natin papalitan ang placeholder ng tunay na picture!
            setUser({
                name: `${parsedUser.firstName} ${parsedUser.lastName}`, // Combine names
                
                // LOGIC: Kung may laman si parsedUser.avatar, yun ang gamitin. Kung wala, fallback.
                avatar: parsedUser.avatar ? parsedUser.avatar : DEFAULT_AVATAR,
                
                notifications: 3 // Mock notification muna
            });
        } else {
            // Kung walang nakalogin, ibalik sa login page
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="dashboard-container">
            {/* Pass the DYNAMIC user object (with DB image) to the Header */}
            <LoggedInHeader theme={facultyTheme} user={user} />
            
            <div className="dashboard-body">
                <FacultySidebar />
                <div className="main-content-area">
                    {/* All child pages will render here */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;