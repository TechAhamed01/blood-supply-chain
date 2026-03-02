// src/api/bloodBank.js
import apiClient from './client';

export const bloodBankApi = {
  // Get blood bank profile
  getMyBank: async () => {
    const response = await apiClient.get('/blood-banks/my-bank/');
    return response.data;
  },

  // Get inventory
  getInventory: async (bankId, params = {}) => {
    const response = await apiClient.get(`/blood-banks/${bankId}/inventory/`, { params });
    return response.data;
  },

  // Add inventory
  addInventory: async (bankId, data) => {
    const response = await apiClient.post(`/blood-banks/${bankId}/add-inventory/`, data);
    return response.data;
  },

  // Check shortages
  getShortages: async (bankId) => {
    const response = await apiClient.get(`/blood-banks/${bankId}/shortages/`);
    return response.data;
  },

  // Get expiring items
  getExpiringItems: async (bankId, days = 3) => {
    const response = await apiClient.get(`/blood-banks/${bankId}/expiring/?days=${days}`);
    return response.data;
  },

  // Get allocations
  getAllocations: async (bankId, params = {}) => {
    const response = await apiClient.get(`/blood-banks/${bankId}/allocations/`, { params });
    return response.data;
  },
};