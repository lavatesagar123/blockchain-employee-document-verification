/**
 * Storage Service for Blockchain Employee Document Verification System
 * Handles localStorage persistence and initializes default seed data for development.
 * Designed to easily transition to Django REST Framework backend APIs.
 */

const STORAGE_KEYS = {
  USERS: 'verifychain_users',
  COMPANIES: 'verifychain_companies',
  AUTH_USER: 'verifychain_auth_user',
  TOKEN: 'verifychain_auth_token',
  ACTIVITY_LOGS: 'verifychain_activity_logs'
};

const DEFAULT_COMPANIES = [
  {
    id: 'comp-1',
    name: 'ABC Technologies',
    email: 'hr@abctechnologies.com',
    phone: '+1 (555) 234-5678',
    address: '100 Innovation Blvd, Tech Park, CA 94016',
    registrationNumber: 'REG-ABC-884920',
    website: 'https://abctechnologies.com',
    hrName: 'Amit Sharma',
    hrEmail: 'hr@abctechnologies.com',
    status: 'approved',
    approvedAt: '2026-04-26T10:15:00Z',
    remarks: 'Verified corporate registration and tax identification.',
    totalEmployees: 14,
    createdAt: '2026-04-26T09:30:00Z'
  },
  {
    id: 'comp-2',
    name: 'NextGen Corp',
    email: 'hr@nextgencorp.com',
    phone: '+1 (555) 987-6543',
    address: '450 Horizon Center, Austin, TX 78701',
    registrationNumber: 'REG-NGC-334190',
    website: 'https://nextgencorp.io',
    hrName: 'Priya Patel',
    hrEmail: 'hr@nextgencorp.com',
    status: 'pending',
    remarks: '',
    totalEmployees: 0,
    createdAt: '2026-04-28T14:15:00Z'
  },
  {
    id: 'comp-3',
    name: 'Global Solutions',
    email: 'info@globalsolutions.com',
    phone: '+1 (555) 345-6789',
    address: '88 Financial District, New York, NY 10005',
    registrationNumber: 'REG-GLS-112098',
    website: 'https://globalsolutions.com',
    hrName: 'Vikram Singh',
    hrEmail: 'info@globalsolutions.com',
    status: 'approved',
    approvedAt: '2026-04-25T12:00:00Z',
    remarks: 'Incorporation documents verified.',
    totalEmployees: 28,
    createdAt: '2026-04-25T11:00:00Z'
  },
  {
    id: 'comp-4',
    name: 'TechVision Ltd',
    email: 'contact@techvision.com',
    phone: '+1 (555) 432-1098',
    address: '12 Pioneer Way, Seattle, WA 98101',
    registrationNumber: 'REG-TVL-554102',
    website: 'https://techvision.com',
    hrName: 'Kavita Rao',
    hrEmail: 'contact@techvision.com',
    status: 'rejected',
    rejectedAt: '2026-04-23T15:20:00Z',
    remarks: 'Invalid business tax certificate provided. Please resubmit.',
    totalEmployees: 0,
    createdAt: '2026-04-23T10:00:00Z'
  },
  {
    id: 'comp-5',
    name: 'Innovation Labs',
    email: 'hr@innovationlabs.com',
    phone: '+1 (555) 765-4321',
    address: '707 Silicon Valley Rd, San Jose, CA 95112',
    registrationNumber: 'REG-INL-998822',
    website: 'https://innovationlabs.ai',
    hrName: 'Rohit Verma',
    hrEmail: 'hr@innovationlabs.com',
    status: 'approved',
    approvedAt: '2026-04-22T16:00:00Z',
    remarks: 'Government verification verified successfully.',
    totalEmployees: 8,
    createdAt: '2026-04-22T10:00:00Z'
  }
];

