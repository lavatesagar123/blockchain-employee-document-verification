import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { companyService } from '../services/companyService';
import { useToast } from '../components/Toast';
import { FormField } from '../components/FormField';
import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidRegistrationNumber,
  isValidUrl,
  getPasswordStrength
} from '../utils/validators';
import {
  Building2,
  MapPin,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Eye,
  EyeOff,
  User,
  UserCheck,
  ShieldCheck,
  X,
  Copy,
  Printer,
  ArrowRight,
  WifiOff,
  Layers
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';
import '../styles/auth.css';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

const INDUSTRY_OPTIONS = [
  { value: 'Technology & Software', label: 'Technology & Software Development' },
  { value: 'Banking & Financial Services', label: 'Banking & Financial Services' },
  { value: 'Healthcare & Life Sciences', label: 'Healthcare & Life Sciences' },
  { value: 'Manufacturing & Engineering', label: 'Manufacturing & Engineering' },
  { value: 'Consulting & Professional Services', label: 'Consulting & Professional Services' },
  { value: 'Education & EdTech', label: 'Education & EdTech' },
  { value: 'Retail & E-commerce', label: 'Retail & E-commerce' },
  { value: 'Telecommunications', label: 'Telecommunications & Media' },
  { value: 'Other', label: 'Other Enterprise Sector' }
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1 - 10 Employees (Seed / Early)' },
  { value: '11-50', label: '11 - 50 Employees (Small Business)' },
  { value: '51-200', label: '51 - 200 Employees (Mid-size)' },
  { value: '201-1000', label: '201 - 1,000 Employees (Growth Enterprise)' },
  { value: '1000+', label: '1,000+ Employees (Corporation)' }
];

const COUNTRY_OPTIONS = [
  { value: 'India', label: 'India' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Germany', label: 'Germany' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'Other', label: 'Other International' }
];

export const CompanyRegistrationPage = () => {
  const { addToast } = useToast();

  // Form Fields State
  const [formData, setFormData] = useState({
    // Section 1: Company Information
    name: '',
    registrationNumber: '',
    email: '',
    phone: '',
    website: '',
    industry: 'Technology & Software',
    companySize: '51-200',

    // Section 2: Registered Address
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',

    // Section 3: HR Administrator Details
    hrName: '',
    hrEmail: '',
    hrDesignation: '',
    hrPhone: '',
    password: '',
    confirmPassword: '',

    // Section 5: Terms Acceptance
    termsAccepted: false,
    declarationAccepted: false
  });

  // Section 4: Verification Document Files
  const [documents, setDocuments] = useState({
    incorporationDoc: null,
    taxIdDoc: null,
    addressProofDoc: null,
    hrAuthDoc: null
  });

  // Drag over tracking
  const [dragActiveField, setDragActiveField] = useState(null);

  // Hidden file input refs
  const incorporationDocRef = useRef(null);
  const taxIdDocRef = useRef(null);
  const addressProofDocRef = useRef(null);
  const hrAuthDocRef = useRef(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isNetworkFailure, setIsNetworkFailure] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Modals state
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Password strength calculation
  const passwordStrength = getPasswordStrength(formData.password);

  // Field change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
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

  // Helper format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Document file selection & validation handler
  const handleFileChange = (field, file) => {
    if (!file) return;

    // Check mime type
    const isAllowedType =
      ALLOWED_MIME_TYPES.includes(file.type) ||
      /\.(pdf|png|jpe?g)$/i.test(file.name);

    if (!isAllowedType) {
      setErrors((prev) => ({
        ...prev,
        [field]: 'Invalid file type. Please upload a PDF, PNG, or JPG document.'
      }));
      addToast('Only PDF, PNG, and JPG formats are accepted.', 'warning');
      return;
    }

    // Check size limit (5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        [field]: `File exceeds maximum size limit of 5 MB (${formatFileSize(file.size)}).`
      }));
      addToast('File exceeds 5MB size limit.', 'warning');
      return;
    }

    setDocuments((prev) => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    addToast(`${file.name} attached successfully`, 'info');
  };

  const handleRemoveFile = (field, e) => {
    if (e) e.stopPropagation();
    setDocuments((prev) => ({ ...prev, [field]: null }));
    const refMap = {
      incorporationDoc: incorporationDocRef,
      taxIdDoc: taxIdDocRef,
      addressProofDoc: addressProofDocRef,
      hrAuthDoc: hrAuthDocRef
    };
    const inputEl = refMap[field]?.current;
    if (inputEl) {
      inputEl.value = '';
    }
  };

  // Drag and drop events
  const handleDragOver = (field, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(field);
  };

  const handleDragLeave = (field, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragActiveField === field) {
      setDragActiveField(null);
    }
  };

  const handleDrop = (field, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(field, e.dataTransfer.files[0]);
    }
  };

  // Comprehensive Client-Side Validation
  const validate = () => {
    const errs = {};

    // 1. Company Information
    if (!formData.name.trim()) {
      errs.name = 'Legal company name is required';
    }

    if (!formData.registrationNumber.trim()) {
      errs.registrationNumber = 'Corporate registration number / CIN is required';
    } else if (!isValidRegistrationNumber(formData.registrationNumber.trim())) {
      errs.registrationNumber = 'Registration number must be at least 4 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Official corporate email is required';
    } else if (!isValidEmail(formData.email.trim())) {
      errs.email = 'Enter a valid corporate email address';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Corporate phone number is required';
    } else if (!isValidPhone(formData.phone.trim())) {
      errs.phone = 'Enter a valid phone number (at least 7 digits)';
    }

    if (formData.website && !isValidUrl(formData.website.trim())) {
      errs.website = 'Enter a valid website URL (e.g. https://company.com)';
    }

    if (!formData.industry) {
      errs.industry = 'Please select an industry sector';
    }

    // 2. Registered Address
    if (!formData.streetAddress.trim()) {
      errs.streetAddress = 'Street address / premises is required';
    }

    if (!formData.city.trim()) {
      errs.city = 'City / Town is required';
    }

    if (!formData.state.trim()) {
      errs.state = 'State / Province is required';
    }

    if (!formData.postalCode.trim()) {
      errs.postalCode = 'PIN / Postal Code is required';
    } else if (formData.postalCode.trim().length < 3) {
      errs.postalCode = 'Enter a valid postal / PIN code';
    }

    if (!formData.country.trim()) {
      errs.country = 'Country is required';
    }

    // 3. HR Administrator Details
    if (!formData.hrName.trim()) {
      errs.hrName = 'HR Administrator full legal name is required';
    }

    if (!formData.hrEmail.trim()) {
      errs.hrEmail = 'HR work email is required';
    } else if (!isValidEmail(formData.hrEmail.trim())) {
      errs.hrEmail = 'Enter a valid HR email address';
    }

    if (!formData.hrDesignation.trim()) {
      errs.hrDesignation = 'Designation / job title is required';
    }

    if (formData.hrPhone && !isValidPhone(formData.hrPhone.trim())) {
      errs.hrPhone = 'Enter a valid direct phone number';
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

    // 4. Verification Document Uploads (Required docs)
    if (!documents.incorporationDoc) {
      errs.incorporationDoc = 'Certificate of Incorporation is required for audit verification';
    }

    if (!documents.taxIdDoc) {
      errs.taxIdDoc = 'Corporate Tax Identification (PAN / GSTIN / EIN) is required';
    }

    // 5. Terms Acceptance
    if (!formData.termsAccepted) {
      errs.termsAccepted = 'You must agree to the Terms of Service and Privacy Policy';
    }

    if (!formData.declarationAccepted) {
      errs.declarationAccepted = 'You must certify the authenticity of the submitted details';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      addToast('Please complete all required fields and document uploads.', 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setApiError(null);
    setIsNetworkFailure(false);

    try {
      // Build standard multipart FormData for real backend transmission
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('registration_number', formData.registrationNumber.trim());
      payload.append('email', formData.email.trim());
      payload.append('phone', formData.phone.trim());
      payload.append('website', (formData.website || '').trim());
      payload.append('industry', formData.industry);
      payload.append('company_size', formData.companySize);

      // Address fields
      payload.append('street_address', formData.streetAddress.trim());
      payload.append('city', formData.city.trim());
      payload.append('state', formData.state.trim());
      payload.append('postal_code', formData.postalCode.trim());
      payload.append('country', formData.country.trim());
      payload.append(
        'address',
        `${formData.streetAddress.trim()}, ${formData.city.trim()}, ${formData.state.trim()} - ${formData.postalCode.trim()}, ${formData.country.trim()}`
      );

      // HR Administrator details
      payload.append('hr_name', formData.hrName.trim());
      payload.append('hr_email', formData.hrEmail.trim());
      payload.append('hr_designation', formData.hrDesignation.trim());
      payload.append(
        'hr_phone',
        (formData.hrPhone || formData.phone).trim()
      );
      payload.append('password', formData.password);

      // Document uploads
      if (documents.incorporationDoc) {
        payload.append('certificate_of_incorporation', documents.incorporationDoc);
      }
      if (documents.taxIdDoc) {
        payload.append('tax_id_document', documents.taxIdDoc);
      }
      if (documents.addressProofDoc) {
        payload.append('address_proof', documents.addressProofDoc);
      }
      if (documents.hrAuthDoc) {
        payload.append('hr_authorization_letter', documents.hrAuthDoc);
      }

      // Terms
      payload.append('terms_accepted', 'true');
      payload.append('declaration_accepted', 'true');

      const response = await companyService.registerCompany(payload);
      setSubmittedResponse(response);
      addToast(
        'Company registration submitted. Status is pending Super Admin review.',
        'success'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const isNet = err.isNetworkError || err.message?.toLowerCase().includes('connect');
      setIsNetworkFailure(isNet);
      setApiError(err.message || 'Registration request failed.');
      addToast(err.message || 'Registration failed', 'error');

      // Map backend validation error responses if returned
      if (err.data && typeof err.data === 'object') {
        const backendFieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          const msg = Array.isArray(val) ? val.join(' ') : String(val);
          if (key === 'registration_number') backendFieldErrors.registrationNumber = msg;
          else if (key === 'hr_email') backendFieldErrors.hrEmail = msg;
          else if (key === 'hr_name') backendFieldErrors.hrName = msg;
          else if (key === 'hr_designation') backendFieldErrors.hrDesignation = msg;
          else backendFieldErrors[key] = msg;
        }
        setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Re-check status handler on post-submission screen
  const handleCheckStatus = async () => {
    if (!submittedResponse) return;
    setCheckingStatus(true);
    try {
      const queryKey =
        submittedResponse.reference_id ||
        submittedResponse.id ||
        formData.registrationNumber;
      const res = await companyService.getRegistrationStatus(queryKey);
      if (res) {
        setSubmittedResponse((prev) => ({
          ...prev,
          ...res,
          status: res.status || prev.status
        }));
        if (res.status === 'approved') {
          addToast('Congratulations! Your company is approved. You can now login.', 'success');
        } else {
          addToast(`Current application status: ${res.status || 'Pending Approval'}`, 'info');
        }
      }
    } catch (err) {
      addToast(err.message || 'Unable to refresh status from server.', 'error');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCopyReference = () => {
    const ref =
      submittedResponse?.reference_id ||
      submittedResponse?.referenceNumber ||
      `TD-REG-${new Date().getFullYear()}-001`;
    navigator.clipboard?.writeText(ref);
    addToast('Reference ID copied to clipboard!', 'info');
  };

  return (
    <div className="auth-wrapper">
      <Navbar />

      <main className="auth-body-container">
        <div className="company-reg-container animate-fade-in">
          {submittedResponse ? (
            /* =================================================================
               POST-SUBMISSION SCREEN: PENDING SUPER ADMIN APPROVAL STATUS
               ================================================================= */
            <div className="pending-screen-wrapper">
              <div className="pending-screen-card">
                {/* Header with Pulsing Clock Badge */}
                <div className="pending-screen-header">
                  <div className="pending-pulse-badge">
                    <Clock size={38} strokeWidth={2.4} />
                  </div>

                  <h1 style={{ fontSize: '1.85rem', color: '#0f172a', fontWeight: 800, marginBottom: '0.4rem' }}>
                    Registration Submitted
                  </h1>
                  <p style={{ color: '#475569', fontSize: '0.98rem', maxWidth: '600px', margin: '0 auto' }}>
                    Your organization registration application has been received and entered into the
                    verification ledger queue.
                  </p>

                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-pending" style={{ fontSize: '0.88rem', padding: '0.4rem 1rem', fontWeight: 700 }}>
                      Status: {submittedResponse.status ? submittedResponse.status.toUpperCase() : 'PENDING SUPER ADMIN AUDIT'}
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyReference}
                      className="pending-reference-chip"
                      title="Click to copy tracking reference"
                    >
                      <Copy size={13} />
                      <span>
                        Ref: {submittedResponse.reference_id || submittedResponse.referenceNumber || submittedResponse.id}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 4-Step Audit Progression Timeline */}
                <div className="audit-timeline-grid">
                  <div className="audit-timeline-step completed">
                    <div className="audit-step-icon">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="audit-step-title">1. Submitted</div>
                    <div className="audit-step-sub">Application Received</div>
                  </div>

                  <div className="audit-timeline-step in-progress">
                    <div className="audit-step-icon">
                      <Clock size={18} className="animate-spin" />
                    </div>
                    <div className="audit-step-title">2. Legal Audit</div>
                    <div className="audit-step-sub">Admin Reviewing CIN</div>
                  </div>

                  <div className="audit-timeline-step locked">
                    <div className="audit-step-icon">
                      <Layers size={18} />
                    </div>
                    <div className="audit-step-title">3. Identity Mint</div>
                    <div className="audit-step-sub">Blockchain Anchoring</div>
                  </div>

                  <div className="audit-timeline-step locked">
                    <div className="audit-step-icon">
                      <UserCheck size={18} />
                    </div>
                    <div className="audit-step-title">4. HR Portal</div>
                    <div className="audit-step-sub">Full Access Unlocked</div>
                  </div>
                </div>

                {/* Strict Access Rule Callout */}
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem'
                  }}
                >
                  <ShieldCheck size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.86rem', color: '#92400e', lineHeight: 1.5 }}>
                    <strong>Access Restriction Notice:</strong> To uphold the cryptographic authenticity of the
                    TrustDoc verification network, HR dashboard features (issuing tamper-proof offer letters,
                    experience certificates, and employee credential management) remain strictly locked until the
                    Super Admin audits and approves your corporate legal identity.
                  </div>
                </div>

                {/* Application Information Summary */}
                <div className="summary-data-table">
                  <div className="summary-data-row">
                    <span className="summary-data-label">Company Name:</span>
                    <span className="summary-data-value">
                      <strong>{formData.name}</strong>
                    </span>
                  </div>

                  <div className="summary-data-row">
                    <span className="summary-data-label">Registration / CIN:</span>
                    <span className="summary-data-value font-mono">
                      {formData.registrationNumber}
                    </span>
                  </div>

                  <div className="summary-data-row">
                    <span className="summary-data-label">Official Email:</span>
                    <span className="summary-data-value">{formData.email}</span>
                  </div>

                  <div className="summary-data-row">
                    <span className="summary-data-label">Registered Address:</span>
                    <span className="summary-data-value">
                      {formData.streetAddress}, {formData.city}, {formData.state} - {formData.postalCode}, {formData.country}
                    </span>
                  </div>

                  <div className="summary-data-row">
                    <span className="summary-data-label">Authorized HR Admin:</span>
                    <span className="summary-data-value">
                      {formData.hrName} ({formData.hrDesignation}) — {formData.hrEmail}
                    </span>
                  </div>

                  <div className="summary-data-row">
                    <span className="summary-data-label">Uploaded Documents:</span>
                    <span className="summary-data-value" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {documents.incorporationDoc && (
                        <span className="badge badge-approved" style={{ fontSize: '0.74rem' }}>
                          <FileCheck size={12} /> {documents.incorporationDoc.name}
                        </span>
                      )}
                      {documents.taxIdDoc && (
                        <span className="badge badge-approved" style={{ fontSize: '0.74rem' }}>
                          <FileCheck size={12} /> {documents.taxIdDoc.name}
                        </span>
                      )}
                      {documents.addressProofDoc && (
                        <span className="badge badge-approved" style={{ fontSize: '0.74rem' }}>
                          <FileCheck size={12} /> {documents.addressProofDoc.name}
                        </span>
                      )}
                      {documents.hrAuthDoc && (
                        <span className="badge badge-approved" style={{ fontSize: '0.74rem' }}>
                          <FileCheck size={12} /> {documents.hrAuthDoc.name}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="summary-data-row">
                    <span className="summary-data-label">Submission Date:</span>
                    <span className="summary-data-value">
                      {submittedResponse.submitted_at
                        ? new Date(submittedResponse.submitted_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    className="btn btn-outline-emerald"
                    disabled={checkingStatus}
                  >
                    <Clock size={16} className={checkingStatus ? 'animate-spin' : ''} />
                    <span>{checkingStatus ? 'Checking Server...' : 'Check Approval Status'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptModalOpen(true)}
                    className="btn btn-secondary"
                  >
                    <Printer size={16} />
                    <span>View Receipt</span>
                  </button>

                  <Link to="/login" className="btn btn-primary">
                    <span>Proceed to Sign In</span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link to="/" className="btn btn-secondary">
                    <span>Return to Home</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* =================================================================
               REGISTRATION FORM (ALL 5 SECTIONS + UPLOADS + VALIDATION)
               ================================================================= */
            <div className="company-reg-card">
              <div className="company-reg-header">
                <div className="login-badge-icon" style={{ marginBottom: '0.75rem' }}>
                  <Building2 size={24} />
                </div>
                <h1>Register Organization</h1>
                <p>
                  Join the TrustDoc blockchain verification network as an authorized issuing organization.
                  All submissions are audited by the Super Admin to preserve tamper-proof trust.
                </p>
              </div>

              {/* API Error / Network Alert Banner */}
              {apiError && (
                <div className="alert-banner alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                  {isNetworkFailure ? (
                    <WifiOff size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  ) : (
                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  )}
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{isNetworkFailure ? 'Backend API Offline / Connection Notice' : 'Submission Error'}</strong>
                    <p style={{ margin: '0.2rem 0 0', lineHeight: 1.4 }}>{apiError}</p>
                    {isNetworkFailure && (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#991b1b' }}>
                        API Endpoint: <code>{API_BASE_URL}/api/companies/register/</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* -------------------------------------------------------------
                    SECTION 1: COMPANY INFORMATION
                    ------------------------------------------------------------- */}
                <div className="form-section-card">
                  <div className="form-section-title-row">
                    <div className="form-section-icon">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="form-section-title">Company Information</h3>
                      <p className="form-section-subtitle">
                        Primary legal entity details as registered with government authorities
                      </p>
                    </div>
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Company Legal Name"
                      name="name"
                      placeholder="e.g. Acme Technologies Inc."
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Corporate Registration / CIN / Tax ID"
                      name="registrationNumber"
                      placeholder="e.g. U72200MH2021PTC123456"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      error={errors.registrationNumber}
                      helperText="Official CIN, EIN, or government registration number"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Official Corporate Email"
                      name="email"
                      type="email"
                      placeholder="contact@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      helperText="Domain should match company domain"
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Corporate Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210 or +1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-3col">
                    <FormField
                      label="Corporate Website"
                      name="website"
                      type="url"
                      placeholder="https://company.com"
                      value={formData.website}
                      onChange={handleChange}
                      error={errors.website}
                      disabled={submitting}
                    />

                    <FormField
                      label="Industry Sector"
                      name="industry"
                      type="select"
                      value={formData.industry}
                      onChange={handleChange}
                      options={INDUSTRY_OPTIONS}
                      error={errors.industry}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Organization Size"
                      name="companySize"
                      type="select"
                      value={formData.companySize}
                      onChange={handleChange}
                      options={COMPANY_SIZE_OPTIONS}
                      error={errors.companySize}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    SECTION 2: REGISTERED OFFICE ADDRESS
                    ------------------------------------------------------------- */}
                <div className="form-section-card">
                  <div className="form-section-title-row">
                    <div className="form-section-icon">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h3 className="form-section-title">Registered Office Address</h3>
                      <p className="form-section-subtitle">
                        Official registered location for corporate verification records
                      </p>
                    </div>
                  </div>

                  <FormField
                    label="Premises / Street Address"
                    name="streetAddress"
                    placeholder="Building name, Floor, Suite number, Street"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    error={errors.streetAddress}
                    required
                    disabled={submitting}
                  />

                  <div className="form-grid-2col">
                    <FormField
                      label="City / Town"
                      name="city"
                      placeholder="e.g. Pune"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="State / Province / Region"
                      name="state"
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={handleChange}
                      error={errors.state}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Postal / PIN / ZIP Code"
                      name="postalCode"
                      placeholder="e.g. 411001"
                      value={formData.postalCode}
                      onChange={handleChange}
                      error={errors.postalCode}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Country"
                      name="country"
                      type="select"
                      value={formData.country}
                      onChange={handleChange}
                      options={COUNTRY_OPTIONS}
                      error={errors.country}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    SECTION 3: AUTHORIZED HR ADMINISTRATOR DETAILS
                    ------------------------------------------------------------- */}
                <div className="form-section-card">
                  <div className="form-section-title-row">
                    <div className="form-section-icon">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="form-section-title">Authorized HR Administrator</h3>
                      <p className="form-section-subtitle">
                        Designated company administrator who will manage portal accounts and issue credentials
                      </p>
                    </div>
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="HR Administrator Full Legal Name"
                      name="hrName"
                      placeholder="e.g. Rohan Deshmukh"
                      value={formData.hrName}
                      onChange={handleChange}
                      error={errors.hrName}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="HR Work Email (Portal Login ID)"
                      name="hrEmail"
                      type="email"
                      placeholder="hr@company.com"
                      value={formData.hrEmail}
                      onChange={handleChange}
                      error={errors.hrEmail}
                      helperText="Used as your primary login credential"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <FormField
                      label="Designation / Official Title"
                      name="hrDesignation"
                      placeholder="e.g. Head of Human Resources / HR Director"
                      value={formData.hrDesignation}
                      onChange={handleChange}
                      error={errors.hrDesignation}
                      required
                      disabled={submitting}
                    />

                    <FormField
                      label="Direct Contact Phone (Optional)"
                      name="hrPhone"
                      type="tel"
                      placeholder="Direct extension or mobile"
                      value={formData.hrPhone}
                      onChange={handleChange}
                      error={errors.hrPhone}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label htmlFor="password">
                        <span>Portal Password</span>
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

                      {/* Password strength meter */}
                      {formData.password && (
                        <div className="password-meter-wrap">
                          <div className="password-meter-bar">
                            <div
                              className="password-meter-segment"
                              style={{
                                background: passwordStrength.score >= 1 ? passwordStrength.color : '#e2e8f0'
                              }}
                            />
                            <div
                              className="password-meter-segment"
                              style={{
                                background: passwordStrength.score >= 2 ? passwordStrength.color : '#e2e8f0'
                              }}
                            />
                            <div
                              className="password-meter-segment"
                              style={{
                                background: passwordStrength.score >= 4 ? passwordStrength.color : '#e2e8f0'
                              }}
                            />
                          </div>
                          <div className="password-meter-label">
                            <span>Strength: {passwordStrength.label}</span>
                            <span>Min 6 characters</span>
                          </div>
                        </div>
                      )}
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
                </div>

                {/* -------------------------------------------------------------
                    SECTION 4: COMPANY VERIFICATION DOCUMENT UPLOADS
                    ------------------------------------------------------------- */}
                <div className="form-section-card">
                  <div className="form-section-title-row">
                    <div className="form-section-icon">
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <h3 className="form-section-title">Company Verification Documents</h3>
                      <p className="form-section-subtitle">
                        Required for Super Admin corporate auditing prior to blockchain anchoring (Max 5MB each, PDF or Images)
                      </p>
                    </div>
                  </div>

                  <div className="doc-upload-grid">
                    {/* Document 1: Certificate of Incorporation (Required) */}
                    <div
                      className={`doc-upload-card ${documents.incorporationDoc ? 'has-file' : ''} ${errors.incorporationDoc ? 'is-invalid' : ''}`}
                    >
                      <div className="doc-upload-card-header">
                        <div className="doc-upload-title">Certificate of Incorporation</div>
                        <span className="badge-required">Required</span>
                      </div>
                      <div className="doc-upload-desc">
                        Official corporate registry certificate, articles of incorporation, or business license
                      </div>

                      <input
                        ref={incorporationDocRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handleFileChange('incorporationDoc', e.target.files[0])
                        }
                      />

                      {documents.incorporationDoc ? (
                        <div className="doc-file-preview">
                          <div className="doc-file-info">
                            <div className="doc-file-icon">
                              <FileCheck size={18} />
                            </div>
                            <div>
                              <div className="doc-file-name" title={documents.incorporationDoc.name}>
                                {documents.incorporationDoc.name}
                              </div>
                              <div className="doc-file-size">
                                {formatFileSize(documents.incorporationDoc.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="doc-file-remove-btn"
                            onClick={(e) => handleRemoveFile('incorporationDoc', e)}
                            title="Remove file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`doc-dropzone ${dragActiveField === 'incorporationDoc' ? 'drag-active' : ''}`}
                          onClick={() => incorporationDocRef.current?.click()}
                          onDragOver={(e) => handleDragOver('incorporationDoc', e)}
                          onDragLeave={(e) => handleDragLeave('incorporationDoc', e)}
                          onDrop={(e) => handleDrop('incorporationDoc', e)}
                        >
                          <UploadCloud size={24} className="doc-dropzone-icon" />
                          <div className="doc-dropzone-text">Click or Drag &amp; Drop to upload</div>
                          <div className="doc-dropzone-hint">PDF, PNG, JPG (Max 5 MB)</div>
                        </div>
                      )}

                      {errors.incorporationDoc && (
                        <div className="field-error-text" style={{ marginTop: '0.4rem' }}>
                          {errors.incorporationDoc}
                        </div>
                      )}
                    </div>

                    {/* Document 2: Corporate Tax ID / PAN / GST (Required) */}
                    <div
                      className={`doc-upload-card ${documents.taxIdDoc ? 'has-file' : ''} ${errors.taxIdDoc ? 'is-invalid' : ''}`}
                    >
                      <div className="doc-upload-card-header">
                        <div className="doc-upload-title">Tax ID / PAN / GST Certificate</div>
                        <span className="badge-required">Required</span>
                      </div>
                      <div className="doc-upload-desc">
                        Government tax identification deed (PAN, GSTIN, EIN, or VAT registration)
                      </div>

                      <input
                        ref={taxIdDocRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange('taxIdDoc', e.target.files[0])}
                      />

                      {documents.taxIdDoc ? (
                        <div className="doc-file-preview">
                          <div className="doc-file-info">
                            <div className="doc-file-icon">
                              <FileCheck size={18} />
                            </div>
                            <div>
                              <div className="doc-file-name" title={documents.taxIdDoc.name}>
                                {documents.taxIdDoc.name}
                              </div>
                              <div className="doc-file-size">
                                {formatFileSize(documents.taxIdDoc.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="doc-file-remove-btn"
                            onClick={(e) => handleRemoveFile('taxIdDoc', e)}
                            title="Remove file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`doc-dropzone ${dragActiveField === 'taxIdDoc' ? 'drag-active' : ''}`}
                          onClick={() => taxIdDocRef.current?.click()}
                          onDragOver={(e) => handleDragOver('taxIdDoc', e)}
                          onDragLeave={(e) => handleDragLeave('taxIdDoc', e)}
                          onDrop={(e) => handleDrop('taxIdDoc', e)}
                        >
                          <UploadCloud size={24} className="doc-dropzone-icon" />
                          <div className="doc-dropzone-text">Click or Drag &amp; Drop to upload</div>
                          <div className="doc-dropzone-hint">PDF, PNG, JPG (Max 5 MB)</div>
                        </div>
                      )}

                      {errors.taxIdDoc && (
                        <div className="field-error-text" style={{ marginTop: '0.4rem' }}>
                          {errors.taxIdDoc}
                        </div>
                      )}
                    </div>

                    {/* Document 3: Registered Address Proof (Optional / Recommended) */}
                    <div
                      className={`doc-upload-card ${documents.addressProofDoc ? 'has-file' : ''}`}
                    >
                      <div className="doc-upload-card-header">
                        <div className="doc-upload-title">Registered Address Proof</div>
                        <span className="badge-optional">Optional</span>
                      </div>
                      <div className="doc-upload-desc">
                        Utility bill, commercial lease agreement, or property tax receipt (last 3 months)
                      </div>

                      <input
                        ref={addressProofDocRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handleFileChange('addressProofDoc', e.target.files[0])
                        }
                      />

                      {documents.addressProofDoc ? (
                        <div className="doc-file-preview">
                          <div className="doc-file-info">
                            <div className="doc-file-icon">
                              <FileCheck size={18} />
                            </div>
                            <div>
                              <div className="doc-file-name" title={documents.addressProofDoc.name}>
                                {documents.addressProofDoc.name}
                              </div>
                              <div className="doc-file-size">
                                {formatFileSize(documents.addressProofDoc.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="doc-file-remove-btn"
                            onClick={(e) => handleRemoveFile('addressProofDoc', e)}
                            title="Remove file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`doc-dropzone ${dragActiveField === 'addressProofDoc' ? 'drag-active' : ''}`}
                          onClick={() => addressProofDocRef.current?.click()}
                          onDragOver={(e) => handleDragOver('addressProofDoc', e)}
                          onDragLeave={(e) => handleDragLeave('addressProofDoc', e)}
                          onDrop={(e) => handleDrop('addressProofDoc', e)}
                        >
                          <UploadCloud size={24} className="doc-dropzone-icon" />
                          <div className="doc-dropzone-text">Click or Drag &amp; Drop to upload</div>
                          <div className="doc-dropzone-hint">PDF, PNG, JPG (Max 5 MB)</div>
                        </div>
                      )}
                    </div>

                    {/* Document 4: HR Authorization Letter (Optional / Recommended) */}
                    <div
                      className={`doc-upload-card ${documents.hrAuthDoc ? 'has-file' : ''}`}
                    >
                      <div className="doc-upload-card-header">
                        <div className="doc-upload-title">HR Authorization Letter</div>
                        <span className="badge-optional">Optional</span>
                      </div>
                      <div className="doc-upload-desc">
                        Board resolution or director authorization letter empowering this HR admin
                      </div>

                      <input
                        ref={hrAuthDocRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange('hrAuthDoc', e.target.files[0])}
                      />

                      {documents.hrAuthDoc ? (
                        <div className="doc-file-preview">
                          <div className="doc-file-info">
                            <div className="doc-file-icon">
                              <FileCheck size={18} />
                            </div>
                            <div>
                              <div className="doc-file-name" title={documents.hrAuthDoc.name}>
                                {documents.hrAuthDoc.name}
                              </div>
                              <div className="doc-file-size">
                                {formatFileSize(documents.hrAuthDoc.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="doc-file-remove-btn"
                            onClick={(e) => handleRemoveFile('hrAuthDoc', e)}
                            title="Remove file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`doc-dropzone ${dragActiveField === 'hrAuthDoc' ? 'drag-active' : ''}`}
                          onClick={() => hrAuthDocRef.current?.click()}
                          onDragOver={(e) => handleDragOver('hrAuthDoc', e)}
                          onDragLeave={(e) => handleDragLeave('hrAuthDoc', e)}
                          onDrop={(e) => handleDrop('hrAuthDoc', e)}
                        >
                          <UploadCloud size={24} className="doc-dropzone-icon" />
                          <div className="doc-dropzone-text">Click or Drag &amp; Drop to upload</div>
                          <div className="doc-dropzone-hint">PDF, PNG, JPG (Max 5 MB)</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    SECTION 5: TERMS ACCEPTANCE & AUTHENTICITY DECLARATION
                    ------------------------------------------------------------- */}
                <div className="form-section-card">
                  <div className="form-section-title-row">
                    <div className="form-section-icon">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="form-section-title">Terms &amp; Compliance Declarations</h3>
                      <p className="form-section-subtitle">
                        Legal commitments for enterprise issuance on the blockchain
                      </p>
                    </div>
                  </div>

                  <div className="terms-card">
                    {/* Checkbox 1: Terms & Privacy */}
                    <div>
                      <label className="terms-checkbox-item">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleChange}
                          disabled={submitting}
                        />
                        <span>
                          I agree to the TrustDoc{' '}
                          <button
                            type="button"
                            className="terms-link-btn"
                            onClick={() => setTermsModalOpen(true)}
                          >
                            Terms of Service
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            className="terms-link-btn"
                            onClick={() => setPrivacyModalOpen(true)}
                          >
                            Privacy Policy
                          </button>
                          . I understand that all issued credentials receive immutable cryptographic hashes.
                          <span className="required-asterisk">*</span>
                        </span>
                      </label>
                      {errors.termsAccepted && (
                        <div className="field-error-text" style={{ marginLeft: '1.75rem', marginTop: '0.25rem' }}>
                          {errors.termsAccepted}
                        </div>
                      )}
                    </div>

                    {/* Checkbox 2: Authenticity & Authority */}
                    <div>
                      <label className="terms-checkbox-item">
                        <input
                          type="checkbox"
                          name="declarationAccepted"
                          checked={formData.declarationAccepted}
                          onChange={handleChange}
                          disabled={submitting}
                        />
                        <span>
                          I hereby declare and warrant that I am a duly authorized HR representative of{' '}
                          <strong>{formData.name || 'this organization'}</strong>. All corporate registration
                          details, address proofs, and certificates provided are authentic and uncompromised.
                          <span className="required-asterisk">*</span>
                        </span>
                      </label>
                      {errors.declarationAccepted && (
                        <div className="field-error-text" style={{ marginLeft: '1.75rem', marginTop: '0.25rem' }}>
                          {errors.declarationAccepted}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: '2rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', padding: '0.85rem' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Clock size={20} className="animate-spin" />
                        <span>Transmitting Registration to API...</span>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Building2 size={20} />
                        <span>Submit Registration for Super Admin Audit</span>
                      </span>
                    )}
                  </button>
                </div>
              </form>

              <div className="auth-footer-prompt" style={{ marginTop: '1.75rem' }}>
                Already registered? <Link to="/login">Sign in to HR Portal</Link> •{' '}
                <Link to="/roles">Explore Roles</Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================================
          TERMS OF SERVICE MODAL
          ===================================================================== */}
      <Modal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="TrustDoc Enterprise Terms of Service"
        footer={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFormData((prev) => ({ ...prev, termsAccepted: true }));
              setTermsModalOpen(false);
            }}
          >
            Accept Terms
          </button>
        }
      >
        <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
          <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>1. Proof of Authority Protocol</h4>
          <p>
            By enrolling your organization on the TrustDoc platform, you agree that only verified corporate
            entities audited by the platform Super Administrator receive permission to issue employment documents.
          </p>

          <h4 style={{ color: '#0f172a', margin: '1rem 0 0.5rem' }}>2. Cryptographic Immutability</h4>
          <p>
            All offer letters, experience letters, LOIs, and relieving letters issued through the portal generate
            SHA-256 digital signatures that are permanently recorded on the decentralized verification ledger.
          </p>

          <h4 style={{ color: '#0f172a', margin: '1rem 0 0.5rem' }}>3. Zero Tolerance for Fraudulent Issuance</h4>
          <p>
            Organizations attempting to issue false, backdated, or fabricated employment records will be permanently
            revoked from the blockchain ledger and suspended from all portal access.
          </p>
        </div>
      </Modal>

      {/* =====================================================================
          PRIVACY POLICY MODAL
          ===================================================================== */}
      <Modal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="TrustDoc Privacy & Ledger Encryption Policy"
        footer={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setPrivacyModalOpen(false)}
          >
            Close
          </button>
        }
      >
        <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
          <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Confidentiality of Corporate Data</h4>
          <p>
            Corporate registration documents and employee personal data are secured via TLS 1.3 in transit and
            AES-256 at rest. Only cryptographic hashes and verification identifiers are exposed publicly on the
            blockchain verification portal.
          </p>
        </div>
      </Modal>

      {/* =====================================================================
          SUBMISSION RECEIPT MODAL
          ===================================================================== */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Application Submission Receipt"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setReceiptModalOpen(false)}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              <span>Print Slip</span>
            </button>
          </div>
        }
      >
        <div style={{ fontSize: '0.875rem', color: '#334155' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ margin: 0, color: '#0f172a' }}>TrustDoc Registration Receipt</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Tracking ID: {submittedResponse?.reference_id || submittedResponse?.id || 'TD-REG-2026'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>Company:</strong> {formData.name}</div>
            <div><strong>Registration / CIN:</strong> {formData.registrationNumber}</div>
            <div><strong>Official Email:</strong> {formData.email}</div>
            <div><strong>HR Administrator:</strong> {formData.hrName} ({formData.hrEmail})</div>
            <div><strong>Status:</strong> Pending Super Admin Audit</div>
            <div><strong>Target Network:</strong> TrustDoc Blockchain Verification Mainnet</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
