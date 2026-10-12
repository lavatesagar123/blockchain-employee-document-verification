import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useCompany } from '../../context/CompanyContext';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Search,
  UserCheck,
  Shield,
  Building,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import '../../styles/dashboard.css';

export const UserManagementPage = () => {
  const { usersList } = useCompany();
  const [activeTab, setActiveTab] = useState('all'); // all, hr, employee
  const [searchQuery, setSearchQuery] = useState('');
  const [viewUser, setViewUser] = useState(null);

  const hrCount = usersList.filter((u) => u.role === 'hr').length;
  const empCount = usersList.filter((u) => u.role === 'employee').length;

  const filteredUsers = usersList.filter((user) => {
    if (activeTab !== 'all' && user.role !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = user.name?.toLowerCase().includes(q);
      const matchEmail = user.email?.toLowerCase().includes(q);
      const matchComp = user.companyName?.toLowerCase().includes(q);
      return matchName || matchEmail || matchComp;
    }
    return true;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return <span className="badge badge-approved">Super Admin</span>;
      case 'hr':
        return <span className="badge badge-active">HR Admin</span>;
      case 'employee':
        return <span className="badge badge-role">Employee</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Supervise registered organizations, HR personnel, and employee accounts"
    >
      <div className="content-card-panel animate-fade-in">
        {/* Header Tabs & Search */}
        <div className="panel-header-row">
          <div className="panel-filter-tabs">
            <button
              className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Users ({usersList.length})
            </button>
            <button
              className={`filter-tab-btn ${activeTab === 'hr' ? 'active' : ''}`}
              onClick={() => setActiveTab('hr')}
            >
              HR Users ({hrCount})
            </button>
            <button
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

        {/* Users Table (Matches Wireframe 10) */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Affiliated Company</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    <Users size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                    <p>No users found matching your search filter.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
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
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <span style={{ color: '#334155' }}>
                        {u.companyName || (u.role === 'superadmin' ? 'VerifyChain System' : 'Individual')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.status === 'active' ? 'approved' : u.status === 'pending' ? 'pending' : 'rejected'}`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setViewUser(u)}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700
                }}
              >
                {getInitials(viewUser.name)}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{viewUser.name}</h4>
                <div style={{ marginTop: '0.25rem' }}>{getRoleBadge(viewUser.role)}</div>
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
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>ORGANIZATION</span>
                <strong>{viewUser.companyName || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>ACCOUNT STATUS</span>
                <strong>{viewUser.status}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};
