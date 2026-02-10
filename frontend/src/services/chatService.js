import apiClient from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const chatService = {
  listSessionsForPerson: async (personId) => {
    const response = await apiClient.get(API_ENDPOINTS.CHAT.PERSON_SESSIONS(personId));
    return response.data;
  },

  createSession: async (personId) => {
    const response = await apiClient.post(API_ENDPOINTS.CHAT.CREATE_SESSION, { person_id: personId });
    return response.data;
  },

  getHistory: async (sessionId) => {
    const response = await apiClient.get(API_ENDPOINTS.CHAT.HISTORY(sessionId));
    return response.data;
  },

  sendMessage: async ({ sessionId, message }) => {
    const response = await apiClient.post(API_ENDPOINTS.CHAT.SEND_MESSAGE, {
      session_id: sessionId,
      message,
    });
    return response.data;
  },

  updateSessionTitle: async (sessionId, title) => {
    const response = await apiClient.put(API_ENDPOINTS.CHAT.UPDATE_SESSION(sessionId), {
      title,
    });
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await apiClient.delete(API_ENDPOINTS.CHAT.DELETE_SESSION(sessionId));
    return response.data;
  },
};
