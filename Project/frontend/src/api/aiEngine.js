// src/api/aiEngine.js
import apiClient from './client';

export const aiApi = {
  // Train model
  trainModel: async (modelType = 'linear') => {
    const response = await apiClient.post('/predictions/train/', { model_type: modelType });
    return response.data;
  },

  // Get predictions
  predictDemand: async (hospitalId, bloodType, days = 7) => {
    const response = await apiClient.post('/predictions/predict/', {
      hospital_id: hospitalId,
      blood_type: bloodType,
      days: days,
    });
    return response.data;
  },

  // Get model info
  getModelInfo: async (modelType = 'linear') => {
    const response = await apiClient.get(`/predictions/model-info/?model_type=${modelType}`);
    return response.data;
  },
};