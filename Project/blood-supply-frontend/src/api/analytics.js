import axiosInstance from './axios';

export const analyticsAPI = {
  getDashboard: async () => {
    const response = await axiosInstance.get('/analytics/dashboard/');
    return response.data;
  },

  getBloodUsage: async (params) => {
    const response = await axiosInstance.get('/analytics/blood-usage/', { params });
    return response.data;
  },

  getPredictions: async () => {
    const response = await axiosInstance.get('/analytics/predictions/');
    return response.data;
  },
};