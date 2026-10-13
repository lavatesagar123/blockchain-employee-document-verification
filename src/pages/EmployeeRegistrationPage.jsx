import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { employeeService } from '../services/employeeService';
import { useToast } from '../components/Toast';
import { FormField } from '../components/FormField';
import {
  isValidEmail,
  isValidPhone,
  isValidPassword
} from '../utils/validators';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Building
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';
import '../styles/auth.css';

export const EmployeeRegistrationPage = () => {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isNetworkFailure, setIsNetworkFailure] = useState(false);
  const [successResponse, setSuccessResponse] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full legal name is required';

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (formData.phone && !isValidPhone(formData.phone.trim())) {
      errs.phone = 'Enter a valid phone number (at least 7 digits)';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (!isValidPassword(formData.password)) {
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
    if (apiError) {
      setApiError(null);
      setIsNetworkFailure(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct form validation errors.', 'warning');
      return;
    }

    setSubmitting(true);
    setApiError(null);
    setIsNetworkFailure(false);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim() || 'Professional',
        company_name: formData.companyName.trim(),
        password: formData.password
      };

      const response = await employeeService.registerEmployee(payload);
      setSuccessResponse(response);
      addToast('Employee registration successful! You can now log in.', 'success');
    } catch (err) {
      const isNet = err.isNetworkError || err.message?.toLowerCase().includes('connect');
      setIsNetworkFailure(isNet);
      setApiError(err.message || 'Registration request failed.');
      addToast(err.message || 'Registration failed', 'error');

      if (err.data && typeof err.data === 'object') {
        const backendFieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          backendFieldErrors[key] = Array.isArray(val) ? val.join(' ') : String(val);
        }
        setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Navbar />

      <main className="auth-body-container">
        <div style={{ maxWidth: '540px', width: '100%' }}>
          {successResponse ? (
            <div className="login-card-box animate-fade-in" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#d1fae5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h2>Account Created!</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your employee credentials have been registered with the authentication system.
                You can now log in to view your verified documents.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'left', marginBottom: '1.75rem', fontSize: '0.85rem' }}>
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                {formData.companyName && <div><strong>Affiliation:</strong> {formData.companyName}</div>}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                  Log In Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="login-card-box animate-fade-in">
              <div className="login-header">
                <div className="login-badge-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <UserCheck size={28} />
                </div>
                <h2>Employee Registration</h2>
                <p>Create your personal profile to manage verified credentials</p>
              </div>

              {apiError && (
                <div className="alert-banner alert-error animate-fade-in">
                  {isNetworkFailure ? (
                    <WifiOff size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  ) : (
                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  )}
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{isNetworkFailure ? 'Backend API Unreachable' : 'Registration Error'}</strong>
                    <p style={{ margin: '0.2rem 0 0', lineHeight: 1.4 }}>{apiError}</p>
                    {isNetworkFailure && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#991b1b' }}>
                        Endpoint: <code>{API_BASE_URL}/api/employees/register/</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <FormField
                  label="Full Legal Name"
                  name="name"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  icon={User}
                  required
                  disabled={submitting}
                />

                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="jane.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  icon={Mail}
                  required
                  disabled={submitting}
                />

                <div className="form-grid-2col">
                  <FormField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    icon={Phone}
                    disabled={submitting}
                  />

                  <FormField
                    label="Current Role / Designation"
                    name="designation"
                    placeholder="e.g. Senior Engineer"
                    value={formData.designation}
                    onChange={handleChange}
                    error={errors.designation}
                    icon={Briefcase}
                    disabled={submitting}
                  />
                </div>

                <FormField
                  label="Company Name"
                  name="companyName"
                  placeholder="Current or prospective organization (optional)"
                  value={formData.companyName}
                  onChange={handleChange}
                  error={errors.companyName}
                  icon={Building}
                  disabled={submitting}
                />

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label htmlFor="password">
                      <span>Password</span>
                      <span className="required-asterisk">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Lock className="input-icon-left" size={18} />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control input-padded ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Min. 6 chars"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        className="input-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <div className="field-error-text">{errors.password}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      <span>Confirm</span>
                      <span className="required-asterisk">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Lock className="input-icon-left" size={18} />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`form-control input-padded ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Re-enter"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        className="input-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle password"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="field-error-text">{errors.confirmPassword}</div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '1.5rem' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span>Submitting to API...</span>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="auth-footer-prompt">
                Already have an account? <Link to="/login">Sign in here</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
