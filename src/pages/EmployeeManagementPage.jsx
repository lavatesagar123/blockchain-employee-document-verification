import React, { useState, useEffect, useCallback } from 'react';
import { HRLayout } from '../layouts/HRLayout';
import { employeeService } from '../services/employeeService';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { getInitials, formatDate } from '../utils/formatters';
import { isValidEmail } from '../utils/validators';
import {
  Users,
  UserPlus,
  Search,
  Eye
} from 'lucide-react';
import '../styles/dashboard.css';

export const EmployeeManagementPage = () => {
  const { addToast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Employee Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    employee_id: '',
    designation: '',
    department: '',
    phone: '',
    joining_date: ''
  });
  const [addErrors, setAddErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // View Modal
  const [viewEmployee, setViewEmployee] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeeService.getEmployees({
        search: searchQuery.trim() || undefined
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      setEmployees(list);
    } catch (err) {
      setError(err.message || 'Failed to retrieve employee directory from API.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const validateAddForm = () => {
    const errs = {};
    if (!addForm.name.trim()) errs.name = 'Full name is required';
    if (!addForm.email.trim()) {
      errs.email = 'Work email is required';
    } else if (!isValidEmail(addForm.email.trim())) {
      errs.email = 'Enter a valid work email';
    }
    if (!addForm.designation.trim()) errs.designation = 'Designation/role is required';
    if (!addForm.employee_id.trim()) errs.employee_id = 'Employee ID is required';

    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    setSaving(true);
    try {
      await employeeService.createEmployee(addForm);
      addToast(`Employee '${addForm.name}' onboarded successfully.`, 'success');
      setAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        employee_id: '',
        designation: '',
        department: '',
        phone: '',
        joining_date: ''
      });
      fetchEmployees();
    } catch (err) {
      addToast(err.message || 'Failed to add employee.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRLayout
      title="Employees"
      subtitle="Talent directory & workforce onboarding"
      actions={
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <UserPlus size={15} />
          <span>Add Employee</span>
        </button>
      }
    >
      <div className="content-card-panel animate-fade-in">
        {/* Search & Header */}
        <div className="panel-header-row">
          <div style={{ position: 'relative', width: '320px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              className="form-control"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: '38px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Workforce: <strong>{employees.length}</strong> active members
          </div>
        </div>

        {/* Directory Table */}
        {loading ? (
          <LoadingState message="Loading workforce directory from API..." />
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorState
              title="Unable to Load Employees"
              message={error}
              onRetry={fetchEmployees}
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                      <Users size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0 }}>No employees found in company directory.</p>
                      <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="btn btn-outline-emerald btn-sm"
                        style={{ marginTop: '0.85rem' }}
                      >
                        <UserPlus size={14} /> Onboard New Employee
                      </button>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id || emp.employee_id || emp.email}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#0ea5e9',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', display: 'block' }}>{emp.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral font-mono">
                          {emp.employee_id || emp.employeeId || 'EMP-—'}
                        </span>
                      </td>
                      <td>{emp.designation || 'Specialist'}</td>
                      <td>{emp.department || 'General'}</td>
                      <td>
                        <StatusBadge status={emp.status || 'active'} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewEmployee(emp)}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Onboard New Employee"
        maxWidth="600px"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateEmployee}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Add Employee'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateEmployee}>
          <div className="form-grid-2col">
            <FormField
              label="Full Name"
              name="name"
              placeholder="e.g. Alex Morgan"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              error={addErrors.name}
              required
            />

            <FormField
              label="Work Email"
              name="email"
              type="email"
              placeholder="alex@company.com"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              error={addErrors.email}
              required
            />
          </div>

          <div className="form-grid-2col">
            <FormField
              label="Employee ID / Roll"
              name="employee_id"
              placeholder="e.g. EMP-2041"
              value={addForm.employee_id}
              onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value })}
              error={addErrors.employee_id}
              required
            />

            <FormField
              label="Designation / Role"
              name="designation"
              placeholder="e.g. Software Engineer"
              value={addForm.designation}
              onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
              error={addErrors.designation}
              required
            />
          </div>

          <div className="form-grid-2col">
            <FormField
              label="Department"
              name="department"
              placeholder="e.g. Engineering / Product"
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
            />

            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
            />
          </div>

          <FormField
            label="Joining Date"
            name="joining_date"
            type="date"
            value={addForm.joining_date}
            onChange={(e) => setAddForm({ ...addForm, joining_date: e.target.value })}
          />
        </form>
      </Modal>

      {/* View Employee Modal */}
      <Modal
        isOpen={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        title="Employee Information"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setViewEmployee(null)}
          >
            Close
          </button>
        }
      >
        {viewEmployee && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#0ea5e9',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 700
                }}
              >
                {getInitials(viewEmployee.name)}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{viewEmployee.name}</h4>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{viewEmployee.designation}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>EMPLOYEE ID</span>
                <strong className="font-mono">{viewEmployee.employee_id || viewEmployee.employeeId || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>WORK EMAIL</span>
                <strong>{viewEmployee.email}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>DEPARTMENT</span>
                <span>{viewEmployee.department || 'General'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>PHONE</span>
                <span>{viewEmployee.phone || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>JOINING DATE</span>
                <span>{formatDate(viewEmployee.joining_date || viewEmployee.created_at)}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>STATUS</span>
                <StatusBadge status={viewEmployee.status || 'active'} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </HRLayout>
  );
};
