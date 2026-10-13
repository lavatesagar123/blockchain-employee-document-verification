import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages (1 - 8)
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { CompanyRegistrationPage } from './pages/CompanyRegistrationPage';
import { EmployeeRegistrationPage } from './pages/EmployeeRegistrationPage';
import { PublicVerificationPage } from './pages/PublicVerificationPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Super Admin Pages (9 - 12)
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { CompanyManagementPage } from './pages/CompanyManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ActivityLogPage } from './pages/ActivityLogPage';

// HR Pages (13 - 17)
import { HRDashboard } from './pages/HRDashboard';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { EmployeeManagementPage } from './pages/EmployeeManagementPage';
import { DocumentIssuancePage } from './pages/DocumentIssuancePage';
import { IssuedDocumentsPage } from './pages/IssuedDocumentsPage';

// Employee Pages (18 - 21)
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { MyDocumentsPage } from './pages/MyDocumentsPage';
import { DocumentDetailsPage } from './pages/DocumentDetailsPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/roles" element={<RoleSelectionPage />} />
              <Route path="/register-company" element={<CompanyRegistrationPage />} />
              <Route path="/register-employee" element={<EmployeeRegistrationPage />} />
              <Route path="/verify" element={<PublicVerificationPage />} />
              <Route path="/verify-document" element={<PublicVerificationPage />} />

              {/* Super Admin Protected Pages */}
              <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/companies"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <CompanyManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/approvals"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <CompanyManagementPage />
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
              <Route
                path="/superadmin/activity-logs"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <ActivityLogPage />
                  </ProtectedRoute>
                }
              />

              {/* HR / Company Admin Protected Pages */}
              <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
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
                    <CompanyProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/employees"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <EmployeeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/issue-document"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <DocumentIssuancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/documents"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <IssuedDocumentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Employee Protected Pages */}
              <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
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
              <Route
                path="/employee/documents"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <MyDocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/documents/:id"
                element={
                  <ProtectedRoute allowedRoles={['employee', 'hr', 'superadmin']}>
                    <DocumentDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents/:id"
                element={
                  <ProtectedRoute allowedRoles={['employee', 'hr', 'superadmin']}>
                    <DocumentDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Error and Fallback Pages */}
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
