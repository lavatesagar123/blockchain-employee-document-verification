# 🛡️ VerifyChain | Blockchain-Based Employee Document Verification System
## Authentication & Company Registration Module

> **Selected Design Foundation:** **Option 1 ("VerifyChain")** enriched with the interactive approval modals and card badges of **Option 2 ("TrustDoc")**.
> Built exclusively with **React.js**, **JavaScript**, **React Router DOM**, and modular **Vanilla CSS** (No TypeScript).

---

## 🌟 1. Why VerifyChain was Chosen as the Best Design

Between the two provided reference designs:
1. **Design 1 (VerifyChain)**: Features an industry-grade, 12-screen comprehensive architecture tailored for blockchain fintech:
   - Deep slate & emerald green color tokens (`#090e17`, `#0f172a`, `#10b981`)
   - Complete 12 wireframe states: Landing Page, Login, Role Selection, Company Registration, Employee Registration, Super Admin Dashboard, Company Approvals, HR Dashboard, Employee Dashboard, User Management, Access Denied (403), and 404 Not Found.
2. **Design 2 (TrustDoc)**: Features clean curved cards and interactive approval modal dialogs with review remarks.

**Best-of-Both Synthesis:**
We selected **VerifyChain** as the primary architectural identity because of its complete 12-screen scope and authentic decentralized ledger aesthetics, while incorporating **TrustDoc's interactive modal dialog** (allowing the Super Admin to write optional verification remarks when approving or mandatory reasons when rejecting).

---

## 🔑 2. Demo Login Credentials & Quick Switcher

For seamless development evaluation, a **1-Click Quick Role Switcher Bar** is pinned to the top of all pages, or you can manually enter these credentials on the [Login Page](http://localhost:5173/login):

| Role | Email | Password | Status & Purpose |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@verifychain.com` | `Admin@123` | Approves/rejects company applications, manages all users |
| **HR (Approved)** | `hr@abctechnologies.com` | `Hr@123` | **ABC Technologies** (Approved company — full HR portal access) |
| **HR (Pending Gate)** | `hr@nextgencorp.com` | `Hr@123` | **NextGen Corp** (Pending company — tests the approval gate) |
| **Employee** | `employee@abctechnologies.com` | `Employee@123` | **Rahul Verma** (Employee portal & credential dashboard) |

> 💡 **Reset Seeds Button:** Clicking **"Reset Seeds"** in the top demo bar restores `localStorage` back to factory demo state anytime.

---

## 🚀 3. Implemented Features & Workflows

### 1. Functional Authentication
- **Universal Login (`/login`)**: Supports Super Admin, HR, and Employee login with real-time credential verification and show/hide password toggles.
- **Session Persistence**: Page reloads preserve the authenticated user in `localStorage`.
- **Validation**: Clear inline field validations and banner alerts for invalid inputs or incorrect passwords.
- **Role Redirection**: Automatically directs users to their respective workspace upon login.
- **Logout**: Clears the active session and redirects securely.

### 2. Company Registration (`/register-company`)
- Complete company onboarding form:
  - **Company Details**: Name, Official Email, Phone, Corporate Address, Registration/CIN Number, Website.
  - **Authorized HR**: HR Name, HR Login Email, Password, Confirm Password.
- Automatically assigns status to **`Pending`**.
- Displays post-submission confirmation banner explaining that Super Admin approval is required.

### 3. Super Admin Company Auditing & Approval (`/superadmin/approvals`)
- Filter tabs: **All**, **Pending**, **Approved**, **Rejected**, with real-time search.
- **Approve Modal**: Enter optional verification remarks and confirm approval (unlocks HR portal).
- **Reject Modal**: Enter required rejection reason.
- **View Modal**: Inspect complete CIN number, corporate address, contact details, and timestamp.

### 4. HR Approval Gating (`/hr/dashboard`)
- If an HR's company is still **Pending** or **Rejected**, the HR dashboard displays a dedicated **Pending Verification Gate** blocking administrative actions.
- Includes a live **"Check Registration Status"** button that synchronizes immediately once the Super Admin approves the company.
- When **Approved**, unlocks the full workspace with employee statistics and corporate profile.

### 5. Employee Self-Registration (`/register-employee`) & Portal (`/employee/dashboard`)
- Full Name, Email, Phone, Password, and Confirm Password validation.
- Immediate access to the Employee Dashboard with personal ID (`EMP-XXXX`) and verifiable status.

### 6. Role-Based Access Control (RBAC) & Protected Routes
- Route guards (`ProtectedRoute.jsx`) strictly enforce role privileges.
- Unauthorized cross-role navigation is blocked and redirected to the **Access Denied (`/access-denied`)** page.
- Unauthenticated access to dashboard routes redirects to `/login`.

---

## 🛠️ 4. How to Run the Project

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to [http://localhost:5173](http://localhost:5173).

4. **Production Build Test**:
   ```bash
   npm run build
   ```

---

## 🔌 5. Django REST Framework (DRF) & MySQL Integration Guide

All API calls are cleanly abstracted inside [`src/services/api.js`](file:///d:/blockchain%20emp%20system/src/services/api.js). To switch from `localStorage` to your Django backend, simply update `api.js` to target your endpoints:

```javascript
// Example Django REST Framework integration in src/services/api.js
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  login: async ({ email, password }) => {
    const res = await axios.post(`${API_BASE}/auth/login/`, { email, password });
    return res.data;
  },
  registerCompany: async (formData) => {
    const res = await axios.post(`${API_BASE}/companies/register/`, formData);
    return res.data;
  },
  updateCompanyStatus: async (id, { status, remarks }) => {
    const res = await axios.patch(`${API_BASE}/companies/${id}/status/`, { status, remarks });
    return res.data;
  }
};
```
