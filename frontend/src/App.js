import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import RegistrationPage from './components/LandingPage/RegistrationPage';
import RoleSelection from './components/RoleSelection/RoleSelection';
//import RegistrationPage from './components/LandingPage/Registration';
// Import Layout Components (Wrappers)
import AdminLayout from './components/AdminDashboard/AdminLayout'; 
import FacultyLayout from './components/FacultyDashboard/FacultyLayout'; // <-- UPDATED IMPORT
import StudentLayout from './components/StudentDashboard/StudentLayout'; // <-- UPDATED IMPORT

// --- Import Admin Pages ---
import AdminDashboardPage from './components/AdminDashboard/AdminDashboardPage'; 
import UserManagementPage from './components/AdminDashboard/UserManagementPage';
import ApplicationPage from './components/AdminDashboard/ApplicationPage';
import ReportsPage from './components/AdminDashboard/ReportsPage';
import SystemLogsPage from './components/AdminDashboard/SystemLogsPage';

// --- Import Faculty Pages ---
import FacultyDashboardPage from './components/FacultyDashboard/FacultyDashboardPage'; // <-- NEW
import MyClassesPage from './components/FacultyDashboard/MyClassesPage'; // <-- NEW
import FacultyAttendancePage from './components/FacultyDashboard/FacultyAttendancePage'; // <-- NEW
import FacultyReportsPage from './components/FacultyDashboard/FacultyReportsPage'; // <-- NEW

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
          {/* Ito yung bagong route na maghahandle ng registration based sa role */}
        <Route path="/register/:role" element={<RegistrationPage />} />
          <Route path="/select-role" element={<RoleSelection />} />

          {/* --- Admin Routes (using AdminLayout) --- */}
          <Route element={<AdminLayout />}>
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin-application" element={<ApplicationPage />} /> 
            <Route path="/admin-user-management" element={<UserManagementPage />} />
            <Route path="/admin-reports" element={<ReportsPage />} />
            <Route path="/admin-logs" element={<SystemLogsPage />} />
          </Route>
          
          {/* --- Faculty Routes (using FacultyLayout) --- */}
          <Route element={<FacultyLayout />}>
            <Route index path="/faculty-dashboard" element={<FacultyDashboardPage />} />
            <Route path="/faculty-classes" element={<MyClassesPage />} />
            <Route path="/faculty-attendance" element={<FacultyAttendancePage />} />
            <Route path="/faculty-reports" element={<FacultyReportsPage />} />
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