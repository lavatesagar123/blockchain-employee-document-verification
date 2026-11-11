/**
 * Document Issuance and Management Service
 */

import { apiClient, API_BASE_URL, getStoredToken } from './apiClient';

async function downloadAuthenticatedFile(url, { openInNewTab = false, fallbackFilename } = {}) {
  const token = getStoredToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, { method: 'GET', headers });
  } catch (networkErr) {
    const err = new Error(
      `Cannot connect to backend server at ${API_BASE_URL} to download document.`
    );
    err.isNetworkError = true;
    err.originalError = networkErr;
    throw err;
  }

  if (!response.ok) {
    let message = `Document download failed (${response.status}).`;
    try {
      const errData = await response.json();
      message = errData?.detail || errData?.message || message;
    } catch {}
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i);
  const filename = (match && match[1]) || fallbackFilename || 'TrustDoc_Document.pdf';

  const blobUrl = URL.createObjectURL(blob);
  if (openInNewTab) {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } else {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }
  return { filename };
}

export const documentService = {
  // HR issuing a new document (real DB persistence & PDF/QR generation)
  issueDocument: async (documentData) => {
    return await apiClient.post('/api/documents/', documentData);
  },

  // HR viewing issued documents (real DB records)
  getIssuedDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);

    const queryString = query.toString();
    const endpoint = `/api/documents/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  // Employee viewing their own issued documents (real backend DB records)
  getMyDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);

    const queryString = query.toString();
    const endpoint = `/api/employee/documents/${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  // Employee inspecting single issued document details (ownership verified on backend)
  getEmployeeDocumentById: async (id) => {
    const cleanId = encodeURIComponent(String(id).trim());
    return await apiClient.get(`/api/employee/documents/${cleanId}/`);
  },

  // Authenticated secure file download for employee documents
  downloadEmployeeDocument: async (id, options = {}) => {
    const cleanId = encodeURIComponent(String(id).trim());
    return await downloadAuthenticatedFile(
      `${API_BASE_URL}/api/employee/documents/${cleanId}/download/`,
      { fallbackFilename: `TrustDoc_${id}.pdf`, ...options }
    );
  },

  // Authenticated secure file download for HR / shared documents
  downloadIssuedDocument: async (id, options = {}) => {
    const cleanId = encodeURIComponent(String(id).trim());
    return await downloadAuthenticatedFile(
      `${API_BASE_URL}/api/documents/${cleanId}/download/`,
      { fallbackFilename: `TrustDoc_${id}.pdf`, ...options }
    );
  },

  // Single document inspection
  getDocumentById: async (id) => {
    const cleanId = encodeURIComponent(String(id).trim());
    return await apiClient.get(`/api/documents/${cleanId}/`);
  },

  // HR revoking a document
  revokeDocument: async (id, reason) => {
    const cleanId = encodeURIComponent(String(id).trim());
    return await apiClient.post(`/api/documents/${cleanId}/revoke/`, { reason });
  }
};
