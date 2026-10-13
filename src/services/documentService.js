/**
 * Document Issuance and Management Service
 */

import { apiClient } from './apiClient';

export const documentService = {
  // HR issuing a new document
  issueDocument: async (documentData) => {
    return await apiClient.post('/api/documents/', documentData);
  },

  // HR viewing issued documents
  getIssuedDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);

    const queryString = query.toString();
    const endpoint = `/api/documents/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  // Employee viewing their own issued documents
  getMyDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.type && params.type !== 'all') query.append('type', params.type);

    const queryString = query.toString();
    const endpoint = `/api/employee/documents/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  // Single document inspection
  getDocumentById: async (id) => {
    return await apiClient.get(`/api/documents/${id}/`);
  },

  // HR revoking a document
  revokeDocument: async (id, reason) => {
    return await apiClient.post(`/api/documents/${id}/revoke/`, { reason });
  }
};
