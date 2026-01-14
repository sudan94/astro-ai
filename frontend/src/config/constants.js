export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify',
  },
  USER: {
    GET_PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
  },
  LOCATIONS: {
    SEARCH_CITIES: '/location/cities',
  },
};
