import React from 'react';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicLayout = ({ children, hideFooter = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="public-layout-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="public-layout-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
      {!hideFooter && (
        <footer className="public-footer">
        <div className="container footer-inner">
          <div className="footer-brand-col">
            <div className="brand-logo" style={{ color: '#ffffff' }}>
              <div className="brand-icon-wrap" style={{ width: '32px', height: '32px' }}>
                <ShieldCheck size={18} />
              </div>
              <span className="brand-name" style={{ fontSize: '1.15rem' }}>
                Trust<span>Doc</span>
              </span>
            </div>
            <p className="footer-tagline">
              Enterprise blockchain-powered employee credential & document verification platform.
              Tamper-proof, immutable, and instantly verifiable.
            </p>
            <div className="footer-security-pill">
              <Lock size={13} color="#10b981" />
              <span>Decentralized Proof of Authority Protocol</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/verify">Public Verification</Link></li>
              <li><Link to="/roles">Roles & Access</Link></li>
              <li><Link to="/register-company">Register Organization</Link></li>
              <li><Link to="/login">Employee Portal</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Enterprise</h4>
            <ul>
              <li><Link to="/login">Account Login</Link></li>
              <li><Link to="/register-company">Corporate Auditing</Link></li>
              <li><a href="#blockchain-specs">Ledger Architecture</a></li>
              <li><a href="#compliance">SOC2 & ISO Ready</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="container footer-bottom-inner">
            <p>© {currentYear} TrustDoc Blockchain Verification Network. All rights reserved.</p>
            <div className="footer-bottom-links">
              <span>Designed for Enterprise Compliance</span>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};
