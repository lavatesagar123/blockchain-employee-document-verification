import React from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Ban
} from 'lucide-react';

export const StatusBadge = ({ status = 'pending', className = '', showIcon = true }) => {
  const normalized = (status || '').toLowerCase().trim();

  const getBadgeConfig = () => {
    switch (normalized) {
      case 'approved':
      case 'active':
        return {
          label: 'Approved',
          badgeClass: 'badge-approved',
          icon: CheckCircle
        };
      case 'pending':
        return {
          label: 'Pending Review',
          badgeClass: 'badge-pending',
          icon: Clock
        };
      case 'rejected':
        return {
          label: 'Rejected',
          badgeClass: 'badge-rejected',
          icon: XCircle
        };
      case 'suspended':
        return {
          label: 'Suspended',
          badgeClass: 'badge-rejected',
          icon: Ban
        };
      case 'verified':
        return {
          label: 'Verified on Blockchain',
          badgeClass: 'badge-approved',
          icon: ShieldCheck
        };
      case 'revoked':
        return {
          label: 'Revoked',
          badgeClass: 'badge-rejected',
          icon: AlertTriangle
        };
      case 'modified':
      case 'tampered':
        return {
          label: 'Document Modified / Tampered',
          badgeClass: 'badge-rejected',
          icon: ShieldAlert
        };
      case 'unverified':
      case 'issuer_unverified':
        return {
          label: 'Issuer Unverified',
          badgeClass: 'badge-pending',
          icon: HelpCircle
        };
      default:
        return {
          label: status || 'Unknown',
          badgeClass: 'badge-neutral',
          icon: Clock
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span className={`badge ${config.badgeClass} ${className}`}>
      {showIcon && <Icon size={13} className="badge-icon" />}
      <span>{config.label}</span>
    </span>
  );
};
