import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LogIn,
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
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon-wrap">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <span className="brand-name">
            Trust<span>Doc</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="nav-links">
          <li>
            <NavLink to="/" end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/verify">
              Verify Document
            </NavLink>
          </li>
          <li>
            <NavLink to="/roles">Roles</NavLink>
          </li>
          <li>
            <NavLink to="/register-company">Register Company</NavLink>
          </li>
          <li>
            <NavLink to="/register-employee">Employee Sign Up</NavLink>
          </li>
        </ul>

        {/* Desktop Action Buttons */}
        <div className="nav-actions">
          <Link
            to="/verify"
            className="btn btn-outline-emerald btn-sm desktop-only"
            title="Verify a document hash or ID"
          >
            <Search size={14} />
            <span>Verify</span>
          </Link>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                <span>Log In</span>
              </Link>
              <Link to="/roles" className="btn btn-primary btn-sm">
                <span>Get Started</span>
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
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fade-in">
          <div className="mobile-nav-links">
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/verify" onClick={() => setMobileMenuOpen(false)}>
              Verify Document
            </NavLink>
            <NavLink to="/roles" onClick={() => setMobileMenuOpen(false)}>
              Roles Overview
            </NavLink>
            <NavLink to="/register-company" onClick={() => setMobileMenuOpen(false)}>
              Register Company
            </NavLink>
            <NavLink to="/register-employee" onClick={() => setMobileMenuOpen(false)}>
              Employee Sign Up
            </NavLink>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

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
              <>
                <Link
                  to="/login"
                  className="btn btn-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/roles"
                  className="btn btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
