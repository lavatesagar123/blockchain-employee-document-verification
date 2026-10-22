import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HRLayout } from '../layouts/HRLayout';
import { DocumentCertificate } from '../components/DocumentCertificate';
import { DocumentInfoPanel } from '../components/DocumentInfoPanel';
import { documentService } from '../services/documentService';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { FormField } from '../components/FormField';
import { isValidEmail } from '../utils/validators';
import { formatDate, getDocumentTypeLabel, truncateHash } from '../utils/formatters';
import { downloadCertificateAsPdf, printCertificate } from '../utils/pdfGenerator';
import {
  FilePlus,
  ShieldCheck,
  FileText,
  Eye,
  AlertCircle,
  Download,
  Printer,
  Sparkles,
  Maximize2,
  CheckCircle2,
  Briefcase,
  Layers
} from 'lucide-react';
import { Modal } from '../components/Modal';
import '../styles/dashboard.css';

const DEFAULT_DESCRIPTIONS = {
  offer_letter:
    'We are delighted to extend this offer of employment for the position of Full Stack Developer. This offer includes full employee benefits, comprehensive health insurance coverage, and standard annual leave entitlement. Your employment is subject to satisfactory reference verification and successful completion of background checks.',

  letter_of_intent:
    'This Letter of Intent (LOI) formally conveys our intention to appoint you to the proposed position within our organization. This preliminary engagement is subject to mutual acceptance of terms and standard document verification. A detailed Appointment Letter outlining complete terms and conditions will be executed on or prior to your commencement date.',

  experience_letter:
    'This is to certify that the employee was employed with our organization and performed their assigned duties with commendable technical expertise, dedication, and professional ethics. They maintained exemplary conduct with team members and leadership throughout their tenure. We wish them success in all future endeavors.',

  relieving_letter:
    'This letter confirms the acceptance of the resignation submitted by the employee. They have been formally relieved of all duties and responsibilities with effect from the recorded relieving date. All company equipment, digital assets, and physical materials have been accounted for and returned, and all dues have been cleared in full with no outstanding liabilities.'
};

