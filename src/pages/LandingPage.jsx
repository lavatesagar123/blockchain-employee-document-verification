import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { PublicLayout } from '../layouts/PublicLayout';
import {
  Link2,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Zap,
  MapPin,
  Mail,
  Globe
} from 'lucide-react';
import '../styles/landing.css';

/**
 * Top-Left Multi-Layered Geometric Corner Ribbon SVG
 * Exact reproduction of TrustDoc dark forest green, emerald, and gold ribbon
 */
const TopLeftRibbon = () => (
  <svg
    className="corner-ribbon-top-left"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="0,0 135,0 0,135" fill="#03392a" />
    <polygon points="0,0 105,0 0,105" fill="#047857" />
    <polygon points="0,15 85,0 0,85" fill="#059669" />
    <polygon points="35,0 55,0 0,55 0,35" fill="#f59e0b" />
    <polygon points="50,0 54,0 0,54 0,50" fill="#d97706" />
    <polygon points="120,0 135,0 115,20 100,20" fill="#10b981" opacity="0.8" />
    <polygon points="0,120 0,135 20,115 20,100" fill="#10b981" opacity="0.8" />
  </svg>
);

/**
 * Bottom-Right Multi-Layered Geometric Corner Ribbon SVG
 */
const BottomRightRibbon = () => (
  <svg
    className="corner-ribbon-bottom-right"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="160,160 25,160 160,25" fill="#03392a" />
    <polygon points="160,160 55,160 160,55" fill="#047857" />
    <polygon points="160,145 75,160 160,75" fill="#059669" />
    <polygon points="125,160 105,160 160,105 160,125" fill="#f59e0b" />
    <polygon points="110,160 106,160 160,106 160,110" fill="#d97706" />
    <polygon points="40,160 25,160 45,140 60,140" fill="#10b981" opacity="0.8" />
    <polygon points="160,40 160,25 140,45 140,60" fill="#10b981" opacity="0.8" />
  </svg>
);

/**
 * TrustDoc Hexagonal Logo Mark SVG
 */
const CompanyLogoMark = () => (
  <svg viewBox="0 0 60 60" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M30 3L53.38 16.5V43.5L30 57L6.62 43.5V16.5L30 3Z"
      fill="#047857"
      stroke="#064e3b"
      strokeWidth="2"
    />
    <path d="M30 11L46 20.24V39.76L30 49L14 39.76V20.24L30 11Z" fill="#065f46" />
    <path d="M30 18L40 24V36L30 42L20 36V24L30 18Z" fill="#ffffff" />
    <path d="M30 24L36 28V34L30 38L24 34V28L30 24Z" fill="#047857" />
  </svg>
);

/**
 * Circular Official Verified Stamp / Seal SVG
 */
const CircularCompanySeal = () => (
  <svg viewBox="0 0 140 140" width="70" height="70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path id="previewSealPath" d="M 70 70 m -48 0 a 48 48 0 1 1 96 0 a 48 48 0 1 1 -96 0" />
    </defs>
    <circle cx="70" cy="70" r="64" stroke="#047857" strokeWidth="2.2" />
    <circle cx="70" cy="70" r="59" stroke="#059669" strokeWidth="1" strokeDasharray="3 2" />
    <text fill="#047857" fontSize="8.2" fontWeight="800" letterSpacing="2.2">
      <textPath href="#previewSealPath" startOffset="50%" textAnchor="middle">
        TRUSTDOC TECHNOLOGIES • VERIFIED •
      </textPath>
    </text>
    <circle cx="70" cy="70" r="37" stroke="#047857" strokeWidth="1.4" />
    <text x="70" y="66" textAnchor="middle" fill="#064e3b" fontSize="10.5" fontWeight="900" letterSpacing="2.5">
      PUNE
    </text>
    <text x="70" y="80" textAnchor="middle" fill="#059669" fontSize="9.5" fontWeight="bold" letterSpacing="2.5">
      ★ ★ ★
    </text>
  </svg>
);

/**
 * Realistic Blue Cursive Signatory Signature SVG
 */
