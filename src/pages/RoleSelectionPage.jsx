import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Building2, User, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import '../styles/auth.css';

export const RoleSelectionPage = () => {
  return (
    <div className="auth-wrapper">
      <Navbar />

      <main className="auth-body-container">
        <div className="role-select-container">
          <div className="role-select-header">
            <h2>Select Your Portal Role</h2>
            <p>Choose your workspace within the TrustDoc blockchain ecosystem</p>
          </div>

          <div className="role-cards-grid">
            {/* Super Admin Card */}
            <div className="role-card">
              <div className="role-icon-box role-icon-superadmin">
                <ShieldCheck size={36} />
              </div>
              <h3>Super Admin</h3>
              <p>
                Audit corporate legal registration numbers, approve or reject enterprise applications,
                manage system user access, and inspect blockchain transaction logs.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link to="/login" className="btn btn-primary role-btn">
                  Super Admin Sign In <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* HR / Company Admin Card */}
            <div className="role-card">
              <div className="role-icon-box role-icon-hr">
                <Building2 size={36} />
              </div>
              <h3>HR Administrator</h3>
              <p>
                Register your company, manage verified employees, and issue tamper-proof offer letters,
                LOIs, experience certificates, and relieving letters.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link to="/login" className="btn btn-primary role-btn">
                  HR Portal Login <ArrowRight size={16} />
                </Link>
                <Link to="/register-company" className="btn btn-secondary role-btn">
                  Register Organization
                </Link>
              </div>
            </div>

            {/* Employee Card */}
            <div className="role-card">
              <div className="role-icon-box role-icon-employee">
                <User size={36} />
              </div>
              <h3>Employee</h3>
              <p>
                Access your verified employment document portfolio, inspect blockchain verification
                hashes, and generate verifiable credentials for employers.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link to="/login" className="btn btn-primary role-btn">
                  Employee Login <ArrowRight size={16} />
                </Link>
                <Link to="/register-employee" className="btn btn-secondary role-btn">
                  Create Employee Account
                </Link>
              </div>
            </div>

            {/* Public Verifier Card */}
            <div className="role-card">
              <div className="role-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Search size={36} />
              </div>
              <h3>Public Verifier</h3>
              <p>
                No account required. Instantly verify the authenticity, issuer identity, and SHA-256
                cryptographic integrity of any issued employment document.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link to="/verify" className="btn btn-outline-emerald role-btn">
                  Open Public Verifier <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#64748b',
                fontWeight: 600
              }}
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
