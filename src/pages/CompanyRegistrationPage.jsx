import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { companyService } from '../services/companyService';
import { useToast } from '../components/Toast';
import { FormField } from '../components/FormField';
import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidRegistrationNumber,
  isValidUrl
} from '../utils/validators';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  User,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Briefcase,
  AlertCircle,
  WifiOff,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';
import '../styles/auth.css';

export const CompanyRegistrationPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    // Company information
    name: '',
    email: '',
    phone: '',
    address: '',
    registrationNumber: '',
    website: '',

    // Authorized HR administrator
    hrName: '',
    hrEmail: '',
    hrDesignation: '',
    hrPhone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isNetworkFailure, setIsNetworkFailure] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState(null);

  const validate = () => {
    const errs = {};

    // Company Information
    if (!formData.name.trim()) errs.name = 'Company name is required';
    if (!formData.email.trim()) {
      errs.email = 'Official company email is required';
    } else if (!isValidEmail(formData.email.trim())) {
      errs.email = 'Enter a valid official email address';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone.trim())) {
      errs.phone = 'Enter a valid phone number (at least 7 digits)';
    }

    if (!formData.address.trim()) errs.address = 'Registered address is required';

    if (!formData.registrationNumber.trim()) {
      errs.registrationNumber = 'Company registration number / CIN is required';
    } else if (!isValidRegistrationNumber(formData.registrationNumber.trim())) {
      errs.registrationNumber = 'Registration number must be at least 4 characters';
    }

    if (formData.website && !isValidUrl(formData.website.trim())) {
      errs.website = 'Enter a valid website URL (e.g. acme.com)';
    }

    // HR Administrator
    if (!formData.hrName.trim()) errs.hrName = 'HR Administrator name is required';

    if (!formData.hrEmail.trim()) {
      errs.hrEmail = 'HR work email is required';
    } else if (!isValidEmail(formData.hrEmail.trim())) {
      errs.hrEmail = 'Enter a valid work email address';
    }

    if (!formData.hrDesignation.trim()) {
      errs.hrDesignation = 'HR designation/title is required';
    }

    if (formData.hrPhone && !isValidPhone(formData.hrPhone.trim())) {
      errs.hrPhone = 'Enter a valid phone number';
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
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Convenience auto-populate HR email from company email if empty
      if (name === 'email' && !prev.hrEmail) {
        updated.hrEmail = value;
      }
      return updated;
    });

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
      addToast('Please correct the highlighted validation errors.', 'warning');
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
        address: formData.address.trim(),
        registration_number: formData.registrationNumber.trim(),
        website: formData.website ? formData.website.trim() : '',
        hr_name: formData.hrName.trim(),
        hr_email: formData.hrEmail.trim(),
        hr_designation: formData.hrDesignation.trim(),
        hr_phone: formData.hrPhone ? formData.hrPhone.trim() : formData.phone.trim(),
        password: formData.password
      };

      const response = await companyService.registerCompany(payload);
      setSubmittedResponse(response);
      addToast(
        'Company registration submitted. Status is pending Super Admin review.',
        'success'
      );
    } catch (err) {
      const isNet = err.isNetworkError || err.message?.toLowerCase().includes('connect');
      setIsNetworkFailure(isNet);
      setApiError(err.message || 'Registration request failed.');
      addToast(err.message || 'Registration failed', 'error');

      // Map field errors if returned by backend
      if (err.data && typeof err.data === 'object') {
        const backendFieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          const msg = Array.isArray(val) ? val.join(' ') : String(val);
          if (key === 'registration_number') backendFieldErrors.registrationNumber = msg;
          else if (key === 'hr_email') backendFieldErrors.hrEmail = msg;
          else if (key === 'hr_name') backendFieldErrors.hrName = msg;
          else backendFieldErrors[key] = msg;
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
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          {submittedResponse ? (
            /* Post-registration Screen showing real response */
            <div className="login-card-box animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '2px solid #f59e0b',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}
              >
                <Clock size={32} />
              </div>

              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                Registration Submitted
              </h2>

              <div style={{ marginBottom: '1.25rem' }}>
                <span className="badge badge-pending" style={{ fontSize: '0.875rem', padding: '0.35rem 0.9rem' }}>
                  Status: {submittedResponse?.status || 'Pending Super Admin Review'}
                </span>
              </div>

              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                Thank you for submitting registration for <strong>{formData.name}</strong>.
                To maintain the integrity of the blockchain document verification ledger, your
                incorporation credentials must be audited and verified by the Super Admin before
                documents can be issued.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.875rem' }}>
                <div><strong>Company:</strong> {formData.name}</div>
                <div><strong>Registration No:</strong> {formData.registrationNumber}</div>
                <div><strong>Official Email:</strong> {formData.email}</div>
                <div><strong>HR Administrator:</strong> {formData.hrName} ({formData.hrEmail})</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-primary">
                  Proceed to Login
                </Link>
                <Link to="/" className="btn btn-secondary">
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="split-auth-container animate-fade-in">
              <div className="split-form-side">
                <div className="split-form-header">
                  <h2>Register Organization</h2>
                  <p>Join the TrustDoc blockchain verification network as an authorized issuer</p>
                </div>

                {apiError && (
                  <div className="alert-banner alert-error animate-fade-in">
                    {isNetworkFailure ? (
                      <WifiOff size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                    ) : (
                      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                    )}
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>{isNetworkFailure ? 'Backend API Unreachable' : 'Submission Error'}</strong>
                      <p style={{ margin: '0.2rem 0 0', lineHeight: 1.4 }}>{apiError}</p>
                      {isNetworkFailure && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#991b1b' }}>
                          Target: <code>{API_BASE_URL}/api/companies/register/</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Section 1: Company Information */}
                  <div className="form-section-divider">
                    <Building2 size={16} color="#10b981" />
                    <span>Company Information</span>
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Company Name"
                      name="name"
                      placeholder="e.g. Acme Technologies Inc."
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Official Email"
                      name="email"
                      type="email"
                      placeholder="contact@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Registration Number / CIN"
                      name="registrationNumber"
                      placeholder="e.g. U72200MH2021PTC123456"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      error={errors.registrationNumber}
                      helperText="Official corporate registration or tax identifier"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Corporate Website"
                      name="website"
                      type="url"
                      placeholder="https://company.com (optional)"
                      value={formData.website}
                      onChange={handleChange}
                      error={errors.website}
                      disabled={submitting}
                    />

                    <FormField
                      label="Registered Office Address"
                      name="address"
                      placeholder="Building, Street, City, State, ZIP"
                      value={formData.address}
                      onChange={handleChange}
                      error={errors.address}
                      required
                      disabled={submitting}
                    />
                  </div>

                  {/* Section 2: Authorized HR Administrator */}
                  <div className="form-section-divider" style={{ marginTop: '1.75rem' }}>
                    <User size={16} color="#10b981" />
                    <span>Authorized HR Administrator</span>
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="HR Administrator Full Name"
                      name="hrName"
                      placeholder="Full legal name"
                      value={formData.hrName}
                      onChange={handleChange}
                      error={errors.hrName}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="HR Work Email"
                      name="hrEmail"
                      type="email"
                      placeholder="hr@company.com"
                      value={formData.hrEmail}
                      onChange={handleChange}
                      error={errors.hrEmail}
                      helperText="Used for portal authentication"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Designation / Title"
                      name="hrDesignation"
                      placeholder="e.g. Head of People / HR Director"
                      value={formData.hrDesignation}
                      onChange={handleChange}
                      error={errors.hrDesignation}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Direct Contact Phone"
                      name="hrPhone"
                      type="tel"
                      placeholder="Direct phone number (optional)"
                      value={formData.hrPhone}
                      onChange={handleChange}
                      error={errors.hrPhone}
                      disabled={submitting}
                    />
                  </div>

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
                          placeholder="Min. 6 characters"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="new-password"
                          disabled={submitting}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password view"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && <div className="field-error-text">{errors.password}</div>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        <span>Confirm Password</span>
                        <span className="required-asterisk">*</span>
                      </label>
                      <div className="input-with-icon">
                        <Lock className="input-icon-left" size={18} />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`form-control input-padded ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          autoComplete="new-password"
                          disabled={submitting}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Toggle password view"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <div className="field-error-text">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span>Submitting to API...</span>
                      ) : (
                        <>
                          <Building2 size={18} />
                          <span>Submit Company for Audit</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="auth-footer-prompt" style={{ marginTop: '1.5rem' }}>
                  Already registered? <Link to="/login">Sign in here</Link>
                </div>
              </div>

              {/* Side Information Panel */}
              <div className="split-info-side">
                <div className="info-side-content">
                  <div className="info-badge">
                    <ShieldCheck size={16} />
                    <span>Proof of Authority Trust Network</span>
                  </div>

                  <h3>Why register your organization?</h3>
                  <p>
                    TrustDoc eliminates fraudulent credential claims while protecting genuine
                    organizations. All enterprise registrants undergo Super Admin auditing.
                  </p>

                  <ul className="info-feature-list">
                    <li>
                      <strong>Cryptographic Anchoring:</strong> Every issued document receives a SHA-256
                      fingerprint anchored to our distributed ledger.
                    </li>
                    <li>
                      <strong>Instant Background Verification:</strong> Prospective employers verify credentials
                      in seconds without manual HR inquiry backlogs.
                    </li>
                    <li>
                      <strong>Zero Paperwork Delay:</strong> Issue verifiable offer letters, LOIs, and
                      experience certificates from a single interface.
                    </li>
                    <li>
                      <strong>Audit Trail Compliance:</strong> Complete tamper detection and revocability
                      controls with full audit trails.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
