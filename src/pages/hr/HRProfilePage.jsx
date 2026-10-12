import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileCheck2,
  ShieldCheck,
  Calendar,
  ExternalLink
} from 'lucide-react';
import '../../styles/dashboard.css';

export const HRProfilePage = () => {
  const { user } = useAuth();
  const { companies } = useCompany();

  const company = companies.find((c) => c.id === user?.companyId) || user?.companyDetails || {
    name: user?.companyName || 'Enterprise',
    email: user?.email,
    phone: user?.phone || '+1 (555) 000-0000',
    address: 'Corporate Headquarters',
    registrationNumber: 'REG-PENDING',
    status: user?.companyStatus || 'pending'
  };

  return (
    <DashboardLayout
      title="Company Profile"
      subtitle="Corporate identity and blockchain registration credentials"
    >
      <div className="animate-fade-in">
        {/* Profile Card Header */}
        <div className="profile-overview-card">
          <div className="profile-main-info">
            <div className="profile-large-avatar hr">
              {company.name?.substring(0, 2).toUpperCase()}
            </div>
            <div className="profile-text">
              <h2>{company.name}</h2>
              <p>{company.address}</p>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge badge-${company.status === 'approved' ? 'approved' : company.status === 'pending' ? 'pending' : 'rejected'}`}>
                  Status: {company.status}
                </span>
                <span className="badge badge-role">HR Representative: {user?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Panel */}
        <div className="content-card-panel">
          <div className="panel-header-row">
            <h3>Incorporation & Registration Details</h3>
          </div>

          <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Registration Number / CIN</label>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                {company.registrationNumber}
              </div>
            </div>

            <div className="form-group">
              <label>Official Corporate Email</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <Mail size={16} color="#64748b" /> {company.email}
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <Phone size={16} color="#64748b" /> {company.phone}
              </div>
            </div>

            <div className="form-group">
              <label>Official Website</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={16} color="#64748b" />
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {company.website} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Corporate Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <MapPin size={16} color="#64748b" /> {company.address}
              </div>
            </div>

            {company.remarks && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Super Admin Audit Notes</label>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155' }}>
                  {company.remarks}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