const DEFAULT_USERS = [
  {
    id: 'usr-admin-1',
    name: 'Super Admin',
    email: 'admin@verifychain.com',
    password: 'Admin@123',
    role: 'superadmin',
    companyId: null,
    companyName: 'VerifyChain Network',
    phone: '+1 (800) 555-0199',
    status: 'active',
    createdAt: '2026-04-20T10:00:00Z'
  },
  {
    id: 'usr-hr-1',
    name: 'Amit Sharma',
    email: 'hr@abctechnologies.com',
    password: 'Hr@123',
    role: 'hr',
    companyId: 'comp-1',
    companyName: 'ABC Technologies',
    phone: '+1 (555) 234-5678',
    status: 'active', // Company is approved
    createdAt: '2026-04-26T09:30:00Z'
  },
  {
    id: 'usr-hr-2',
    name: 'Priya Patel',
    email: 'hr@nextgencorp.com',
    password: 'Hr@123',
    role: 'hr',
    companyId: 'comp-2',
    companyName: 'NextGen Corp',
    phone: '+1 (555) 987-6543',
    status: 'pending', // Company is pending approval
    createdAt: '2026-04-28T14:15:00Z'
  },
  {
    id: 'usr-hr-3',
    name: 'Vikram Singh',
    email: 'info@globalsolutions.com',
    password: 'Hr@123',
    role: 'hr',
    companyId: 'comp-3',
    companyName: 'Global Solutions',
    phone: '+1 (555) 345-6789',
    status: 'active',
    createdAt: '2026-04-25T11:00:00Z'
  },
  {
    id: 'usr-emp-1',
    name: 'Rahul Verma',
    email: 'employee@abctechnologies.com',
    password: 'Employee@123',
    role: 'employee',
    employeeId: 'EMP-1001',
    designation: 'Software Engineer',
    companyId: 'comp-1',
    companyName: 'ABC Technologies',
    phone: '+1 (555) 789-0123',
    status: 'active',
    createdAt: '2026-04-27T08:45:00Z'
  },
  {
    id: 'usr-emp-2',
    name: 'Sneha Iyer',
    email: 'sneha@globalsolutions.com',
    password: 'Employee@123',
    role: 'employee',
    employeeId: 'EMP-1002',
    designation: 'Frontend Developer',
    companyId: 'comp-3',
    companyName: 'Global Solutions',
    phone: '+1 (555) 890-1234',
    status: 'active',
    createdAt: '2026-04-27T09:15:00Z'
  }
];

const DEFAULT_ACTIVITY_LOGS = [
  {
    id: 'act-1',
    action: 'Company Approved',
    description: 'Super Admin approved ABC Technologies registration',
    timestamp: '2026-04-26T10:15:00Z',
    performedBy: 'admin@verifychain.com'
  },
  {
    id: 'act-2',
    action: 'New Registration',
    description: 'NextGen Corp submitted registration request',
    timestamp: '2026-04-28T14:15:00Z',
    performedBy: 'hr@nextgencorp.com'
  }
];

// Initialize Storage with default seed data
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(DEFAULT_COMPANIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(DEFAULT_ACTIVITY_LOGS));
  }
};

// Users Helpers
export const getStoredUsers = () => {
  initializeStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

// Companies Helpers
export const getStoredCompanies = () => {
  initializeStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES)) || DEFAULT_COMPANIES;
  } catch {
    return DEFAULT_COMPANIES;
  }
};

export const saveCompanies = (companies) => {
  localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
};

// Auth Session Helpers
export const getStoredAuthUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveAuthSession = (user, token = 'jwt_mock_token_' + Date.now()) => {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const clearAuthSession = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

// Activity Logs Helper
export const logActivity = (action, description, performedBy) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: 'act-' + Date.now(),
      action,
      description,
      timestamp: new Date().toISOString(),
      performedBy
    });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs.slice(0, 50)));
  } catch (err) {
    console.error('Error logging activity', err);
  }
};

export const getStoredActivityLogs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    return raw ? JSON.parse(raw) : DEFAULT_ACTIVITY_LOGS;
  } catch {
    return DEFAULT_ACTIVITY_LOGS;
  }
};

// Reset storage to factory default seeds
export const resetToDefaultData = () => {
  localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(DEFAULT_COMPANIES));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(DEFAULT_ACTIVITY_LOGS));
};
