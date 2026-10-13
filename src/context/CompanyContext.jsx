import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  const loadData = useCallback(async () => {
    // Only attempt to fetch admin lists if authenticated as superadmin
    if (!isAuthenticated || user?.role !== 'superadmin') {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [compsRes, statsRes] = await Promise.allSettled([
        companyService.getCompanies(),
        companyService.getCompanyStats()
      ]);

      if (compsRes.status === 'fulfilled') {
        const list = Array.isArray(compsRes.value) ? compsRes.value : compsRes.value?.results || [];
        setCompanies(list);
      } else {
        setError(compsRes.reason?.message || 'Failed to fetch companies list');
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approveCompany = async (companyId, remarks = '') => {
    const updated = await companyService.approveCompany(companyId, remarks);
    await loadData();
    return updated;
  };

  const rejectCompany = async (companyId, remarks = '') => {
    const updated = await companyService.rejectCompany(companyId, remarks);
    await loadData();
    return updated;
  };

  const registerCompany = async (formData) => {
    return await companyService.registerCompany(formData);
  };

  const registerEmployee = async (formData) => {
    return await employeeService.registerEmployee(formData);
  };

  const value = {
    companies,
    stats,
    loading,
    error,
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
