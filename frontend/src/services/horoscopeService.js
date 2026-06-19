import apiClient from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const horoscopeService = {
  getWestern: async (sign) => {
    const res = await apiClient.get(API_ENDPOINTS.HOROSCOPE.WESTERN, { params: { sign } });
    return res.data;
  },
  getVedic: async (sign) => {
    const res = await apiClient.get(API_ENDPOINTS.HOROSCOPE.VEDIC, { params: { sign } });
    return res.data;
  },
};
