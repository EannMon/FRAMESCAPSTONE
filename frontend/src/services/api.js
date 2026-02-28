/**
 * Centralized API client for FRAMES frontend.
 *
 * - Uses VITE_API_URL env var when set (production / kiosk builds).
 * - Falls back to '' (empty string) so requests go through the Vite
 *   dev-server proxy configured in vite.config.js (/api → 127.0.0.1:5000).
 * - Every component should import `api` instead of raw `axios` so that
 *   base URL, interceptors and future JWT headers live in one place.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor ─────────────────────────────────────────────── */
api.interceptors.request.use((config) => {
    // Reads auth state from localStorage (single source synced by AuthContext).
    // When backend adds real JWT, change this to read a token instead of user obj.
    try {
        const json = localStorage.getItem('currentUser');
        if (json) {
            const user = JSON.parse(json);
            // Future JWT: replace the line below with a real Bearer token
            if (user?.id) config.headers['X-User-Id'] = user.id;
        }
    } catch { /* corrupted storage — skip */ }
    return config;
});

/* ── Response interceptor ────────────────────────────────────────────── */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Swallow AbortController cancellations silently
        if (error.code === 'ERR_CANCELED') return Promise.reject(error);

        // Structured error extraction
        const detail = error.response?.data?.detail;
        let message = 'An unexpected error occurred.';

        if (typeof detail === 'string') {
            message = detail;
        } else if (Array.isArray(detail)) {
            // Pydantic validation errors
            message = detail.map((e) => e.msg || e.message || JSON.stringify(e)).join(', ');
        } else if (detail && typeof detail === 'object') {
            message = detail.msg || detail.message || JSON.stringify(detail);
        } else if (error.response?.data?.error) {
            message = error.response.data.error;
        }

        // Attach cleaned message for consumers
        error.userMessage = message;
        return Promise.reject(error);
    },
);

export default api;
export { API_BASE_URL };
