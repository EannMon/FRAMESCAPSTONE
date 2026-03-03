/**
 * Authentication Context for FRAMES
 * Per FRAMES_DEPLOYMENT_CONSTRAINTS §3.5
 * 
 * Provides: user state, login, logout, isLoading
 * Replaces scattered JSON.parse(localStorage.getItem('currentUser')) calls.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount — restore user from localStorage if token exists
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('currentUser');

        if (token && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
            } catch {
                // Corrupted data — clear and force re-login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('currentUser');
            }
        }
        setIsLoading(false);
    }, []);

    /**
     * Login — calls /api/auth/login, stores tokens + user, updates state.
     * Returns the user object on success, throws on failure.
     */
    const login = async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        const data = response.data;

        // Store JWT tokens
        if (data.access_token) {
            localStorage.setItem('accessToken', data.access_token);
        }
        if (data.refresh_token) {
            localStorage.setItem('refreshToken', data.refresh_token);
        }

        // Store user data (for quick restore on page refresh)
        const userData = data.user;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);

        return userData;
    };

    /**
     * Logout — clears all auth state and redirects to login.
     */
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        setUser(null);
        document.body.classList.remove('dark-mode');
    };

    /**
     * Update user data in context and localStorage (after profile edit, etc.)
     */
    const updateUser = (newUserData) => {
        const merged = { ...user, ...newUserData };
        localStorage.setItem('currentUser', JSON.stringify(merged));
        setUser(merged);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth state from any component.
 * Per FRAMES rules: use this instead of raw localStorage reads.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
