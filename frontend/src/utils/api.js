import axios from 'axios';

// In development, Vite proxy routes /api → localhost:5000, so baseURL = ''
// In production (Vercel), VITE_API_BASE_URL = 'https://frames-backend.onrender.com'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

if (API_BASE_URL) {
    axios.defaults.baseURL = API_BASE_URL;
}

// Global timeout: 10 seconds (was undefined = hang forever)
// This prevents blank pages when Aiven DB is slow to respond
axios.defaults.timeout = 10000;

// Attach JWT token to every request
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global response interceptor: log timeout vs network errors clearly
// 401 → wipe token and redirect to login
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.warn('[FRAMES] Request timed out:', error.config?.url);
        } else if (!error.response) {
            console.warn('[FRAMES] Network error (backend down?):', error.config?.url);
        } else if (error.response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
