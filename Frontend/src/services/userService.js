/**
 * User Management, Document Oversight & Activity Log Service (Super Admin)
 */

import { apiClient, API_BASE_URL, getStoredToken } from './apiClient';

export const userService = {
  getAdminProfile: async () => {
    return await apiClient.get('/api/admin/profile/');
  },

  updateAdminProfile: async (data) => {
    return await apiClient.patch('/api/admin/profile/', data);
  },

  getUsers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'all') query.append('role', params.role);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);

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
    if (params.target_type && params.target_type !== 'all') query.append('target_type', params.target_type);
    if (params.page) query.append('page', params.page);

    const queryString = query.toString();
    const endpoint = `/api/admin/activity-logs/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  getAdminDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.company_id) query.append('company_id', params.company_id);
    if (params.page) query.append('page', params.page);

    const queryString = query.toString();
    return await apiClient.get(`/api/admin/documents/${queryString ? `?${queryString}` : ''}`);
  },

  verifyAdminDocument: async (identifier) => {
    return await apiClient.post(`/api/admin/documents/${encodeURIComponent(String(identifier))}/verify/`, {});
  },

  revokeAdminDocument: async (identifier, reason) => {
    return await apiClient.post(`/api/admin/documents/${encodeURIComponent(String(identifier))}/revoke/`, { reason });
  },

  downloadCompanyVerificationDoc: async (companyId, docKey, fallbackFilename) => {
    const url = `${API_BASE_URL}/api/admin/companies/${companyId}/documents/${encodeURIComponent(docKey)}/download/`;
    const token = getStoredToken();
    const res = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      let msg = `Failed to download verification file (${res.status}).`;
      try {
        const data = await res.json();
        msg = data?.detail || data?.message || msg;
      } catch {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i);
    const filename = (match && match[1]) || fallbackFilename || `${docKey}.pdf`;
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }
};
