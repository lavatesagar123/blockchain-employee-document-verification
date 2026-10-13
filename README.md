# TrustDoc — Blockchain Employee Document Verification System

**Frontend Architecture & UI Client**

TrustDoc is an enterprise React.js frontend built with Vite, React Router DOM, and pure CSS, engineered for cryptographic issuance, auditing, and public verification of employment credentials (Offer Letters, Letters of Intent, Experience Letters, and Relieving Letters).

---

## 1. Technology Stack

- **Framework**: React.js 19 (JavaScript ESModules)
- **Bundler & Dev Server**: Vite 8
- **Routing**: React Router DOM 7
- **Icons**: Lucide React
- **State Management**: React Context API (`AuthContext`, `CompanyContext`, `ToastContext`)
- **Styling**: Vanilla CSS with curated TrustDoc design system (Emerald, Mint, Charcoal)
- **API Client**: Native Fetch API with centralized error extraction and network disconnect detection

> **Note**: No backend implementation (Django, Python, Node.js) is bundled in this repository. All frontend service functions are prepared for future Django REST Framework integration.

---

## 2. Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/lavatesagar123/blockchain-employee-document-verification.git

# Navigate into the project folder
cd blockchain-employee-document-verification

# Install dependencies
npm install
```

### Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Inside `.env`, configure your target Django REST backend URL:

```env
# Backend API Base URL (Django REST Framework)
VITE_API_BASE_URL=http://localhost:8000
```

### Running Locally

```bash
# Start Vite development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 3. Application Routes (21 Pages)

### Public Pages
| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Platform overview, blockchain hero, workflow pillars, quick verification entry |
| `/login` | `LoginPage` | Professional authentication with email, password show/hide, remember me, forgot password modal |
| `/roles` | `RoleSelectionPage` | Interactive overview of Super Admin, HR Admin, Employee, and Public Verifier |
| `/register-company` | `CompanyRegistrationPage` | Corporate registration form + Authorized HR details with field validation |
| `/register-employee` | `EmployeeRegistrationPage` | Talent registration with email, phone, role, and password confirmation |
| `/verify` | `PublicVerificationPage` | Public document verification portal with ID input, client-side SHA-256 file digestion |
| `/access-denied` | `AccessDeniedPage` | 403 Forbidden page for unauthorized role attempts |
| `/404` / `*` | `NotFoundPage` | 404 Not Found fallback page |

### Super Admin Pages
| Route | Component | Description |
|---|---|---|
| `/superadmin/dashboard` | `SuperAdminDashboard` | Live KPI cards (Companies, Pending, HR, Employees) and recent applications |
| `/superadmin/companies` | `CompanyManagementPage` | Enterprise directory with status tabs (All, Pending, Approved, Rejected, Suspended), auditing modals |
| `/superadmin/users` | `UserManagementPage` | Account oversight with role filters, detail modals, and activation/deactivation controls |
| `/superadmin/activity-logs` | `ActivityLogPage` | Security audit trail tracking ledger queries, approvals, and issuance actions |

### HR Administrator Pages
| Route | Component | Description |
|---|---|---|
| `/hr/dashboard` | `HRDashboard` | HR portal with Super Admin Approval Gate; unlocks full workspace upon corporate verification |
| `/hr/profile` | `CompanyProfilePage` | Corporate incorporation details, CIN, official email, phone, address, and edit modal |
| `/hr/employees` | `EmployeeManagementPage` | Company talent directory with search, filter, and employee onboarding modal |
| `/hr/issue-document` | `DocumentIssuancePage` | Form for issuing Offer Letters, LOIs, Experience Letters, Relieving Letters + Live Certificate Preview |
| `/hr/documents` | `IssuedDocumentsPage` | Complete registry of company-issued credentials with search, view details, and revocation dialog |

### Employee Pages
| Route | Component | Description |
|---|---|---|
| `/employee/dashboard` | `EmployeeDashboard` | Verified talent profile badge, credential overview, and quick verification link |
| `/employee/profile` | `EmployeeProfilePage` | Professional profile details and blockchain identity anchor status |
| `/employee/documents` | `MyDocumentsPage` | Portfolio table of issued credentials with download, share, and view actions |
| `/employee/documents/:id` | `DocumentDetailsPage` | Inspection view with certificate template, cryptographic ID, QR code area, print/PDF action |

