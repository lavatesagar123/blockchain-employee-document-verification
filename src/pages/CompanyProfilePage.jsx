import React, { useState, useEffect, useCallback } from 'react';
import { HRLayout } from '../layouts/HRLayout';
import { useAuth } from '../context/AuthContext';
import { companyService } from '../services/companyService';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit2,
  ExternalLink,
  User,
  ShieldCheck
} from 'lucide-react';
import '../styles/dashboard.css';

export const CompanyProfilePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    website: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getCompanyProfile();
      setCompany(data);
    } catch (err) {
      if (user?.companyDetails || user?.companyName) {
        setCompany({
          name: user.companyName,
          email: user.email,
          phone: user.phone || '—',
          address: 'Corporate Headquarters',
          registration_number: 'CIN-PENDING-AUDIT',
          status: user.companyStatus || 'pending',
          hr_name: user.name,
          hr_email: user.email
        });
      } else {
        setError(err.message || 'Failed to load company profile from API.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleOpenEdit = () => {
    if (company) {
      setEditForm({
        phone: company.phone || '',
        address: company.address || '',
        website: company.website || ''
      });
      setEditModalOpen(true);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await companyService.updateCompanyProfile(editForm);
      setCompany((prev) => ({ ...prev, ...updated }));
      addToast('Company profile updated successfully.', 'success');
      setEditModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRLayout
      title="Company Profile"
      subtitle="Corporate credentials & authorization status"
    >
      {loading ? (
        <LoadingState message="Fetching company profile from API..." />
      ) : error ? (
        <ErrorState
          title="Unable to Load Company Profile"
          message={error}
          onRetry={fetchProfile}
        />
      ) : company ? (
        <div className="animate-fade-in">
          {/* Overview Hero Card */}
          <div className="profile-overview-card">
            <div className="profile-main-info">
              <div className="profile-large-avatar hr">
                {company.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="profile-text">
                <h2>{company.name}</h2>
                <p>{company.address}</p>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge status={company.status} />
                  <span className="badge badge-neutral">
                    Authorized HR: {company.hr_name || company.hrName || user?.name}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenEdit}
              disabled={loading || !company}
              className="btn btn-outline-emerald btn-sm"
            >
              <Edit2 size={14} />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Incorporation Details Panel */}
          <div className="content-card-panel">
            <div className="panel-header-row">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Corporate Incorporation & Identity</h3>
            </div>

            <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
              <div className="form-group">
                <label>REGISTRATION NUMBER / CIN</label>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                  {company.registration_number || company.registrationNumber || '—'}
                </div>
              </div>

              <div className="form-group">
                <label>OFFICIAL EMAIL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <Mail size={16} color="#64748b" /> {company.email}
                </div>
              </div>

              <div className="form-group">
                <label>CORPORATE PHONE</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <Phone size={16} color="#64748b" /> {company.phone || '—'}
                </div>
              </div>

              <div className="form-group">
                <label>WEBSITE</label>
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
                <label>REGISTERED OFFICE ADDRESS</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <MapPin size={16} color="#64748b" /> {company.address}
                </div>
              </div>

              {company.remarks && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>SUPER ADMIN AUDIT REMARKS</label>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontSize: '0.9rem' }}>
                    {company.remarks}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Organization Details"
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
            label="Corporate Phone"
            name="phone"
            type="tel"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />

          <FormField
            label="Corporate Website"
            name="website"
            type="url"
            value={editForm.website}
            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
            placeholder="https://company.com"
          />

          <FormField
            label="Registered Address"
            name="address"
            type="textarea"
            rows={3}
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            placeholder="Complete street address"
          />
        </form>
      </Modal>
    </HRLayout>
  );
};
