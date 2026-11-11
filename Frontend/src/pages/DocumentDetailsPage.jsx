import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { EmployeeLayout } from '../layouts/EmployeeLayout';
import { DocumentCertificate } from '../components/DocumentCertificate';
import { DocumentInfoPanel } from '../components/DocumentInfoPanel';
import { documentService } from '../services/documentService';
import { verificationService } from '../services/verificationService';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/Toast';
import { downloadCertificateAsPdf, openCertificateInNewTab, printCertificate } from '../utils/pdfGenerator';
import { getDocumentTypeLabel } from '../utils/formatters';
import {
  Share2,
  Printer,
  Download,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import '../styles/dashboard.css';

export const DocumentDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
        printCertificate();
      }, 500);
    }
  }, [loading, documentData, searchParams]);

  const handleShare = () => {
    const vId = documentData?.verification_id || id;
    const url = `${window.location.origin}/verify?id=${encodeURIComponent(vId)}`;
    navigator.clipboard.writeText(url);
    addToast('Public verification link copied to clipboard!', 'success');
  };

  const handleDownloadPdf = async () => {
    if (!documentData) return;
    setDownloadingPdf(true);
    try {
      const typeLabel = getDocumentTypeLabel(documentData.document_type || documentData.type).replace(/\s+/g, '_');
      const recipient = (documentData.recipient_name || documentData.employee_name || 'Certificate').replace(/\s+/g, '_');
      const filename = `${typeLabel}_${recipient}.pdf`;
      await downloadCertificateAsPdf('document-details-certificate-node', { filename });
      addToast('Document PDF downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to download PDF. You can also use the Print button.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenPdf = async () => {
    if (!documentData) return;
    try {
      await openCertificateInNewTab('document-details-certificate-node');
      addToast('Opening certificate PDF in new tab...', 'info');
    } catch (err) {
      addToast('Failed to open PDF. Try downloading instead.', 'error');
    }
  };

  const vId = documentData?.verification_id || documentData?.id || id;

  const companyDetails = {
    name: documentData?.issuer_name || documentData?.company_name || 'TrustDoc Technologies',
    tagline: 'Secure Documents | Trusted Future',
    address: 'TrustDoc Technologies\nPune, Maharashtra - 411001',
    email: 'hr@trustdoc.com',
    website: 'www.trustdoc.com',
    signatory_name: documentData?.signatory_name || 'Rohan Deshmukh',
    signatory_role: documentData?.signatory_role || 'HR Manager'
  };

  return (
    <EmployeeLayout
      title="Document Certificate"
      subtitle={`Ledger entry: ${vId}`}
    >
      <div className="animate-fade-in">
        {/* Navigation & Document Actions Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link
            to="/employee/documents"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#64748b',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} /> Back to My Documents
          </Link>

          {documentData && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleShare}
                className="btn btn-secondary btn-sm"
                title="Copy verification link"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
              <button
                type="button"
                onClick={handleOpenPdf}
                className="btn btn-outline-emerald btn-sm"
                title="Open complete unclipped PDF in new tab"
              >
                <ExternalLink size={14} />
                <span>Open PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="btn btn-secondary btn-sm"
                title="Download PDF"
              >
                <Download size={14} />
                <span>{downloadingPdf ? 'Exporting...' : 'PDF'}</span>
              </button>
              <button
                type="button"
                onClick={() => printCertificate()}
                className="btn btn-primary btn-sm"
                title="Print Document"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
            </div>
          )}
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
          /* Full unclipped document certificate view followed by ledger details */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Full High-Resolution Certificate View (No half-screen clipping) */}
            <div
              className="content-card-panel"
              style={{
                maxWidth: '880px',
                width: '100%',
                margin: '0 auto',
                padding: '2rem 1rem',
                overflowX: 'auto',
                display: 'flex',
                justifyContent: 'center',
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <DocumentCertificate
                previewId="document-details-certificate-node"
                documentData={documentData}
                company={companyDetails}
                isDraft={false}
              />
            </div>

            {/* Document Ledger & Verification Details Panel */}
            <div style={{ maxWidth: '880px', width: '100%', margin: '0 auto' }}>
              <DocumentInfoPanel
                documentData={documentData}
                isDraft={false}
              />
            </div>
          </div>
        ) : null}
      </div>
    </EmployeeLayout>
  );
};
