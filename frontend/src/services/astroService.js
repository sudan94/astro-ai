import apiClient from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const astroService = {
  getSavedForPerson: async (personId) => {
    const response = await apiClient.get(API_ENDPOINTS.ASTRO.GET_SAVED(personId));
    return response.data;
  },

  generateVedicChart: async (personId) => {
    const response = await apiClient.get(API_ENDPOINTS.ASTRO.GENERATE_VEDIC_CHART(personId));
    return response.data;
  },
};

