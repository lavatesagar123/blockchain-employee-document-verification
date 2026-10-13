/**
 * User Management & Activity Log Service (Super Admin)
 */

import { apiClient } from './apiClient';

export const userService = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'all') query.append('role', params.role);
    if (params.status && params.status !== 'all') query.append('status', params.status);

    const queryString = query.toString();
    const endpoint = `/api/admin/users/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  getUserById: async (id) => {
    return await apiClient.get(`/api/admin/users/${id}/`);
  },

  updateUserStatus: async (id, status) => {
    return await apiClient.post(`/api/admin/users/${id}/status/`, { status });
  },

  getActivityLogs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.action && params.action !== 'all') query.append('action', params.action);

    const queryString = query.toString();
    const endpoint = `/api/admin/activity-logs/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  }
};
