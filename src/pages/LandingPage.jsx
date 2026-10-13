import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import {
  ShieldCheck,
  Building2,
  Lock,
  CheckCircle2,
  ArrowRight,
  Database,
  Search,
  FileCheck,
  Zap,
  Globe2
} from 'lucide-react';
import '../styles/landing.css';

export const LandingPage = () => {
  return (
    <PublicLayout>
      <div className="hero-glow-bg" />
      <div className="hero-grid-pattern" />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="container">
          <div className="hero-content-grid">
            {/* Left Column: Heading, Subtitle & CTAs */}
            <div>
              <div className="hero-badge-tag">
                <ShieldCheck size={16} />
                <span>Enterprise Blockchain Protocol • DRF & React Architecture</span>
              </div>

              <h1 className="hero-title">
                Cryptographic Employee <span>Document Verification</span>
              </h1>

              <p className="hero-subtitle">
                <strong>Immutable. Tamper-Proof. Instantly Verifiable.</strong> Eliminate fraudulent
                resumes, forged experience certificates, and lengthy background verification delays
                with an auditable distributed ledger for employment credentials.
              </p>

              <div className="hero-actions">
                <Link to="/verify" className="btn btn-primary btn-lg">
                  <Search size={18} />
                  <span>Verify a Document</span>
                </Link>

                <Link to="/register-company" className="btn btn-outline-emerald btn-lg">
                  <Building2 size={18} />
                  <span>Register Organization</span>
                </Link>

                <Link to="/login" className="btn btn-secondary btn-lg">
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="hero-trust-indicators">
                <div className="trust-indicator-item">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Super Admin Audited Companies</span>
                </div>
                <div className="trust-indicator-item">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>SHA-256 File Hash Matching</span>
                </div>
                <div className="trust-indicator-item">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>3-Tier Role-Based Access</span>
                </div>
              </div>
            </div>

            {/* Right Column: Isometric Credential Card Preview */}
            <div className="hero-visual-card">
              <div className="blockchain-isometric-card">
                <div className="doc-mockup-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    LEDGER PROTOCOL • PROOF OF AUTHORITY
                  </span>
                </div>

                <div className="doc-mockup-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ color: '#ffffff', fontSize: '1.1rem', margin: 0 }}>Certificate of Employment</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        Enterprise Verified Credential
                      </p>
                    </div>
                    <span className="badge badge-approved">Active On Ledger</span>
                  </div>

                  <div className="mockup-line" style={{ marginTop: '1rem' }} />
                  <div className="mockup-line short" />
                  <div className="mockup-line" />

                  <div className="mockup-ledger-details">
                    <div>
                      <span className="detail-label">VERIFICATION ID:</span>
                      <span className="detail-value">DOC-VFY-884920</span>
                    </div>
                    <div>
                      <span className="detail-label">CRYPTOGRAPHIC DIGEST:</span>
                      <span className="detail-value font-mono">0x7f9a8b1c...e42a98f1</span>
                    </div>
                  </div>

                  <div className="mockup-seal">
                    <div className="seal-icon">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}>
                        Cryptographically Sealed
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        Zero-knowledge proof verification
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-features-bar">
        <div className="container">
          <div className="features-row">
            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Lock size={20} />
              </div>
              <div>
                <div className="feature-text-title">Tamper-Proof Integrity</div>
                <div className="feature-text-desc">Cryptographic SHA-256 fingerprinting</div>
              </div>
            </div>

            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Building2 size={20} />
              </div>
              <div>
                <div className="feature-text-title">Audited Organizations</div>
                <div className="feature-text-desc">Super Admin legal verification</div>
              </div>
            </div>

            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Database size={20} />
              </div>
              <div>
                <div className="feature-text-title">Public Ledger Verification</div>
                <div className="feature-text-desc">Instant verification in seconds</div>
              </div>
            </div>

            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Zap size={20} />
              </div>
              <div>
                <div className="feature-text-title">Automated HR Issuance</div>
                <div className="feature-text-desc">Offer letters, LOIs, experience certificates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-workflow-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-eyebrow">VERIFICATION WORKFLOW</span>
            <h2>How TrustDoc Secures Employment Credentials</h2>
            <p>From company registration to public blockchain verification</p>
          </div>

          <div className="workflow-steps-grid">
            <div className="workflow-step-card">
              <div className="step-number">01</div>
              <div className="step-icon-wrap">
                <Building2 size={24} />
              </div>
              <h3>Company Auditing</h3>
              <p>
                Organizations register corporate details and undergo legal verification by Super Admin
                before being authorized to issue credentials.
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="step-number">02</div>
              <div className="step-icon-wrap">
                <FileCheck size={24} />
              </div>
              <h3>Document Issuance</h3>
              <p>
                Authorized HR administrators issue digitally signed offer letters, LOIs, or relieving
                letters anchored with unique cryptographic hashes.
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="step-number">03</div>
              <div className="step-icon-wrap">
                <Globe2 size={24} />
              </div>
              <h3>Instant Public Verification</h3>
              <p>
                Prospective employers or background checkers verify document authenticity and checksum
                integrity instantly without phone tag or delays.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
