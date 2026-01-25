import apiClient from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const personService = {
  list: async ({ skip = 0, limit = 50 } = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.PERSONS.LIST_CREATE, {
      params: { skip, limit },
    });
    return response.data;
  },

  getById: async (personId) => {
    const response = await apiClient.get(API_ENDPOINTS.PERSONS.GET(personId));
    return response.data;
  },

  create: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.PERSONS.LIST_CREATE, payload);
    return response.data;
  },

  update: async (personId, payload) => {
    const response = await apiClient.put(API_ENDPOINTS.PERSONS.UPDATE(personId), payload);
    return response.data;
  },

  remove: async (personId) => {
    const response = await apiClient.delete(API_ENDPOINTS.PERSONS.DELETE(personId));
    return response.data;
  },
};

