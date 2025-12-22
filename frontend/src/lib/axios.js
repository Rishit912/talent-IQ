import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_URL || '').trim();
// Normalize to ensure protocol is present; fallback to https if missing
const baseURL = rawBase
  ? (rawBase.startsWith('http') ? rawBase : `https://${rawBase.replace(/^\/*/, '')}`)
  : (typeof window !== 'undefined' ? `${window.location.origin}` : '');

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
});

// Attach Clerk session token to every request so protected routes succeed
axiosInstance.interceptors.request.use(async (config) => {
    try {
        const clerk = typeof window !== 'undefined' ? window.Clerk : null;
        const token = await clerk?.session?.getToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        console.warn('[axios] failed to attach auth token', err);
    }
    return config;
});

export default axiosInstance;