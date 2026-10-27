import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HRLayout } from '../layouts/HRLayout';
import { useAuth } from '../context/AuthContext';
import { companyService } from '../services/companyService';
import { documentService } from '../services/documentService';
import { employeeService } from '../services/employeeService';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatDate } from '../utils/formatters';
import {
  Building2,
  Users,
  FileText,
  Clock,
  ShieldCheck,
  XCircle,
  FilePlus,
  ArrowRight
} from 'lucide-react';
import '../styles/dashboard.css';

export const HRDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [companyProfile, setCompanyProfile] = useState(null);
  const [issuedDocs, setIssuedDocs] = useState([]);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const fetchHRData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, docsRes, empsRes] = await Promise.allSettled([
        companyService.getCompanyProfile(),
        documentService.getIssuedDocuments(),
        employeeService.getEmployees()
      ]);

      if (profileRes.status === 'fulfilled') {
        setCompanyProfile(profileRes.value);
      } else {
        // Fallback to auth payload company details if company/me endpoint not yet created
        setCompanyProfile(user?.companyDetails || {
          name: user?.companyName,
          status: user?.companyStatus || 'approved'
        });
      }

      if (docsRes.status === 'fulfilled') {
        const docs = Array.isArray(docsRes.value) ? docsRes.value : docsRes.value?.results || [];
        setIssuedDocs(docs);
      }

      if (empsRes.status === 'fulfilled') {
        const emps = Array.isArray(empsRes.value) ? empsRes.value : empsRes.value?.results || [];
        setEmployeesCount(emps.length);
      }

      if (profileRes.status === 'rejected' && docsRes.status === 'rejected') {
        setError(profileRes.reason?.message || 'Unable to connect to HR service.');
      }
    } catch (err) {
      setError(err.message || 'Error loading HR workspace data.');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHRData();
  }, [fetchHRData]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await companyService.getCompanyProfile();
      setCompanyProfile(res);
      if (res?.status === 'approved') {
        addToast('Company registration is approved! Full HR workspace unlocked.', 'success');
      } else {
        addToast(`Current registration status: ${res?.status || 'pending'}`, 'info');
      }
    } catch (err) {
      addToast(err.message || 'Failed to check status with server.', 'error');
    } finally {
      setChecking(false);
    }
  };

  const status = companyProfile?.status || user?.companyStatus || 'approved';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <HRLayout
      title="HR Dashboard"
      subtitle="Workforce records & credential issuance"
    >
      {loading ? (
        <LoadingState message="Loading organization workspace..." />
      ) : error ? (
        <ErrorState
          title="Connect Backend to Load HR Portal"
          message={error}
          onRetry={fetchHRData}
        />
      ) : !isApproved ? (
        /* PENDING OR REJECTED BANNER */
        <div className="pending-approval-banner animate-fade-in">
          <div className="pending-pulse-icon">
            {isRejected ? <XCircle size={36} color="#ef4444" /> : <Clock size={36} />}
          </div>

          <h3 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            {isRejected ? 'Company Registration Not Approved' : 'Registration Under Super Admin Audit'}
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <StatusBadge status={status} />
          </div>

          <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.6, color: '#475569' }}>
            {isRejected ? (
              <>
                Your enterprise registration for <strong>{companyProfile?.name || user?.companyName}</strong> was
                rejected by the Super Admin during verification auditing.
                {companyProfile?.remarks && (
                  <span style={{ display: 'block', marginTop: '0.6rem', fontWeight: 600, color: '#991b1b' }}>
                    Audit Remarks: "{companyProfile.remarks}"
                  </span>
                )}
              </>
            ) : (
              <>
                Welcome to your HR Portal! Your organization registration for{' '}
                <strong>{companyProfile?.name || user?.companyName}</strong> is currently pending
                administrative audit. Once the Super Admin confirms your incorporation certificate,
                document issuance and workforce management capabilities will unlock automatically.
              </>
            )}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-outline-emerald"
              onClick={handleCheckStatus}
              disabled={checking}
            >
              <ShieldCheck size={16} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Checking Status...' : 'Check Registration Status'}</span>
            </button>

            <Link to="/hr/profile" className="btn btn-secondary">
              <Building2 size={16} />
              <span>View Submitted Profile</span>
            </Link>
          </div>
        </div>
      ) : (
        /* APPROVED HR WORKSPACE */
        <div className="animate-fade-in">
          {/* Status Alert Banner */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <strong style={{ color: '#065f46', fontSize: '0.95rem' }}>
                  Enterprise Verified on Blockchain
                </strong>
                <p style={{ color: '#047857', fontSize: '0.8rem', margin: 0 }}>
                  {companyProfile?.name} is authorized. You can issue cryptographically sealed credentials.
                </p>
              </div>
            </div>
            <StatusBadge status="approved" />
          </div>

          {/* Metrics Grid */}
          <div className="stats-grid-3col">
            <div className="stat-metric-card" style={{ '--card-accent': '#10b981' }}>
              <div>
                <div className="stat-info-title">Corporate Status</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>
                  Verified Active
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-emerald">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#0ea5e9' }}>
              <div>
                <div className="stat-info-title">Registered Workforce</div>
                <div className="stat-numeric-value">
                  {employeesCount || companyProfile?.total_employees || 0}
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-blue">
                <Users size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#8b5cf6' }}>
              <div>
                <div className="stat-info-title">Issued Credentials</div>
                <div className="stat-numeric-value">{issuedDocs.length}</div>
              </div>
              <div className="stat-icon-wrapper stat-icon-purple">
                <FileText size={24} />
              </div>
            </div>
          </div>

          {/* Recent Issued Documents */}
          <div className="content-card-panel">
            <div className="panel-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Recently Issued Documents</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Credentials issued under {companyProfile?.name}
                </p>
              </div>
              <Link to="/hr/documents" className="btn btn-outline-emerald btn-sm">
                View All Issued Documents <ArrowRight size={14} />
              </Link>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Verification ID</th>
                    <th>Document Type</th>
                    <th>Recipient</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                        <FileText size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No documents have been issued yet.</p>
                        <Link to="/hr/issue-document" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                          <FilePlus size={14} /> Issue First Document
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    issuedDocs.slice(0, 5).map((doc) => (
                      <tr key={doc.id || doc.verification_id}>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>
                            {doc.verification_id || doc.id}
                          </span>
                        </td>
                        <td>{doc.document_type || doc.type}</td>
                        <td>{doc.recipient_name || doc.employee_name}</td>
                        <td>{formatDate(doc.issue_date || doc.created_at, { short: true })}</td>
                        <td>
                          <StatusBadge status={doc.status || 'verified'} />
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
    </HRLayout>
  );
};
