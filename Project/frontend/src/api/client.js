// src/api/client.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Our API always returns { status, data, message, meta }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data.data;
        localStorage.setItem('accessToken', access);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Format error response consistently
    const errorResponse = {
      status: 'error',
      message: error.response?.data?.message || 'An unexpected error occurred',
      errors: error.response?.data?.errors || {},
      code: error.response?.status || 500,
    };

    return Promise.reject(errorResponse);
  }
);

export default apiClient;