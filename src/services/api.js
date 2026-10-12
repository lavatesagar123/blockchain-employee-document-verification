/**
 * Mock REST API Service mimicking Django REST Framework endpoints.
 * All functions return Promises to simulate asynchronous network requests.
 * Can be easily swapped with Axios or Fetch against Django REST backend:
 * e.g., const API_BASE = 'http://localhost:8000/api';
 */

import {
  getStoredUsers,
  saveUsers,
  getStoredCompanies,
  saveCompanies,
  logActivity,
  getStoredActivityLogs
} from './storageService';

const SIMULATED_DELAY_MS = 250;

const delay = (ms = SIMULATED_DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  /**
   * POST /api/auth/login/
   * Validates user credentials, checks company approval if HR, and returns session payload
   */
  login: async ({ email, password }) => {
    await delay();
    const users = getStoredUsers();
    const companies = getStoredCompanies();

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      throw new Error('No account found with this email address. Please check or register.');
    }

    if (user.password !== password) {
      throw new Error('Invalid password. Please verify your credentials and try again.');
    }

    // Role-specific company status sync
    let companyStatus = 'active';
    let companyInfo = null;

    if (user.role === 'hr' && user.companyId) {
      companyInfo = companies.find((c) => c.id === user.companyId);
      if (companyInfo) {
        companyStatus = companyInfo.status;
      }
    }

    const authPayload = {
      ...user,
      companyStatus: companyStatus,
      companyDetails: companyInfo,
      token: 'jwt_mock_' + btoa(user.email + ':' + Date.now())
    };

    logActivity('User Login', `User ${user.email} (${user.role}) logged in.`, user.email);

    return authPayload;
  },

  /**
   * POST /api/companies/register/
   * Registers a new company with 'pending' status and creates associated HR admin account
   */
  registerCompany: async (formData) => {
    await delay();
    const users = getStoredUsers();
    const companies = getStoredCompanies();

    const officialEmail = formData.email.trim().toLowerCase();
    const hrEmail = (formData.hrEmail || formData.email).trim().toLowerCase();

    // Check email collisions
    if (companies.some((c) => c.email.toLowerCase() === officialEmail)) {
      throw new Error('A company with this official email is already registered.');
    }
    if (users.some((u) => u.email.toLowerCase() === hrEmail)) {
      throw new Error('An account with this HR email already exists.');
    }

    // Check registration number collision
    if (companies.some((c) => c.registrationNumber.toLowerCase() === formData.registrationNumber.trim().toLowerCase())) {
      throw new Error('A company with this registration number is already registered.');
    }

    const newCompanyId = 'comp-' + Date.now();
    const newUserId = 'usr-hr-' + Date.now();

    const newCompany = {
      id: newCompanyId,
      name: formData.name.trim(),
      email: officialEmail,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      registrationNumber: formData.registrationNumber.trim(),
      website: formData.website ? formData.website.trim() : '',
      hrName: formData.hrName.trim(),
      hrEmail: hrEmail,
      status: 'pending', // Starts in pending state for Super Admin review
      remarks: '',
      totalEmployees: 0,
      createdAt: new Date().toISOString()
    };

    const newHrUser = {
      id: newUserId,
      name: formData.hrName.trim(),
      email: hrEmail,
      password: formData.password,
      role: 'hr',
      companyId: newCompanyId,
      companyName: formData.name.trim(),
      phone: formData.phone.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    companies.unshift(newCompany);
    users.push(newHrUser);

    saveCompanies(companies);
    saveUsers(users);

    logActivity('Company Registration', `New company '${newCompany.name}' registered (Pending Approval).`, hrEmail);

    return {
      company: newCompany,
      user: newHrUser,
      message: 'Company registration submitted successfully. Super Admin approval is pending.'
    };
  },

  /**
   * POST /api/employees/register/
   * Registers a new employee account
   */
  registerEmployee: async (formData) => {
    await delay();
    const users = getStoredUsers();
    const email = formData.email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists.');
    }

    const newUserId = 'usr-emp-' + Date.now();
    const newEmployee = {
      id: newUserId,
      name: formData.name.trim(),
      email: email,
      password: formData.password,
      role: 'employee',
      phone: formData.phone ? formData.phone.trim() : '',
      employeeId: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      designation: formData.designation || 'Software Engineer',
      companyId: formData.companyId || null,
      companyName: formData.companyName || 'Independent / Verified Talent',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    users.push(newEmployee);
    saveUsers(users);

    logActivity('Employee Registration', `New employee '${newEmployee.name}' registered.`, email);

    return {
      user: newEmployee,
      message: 'Employee account created successfully! You can now log in.'
    };
  },

  /**
   * GET /api/companies/
   * Returns list of all companies
   */
  getCompanies: async () => {
    await delay(150);
    return getStoredCompanies();
  },

  /**
   * GET /api/companies/:id/
   */
  getCompanyById: async (id) => {
    await delay(150);
    const companies = getStoredCompanies();
    const found = companies.find((c) => c.id === id);
    if (!found) throw new Error('Company not found');
    return found;
  },

  /**
   * PATCH /api/companies/:id/status/
   * Super Admin approves or rejects a company registration
   */
  updateCompanyStatus: async (companyId, { status, remarks = '', adminEmail = 'admin@verifychain.com' }) => {
    await delay();
    const companies = getStoredCompanies();
    const users = getStoredUsers();

    const companyIndex = companies.findIndex((c) => c.id === companyId);
    if (companyIndex === -1) {
      throw new Error('Company not found.');
    }

    const company = companies[companyIndex];
    company.status = status;
    company.remarks = remarks;
    if (status === 'approved') {
      company.approvedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      company.rejectedAt = new Date().toISOString();
    }

    companies[companyIndex] = company;
    saveCompanies(companies);

    // Sync HR user status
    const updatedUsers = users.map((u) => {
      if (u.companyId === companyId && u.role === 'hr') {
        return {
          ...u,
          status: status === 'approved' ? 'active' : status
        };
      }
      return u;
    });
    saveUsers(updatedUsers);

    logActivity(
      `Company ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Company '${company.name}' was ${status} by ${adminEmail}. Remarks: ${remarks || 'None'}`,
      adminEmail
    );

    return company;
  },

  /**
   * GET /api/users/
   * Returns all users (for Super Admin user management)
   */
  getUsers: async () => {
    await delay(150);
    return getStoredUsers();
  },

  /**
   * GET /api/dashboard/stats/
   */
  getSystemStats: async () => {
    await delay(100);
    const companies = getStoredCompanies();
    const users = getStoredUsers();

    const totalCompanies = companies.length;
    const pendingApproval = companies.filter((c) => c.status === 'pending').length;
    const approvedCompanies = companies.filter((c) => c.status === 'approved').length;
    const rejectedCompanies = companies.filter((c) => c.status === 'rejected').length;

    const totalHr = users.filter((u) => u.role === 'hr').length;
    const totalEmployees = users.filter((u) => u.role === 'employee').length;

    return {
      totalCompanies,
      pendingApproval,
      approvedCompanies,
      rejectedCompanies,
      totalHr,
      totalEmployees,
      totalUsers: users.length
    };
  },

  /**
   * GET /api/activity-logs/
   */
  getActivityLogs: async () => {
    await delay(100);
    return getStoredActivityLogs();
  }
};
