/**
 * ProtectedRoute — Route guard component for FRAMES
 * Per FRAMES_DEPLOYMENT_CONSTRAINTS §3.6
 * 
 * Verifies authentication AND role before rendering.
 * Redirects unauthorized users to login.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ allowedRoles, children }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', paddingTop: '100px', color: '#666' }}>
                Loading...
            </div>
        );
    }

    // Not authenticated — redirect to login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Check role authorization (case-insensitive comparison)
    const userRole = (user.role || '').toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());

    if (!allowed.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    // Check verification status
    if (user.verification_status !== 'Verified') {
        return <Navigate to={`/register/${user.role}?s=${user.verification_status?.toLowerCase()}`} replace />;
    }

    return children;
}

export default ProtectedRoute;
