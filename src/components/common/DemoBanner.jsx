import React from 'react';
import { Shield, Building, User, Clock, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import { resetToDefaultData } from '../../services/storageService';
import { useNavigate } from 'react-router-dom';

export const DemoBanner = () => {
  const { switchDemoRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleQuickLogin = async (email, password, label, targetPath) => {
    try {
      const authUser = await switchDemoRole(email, password);
      addToast(`Logged in as ${label} (${authUser.email})`, 'success');
      navigate(targetPath);
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data (companies, users, approvals) to original default state?')) {
      resetToDefaultData();
      addToast('Demo database reset to original defaults! Reloading...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  };

  return (
    <div className="demo-credentials-bar animate-fade-in">
      <div className="demo-title-chip">
        <Sparkles size={16} />
        <span>Development Demo Mode • Quick Role Switcher</span>
      </div>

      <div className="demo-buttons-group">
        <button
          type="button"
          className="demo-btn-pill"
          onClick={() => handleQuickLogin('admin@verifychain.com', 'Admin@123', 'Super Admin', '/superadmin/dashboard')}
          title="Login as Super Admin (Approves Companies)"
        >
          <Shield size={14} color="#10b981" />
          Super Admin
        </button>

        <button
          type="button"
          className="demo-btn-pill"
          onClick={() => handleQuickLogin('hr@abctechnologies.com', 'Hr@123', 'HR Admin (Approved)', '/hr/dashboard')}
          title="Login as Approved Company HR"
        >
          <Building size={14} color="#38bdf8" />
          HR (Approved)
        </button>

        <button
          type="button"
          className="demo-btn-pill"
          onClick={() => handleQuickLogin('hr@nextgencorp.com', 'Hr@123', 'HR Admin (Pending Review)', '/hr/dashboard')}
          title="Login as HR with Pending Company Approval"
        >
          <Clock size={14} color="#f59e0b" />
          HR (Pending Gate)
        </button>

        <button
          type="button"
          className="demo-btn-pill"
          onClick={() => handleQuickLogin('employee@abctechnologies.com', 'Employee@123', 'Employee', '/employee/dashboard')}
          title="Login as Verified Employee"
        >
          <User size={14} color="#c084fc" />
          Employee
        </button>

        <button
          type="button"
          className="demo-btn-pill"
          onClick={handleResetData}
          style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          title="Reset localStorage data to original seeds"
        >
          <RotateCcw size={13} color="#f87171" />
          Reset Seeds
        </button>
      </div>
    </div>
  );
};
