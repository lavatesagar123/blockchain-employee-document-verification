import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './LoadingState';

export const ProtectedRoute = ({ children, allowedRoles = [], requireApprovedCompany = false }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <LoadingState message="Verifying session with authentication service..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/access-denied" replace />;
  }

  // Only an approved company should receive access to HR operational features
  if (requireApprovedCompany && user?.role === 'hr') {
    const status = user?.companyStatus || user?.companyDetails?.status || 'pending';
    if (status !== 'approved') {
      return <Navigate to="/hr/dashboard" replace state={{ pendingNotice: true }} />;
    }
  }

  return children;
};
