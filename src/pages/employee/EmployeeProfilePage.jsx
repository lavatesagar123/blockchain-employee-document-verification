import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Building, ShieldCheck, Hash } from 'lucide-react';
import '../../styles/dashboard.css';

export const EmployeeProfilePage = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="My Profile & Credentials"
      subtitle="Personal employment identity verified on the blockchain"
    >
      <div className="animate-fade-in">
        <div className="content-card-panel">
          <div className="panel-header-row">
            <h3>Profile Information</h3>
            <span className="badge badge-approved">Identity Verified</span>
          </div>

          <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{user?.name}</div>
            </div>

            <div className="form-group">
              <label>Employee ID</label>
              <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0ea5e9' }}>
                {user?.employeeId || 'EMP-1001'}
              </div>
            </div>

            <div className="form-group">
              <label>Designation</label>
              <div style={{ color: '#0f172a', fontWeight: 500 }}>{user?.designation || 'Software Engineer'}</div>
            </div>

            <div className="form-group">
              <label>Company / Organization</label>
              <div style={{ color: '#0f172a', fontWeight: 500 }}>{user?.companyName || 'Verified Professional'}</div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                <Mail size={16} color="#64748b" /> {user?.email}
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                <Phone size={16} color="#64748b" /> {user?.phone || '+1 (555) 789-0123'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
