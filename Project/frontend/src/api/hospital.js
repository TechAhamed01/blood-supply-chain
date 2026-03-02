// src/api/hospital.js
import apiClient from './client';

export const hospitalApi = {
  // Get hospital profile
  getMyHospital: async () => {
    const response = await apiClient.get('/hospitals/my-hospital/');
    return response.data;
  },

  // Request blood
  requestBlood: async (hospitalId, data) => {
    const response = await apiClient.post(`/hospitals/${hospitalId}/request-blood/`, data);
    return response.data;
  },

  // Get demand history
  getDemandHistory: async (hospitalId, params = {}) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/demand-history/`, { params });
    return response.data;
  },

  // Get pending requests
  getPendingRequests: async (hospitalId) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/pending-requests/`);
    return response.data;
  },

  // Get predictions
  getDemandPredictions: async (hospitalId, bloodType, days = 7) => {
    const response = await apiClient.post('/predictions/predict/', {
      hospital_id: hospitalId,
      blood_type: bloodType,
      days: days,
    });
    return response.data;
  },
};