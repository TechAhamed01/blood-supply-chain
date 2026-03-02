// src/api/admin.js
import apiClient from './client';

export const adminApi = {
  // Get dashboard data
  getDashboardStats: async () => {
    const response = await apiClient.get('/analytics/dashboard/');
    return response.data;
  },

  // Get demand trends
  getDemandTrends: async (params = {}) => {
    const response = await apiClient.get('/analytics/demand-trends/', { params });
    return response.data;
  },

  // Get fulfillment rates
  getFulfillmentRates: async () => {
    const response = await apiClient.get('/analytics/fulfillment-rate/');
    return response.data;
  },

  // Get expiry forecast
  getExpiryForecast: async () => {
    const response = await apiClient.get('/analytics/expiry-forecast/');
    return response.data;
  },

  // Global shortages
  getAllShortages: async () => {
    const response = await apiClient.get('/blood-banks/all-shortages/');
    return response.data;
  },

  // Global expiring items
  getAllExpiring: async (days = 7) => {
    const response = await apiClient.get(`/blood-banks/all-expiring/?days=${days}`);
    return response.data;
  },
};