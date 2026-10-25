import axios from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';

// If Render blueprint provided service name without domain (e.g. "equipsure-api")
if (rawBaseUrl && !rawBaseUrl.includes('.') && !rawBaseUrl.includes('localhost') && !rawBaseUrl.startsWith('/')) {
  rawBaseUrl = `${rawBaseUrl}.onrender.com`;
}

if (rawBaseUrl && !rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://') && !rawBaseUrl.startsWith('/')) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const baseURL = rawBaseUrl
  ? (rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('equipsure_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login, redirect to login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('equipsure_token');
        localStorage.removeItem('equipsure_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
