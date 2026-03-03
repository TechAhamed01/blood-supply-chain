import axiosInstance from './axios';

export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login/', credentials);
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axiosInstance.post('/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  getUser: async () => {
    const response = await axiosInstance.get('/auth/user/');
    return response.data;
  },

  refreshToken: async (refresh) => {
    const response = await axiosInstance.post('/auth/refresh/', { refresh });
    return response.data;
  },
};