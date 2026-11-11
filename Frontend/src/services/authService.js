/**
 * Authentication Service
 * Endpoints:
 * - POST /api/auth/login/
 * - POST /api/auth/logout/
 * - GET  /api/auth/me/
 */

import { apiClient, setStoredToken, clearStoredToken } from './apiClient';

const REFRESH_TOKEN_KEY = 'verifychain_refresh_token';

export const authService = {
  login: async ({ email, password }) => {
    // Pass both email and username so backend endpoints accepting either field work seamlessly
    const response = await apiClient.post('/api/auth/login/', {
      email,
      username: email,
      password
    });
    if (response?.token) {
      setStoredToken(response.token);
    } else if (response?.access) {
      // DRF SimpleJWT support
      setStoredToken(response.access);
    }
    if (response?.refresh) {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
      } catch {}
    }
    return response;
  },

  logout: async () => {
    let refreshToken = null;
    try {
      refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {}
    try {
      await apiClient.post('/api/auth/logout/', refreshToken ? { refresh: refreshToken } : {});
    } catch (err) {
      // Ignore network error on logout, local cleanup takes precedence
      console.warn('Logout API notification failed:', err.message);
    } finally {
      clearStoredToken();
      try {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('verifychain_auth_user');
      } catch {}
    }
  },

  getMe: async () => {
    return await apiClient.get('/api/auth/me/');
  }
};
