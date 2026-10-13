import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { userService } from '../services/userService';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { getInitials, formatDate } from '../utils/formatters';
import {
  Users,
  Search,
  Eye,
  RefreshCw,
  Mail,
  Phone,
  Building,
  Shield,
  UserCheck
} from 'lucide-react';
import '../styles/dashboard.css';

export const UserManagementPage = () => {
  const { addToast } = useToast();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, hr, employee, superadmin
  const [searchQuery, setSearchQuery] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUsers({
        role: activeTab !== 'all' ? activeTab : undefined,
        search: searchQuery.trim() || undefined
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      setUsersList(list);
    } catch (err) {
      setError(err.message || 'Failed to load user accounts from API.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    setUpdatingId(user.id);
    try {
      await userService.updateUserStatus(user.id, nextStatus);
      addToast(`User '${user.name}' status changed to ${nextStatus}.`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Status update failed.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const hrCount = usersList.filter((u) => u.role === 'hr').length;
  const empCount = usersList.filter((u) => u.role === 'employee').length;

  return (
    <AdminLayout
      title="User Management"
      subtitle="Supervise registered accounts, administrative roles, and system access"
      actions={
        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      }
    >
      <div className="content-card-panel animate-fade-in">
        {/* Header Tabs & Search */}
        <div className="panel-header-row">
          <div className="panel-filter-tabs">
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Users ({usersList.length})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'hr' ? 'active' : ''}`}
              onClick={() => setActiveTab('hr')}
            >
              HR Admins ({hrCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
              onClick={() => setActiveTab('employee')}
            >
              Employees ({empCount})
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Search user, email, company..."
              className="form-control"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: '38px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Fetching user directory from API..." />
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorState
              title="Unable to Load User Directory"
              message={error}
              onRetry={fetchUsers}
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Affiliated Organization</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      <Users size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0 }}>No users found matching your search filter.</p>
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id || u.email}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: u.role === 'superadmin' ? '#0f172a' : u.role === 'hr' ? '#10b981' : '#0284c7',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', display: 'block' }}>{u.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {u.role === 'hr' ? 'HR Admin' : u.role || 'User'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#334155' }}>
                          {u.company_name || u.companyName || (u.role === 'superadmin' ? 'TrustDoc System' : 'Individual')}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={u.status || 'active'} />
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setViewUser(u)}
                          >
                            <Eye size={13} /> View
                          </button>
                          {u.role !== 'superadmin' && (
                            <button
                              type="button"
                              className={u.status === 'active' ? 'btn btn-danger-outline btn-sm' : 'btn btn-outline-emerald btn-sm'}
                              onClick={() => handleToggleStatus(u)}
                              disabled={updatingId === u.id}
                            >
                              {updatingId === u.id
                                ? 'Updating...'
                                : u.status === 'active'
                                ? 'Deactivate'
                                : 'Activate'}
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

      {/* User Details Modal */}
      <Modal
        isOpen={!!viewUser}
        onClose={() => setViewUser(null)}
        title="User Account Details"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setViewUser(null)}
          >
            Close
          </button>
        }
      >
        {viewUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: viewUser.role === 'superadmin' ? '#0f172a' : '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 700
                }}
              >
                {getInitials(viewUser.name)}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{viewUser.name}</h4>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={viewUser.status || 'active'} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>EMAIL</span>
                <strong>{viewUser.email}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>PHONE</span>
                <strong>{viewUser.phone || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>ROLE</span>
                <strong style={{ textTransform: 'capitalize' }}>{viewUser.role}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>ORGANIZATION</span>
                <strong>{viewUser.company_name || viewUser.companyName || 'Independent'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>MEMBER SINCE</span>
                <span>{formatDate(viewUser.created_at || viewUser.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};