const SignatorySignature = () => (
  <svg viewBox="0 0 170 50" width="115" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 34 C 20 12, 32 6, 44 26 C 54 42, 60 16, 74 22 C 86 28, 96 14, 112 28 C 124 38, 134 18, 150 26"
      stroke="#1d4ed8"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M38 18 C 50 14, 70 30, 92 18" stroke="#1e40af" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 42 C 55 38, 105 43, 156 39" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const LandingPage = () => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL('https://trustdoc.io/verify/VC-2025-001', {
      width: 64,
      margin: 1,
      color: {
        dark: '#047857',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, []);

  return (
    <PublicLayout hideFooter={true}>
      <div className="trustdoc-homepage">
        {/* Soft Mint Ambient Glow Elements */}
        <div className="home-ambient-glow-left" />
        <div className="home-ambient-glow-right" />

        {/* Hero Section */}
        <section className="homepage-hero-section">
          <div className="hero-layout-grid">
            {/* Left Column: Heading, Subtitle, Buttons, 4 Benefits */}
            <div className="hero-left-col">
              {/* Pill badge: Blockchain Powered */}
              <div className="hero-pill-badge">
                <Link2 size={15} strokeWidth={2.4} />
                <span>Blockchain Powered</span>
              </div>

              {/* Main Headline */}
              <h1 className="hero-headline">
                <span className="headline-navy">Blockchain-Based</span>
                <br />
                <span className="headline-emerald">Employee Document</span>
                <br />
                <span className="headline-emerald">Verification</span>
              </h1>

              {/* Supporting description */}
              <p className="hero-description">
                Secure, trusted and tamper-proof employment document verification for a transparent and reliable future.
              </p>

              {/* Four Compact Benefits in a Single Horizontal Row */}
              <div className="hero-benefits-row">
                <div className="benefit-item">
                  <div className="benefit-icon-circle">
                    <ShieldCheck size={20} strokeWidth={2.2} />
                  </div>
                  <div className="benefit-title">Secure</div>
                  <div className="benefit-desc">Protected with blockchain technology</div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-circle">
                    <CheckCircle2 size={20} strokeWidth={2.2} />
                  </div>
                  <div className="benefit-title">Verified</div>
                  <div className="benefit-desc">Authentic &amp; trustworthy</div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-circle">
                    <Eye size={20} strokeWidth={2.2} />
                  </div>
                  <div className="benefit-title">Transparent</div>
                  <div className="benefit-desc">Full traceability &amp; audit trail</div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-circle">
                    <Zap size={20} strokeWidth={2.2} />
                  </div>
                  <div className="benefit-title">Efficient</div>
                  <div className="benefit-desc">Faster verification process</div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Document Illustration & Floating Status Card */}
            <div className="hero-right-col">
              <div className="doc-illustration-wrapper">
                {/* Layered Decorative Backdrop Sheets */}
                <div className="doc-stacked-sheet-2" />
                <div className="doc-stacked-sheet-1" />

                {/* Main White Certificate Document */}
                <div className="doc-certificate-card">
                  {/* Top-Left & Bottom-Right Ribbons */}
                  <TopLeftRibbon />
                  <BottomRightRibbon />

                  {/* Header */}
                  <div className="cert-preview-header">
                    <div className="cert-preview-brand">
                      <CompanyLogoMark />
                      <div>
                        <div className="cert-preview-brand-title">TrustDoc Technologies</div>
                        <div className="cert-preview-brand-sub">Secure Documents | Trusted Future</div>
                      </div>
                    </div>

                    <div className="cert-preview-meta">
                      <div>Ref No: TD/HR/2025/001</div>
                      <div>Date: 15 Apr 2025</div>
                    </div>
                  </div>

                  {/* Title: —— Offer Letter —— */}
                  <div className="cert-preview-title-wrap">
                    <h2 className="cert-preview-title">
                      <span className="cert-title-line" />
                      <span>Offer Letter</span>
                      <span className="cert-title-line" />
                    </h2>
                  </div>

                  {/* Salutation & Body */}
                  <div className="cert-preview-body">
                    <div className="cert-preview-salutation">Dear Sagar Lavate,</div>
                    <p>
                      We are pleased to extend an offer of employment to you as a{' '}
                      <strong>Full Stack Developer</strong> at <strong>TrustDoc Technologies</strong>. We look forward
                      to having you on our team.
                    </p>
                  </div>

                  {/* Details Box Table */}
                  <div className="cert-preview-details-box">
                    <div className="cert-detail-row">
                      <span className="cert-detail-label">Position</span>
                      <span className="cert-detail-colon">:</span>
                      <span className="cert-detail-val">Full Stack Developer</span>
                    </div>

                    <div className="cert-detail-row">
                      <span className="cert-detail-label">Department</span>
                      <span className="cert-detail-colon">:</span>
                      <span className="cert-detail-val">Development</span>
                    </div>

                    <div className="cert-detail-row">
                      <span className="cert-detail-label">Employment Type</span>
                      <span className="cert-detail-colon">:</span>
                      <span className="cert-detail-val">Full Time</span>
                    </div>

                    <div className="cert-detail-row">
                      <span className="cert-detail-label">Joining Date</span>
                      <span className="cert-detail-colon">:</span>
                      <span className="cert-detail-val">01 May 2025</span>
                    </div>

                    <div className="cert-detail-row">
                      <span className="cert-detail-label">Annual CTC</span>
                      <span className="cert-detail-colon">:</span>
                      <span className="cert-detail-val">₹ 6,00,000</span>
                    </div>

                    <div className="cert-detail-row">
                      <span className="cert-detail-label">Location</span>
                      <span className="cert-detail-colon">:</span>
                      <span className="cert-detail-val">Pune, Maharashtra</span>
                    </div>
                  </div>

                  {/* Sign-off & Badges Row */}
                  <div className="cert-preview-bottom-row">
                    <div className="cert-sign-col">
                      <div className="cert-regards">Best regards,</div>
                      <SignatorySignature />
                      <div className="cert-sign-name">Rohan Deshmukh</div>
                      <div className="cert-sign-role">HR Manager</div>
                    </div>

                    <div className="cert-seal-col">
                      <CircularCompanySeal />
                    </div>

                    <div className="cert-qr-col">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="Verification QR"
                          style={{ width: '56px', height: '56px', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{ width: '56px', height: '56px', background: '#ecfdf5', borderRadius: '4px' }} />
                      )}
                      <div className="cert-qr-caption">Scan to verify document authenticity</div>
                    </div>
                  </div>

                  {/* Certificate Footer */}
                  <div className="cert-preview-footer">
                    <div className="cert-footer-item">
                      <MapPin size={11} />
                      <span>TrustDoc Technologies, Pune, Maharashtra - 411001</span>
                    </div>
                    <div className="cert-footer-item">
                      <Mail size={11} />
                      <span>hr@trustdoc.com</span>
                    </div>
                    <div className="cert-footer-item">
                      <Globe size={11} />
                      <span>www.trustdoc.com</span>
                    </div>
                  </div>
                </div>

                {/* Floating "Document Verified" Status Card */}
                <div className="hero-status-card">
                  <div className="status-card-header">
                    <div className="status-icon-wrap">
                      <ShieldCheck size={20} strokeWidth={2.4} />
                    </div>
                    <div>
                      <div className="status-title">Document Verified</div>
                      <div className="status-sub">Blockchain Record Found</div>
                    </div>
                  </div>

                  <div className="status-card-divider" />

                  <div className="status-card-rows">
                    <div className="status-row">
                      <span className="status-label">Verification ID</span>
                      <span className="status-colon">:</span>
                      <span className="status-val font-mono">VC-2025-001</span>
                    </div>

                    <div className="status-row">
                      <span className="status-label">Document Type</span>
                      <span className="status-colon">:</span>
                      <span className="status-val">Offer Letter</span>
                    </div>

                    <div className="status-row">
                      <span className="status-label">Issued On</span>
                      <span className="status-colon">:</span>
                      <span className="status-val">15 Apr 2025</span>
                    </div>

                    <div className="status-row">
                      <span className="status-label">Status</span>
                      <span className="status-colon">:</span>
                      <span className="status-badge-verified">
                        <CheckCircle2 size={12} strokeWidth={3} />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
