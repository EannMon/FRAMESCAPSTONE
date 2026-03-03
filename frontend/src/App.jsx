import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Common/ToastProvider';
import './components/Common/Toast.css';
import LandingPage from './components/LandingPage/LandingPage';
import RegistrationPage from './components/LandingPage/RegistrationPage';

// Face Enrollment (mandatory before dashboard access)
import FaceEnrollmentPage from './components/FaceEnrollment/FaceEnrollmentPage';

// Import Layout Components (Wrappers)
import AdminLayout from './components/AdminDashboard/AdminLayout';
import FacultyLayout from './components/FacultyDashboard/FacultyLayout';
import DeptHeadLayout from './components/DeptHeadDashboard/DeptHeadLayout';
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

// --- Import Dept Head Pages ---
import DeptHeadDashboardPage from './components/DeptHeadDashboard/DeptHeadDashboardPage';
import DeptHeadManagePage from './components/DeptHeadDashboard/DeptHeadManagePage';
import DeptHeadReportsPage from './components/DeptHeadDashboard/DeptHeadReportsPage';
import DeptHeadUserManagementPage from './components/DeptHeadDashboard/DeptHeadUserManagementPage';
import DeptHeadSystemLogsPage from './components/DeptHeadDashboard/DeptHeadSystemLogsPage';
import DeptHeadMyClassesPage from './components/DeptHeadDashboard/DeptHeadMyClassesPage';

// --- Import Student Pages ---
import StudentDashboardPage from './components/StudentDashboard/StudentDashboardPage';
import SchedulePage from './components/StudentDashboard/SchedulePage';
import AttendanceHistoryPage from './components/StudentDashboard/AttendanceHistoryPage';

// --- Import Common Pages (from the ZCommon folder) ---
import MyProfilePage from './components/Common/MyProfilePage';
import HelpSupportPage from './components/Common/HelpSupportPage';
import SettingsPage from './components/Common/SettingsPage';
import NotificationsPage from './components/Common/NotificationsPage';
import TestPDFPage from './components/TestPDFPage'; // New Template Sandbox
import KioskDashboardPage from './components/KioskDashboard/KioskDashboardPage';
import ErrorBoundary from './components/Common/ErrorBoundary';
import './components/Common/DarkMode.css'; // Global dark mode styles

function App() {

    return (
        <ToastProvider>
            <Router>
                <div className="App">
                    <Routes>
                        {/* Main public routes */}
                        <Route path="/" element={<LandingPage />} />
                        {/* Ito yung route na maghahandle ng registration based sa role at status */}
                        <Route path="/register/:role" element={<RegistrationPage />} />

                        {/* Face Enrollment - Mandatory for all users */}
                        <Route path="/face-enrollment" element={<FaceEnrollmentPage />} />

                        {/* --- Admin Routes (using AdminLayout) --- */}
                        <Route element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
                            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                            <Route path="/admin-application" element={<ApplicationPage />} />
                            <Route path="/admin-user-management" element={<UserManagementPage />} />
                            <Route path="/admin-reports" element={<ReportsPage />} />
                            <Route path="/admin-logs" element={<SystemLogsPage />} />
                        </Route>

                        {/* --- Dept Head Routes (using DeptHeadLayout) --- */}
                        <Route element={<ErrorBoundary><DeptHeadLayout /></ErrorBoundary>}>
                            <Route path="/dept-head-dashboard" element={<ErrorBoundary><DeptHeadDashboardPage /></ErrorBoundary>} />
                            <Route path="/dept-head-classes" element={<ErrorBoundary><DeptHeadMyClassesPage /></ErrorBoundary>} />
                            <Route path="/dept-head-management" element={<ErrorBoundary><DeptHeadManagePage /></ErrorBoundary>} />
                            <Route path="/dept-head-reports" element={<ErrorBoundary><DeptHeadReportsPage /></ErrorBoundary>} />
                            <Route path="/dept-head-users" element={<ErrorBoundary><DeptHeadUserManagementPage /></ErrorBoundary>} />
                            <Route path="/dept-head-logs" element={<ErrorBoundary><DeptHeadSystemLogsPage /></ErrorBoundary>} />
                            <Route path="/dept-head-profile" element={<MyProfilePage isEmbedded={true} />} />
                            <Route path="/dept-head-settings" element={<SettingsPage isEmbedded={true} />} />
                            <Route path="/dept-head-help" element={<HelpSupportPage isEmbedded={true} />} />
                            <Route path="/dept-head-notifications" element={<NotificationsPage isEmbedded={true} />} />
                        </Route>

                        {/* --- Faculty Routes (using FacultyLayout) --- */}
                        <Route element={<ErrorBoundary><FacultyLayout /></ErrorBoundary>}>
                            <Route index path="/faculty-dashboard" element={<ErrorBoundary><FacultyDashboardPage /></ErrorBoundary>} />
                            <Route path="/faculty-classes" element={<ErrorBoundary><MyClassesPage /></ErrorBoundary>} />
                            <Route path="/faculty-attendance" element={<ErrorBoundary><FacultyAttendancePage /></ErrorBoundary>} />
                            <Route path="/faculty-reports" element={<ErrorBoundary><FacultyReportsPage /></ErrorBoundary>} />
                            <Route path="/faculty-settings" element={<SettingsPage isEmbedded={true} />} />
                            <Route path="/faculty-help" element={<HelpSupportPage isEmbedded={true} />} />
                            <Route path="/faculty-profile" element={<MyProfilePage isEmbedded={true} />} />
                            <Route path="/faculty-notifications" element={<NotificationsPage isEmbedded={true} />} />
                        </Route>

                        {/* --- Student Routes (using StudentLayout) --- */}
                        <Route element={<ErrorBoundary><StudentLayout /></ErrorBoundary>}>
                            <Route index path="/student-dashboard" element={<ErrorBoundary><StudentDashboardPage /></ErrorBoundary>} />
                            <Route path="/student-schedule" element={<ErrorBoundary><SchedulePage /></ErrorBoundary>} />
                            <Route path="/student-attendance" element={<ErrorBoundary><AttendanceHistoryPage /></ErrorBoundary>} />
                            <Route path="/student-notifications" element={<NotificationsPage isEmbedded={true} />} />
                            <Route path="/student-access-requests" element={<ErrorBoundary><AttendanceHistoryPage /></ErrorBoundary>} />
                            <Route path="/student-settings" element={<SettingsPage isEmbedded={true} />} />
                            <Route path="/student-help" element={<HelpSupportPage isEmbedded={true} />} />
                            <Route path="/student-profile" element={<MyProfilePage isEmbedded={true} />} />
                        </Route>

                        {/* --- Common Routes (Full Pages) --- */}
                        <Route path="/profile" element={<MyProfilePage />} />
                        <Route path="/help-support" element={<HelpSupportPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />

                        {/* Template Sandbox */}
                        <Route path="/test-pdf" element={<TestPDFPage />} />

                        {/* Kiosk Dashboard - This is a standalone page that doesn't use any layout */}
                        <Route path="/kiosk" element={<KioskDashboardPage />} />

                        {/* Fallback route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </ToastProvider>
    );
}

export default App;