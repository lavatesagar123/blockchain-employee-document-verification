import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  ShieldCheck,
  FileText,
  CheckCircle,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';
import '../../styles/dashboard.css';

export const EmployeeDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Employee Portal"
      subtitle="Your verified blockchain profile and employment document portfolio"
    >
      <div className="animate-fade-in">
        {/* Profile Card (Matches Wireframe 9) */}
        <div className="profile-overview-card">
          <div className="profile-main-info">
            <div className="profile-large-avatar">
              {user?.name?.substring(0, 2).toUpperCase() || 'EM'}
            </div>
            <div className="profile-text">
              <h2>{user?.name || 'Employee'}</h2>
              <p>{user?.designation || 'Software Engineer'} • {user?.companyName || 'Verified Professional'}</p>
              <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-active">{user?.employeeId || 'EMP-1001'}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{user?.email}</span>
              </div>
            </div>
          </div>
          <span className="badge badge-approved" style={{ fontSize: '0.85rem' }}>Active</span>
        </div>

        {/* Quick Stats Grid (Wireframe 9) */}
        <div className="stats-grid-3col">
          <div className="stat-metric-card" style={{ '--card-accent': '#0ea5e9' }}>
            <div>
              <div className="stat-info-title">Total Documents</div>
              <div className="stat-numeric-value">3</div>
            </div>
            <div className="stat-icon-wrapper stat-icon-blue">
              <FileText size={24} />
            </div>
          </div>

          <div className="stat-metric-card" style={{ '--card-accent': '#10b981' }}>
            <div>
              <div className="stat-info-title">Blockchain Verified</div>
              <div className="stat-numeric-value">3</div>
            </div>
            <div className="stat-icon-wrapper stat-icon-emerald">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="stat-metric-card" style={{ '--card-accent': '#f59e0b' }}>
            <div>
              <div className="stat-info-title">Pending Requests</div>
              <div className="stat-numeric-value">0</div>
            </div>
            <div className="stat-icon-wrapper stat-icon-amber">
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* Blockchain Status Banner (Wireframe 9 bottom) */}
        <div className="blockchain-status-alert">
          <ShieldCheck size={24} color="#10b981" style={{ flexShrink: 0 }} />
          <div>
            <strong>Immutable Credentials Active</strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
              Your credentials and employment history are cryptographically anchored on the blockchain network and instantly verifiable by prospective employers.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
