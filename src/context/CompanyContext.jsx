import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    pendingApproval: 0,
    approvedCompanies: 0,
    rejectedCompanies: 0,
    totalHr: 0,
    totalEmployees: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [comps, usrs, st] = await Promise.all([
        api.getCompanies(),
        api.getUsers(),
        api.getSystemStats()
      ]);
      setCompanies(comps);
      setUsersList(usrs);
      setStats(st);
    } catch (err) {
      console.error('Failed to load company & system data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approveCompany = async (companyId, remarks = '') => {
    const updated = await api.updateCompanyStatus(companyId, {
      status: 'approved',
      remarks
    });
    await loadData();
    refreshUser();
    return updated;
  };

  const rejectCompany = async (companyId, remarks = '') => {
    const updated = await api.updateCompanyStatus(companyId, {
      status: 'rejected',
      remarks
    });
    await loadData();
    refreshUser();
    return updated;
  };

  const registerCompany = async (formData) => {
    const res = await api.registerCompany(formData);
    await loadData();
    return res;
  };

  const registerEmployee = async (formData) => {
    const res = await api.registerEmployee(formData);
    await loadData();
    return res;
  };

  const value = {
    companies,
    usersList,
    stats,
    loading,
    refreshData: loadData,
    approveCompany,
    rejectCompany,
    registerCompany,
    registerEmployee
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
