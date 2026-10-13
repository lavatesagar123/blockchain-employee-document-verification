import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getStoredToken, clearStoredToken } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore authenticated session on mount if a valid token exists
  const checkSession = useCallback(async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await authService.getMe();
      setUser(userData);
      setAuthError(null);
    } catch (err) {
      // If 401 Unauthorized or expired token, clear it
      if (err.status === 401 || err.status === 403) {
        clearStoredToken();
        setUser(null);
        setToken(null);
      } else {
        // If network error, log but keep token so user can retry
        console.warn('Unable to verify current session with backend:', err.message);
      }
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await authService.login({ email, password });
      const receivedToken = response?.token || response?.access;
      setToken(receivedToken);

      // Extract user object returned directly or fetch profile
      let authenticatedUser = response?.user || response;
      if (!authenticatedUser?.id && !authenticatedUser?.email) {
        authenticatedUser = await authService.getMe();
      }

      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      clearStoredToken();
      setUser(null);
      setToken(null);
      setAuthError(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    authError,
    login,
    logout,
    checkSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
