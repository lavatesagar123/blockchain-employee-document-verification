import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Building,
  Users,
  LogOut,
  UserCheck,
  FileText,
  FilePlus,
  Activity,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogout = async () => {
    await logout();
    addToast('You have been logged out.', 'info');
    navigate('/login');
  };

  return (
    <aside className="dashboard-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/" className="brand-logo" style={{ textDecoration: 'none' }}>
          <div className="brand-icon-wrap" style={{ width: '32px', height: '32px' }}>
            <ShieldCheck size={18} />
          </div>
          <span className="brand-name" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
            Trust<span style={{ color: '#10b981', fontWeight: 800 }}>Doc</span>
          </span>
        </NavLink>
      </div>


      {/* Navigation Links based on user.role */}
      <nav className="sidebar-nav">
        {user?.role === 'superadmin' && (
          <>
            <div className="sidebar-section-heading">ADMINISTRATION</div>

            <NavLink
              to="/superadmin/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/superadmin/companies"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Building size={18} />
              <span>Companies & Approvals</span>
            </NavLink>

            <NavLink
              to="/superadmin/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>User Management</span>
            </NavLink>

            <NavLink
              to="/superadmin/activity-logs"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Activity size={18} />
              <span>Activity Logs</span>
            </NavLink>
          </>
        )}

        {user?.role === 'hr' && (() => {
          const isCompanyApproved = user?.companyStatus === 'approved' || user?.companyDetails?.status === 'approved';

          return (
            <>
              <div className="sidebar-section-heading">HR PORTAL</div>

              <NavLink
                to="/hr/dashboard"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>HR Dashboard</span>
              </NavLink>

              <NavLink
                to="/hr/profile"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Building size={18} />
                <span>Company Profile</span>
              </NavLink>

              {isCompanyApproved ? (
                <>
                  <NavLink
                    to="/hr/employees"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <Users size={18} />
                    <span>Employee Management</span>
                  </NavLink>

                  <NavLink
                    to="/hr/issue-document"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <FilePlus size={18} />
                    <span>Issue Document</span>
                  </NavLink>

                  <NavLink
                    to="/hr/documents"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <FileText size={18} />
                    <span>Issued Documents</span>
                  </NavLink>
                </>
              ) : (
                <div style={{ margin: '0.75rem 0.5rem 0.25rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Lock size={12} />
                    <span>Features Locked</span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.35 }}>
                    Document issuance and workforce operations unlock upon Super Admin approval.
                  </p>
                </div>
              )}
            </>
          );
        })()}

        {user?.role === 'employee' && (
          <>
            <div className="sidebar-section-heading">EMPLOYEE PORTAL</div>

            <NavLink
              to="/employee/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>My Dashboard</span>
            </NavLink>

            <NavLink
              to="/employee/profile"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <UserCheck size={18} />
              <span>My Profile</span>
            </NavLink>

            <NavLink
              to="/employee/documents"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>My Documents</span>
            </NavLink>
          </>
        )}

      </nav>

      {/* Footer with Logout */}
      <div className="sidebar-footer">
        <button type="button" onClick={handleLogout} className="sidebar-logout-btn">
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
