import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HRLayout } from '../layouts/HRLayout';
import { documentService } from '../services/documentService';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatDate, getDocumentTypeLabel, truncateHash } from '../utils/formatters';
import { DocumentCertificate } from '../components/DocumentCertificate';
import { downloadCertificateAsPdf, printCertificate } from '../utils/pdfGenerator';
import {
  FileText,
  FilePlus,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Download,
  Printer
} from 'lucide-react';
import '../styles/dashboard.css';

export const IssuedDocumentsPage = () => {
  const { addToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [viewDoc, setViewDoc] = useState(null);
  const [revokeDoc, setRevokeDoc] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getIssuedDocuments({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      setDocuments(list);
    } catch (err) {
      setError(err.message || 'Failed to load issued documents from API.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenRevoke = (doc) => {
    setRevokeDoc(doc);
    setRevokeReason('');
  };

  const handleConfirmRevoke = async () => {
    if (!revokeDoc) return;
    if (!revokeReason.trim()) {
      addToast('Please provide a revocation reason.', 'warning');
      return;
    }

    setIsRevoking(true);
    try {
      await documentService.revokeDocument(revokeDoc.id || revokeDoc.verification_id, revokeReason.trim());
      addToast('Document successfully revoked on the ledger.', 'warning');
      setRevokeDoc(null);
      fetchDocuments();
    } catch (err) {
      addToast(err.message || 'Revocation failed.', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  return (
    <HRLayout
      title="Issued Document Registry"
      subtitle="Complete ledger of cryptographic credentials issued by your organization"
      actions={
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={fetchDocuments}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/hr/issue-document" className="btn btn-primary btn-sm">
            <FilePlus size={15} />
            <span>Issue New</span>
          </Link>
        </div>
      }
    >
      <div className="content-card-panel animate-fade-in">
        {/* Filter & Search Bar */}
        <div className="panel-header-row">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search recipient or ID..."
                className="form-control"
                style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: '38px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-control form-select"
              style={{ width: '170px', height: '38px', fontSize: '0.85rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Document Types</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="letter_of_intent">Letter of Intent</option>
              <option value="experience_letter">Experience Letter</option>
              <option value="relieving_letter">Relieving Letter</option>
            </select>

            <select
              className="form-control form-select"
              style={{ width: '130px', height: '38px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified / Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Total: <strong>{documents.length}</strong> credentials
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState message="Fetching issued documents from API..." />
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorState
              title="Unable to Load Issued Registry"
              message={error}
              onRetry={fetchDocuments}
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Verification ID</th>
                  <th>Document Type</th>
                  <th>Recipient</th>
                  <th>Issue Date</th>
                  <th>Ledger Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                      <FileText size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0 }}>No issued documents found in the registry.</p>
                      <Link to="/hr/issue-document" className="btn btn-outline-emerald btn-sm" style={{ marginTop: '0.85rem' }}>
                        <FilePlus size={14} /> Issue a Document
                      </Link>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id || doc.verification_id}>
                      <td>
                        <strong className="font-mono" style={{ color: '#0f172a' }}>
                          {doc.verification_id || doc.id}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {getDocumentTypeLabel(doc.document_type || doc.type)}
                        </span>
                      </td>
                      <td>
                        <div>{doc.recipient_name || doc.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {doc.recipient_email || doc.employee_email}
                        </div>
                      </td>
                      <td>{formatDate(doc.issue_date || doc.created_at, { short: true })}</td>
                      <td>
                        <StatusBadge status={doc.status || 'verified'} />
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setViewDoc(doc)}
                            title="View Document Details"
                          >
                            <Eye size={13} /> View
                          </button>

                          {doc.status !== 'revoked' && (
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-sm"
                              onClick={() => handleOpenRevoke(doc)}
                              title="Revoke Document"
                            >
                              <AlertTriangle size={13} /> Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Document Modal with Full Certificate Design */}
      <Modal
        isOpen={!!viewDoc}
        onClose={() => setViewDoc(null)}
        title={viewDoc ? `Document Inspection: ${getDocumentTypeLabel(viewDoc.document_type || viewDoc.type)}` : 'Document Inspection'}
        maxWidth="920px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link
              to={`/verify?id=${viewDoc?.verification_id || viewDoc?.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-emerald btn-sm"
            >
              <ExternalLink size={14} /> Open Public Verifier
            </Link>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={async () => {
                  if (!viewDoc) return;
                  const label = getDocumentTypeLabel(viewDoc.document_type || viewDoc.type).replace(/\s+/g, '_');
                  const name = (viewDoc.recipient_name || viewDoc.employee_name || 'Doc').replace(/\s+/g, '_');
                  await downloadCertificateAsPdf('issued-registry-cert-node', { filename: `${label}_${name}.pdf` });
                  addToast('PDF downloaded successfully!', 'success');
                }}
                className="btn btn-primary btn-sm"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => printCertificate()}
                className="btn btn-secondary btn-sm"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewDoc(null)}
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        {viewDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', overflowX: 'auto' }}>
              <DocumentCertificate
                previewId="issued-registry-cert-node"
                documentData={viewDoc}
                company={{
                  name: viewDoc.issuer_name || viewDoc.company_name || 'TrustDoc Technologies',
                  tagline: 'Secure Documents | Trusted Future',
                  address: 'TrustDoc Technologies\nPune, Maharashtra - 411001',
                  email: 'hr@trustdoc.com',
                  website: 'www.trustdoc.com',
                  signatory_name: viewDoc.signatory_name || 'Rohan Deshmukh',
                  signatory_role: viewDoc.signatory_role || 'HR Manager'
                }}
                isDraft={false}
              />
            </div>

            {viewDoc.status === 'revoked' && viewDoc.revocation_reason && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.85rem 1rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem' }}>
                <strong>Revocation Notice:</strong>
                <p style={{ margin: '0.2rem 0 0' }}>{viewDoc.revocation_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Revoke Document Modal */}
      <Modal
        isOpen={!!revokeDoc}
        onClose={() => setRevokeDoc(null)}
        title="Revoke Issued Document"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRevokeDoc(null)}
              disabled={isRevoking}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmRevoke}
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
            </button>
          </>
        }
      >
        {revokeDoc && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h4 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>
                Revoke {getDocumentTypeLabel(revokeDoc.document_type || revokeDoc.type)}
              </h4>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                ID: {revokeDoc.verification_id || revokeDoc.id}
              </span>
            </div>

            <p style={{ color: '#475569', fontSize: '0.875rem' }}>
              Revoking marks this credential as invalid on the verification ledger.
              Subsequent public verification queries will report the document as Revoked.
            </p>

            <div className="form-group">
              <label htmlFor="revokeReason">
                <span>Revocation Reason *</span>
                <span className="required-asterisk">Required</span>
              </label>
              <textarea
                id="revokeReason"
                rows={3}
                className="form-control"
                placeholder="State the reason for revoking this document (e.g. issued with clerical error, tenure updated, offer rescinded)..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                required
              />
            </div>
          </div>
        )}
      </Modal>
    </HRLayout>
  );
};
