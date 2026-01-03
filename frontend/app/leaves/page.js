'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { StatCard } from '../components/Card';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function LeavesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'paid',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchLeaves();
    }
  }, [authLoading, user]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      
      // Mock data
      const mockLeaves = [
        { 
          id: 1, 
          type: 'paid', 
          startDate: '2026-01-10', 
          endDate: '2026-01-12', 
          duration: 3,
          reason: 'Family event',
          status: 'pending',
          employee: isAdmin() ? { Employname: 'John Doe', department: 'Engineering' } : null,
        },
        { 
          id: 2, 
          type: 'sick', 
          startDate: '2025-12-20', 
          endDate: '2025-12-21', 
          duration: 2,
          reason: 'Not feeling well',
          status: 'approved',
          employee: isAdmin() ? { Employname: 'Jane Smith', department: 'Marketing' } : null,
        },
        { 
          id: 3, 
          type: 'unpaid', 
          startDate: '2025-12-15', 
          endDate: '2025-12-15', 
          duration: 1,
          reason: 'Personal work',
          status: 'rejected',
          adminComment: 'Insufficient notice',
          employee: isAdmin() ? { Employname: 'Mike Johnson', department: 'Sales' } : null,
        },
      ];

      setLeaves(mockLeaves);
      setSummary({
        pending: mockLeaves.filter(l => l.status === 'pending').length,
        approved: mockLeaves.filter(l => l.status === 'approved').length,
        rejected: mockLeaves.filter(l => l.status === 'rejected').length,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // API call would go here
      console.log('Applying for leave:', formData);
      
      // Add to list (mock)
      const newLeave = {
        id: Date.now(),
        ...formData,
        duration: Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1,
        status: 'pending',
      };
      setLeaves([newLeave, ...leaves]);
      setSummary(prev => ({ ...prev, pending: prev.pending + 1 }));
      
      setShowModal(false);
      setFormData({ type: 'paid', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      setError('Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    // API call would go here
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'approved' } : l));
    setSummary(prev => ({ 
      ...prev, 
      pending: prev.pending - 1, 
      approved: prev.approved + 1 
    }));
  };

  const handleReject = async (id) => {
    // API call would go here
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
    setSummary(prev => ({ 
      ...prev, 
      pending: prev.pending - 1, 
      rejected: prev.rejected + 1 
    }));
  };

  const columns = isAdmin() ? [
    { header: 'Employee', render: (row) => row.employee?.Employname || '-' },
    { header: 'Type', render: (row) => <StatusBadge status={row.type} /> },
    { header: 'From', render: (row) => new Date(row.startDate).toLocaleDateString() },
    { header: 'To', render: (row) => new Date(row.endDate).toLocaleDateString() },
    { header: 'Days', accessor: 'duration' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status === 'pending' ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-success btn-sm" onClick={() => handleApprove(row.id)}>Approve</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleReject(row.id)}>Reject</button>
        </div>
      ) : null
    },
  ] : [
    { header: 'Type', render: (row) => <StatusBadge status={row.type} /> },
    { header: 'From', render: (row) => new Date(row.startDate).toLocaleDateString() },
    { header: 'To', render: (row) => new Date(row.endDate).toLocaleDateString() },
    { header: 'Days', accessor: 'duration' },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading leaves..." />;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{isAdmin() ? 'Leave Management' : 'My Leaves'}</h1>
          <p>{isAdmin() ? 'Manage employee leave requests' : 'View and apply for leave'}</p>
        </div>
        {!isAdmin() && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Apply for Leave
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatCard 
          title="Pending" 
          value={summary.pending} 
          iconColor="yellow"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
        />
        <StatCard 
          title="Approved" 
          value={summary.approved} 
          iconColor="green"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
        />
        <StatCard 
          title="Rejected" 
          value={summary.rejected} 
          iconColor="red"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
        />
      </div>

      {/* Leave Requests Table */}
      <Table 
        columns={columns} 
        data={leaves} 
        emptyMessage="No leave requests found"
      />

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Apply for Leave"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleApply} disabled={submitting}>
              {submitting ? <ButtonSpinner /> : null}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Leave Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="paid">Paid Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label>Start Date</label>
              <input
                type="date"
                className="input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>End Date</label>
              <input
                type="date"
                className="input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Reason</label>
            <textarea
              className="input"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a reason for your leave request..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
