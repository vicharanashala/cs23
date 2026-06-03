import axios from 'axios';
import { getSessionId } from './session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject the session ID on every request
api.interceptors.request.use((config) => {
  config.headers['X-Session-Id'] = getSessionId();
  return config;
});

// Response interceptor — surface API error messages clearly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error?.message ||
        `Request failed with status ${error.response.status}`;
      return Promise.reject(new Error(message));
    }
    if (error.request) {
      return Promise.reject(new Error('Network error — is the server running?'));
    }
    return Promise.reject(error);
  }
);

export default api;