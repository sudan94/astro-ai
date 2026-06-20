import apiClient from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const matchService = {
  kundali: async (person1_id, person2_id) => {
    const res = await apiClient.post(API_ENDPOINTS.MATCH.KUNDALI, { person1_id, person2_id });
    return res.data;
  },
};
