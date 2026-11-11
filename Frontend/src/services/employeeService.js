/**
 * Employee Management & Registration Service
 */

import { apiClient } from './apiClient';

export const employeeService = {
  // Public employee registration
  registerEmployee: async (formData) => {
    return await apiClient.post('/api/employees/register/', formData);
  },

  // HR listing employees for their company (real DB records)
  getEmployees: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department && params.department !== 'all') query.append('department', params.department);
    if (params.employment_type && params.employment_type !== 'all') query.append('employment_type', params.employment_type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);

    const queryString = query.toString();
    const endpoint = `/api/hr/employees/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  // HR adding a new employee
  createEmployee: async (employeeData) => {
    return await apiClient.post('/api/hr/employees/', employeeData);
  },

  getEmployeeById: async (id) => {
    return await apiClient.get(`/api/hr/employees/${encodeURIComponent(String(id).trim())}/`);
  },

  updateEmployee: async (id, data) => {
    return await apiClient.patch(`/api/hr/employees/${encodeURIComponent(String(id).trim())}/`, data);
  },

  deactivateEmployee: async (id) => {
    return await apiClient.delete(`/api/hr/employees/${encodeURIComponent(String(id).trim())}/`);
  },

  // Employee viewing their own profile
  getEmployeeProfile: async () => {
    return await apiClient.get('/api/employees/me/');
  },

  updateEmployeeProfile: async (data) => {
    return await apiClient.patch('/api/employees/me/', data);
  }
};
