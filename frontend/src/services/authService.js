import apiClient from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const authService = {
  login: async (googleToken) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      token: googleToken,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  verifyToken: async () => {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.VERIFY_TOKEN);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get(API_ENDPOINTS.USER.GET_PROFILE);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, profileData);
    return response.data;
  },
};
