/**
 * Authentication Service
 * Endpoints:
 * - POST /api/auth/login/
 * - POST /api/auth/logout/
 * - GET  /api/auth/me/
 */

import { apiClient, setStoredToken, clearStoredToken } from './apiClient';

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
    return response;
  },

  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout/', {});
    } catch (err) {
      // Ignore network error on logout, local cleanup takes precedence
      console.warn('Logout API notification failed:', err.message);
    } finally {
      clearStoredToken();
    }
  },

  getMe: async () => {
    return await apiClient.get('/api/auth/me/');
  }
};
