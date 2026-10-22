import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { formatDate } from '../utils/formatters';
import { MapPin, Mail, Globe } from 'lucide-react';
import './DocumentCertificate.css';

/**
 * Top-Left Multi-Layered Geometric Corner Ribbon SVG
 * Exact reproduction of the dark forest green, emerald, and gold ribbon
 */
const TopLeftRibbon = () => (
  <svg
    className="cert-corner-ribbon cert-corner-top-left"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Dark Forest Green Base Facet */}
    <polygon points="0,0 135,0 0,135" fill="#03392a" />
    
    {/* Mid Emerald Angular Facet */}
    <polygon points="0,0 105,0 0,105" fill="#047857" />

    {/* Bright Emerald Accent Fold */}
    <polygon points="0,15 85,0 0,85" fill="#059669" />

    {/* Gold / Amber Ribbon Diagonal Stripe */}
    <polygon points="35,0 55,0 0,55 0,35" fill="#f59e0b" />
    <polygon points="50,0 54,0 0,54 0,50" fill="#d97706" />

    {/* Outer Slanted Decorative Cut Notch */}
    <polygon points="120,0 135,0 115,20 100,20" fill="#10b981" opacity="0.8" />
    <polygon points="0,120 0,135 20,115 20,100" fill="#10b981" opacity="0.8" />
  </svg>
);

/**
 * Bottom-Right Multi-Layered Geometric Corner Ribbon SVG
 * Mirrored matching faceted corner ornament
 */
const BottomRightRibbon = () => (
  <svg
    className="cert-corner-ribbon cert-corner-bottom-right"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Dark Forest Green Base Facet */}
    <polygon points="160,160 25,160 160,25" fill="#03392a" />

    {/* Mid Emerald Angular Facet */}
    <polygon points="160,160 55,160 160,55" fill="#047857" />

    {/* Bright Emerald Accent Fold */}
    <polygon points="160,145 75,160 160,75" fill="#059669" />

    {/* Gold / Amber Ribbon Diagonal Stripe */}
    <polygon points="125,160 105,160 160,105 160,125" fill="#f59e0b" />
    <polygon points="110,160 106,160 160,106 160,110" fill="#d97706" />

    {/* Outer Slanted Decorative Cut Notch */}
    <polygon points="40,160 25,160 45,140 60,140" fill="#10b981" opacity="0.8" />
    <polygon points="160,40 160,25 140,45 140,60" fill="#10b981" opacity="0.8" />
  </svg>
);

/**
 * Company Logo Mark SVG
 * Hexagonal emerald mark with central faceted emblem
 */
const CompanyLogoMark = () => (
  <svg className="cert-logo-mark" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M30 3L53.38 16.5V43.5L30 57L6.62 43.5V16.5L30 3Z"
      fill="#047857"
      stroke="#064e3b"
      strokeWidth="2"
    />
    <path
      d="M30 11L46 20.24V39.76L30 49L14 39.76V20.24L30 11Z"
      fill="#065f46"
    />
    {/* Inner White Cube / Diamond Emblem */}
    <path
      d="M30 18L40 24V36L30 42L20 36V24L30 18Z"
      fill="#ffffff"
    />
    <path
      d="M30 24L36 28V34L30 38L24 34V28L30 24Z"
      fill="#047857"
    />
  </svg>
);

/**
 * Circular Official Company Stamp / Seal SVG
 */
