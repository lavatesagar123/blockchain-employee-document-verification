import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Clock,
  Calendar,
  CalendarCheck,
  Coins,
  MapPin,
  Users,
  Hash,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatDate, getDocumentTypeLabel, truncateHash } from '../utils/formatters';
import './DocumentInfoPanel.css';

export const DocumentInfoPanel = ({
  documentData = {},
  isDraft = false,
  onScanClick
}) => {
  const docType =
    documentData.document_type ||
    documentData.documentType ||
    documentData.type ||
    'offer_letter';

  const docTitle = getDocumentTypeLabel(docType);

  const recipientName =
    documentData.recipient_name ||
    documentData.recipientName ||
    documentData.employee_name ||
    'Sagar Lavate';

  const recipientEmail =
    documentData.recipient_email ||
    documentData.recipientEmail ||
    documentData.employee_email ||
    'sagar.lavate@email.com';

  const recipientPhone =
    documentData.recipient_phone ||
    documentData.recipientPhone ||
    documentData.phone ||
    '+91 98765 43210';

  const designation =
    documentData.designation ||
    documentData.position ||
    'Full Stack Developer';

  const department =
    documentData.department ||
    'Development';

  const employmentType =
    documentData.employment_type ||
    documentData.employmentType ||
    'Full Time';

  const startDate =
    documentData.start_date ||
    documentData.startDate ||
    documentData.joining_date ||
    '2025-05-01';

  const endDate =
    documentData.end_date ||
    documentData.endDate ||
    documentData.relieving_date;

  const compensation =
    documentData.compensation ||
    documentData.salaryOrStipend ||
    documentData.annual_ctc;

  const monthlySalary =
    documentData.monthly_salary ||
    documentData.monthlySalary;

  const location =
    documentData.location ||
    documentData.workLocation ||
    'Pune, Maharashtra';

  const reportingManager =
    documentData.reporting_manager ||
    documentData.reportingManager ||
    'Rohan Deshmukh';

  const refNo =
    documentData.ref_no ||
    documentData.refNo ||
    documentData.reference_number ||
    (docType === 'offer_letter'
      ? 'TD/HR/2025/001'
      : docType === 'letter_of_intent'
      ? 'TD/LOI/2025/001'
      : docType === 'experience_letter'
      ? 'TD/EXP/2025/001'
      : 'TD/REL/2025/001');

  const issueDate =
    documentData.issue_date ||
    documentData.issueDate ||
    documentData.created_at ||
    '2025-04-15';

  const verificationId =
    documentData.verification_id ||
    documentData.verificationId ||
    (!isDraft ? documentData.id : null);

  const txHash =
    documentData.transaction_hash ||
    documentData.transactionHash ||
    documentData.hash;

  const status = documentData.status || (isDraft ? 'draft' : 'verified');
  const isVerified = status === 'verified' && Boolean(verificationId);

  const verifyUrl = verificationId
    ? `/verify?id=${encodeURIComponent(verificationId)}`
    : '/verify';

  return (
    <div className="doc-info-panel-container">
      {/* Top Card: Document Information */}
      <div className="doc-info-card">
        <div className="doc-info-header">
          <div className="doc-info-header-icon">
            <FileText size={20} />
          </div>
          <div className="doc-info-header-titles">
            <h3 className="doc-info-title">{docTitle} Details</h3>
            <span className="doc-info-subtitle">Document Information</span>
          </div>
        </div>

        <div className="doc-info-list">
          <div className="doc-info-row">
            <div className="doc-info-field">
              <FileText size={15} className="doc-info-icon" />
              <span>Document Type</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{docTitle}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <User size={15} className="doc-info-icon" />
              <span>Employee Name</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{recipientName}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <Mail size={15} className="doc-info-icon" />
              <span>Email</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{recipientEmail}</span>
          </div>

          {recipientPhone && (
            <div className="doc-info-row">
              <div className="doc-info-field">
                <Phone size={15} className="doc-info-icon" />
                <span>Phone</span>
              </div>
              <span className="doc-info-colon">:</span>
              <span className="doc-info-val">{recipientPhone}</span>
            </div>
          )}

          <div className="doc-info-row">
            <div className="doc-info-field">
              <Briefcase size={15} className="doc-info-icon" />
              <span>Position</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{designation}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <Building size={15} className="doc-info-icon" />
              <span>Department</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{department}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <Clock size={15} className="doc-info-icon" />
              <span>Employment Type</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{employmentType}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <Calendar size={15} className="doc-info-icon" />
              <span>Joining Date</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{formatDate(startDate, { short: true })}</span>
          </div>

          {/* Document Specific Compensation */}
          {(docType === 'offer_letter' || docType === 'letter_of_intent') && compensation && (
            <div className="doc-info-row">
              <div className="doc-info-field">
                <Coins size={15} className="doc-info-icon" />
                <span>Annual CTC</span>
              </div>
              <span className="doc-info-colon">:</span>
              <span className="doc-info-val">{compensation}</span>
            </div>
          )}

          {docType === 'offer_letter' && monthlySalary && (
            <div className="doc-info-row">
              <div className="doc-info-field">
                <Coins size={15} className="doc-info-icon" />
                <span>Monthly Salary</span>
              </div>
              <span className="doc-info-colon">:</span>
              <span className="doc-info-val">{monthlySalary}</span>
            </div>
          )}

          {/* Relieving / Last Date for Experience & Relieving */}
          {(docType === 'experience_letter' || docType === 'relieving_letter') && endDate && (
            <div className="doc-info-row">
              <div className="doc-info-field">
                <CalendarCheck size={15} className="doc-info-icon" />
                <span>Last Working Date</span>
              </div>
              <span className="doc-info-colon">:</span>
              <span className="doc-info-val">{formatDate(endDate, { short: true })}</span>
            </div>
          )}

          <div className="doc-info-row">
            <div className="doc-info-field">
              <MapPin size={15} className="doc-info-icon" />
              <span>Location</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{location}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <Users size={15} className="doc-info-icon" />
              <span>Reporting Manager</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{reportingManager}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <Hash size={15} className="doc-info-icon" />
              <span>Reference No</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{refNo.replace('Ref No: ', '')}</span>
          </div>

          <div className="doc-info-row">
            <div className="doc-info-field">
              <CalendarCheck size={15} className="doc-info-icon" />
              <span>Issue Date</span>
            </div>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-val">{formatDate(issueDate, { short: true })}</span>
          </div>
        </div>
      </div>

      {/* Bottom Card: Blockchain Verification Card */}
      <div className="blockchain-verify-card">
        <div className="blockchain-verify-header">
          <div className="blockchain-shield-icon">
            {isVerified ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </div>
          <h4 className="blockchain-verify-heading">
            {isVerified ? 'Verified on Blockchain' : 'Blockchain Ledger Status'}
          </h4>
        </div>

        <div className="blockchain-verify-grid">
          <div className="blockchain-verify-row">
            <div className="blockchain-verify-label">
              <span>• Verification ID</span>
            </div>
            <span className="blockchain-verify-colon">:</span>
            <span className="blockchain-verify-val font-mono">
              {verificationId || (isDraft ? 'Draft Preview' : 'Pending Issuance')}
            </span>
          </div>

          <div className="blockchain-verify-row">
            <div className="blockchain-verify-label">
              <span>• Transaction ID</span>
            </div>
            <span className="blockchain-verify-colon">:</span>
            <span className="blockchain-verify-val font-mono">
              {txHash
                ? truncateHash(txHash, 10, 8)
                : isDraft
                ? 'Anchored on submit'
                : 'Pending ledger proof'}
            </span>
          </div>

          <div className="blockchain-verify-row">
            <div className="blockchain-verify-label">
              <span>• Blockchain</span>
            </div>
            <span className="blockchain-verify-colon">:</span>
            <span className="blockchain-verify-val">
              Hyperledger Fabric / POA
            </span>
          </div>

          <div className="blockchain-verify-row">
            <div className="blockchain-verify-label">
              <span>• Status</span>
            </div>
            <span className="blockchain-verify-colon">:</span>
            <span className="blockchain-verify-val">
              {isVerified ? (
                <span className="blockchain-status-badge">
                  <CheckCircle2 size={12} />
                  <span>Verified</span>
                </span>
              ) : isDraft ? (
                <span className="blockchain-status-badge draft">
                  <AlertCircle size={12} />
                  <span>Draft Preview</span>
                </span>
              ) : (
                <span className="blockchain-status-badge draft">
                  <AlertCircle size={12} />
                  <span>{status}</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {verificationId ? (
          <Link
            to={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="blockchain-scan-btn"
          >
            <QrCode size={16} />
            <span>Scan QR Code to Verify</span>
          </Link>
        ) : (
          <button
            type="button"
            className="blockchain-scan-btn"
            onClick={onScanClick}
          >
            <QrCode size={16} />
            <span>Scan QR Code to Verify</span>
          </button>
        )}
      </div>
    </div>
  );
};
