import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { DemoBanner } from '../components/common/DemoBanner';
import {
  ShieldCheck,
  Building,
  UserCheck,
  Zap,
  Lock,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';
import '../styles/landing.css';

export const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />

      <div className="hero-glow-bg" />
      <div className="hero-grid-pattern" />

      <main className="landing-hero">
        <div className="container">
          {/* Quick Demo Switcher on Landing */}
          <DemoBanner />

          <div className="hero-content-grid">
            {/* Left Column: Heading and CTAs */}
            <div>
              <div className="hero-badge-tag">
                <ShieldCheck size={16} />
                <span>VerifyChain Blockchain Protocol v2.4</span>
              </div>

              <h1 className="hero-title">
                Secure Employee Document Verification with <span>Blockchain</span>
              </h1>

              <p className="hero-subtitle">
                <strong>Trusted. Transparent. Tamper-Proof.</strong> A next-generation blockchain
                platform for issuing, storing, and cryptographically verifying employment credentials.
                Eliminate background verification delays and build unshakeable trust.
              </p>

              <div className="hero-actions">
                <Link to="/roles" className="btn btn-primary btn-lg">
                  Get Started <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.15)' }}>
                  Log In to Portal
                </Link>
                <Link to="/register-company" className="btn btn-outline-emerald btn-lg">
                  <Building size={18} />
                  Register Company
                </Link>
              </div>

              {/* Status Chips */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: '#94a3b8', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="#10b981" /> DRF & MySQL Architecture Ready
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="#10b981" /> 3-Tier Role Based Access Control
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Strict Super Admin Company Auditing
                </span>
              </div>
            </div>

            {/* Right Column: Isometric Document Card Mockup */}
            <div className="hero-visual-card">
              <div className="blockchain-isometric-card">
                <div className="doc-mockup-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    BLOCK #984,210 • VERIFIED
                  </span>
                </div>

                <div className="doc-mockup-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: '#ffffff', fontSize: '1.05rem', margin: 0 }}>Certificate of Employment</h4>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Issued by ABC Technologies</p>
                    </div>
                    <span className="badge badge-approved">Active Hash</span>
                  </div>

                  <div className="mockup-line" style={{ marginTop: '0.75rem' }} />
                  <div className="mockup-line short" />
                  <div className="mockup-line" />

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    <div>txHash: 0x7f9a...3b2184d</div>
                    <div>rootMerkle: 0xa84c...001c29e</div>
                  </div>

                  <div className="mockup-seal">
                    <div className="seal-icon">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}>
                        Cryptographically Sealed
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        Immutable on distributed ledger
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Pillars Bar */}
      <section className="landing-features-bar">
        <div className="container">
          <div className="features-row">
            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Lock size={20} />
              </div>
              <div>
                <div className="feature-text-title">Secure Blockchain</div>
                <div className="feature-text-desc">Cryptographic tamper-proofing</div>
              </div>
            </div>

            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Building size={20} />
              </div>
              <div>
                <div className="feature-text-title">Verified Companies</div>
                <div className="feature-text-desc">Super Admin audited organizations</div>
              </div>
            </div>

            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Database size={20} />
              </div>
              <div>
                <div className="feature-text-title">Transparent Ledger</div>
                <div className="feature-text-desc">Instant background verification</div>
              </div>
            </div>

            <div className="feature-item-pill">
              <div className="feature-icon-box">
                <Zap size={20} />
              </div>
              <div>
                <div className="feature-text-title">Efficient Onboarding</div>
                <div className="feature-text-desc">Zero manual HR paperwork</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
