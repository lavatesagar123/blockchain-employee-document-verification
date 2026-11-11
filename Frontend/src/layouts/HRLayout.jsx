import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Building, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { TopbarUserProfile } from '../components/TopbarUserProfile';

export const HRLayout = ({ title, subtitle, children }) => {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const companyStatus = user?.companyStatus || user?.companyDetails?.status || 'pending';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1>{title}</h1>
              {user?.companyName && (
                <span className="topbar-company-chip">
                  <Building size={13} />
                  <span>{user.companyName}</span>
                </span>
              )}
              <StatusBadge status={companyStatus} />
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="topbar-actions">
            <div className="topbar-date-chip">
              <Calendar size={14} />
              <span>{currentDate}</span>
            </div>

            <TopbarUserProfile />
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="dashboard-body">{children}</main>
      </div>
    </div>
  );
};
