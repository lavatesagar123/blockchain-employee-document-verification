import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { companyService } from '../services/companyService';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { formatDate } from '../utils/formatters';
import {
  Building2,
  Clock,
  UserCheck,
  Users,
  ArrowRight,
  Eye,
  RefreshCw,
  Activity,
  ShieldCheck
} from 'lucide-react';
import '../styles/dashboard.css';

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, companiesRes] = await Promise.allSettled([
        companyService.getCompanyStats(),
        companyService.getCompanies({ page: 1 })
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }

      if (companiesRes.status === 'fulfilled') {
        const comps = Array.isArray(companiesRes.value)
          ? companiesRes.value
          : companiesRes.value?.results || [];
        setRecentCompanies(comps.slice(0, 5));
      }

      // If both calls failed due to network / offline
      if (statsRes.status === 'rejected' && companiesRes.status === 'rejected') {
        setError(statsRes.reason?.message || 'Failed to connect to backend service.');
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard metrics.');
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchDashboardData();
  };

  return (
    <AdminLayout
      title="Super Admin Overview"
      subtitle="System status, corporate verification metrics, and recent enterprise registrations"
      actions={
        <button
          type="button"
          onClick={handleRetry}
          disabled={loading || isRetrying}
          className="btn btn-secondary btn-sm"
          title="Refresh metrics from API"
        >
          <RefreshCw size={14} className={loading || isRetrying ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      }
    >
      {loading ? (
        <LoadingState message="Fetching system telemetry from API..." />
      ) : error ? (
        <ErrorState
          title="Connect Backend to Load Live Metrics"
          message={error}
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      ) : (
        <div className="animate-fade-in">
          {/* KPI Stat Cards (Only rendered from actual API response) */}
          <div className="stats-grid-4col">
            <div className="stat-metric-card" style={{ '--card-accent': '#10b981' }}>
              <div>
                <div className="stat-info-title">Total Registered Companies</div>
                <div className="stat-numeric-value">
                  {stats?.total_companies ?? stats?.totalCompanies ?? recentCompanies.length}
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-emerald">
                <Building2 size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#f59e0b' }}>
              <div>
                <div className="stat-info-title">Pending Approvals</div>
                <div className="stat-numeric-value" style={{ color: '#d97706' }}>
                  {stats?.pending_companies ?? stats?.pendingApproval ?? recentCompanies.filter((c) => c.status === 'pending').length}
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-amber">
                <Clock size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#0ea5e9' }}>
              <div>
                <div className="stat-info-title">Authorized HR Users</div>
                <div className="stat-numeric-value">
                  {stats?.total_hr_users ?? stats?.totalHr ?? '—'}
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-blue">
                <UserCheck size={24} />
              </div>
            </div>

            <div className="stat-metric-card" style={{ '--card-accent': '#8b5cf6' }}>
              <div>
                <div className="stat-info-title">Total Verified Employees</div>
                <div className="stat-numeric-value">
                  {stats?.total_employees ?? stats?.totalEmployees ?? '—'}
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-purple">
                <Users size={24} />
              </div>
            </div>
          </div>

          {/* Quick Actions & Navigation Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <Link to="/superadmin/companies" className="content-card-panel" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>Audit Companies</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Review pending corporate registrations</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </Link>

            <Link to="/superadmin/users" className="content-card-panel" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>Manage Users</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Oversee admin & employee accounts</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </Link>

            <Link to="/superadmin/activity-logs" className="content-card-panel" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>Activity Audit Logs</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Inspect security and verification events</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </Link>
          </div>

          {/* Recent Registrations Table */}
          <div className="content-card-panel">
            <div className="panel-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Recent Enterprise Registrations</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Latest applications received from the public registration endpoint
                </p>
              </div>
              <Link to="/superadmin/companies" className="btn btn-outline-emerald btn-sm">
                View All Companies <ArrowRight size={14} />
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
                  {recentCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                        <Building2 size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No company registrations returned by the backend API.</p>
                      </td>
                    </tr>
                  ) : (
                    recentCompanies.map((comp) => (
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
                        <td>{comp.email}</td>
                        <td>{formatDate(comp.created_at || comp.createdAt, { short: true })}</td>
                        <td>
                          <StatusBadge status={comp.status} />
                        </td>
                        <td>
                          <Link
                            to="/superadmin/companies"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                          >
                            <Eye size={13} /> Review
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
    </AdminLayout>
  );
};
