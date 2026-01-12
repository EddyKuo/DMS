import axios from 'axios';

export const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

client.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Check if we are not already on the login page to avoid loops (though router handles this usually)
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                // Clear storage and redirect
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
