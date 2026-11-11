import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { companyService } from '../services/companyService';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatDate } from '../utils/formatters';
import {
  Building2,
  Check,
  X,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import '../styles/dashboard.css';

export const CompanyManagementPage = () => {
  const { addToast } = useToast();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected, suspended
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [approveModalComp, setApproveModalComp] = useState(null);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const [rejectModalComp, setRejectModalComp] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [suspendModalComp, setSuspendModalComp] = useState(null);
  const [suspendRemarks, setSuspendRemarks] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  const [viewModalComp, setViewModalComp] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await companyService.getCompanies({
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchQuery.trim() || undefined
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      setCompanies(list);
    } catch (err) {
      setError(err.message || 'Unable to retrieve companies from API.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenApprove = (comp) => {
    setApproveModalComp(comp);
    setApproveRemarks('Verified corporate registration and compliance records.');
  };

  const handleConfirmApprove = async () => {
    if (!approveModalComp) return;
    setIsApproving(true);
    try {
      await companyService.approveCompany(approveModalComp.id, approveRemarks);
      addToast(`Company '${approveModalComp.name}' approved successfully!`, 'success');
      setApproveModalComp(null);
      fetchCompanies();
    } catch (err) {
      addToast(err.message || 'Approval action failed.', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenReject = (comp) => {
    setRejectModalComp(comp);
    setRejectRemarks('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalComp) return;
    if (!rejectRemarks.trim()) {
      addToast('Please provide a reason or remarks for rejection.', 'warning');
      return;
    }

    setIsRejecting(true);
    try {
      await companyService.rejectCompany(rejectModalComp.id, rejectRemarks.trim());
      addToast(`Company '${rejectModalComp.name}' registration rejected.`, 'info');
      setRejectModalComp(null);
      fetchCompanies();
    } catch (err) {
      addToast(err.message || 'Rejection action failed.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenSuspend = (comp) => {
    setSuspendModalComp(comp);
    setSuspendRemarks('');
  };

  const handleConfirmSuspend = async () => {
    if (!suspendModalComp) return;
    setIsSuspending(true);
    try {
      await companyService.suspendCompany(suspendModalComp.id, suspendRemarks.trim());
      addToast(`Company '${suspendModalComp.name}' has been suspended.`, 'warning');
      setSuspendModalComp(null);
      fetchCompanies();
    } catch (err) {
      addToast(err.message || 'Suspension failed.', 'error');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleConfirmReactivate = async (comp) => {
    try {
      await companyService.reactivateCompany(comp.id);
      addToast(`Company '${comp.name}' reactivated.`, 'success');
      fetchCompanies();
    } catch (err) {
      addToast(err.message || 'Reactivation failed.', 'error');
    }
  };

  // Tab counts
  const totalCount = companies.length;
  const pendingCount = companies.filter((c) => c.status === 'pending').length;
  const approvedCount = companies.filter((c) => c.status === 'approved').length;
  const rejectedCount = companies.filter((c) => c.status === 'rejected').length;
  const suspendedCount = companies.filter((c) => c.status === 'suspended').length;

  return (
    <AdminLayout
      title="Company Management & Approvals"
      subtitle="Audit legal registration credentials, approve, reject, or suspend enterprise issuers"
    >
      <div className="content-card-panel animate-fade-in">
        {/* Panel Header with Filters & Search */}
        <div className="panel-header-row">
          <div className="panel-filter-tabs">
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved ({approvedCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'suspended' ? 'active' : ''}`}
              onClick={() => setActiveTab('suspended')}
            >
              Suspended ({suspendedCount})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Search by company or email..."
              className="form-control"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: '38px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <LoadingState message="Loading company records from API..." />
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorState
              title="Failed to Load Companies"
              message={error}
              onRetry={fetchCompanies}
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Official Email</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                      <Building2 size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0 }}>No companies found matching the selected filter.</p>
                    </td>
                  </tr>
                ) : (
                  companies.map((comp) => (
                    <tr key={comp.id || comp.registration_number}>
                      <td>
                        <div className="table-company-cell">
                          <div className="company-logo-avatar">
                            {comp.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{comp.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              CIN: {comp.registration_number || comp.registrationNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{comp.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          HR: {comp.hr_name || comp.hrName}
                        </div>
                      </td>
                      <td>{formatDate(comp.created_at || comp.createdAt, { short: true })}</td>
                      <td>
                        <StatusBadge status={comp.status} />
                      </td>
                      <td>
                        <div className="table-actions-group">
                          {comp.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenApprove(comp)}
                                title="Approve Company"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger-outline btn-sm"
                                onClick={() => handleOpenReject(comp)}
                                title="Reject Company"
                              >
                                <X size={14} /> Reject
                              </button>
                            </>
                          )}

                          {comp.status === 'approved' && (
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-sm"
                              onClick={() => handleOpenSuspend(comp)}
                              title="Suspend Issuer"
                            >
                              <Ban size={14} /> Suspend
                            </button>
                          )}

                          {(comp.status === 'rejected' || comp.status === 'suspended') && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleConfirmReactivate(comp)}
                              title="Reactivate / Approve"
                            >
                              <RotateCcw size={14} /> Reactivate
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setViewModalComp(comp)}
                            title="View Full Details"
                          >
                            <Eye size={14} /> View
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

      {/* Approve Company Modal */}
      <Modal
        isOpen={!!approveModalComp}
        onClose={() => setApproveModalComp(null)}
        title="Approve Enterprise Registration"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setApproveModalComp(null)}
              disabled={isApproving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmApprove}
              disabled={isApproving}
            >
              {isApproving ? 'Submitting...' : 'Confirm Approval'}
            </button>
          </>
        }
      >
        {approveModalComp && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <CheckCircle size={26} />
              </div>
              <h4 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                {approveModalComp.name}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{approveModalComp.email}</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Registration No:</strong> {approveModalComp.registration_number || approveModalComp.registrationNumber}</div>
              <div><strong>HR Admin Contact:</strong> {approveModalComp.hr_name || approveModalComp.hrName} ({approveModalComp.hr_email || approveModalComp.hrEmail})</div>
            </div>

            <div className="form-group">
              <label htmlFor="approveRemarks">Audit Verification Remarks (Optional)</label>
              <textarea
                id="approveRemarks"
                rows={3}
                className="form-control"
                placeholder="Details of verified corporate incorporation docs..."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Approving grants this organization active credentials to issue blockchain documents.
            </p>
          </div>
        )}
      </Modal>

      {/* Reject Company Modal */}
      <Modal
        isOpen={!!rejectModalComp}
        onClose={() => setRejectModalComp(null)}
        title="Reject Company Registration"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRejectModalComp(null)}
              disabled={isRejecting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmReject}
              disabled={isRejecting}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        {rejectModalComp && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <XCircle size={26} />
              </div>
              <h4 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                {rejectModalComp.name}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{rejectModalComp.email}</p>
            </div>

            <div className="form-group">
              <label htmlFor="rejectRemarks">
                <span>Rejection Reason *</span>
                <span className="required-asterisk">Required</span>
              </label>
              <textarea
                id="rejectRemarks"
                rows={3}
                className="form-control"
                placeholder="Explain the rejection reason (e.g. invalid tax identifier, unverified incorporation permit)..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                required
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              The rejection reason will be recorded on the audit log and communicated to the registrant.
            </p>
          </div>
        )}
      </Modal>

      {/* Suspend Company Modal */}
      <Modal
        isOpen={!!suspendModalComp}
        onClose={() => setSuspendModalComp(null)}
        title="Suspend Organization"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSuspendModalComp(null)}
              disabled={isSuspending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmSuspend}
              disabled={isSuspending}
            >
              {isSuspending ? 'Suspending...' : 'Confirm Suspension'}
            </button>
          </>
        }
      >
        {suspendModalComp && (
          <div>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Suspending <strong>{suspendModalComp.name}</strong> will prevent HR administrators from issuing any new documents until reactivated.
            </p>
            <div className="form-group">
              <label htmlFor="suspendRemarks">Suspension Reason</label>
              <textarea
                id="suspendRemarks"
                rows={2}
                className="form-control"
                placeholder="Optional notes or compliance violation details..."
                value={suspendRemarks}
                onChange={(e) => setSuspendRemarks(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewModalComp}
        onClose={() => setViewModalComp(null)}
        title="Organization Details & Audit Records"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setViewModalComp(null)}
          >
            Close
          </button>
        }
      >
        {viewModalComp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>{viewModalComp.name}</h4>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>ID: {viewModalComp.id}</span>
              </div>
              <StatusBadge status={viewModalComp.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>REGISTRATION / CIN</span>
                <strong>{viewModalComp.registration_number || viewModalComp.registrationNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>OFFICIAL EMAIL</span>
                <strong>{viewModalComp.email}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>PHONE</span>
                <strong>{viewModalComp.phone}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>WEBSITE</span>
                {viewModalComp.website ? (
                  <a href={viewModalComp.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {viewModalComp.website} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>CORPORATE ADDRESS</span>
              <div>{viewModalComp.address}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#0f172a' }}>HR Administrator</strong>
              <div>Name: {viewModalComp.hr_name || viewModalComp.hrName}</div>
              <div>Email: {viewModalComp.hr_email || viewModalComp.hrEmail}</div>
              {viewModalComp.hr_designation && <div>Title: {viewModalComp.hr_designation}</div>}
            </div>

            {viewModalComp.remarks && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: '#b45309', display: 'block' }}>Admin Remarks:</strong>
                <p style={{ margin: '0.2rem 0 0', color: '#92400e' }}>{viewModalComp.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};
