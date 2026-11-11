import React from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { HRLayout } from '../../layouts/HRLayout';
import { EmployeeLayout } from '../../layouts/EmployeeLayout';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = ({ title, subtitle, actions, children }) => {
  const { user } = useAuth();

  if (user?.role === 'superadmin') {
    return (
      <AdminLayout title={title} subtitle={subtitle} actions={actions}>
        {children}
      </AdminLayout>
    );
  }

  if (user?.role === 'hr') {
    return (
      <HRLayout title={title} subtitle={subtitle} actions={actions}>
        {children}
      </HRLayout>
    );
  }

  return (
    <EmployeeLayout title={title} subtitle={subtitle} actions={actions}>
      {children}
    </EmployeeLayout>
  );
};
