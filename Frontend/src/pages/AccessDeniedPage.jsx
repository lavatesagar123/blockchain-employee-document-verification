import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ShieldAlert, LayoutDashboard, LogOut, Home } from 'lucide-react';
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <div className="standalone-error-container" style={{ flex: 1 }}>
        <div className="error-card-box animate-fade-in">
          <div className="error-icon-shield">
            <ShieldAlert size={48} />
          </div>

          <h2>Access Restricted (403)</h2>

          <p>
            You do not have authorization to view this area. Your current role is{' '}
            <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>
              {user?.role || 'Guest'}
            </strong>
            .
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {user ? (
              <>
                <Link to={getDashboardPath()} className="btn btn-primary">
                  <LayoutDashboard size={16} /> My Portal Dashboard
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Switch Account
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Sign In
                </Link>
                <Link to="/" className="btn btn-secondary">
                  <Home size={16} /> Public Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
