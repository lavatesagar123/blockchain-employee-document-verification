import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  getStoredAuthUser,
  saveAuthSession,
  clearAuthSession,
  getStoredUsers,
  getStoredCompanies
} from '../services/storageService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and maintain session on page refresh
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = getStoredAuthUser();
        if (storedUser) {
          // Verify against current state in storage to ensure real-time status updates
          const users = getStoredUsers();
          const companies = getStoredCompanies();
          const currentUser = users.find((u) => u.email.toLowerCase() === storedUser.email.toLowerCase());

          if (currentUser) {
            let companyStatus = 'active';
            let companyDetails = null;

            if (currentUser.role === 'hr' && currentUser.companyId) {
              companyDetails = companies.find((c) => c.id === currentUser.companyId);
              if (companyDetails) {
                companyStatus = companyDetails.status;
              }
            }

            const updatedUser = {
              ...currentUser,
              companyStatus,
              companyDetails,
              token: storedUser.token || 'jwt_token_active'
            };
            setUser(updatedUser);
            saveAuthSession(updatedUser);
          } else {
            clearAuthSession();
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
        clearAuthSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const authUser = await api.login({ email, password });
      setUser(authUser);
      saveAuthSession(authUser, authUser.token);
      return authUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  // Re-sync user session (e.g. after company approval status changes)
  const refreshUser = () => {
    if (!user) return;
    const users = getStoredUsers();
    const companies = getStoredCompanies();
    const current = users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (current) {
      let companyStatus = 'active';
      let companyDetails = null;
      if (current.role === 'hr' && current.companyId) {
        companyDetails = companies.find((c) => c.id === current.companyId);
        if (companyDetails) {
          companyStatus = companyDetails.status;
        }
      }
      const updated = {
        ...current,
        companyStatus,
        companyDetails,
        token: user.token
      };
      setUser(updated);
      saveAuthSession(updated);
    }
  };

  const switchDemoRole = async (email, password) => {
    return login(email, password);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshUser,
    switchDemoRole
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
