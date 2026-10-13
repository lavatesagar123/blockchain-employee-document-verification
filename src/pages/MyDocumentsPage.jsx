import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeLayout } from '../layouts/EmployeeLayout';
import { documentService } from '../services/documentService';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/Toast';
import { formatDate, getDocumentTypeLabel, truncateHash } from '../utils/formatters';
import {
  FileText,
  Search,
  Eye,
  Download,
  Share2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  Copy
} from 'lucide-react';
import '../styles/dashboard.css';

export const MyDocumentsPage = () => {
  const { addToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchMyDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getMyDocuments({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      setDocuments(list);
    } catch (err) {
      setError(err.message || 'Failed to retrieve your document portfolio from API.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchQuery]);

  useEffect(() => {
    fetchMyDocuments();
  }, [fetchMyDocuments]);

  const handleShare = (doc) => {
    const vId = doc.verification_id || doc.id;
    const url = `${window.location.origin}/verify?id=${encodeURIComponent(vId)}`;
    navigator.clipboard.writeText(url);
    addToast('Public verification link copied to clipboard!', 'success');
  };

  const handleDownload = (doc) => {
    // Navigates to document details with print preview triggered
    window.open(`/employee/documents/${doc.id || doc.verification_id}?print=true`, '_blank');
  };

  return (
    <EmployeeLayout
      title="My Documents Portfolio"
      subtitle="View, inspect, download, and share your blockchain-anchored career credentials"
      actions={
        <button
          type="button"
          onClick={fetchMyDocuments}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
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
                placeholder="Search credential or ID..."
                className="form-control"
                style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: '38px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-control form-select"
              style={{ width: '180px', height: '38px', fontSize: '0.85rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Document Types</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="letter_of_intent">Letter of Intent</option>
              <option value="experience_letter">Experience Letter</option>
              <option value="relieving_letter">Relieving Letter</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Available: <strong>{documents.length}</strong> credentials
          </div>
        </div>

        {/* Documents Content */}
        {loading ? (
          <LoadingState message="Loading your credential portfolio from API..." />
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorState
              title="Unable to Load Documents"
              message={error}
              onRetry={fetchMyDocuments}
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Verification ID</th>
                  <th>Document Type</th>
                  <th>Issuing Organization</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                      <FileText size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontWeight: 500, color: '#475569' }}>
                        No employment documents found.
                      </p>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginTop: '0.35rem' }}>
                        Once an authorized employer issues an employment document, it will be anchored here.
                      </span>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building size={14} color="#64748b" />
                          <span>{doc.issuer_name || doc.company_name || 'Organization'}</span>
                        </div>
                      </td>
                      <td>{formatDate(doc.issue_date || doc.created_at, { short: true })}</td>
                      <td>
                        <StatusBadge status={doc.status || 'verified'} />
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <Link
                            to={`/employee/documents/${doc.id || doc.verification_id}`}
                            className="btn btn-secondary btn-sm"
                            title="Inspect Certificate Details"
                          >
                            <Eye size={13} /> View
                          </Link>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleShare(doc)}
                            title="Share Public Verification Link"
                          >
                            <Share2 size={13} /> Share
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-emerald btn-sm"
                            onClick={() => handleDownload(doc)}
                            title="Download / Print Certificate"
                          >
                            <Download size={13} />
                          </button>
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
    </EmployeeLayout>
  );
};
