import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, UserPlus, Building, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
        <Link to="/" className="brand-logo">
          <div className="brand-icon-wrap">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <span className="brand-name">
            Verify<span>Chain</span>
          </span>
        </Link>

        <ul className="nav-links">
          <li>
            <NavLink to="/" end>Home</NavLink>
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

        <div className="nav-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to={getDashboardPath()} className="btn btn-primary btn-sm">
                <LayoutDashboard size={16} />
                Dashboard ({user.role})
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={16} />
                Login
              </Link>
              <Link to="/roles" className="btn btn-primary btn-sm">
                <UserPlus size={16} />
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
