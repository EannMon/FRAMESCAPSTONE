/**
 * AuthContext — Centralized authentication state for FRAMES.
 *
 * Provides:
 *   - `user`        Current user object (or null)
 *   - `login(data)` Persists user to state + localStorage, returns role-based path
 *   - `logout()`    Clears state + localStorage, navigates to "/"
 *   - `updateUser(partial)` Merges partial fields into user (e.g. after profile edit)
 *   - `isAuthenticated` Boolean shorthand
 *   - `hasRole(...roles)` Check if user matches any of the given roles
 *
 * Every component should use `useAuth()` instead of raw
 * `localStorage.getItem('currentUser')`.
 *
 * localStorage is still the persistence layer (no backend JWT yet),
 * but this context is the SINGLE SOURCE OF TRUTH at runtime.
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AuthContext = createContext(null);

/* ── Helper: read stored user once on first render ─────────────────── */
const readStoredUser = () => {
    try {
        const json = localStorage.getItem('currentUser');
        return json ? JSON.parse(json) : null;
    } catch {
        localStorage.removeItem('currentUser');
        return null;
    }
};

/* ── Helper: role-based landing path ───────────────────────────────── */
const rolePath = (role) => {
    switch (role?.toUpperCase()) {
        case 'ADMIN':     return '/admin-dashboard';
        case 'STUDENT':   return '/student-dashboard';
        case 'FACULTY':   return '/faculty-dashboard';
        case 'HEAD':
        case 'DEPT_HEAD': return '/dept-head-dashboard';
        default:          return '/';
    }
};

/* ── Provider ──────────────────────────────────────────────────────── */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(readStoredUser);

    /** Call after a successful POST /api/auth/login.
     *  Saves user to state + localStorage.
     *  Returns the path the caller should navigate() to. */
    const login = useCallback((userData) => {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);

        const status = userData.verification_status;
        const role   = userData.role?.toUpperCase();

        if (status === 'Verified') {
            return rolePath(role);
        }
        // Non-verified users go to status page
        return `/register/${role?.toLowerCase()}?s=${status?.toLowerCase()}`;
    }, []);

    /** Clear everything — call from sidebar logout or Header logout. */
    const logout = useCallback(() => {
        localStorage.removeItem('currentUser');
        setUser(null);
        // Navigation left to caller (navigate('/') or window.location)
    }, []);

    /** Merge partial updates into user (profile edit, face enrollment, etc.)
     *  Also syncs back to localStorage so a refresh keeps the new data. */
    const updateUser = useCallback((partial) => {
        setUser((prev) => {
            const merged = { ...prev, ...partial };
            localStorage.setItem('currentUser', JSON.stringify(merged));
            return merged;
        });
    }, []);

    const isAuthenticated = !!user;

    /** e.g. hasRole('ADMIN') or hasRole('HEAD', 'DEPT_HEAD') */
    const hasRole = useCallback(
        (...roles) => roles.some((r) => r.toUpperCase() === user?.role?.toUpperCase()),
        [user],
    );

    const value = useMemo(
        () => ({ user, login, logout, updateUser, isAuthenticated, hasRole }),
        [user, login, logout, updateUser, isAuthenticated, hasRole],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ── Hook ──────────────────────────────────────────────────────────── */
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
    return ctx;
};

export default AuthContext;
