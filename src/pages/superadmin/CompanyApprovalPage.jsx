import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import confetti from 'canvas-confetti';
import {
  Building2,
  Check,
  X,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  FileCheck2,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';
import '../../styles/dashboard.css';

export const CompanyApprovalPage = () => {
  const { companies, approveCompany, rejectCompany, loading } = useCompany();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [approveModalComp, setApproveModalComp] = useState(null);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const [rejectModalComp, setRejectModalComp] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [viewModalComp, setViewModalComp] = useState(null);

  // Tab counts
  const totalCount = companies.length;
  const pendingCount = companies.filter((c) => c.status === 'pending').length;
  const approvedCount = companies.filter((c) => c.status === 'approved').length;
  const rejectedCount = companies.filter((c) => c.status === 'rejected').length;

  // Filtered companies
  const filteredCompanies = companies.filter((comp) => {
    // Filter tab
    if (activeTab !== 'all' && comp.status !== activeTab) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = comp.name.toLowerCase().includes(q);
      const matchEmail = comp.email.toLowerCase().includes(q);
      const matchReg = comp.registrationNumber.toLowerCase().includes(q);
      const matchHr = comp.hrName?.toLowerCase().includes(q);
      return matchName || matchEmail || matchReg || matchHr;
    }
    return true;
  });

  const handleOpenApprove = (comp) => {
    setApproveModalComp(comp);
    setApproveRemarks('Verified corporate registration and compliance records.');
  };

  const handleConfirmApprove = async () => {
    if (!approveModalComp) return;
    setIsApproving(true);
    try {
      await approveCompany(approveModalComp.id, approveRemarks);
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
      addToast(`Company '${approveModalComp.name}' approved successfully! HR user can now log in.`, 'success');
      setApproveModalComp(null);
    } catch (err) {
      addToast(err.message || 'Approval failed', 'error');
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
      await rejectCompany(rejectModalComp.id, rejectRemarks);
      addToast(`Company '${rejectModalComp.name}' rejected.`, 'info');
      setRejectModalComp(null);
    } catch (err) {
      addToast(err.message || 'Rejection failed', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-approved">Approved</span>;
      case 'pending':
        return <span className="badge badge-pending">Pending</span>;
      case 'rejected':
        return <span className="badge badge-rejected">Rejected</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <DashboardLayout
      title="Company Registrations & Approvals"
      subtitle="Review, audit, approve or reject enterprise registration requests"
    >
      <div className="content-card-panel animate-fade-in">
        {/* Panel Header with Filters & Search */}
        <div className="panel-header-row">
          <div className="panel-filter-tabs">
            <button
              className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({totalCount})
            </button>
            <button
              className={`filter-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`filter-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved ({approvedCount})
            </button>
            <button
              className={`filter-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              Rejected ({rejectedCount})
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

        {/* Data Table (Wireframe 7) */}
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
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <Building2 size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                    <p>No company registrations match the selected filter.</p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => (
                  <tr key={comp.id}>
                    <td>
                      <div className="table-company-cell">
                        <div className="company-logo-avatar">
                          {comp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{comp.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            CIN: {comp.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{comp.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        HR: {comp.hrName}
                      </div>
                    </td>
                    <td>
                      {new Date(comp.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>{getStatusBadge(comp.status)}</td>
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
                            onClick={() => handleOpenReject(comp)}
                            title="Revoke / Reject"
                          >
                            <X size={14} /> Revoke
                          </button>
                        )}

                        {comp.status === 'rejected' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenApprove(comp)}
                            title="Re-approve"
                          >
                            <Check size={14} /> Re-approve
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewModalComp(comp)}
                          title="View Details"
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
      </div>

      {/* Approve Company Modal (Matches Wireframe Image 2 "Approve Company") */}
      <Modal
        isOpen={!!approveModalComp}
        onClose={() => setApproveModalComp(null)}
        title="Approve Company Registration"
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
              {isApproving ? 'Approving...' : 'Confirm Approve'}
            </button>
          </>
        }
      >
        {approveModalComp && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#d1fae5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}
              >
                <CheckCircle size={28} />
              </div>
              <h4 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                {approveModalComp.name}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{approveModalComp.email}</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Registration No:</strong> {approveModalComp.registrationNumber}</div>
              <div><strong>HR Admin Name:</strong> {approveModalComp.hrName} ({approveModalComp.hrEmail})</div>
            </div>

            <div className="form-group">
              <label htmlFor="approveRemarks">Remarks (Optional)</label>
              <textarea
                id="approveRemarks"
                rows={3}
                className="form-control"
                placeholder="Add verification remarks, compliance check details..."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Approving will immediately grant the HR Admin full access to the HR work area.
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
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}
              >
                <XCircle size={28} />
              </div>
              <h4 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                {rejectModalComp.name}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{rejectModalComp.email}</p>
            </div>

            <div className="form-group">
              <label htmlFor="rejectRemarks">
                <span>Rejection Reason *</span>
                <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>Required</span>
              </label>
              <textarea
                id="rejectRemarks"
                rows={3}
                className="form-control"
                placeholder="Explain why this registration was rejected (e.g. invalid tax ID, missing business permit)..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              The HR Admin will not be permitted to enter the active HR workspace.
            </p>
          </div>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewModalComp}
        onClose={() => setViewModalComp(null)}
        title="Company Registration Details"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>{viewModalComp.name}</h4>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>ID: {viewModalComp.id}</span>
              </div>
              {getStatusBadge(viewModalComp.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>REGISTRATION NUMBER</span>
                <strong>{viewModalComp.registrationNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>OFFICIAL EMAIL</span>
                <strong>{viewModalComp.email}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>PHONE NUMBER</span>
                <strong>{viewModalComp.phone}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>WEBSITE</span>
                {viewModalComp.website ? (
                  <a href={viewModalComp.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    {viewModalComp.website} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>CORPORATE ADDRESS</span>
              <div>{viewModalComp.address}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#0f172a' }}>HR Representative</strong>
              <div style={{ fontSize: '0.85rem' }}>Name: {viewModalComp.hrName}</div>
              <div style={{ fontSize: '0.85rem' }}>Email: {viewModalComp.hrEmail}</div>
            </div>

            {viewModalComp.remarks && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#b45309', display: 'block' }}>Super Admin Remarks:</strong>
                <p style={{ margin: '0.25rem 0 0', color: '#92400e' }}>{viewModalComp.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};
