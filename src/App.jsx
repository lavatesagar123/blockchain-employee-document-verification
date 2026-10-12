import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { ToastProvider } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public & Auth Pages (Wireframes 1 - 5)
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RoleSelectPage } from './pages/RoleSelectPage';
import { CompanyRegisterPage } from './pages/CompanyRegisterPage';
import { EmployeeRegisterPage } from './pages/EmployeeRegisterPage';

// Super Admin Pages (Wireframes 6, 7, 10)
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { CompanyApprovalPage } from './pages/superadmin/CompanyApprovalPage';
import { UserManagementPage } from './pages/superadmin/UserManagementPage';

// HR Pages (Wireframe 8)
import { HRDashboard } from './pages/hr/HRDashboard';
import { HRProfilePage } from './pages/hr/HRProfilePage';

// Employee Pages (Wireframe 9)
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeProfilePage } from './pages/employee/EmployeeProfilePage';

// Fallback & RBAC Error Pages (Wireframes 11, 12)
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
              {/* Public & Onboarding Flow */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/roles" element={<RoleSelectPage />} />
              <Route path="/register-company" element={<CompanyRegisterPage />} />
              <Route path="/register-employee" element={<EmployeeRegisterPage />} />

              {/* Super Admin Area (Protected) */}
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/approvals"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <CompanyApprovalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/users"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* HR / Company Admin Area (Protected) */}
              <Route
                path="/hr/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/profile"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <HRProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Employee Area (Protected) */}
              <Route
                path="/employee/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/profile"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Error & Security Pages */}
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
