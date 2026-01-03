'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner, { ButtonSpinner } from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { employeeService } from '../../services/api';

export default function AdminEmployeesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryData, setSalaryData] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        fetchEmployees();
      }
    }
  }, [authLoading, user, isAdmin]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll();
      if (response.success) {
        setEmployees(response.employees || response.profiles || []);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const openSalaryModal = (employee) => {
    setSelectedEmployee(employee);
    setSalaryData({
      basic: employee.salaryStructure?.basic || 0,
      hra: employee.salaryStructure?.hra || 0,
      allowances: employee.salaryStructure?.allowances || 0,
      deductions: employee.salaryStructure?.deductions || 0,
      // Additional breakdown
      standardAllowance: employee.salaryStructure?.standardAllowance || 0,
      performanceBonus: employee.salaryStructure?.performanceBonus || 0,
      leaveTravel: employee.salaryStructure?.leaveTravel || 0,
      fixedAllowance: employee.salaryStructure?.fixedAllowance || 0,
      pfContribution: employee.salaryStructure?.pfContribution || 0,
      professionalTax: employee.salaryStructure?.professionalTax || 0,
      workingDays: employee.salaryStructure?.workingDays || 22,
      workingHours: employee.salaryStructure?.workingHours || 8,
    });
    setIsSalaryModalOpen(true);
  };

  const handleSalaryChange = (field, value) => {
    setSalaryData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const calculateGross = () => {
    const { basic, hra, allowances, standardAllowance, performanceBonus, leaveTravel, fixedAllowance } = salaryData;
    return basic + hra + allowances + (standardAllowance || 0) + (performanceBonus || 0) + (leaveTravel || 0) + (fixedAllowance || 0);
  };

  const calculateDeductions = () => {
    const { deductions, pfContribution, professionalTax } = salaryData;
    return deductions + (pfContribution || 0) + (professionalTax || 0);
  };

  const calculateNet = () => {
    return calculateGross() - calculateDeductions();
  };

  const handleSaveSalary = async () => {
    if (!selectedEmployee) return;

    try {
      setSaving(true);
      
      const netSalary = calculateNet();
      const employeeId = selectedEmployee.employee?._id || selectedEmployee._id;
      
      const response = await employeeService.adminUpdate(employeeId, {
        salaryStructure: {
          ...salaryData,
          netSalary,
        },
      });

      if (response.success) {
        setSuccessMessage('Salary updated successfully!');
        setIsSalaryModalOpen(false);
        fetchEmployees(); // Refresh the list
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update salary:', err);
      setError('Failed to update salary');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const name = emp.employee?.Employname || emp.Employname || '';
    const email = emp.employee?.email || emp.email || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading employees..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-employees-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Employee Management</h1>
          <p className="page-subtitle">Manage employee profiles and salaries</p>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="employees-toolbar">
        <div className="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search employees by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-stats">
          <span className="stat-badge">{filteredEmployees.length} Employees</span>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="employees-grid">
        {filteredEmployees.map((emp) => {
          const name = emp.employee?.Employname || emp.Employname || 'Unknown';
          const email = emp.employee?.email || emp.email || '';
          const role = emp.employee?.role || emp.role || 'employee';
          const designation = emp.jobDetails?.designation || 'Not Set';
          const department = emp.jobDetails?.department || 'Not Set';
          const profilePicture = emp.profilePicture;
          const salary = emp.salaryStructure;

          return (
            <div key={emp._id} className="employee-card">
              <div className="employee-card-header">
                <div className="employee-avatar">
                  {profilePicture ? (
                    <img src={profilePicture} alt={name} />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="employee-basic-info">
                  <h3 className="employee-name">{name}</h3>
                  <p className="employee-email">{email}</p>
                  <span className={`role-badge ${role}`}>{role}</span>
                </div>
              </div>

              <div className="employee-details">
                <div className="detail-row">
                  <span className="detail-label">Designation</span>
                  <span className="detail-value">{designation}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{department}</span>
                </div>
                <div className="detail-row highlight">
                  <span className="detail-label">Net Salary</span>
                  <span className="detail-value salary">
                    ₹{(salary?.netSalary || 0).toLocaleString()}/month
                  </span>
                </div>
              </div>

              <div className="employee-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => openSalaryModal(emp)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                  Manage Salary
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => router.push(`/admin/employees/${emp.employee?._id || emp._id}`)}
                >
                  View Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3>No Employees Found</h3>
          <p>No employees match your search criteria.</p>
        </div>
      )}

      {/* Salary Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title={`Salary Management - ${selectedEmployee?.employee?.Employname || selectedEmployee?.Employname || 'Employee'}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsSalaryModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveSalary} disabled={saving}>
              {saving ? <ButtonSpinner /> : null}
              {saving ? 'Saving...' : 'Save Salary'}
            </button>
          </>
        }
      >
        <div className="salary-modal-content">
          {/* Wage Summary */}
          <div className="salary-summary-section">
            <div className="wage-summary">
              <div className="wage-item">
                <span className="wage-label">Month Wage</span>
                <span className="wage-value">₹{calculateNet().toLocaleString()}</span>
                <span className="wage-period">/ Month</span>
              </div>
              <div className="wage-item">
                <span className="wage-label">Yearly Wage</span>
                <span className="wage-value">₹{(calculateNet() * 12).toLocaleString()}</span>
                <span className="wage-period">/ Yearly</span>
              </div>
              <div className="wage-item small">
                <label>Working Days</label>
                <input
                  type="number"
                  className="input input-sm"
                  value={salaryData.workingDays || 22}
                  onChange={(e) => handleSalaryChange('workingDays', e.target.value)}
                />
              </div>
              <div className="wage-item small">
                <label>Hours/Day</label>
                <input
                  type="number"
                  className="input input-sm"
                  value={salaryData.workingHours || 8}
                  onChange={(e) => handleSalaryChange('workingHours', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="salary-edit-grid">
            {/* Salary Components */}
            <div className="salary-column">
              <h4 className="column-title earnings">Salary Components</h4>
              
              <div className="salary-input-row">
                <label>Basic Salary</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.basic || ''}
                    onChange={(e) => handleSalaryChange('basic', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
              </div>

              <div className="salary-input-row">
                <label>House Rent Allowance</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.hra || ''}
                    onChange={(e) => handleSalaryChange('hra', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
                <span className="hint">40% provided to employees, 50% of the basic salary</span>
              </div>

              <div className="salary-input-row">
                <label>Standard Allowance</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.standardAllowance || ''}
                    onChange={(e) => handleSalaryChange('standardAllowance', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
              </div>

              <div className="salary-input-row">
                <label>Performance Bonus</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.performanceBonus || ''}
                    onChange={(e) => handleSalaryChange('performanceBonus', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
              </div>

              <div className="salary-input-row">
                <label>Leave Travel Allowance</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.leaveTravel || ''}
                    onChange={(e) => handleSalaryChange('leaveTravel', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
              </div>

              <div className="salary-input-row">
                <label>Fixed Allowance</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.fixedAllowance || ''}
                    onChange={(e) => handleSalaryChange('fixedAllowance', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
              </div>

              <div className="salary-total earnings">
                <span>Gross Salary</span>
                <span>₹{calculateGross().toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="salary-column">
              <h4 className="column-title deductions">Deductions</h4>

              <div className="salary-input-row">
                <label>Provident Fund (PF)</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.pfContribution || ''}
                    onChange={(e) => handleSalaryChange('pfContribution', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
                <span className="hint">12% of basic salary</span>
              </div>

              <div className="salary-input-row">
                <label>Professional Tax</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.professionalTax || ''}
                    onChange={(e) => handleSalaryChange('professionalTax', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
              </div>

              <div className="salary-input-row">
                <label>Other Deductions</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="input"
                    value={salaryData.deductions || ''}
                    onChange={(e) => handleSalaryChange('deductions', e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">₹ / month</span>
                </div>
              </div>

              <div className="salary-total deductions">
                <span>Total Deductions</span>
                <span>-₹{calculateDeductions().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="net-salary-section">
            <div className="net-salary-display">
              <span className="net-label">Net Salary</span>
              <span className="net-amount">₹{calculateNet().toLocaleString()}</span>
              <span className="net-period">per month</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
