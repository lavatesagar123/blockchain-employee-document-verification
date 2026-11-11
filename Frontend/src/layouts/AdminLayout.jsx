import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/apiClient';
import { TopbarUserProfile } from '../components/TopbarUserProfile';

export const AdminLayout = ({ title, subtitle, children }) => {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1>{title}</h1>
              <span className="badge badge-approved" style={{ fontSize: '0.72rem' }}>
                Super Admin Area
              </span>
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="topbar-actions">
            <div className="topbar-date-chip">
              <Calendar size={14} />
              <span>{currentDate}</span>
            </div>

            <TopbarUserProfile />

            <div className="topbar-api-chip" title={`Connected API endpoint: ${API_BASE_URL}`}>
              <div className="pulse-dot-green" />
              <span>API: {API_BASE_URL.replace(/^https?:\/\//, '')}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="dashboard-body">{children}</main>
      </div>
    </div>
  );
};
