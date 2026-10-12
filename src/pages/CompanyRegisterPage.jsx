import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { DemoBanner } from '../components/common/DemoBanner';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../components/common/Toast';
import confetti from 'canvas-confetti';
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
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import '../styles/auth.css';

export const CompanyRegisterPage = () => {
  const navigate = useNavigate();
  const { registerCompany } = useCompany();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    registrationNumber: '',
    website: '',
    hrName: '',
    hrEmail: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const validate = () => {
    const errs = {};

    // Company Information
    if (!formData.name.trim()) errs.name = 'Company name is required';
    if (!formData.email.trim()) {
      errs.email = 'Official company email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid official email address';
    }

    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.address.trim()) errs.address = 'Corporate address is required';
    if (!formData.registrationNumber.trim()) {
      errs.registrationNumber = 'Company registration/CIN number is required';
    }

    // HR Representative
    if (!formData.hrName.trim()) errs.hrName = 'HR representative name is required';
    if (!formData.hrEmail.trim()) {
      errs.hrEmail = 'HR contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.hrEmail.trim())) {
      errs.hrEmail = 'Enter a valid HR email address';
    }

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct the highlighted form errors.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerCompany(formData);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      setSuccessData(res);
      addToast('Company registration submitted successfully (Status: Pending Approval)', 'success');
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
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <DemoBanner />

          {successData ? (
            /* Post-registration Pending Gate Screen */
            <div className="login-card-box animate-fade-in" style={{ maxWidth: '640px', textAlign: 'center' }}>
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

              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem', color: '#0f172a' }}>
                Registration Submitted!
              </h2>

              <span className="badge badge-pending" style={{ fontSize: '0.9rem', padding: '0.35rem 1rem', marginBottom: '1.25rem' }}>
                Status: Pending Super Admin Approval
              </span>

              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                Thank you for registering <strong>{successData.company.name}</strong>. Your registration
                is currently under review by the Super Admin to maintain blockchain ledger integrity.
                <br /><br />
                Once the Super Admin verifies your registration documents and approves your enterprise,
                HR Admin <strong>{successData.company.hrEmail}</strong> will be granted full access to
                the HR work area.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.85rem' }}>
                <div><strong>Registration No:</strong> {successData.company.registrationNumber}</div>
                <div><strong>Official Email:</strong> {successData.company.email}</div>
                <div><strong>HR Contact:</strong> {successData.company.hrName}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-secondary">
                  Go to Login
                </Link>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/superadmin/approvals')}
                >
                  Super Admin Approvals Demo <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* Split Registration View (Wireframe 4) */
            <div className="split-auth-container animate-fade-in">
              {/* Form Column */}
              <div className="split-form-side">
                <div className="split-form-header">
                  <h2>Company Registration</h2>
                  <p>Register your company to join the verified blockchain ecosystem</p>
                </div>

                {errors.general && (
                  <div className="alert-banner alert-error">
                    <div>{errors.general}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Section 1: Company Details */}
                  <div className="form-section-divider">
                    <Building2 size={16} color="#10b981" />
                    <span>Company Details</span>
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label htmlFor="name">Company Name *</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g. Acme Corporation"
                        value={formData.name}
                        onChange={handleChange}
                      />
                      {errors.name && <div className="field-error-text">{errors.name}</div>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Official Email *</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="hr@acme.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      {errors.email && <div className="field-error-text">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="form-grid-2col">
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

                    <div className="form-group">
                      <label htmlFor="registrationNumber">Registration / CIN Number *</label>
                      <input
                        id="registrationNumber"
                        name="registrationNumber"
                        type="text"
                        className={`form-control ${errors.registrationNumber ? 'is-invalid' : ''}`}
                        placeholder="REG-10928374"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                      />
                      {errors.registrationNumber && <div className="field-error-text">{errors.registrationNumber}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Corporate Address *</label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                      placeholder="123 Business Parkway, Suite 400"
                      value={formData.address}
                      onChange={handleChange}
                    />
                    {errors.address && <div className="field-error-text">{errors.address}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="website">Website URL (Optional)</label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      className="form-control"
                      placeholder="https://company.com"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Section 2: Authorized Representative / HR Admin */}
                  <div className="form-section-divider" style={{ marginTop: '2rem' }}>
                    <User size={16} color="#10b981" />
                    <span>Authorized HR Representative Details</span>
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label htmlFor="hrName">HR Full Name *</label>
                      <input
                        id="hrName"
                        name="hrName"
                        type="text"
                        className={`form-control ${errors.hrName ? 'is-invalid' : ''}`}
                        placeholder="Enter HR name"
                        value={formData.hrName}
                        onChange={handleChange}
                      />
                      {errors.hrName && <div className="field-error-text">{errors.hrName}</div>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="hrEmail">HR Login Email *</label>
                      <input
                        id="hrEmail"
                        name="hrEmail"
                        type="email"
                        className={`form-control ${errors.hrEmail ? 'is-invalid' : ''}`}
                        placeholder="hr.admin@company.com"
                        value={formData.hrEmail}
                        onChange={handleChange}
                      />
                      {errors.hrEmail && <div className="field-error-text">{errors.hrEmail}</div>}
                    </div>
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
                          placeholder="Min 6 characters"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password"
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
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Toggle password"
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
                      {submitting ? 'Submitting Registration...' : 'Register Company'}
                    </button>
                  </div>

                  <div className="auth-footer-prompt">
                    Already registered? <Link to="/login">Login here</Link>
                  </div>
                </form>
              </div>

              {/* Visual Column (Matches Wireframe 4 right side illustration) */}
              <div className="split-visual-side">
                <div className="visual-illustration-circle">
                  <Building2 size={54} />
                </div>
                <h3>Join Our Network</h3>
                <p>
                  Register your company and become part of a trusted decentralized ecosystem for
                  verified employment documents.
                </p>

                <div style={{ marginTop: '2.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', width: '100%', textAlign: 'left', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <Clock size={16} /> Pending Verification Flow
                  </div>
                  <div style={{ color: '#cbd5e1' }}>
                    Upon submitting, your request will be queued in the Super Admin dashboard. You can test instant approval using the demo switcher!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