const CircularCompanySeal = ({ companyName = 'TRUSTDOC TECHNOLOGIES', city = 'PUNE' }) => {
  const cleanName = (companyName || 'TRUSTDOC TECHNOLOGIES').toUpperCase();
  const cleanCity = (city || 'PUNE').toUpperCase();

  return (
    <div className="cert-seal-container" title="Official Corporate Seal">
      <svg viewBox="0 0 140 140" width="104" height="104" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Path for curved circular text */}
          <path
            id="sealTextPath"
            d="M 70 70 m -50 0 a 50 50 0 1 1 100 0 a 50 50 0 1 1 -100 0"
          />
        </defs>

        {/* Outer Solid Circle */}
        <circle cx="70" cy="70" r="66" stroke="#047857" strokeWidth="2.5" />

        {/* Inner Dashed Border Ring */}
        <circle
          cx="70"
          cy="70"
          r="61"
          stroke="#059669"
          strokeWidth="1.2"
          strokeDasharray="3 2"
        />

        {/* Outer Perimeter Text */}
        <text fill="#047857" fontSize="8.5" fontWeight="800" letterSpacing="2.5">
          <textPath href="#sealTextPath" startOffset="50%" textAnchor="middle">
            {cleanName} • VERIFIED •
          </textPath>
        </text>

        {/* Inner Solid Border Ring */}
        <circle cx="70" cy="70" r="38" stroke="#047857" strokeWidth="1.5" />

        {/* Center City & Stars */}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          fill="#064e3b"
          fontSize="11"
          fontWeight="900"
          letterSpacing="2.5"
          fontFamily="system-ui, sans-serif"
        >
          {cleanCity}
        </text>

        {/* 3 Green Stars */}
        <text
          x="70"
          y="80"
          textAnchor="middle"
          fill="#059669"
          fontSize="10"
          fontWeight="bold"
          letterSpacing="3"
        >
          ★ ★ ★
        </text>
      </svg>
    </div>
  );
};

/**
 * Realistic Blue Cursive Signatory Signature SVG
 */
const SignatorySignature = () => (
  <svg viewBox="0 0 170 50" width="150" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fluid blue ink cursive path */}
    <path
      d="M10 34 C 20 12, 32 6, 44 26 C 54 42, 60 16, 74 22 C 86 28, 96 14, 112 28 C 124 38, 134 18, 150 26"
      stroke="#1d4ed8"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M38 18 C 50 14, 70 30, 92 18"
      stroke="#1e40af"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M14 42 C 55 38, 105 43, 156 39"
      stroke="#1d4ed8"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Calculate human-readable tenure between two dates (e.g., '2 Years, 3 Months')
 */
const calculateTenure = (startDate, endDate) => {
  if (!startDate || !endDate) return '2 Years, 4 Months';
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 'Completed Tenure';
    }
    const diffMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    return parts.length > 0 ? parts.join(', ') : '1 Month';
  } catch {
    return 'Completed Tenure';
  }
};

/**
 * Calculate estimated monthly salary from annual compensation string
 */
const calculateMonthlyFromAnnual = (annualStr) => {
  if (!annualStr) return '₹ 50,000';
  const clean = String(annualStr).replace(/[^0-9]/g, '');
  if (!clean) return '₹ 50,000';
  const num = parseInt(clean, 10);
  if (isNaN(num) || num <= 0) return '₹ 50,000';
  const monthly = Math.round(num / 12);
  return `₹ ${monthly.toLocaleString('en-IN')}`;
};

/**
 * Main Reusable Document Certificate Component
 */
