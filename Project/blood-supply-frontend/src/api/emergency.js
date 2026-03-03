import axiosInstance from './axios';

export const emergencyAPI = {
  create: async (data) => {
    const response = await axiosInstance.post('/emergency-requests/', data);
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/emergency-requests/${id}/`);
    return response.data;
  },
};