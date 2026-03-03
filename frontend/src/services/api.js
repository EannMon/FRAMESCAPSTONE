/**
 * Centralized API Client for FRAMES Frontend
 * Per FRAMES_DEPLOYMENT_CONSTRAINTS §3.1
 * 
 * All API calls MUST go through this instance.
 * Handles: baseURL, JWT token injection, 401 redirect, timeout.
 */
import axios from 'axios';

// In development, Vite proxy handles /api → localhost:5000
// In production, set VITE_API_BASE_URL to the real backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT access token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle 401 globally, log timeouts
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear auth and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        }
        if (error.code === 'ECONNABORTED') {
            console.warn('[FRAMES] Request timed out:', error.config?.url);
        } else if (!error.response) {
            console.warn('[FRAMES] Network error (backend down?):', error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default api;
