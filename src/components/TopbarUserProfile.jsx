import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';

export const TopbarUserProfile = () => {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel =
    user.role === 'superadmin'
      ? 'Platform Admin'
      : user.role === 'hr'
      ? 'HR Administrator'
      : user.role === 'employee'
      ? 'Verified Employee'
      : (user.role || 'User');

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="topbar-user-profile" title={`Signed in as: ${user.email || displayName} (${roleLabel})`}>
      <div className="topbar-avatar" aria-label="User avatar">
        {getInitials(displayName)}
      </div>
      <div className="topbar-user-info">
        <span className="topbar-user-name">{displayName}</span>
        <span className="topbar-user-role">{roleLabel}</span>
      </div>
    </div>
  );
};
