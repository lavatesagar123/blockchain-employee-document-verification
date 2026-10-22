import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeLayout } from '../layouts/EmployeeLayout';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';
import { employeeService } from '../services/employeeService';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatDate, getDocumentTypeLabel, getInitials } from '../utils/formatters';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Eye,
  Search
} from 'lucide-react';
import '../styles/dashboard.css';

export const EmployeeDashboard = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, docsRes] = await Promise.allSettled([
        employeeService.getEmployeeProfile(),
        documentService.getMyDocuments()
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value);
      } else {
        setProfile(user);
      }

      if (docsRes.status === 'fulfilled') {
        const list = Array.isArray(docsRes.value) ? docsRes.value : docsRes.value?.results || [];
        setDocuments(list);
      }

      if (profileRes.status === 'rejected' && docsRes.status === 'rejected') {
        setError(profileRes.reason?.message || 'Failed to connect to employee API service.');
      }
    } catch (err) {
      setError(err.message || 'Error loading employee portal.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const activeCount = documents.filter((d) => d.status === 'verified' || d.status === 'active').length;
  const displayName = profile?.name || user?.name || 'Employee';
  const displayRole = profile?.designation || user?.designation || 'Software Engineer';
  const displayComp = profile?.company_name || profile?.companyName || user?.companyName || 'Independent Talent';

  return (
    <EmployeeLayout
      title="Employee Portal"
      subtitle="Your verified blockchain credentials and employment portfolio"
    >
      {loading ? (
        <LoadingState message="Loading your credential portfolio..." />
      ) : error ? (
        <ErrorState
          title="Connect Backend to Load Credentials"
          message={error}
          onRetry={fetchEmployeeData}
        />
      ) : (
        <div className="animate-fade-in">
          {/* Profile Card */}
          <div className="profile-overview-card">
            <div className="profile-main-info">
              <div className="profile-large-avatar">
                {getInitials(displayName)}
              </div>
              <div className="profile-text">
                <h2>{displayName}</h2>
                <p>
                  {displayRole} • {displayComp}
                </p>
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {profile?.employee_id && (
                    <span className="badge badge-neutral font-mono">{profile.employee_id}</span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {profile?.email || user?.email}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge status="active" />
          </div>

          {/* Quick Stats Grid */}
          <div className="stats-grid-3col">
            <div className="stat-metric-card" style={{ '--card-accent': '#0ea5e9' }}>
              <div>
                <div className="stat-info-title">Total Credentials</div>
                <div className="stat-numeric-value">{documents.length}</div>
              </div>
              <div className="stat-icon-wrapper stat-icon-blue">
                <FileText size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#10b981' }}>
              <div>
                <div className="stat-info-title">Blockchain Verified</div>
                <div className="stat-numeric-value">{activeCount}</div>
              </div>
              <div className="stat-icon-wrapper stat-icon-emerald">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#8b5cf6' }}>
              <div>
                <div className="stat-info-title">Ledger Integrity</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>
                  100% Sealed
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-purple">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          {/* Blockchain Trust Banner */}
          <div className="blockchain-status-alert" style={{ marginBottom: '2rem' }}>
            <ShieldCheck size={26} color="#10b981" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#065f46', fontSize: '0.95rem' }}>
                Immutable Credentials Anchored
              </strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#166534' }}>
                Your employment certificates and credentials are cryptographically anchored to the
                TrustDoc distributed ledger. Prospective employers can instantly verify their
                integrity without delays.
              </p>
            </div>
            <Link to="/verify" className="btn btn-outline-emerald btn-sm" style={{ background: '#ffffff', flexShrink: 0 }}>
              <Search size={14} /> Open Public Verifier
            </Link>
          </div>

          {/* My Documents Table */}
          <div className="content-card-panel">
            <div className="panel-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>My Credential Portfolio</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Officially issued documents anchored to your verified identity
                </p>
              </div>
              <Link to="/employee/documents" className="btn btn-outline-emerald btn-sm">
                View All Documents <ArrowRight size={14} />
              </Link>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Verification ID</th>
                    <th>Document Type</th>
                    <th>Issuer Organization</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                        <FileText size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No documents have been issued to your account yet.</p>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          When your employer issues an offer letter or experience certificate, it will appear here.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    documents.slice(0, 5).map((doc) => (
                      <tr key={doc.id || doc.verification_id}>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>
                            {doc.verification_id || doc.id}
                          </span>
                        </td>
                        <td>{getDocumentTypeLabel(doc.document_type || doc.type)}</td>
                        <td>{doc.issuer_name || doc.company_name || 'Organization'}</td>
                        <td>{formatDate(doc.issue_date || doc.created_at, { short: true })}</td>
                        <td>
                          <StatusBadge status={doc.status || 'verified'} />
                        </td>
                        <td>
                          <Link
                            to={`/employee/documents/${doc.id || doc.verification_id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                          >
                            <Eye size={13} /> View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
};
