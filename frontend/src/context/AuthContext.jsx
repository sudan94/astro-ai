import { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../config/api';

export const AuthContext = createContext();

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  // JWT: header.payload.signature (base64url)
  const parts = token?.split?.('.');
  if (!parts || parts.length < 2) return null;
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const json = atob(padded);
    return safeJsonParse(json);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp; // seconds since epoch (typical JWT)
  if (!exp) return false; // if no exp, don’t force logout client-side
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= exp;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const cachedUser = safeJsonParse(localStorage.getItem('user'));
    if (token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Optimistically restore user for refresh UX; verify in background
      if (cachedUser) {
        setUser(cachedUser);
        setIsAuthenticated(true);
      }
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await apiClient.get('/auth/verify');
      setUser(response.data.user);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Token verification failed:', error);
      const status = error?.response?.status;
      // Only clear session if server says token is invalid/expired
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (googleToken) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', {
        token: googleToken,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
