import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  LogOut,
  LayoutDashboard,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'superadmin') return '/superadmin/dashboard';
    if (user.role === 'hr') return '/hr/dashboard';
    return '/employee/dashboard';
  };

  return (
    <nav className="public-navbar">
      <div className="container nav-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon-wrap">
            <ShieldCheck size={20} strokeWidth={2.4} />
          </div>
          <span className="brand-name">
            Trust<span>Doc</span>
          </span>
        </Link>

        {/* Desktop Action Buttons */}
        <div className="nav-actions">
          {/* Verify Document */}
          <Link
            to="/verify"
            className="nav-verify-link"
            title="Public Verification Portal"
          >
            <Search size={15} strokeWidth={2.2} />
            <span>Verify Document</span>
          </Link>

          <div className="nav-divider" />

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link to={getDashboardPath()} className="btn btn-primary btn-sm">
                <LayoutDashboard size={15} />
                <span>Dashboard ({user.role})</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Login */}
              <Link to="/login" className="nav-login-btn">
                <User size={15} strokeWidth={2.2} />
                <span>Login</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fade-in">
          <div className="mobile-nav-links">
            <Link to="/verify" onClick={() => setMobileMenuOpen(false)}>
              Verify Document
            </Link>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '0.4rem 0' }} />

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="btn btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Dashboard ({user?.role})
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <Link
                  to="/login"
                  className="nav-login-btn"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={15} />
                  <span>Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
