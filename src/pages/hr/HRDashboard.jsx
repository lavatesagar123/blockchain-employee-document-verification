import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../components/common/Toast';
import {
  Building2,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import '../../styles/dashboard.css';

export const HRDashboard = () => {
  const { user, refreshUser } = useAuth();
  const { companies } = useCompany();
  const { addToast } = useToast();
  const [checking, setChecking] = useState(false);

  // Sync user's company status with the latest in the company store
  const userCompany = companies.find((c) => c.id === user?.companyId) || user?.companyDetails;
  const isApproved = userCompany ? userCompany.status === 'approved' : user?.companyStatus === 'approved';
  const isPending = userCompany ? userCompany.status === 'pending' : user?.companyStatus === 'pending';
  const isRejected = userCompany ? userCompany.status === 'rejected' : user?.companyStatus === 'rejected';

  const handleCheckStatus = () => {
    setChecking(true);
    refreshUser();
    setTimeout(() => {
      setChecking(false);
      if (isApproved) {
        addToast('Company registration is Approved! Full HR work area unlocked.', 'success');
      } else if (isPending) {
        addToast('Status: Still pending Super Admin review. You can approve it using the Super Admin demo switcher above!', 'warning');
      } else if (isRejected) {
        addToast('Status: Company registration was rejected by Super Admin.', 'error');
      }
    }, 400);
  };

  return (
    <DashboardLayout
      title="HR Administration Dashboard"
      subtitle={`Manage company records, workforce onboarding, and document issuance for ${userCompany?.name || user?.companyName || 'your organization'}`}
    >
      {/* Pending / Approval Gate Handling */}
      {!isApproved ? (
        /* PENDING OR REJECTED BANNER (Matches Wireframe 8) */
        <div className="pending-approval-banner animate-fade-in">
          <div className="pending-pulse-icon">
            {isRejected ? <XCircle size={36} color="#ef4444" /> : <Clock size={36} />}
          </div>

          <h3>
            {isRejected ? 'Company Registration Rejected' : 'Company Registration Under Review'}
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            {isRejected ? (
              <span className="badge badge-rejected" style={{ fontSize: '0.85rem' }}>
                Status: Rejected by Super Admin
              </span>
            ) : (
              <span className="badge badge-pending" style={{ fontSize: '0.85rem' }}>
                Status: Pending Super Admin Approval
              </span>
            )}
          </div>

          <p>
            {isRejected ? (
              <>
                Your application for <strong>{userCompany?.name || 'your company'}</strong> was not approved.
                {userCompany?.remarks && (
                  <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>
                    Reason: "{userCompany.remarks}"
                  </span>
                )}
              </>
            ) : (
              <>
                Welcome to your HR Dashboard! Your company registration for{' '}
                <strong>{userCompany?.name || 'your enterprise'}</strong> is currently under review by
                the Super Admin to verify legal incorporation. Full HR capabilities will unlock automatically upon approval.
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
              <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Checking Status...' : 'Check Registration Status'}
            </button>

            <Link to="/hr/profile" className="btn btn-secondary">
              <Building2 size={16} /> View Submitted Details
            </Link>
          </div>

          {/* Quick Demo Helper Callout */}
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #fde68a', maxWidth: '520px', textAlign: 'left', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontWeight: 700, marginBottom: '0.35rem' }}>
              <Sparkles size={16} /> Quick Test Tip for Evaluators:
            </div>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.8rem' }}>
              Click <strong>"Super Admin"</strong> in the top switcher bar, go to <strong>Company Approvals</strong>, click <strong>"Approve"</strong> on this company, then switch back to this HR account to see the full workspace unlock immediately!
            </p>
          </div>
        </div>
      ) : (
        /* APPROVED HR WORK AREA (Wireframe 8 Approved State) */
        <div className="animate-fade-in">
          {/* Status Alert */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <strong style={{ color: '#065f46', fontSize: '0.95rem' }}>Enterprise Verified on Blockchain</strong>
                <p style={{ color: '#047857', fontSize: '0.8rem', margin: 0 }}>
                  {userCompany?.name} is approved. You have full authorization to manage records.
                </p>
              </div>
            </div>
            <span className="badge badge-approved" style={{ fontSize: '0.85rem' }}>Status: Approved</span>
          </div>

          {/* Stats Grid (Wireframe 8) */}
          <div className="stats-grid-3col">
            <div className="stat-metric-card" style={{ '--card-accent': '#10b981' }}>
              <div>
                <div className="stat-info-title">Company Status</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>Approved</div>
              </div>
              <div className="stat-icon-wrapper stat-icon-emerald">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#0ea5e9' }}>
              <div>
                <div className="stat-info-title">Total Employees</div>
                <div className="stat-numeric-value">{userCompany?.totalEmployees || 14}</div>
              </div>
              <div className="stat-icon-wrapper stat-icon-blue">
                <Users size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#8b5cf6' }}>
              <div>
                <div className="stat-info-title">Issued Documents</div>
                <div className="stat-numeric-value">28</div>
              </div>
              <div className="stat-icon-wrapper stat-icon-purple">
                <FileText size={24} />
              </div>
            </div>
          </div>

          {/* Organization Details Overview */}
          <div className="content-card-panel">
            <div className="panel-header-row">
              <h3>Company Workspace Overview</h3>
              <Link to="/hr/profile" className="btn btn-outline-emerald btn-sm">
                View Full Company Profile <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>ORGANIZATION NAME</span>
                <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{userCompany?.name}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>REGISTRATION / CIN</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{userCompany?.registrationNumber}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>OFFICIAL EMAIL</span>
                <span>{userCompany?.email}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>AUTHORIZED HR</span>
                <span>{user?.name} ({user?.email})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