---

## 4. Required Backend APIs (Django REST Framework)

The frontend service layer (`src/services/`) expects the following REST endpoints from the future Django backend:

### Authentication (`authService.js`)
- `POST /api/auth/login/` — Request: `{ email, password }` → Response: `{ token, user }`
- `POST /api/auth/logout/` — Request: `{}` → Response: `204 No Content`
- `GET /api/auth/me/` — Header: `Authorization: Bearer <token>` → Response: `{ id, name, email, role, company_id, company_status }`

### Organization Management (`companyService.js`)
- `POST /api/companies/register/` — Request: Company registration payload + HR user details
- `GET /api/companies/me/` — Response: Authorized company profile details
- `PATCH /api/companies/me/` — Request: `{ phone, address, website }`
- `GET /api/admin/companies/` — Params: `?status=pending&search=...&page=1`
- `GET /api/admin/companies/{id}/` — Response: Detailed company record
- `POST /api/admin/companies/{id}/approve/` — Request: `{ remarks }`
- `POST /api/admin/companies/{id}/reject/` — Request: `{ remarks }`
- `POST /api/admin/companies/{id}/suspend/` — Request: `{ remarks }`
- `POST /api/admin/companies/{id}/reactivate/` — Request: `{}`
- `GET /api/admin/companies/stats/` — Response: `{ total_companies, pending_companies, total_hr_users, total_employees }`

### Employee Management (`employeeService.js`)
- `POST /api/employees/register/` — Request: Employee account registration payload
- `GET /api/hr/employees/` — Params: `?search=...` → Response: List of company employees
- `POST /api/hr/employees/` — Request: `{ name, email, employee_id, designation, department, phone, joining_date }`
- `GET /api/hr/employees/{id}/` — Response: Single employee details
- `GET /api/employees/me/` — Response: Current employee personal profile
- `PATCH /api/employees/me/` — Request: `{ phone, designation }`

### Document Issuance & Verification (`documentService.js` & `verificationService.js`)
- `POST /api/documents/` — Request: `{ recipient_name, recipient_email, employee_id, document_type, designation, department, start_date, end_date, compensation, remarks }`
- `GET /api/documents/` — Params: `?type=...&status=...&search=...` (Company issued registry)
- `GET /api/employee/documents/` — Params: `?type=...&search=...` (Current employee documents)
- `GET /api/documents/{id}/` — Response: Full document metadata, transaction hash, block height
- `POST /api/documents/{id}/revoke/` — Request: `{ reason }`
- `GET /api/verification/{verificationId}/` — Response: Public verification receipt `{ status, issuer_name, document_type, recipient_name, issue_date, transaction_hash, file_hash, block_number }`
- `POST /api/verification/verify/` — Multipart FormData: `verification_id`, `document_file`

### Super Admin Oversight (`userService.js`)
- `GET /api/admin/users/` — Params: `?role=...&search=...`
- `GET /api/admin/users/{id}/` — Response: User details
- `POST /api/admin/users/{id}/status/` — Request: `{ status: 'active' | 'suspended' }`
- `GET /api/admin/activity-logs/` — Params: `?action=...&search=...`

---

## 5. Security & Verification Design

1. **No Simulated Data**: The frontend will never display a fake "Verified" or "Approved" badge without an authentic 200 OK response from the verification API.
2. **Honest Connection Errors**: If the backend is unreachable, clear connection diagnostics display the targeted endpoint and instructions to start the backend.
3. **Client-Side SHA-256**: When an optional file is provided on the public verification page, the client browser digests the file into a SHA-256 checksum using the Web Cryptography API (`crypto.subtle.digest`) before sending it for ledger comparison.
4. **Clean Print Support**: Certificates feature `@media print` stylesheets that strip navigation bars and headers, generating crisp corporate credentials.

---

## 6. License

This repository is private property and licensed for enterprise verification systems.
