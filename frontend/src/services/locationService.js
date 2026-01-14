import apiClient from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const locationService = {
  searchCities: async (query) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LOCATIONS.SEARCH_CITIES, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching cities:', error);
      throw error;
    }
  },
};
