import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Building,
  Users,
  LogOut,
  UserCheck,
  FileCheck2,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    addToast('You have been logged out successfully.', 'info');
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>Super Admin</span>;
      case 'hr':
        return <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>HR Admin</span>;
      case 'employee':
        return <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>Employee</span>;
      default:
        return null;
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
    <aside className="dashboard-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/" className="brand-logo" style={{ textDecoration: 'none' }}>
          <div className="brand-icon-wrap" style={{ width: '32px', height: '32px' }}>
            <ShieldCheck size={18} />
          </div>
          <span className="brand-name" style={{ fontSize: '1.2rem' }}>
            Verify<span>Chain</span>
          </span>
        </NavLink>
      </div>

      {/* User Meta Card */}
      {user && (
        <div className="sidebar-user-card">
          <div className="user-avatar-badge">{getInitials(user.name)}</div>
          <div className="user-meta">
            <div className="user-name" title={user.name}>{user.name}</div>
            <div className="user-email" title={user.email}>{user.email}</div>
            <div style={{ marginTop: '0.35rem' }}>{getRoleBadge(user.role)}</div>
          </div>
        </div>
      )}

      {/* Navigation Links based on user.role */}
      <nav className="sidebar-nav">
        {user?.role === 'superadmin' && (
          <>
            <NavLink
              to="/superadmin/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/superadmin/approvals"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Building size={18} />
              <span>Company Approvals</span>
            </NavLink>

            <NavLink
              to="/superadmin/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>User Management</span>
            </NavLink>
          </>
        )}

        {user?.role === 'hr' && (
          <>
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
          </>
        )}

        {user?.role === 'employee' && (
          <>
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
              <span>Profile & Credentials</span>
            </NavLink>
          </>
        )}

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.75rem 0' }} />

        <NavLink to="/" className="sidebar-link">
          <Home size={18} />
          <span>Public Portal</span>
        </NavLink>
      </nav>

      {/* Footer with Logout */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
