import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useCompany } from '../../context/CompanyContext';
import {
  Building2,
  Clock,
  UserCheck,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  FileText
} from 'lucide-react';
import '../../styles/dashboard.css';

export const SuperAdminDashboard = () => {
  const { stats, companies } = useCompany();

  // Take 5 most recent registrations
  const recentCompanies = [...companies].slice(0, 5);

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
      title="Super Admin Dashboard"
      subtitle="System overview, blockchain verification metrics, and quick actions"
    >
      {/* 4 Metric Cards (Matches Wireframe 6) */}
      <div className="stats-grid-4col animate-fade-in">
        <div className="stat-metric-card" style={{ '--card-accent': '#10b981' }}>
          <div>
            <div className="stat-info-title">Total Companies</div>
            <div className="stat-numeric-value">{stats.totalCompanies}</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-emerald">
            <Building2 size={24} />
          </div>
        </div>

        <div className="stat-metric-card" style={{ '--card-accent': '#f59e0b' }}>
          <div>
            <div className="stat-info-title">Pending Approval</div>
            <div className="stat-numeric-value">{stats.pendingApproval}</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-metric-card" style={{ '--card-accent': '#0ea5e9' }}>
          <div>
            <div className="stat-info-title">Total HR Users</div>
            <div className="stat-numeric-value">{stats.totalHr}</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-blue">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="stat-metric-card" style={{ '--card-accent': '#8b5cf6' }}>
          <div>
            <div className="stat-info-title">Total Employees</div>
            <div className="stat-numeric-value">{stats.totalEmployees}</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-purple">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Recent Company Registrations Table (Wireframe 6) */}
      <div className="content-card-panel animate-fade-in">
        <div className="panel-header-row">
          <div>
            <h3>Recent Company Registrations</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Latest enterprise applications awaiting verification or recently processed
            </p>
          </div>
          <Link to="/superadmin/approvals" className="btn btn-outline-emerald btn-sm">
            View All Approvals <ArrowRight size={14} />
          </Link>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Official Email</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentCompanies.map((comp) => (
                <tr key={comp.id}>
                  <td>
                    <div className="table-company-cell">
                      <div className="company-logo-avatar">
                        {comp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ color: '#0f172a' }}>{comp.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Reg: {comp.registrationNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{comp.email}</td>
                  <td>
                    {new Date(comp.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td>{getStatusBadge(comp.status)}</td>
                  <td>
                    <Link
                      to="/superadmin/approvals"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    >
                      <Eye size={13} /> Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};
