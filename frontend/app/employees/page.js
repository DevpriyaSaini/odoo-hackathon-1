'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { StatCard } from '../components/Card';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function EmployeesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchEmployees();
    }
  }, [authLoading, user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Mock data
      const mockEmployees = [
        {
          _id: '1',
          Employname: 'John Doe',
          email: '2024john@iitjammu.ac.in',
          department: 'Engineering',
          position: 'Software Developer',
          status: 'active',
          joiningDate: '2024-01-15',
          phone: '+91 9876543210',
        },
        {
          _id: '2',
          Employname: 'Jane Smith',
          email: '2024jane@iitjammu.ac.in',
          department: 'Marketing',
          position: 'Marketing Manager',
          status: 'active',
          joiningDate: '2023-06-20',
          phone: '+91 9876543211',
        },
        {
          _id: '3',
          Employname: 'Mike Johnson',
          email: '2024mike@iitjammu.ac.in',
          department: 'Sales',
          position: 'Sales Executive',
          status: 'active',
          joiningDate: '2024-03-10',
          phone: '+91 9876543212',
        },
        {
          _id: '4',
          Employname: 'Sarah Wilson',
          email: '2024sarah@iitjammu.ac.in',
          department: 'HR',
          position: 'HR Specialist',
          status: 'inactive',
          joiningDate: '2023-09-01',
          phone: '+91 9876543213',
        },
      ];

      setEmployees(mockEmployees);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.Employname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: 'Employee', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
          }}>
            {row.Employname.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: '500' }}>{row.Employname}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Department', accessor: 'department' },
    { header: 'Position', accessor: 'position' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status === 'active' ? 'present' : 'absent'} customLabel={row.status} /> },
    { 
      header: 'Actions', 
      render: (row) => (
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setSelectedEmployee(row);
            setShowModal(true);
          }}
        >
          View
        </button>
      )
    },
  ];

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading employees..." />;
  }

  const summary = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    departments: [...new Set(employees.map(e => e.department))].length,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Employees</h1>
          <p>Manage your organization's employees</p>
        </div>
        <button className="btn btn-primary">
          + Add Employee
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatCard 
          title="Total Employees" 
          value={summary.total} 
          iconColor="indigo"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>}
        />
        <StatCard 
          title="Active" 
          value={summary.active} 
          iconColor="green"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
        />
        <StatCard 
          title="Departments" 
          value={summary.departments} 
          iconColor="teal"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>}
        />
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="input"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Employees Table */}
      <Table 
        columns={columns} 
        data={filteredEmployees} 
        emptyMessage="No employees found"
      />

      {/* View Employee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedEmployee(null);
        }}
        title="Employee Details"
      >
        {selectedEmployee && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '32px',
                margin: '0 auto 12px',
              }}>
                {selectedEmployee.Employname.charAt(0)}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{selectedEmployee.Employname}</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>{selectedEmployee.position}</p>
            </div>
            
            <InfoRow label="Email" value={selectedEmployee.email} />
            <InfoRow label="Department" value={selectedEmployee.department} />
            <InfoRow label="Phone" value={selectedEmployee.phone} />
            <InfoRow label="Joining Date" value={new Date(selectedEmployee.joiningDate).toLocaleDateString()} />
            <InfoRow label="Status" value={<StatusBadge status={selectedEmployee.status === 'active' ? 'present' : 'absent'} customLabel={selectedEmployee.status} />} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>{label}</span>
      <span style={{ fontWeight: '500', fontSize: '14px' }}>{value}</span>
    </div>
  );
}
