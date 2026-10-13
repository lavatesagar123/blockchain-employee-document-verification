import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { verificationService } from '../services/verificationService';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, getDocumentTypeLabel } from '../utils/formatters';
import {
  Search,
  Upload,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Building,
  Calendar,
  Hash,
  XCircle,
  WifiOff,
  Copy,
  RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';
import '../styles/dashboard.css';

export const PublicVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [verificationId, setVerificationId] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileSha256, setFileSha256] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);

  // Auto-fill from ?id= query param
  useEffect(() => {
    const idParam = searchParams.get('id') || searchParams.get('verificationId');
    if (idParam) {
      setVerificationId(idParam);
    }
  }, [searchParams]);

  // Compute SHA-256 hash client-side when a file is selected
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadedFile(null);
      setFileSha256('');
      return;
    }

    setUploadedFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileSha256(hashHex);
      addToast(`Computed document fingerprint: ${hashHex.substring(0, 10)}...`, 'info');
    } catch (err) {
      console.warn('Failed to compute client SHA-256:', err);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();

    if (!verificationId.trim()) {
      addToast('Please enter a Document Verification ID or Certificate Hash.', 'warning');
      return;
    }

    setVerifying(true);
    setResult(null);
    setErrorState(null);

    try {
      const verificationResponse = await verificationService.verifyDocument(
        verificationId.trim(),
        uploadedFile
      );

      setResult(verificationResponse);
    } catch (err) {
      if (err.isNetworkError || err.status === 0) {
        setErrorState({
          type: 'SERVICE_UNAVAILABLE',
          title: 'Verification Service Unavailable',
          message: `The blockchain verification API at ${API_BASE_URL} is unreachable. Connect the verification backend to inspect credentials.`
        });
      } else if (err.status === 404) {
        setErrorState({
          type: 'NOT_FOUND',
          title: 'Document Not Found',
          message: `No record matching ID "${verificationId.trim()}" exists in the verification ledger.`
        });
      } else {
        setErrorState({
          type: 'ERROR',
          title: 'Verification Failed',
          message: err.message || 'Unable to complete verification check.'
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  return (
    <PublicLayout>
      <div className="container" style={{ padding: '3.5rem 1rem 5rem' }}>
        {/* Page Header */}
        <div style={{ maxWidth: '780px', margin: '0 auto 2.5rem', textAlign: 'center' }}>
          <div className="hero-badge-tag" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
            <ShieldCheck size={16} />
            <span>Public Trust Verification Engine</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Verify Document Authenticity
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Cryptographically audit the authenticity, issuing authority, and tamper status of any
            employment certificate or credential anchored to the distributed ledger.
          </p>
        </div>

        {/* Verification Input Box */}
        <div className="content-card-panel" style={{ maxWidth: '780px', margin: '0 auto 2.5rem', padding: '2rem' }}>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="verificationId" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                Document Verification ID / Blockchain Hash *
              </label>
              <div className="input-with-icon">
                <Hash className="input-icon-left" size={18} />
                <input
                  id="verificationId"
                  type="text"
                  className="form-control input-padded"
                  placeholder="e.g. DOC-VFY-884920 or 0x7f9a8b1c..."
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
                  disabled={verifying}
                  style={{ fontSize: '0.95rem', height: '46px' }}
                />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                Located at the bottom of the issued certificate or QR code URL parameter.
              </div>
            </div>

            {/* Optional Document Upload for Integrity Check */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="doc-upload" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Optional File Integrity Check (SHA-256 Checksum)</span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Optional</span>
              </label>

              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: uploadedFile ? '#f0fdf4' : '#f8fafc',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('doc-upload')?.click()}
              >
                <input
                  id="doc-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <Upload size={24} style={{ color: uploadedFile ? '#10b981' : '#94a3b8', margin: '0 auto 0.5rem' }} />

                {uploadedFile ? (
                  <div>
                    <strong style={{ color: '#065f46', fontSize: '0.9rem' }}>{uploadedFile.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.2rem' }}>
                      Size: {(uploadedFile.size / 1024).toFixed(1)} KB • SHA-256: {fileSha256.substring(0, 16)}...
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                      Upload document PDF or image to compare cryptographic digest
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      File is digested securely inside your browser
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1.75rem' }}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Querying Verification Ledger...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Verify Credential Authenticity</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Error States (Honest Status Display) */}
        {errorState && (
          <div className="content-card-panel animate-fade-in" style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem', borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {errorState.type === 'SERVICE_UNAVAILABLE' ? <WifiOff size={22} /> : <XCircle size={22} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', color: '#991b1b', margin: '0 0 0.35rem' }}>
                  {errorState.title}
                </h3>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  {errorState.message}
                </p>

                {errorState.type === 'SERVICE_UNAVAILABLE' && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.2rem' }}>
                      Integration Notice:
                    </div>
                    <div>
                      The frontend does not simulate successful verifications without a real backend response.
                      Please ensure the Django verification endpoint <code>GET /api/verification/&#123;id&#125;/</code> is online.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Success / Result Card (Rendered ONLY from real API data) */}
        {result && (
          <div className="content-card-panel animate-fade-in" style={{ maxWidth: '780px', margin: '0 auto', overflow: 'hidden' }}>
            {/* Header banner based on status */}
            <div
              style={{
                padding: '1.5rem',
                background:
                  result.status === 'verified'
                    ? '#f0fdf4'
                    : result.status === 'revoked'
                    ? '#fef2f2'
                    : result.status === 'modified'
                    ? '#fff1f2'
                    : '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background:
                      result.status === 'verified' ? '#d1fae5' : '#fee2e2',
                    color: result.status === 'verified' ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {result.status === 'verified' ? (
                    <ShieldCheck size={26} />
                  ) : result.status === 'revoked' ? (
                    <AlertTriangle size={26} />
                  ) : (
                    <ShieldAlert size={26} />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                    {result.status === 'verified'
                      ? 'Authentic Credential Verified'
                      : result.status === 'revoked'
                      ? 'Document Has Been Revoked'
                      : result.status === 'modified'
                      ? 'Document Content Tampered / Modified'
                      : 'Verification Status: ' + result.status}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Queried from TrustDoc Distributed Ledger
                  </div>
                </div>
              </div>

              <StatusBadge status={result.status} />
            </div>

            {/* Document Details Grid */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    ISSUING ORGANIZATION
                  </span>
                  <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <Building size={16} color="#10b981" />
                    {result.issuer_name || result.issuer || result.company_name || 'Verified Issuer'}
                  </strong>
                  {result.issuer_reg_no && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      CIN: {result.issuer_reg_no}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    DOCUMENT TYPE
                  </span>
                  <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <FileText size={16} color="#0ea5e9" />
                    {getDocumentTypeLabel(result.document_type || result.type)}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    RECIPIENT / EMPLOYEE
                  </span>
                  <strong style={{ fontSize: '1rem', color: '#0f172a', marginTop: '0.2rem', display: 'block' }}>
                    {result.recipient_name || result.employee_name || 'Authorized Holder'}
                  </strong>
                  {result.employee_id && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ID: {result.employee_id}
                    </span>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    ISSUE DATE
                  </span>
                  <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <Calendar size={16} color="#64748b" />
                    {formatDate(result.issue_date || result.created_at)}
                  </strong>
                </div>
              </div>

              {/* Cryptographic Ledger Block */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Hash size={15} color="#059669" />
                    Cryptographic Proof Metadata
                  </strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.transaction_hash || result.hash || result.verification_id)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    <Copy size={12} /> Copy Hash
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#475569' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>verificationId: </span>
                    <strong style={{ color: '#0f172a' }}>{result.verification_id || verificationId}</strong>
                  </div>
                  {result.transaction_hash && (
                    <div>
                      <span style={{ color: '#94a3b8' }}>transactionHash: </span>
                      <span>{result.transaction_hash}</span>
                    </div>
                  )}
                  {result.file_hash && (
                    <div>
                      <span style={{ color: '#94a3b8' }}>sha256Digest: </span>
                      <span>{result.file_hash}</span>
                    </div>
                  )}
                  {result.block_number && (
                    <div>
                      <span style={{ color: '#94a3b8' }}>blockHeight: </span>
                      <span>#{result.block_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Revocation remarks if revoked */}
              {result.status === 'revoked' && result.revocation_reason && (
                <div style={{ marginTop: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>
                  <strong>Revocation Reason:</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>{result.revocation_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