export const DocumentIssuancePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [employeesList, setEmployeesList] = useState([]);
  const [activeTab, setActiveTab] = useState('certificate'); // 'certificate' or 'panel'
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Default initial dates
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    selectedEmployeeId: '',
    documentType: 'offer_letter', // offer_letter, letter_of_intent, experience_letter, relieving_letter
    customDescription: DEFAULT_DESCRIPTIONS.offer_letter,
    recipientName: 'Sagar Lavate',
    recipientEmail: 'sagar.lavate@email.com',
    recipientPhone: '+91 98765 43210',
    employeeId: 'EMP-1092',
    designation: 'Full Stack Developer',
    department: 'Development',
    employmentType: 'Full Time',
    startDate: today,
    endDate: today,
    resignationDate: today,
    salaryOrStipend: '₹ 6,00,000',
    monthlySalary: '₹ 50,000',
    workLocation: 'Pune, Maharashtra',
    reportingManager: 'Rohan Deshmukh',
    acceptanceDeadline: nextWeek,
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
        recipientName: found.name || prev.recipientName,
        recipientEmail: found.email || prev.recipientEmail,
        recipientPhone: found.phone || prev.recipientPhone,
        employeeId: found.employee_id || found.employeeId || prev.employeeId,
        designation: found.designation || prev.designation,
        department: found.department || prev.department,
        employmentType: found.employment_type || prev.employmentType
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedEmployeeId: empId }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-compute monthly salary from CTC if compensation changed
      if (name === 'salaryOrStipend') {
        const clean = value.replace(/[^0-9]/g, '');
        if (clean) {
          const num = parseInt(clean, 10);
          if (!isNaN(num) && num > 0) {
            updated.monthlySalary = `₹ ${Math.round(num / 12).toLocaleString('en-IN')}`;
          }
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError(null);
  };

  const handleDocumentTypeChange = (type) => {
    setFormData((prev) => {
      const isDefault =
        Object.values(DEFAULT_DESCRIPTIONS).includes(prev.customDescription) ||
        !prev.customDescription?.trim();
      return {
        ...prev,
        documentType: type,
        customDescription: isDefault ? (DEFAULT_DESCRIPTIONS[type] || '') : prev.customDescription
      };
    });
  };

  const handleResetDescription = () => {
    setFormData((prev) => ({
      ...prev,
      customDescription: DEFAULT_DESCRIPTIONS[prev.documentType] || ''
    }));
    addToast('Restored standard template wording', 'info');
  };

  const validate = () => {
    const errs = {};
    if (!formData.recipientName.trim()) errs.recipientName = 'Recipient name is required';
    if (!formData.recipientEmail.trim()) {
      errs.recipientEmail = 'Recipient email is required';
    } else if (!isValidEmail(formData.recipientEmail.trim())) {
      errs.recipientEmail = 'Enter a valid email address';
    }

    if (!formData.designation.trim()) errs.designation = 'Designation/position is required';
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
        recipient_phone: formData.recipientPhone.trim(),
        employee_id: formData.employeeId.trim(),
        document_type: formData.documentType,
        custom_description: (formData.customDescription || '').trim(),
        customDescription: (formData.customDescription || '').trim(),
        designation: formData.designation.trim(),
        department: formData.department.trim(),
        employment_type: formData.employmentType,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        resignation_date: formData.resignationDate || null,
        compensation: formData.salaryOrStipend.trim(),
        monthly_salary: formData.monthlySalary.trim(),
        location: formData.workLocation.trim(),
        reporting_manager: formData.reportingManager.trim(),
        acceptance_deadline: formData.acceptanceDeadline || null,
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

  // Export PDF handler
  const handleDownloadPdf = async (nodeId, filenamePrefix) => {
    setIsDownloadingPdf(true);
    try {
      const docLabel = getDocumentTypeLabel(formData.documentType).replace(/\s+/g, '_');
      const recipient = formData.recipientName.replace(/\s+/g, '_') || 'Employee';
      const filename = `${docLabel}_${recipient}.pdf`;
      await downloadCertificateAsPdf(nodeId || 'live-issuance-certificate-node', { filename });
      addToast('Certificate PDF generated and downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to generate PDF. You can also use the Print button.', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Company details context / props
  const companyDetails = {
    name: user?.companyName || user?.companyDetails?.name || 'TrustDoc Technologies',
    tagline: user?.companyDetails?.tagline || 'Secure Documents | Trusted Future',
    address: user?.companyDetails?.address || 'TrustDoc Technologies\nPune, Maharashtra - 411001',
    email: user?.companyDetails?.email || 'hr@trustdoc.com',
    website: user?.companyDetails?.website || 'www.trustdoc.com',
    city: formData.workLocation.split(',')[0].trim() || 'Pune',
    signatory_name: user?.name || 'Rohan Deshmukh',
    signatory_role: user?.designation || 'HR Manager'
  };

  return (
    <HRLayout
      title="Issue Employment Document"
      subtitle="Design, preview, and issue tamper-proof blockchain credentials"
    >
      <div className="animate-fade-in">
        {issuedResult ? (
          /* Issuance Success Result Screen with Certificate & PDF */
          <div className="content-card-panel" style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#d1fae5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <ShieldCheck size={38} />
              </div>

              <h2 style={{ fontSize: '1.85rem', color: '#0f172a', marginBottom: '0.4rem', fontWeight: 800 }}>
                Document Successfully Issued & Anchored
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.98rem', maxWidth: '640px', margin: '0 auto 1.25rem' }}>
                The <strong>{getDocumentTypeLabel(formData.documentType)}</strong> for <strong>{formData.recipientName}</strong> has been cryptographically signed and registered on the verification ledger.
              </p>

              {/* Blockchain Metadata Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                  Verification ID: {issuedResult.verification_id || issuedResult.id}
                </span>
                <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                  Ref: {issuedResult.reference_number || issuedResult.ref_no}
                </span>
                <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                  Tx: {truncateHash(issuedResult.transaction_hash)}
                </span>
                <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                  Ledger Status: Verified
                </span>
              </div>

              {/* Action Buttons: Save/PDF, Print, Registry, Issue Another */}
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf('issued-success-certificate-node', 'Certificate')}
                  disabled={isDownloadingPdf}
                  className="btn btn-primary"
                  style={{ minWidth: '190px' }}
                >
                  <Download size={16} />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download / Save as PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => printCertificate()}
                  className="btn btn-secondary"
                >
                  <Printer size={16} />
                  <span>Print Certificate</span>
                </button>

                <Link to="/hr/documents" className="btn btn-secondary">
                  <FileText size={16} />
                  <span>View in Issued Registry</span>
                </Link>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIssuedResult(null);
                    setFormData((prev) => ({
                      ...prev,
                      recipientName: '',
                      recipientEmail: '',
                      recipientPhone: '',
                      employeeId: '',
                      remarks: ''
                    }));
                  }}
                >
                  <FilePlus size={16} />
                  <span>Issue Another Document</span>
                </button>
              </div>

              {/* View Switcher Tabs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('certificate')}
                  className={`btn btn-sm ${activeTab === 'certificate' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <FileText size={14} />
                  <span>Full Certificate View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('panel')}
                  className={`btn btn-sm ${activeTab === 'panel' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Layers size={14} />
                  <span>Details & Ledger</span>
                </button>
              </div>
            </div>

            {/* Full High-Resolution Certificate View */}
            {activeTab === 'certificate' ? (
              <div style={{ maxWidth: '840px', margin: '0 auto', overflowX: 'auto' }}>
                <DocumentCertificate
                  previewId="issued-success-certificate-node"
                  documentData={{
                    ...formData,
                    verification_id: issuedResult.verification_id || issuedResult.id,
                    transaction_hash: issuedResult.transaction_hash,
                    ref_no: issuedResult.reference_number || issuedResult.ref_no,
                    status: 'verified'
                  }}
                  company={companyDetails}
                  isDraft={false}
                />
              </div>
            ) : (
              <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                <DocumentInfoPanel
                  documentData={{
                    ...formData,
                    verification_id: issuedResult.verification_id || issuedResult.id,
                    transaction_hash: issuedResult.transaction_hash,
                    ref_no: issuedResult.reference_number || issuedResult.ref_no,
                    status: 'verified'
                  }}
                  isDraft={false}
                  onScanClick={() => addToast('Document verified on ledger.', 'success')}
                />
              </div>
            )}
          </div>
        ) : (
          /* Standalone Full-Width Form Card: Clean, Spacious, No Side Certificate */
          <div className="content-card-panel" style={{ maxWidth: '880px', margin: '0 auto', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-approved" style={{ marginBottom: '0.5rem', display: 'inline-flex', gap: '4px' }}>
                  <Sparkles size={12} /> Employment Credential Issuer
                </span>
                <h3 style={{ fontSize: '1.45rem', margin: '0 0 0.35rem', color: '#0f172a', fontWeight: 800 }}>
                  Issue Employment Document
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                  Select document type and complete form. Once issued, the full certificate is generated for saving and printing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalPreviewOpen(true)}
                className="btn btn-secondary btn-sm"
                title="Preview Draft Certificate"
              >
                <Eye size={14} />
                <span>Preview Draft</span>
              </button>
            </div>

              {/* Document Type Selector Tabs */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.6rem' }}>
                  Select Document Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { id: 'offer_letter', label: 'Offer Letter', desc: 'Job offer & compensation' },
                    { id: 'letter_of_intent', label: 'Letter of Intent (LOI)', desc: 'Intent to hire proposal' },
                    { id: 'experience_letter', label: 'Experience Letter', desc: 'Tenure & role confirmation' },
                    { id: 'relieving_letter', label: 'Relieving Letter', desc: 'Acceptance of separation' }
                  ].map((tab) => {
                    const isSelected = formData.documentType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleDocumentTypeChange(tab.id)}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                          background: isSelected ? '#ecfdf5' : '#f8fafc',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#065f46' : '#0f172a' }}>
                          {tab.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isSelected ? '#047857' : '#64748b', marginTop: '2px' }}>
                          {tab.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                    <label htmlFor="selectedEmployeeId">Choose Registered Employee (Optional)</label>
                    <select
                      id="selectedEmployeeId"
                      name="selectedEmployeeId"
                      className="form-control form-select"
                      value={formData.selectedEmployeeId}
                      onChange={handleSelectEmployee}
                    >
                      <option value="">-- Manual Entry or Select from Directory --</option>
                      {employeesList.map((emp) => (
                        <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                          {emp.name} ({emp.designation || emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Recipient Details */}
                <div className="form-grid-2col">
                  <FormField
                    label="Recipient Full Name"
                    name="recipientName"
                    placeholder="e.g. Sagar Lavate"
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
                    placeholder="sagar.lavate@email.com"
                    value={formData.recipientEmail}
                    onChange={handleChange}
                    error={errors.recipientEmail}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-grid-2col">
                  <FormField
                    label="Phone Number"
                    name="recipientPhone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.recipientPhone}
                    onChange={handleChange}
                    disabled={submitting}
                  />

                  <FormField
                    label="Employee ID"
                    name="employeeId"
                    placeholder="e.g. EMP-1092"
                    value={formData.employeeId}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                {/* Role and Department */}
                <div className="form-grid-2col">
                  <FormField
                    label="Designation / Position"
                    name="designation"
                    placeholder="e.g. Full Stack Developer"
                    value={formData.designation}
                    onChange={handleChange}
                    error={errors.designation}
                    required
                    disabled={submitting}
                  />

                  <FormField
                    label="Department"
                    name="department"
                    placeholder="e.g. Development"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label htmlFor="employmentType">
                      <span>Employment Type</span>
                    </label>
                    <select
                      id="employmentType"
                      name="employmentType"
                      className="form-control form-select"
                      value={formData.employmentType}
                      onChange={handleChange}
                      disabled={submitting}
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <FormField
                    label="Work Location"
                    name="workLocation"
                    placeholder="e.g. Pune, Maharashtra"
                    value={formData.workLocation}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                {/* Dates based on Document Type */}
                <div className="form-grid-2col">
                  {formData.documentType === 'relieving_letter' ? (
                    <FormField
                      label="Resignation / Notice Date"
                      name="resignationDate"
                      type="date"
                      value={formData.resignationDate}
                      onChange={handleChange}
                      error={errors.resignationDate}
                      required
                      disabled={submitting}
                    />
                  ) : (
                    <FormField
                      label={
                        formData.documentType === 'offer_letter'
                          ? 'Joining Date'
                          : formData.documentType === 'letter_of_intent'
                          ? 'Proposed Joining Date'
                          : 'Employment Start Date'
                      }
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      error={errors.startDate}
                      required
                      disabled={submitting}
                    />
                  )}

                  {(formData.documentType === 'experience_letter' ||
                    formData.documentType === 'relieving_letter') && (
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

                  {(formData.documentType === 'offer_letter' ||
                    formData.documentType === 'letter_of_intent') && (
                    <FormField
                      label={
                        formData.documentType === 'offer_letter'
                          ? 'Acceptance Deadline'
                          : 'Offer Validity Date'
                      }
                      name="acceptanceDeadline"
                      type="date"
                      value={formData.acceptanceDeadline}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  )}
                </div>

                {/* Compensation Fields for Offer & LOI only */}
                {(formData.documentType === 'offer_letter' ||
                  formData.documentType === 'letter_of_intent') && (
                  <div className="form-grid-2col">
                    <FormField
                      label={formData.documentType === 'offer_letter' ? 'Annual CTC' : 'Indicative Annual CTC'}
                      name="salaryOrStipend"
                      placeholder="e.g. ₹ 6,00,000"
                      value={formData.salaryOrStipend}
                      onChange={handleChange}
                      disabled={submitting}
                    />

                    <FormField
                      label="Monthly Salary (Estimated)"
                      name="monthlySalary"
                      placeholder="e.g. ₹ 50,000"
                      value={formData.monthlySalary}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* Reporting Manager for Offer & LOI only */}
                {(formData.documentType === 'offer_letter' ||
                  formData.documentType === 'letter_of_intent') && (
                  <FormField
                    label="Reporting Manager / Contact Person"
                    name="reportingManager"
                    placeholder="e.g. Rohan Deshmukh"
                    value={formData.reportingManager}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                )}

                {/* Custom Letter Description Section */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label htmlFor="customDescription" style={{ fontWeight: 700, margin: 0, color: '#0f172a', fontSize: '0.85rem' }}>
                      Custom Letter Description & Approved Wording *
                    </label>
                    <button
                      type="button"
                      onClick={handleResetDescription}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#059669',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Reset to default wording for this document type"
                    >
                      ↺ Reset to template default
                    </button>
                  </div>
                  <textarea
                    id="customDescription"
                    name="customDescription"
                    rows={4}
                    className="form-control"
                    placeholder="Enter custom description or approved wording for this letter..."
                    value={formData.customDescription}
                    onChange={handleChange}
                    disabled={submitting}
                    style={{ lineHeight: 1.55, resize: 'vertical' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Edits to custom description update the draft preview immediately and are embedded in the generated letter.
                  </div>
                </div>

                {/* Remarks */}
                <FormField
                  label="Official Remarks / Special Clauses (Optional)"
                  name="remarks"
                  type="textarea"
                  rows={2}
                  placeholder="Additional terms, commendations, or clearance details..."
                  value={formData.remarks}
                  onChange={handleChange}
                  disabled={submitting}
                />

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setModalPreviewOpen(true)}
                    className="btn btn-secondary btn-lg"
                    style={{ flex: '1', minWidth: '160px' }}
                  >
                    <Eye size={18} />
                    <span>Preview Draft</span>
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ flex: '2', minWidth: '220px' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span>Issuing & Anchoring to API...</span>
                    ) : (
                      <>
                        <FilePlus size={18} />
                        <span>Issue {getDocumentTypeLabel(formData.documentType)} & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
        )}

        {/* Modal for Fullscreen Preview */}
        <Modal
          isOpen={modalPreviewOpen}
          onClose={() => setModalPreviewOpen(false)}
          title={`Preview: ${getDocumentTypeLabel(formData.documentType)}`}
          maxWidth="920px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Previewing official green-and-white certificate template
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf('modal-issuance-certificate-node', 'Certificate_Preview')}
                  disabled={isDownloadingPdf}
                  className="btn btn-primary btn-sm"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => printCertificate()}
                  className="btn btn-secondary btn-sm"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalPreviewOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div style={{ padding: '0.5rem 0' }}>
            <DocumentCertificate
              previewId="modal-issuance-certificate-node"
              documentData={formData}
              company={companyDetails}
              isDraft={true}
            />
          </div>
        </Modal>
      </div>
    </HRLayout>
  );
};
