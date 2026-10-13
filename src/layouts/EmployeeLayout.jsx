import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmployeeLayout = ({ title, subtitle, actions = null, children }) => {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1>{title}</h1>
              <span className="badge badge-approved" style={{ fontSize: '0.72rem' }}>
                <ShieldCheck size={12} />
                <span>Verified Talent</span>
              </span>
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="topbar-actions">
            {actions}

            <div className="topbar-date-chip">
              <Calendar size={14} />
              <span>{currentDate}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="dashboard-body">{children}</main>
      </div>
    </div>
  );
};
