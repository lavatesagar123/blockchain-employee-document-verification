import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { getInitials } from '../utils/formatters';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Building
} from 'lucide-react';

export const TopbarUserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen]);

  if (!user) return null;

  const roleLabel =
    user.role === 'superadmin'
      ? 'Platform Admin'
      : user.role === 'hr'
      ? 'HR Administrator'
      : user.role === 'employee'
      ? 'Verified Employee'
      : (user.role || 'User');

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  const getProfilePath = () => {
    if (user.role === 'hr') return '/hr/profile';
    if (user.role === 'employee') return '/employee/profile';
    return '/superadmin/users';
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    addToast('You have been logged out.', 'info');
    navigate('/login');
  };

  return (
    <div className="topbar-user-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`topbar-user-profile ${dropdownOpen ? 'active' : ''}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        title={`${displayName} (${roleLabel}) - Click for options`}
      >
        <div className="topbar-avatar" aria-label="User avatar">
          {getInitials(displayName)}
        </div>
        <div className="topbar-user-info">
          <span className="topbar-user-name">{displayName}</span>
          <span className="topbar-user-role">{roleLabel}</span>
        </div>
        <ChevronDown
          size={14}
          className={`topbar-dropdown-chevron ${dropdownOpen ? 'rotate' : ''}`}
        />
      </button>

      {dropdownOpen && (
        <div className="topbar-dropdown-menu animate-fade-in" role="menu">
          <div className="topbar-dropdown-header">
            <div className="dropdown-user-avatar">
              {getInitials(displayName)}
            </div>
            <div className="dropdown-user-meta">
              <strong className="dropdown-user-name">{displayName}</strong>
              <span className="dropdown-user-email">{user.email || 'user@trustdoc.com'}</span>
              <span className="dropdown-user-badge">
                {user.role === 'superadmin' ? (
                  <ShieldCheck size={11} />
                ) : user.role === 'hr' ? (
                  <Building size={11} />
                ) : (
                  <User size={11} />
                )}
                <span>{roleLabel}</span>
              </span>
            </div>
          </div>

          <div className="topbar-dropdown-divider" />

          <div className="topbar-dropdown-body">
            <Link
              to={getProfilePath()}
              className="topbar-dropdown-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <User size={15} />
              <span>Profile</span>
            </Link>

            <Link
              to={getProfilePath()}
              className="topbar-dropdown-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings size={15} />
              <span>Account Settings</span>
            </Link>
          </div>

          <div className="topbar-dropdown-divider" />

          <div className="topbar-dropdown-footer">
            <button
              type="button"
              className="topbar-dropdown-item logout"
              role="menuitem"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
