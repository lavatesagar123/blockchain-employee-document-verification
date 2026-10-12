import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { DemoBanner } from '../components/common/DemoBanner';
import { ShieldCheck, Building2, User, ArrowRight, ArrowLeft } from 'lucide-react';
import '../styles/auth.css';

export const RoleSelectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper">
      <Navbar />

      <main className="auth-body-container">
        <div className="role-select-container">
          <DemoBanner />

          <div className="role-select-header">
            <h2>Select Your Role</h2>
            <p>Choose how you want to access the VerifyChain ecosystem</p>
          </div>

          <div className="role-cards-grid">
            {/* Super Admin Card */}
            <div className="role-card">
              <div className="role-icon-box role-icon-superadmin">
                <ShieldCheck size={36} />
              </div>
              <h3>Super Admin</h3>
              <p>
                Manage companies, audit registration documents, approve or reject organization
                requests, and supervise the complete verification ledger.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link to="/login?role=superadmin" className="btn btn-primary role-btn">
                  Super Admin Login <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* HR / Company Admin Card */}
            <div className="role-card">
              <div className="role-icon-box role-icon-hr">
                <Building2 size={36} />
              </div>
              <h3>HR / Company Admin</h3>
              <p>
                Register your enterprise, get audited by the Super Admin, manage authorized
                employees, and issue blockchain-backed credential records.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link to="/login?role=hr" className="btn btn-primary role-btn">
                  HR Portal Login <ArrowRight size={16} />
                </Link>
                <Link to="/register-company" className="btn btn-secondary role-btn">
                  Register New Company
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
                Access your tamper-proof employment documents, track verification statuses, and
                showcase verifiable career credentials with confidence.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link to="/login?role=employee" className="btn btn-primary role-btn">
                  Employee Login <ArrowRight size={16} />
                </Link>
                <Link to="/register-employee" className="btn btn-secondary role-btn">
                  Create Employee Account
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
