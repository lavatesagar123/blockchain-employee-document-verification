import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { DemoBanner } from '../components/common/DemoBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Building,
  UserCheck
} from 'lucide-react';
import '../styles/auth.css';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Pre-fill demo role if navigated via ?role=...
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'superadmin') {
      setFormData((prev) => ({ ...prev, email: 'admin@verifychain.com', password: 'Admin@123' }));
    } else if (roleParam === 'hr') {
      setFormData((prev) => ({ ...prev, email: 'hr@abctechnologies.com', password: 'Hr@123' }));
    } else if (roleParam === 'employee') {
      setFormData((prev) => ({ ...prev, email: 'employee@abctechnologies.com', password: 'Employee@123' }));
    }
  }, [searchParams]);

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
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
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
    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setAuthError('');

    try {
      const loggedUser = await login(formData.email, formData.password);
      addToast(`Welcome back, ${loggedUser.name}!`, 'success');

      // Check if user came from a protected route
      const destination = location.state?.from?.pathname;

      if (destination && destination !== '/login') {
        navigate(destination);
      } else {
        // Role-based destination
        if (loggedUser.role === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else if (loggedUser.role === 'hr') {
          navigate('/hr/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid credentials. Please verify your email and password.');
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Navbar />

      <main className="auth-body-container">
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <DemoBanner />

          <div className="login-card-box animate-fade-in">
            <div className="login-header">
              <div className="login-badge-icon">
                <ShieldCheck size={28} />
              </div>
              <h2>Welcome Back</h2>
              <p>Login to access your VerifyChain portal</p>
            </div>

            {authError && (
              <div className="alert-banner alert-error">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{authError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon-left" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control input-padded ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Enter your registered email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <div className="field-error-text">{errors.email}</div>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="password">
                  <span>Password</span>
                  <Link to="/login" onClick={(e) => { e.preventDefault(); alert('Demo password reminder: Super Admin is Admin@123, HR is Hr@123, Employee is Employee@123'); }} className="forgot-link" style={{ fontSize: '0.8rem' }}>
                    Forgot password?
                  </Link>
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
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer-prompt">
              Don't have an account?{' '}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <Link to="/register-company" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building size={14} /> Register Company
                </Link>
                <span>•</span>
                <Link to="/register-employee" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <UserCheck size={14} /> Employee Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
