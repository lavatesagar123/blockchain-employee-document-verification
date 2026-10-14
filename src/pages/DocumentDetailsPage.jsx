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
import { downloadCertificateAsPdf, printCertificate } from '../utils/pdfGenerator';
import { getDocumentTypeLabel } from '../utils/formatters';
import {
  Share2,
  Printer,
  Download,
  ArrowLeft
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
            onClick={handleDownloadPdf}
            disabled={loading || !documentData || downloadingPdf}
            className="btn btn-secondary btn-sm"
            title="Download PDF"
          >
            <Download size={14} />
            <span>{downloadingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>
          <button
            type="button"
            onClick={() => printCertificate()}
            disabled={loading || !documentData}
            className="btn btn-primary btn-sm"
            title="Print Document"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      }
    >
      <div className="animate-fade-in">
        {/* Back Link */}
        <div style={{ marginBottom: '1.25rem' }}>
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
          /* Side-by-side certificate and info panel matching reference design */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(320px, 1fr)',
              gap: '2.5rem',
              alignItems: 'start'
            }}
          >
            {/* Left: Exact Reference Certificate */}
            <div style={{ overflowX: 'auto' }}>
              <DocumentCertificate
                previewId="document-details-certificate-node"
                documentData={documentData}
                company={companyDetails}
                isDraft={false}
              />
            </div>

            {/* Right: Reference Document Information Panel & Verification Panel */}
            <div>
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
