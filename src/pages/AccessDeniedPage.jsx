import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

export const AccessDeniedPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'superadmin') return '/superadmin/dashboard';
    if (user.role === 'hr') return '/hr/dashboard';
    return '/employee/dashboard';
  };

  return (
    <div className="standalone-error-container">
      <div className="error-card-box animate-fade-in">
        <div className="error-icon-shield">
          <ShieldAlert size={48} />
        </div>

        <h2>Access Denied</h2>

        <p>
          You do not have administrative permission to view this role-specific area. Your current role is{' '}
          <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>
            {user?.role || 'Guest'}
          </strong>
          .
        </p>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {user ? (
            <>
              <Link to={getDashboardPath()} className="btn btn-primary">
                <LayoutDashboard size={16} /> Go to My Dashboard
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut size={16} /> Switch Account
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Log In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
