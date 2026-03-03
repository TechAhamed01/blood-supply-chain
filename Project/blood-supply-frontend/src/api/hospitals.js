import axiosInstance from './axios';

export const hospitalAPI = {
  getAll: async (params) => {
    const response = await axiosInstance.get('/hospitals/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/hospitals/${id}/`);
    return response.data;
  },

  createRequest: async (id, data) => {
    const response = await axiosInstance.post(`/hospitals/${id}/requests/`, data);
    return response.data;
  },

  getRequests: async (id, params) => {
    const response = await axiosInstance.get(`/hospitals/${id}/requests/`, { params });
    return response.data;
  },
};