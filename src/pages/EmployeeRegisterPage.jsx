import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { DemoBanner } from '../components/common/DemoBanner';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../components/common/Toast';
import confetti from 'canvas-confetti';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import '../styles/auth.css';

export const EmployeeRegisterPage = () => {
  const navigate = useNavigate();
  const { registerEmployee } = useCompany();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (!formData.phone.trim()) errs.phone = 'Phone number is required';

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct form validation errors.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await registerEmployee(formData);
      confetti({ particleCount: 70, spread: 55, origin: { y: 0.6 } });
      setSuccess(true);
      addToast('Employee account created successfully! You can now log in.', 'success');
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
      setErrors((prev) => ({ ...prev, general: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Navbar />

      <main className="auth-body-container">
        <div style={{ maxWidth: '1000px', width: '100%' }}>
          <DemoBanner />

          {success ? (
            <div className="login-card-box animate-fade-in" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#d1fae5',
                  border: '2px solid #10b981',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem', color: '#0f172a' }}>
                Account Created!
              </h2>

              <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                Your employee account for <strong>{formData.email}</strong> is ready. You can now log
                in to view your verified documents, manage your profile, and share proof of employment.
              </p>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => navigate('/login?role=employee')}
              >
                Log In to Employee Portal <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="split-auth-container animate-fade-in">
              {/* Form Side */}
              <div className="split-form-side">
                <div className="split-form-header">
                  <h2>Employee Registration</h2>
                  <p>Create your account to access your blockchain-verified documents</p>
                </div>

                {errors.general && (
                  <div className="alert-banner alert-error">
                    <div>{errors.general}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && <div className="field-error-text">{errors.name}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="employee@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && <div className="field-error-text">{errors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && <div className="field-error-text">{errors.phone}</div>}
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label htmlFor="password">Password *</label>
                      <div className="input-with-icon">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          placeholder="Min 6 chars"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && <div className="field-error-text">{errors.password}</div>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password *</label>
                      <div className="input-with-icon">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          placeholder="Repeat password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <div className="field-error-text">{errors.confirmPassword}</div>}
                    </div>
                  </div>

                  <div style={{ marginTop: '1.75rem' }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={submitting}
                    >
                      {submitting ? 'Creating Account...' : 'Register'}
                    </button>
                  </div>

                  <div className="auth-footer-prompt">
                    Already have an account? <Link to="/login">Login</Link>
                  </div>
                </form>
              </div>

              {/* Visual Side (Matches Wireframe 5 right side illustration) */}
              <div className="split-visual-side">
                <div className="visual-illustration-circle">
                  <UserCheck size={54} />
                </div>
                <h3>Your Career, Your Credentials</h3>
                <p>
                  Register as an employee and access your verified documents, credentials, and employment
                  history anchored on the blockchain.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
