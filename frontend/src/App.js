import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import RegistrationPage from './components/LandingPage/RegistrationPage';

// Import Layout Components (Wrappers)
import AdminLayout from './components/AdminDashboard/AdminLayout'; 
import FacultyLayout from './components/FacultyDashboard/FacultyLayout'; 
import StudentLayout from './components/StudentDashboard/StudentLayout'; 


// --- Import Admin Pages ---
import AdminDashboardPage from './components/AdminDashboard/AdminDashboardPage'; 
import UserManagementPage from './components/AdminDashboard/UserManagementPage';
import ApplicationPage from './components/AdminDashboard/ApplicationPage'; // Gagamitin ito para sa Verification
import ReportsPage from './components/AdminDashboard/ReportsPage';
import SystemLogsPage from './components/AdminDashboard/SystemLogsPage';
// TINANGGAL: import UserVerificationPage from './components/AdminDashboard/UserVerificationPage'; 

// --- Import Faculty Pages ---
import FacultyDashboardPage from './components/FacultyDashboard/FacultyDashboardPage'; 
import MyClassesPage from './components/FacultyDashboard/MyClassesPage'; 
import FacultyAttendancePage from './components/FacultyDashboard/FacultyAttendancePage'; 
import FacultyReportsPage from './components/FacultyDashboard/FacultyReportsPage'; 
import DeptHeadManagePage from './components/FacultyDashboard/DeptHeadManagePage';
import DeptHeadReportsPage from './components/FacultyDashboard/DeptHeadReportsPage'; 

// --- Import Student Pages ---
import StudentDashboardPage from './components/StudentDashboard/StudentDashboardPage';
import SchedulePage from './components/StudentDashboard/SchedulePage';
import AttendanceHistoryPage from './components/StudentDashboard/AttendanceHistoryPage';

// --- Import Common Pages (from the ZCommon folder) ---
import MyProfilePage from './components/ZCommon/MyProfilePage';
import HelpSupportPage from './components/ZCommon/HelpSupportPage';
import SettingsPage from './components/ZCommon/SettingsPage';
import NotificationsPage from './components/ZCommon/NotificationsPage';

function App() {
    return (
        <Router> 
            <div className="App">
                <Routes>
                    {/* Main public routes */}
                    <Route path="/" element={<LandingPage />} />
                    {/* Ito yung route na maghahandle ng registration based sa role at status */}
                    <Route path="/register/:role" element={<RegistrationPage />} />

                    {/* --- Admin Routes (using AdminLayout) --- */}
                    <Route element={<AdminLayout />}>
                        <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                        <Route path="/admin-application" element={<ApplicationPage />} /> 
                        <Route path="/admin-user-management" element={<UserManagementPage />} />
                        {/* TINANGGAL: <Route path="/admin-verification" element={<UserVerificationPage />} /> */} 
                        <Route path="/admin-reports" element={<ReportsPage />} />
                        <Route path="/admin-logs" element={<SystemLogsPage />} />
                    </Route>
                    
                    {/* --- Faculty Routes (using FacultyLayout) --- */}
                    <Route element={<FacultyLayout />}>
                        <Route index path="/faculty-dashboard" element={<FacultyDashboardPage />} />
                        <Route path="/faculty-classes" element={<MyClassesPage />} />
                        <Route path="/faculty-attendance" element={<FacultyAttendancePage />} />
                        <Route path="/faculty-reports" element={<FacultyReportsPage />} />
                        <Route path="/faculty-dept-management" element={<DeptHeadManagePage />} />
                        <Route path="/faculty-dept-reports" element={<DeptHeadReportsPage />} /> 
                    </Route>
                    
                    {/* --- Student Routes (using StudentLayout) --- */}
                    <Route element={<StudentLayout />}>
                        <Route index path="/student-dashboard" element={<StudentDashboardPage />} />
                        <Route path="/student-schedule" element={<SchedulePage />} />
                        <Route path="/student-attendance" element={<AttendanceHistoryPage />} />
                        {/* These pages will use the StudentLayout header/sidebar but link to common pages */}
                        <Route path="/student-notifications" element={<NotificationsPage />} /> 
                        <Route path="/student-access-requests" element={<AttendanceHistoryPage />} /> 
                    </Route>

                    {/* --- Common Routes (Full Pages) --- */}
                    <Route path="/profile" element={<MyProfilePage />} />
                    <Route path="/help-support" element={<HelpSupportPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />

                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;