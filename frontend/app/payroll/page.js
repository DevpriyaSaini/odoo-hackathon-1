'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { StatCard } from '../components/Card';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { payrollService } from '../services/api';

export default function PayrollPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [payroll, setPayroll] = useState([]);
  const [currentPayslip, setCurrentPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPayroll();
    }
  }, [authLoading, user]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      
      let response;
      if (isAdmin()) {
        response = await payrollService.getAll();
      } else {
        response = await payrollService.getMine();
      }

      if (response.success) {
        // Backend returns: { success: true, payroll: [...] }
        const payrollData = response.payroll.map(item => ({
          ...item,
          id: item._id, // Ensure id is available for table keys
          employee: item.employeeId || null // Ensure correct field mapping
        }));
        
        setPayroll(payrollData);
        if (payrollData.length > 0) {
          setCurrentPayslip(payrollData[0]);
        }
      } else {
        setError('Failed to fetch payroll records');
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getMonthName = (month) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  const columns = isAdmin() ? [
    { header: 'Employee', render: (row) => row.employee?.Employname || '-' },
    { header: 'Period', render: (row) => `${getMonthName(row.month)} ${row.year}` },
    { header: 'Gross', render: (row) => formatCurrency(row.grossSalary) },
    { header: 'Deductions', render: (row) => formatCurrency(row.totalDeductions) },
    { header: 'Net', render: (row) => formatCurrency(row.netSalary) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ] : [
    { header: 'Period', render: (row) => `${getMonthName(row.month)} ${row.year}` },
    { header: 'Gross Salary', render: (row) => formatCurrency(row.grossSalary) },
    { header: 'Deductions', render: (row) => formatCurrency(row.totalDeductions) },
    { header: 'Net Salary', render: (row) => formatCurrency(row.netSalary) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Actions', 
      render: (row) => (
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setCurrentPayslip(row)}
        >
          View
        </button>
      )
    },
  ];

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading payroll..." />;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>{isAdmin() ? 'Payroll Management' : 'My Payroll'}</h1>
        <p>{isAdmin() ? 'Manage employee salaries' : 'View your salary details'}</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Current Payslip (Employee View) */}
      {!isAdmin() && currentPayslip && (
        <Card hover={false} style={{ marginBottom: '24px', padding: '0', overflow: 'hidden' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', 
            padding: '24px',
            color: 'white',
          }}>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
              {getMonthName(currentPayslip.month)} {currentPayslip.year}
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>
              {formatCurrency(currentPayslip.netSalary)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>
              Net Salary
            </div>
          </div>
          
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* Earnings */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--gray-500)' }}>
                  EARNINGS
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <PayslipRow label="Basic Salary" amount={currentPayslip.basic} />
                  <PayslipRow label="HRA" amount={currentPayslip.allowances?.hra} />
                  <PayslipRow label="Transport" amount={currentPayslip.allowances?.transport} />
                  <PayslipRow label="Medical" amount={currentPayslip.allowances?.medical} />
                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '12px', marginTop: '4px' }}>
                    <PayslipRow label="Gross Salary" amount={currentPayslip.grossSalary} bold />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--gray-500)' }}>
                  DEDUCTIONS
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <PayslipRow label="Income Tax" amount={currentPayslip.deductions?.tax} negative />
                  <PayslipRow label="Provident Fund" amount={currentPayslip.deductions?.pf} negative />
                  {currentPayslip.deductions?.insurance > 0 && (
                    <PayslipRow label="Insurance" amount={currentPayslip.deductions?.insurance} negative />
                  )}
                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '12px', marginTop: '4px' }}>
                    <PayslipRow label="Total Deductions" amount={currentPayslip.totalDeductions} bold negative />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Payroll History Table */}
      <div className="card-static" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          {isAdmin() ? 'All Payroll Records' : 'Salary History'}
        </h2>
        <Table 
          columns={columns} 
          data={payroll} 
          emptyMessage="No payroll records found"
        />
      </div>
    </div>
  );
}

function PayslipRow({ label, amount, bold, negative }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      fontWeight: bold ? '600' : '400',
    }}>
      <span style={{ color: 'var(--gray-600)' }}>{label}</span>
      <span style={{ 
        color: negative ? 'var(--danger)' : 'var(--foreground)',
      }}>
        {negative ? '-' : ''}{formatCurrency(amount)}
      </span>
    </div>
  );
}
