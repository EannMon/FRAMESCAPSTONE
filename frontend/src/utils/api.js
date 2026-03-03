import axios from 'axios';

// Global timeout: 10 seconds (was undefined = hang forever)
// This prevents blank pages when Aiven DB is slow to respond
axios.defaults.timeout = 10000;

// Global response interceptor: log timeout vs network errors clearly
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.warn('[FRAMES] Request timed out:', error.config?.url);
        } else if (!error.response) {
            console.warn('[FRAMES] Network error (backend down?):', error.config?.url);
        }
        return Promise.reject(error);
    }
);
