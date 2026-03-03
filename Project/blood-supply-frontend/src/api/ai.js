import axiosInstance from './axios';

export const aiAPI = {
  predict: async (data) => {
    const response = await axiosInstance.post('/ai/predict/', data);
    return response.data;
  },

  train: async (data) => {
    const response = await axiosInstance.post('/ai/train/', data);
    return response.data;
  },
};