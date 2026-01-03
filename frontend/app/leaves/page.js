'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { StatCard } from '../components/Card';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';

import { leaveService } from '../services/api';

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
      
      let response;
      if (isAdmin()) {
        response = await leaveService.getAll();
      } else {
        response = await leaveService.getMine();
      }

      if (response.success) {
        const mappedLeaves = response.leaves.map(l => ({
          id: l._id,
          ...l,
          employee: l.employeeId // Ensure this matches population in backend
        }));
        setLeaves(mappedLeaves);
        
        if (response.summary) {
          setSummary(response.summary);
        } else {
           // Calc summary if not provided (fallback)
           setSummary({
            pending: mappedLeaves.filter(l => l.status === 'pending').length,
            approved: mappedLeaves.filter(l => l.status === 'approved').length,
            rejected: mappedLeaves.filter(l => l.status === 'rejected').length,
           });
        }
      } else {
        setError('Failed to fetch leaves');
      }
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
      
      const response = await leaveService.apply(formData);
      
      if (response.success) {
        setShowModal(false);
        setFormData({ type: 'paid', startDate: '', endDate: '', reason: '' });
        fetchLeaves(); // Refresh list
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await leaveService.approve(id, 'Approved by admin');
      fetchLeaves();
    } catch (err) {
      console.error(err);
      setError('Failed to approve leave');
    }
  };

  const handleReject = async (id) => {
    try {
      await leaveService.reject(id, 'Rejected by admin');
      fetchLeaves();
    } catch (err) {
      console.error(err);
      setError('Failed to reject leave');
    }
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
