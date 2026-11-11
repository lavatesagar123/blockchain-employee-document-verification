/**
 * Storage Helper Service
 * Dummy seed data, hardcoded companies, and fake credentials have been removed
 * to comply with real API integration readiness.
 */

import { TOKEN_STORAGE_KEY, getStoredToken, setStoredToken, clearStoredToken } from './apiClient';

export { TOKEN_STORAGE_KEY, getStoredToken, setStoredToken, clearStoredToken };

export const clearAuthSession = () => {
  clearStoredToken();
  try {
    localStorage.removeItem('verifychain_auth_user');
  } catch (err) {
    console.warn('Failed to clear user storage:', err);
  }
};
