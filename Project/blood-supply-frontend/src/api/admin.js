import axiosInstance from './axios';

export const adminAPI = {
  getUsers: async (params) => {
    const response = await axiosInstance.get('/admin/users/', { params });
    return response.data;
  },

  createUser: async (data) => {
    const response = await axiosInstance.post('/admin/users/', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await axiosInstance.patch(`/admin/users/${id}/`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axiosInstance.delete(`/admin/users/${id}/`);
    return response.data;
  },
};