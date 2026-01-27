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
  PERSONS: {
    LIST_CREATE: '/persons',
    GET: (personId) => `/persons/${personId}`,
    UPDATE: (personId) => `/persons/${personId}`,
    DELETE: (personId) => `/persons/${personId}`,
  },
  CHAT: {
    CREATE_SESSION: '/chat/session',
    PERSON_SESSIONS: (personId) => `/chat/person/${personId}/sessions`,
    HISTORY: (sessionId) => `/chat/session/${sessionId}/history`,
    SEND_MESSAGE: '/chat/message',
  },
  ASTRO: {
    GET_SAVED: (personId) => `/astro/person/${personId}`,
    GENERATE_VEDIC_CHART: (personId) => `/astro/vedic-chart/${personId}`,
  },
};
