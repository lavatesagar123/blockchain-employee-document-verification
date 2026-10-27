import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeLayout } from '../layouts/EmployeeLayout';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { useToast } from '../components/Toast';
import { getInitials } from '../utils/formatters';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  ShieldCheck,
  Edit2,
  Hash
} from 'lucide-react';
import '../styles/dashboard.css';

export const EmployeeProfilePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', designation: '' });
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.getEmployeeProfile();
      setProfile(data);
    } catch (err) {
      if (user) {
        setProfile(user);
      } else {
        setError(err.message || 'Unable to retrieve employee profile from API.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleOpenEdit = () => {
    if (profile) {
      setEditForm({
        phone: profile.phone || '',
        designation: profile.designation || ''
      });
      setEditModalOpen(true);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await employeeService.updateEmployeeProfile(editForm);
      setProfile((prev) => ({ ...prev, ...updated }));
      addToast('Profile updated successfully.', 'success');
      setEditModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.name || user?.name || 'Employee';

  return (
    <EmployeeLayout
      title="Profile"
      subtitle="Identity & credential details"
    >
      {loading ? (
        <LoadingState message="Loading your profile credentials..." />
      ) : error ? (
        <ErrorState
          title="Unable to Load Profile"
          message={error}
          onRetry={fetchProfile}
        />
      ) : profile ? (
        <div className="animate-fade-in">
          {/* Overview Hero Card */}
          <div className="profile-overview-card">
            <div className="profile-main-info">
              <div className="profile-large-avatar">
                {getInitials(displayName)}
              </div>
              <div className="profile-text">
                <h2>{displayName}</h2>
                <p>
                  {profile.designation || 'Software Engineer'} •{' '}
                  {profile.company_name || profile.companyName || 'Verified Professional'}
                </p>
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge status="active" />
                  <span className="badge badge-neutral font-mono">
                    {profile.employee_id || profile.employeeId || 'EMP-1001'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenEdit}
              disabled={loading || !profile}
              className="btn btn-outline-emerald btn-sm"
            >
              <Edit2 size={14} />
              <span>Edit Info</span>
            </button>
          </div>

          {/* Detailed Info Panel */}
          <div className="content-card-panel">
            <div className="panel-header-row">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Verified Profile Details</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                <ShieldCheck size={16} /> Identity Anchored on Ledger
              </div>
            </div>

            <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
              <div className="form-group">
                <label>FULL LEGAL NAME</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                  {profile.name}
                </div>
              </div>

              <div className="form-group">
                <label>EMPLOYEE ID</label>
                <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0ea5e9' }}>
                  {profile.employee_id || profile.employeeId || 'EMP-1001'}
                </div>
              </div>

              <div className="form-group">
                <label>DESIGNATION / ROLE</label>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>
                  {profile.designation || 'Specialist'}
                </div>
              </div>

              <div className="form-group">
                <label>AFFILIATED ORGANIZATION</label>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>
                  {profile.company_name || profile.companyName || 'Independent Talent'}
                </div>
              </div>

              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                  <Mail size={16} color="#64748b" /> {profile.email}
                </div>
              </div>

              <div className="form-group">
                <label>PHONE NUMBER</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                  <Phone size={16} color="#64748b" /> {profile.phone || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update Profile Information"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit}>
          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />

          <FormField
            label="Current Designation"
            name="designation"
            value={editForm.designation}
            onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
            placeholder="e.g. Senior Software Engineer"
          />
        </form>
      </Modal>
    </EmployeeLayout>
  );
};
