import axiosInstance from './axios';

export const bloodBankAPI = {
  getAll: async (params) => {
    const response = await axiosInstance.get('/blood-banks/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/blood-banks/${id}/`);
    return response.data;
  },

  getInventory: async (id, params) => {
    const response = await axiosInstance.get(`/blood-banks/${id}/inventory/`, { params });
    return response.data;
  },

  updateInventory: async (id, data) => {
    const response = await axiosInstance.post(`/blood-banks/${id}/inventory/`, data);
    return response.data;
  },

  getAlerts: async (id, params) => {
    const response = await axiosInstance.get(`/blood-banks/${id}/alerts/`, { params });
    return response.data;
  },
};