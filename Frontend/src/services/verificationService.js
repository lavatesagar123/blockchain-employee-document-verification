/**
 * Public Blockchain Verification Service
 * Calls backend verification API to inspect cryptographic status.
 */

import { apiClient } from './apiClient';

export const verificationService = {
  /**
   * Verifies document by verification ID and optional file checksum / FormData
   * Endpoint: GET /api/verification/{verificationId}/
   * Or POST /api/verification/verify/ when file is provided for cryptographic hash match
   */
  verifyDocument: async (verificationId, file = null) => {
    const cleanId = encodeURIComponent(verificationId.trim());

    if (file) {
      const formData = new FormData();
      formData.append('verification_id', verificationId.trim());
      formData.append('document_file', file);
      return await apiClient.post('/api/verification/verify/', formData);
    }

    return await apiClient.get(`/api/verification/${cleanId}/`);
  }
};