export const DocumentCertificate = ({
  documentData = {},
  company = {},
  previewId = 'document-certificate-node',
  isDraft = false
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Normalize document data
  const docType =
    documentData.document_type ||
    documentData.documentType ||
    documentData.type ||
    'offer_letter';

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

  const employeeId =
    documentData.employee_id ||
    documentData.employeeId ||
    documentData.id ||
    'EMP-1092';

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
    documentData.relieving_date ||
    '2025-04-15';

  const compensation =
    documentData.compensation ||
    documentData.salaryOrStipend ||
    documentData.annual_ctc ||
    '₹ 6,00,000';

  const monthlySalary =
    documentData.monthly_salary ||
    documentData.monthlySalary ||
    calculateMonthlyFromAnnual(compensation);

  const location =
    documentData.location ||
    documentData.workLocation ||
    company.city ||
    'Pune, Maharashtra';

  const reportingManager =
    documentData.reporting_manager ||
    documentData.reportingManager ||
    'Rohan Deshmukh';

  const acceptanceDeadline =
    documentData.acceptance_deadline ||
    documentData.acceptanceDeadline ||
    '2025-04-22';

  const remarks = documentData.remarks || '';

  const refNo =
    documentData.ref_no ||
    documentData.refNo ||
    documentData.reference_number ||
    (docType === 'offer_letter'
      ? 'Ref No: TD/HR/2025/001'
      : docType === 'letter_of_intent'
      ? 'Ref No: TD/LOI/2025/001'
      : docType === 'experience_letter'
      ? 'Ref No: TD/EXP/2025/001'
      : 'Ref No: TD/REL/2025/001');

  const issueDate =
    documentData.issue_date ||
    documentData.issueDate ||
    documentData.created_at ||
    '2025-04-15';

  const verificationId =
    documentData.verification_id ||
    documentData.verificationId ||
    (isDraft ? null : documentData.id);

  // Normalize company information
  const companyName = company.name || 'TrustDoc Technologies';
  const companyTagline = company.tagline || 'Secure Documents | Trusted Future';
  const companyAddress = company.address || 'TrustDoc Technologies\nPune, Maharashtra - 411001';
  const companyEmail = company.email || 'hr@trustdoc.com';
  const companyWebsite = company.website || 'www.trustdoc.com';
  const signatoryName = company.signatory_name || 'Rohan Deshmukh';
  const signatoryRole = company.signatory_role || 'HR Manager';

  // Generate Scannable QR Code
  useEffect(() => {
    async function generateQR() {
      try {
        const verifyTarget = verificationId
          ? `${window.location.origin}/verify?id=${encodeURIComponent(verificationId)}`
          : `${window.location.origin}/verify?status=draft_preview`;

        const url = await QRCode.toDataURL(verifyTarget, {
          width: 180,
          margin: 1,
          color: {
            dark: '#047857',
            light: '#ffffff'
          }
        });
        setQrDataUrl(url);
      } catch (err) {
        console.warn('Failed to generate certificate QR code:', err);
      }
    }
    generateQR();
  }, [verificationId]);

  // Extract first name for warm salutation
  const firstName = recipientName.trim().split(' ')[0] || 'Candidate';

  // Config per Document Type
  const docConfig = {
    offer_letter: {
      title: 'Offer Letter',
      badge: 'CONFIDENTIAL',
      salutation: `Dear ${firstName},`,
      p1: (
        <>
          We are pleased to extend an offer of employment to you at <strong>{companyName}</strong>.
          We are impressed with your skills, experience and the value you bring to our team.
          We believe you will make a significant contribution to our continued success.
        </>
      ),
      p2: (
        <>
          <p style={{ margin: '0 0 8px 0' }}>
            Please confirm your acceptance of this offer by signing and returning a copy of this
            letter by <strong>{formatDate(acceptanceDeadline)}</strong>.
          </p>
          <p style={{ margin: 0 }}>
            We look forward to welcoming you to our team and wish you a successful and rewarding journey with us.
          </p>
        </>
      ),
      leftDetails: [
        { label: 'Position', value: designation },
        { label: 'Department', value: department },
        { label: 'Employment Type', value: employmentType },
        { label: 'Joining Date', value: formatDate(startDate) }
      ],
      rightDetails: [
        { label: 'Annual CTC', value: compensation },
        { label: 'Monthly Salary', value: monthlySalary },
        { label: 'Location', value: location },
        { label: 'Reporting Manager', value: reportingManager }
      ]
    },

    letter_of_intent: {
      title: 'Letter of Intent',
      badge: 'INTENT OF EMPLOYMENT',
      salutation: `Dear ${firstName},`,
      p1: (
        <>
          We are pleased to issue this Letter of Intent confirming our preliminary offer of
          employment to you at <strong>{companyName}</strong>. Following our discussions and
          evaluation, we are delighted to convey our intent to bring you on board.
        </>
      ),
      p2: (
        <>
          This Letter of Intent serves as a mutual statement of understanding and is subject to
          satisfactory credential verification and standard onboarding formalities. A formal
          Appointment Letter containing exhaustive employment terms will be executed on or before
          your commencement date.
        </>
      ),
      leftDetails: [
        { label: 'Proposed Position', value: designation },
        { label: 'Department', value: department },
        { label: 'Employment Type', value: employmentType },
        { label: 'Proposed Joining', value: formatDate(startDate) }
      ],
      rightDetails: [
        { label: 'Indicative CTC', value: compensation },
        { label: 'Work Location', value: location },
        { label: 'Offer Validity Until', value: formatDate(acceptanceDeadline) },
        { label: 'Reporting Manager', value: reportingManager }
      ]
    },

    experience_letter: {
      title: 'Experience Letter',
      badge: 'TO WHOM IT MAY CONCERN',
      salutation: 'TO WHOM IT MAY CONCERN',
      p1: (
        <>
          This is to certify that <strong>{recipientName}</strong> (Employee ID:{' '}
          <strong>{employeeId}</strong>) was employed with <strong>{companyName}</strong> as{' '}
          <strong>{designation}</strong> in the <strong>{department}</strong> department from{' '}
          <strong>{formatDate(startDate)}</strong> to <strong>{formatDate(endDate)}</strong>.
        </>
      ),
      p2: (
        <>
          During their tenure with us, <strong>{recipientName}</strong> exhibited commendable
          professional diligence, technical competence, and dedication. Their conduct and
          character were found to be exemplary in all respects. We thank them for their
          contributions to <strong>{companyName}</strong> and wish them all the best in their
          future career endeavors.
        </>
      ),
      leftDetails: [
        { label: 'Employee Name', value: recipientName },
        { label: 'Employee ID', value: employeeId },
        { label: 'Designation', value: designation },
        { label: 'Department', value: department }
      ],
      rightDetails: [
        { label: 'Employment Type', value: employmentType },
        { label: 'Date of Joining', value: formatDate(startDate) },
        { label: 'Last Working Day', value: formatDate(endDate) },
        { label: 'Total Service Tenure', value: calculateTenure(startDate, endDate) }
      ]
    },

    relieving_letter: {
      title: 'Relieving Letter',
      badge: 'TO WHOM IT MAY CONCERN',
      salutation: `Dear ${firstName},`,
      p1: (
        <>
          This has reference to your formal resignation from the services of{' '}
          <strong>{companyName}</strong>. We hereby accept your resignation and confirm that you
          have been relieved of your responsibilities as <strong>{designation}</strong> in the{' '}
          <strong>{department}</strong> department with effect from the close of business hours on{' '}
          <strong>{formatDate(endDate)}</strong>.
        </>
      ),
      p2: (
        <>
          We confirm that all company assets, credentials, and documentation in your custody have
          been duly returned, and all final dues have been settled in full. There are no
          outstanding liabilities against you. We express our appreciation for your service and
          wish you every success in your future professional endeavors.
        </>
      ),
      leftDetails: [
        { label: 'Employee Name', value: recipientName },
        { label: 'Employee ID', value: employeeId },
        { label: 'Designation', value: designation },
        { label: 'Department', value: department }
      ],
      rightDetails: [
        { label: 'Relieving Date', value: formatDate(endDate) },
        { label: 'Clearance Status', value: 'Complete & Approved' },
        { label: 'Separation Ref', value: refNo.replace('Ref No: ', '') },
        { label: 'Handover Status', value: 'Duly Verified' }
      ]
    }
  };

  const activeDoc = docConfig[docType] || docConfig.offer_letter;

  return (
    <div className="cert-root-wrapper">
      <div id={previewId} className="cert-card">
        {/* Geometric Corner Ribbon Ornaments */}
        <TopLeftRibbon />
        <BottomRightRibbon />

        {/* Inner Emerald Decorative Border Frame */}
        <div className="cert-inner-frame" />

        {/* Certificate Watermark (Draft indicator or subtle security seal) */}
        {isDraft && (
          <div className="cert-draft-watermark">
            OFFICIAL<br />DRAFT
          </div>
        )}

        {/* Certificate Body Container */}
        <div className="cert-content">
          {/* Top Header */}
          <div className="cert-header">
            {/* Left: Branding */}
            <div className="cert-branding">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={companyName}
                  className="cert-logo-mark"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <CompanyLogoMark />
              )}
              <div className="cert-company-info">
                <h1 className="cert-company-name">{companyName}</h1>
                <div className="cert-company-tagline">
                  <span>{companyTagline}</span>
                  <span className="cert-micro-code">12307614732</span>
                </div>
              </div>
            </div>

            {/* Right: Ref & Date */}
            <div className="cert-meta-info">
              <div className="cert-ref-no">{refNo.startsWith('Ref No:') ? refNo : `Ref No: ${refNo}`}</div>
              <div className="cert-date">Date: {formatDate(issueDate, { short: true })}</div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="cert-title-section">
            <div className="cert-title-row">
              <div className="cert-title-rule" />
              <h2 className="cert-doc-title">{activeDoc.title}</h2>
              <div className="cert-title-rule cert-title-rule rule-right" />
            </div>
            <div className="cert-doc-badge">{activeDoc.badge}</div>
          </div>

          {/* Recipient Details Block */}
          <div className="cert-recipient-block">
            <div className="cert-recipient-to">To,</div>
            <div className="cert-recipient-name">{recipientName}</div>
            <div className="cert-recipient-sub">{recipientEmail}</div>
            {recipientPhone && <div className="cert-recipient-sub">{recipientPhone}</div>}
          </div>

          {/* Salutation */}
          <div className="cert-salutation">{activeDoc.salutation}</div>

          {/* Paragraph 1 */}
          <div className="cert-body-p">{activeDoc.p1}</div>

          {/* Structured Key-Value Details Box */}
          <div className="cert-details-box">
            <div className="cert-details-grid">
              {/* Left Column */}
              <div className="cert-details-col left-col">
                {activeDoc.leftDetails.map((item, index) => (
                  <div key={index} className="cert-detail-row">
                    <span className="cert-detail-label">{item.label}</span>
                    <span className="cert-detail-colon">:</span>
                    <span className="cert-detail-value">{item.value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="cert-details-col right-col">
                {activeDoc.rightDetails.map((item, index) => (
                  <div key={index} className="cert-detail-row">
                    <span className="cert-detail-label">{item.label}</span>
                    <span className="cert-detail-colon">:</span>
                    <span className="cert-detail-value">{item.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Paragraph 2 */}
          <div className="cert-body-p">{activeDoc.p2}</div>

          {/* Remarks (If Provided) */}
          {remarks && (
            <div className="cert-remarks-box">
              <strong>Special Clauses / Remarks: </strong>"{remarks}"
            </div>
          )}

          {/* Signatures, Seal & QR Bottom Row */}
          <div className="cert-signatures-section">
            {/* Left: Authorized Signatory */}
            <div className="cert-signatory-col">
              <div className="cert-warm-regards">Warm regards,</div>
              <div className="cert-signature-canvas">
                <SignatorySignature />
              </div>
              <div className="cert-signatory-name">{signatoryName}</div>
              <div className="cert-signatory-role">{signatoryRole}</div>
              <div className="cert-signatory-company">{companyName}</div>
            </div>

            {/* Middle: Circular Company Seal */}
            <div className="cert-seal-col">
              <CircularCompanySeal
                companyName={companyName}
                city={company.city || (location ? location.split(',')[0] : 'PUNE')}
              />
            </div>

            {/* Right: Scannable QR Code */}
            <div className="cert-qr-col">
              <div className="cert-qr-box">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Verification QR Code" className="cert-qr-img" />
                ) : (
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Generating QR...</div>
                )}
              </div>
              <div className="cert-qr-caption">
                Scan to verify<br />document authenticity
              </div>
            </div>
          </div>

          {/* Bottom Footer Bar with Icons */}
          <div className="cert-footer">
            <div className="cert-footer-item cert-footer-address">
              <MapPin size={15} className="cert-footer-icon" />
              <div className="cert-footer-address-text">
                <span className="cert-footer-company">{companyName}</span>
                <span className="cert-footer-city">
                  {company.city ? `${company.city}, Maharashtra - 411001` : 'Pune, Maharashtra - 411001'}
                </span>
              </div>
            </div>
            <div className="cert-footer-item">
              <Mail size={13} className="cert-footer-icon" />
              <span>{companyEmail}</span>
            </div>
            <div className="cert-footer-item">
              <Globe size={13} className="cert-footer-icon" />
              <span>{companyWebsite}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
