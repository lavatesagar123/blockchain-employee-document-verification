import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { isValidEmail } from '../utils/validators';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Building,
  UserCheck,
  ServerOff
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';
import '../styles/auth.css';

export const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, user, authError } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkFailure, setIsNetworkFailure] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // If already authenticated, redirect to appropriate role portal
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'superadmin') navigate('/superadmin/dashboard');
      else if (user.role === 'hr') navigate('/hr/dashboard');
      else if (user.role === 'employee') navigate('/employee/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    const errs = {};
    const inputVal = formData.email.trim();
    if (!inputVal) {
      errs.email = 'User ID or email address is required';
    } else if (inputVal.includes('@') && !isValidEmail(inputVal)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) {
      setErrorMessage('');
      setIsNetworkFailure(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMessage('');
    setIsNetworkFailure(false);

    try {
      const loggedUser = await login(formData.email.trim(), formData.password);
      addToast(`Welcome back, ${loggedUser.name || 'User'}!`, 'success');

      const destination = location.state?.from?.pathname;
      if (destination && destination !== '/login') {
        navigate(destination);
      } else {
        if (loggedUser.role === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else if (loggedUser.role === 'hr') {
          navigate('/hr/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }
    } catch (err) {
      const isNet = err.isNetworkError || err.message?.toLowerCase().includes('connect');
      setIsNetworkFailure(isNet);
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your credentials.'
      );
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      addToast('Please enter a valid email address.', 'warning');
      return;
    }
    setForgotSubmitted(true);
  };

  return (
    <div className="auth-wrapper">
      <Navbar />

      <main className="auth-body-container">
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <div className="login-card-box animate-fade-in">
            <div className="login-header">
              <div className="login-badge-icon">
                <ShieldCheck size={28} />
              </div>
              <h2>Sign In to TrustDoc</h2>
              <p>Enter your credentials to access your verified portal</p>
            </div>

            {/* Error Banner */}
            {(errorMessage || authError) && (
              <div className="alert-banner alert-error animate-fade-in">
                {isNetworkFailure ? (
                  <ServerOff size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                ) : (
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                )}
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>{isNetworkFailure ? 'Authentication Service Unavailable' : 'Login Failed'}</strong>
                  <p style={{ margin: '0.2rem 0 0', lineHeight: 1.4 }}>
                    {errorMessage || authError}
                  </p>
                  {isNetworkFailure && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#991b1b' }}>
                      Configured endpoint: <code>{API_BASE_URL}/api/auth/login/</code>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* User ID / Email Input */}
              <div className="form-group">
                <label htmlFor="email">User ID or Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon-left" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="text"
                    className={`form-control input-padded ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="admin or user@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="username"
                    disabled={submitting}
                  />
                </div>
                {errors.email && <div className="field-error-text">{errors.email}</div>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="password">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(formData.email);
                      setForgotSubmitted(false);
                      setForgotModalOpen(true);
                    }}
                    className="forgot-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </label>
                <div className="input-with-icon">
                  <Lock className="input-icon-left" size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control input-padded ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="input-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div className="field-error-text">{errors.password}</div>}
              </div>

              {/* Remember Me */}
              <div className="form-options-row">
                <label className="checkbox-label" style={{ fontSize: '0.825rem' }}>
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember my session</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.62rem 1rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Quick Role Fill for Testing / Evaluation */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', textAlign: 'center', marginBottom: '0.45rem' }}>
                  Quick Portal Evaluation Access
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setFormData({ email: 'admin', password: 'password', rememberMe: true });
                      try {
                        const loggedUser = await login('admin', 'password');
                        addToast(`Logged in as Platform Admin (${loggedUser.name})`, 'success');
                        navigate('/superadmin/dashboard');
                      } catch {}
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '0.4rem 0.35rem', justifyContent: 'center' }}
                    title="Platform Admin (User ID: admin, Password: password)"
                  >
                    <ShieldCheck size={13} color="#059669" />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setFormData({ email: 'hr@trustdoc.com', password: 'password123', rememberMe: true });
                      try {
                        const loggedUser = await login('hr@trustdoc.com', 'password123');
                        addToast(`Logged in as HR Administrator (${loggedUser.name})`, 'success');
                        navigate('/hr/issue-document');
                      } catch {}
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '0.4rem 0.35rem', justifyContent: 'center' }}
                  >
                    <Building size={13} color="#059669" />
                    <span>HR Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setFormData({ email: 'sagar.lavate@email.com', password: 'password123', rememberMe: true });
                      try {
                        const loggedUser = await login('sagar.lavate@email.com', 'password123');
                        addToast(`Logged in as Employee (${loggedUser.name})`, 'success');
                        navigate('/employee/documents');
                      } catch {}
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '0.4rem 0.35rem', justifyContent: 'center' }}
                  >
                    <UserCheck size={13} color="#0284c7" />
                    <span>Employee</span>
                  </button>
                </div>

                {/* Development Notice */}
                <div
                  style={{
                    marginTop: '0.55rem',
                    padding: '0.4rem 0.6rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.69rem',
                    color: '#64748b',
                    textAlign: 'center',
                    lineHeight: 1.35
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#334155' }}>Platform Admin Credentials:</span> User ID: <code style={{ color: '#0f172a' }}>admin</code> | Password: <code style={{ color: '#0f172a' }}>password</code>
                  <div style={{ color: '#94a3b8', fontSize: '0.64rem', marginTop: '1px' }}>
                    *Development credentials. In production, configure strong passwords in the authentication service.
                  </div>
                </div>
              </div>
            </form>

            <div className="auth-footer-prompt">
              Are you an organization?{' '}
              <Link to="/register-company" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building size={14} /> Register Company
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        footer={
          forgotSubmitted ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setForgotModalOpen(false)}
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForgotModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleForgotPasswordSubmit}
              >
                Send Reset Link
              </button>
            </>
          )
        }
      >
        {forgotSubmitted ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <ShieldCheck size={26} />
            </div>
            <h4 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.4rem' }}>
              Password Reset Requested
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              If an account with <strong>{forgotEmail}</strong> exists in the database, a secure reset instruction link will be dispatched by the authentication service.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Enter the email address associated with your TrustDoc account. You will receive a secure password recovery instruction if verified.
            </p>
            <div className="form-group">
              <label htmlFor="forgot-email">Registered Email Address</label>
              <input
                id="forgot-email"
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
