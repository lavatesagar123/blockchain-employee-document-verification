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
  Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';
import '../styles/landing.css';
import '../styles/verification.css';

export const PublicVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [verificationId, setVerificationId] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileSha256, setFileSha256] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);

  // Auto-fill from ?id= or ?verificationId= query param
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
    <PublicLayout hideFooter={true}>
      <div className="verify-page-root">
        {/* Soft Mint Ambient Glow Elements matching Landing Page */}
        <div className="home-ambient-glow-left" />
        <div className="home-ambient-glow-right" />

        {/* Page Header */}
        <div className="verify-header-section">
          <div className="verify-pill-badge">
            <ShieldCheck size={14} strokeWidth={2.4} />
            <span>Public Verification Portal</span>
          </div>

          <h1 className="verify-headline">
            <span className="headline-navy">Verify Document </span>
            <span className="headline-emerald">Authenticity</span>
          </h1>
          <p className="verify-subtext">
            Cryptographically audit the authenticity, issuing authority, and tamper status of any
            employment credential on the blockchain ledger.
          </p>
        </div>

        {/* Verification Input Card */}
        <div className="verify-form-card">
          <form onSubmit={handleVerify}>
            <div>
              <div className="verify-field-label">
                <span>Document Verification ID / Hash *</span>
              </div>
              <div className="verify-input-wrap">
                <Hash className="verify-input-icon" size={17} />
                <input
                  id="verificationId"
                  type="text"
                  className="verify-text-input"
                  placeholder="e.g. VC-2025-001 or 0x7f9a8b1c..."
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
                  disabled={verifying}
                  autoComplete="off"
                />
              </div>
              <div className="verify-field-hint">
                Located at the bottom of the issued certificate or QR code URL.
              </div>
            </div>

            {/* Optional Document Upload for Integrity Check */}
            <div
              className={`verify-upload-box ${uploadedFile ? 'verify-upload-active' : ''}`}
              onClick={() => document.getElementById('doc-upload')?.click()}
            >
              <input
                id="doc-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <Upload size={18} style={{ color: uploadedFile ? '#059669' : '#94a3b8' }} />

              {uploadedFile ? (
                <div style={{ marginTop: '0.2rem' }}>
                  <strong style={{ color: '#065f46', fontSize: '0.8rem' }}>{uploadedFile.name}</strong>
                  <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '1px' }}>
                    {(uploadedFile.size / 1024).toFixed(1)} KB • SHA-256: {fileSha256.substring(0, 14)}...
                  </div>
                </div>
              ) : (
                <>
                  <div className="verify-upload-title">
                    Optional File Integrity Check (SHA-256)
                  </div>
                  <div className="verify-upload-sub">
                    Upload PDF or image to compare cryptographic digest
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="verify-submit-btn"
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Querying Verification Ledger...</span>
                </>
              ) : (
                <>
                  <Search size={16} strokeWidth={2.2} />
                  <span>Verify Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Error States */}
        {errorState && (
          <div className="verify-error-card animate-fade-in">
            <div className="verify-error-icon">
              {errorState.type === 'SERVICE_UNAVAILABLE' ? <WifiOff size={18} /> : <XCircle size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="verify-error-title">{errorState.title}</h3>
              <p className="verify-error-msg">{errorState.message}</p>

              {errorState.type === 'SERVICE_UNAVAILABLE' && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#64748b' }}>
                  Backend endpoint: <code>{API_BASE_URL}/api/verification/&#123;id&#125;/</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Success / Result Card */}
        {result && (
          <div className="verify-result-panel animate-fade-in">
            {/* Header banner based on status */}
            <div
              className="verify-result-header"
              style={{
                background:
                  result.status === 'verified'
                    ? '#f0fdf4'
                    : result.status === 'revoked'
                    ? '#fef2f2'
                    : result.status === 'modified'
                    ? '#fff1f2'
                    : '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: result.status === 'verified' ? '#d1fae5' : '#fee2e2',
                    color: result.status === 'verified' ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {result.status === 'verified' ? (
                    <ShieldCheck size={20} strokeWidth={2.4} />
                  ) : result.status === 'revoked' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <ShieldAlert size={20} />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    {result.status === 'verified'
                      ? 'Authentic Credential Verified'
                      : result.status === 'revoked'
                      ? 'Document Has Been Revoked'
                      : result.status === 'modified'
                      ? 'Document Content Tampered / Modified'
                      : 'Verification Status: ' + result.status}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    TrustDoc Distributed Ledger Verification
                  </div>
                </div>
              </div>

              <StatusBadge status={result.status} />
            </div>

            {/* Document Details Grid */}
            <div className="verify-result-grid">
              <div className="verify-grid-item">
                <label>Issuing Organization</label>
                <strong>
                  <Building size={14} color="#059669" />
                  <span>{result.issuer_name || result.issuer || result.company_name || 'Verified Issuer'}</span>
                </strong>
                {result.issuer_reg_no && (
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>CIN: {result.issuer_reg_no}</span>
                )}
              </div>

              <div className="verify-grid-item">
                <label>Document Type</label>
                <strong>
                  <FileText size={14} color="#0ea5e9" />
                  <span>{getDocumentTypeLabel(result.document_type || result.type)}</span>
                </strong>
              </div>

              <div className="verify-grid-item">
                <label>Recipient / Employee</label>
                <strong>
                  <span>{result.recipient_name || result.employee_name || 'Authorized Holder'}</span>
                </strong>
                {result.employee_id && (
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {result.employee_id}</span>
                )}
              </div>

              <div className="verify-grid-item">
                <label>Issue Date</label>
                <strong>
                  <Calendar size={14} color="#64748b" />
                  <span>{formatDate(result.issue_date || result.created_at)}</span>
                </strong>
              </div>
            </div>

            {/* Cryptographic Ledger Block */}
            <div className="verify-proof-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                  <Hash size={13} color="#059669" />
                  Cryptographic Proof Metadata
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.transaction_hash || result.hash || result.verification_id)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                >
                  <Copy size={11} /> Copy Hash
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#475569' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>verificationId: </span>
                  <strong style={{ color: '#0f172a' }}>{result.verification_id || verificationId}</strong>
                </div>
                {result.transaction_hash && (
                  <div>
                    <span style={{ color: '#94a3b8' }}>txHash: </span>
                    <span>{result.transaction_hash}</span>
                  </div>
                )}
                {result.file_hash && (
                  <div>
                    <span style={{ color: '#94a3b8' }}>sha256: </span>
                    <span>{result.file_hash}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revocation remarks if revoked */}
            {result.status === 'revoked' && result.revocation_reason && (
              <div style={{ background: '#fef2f2', borderTop: '1px solid #fecaca', padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.78rem' }}>
                <strong>Revocation Reason:</strong>
                <p style={{ margin: '0.2rem 0 0' }}>{result.revocation_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

