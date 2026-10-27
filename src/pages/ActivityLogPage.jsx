import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { userService } from '../services/userService';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatDateTime } from '../utils/formatters';
import {
  Activity,
  Search,
  Clock,
  Shield,
  FileText,
  Building,
  UserCheck
} from 'lucide-react';
import '../styles/dashboard.css';

export const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getActivityLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      setLogs(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch activity logs from API.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionIcon = (action = '') => {
    const act = action.toLowerCase();
    if (act.includes('approv')) return <Building size={16} color="#059669" />;
    if (act.includes('reject')) return <Building size={16} color="#dc2626" />;
    if (act.includes('doc') || act.includes('issue')) return <FileText size={16} color="#0284c7" />;
    if (act.includes('login') || act.includes('auth')) return <UserCheck size={16} color="#7c3aed" />;
    return <Activity size={16} color="#64748b" />;
  };

  return (
    <AdminLayout
      title="System Activity & Audit Logs"
      subtitle="Immutable event audit trail tracking administrative and ledger actions"
    >
      <div className="content-card-panel animate-fade-in">
        {/* Filters */}
        <div className="panel-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search audit events, actors..."
                className="form-control"
                style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: '38px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-control form-select"
              style={{ width: '180px', height: '38px', fontSize: '0.85rem' }}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="Company Approved">Company Approved</option>
              <option value="Company Rejected">Company Rejected</option>
              <option value="Document Issued">Document Issued</option>
              <option value="Document Revoked">Document Revoked</option>
              <option value="User Login">User Login</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing {logs.length} logged events
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <LoadingState message="Querying security audit logs from API..." />
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorState
              title="Unable to Load Activity Logs"
              message={error}
              onRetry={fetchLogs}
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      <Activity size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0 }}>No audit logs recorded matching this filter.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id || `${log.timestamp}-${Math.random()}`}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={13} />
                          <span>{formatDateTime(log.timestamp || log.created_at)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getActionIcon(log.action)}
                          <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>
                            {log.action}
                          </strong>
                        </div>
                      </td>
                      <td style={{ color: '#334155', fontSize: '0.85rem' }}>
                        {log.description || log.details || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span className="badge badge-neutral font-mono" style={{ fontSize: '0.75rem' }}>
                          {log.performed_by || log.performedBy || log.actor || 'System'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
