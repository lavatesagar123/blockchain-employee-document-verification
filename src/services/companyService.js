/**
 * Company Management & Registration Service
 */

import { apiClient } from './apiClient';

export const companyService = {
  // Public Company Registration
  registerCompany: async (formData) => {
    return await apiClient.post('/api/companies/register/', formData);
  },

  // HR viewing & updating their own company profile
  getCompanyProfile: async () => {
    return await apiClient.get('/api/companies/me/');
  },

  updateCompanyProfile: async (data) => {
    return await apiClient.patch('/api/companies/me/', data);
  },

  // Super Admin listing companies (with optional query filters: search, status, page)
  getCompanies: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);

    const queryString = query.toString();
    const endpoint = `/api/admin/companies/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  getCompanyById: async (id) => {
    return await apiClient.get(`/api/admin/companies/${id}/`);
  },

  approveCompany: async (id, remarks = '') => {
    return await apiClient.post(`/api/admin/companies/${id}/approve/`, { remarks });
  },

  rejectCompany: async (id, remarks) => {
    return await apiClient.post(`/api/admin/companies/${id}/reject/`, { remarks });
  },

  suspendCompany: async (id, remarks = '') => {
    return await apiClient.post(`/api/admin/companies/${id}/suspend/`, { remarks });
  },

  reactivateCompany: async (id) => {
    return await apiClient.post(`/api/admin/companies/${id}/reactivate/`, {});
  },

  // Super Admin KPI statistics
  getCompanyStats: async () => {
    return await apiClient.get('/api/admin/companies/stats/');
  }
};
