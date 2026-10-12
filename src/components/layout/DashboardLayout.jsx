import React from 'react';
import { Sidebar } from '../common/Sidebar';
import { DemoBanner } from '../common/DemoBanner';
import { ShieldCheck, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = ({ title, subtitle, children }) => {
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
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="topbar-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem' }}>
              <Calendar size={15} />
              <span>{currentDate}</span>
            </div>

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer'
              }}
              title="Notifications"
            >
              <Bell size={18} />
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-body">
          {/* Helpful Demo Credentials switch bar in dev mode */}
          <DemoBanner />
          {children}
        </main>
      </div>
    </div>
  );
};
