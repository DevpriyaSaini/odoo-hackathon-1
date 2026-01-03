'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { StatCard } from '../components/Card';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { employeeAuthService } from '../services/api';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dkpvhegme';
const CLOUDINARY_UPLOAD_PRESET = 'devpriyasaini';

export default function EmployeesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add employee form state
  const [formData, setFormData] = useState({
    Employname: '',
    email: '',
    phone: '',
    image: '',
    department: '',
    position: '',
    employmentType: 'full-time',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchEmployees();
    }
  }, [authLoading, user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Fetch real employees from API
      const response = await employeeAuthService.getAll();
      if (response.success && response.employees) {
        setEmployees(response.employees);
      } else {
        setEmployees([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFormError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size must be less than 5MB');
      return;
    }

    setFormError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      setUploading(true);
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      cloudinaryFormData.append('folder', 'dayflow/profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: cloudinaryFormData }
      );

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.secure_url }));
    } catch (err) {
      setFormError('Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (!formData.Employname || !formData.email) {
      setFormError('Name and email are required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      
      const response = await employeeAuthService.createEmployee(formData);
      
      if (response.success) {
        setCreatedEmployee({
          ...response.employee,
          temporaryPassword: response.temporaryPassword,
        });
        setSuccessMessage('Employee created successfully!');
        
        // Refresh employee list
        fetchEmployees();
        
        // Reset form
        setFormData({
          Employname: '',
          email: '',
          phone: '',
          image: '',
          department: '',
          position: '',
          employmentType: 'full-time',
        });
        setImagePreview(null);
      } else {
        setFormError(response.message || 'Failed to create employee');
      }
    } catch (err) {
      console.error('Create employee error:', err);
      setFormError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setFormError('');
    setSuccessMessage('');
    setCreatedEmployee(null);
    setImagePreview(null);
    setFormData({
      Employname: '',
      email: '',
      phone: '',
      image: '',
      department: '',
      position: '',
      employmentType: 'full-time',
    });
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.Employname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (emp.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (emp.employeeId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
            background: row.image 
              ? `url(${row.image}) center/cover no-repeat`
              : 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
          }}>
            {!row.image && (row.Employname?.charAt(0) || '?')}
          </div>
          <div>
            <div style={{ fontWeight: '500' }}>{row.Employname}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{row.employeeId || row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Department', accessor: 'department', render: (row) => row.department || '-' },
    { header: 'Position', accessor: 'position', render: (row) => row.position || '-' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status === 'active' ? 'present' : 'absent'} customLabel={row.status || 'active'} /> },
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
    active: employees.filter(e => e.status === 'active' || !e.status).length,
    departments: [...new Set(employees.map(e => e.department).filter(Boolean))].length,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Employees</h1>
          <p>Manage your organization's employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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
          placeholder="Search by name, email, ID, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Employees Table */}
      <Table 
        columns={columns} 
        data={filteredEmployees} 
        emptyMessage="No employees found. Click 'Add Employee' to create one."
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
                background: selectedEmployee.image 
                  ? `url(${selectedEmployee.image}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '32px',
                margin: '0 auto 12px',
              }}>
                {!selectedEmployee.image && selectedEmployee.Employname?.charAt(0)}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{selectedEmployee.Employname}</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>{selectedEmployee.position || 'No position'}</p>
              {selectedEmployee.employeeId && (
                <code style={{ 
                  fontSize: '12px', 
                  background: 'var(--gray-100)', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  marginTop: '8px',
                  display: 'inline-block',
                }}>
                  {selectedEmployee.employeeId}
                </code>
              )}
            </div>
            
            <InfoRow label="Email" value={selectedEmployee.email} />
            <InfoRow label="Phone" value={selectedEmployee.phone || '-'} />
            <InfoRow label="Department" value={selectedEmployee.department || '-'} />
            <InfoRow label="Joining Date" value={selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : '-'} />
            <InfoRow label="Status" value={<StatusBadge status={selectedEmployee.status === 'active' ? 'present' : 'absent'} customLabel={selectedEmployee.status || 'active'} />} />
          </div>
        )}
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetAddModal}
        title={createdEmployee ? "Employee Created!" : "Add New Employee"}
        size="lg"
        footer={!createdEmployee && (
          <>
            <button className="btn btn-secondary" onClick={resetAddModal}>Cancel</button>
            <button 
              className="btn btn-primary" 
              onClick={handleAddEmployee}
              disabled={submitting || uploading}
            >
              {submitting ? <ButtonSpinner /> : null}
              {submitting ? 'Creating...' : 'Create Employee'}
            </button>
          </>
        )}
      >
        {createdEmployee ? (
          // Success view
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'var(--success)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <h3 style={{ marginBottom: '8px' }}>{createdEmployee.Employname}</h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Employee account created successfully!</p>
            
            <div style={{ 
              background: 'var(--gray-50)', 
              padding: '20px', 
              borderRadius: '12px', 
              textAlign: 'left',
              marginBottom: '20px',
            }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--gray-600)' }}>Login Credentials</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--gray-500)' }}>Employee ID:</span>
                <code style={{ background: 'var(--gray-200)', padding: '2px 8px', borderRadius: '4px' }}>
                  {createdEmployee.employeeId}
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--gray-500)' }}>Email:</span>
                <span>{createdEmployee.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Temp Password:</span>
                <code style={{ background: 'var(--warning)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
                  {createdEmployee.temporaryPassword}
                </code>
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
              📧 Credentials have been sent to the employee's email.
            </p>
            
            <button className="btn btn-primary" onClick={resetAddModal} style={{ marginTop: '20px' }}>
              Done
            </button>
          </div>
        ) : (
          // Form view
          <form onSubmit={handleAddEmployee}>
            {formError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>{formError}</div>
            )}
            
            {/* Profile Photo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: imagePreview 
                    ? `url(${imagePreview}) center/cover no-repeat`
                    : 'var(--gray-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  border: '3px dashed var(--gray-300)',
                  transition: 'all 0.3s ease',
                }}
              >
                {uploading ? (
                  <ButtonSpinner />
                ) : !imagePreview && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--gray-500)', marginBottom: '20px' }}>
              Click to upload photo (optional)
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={formData.Employname}
                  onChange={(e) => setFormData({ ...formData, Employname: e.target.value })}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="employee@iitjammu.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label>Department</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Engineering"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label>Position</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Software Developer"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label>Employment Type</label>
                <select
                  className="input"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'var(--gray-50)', 
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--gray-600)',
            }}>
              <strong>Note:</strong> Employee ID and temporary password will be auto-generated and sent to the employee's email.
            </div>
          </form>
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
