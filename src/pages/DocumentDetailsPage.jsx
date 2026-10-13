import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { EmployeeLayout } from '../layouts/EmployeeLayout';
import { documentService } from '../services/documentService';
import { verificationService } from '../services/verificationService';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/Toast';
import { formatDate, getDocumentTypeLabel, truncateHash } from '../utils/formatters';
import {
  FileText,
  ShieldCheck,
  Building,
  Calendar,
  Share2,
  Download,
  Copy,
  ExternalLink,
  ArrowLeft,
  QrCode,
  Printer,
  Hash,
  CheckCircle2
} from 'lucide-react';
import '../styles/dashboard.css';

export const DocumentDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // First try employee document endpoint, fallback to verification endpoint
      let data;
      try {
        data = await documentService.getDocumentById(id);
      } catch {
        data = await verificationService.verifyDocument(id);
      }
      setDocumentData(data);
    } catch (err) {
      setError(err.message || `No document record found for ID: ${id}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Handle ?print=true parameter
  useEffect(() => {
    if (!loading && documentData && searchParams.get('print') === 'true') {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, documentData, searchParams]);

  const handleShare = () => {
    const vId = documentData?.verification_id || id;
    const url = `${window.location.origin}/verify?id=${encodeURIComponent(vId)}`;
    navigator.clipboard.writeText(url);
    addToast('Public verification link copied to clipboard!', 'success');
  };

  const handleCopyHash = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const vId = documentData?.verification_id || documentData?.id || id;
  const verifyUrl = `${window.location.origin}/verify?id=${encodeURIComponent(vId)}`;

  return (
    <EmployeeLayout
      title="Credential Inspection & Certificate"
      subtitle={`Verified ledger entry: ${vId}`}
      actions={
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={handleShare}
            disabled={loading || !documentData}
            className="btn btn-secondary btn-sm"
            title="Copy verification link"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || !documentData}
            className="btn btn-primary btn-sm"
            title="Print or Save as PDF"
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </button>
        </div>
      }
    >
      <div className="animate-fade-in">
        {/* Back Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/employee/documents"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Back to My Documents
          </Link>
        </div>

        {loading ? (
          <LoadingState message="Fetching certificate metadata from verification ledger..." />
        ) : error ? (
          <ErrorState
            title="Document Record Unavailable"
            message={error}
            onRetry={fetchDocument}
          />
        ) : documentData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.3fr) minmax(280px, 0.7fr)', gap: '2rem', alignItems: 'start' }}>
            {/* Left: Certificate Printable Template */}
            <div
              className="printable-certificate"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-md)',
                padding: '3rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Watermark */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  color: 'rgba(16, 185, 129, 0.04)',
                  fontSize: '5rem',
                  fontWeight: 900,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  textAlign: 'center',
                  lineHeight: 1
                }}
              >
                TRUSTDOC<br />BLOCKCHAIN
              </div>

              {/* Organization Header */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                    {documentData.issuer_name || documentData.company_name || 'Authorized Enterprise'}
                  </h2>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Corporate Registration: {documentData.issuer_reg_no || 'Audited Enterprise Issuer'}
                  </div>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={28} />
                </div>
              </div>

              {/* Certificate Title */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.35rem', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.06em', margin: '0 0 0.35rem' }}>
                  {getDocumentTypeLabel(documentData.document_type || documentData.type)}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Issued on: {formatDate(documentData.issue_date || documentData.created_at)}
                </span>
              </div>

              {/* Certificate Body */}
              <div style={{ fontSize: '0.925rem', lineHeight: '1.8', color: '#334155', marginBottom: '2.5rem' }}>
                <p>
                  This official document certifies that{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {documentData.recipient_name || documentData.employee_name || 'Holder'}
                  </strong>
                  {documentData.employee_id ? ` (Employee ID: ${documentData.employee_id})` : ''} has been
                  awarded this credential for the designation of{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {documentData.designation || 'Specialist'}
                  </strong>
                  {documentData.department ? ` within the ${documentData.department} department` : ''}.
                </p>

                {documentData.start_date && (
                  <p>
                    Effective Duration: <strong>{formatDate(documentData.start_date)}</strong>
                    {documentData.end_date ? ` to ${formatDate(documentData.end_date)}` : ' (Ongoing)'}.
                  </p>
                )}

                {documentData.compensation && (
                  <p>
                    Approved Terms: <strong>{documentData.compensation}</strong>.
                  </p>
                )}

                {documentData.remarks && (
                  <p style={{ fontStyle: 'italic', color: '#64748b', borderLeft: '3px solid #cbd5e1', paddingLeft: '0.85rem' }}>
                    "{documentData.remarks}"
                  </p>
                )}
              </div>

              {/* Footer Sign-off */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.825rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    Authorized HR Signatory
                  </div>
                  <div style={{ color: '#64748b' }}>
                    {documentData.issuer_name || documentData.company_name}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 700 }}>
                    <ShieldCheck size={16} /> Immutable Ledger Proof
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {vId}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Verification Proof Metadata & QR Display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* QR & Verification ID Box */}
              <div className="content-card-panel" style={{ padding: '1.75rem', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: '#0f172a' }}>
                  Cryptographic Verification QR
                </h4>

                {/* QR Code Placeholder Canvas Display */}
                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    margin: '0 auto 1.25rem',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    position: 'relative'
                  }}
                >
                  <QrCode size={100} color="#0f172a" />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                    SCAN TO VERIFY
                  </span>
                </div>

                <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    VERIFICATION ID
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <strong className="font-mono" style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                      {vId}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(vId)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.4rem' }}
                      title="Copy ID"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <Link
                  to={`/verify?id=${encodeURIComponent(vId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-emerald btn-sm"
                  style={{ width: '100%' }}
                >
                  <ExternalLink size={14} />
                  <span>Open in Public Verifier</span>
                </Link>
              </div>

              {/* Status & Proof Details */}
              <div className="content-card-panel" style={{ padding: '1.5rem', fontSize: '0.85rem' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#0f172a' }}>
                  Ledger Proof Details
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Ledger Status</span>
                    <StatusBadge status={documentData.status || 'verified'} />
                  </div>

                  {documentData.transaction_hash && (
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>TX HASH</span>
                      <code className="font-mono" style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                        {truncateHash(documentData.transaction_hash, 10, 8)}
                      </code>
                    </div>
                  )}

                  {documentData.file_hash && (
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>SHA-256 DIGEST</span>
                      <code className="font-mono" style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                        {truncateHash(documentData.file_hash, 10, 8)}
                      </code>
                    </div>
                  )}

                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>PROOF PROTOCOL</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>Proof of Authority Ledger</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </EmployeeLayout>
  );
};
