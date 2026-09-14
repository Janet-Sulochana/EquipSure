import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
