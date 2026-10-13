import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HRLayout } from '../layouts/HRLayout';
import { documentService } from '../services/documentService';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { FormField } from '../components/FormField';
import { isValidEmail } from '../utils/validators';
import { formatDate, getDocumentTypeLabel } from '../utils/formatters';
import {
  FilePlus,
  Building,
  User,
  Calendar,
  Briefcase,
  DollarSign,
  ShieldCheck,
  FileText,
  Eye,
  AlertCircle,
  WifiOff,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';
import '../styles/dashboard.css';

export const DocumentIssuancePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [employeesList, setEmployeesList] = useState([]);
  const [formData, setFormData] = useState({
    selectedEmployeeId: '',
    recipientName: '',
    recipientEmail: '',
    employeeId: '',
    documentType: 'offer_letter', // offer_letter, letter_of_intent, experience_letter, relieving_letter
    designation: '',
    department: '',
    startDate: '',
    endDate: '', // for relieving / experience
    salaryOrStipend: '',
    remarks: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [issuedResult, setIssuedResult] = useState(null);

  // Load registered employees for easy selection
  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await employeeService.getEmployees();
        const list = Array.isArray(response) ? response : response?.results || [];
        setEmployeesList(list);
      } catch {
        // Optional prefill list; user can still enter details manually
      }
    }
    loadEmployees();
  }, []);

  const handleSelectEmployee = (e) => {
    const empId = e.target.value;
    const found = employeesList.find((emp) => String(emp.id) === empId || emp.employee_id === empId);

    if (found) {
      setFormData((prev) => ({
        ...prev,
        selectedEmployeeId: empId,
        recipientName: found.name || '',
        recipientEmail: found.email || '',
        employeeId: found.employee_id || found.employeeId || '',
        designation: found.designation || prev.designation,
        department: found.department || prev.department
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedEmployeeId: empId }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const errs = {};
    if (!formData.recipientName.trim()) errs.recipientName = 'Recipient name is required';
    if (!formData.recipientEmail.trim()) {
      errs.recipientEmail = 'Recipient email is required';
    } else if (!isValidEmail(formData.recipientEmail.trim())) {
      errs.recipientEmail = 'Enter a valid email address';
    }

    if (!formData.designation.trim()) errs.designation = 'Designation/role is required';
    if (!formData.startDate) errs.startDate = 'Effective / start date is required';

    if (
      (formData.documentType === 'experience_letter' || formData.documentType === 'relieving_letter') &&
      !formData.endDate
    ) {
      errs.endDate = 'End / relieving date is required for this document type';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct form errors before issuance.', 'warning');
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        recipient_name: formData.recipientName.trim(),
        recipient_email: formData.recipientEmail.trim(),
        employee_id: formData.employeeId.trim(),
        document_type: formData.documentType,
        designation: formData.designation.trim(),
        department: formData.department.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        compensation: formData.salaryOrStipend.trim(),
        remarks: formData.remarks.trim()
      };

      const response = await documentService.issueDocument(payload);
      setIssuedResult(response);
      addToast('Document successfully issued and registered on the blockchain!', 'success');
    } catch (err) {
      setApiError(err.message || 'Failed to issue document.');
      addToast(err.message || 'Issuance failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const companyName = user?.companyName || user?.companyDetails?.name || 'Verified Organization';

  return (
    <HRLayout
      title="Issue Employment Document"
      subtitle="Issue cryptographically signed credentials and anchor proof onto the blockchain ledger"
    >
      <div className="animate-fade-in">
        {issuedResult ? (
          /* Issuance Success Result Screen */
          <div className="content-card-panel" style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <ShieldCheck size={36} />
            </div>

            <h2 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '0.5rem' }}>
              Document Successfully Issued
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
              The {getDocumentTypeLabel(formData.documentType)} has been generated and cryptographically anchored.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>RECIPIENT</span>
                  <strong>{formData.recipientName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>DOCUMENT TYPE</span>
                  <strong>{getDocumentTypeLabel(formData.documentType)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>VERIFICATION ID</span>
                  <strong className="font-mono" style={{ color: '#059669' }}>
                    {issuedResult.verification_id || issuedResult.id || 'DOC-VFY-RECORD'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>BLOCKCHAIN STATUS</span>
                  <span className="badge badge-approved">Anchored & Verified</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/hr/documents" className="btn btn-primary">
                View in Issued Registry
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIssuedResult(null);
                  setFormData({
                    selectedEmployeeId: '',
                    recipientName: '',
                    recipientEmail: '',
                    employeeId: '',
                    documentType: 'offer_letter',
                    designation: '',
                    department: '',
                    startDate: '',
                    endDate: '',
                    salaryOrStipend: '',
                    remarks: ''
                  });
                }}
              >
                Issue Another Document
              </button>
            </div>
          </div>
        ) : (
          /* Split View: Form on Left, Live Preview on Right */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>
            {/* Form Column */}
            <div className="content-card-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem', color: '#0f172a' }}>
                Document Issuance Details
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Fill in the verified employment parameters to generate the cryptographic credential.
              </p>

              {apiError && (
                <div className="alert-banner alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>Issuance Failed</strong>
                    <p style={{ margin: '0.2rem 0 0' }}>{apiError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Employee Quick Select */}
                {employeesList.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="selectedEmployeeId">Select Registered Employee (Optional)</label>
                    <select
                      id="selectedEmployeeId"
                      name="selectedEmployeeId"
                      className="form-control form-select"
                      value={formData.selectedEmployeeId}
                      onChange={handleSelectEmployee}
                    >
                      <option value="">-- Choose from Directory or Enter Below --</option>
                      {employeesList.map((emp) => (
                        <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                          {emp.name} ({emp.designation || emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Document Type Selection */}
                <div className="form-group">
                  <label htmlFor="documentType">
                    <span>Document Type</span>
                    <span className="required-asterisk">*</span>
                  </label>
                  <select
                    id="documentType"
                    name="documentType"
                    className="form-control form-select"
                    value={formData.documentType}
                    onChange={handleChange}
                  >
                    <option value="offer_letter">Offer Letter</option>
                    <option value="letter_of_intent">Letter of Intent (LOI)</option>
                    <option value="experience_letter">Experience Letter</option>
                    <option value="relieving_letter">Relieving Letter</option>
                  </select>
                </div>

                <div className="form-grid-2col">
                  <FormField
                    label="Recipient Full Name"
                    name="recipientName"
                    placeholder="e.g. Johnathan Smith"
                    value={formData.recipientName}
                    onChange={handleChange}
                    error={errors.recipientName}
                    required
                    disabled={submitting}
                  />

                  <FormField
                    label="Recipient Email"
                    name="recipientEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.recipientEmail}
                    onChange={handleChange}
                    error={errors.recipientEmail}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-grid-2col">
                  <FormField
                    label="Employee ID / Roll"
                    name="employeeId"
                    placeholder="e.g. EMP-1092"
                    value={formData.employeeId}
                    onChange={handleChange}
                    error={errors.employeeId}
                    disabled={submitting}
                  />

                  <FormField
                    label="Designation / Position"
                    name="designation"
                    placeholder="e.g. Lead Software Engineer"
                    value={formData.designation}
                    onChange={handleChange}
                    error={errors.designation}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-grid-2col">
                  <FormField
                    label="Department"
                    name="department"
                    placeholder="e.g. Core Infrastructure"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={submitting}
                  />

                  <FormField
                    label={formData.documentType === 'offer_letter' ? 'Annual Compensation / CTC' : 'Compensation (Optional)'}
                    name="salaryOrStipend"
                    placeholder="e.g. $110,000 / year"
                    value={formData.salaryOrStipend}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="form-grid-2col">
                  <FormField
                    label={formData.documentType === 'offer_letter' ? 'Joining Date' : 'Employment Start Date'}
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    error={errors.startDate}
                    required
                    disabled={submitting}
                  />

                  {(formData.documentType === 'experience_letter' || formData.documentType === 'relieving_letter') && (
                    <FormField
                      label="Relieving / Last Working Date"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      error={errors.endDate}
                      required
                      disabled={submitting}
                    />
                  )}
                </div>

                <FormField
                  label="Official Remarks / Special Clauses (Optional)"
                  name="remarks"
                  type="textarea"
                  rows={2}
                  placeholder="Additional terms, performance commendations, or reason for leaving..."
                  value={formData.remarks}
                  onChange={handleChange}
                  disabled={submitting}
                />

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '1.25rem' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span>Issuing & Anchoring to API...</span>
                  ) : (
                    <>
                      <FilePlus size={18} />
                      <span>Issue {getDocumentTypeLabel(formData.documentType)}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Live Document Preview Layout */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Document Preview
                </span>
                <span className="badge badge-approved" style={{ fontSize: '0.72rem' }}>
                  Format: Official Certificate
                </span>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '2.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '520px'
                }}
              >
                {/* Watermark Seal */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-25deg)',
                    color: 'rgba(16, 185, 129, 0.05)',
                    fontSize: '4.5rem',
                    fontWeight: 900,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textAlign: 'center',
                    lineHeight: 1
                  }}
                >
                  TRUSTDOC<br />VERIFIED
                </div>

                {/* Company Header */}
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                      {companyName}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Official Corporate Credential
                    </span>
                  </div>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={24} />
                  </div>
                </div>

                {/* Document Title */}
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em', margin: '0 0 0.35rem' }}>
                    {getDocumentTypeLabel(formData.documentType)}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Date of Issue: {formatDate(new Date())}
                  </div>
                </div>

                {/* Recipient Greeting & Body */}
                <div style={{ fontSize: '0.875rem', lineHeight: '1.7', color: '#334155', marginBottom: '2rem' }}>
                  <p>
                    This is an official credential issued to{' '}
                    <strong>{formData.recipientName || '[Recipient Name]'}</strong>
                    {formData.employeeId ? ` (ID: ${formData.employeeId})` : ''}.
                  </p>

                  <p>
                    {formData.documentType === 'offer_letter' && (
                      <>
                        We are pleased to offer you the position of{' '}
                        <strong>{formData.designation || '[Designation]'}</strong>
                        {formData.department ? ` in the ${formData.department} department` : ''}.
                        Your employment commences on{' '}
                        <strong>{formData.startDate ? formatDate(formData.startDate) : '[Joining Date]'}</strong>
                        {formData.salaryOrStipend ? ` with an annual compensation of ${formData.salaryOrStipend}` : ''}.
                      </>
                    )}

                    {formData.documentType === 'letter_of_intent' && (
                      <>
                        This Letter of Intent confirms our mutual intent to engage you as{' '}
                        <strong>{formData.designation || '[Designation]'}</strong> starting on{' '}
                        <strong>{formData.startDate ? formatDate(formData.startDate) : '[Start Date]'}</strong>.
                      </>
                    )}

                    {formData.documentType === 'experience_letter' && (
                      <>
                        This certifies that{' '}
                        <strong>{formData.recipientName || '[Recipient Name]'}</strong> was employed
                        with {companyName} as{' '}
                        <strong>{formData.designation || '[Designation]'}</strong> from{' '}
                        <strong>{formData.startDate ? formatDate(formData.startDate) : '[Start Date]'}</strong> to{' '}
                        <strong>{formData.endDate ? formatDate(formData.endDate) : '[End Date]'}</strong>.
                      </>
                    )}

                    {formData.documentType === 'relieving_letter' && (
                      <>
                        This certifies that{' '}
                        <strong>{formData.recipientName || '[Recipient Name]'}</strong> has been relieved of
                        duties as <strong>{formData.designation || '[Designation]'}</strong> effective{' '}
                        <strong>{formData.endDate ? formatDate(formData.endDate) : '[Last Working Day]'}</strong>.
                      </>
                    )}
                  </p>

                  {formData.remarks && (
                    <p style={{ fontStyle: 'italic', color: '#64748b', borderLeft: '3px solid #cbd5e1', paddingLeft: '0.75rem' }}>
                      "{formData.remarks}"
                    </p>
                  )}
                </div>

                {/* Sign-off & Seal */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.name || 'HR Administrator'}</div>
                    <div style={{ color: '#64748b' }}>Authorized Signatory, {companyName}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
                      <ShieldCheck size={16} /> Blockchain Anchored
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#94a3b8' }}>
                      SHA-256 Digest upon submit
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
};
