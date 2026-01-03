'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { leaveService } from '../services/api';



export default function LeavesPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({});
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Modal states
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  
  // Form states
  const [applyData, setApplyData] = useState({
    type: 'paid',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'allocation'

  useEffect(() => {
    if (!authLoading && user) {
      fetchLeaves();
    }
  }, [authLoading, user]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let response;
      

      if (isAdmin) {
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
      setError(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const response = await leaveService.apply(applyData);
      
      if (response.success) {
        setIsApplyModalOpen(false);
        setApplyData({ type: 'paid', startDate: '', endDate: '', reason: '' });
        fetchLeaves(); // Refresh list
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setAdminComment('');
    setIsActionModalOpen(true);
  };

  const handleAction = async () => {
    try {
      setSubmitting(true);
      if (actionType === 'approve') {
        await leaveService.approve(selectedLeave._id, adminComment || 'Approved by admin');
      } else {
        await leaveService.reject(selectedLeave._id, adminComment || 'Rejected by admin');
      }
      
      setSuccessMessage(`Leave request ${actionType}d successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsActionModalOpen(false);
      fetchLeaves();
    } catch (err) {
      console.error(err);
      setError(`Failed to ${actionType} leave`);
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      paid: 'Paid Time Off',
      sick: 'Sick Leave',
      unpaid: 'Unpaid Leave',
    };
    return labels[type] || type;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredLeaves = leaves.filter(leave => {
    // Status filter
    if (statusFilter !== 'all' && leave.status !== statusFilter) return false;
    
    // Search filter (admin only)
    if (isAdmin && searchQuery) {
      const name = leave.employeeId?.Employname || '';
      const email = leave.employeeId?.email || '';
      const query = searchQuery.toLowerCase();
      return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    }
    
    return true;
  });

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading leave requests..." />;
  }

  return (
    <div className="leaves-page">
      {/* Page Header */}
      <div className="leaves-header">
        <div className="header-left">
          <h1 className="page-title">Time Off</h1>
          {isAdmin && <span className="admin-badge">Admin View</span>}
        </div>
        
        {!isAdmin && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsApplyModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Apply for Leave
          </button>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '16px' }}>×</button>
        </div>
      )}

      {/* Tabs for Admin */}
      {isAdmin && (
        <div className="leave-tabs">
          <button 
            className={`leave-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Time Off Requests
          </button>
          <button 
            className={`leave-tab ${activeTab === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocation')}
          >
            Allocation
          </button>
        </div>
      )}

      {/* Leave Balance Cards (Employee) / Summary Cards (Admin) */}
      <div className="leave-summary-grid">
        {isAdmin ? (
          <>
            <div className="leave-summary-card pending">
              <div className="summary-icon">⏳</div>
              <div className="summary-info">
                <span className="summary-count">{summary.pending || 0}</span>
                <span className="summary-label">Pending</span>
              </div>
            </div>
            <div className="leave-summary-card approved">
              <div className="summary-icon">✓</div>
              <div className="summary-info">
                <span className="summary-count">{summary.approved || 0}</span>
                <span className="summary-label">Approved</span>
              </div>
            </div>
            <div className="leave-summary-card rejected">
              <div className="summary-icon">✗</div>
              <div className="summary-info">
                <span className="summary-count">{summary.rejected || 0}</span>
                <span className="summary-label">Rejected</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="leave-balance-card paid">
              <h4>Paid Time Off</h4>
              <div className="balance-value">{balance?.paid ?? user?.leaveBalance?.paid ?? 12} Days Available</div>
            </div>
            <div className="leave-balance-card sick">
              <h4>Sick Leave</h4>
              <div className="balance-value">{balance?.sick ?? user?.leaveBalance?.sick ?? 6} Days Available</div>
            </div>
            <div className="leave-balance-card unpaid">
              <h4>Unpaid Leave</h4>
              <div className="balance-value">Unlimited</div>
            </div>
          </>
        )}
      </div>

      {/* Controls Bar */}
      <div className="leave-controls">
        <div className="status-filters">
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        {isAdmin && (
          <div className="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Leaves Table */}
      <div className="leaves-table-container">
        <table className="leaves-table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Start Date</th>
              <th>End Date</th>
              <th>Type</th>
              <th>Days</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => (
                <tr key={leave._id}>
                  {isAdmin && (
                    <td className="employee-cell">
                      <div className="employee-info-cell">
                        <div className="emp-avatar-small">
                          {leave.employeeId?.Employname?.charAt(0) || 'E'}
                        </div>
                        <span>{leave.employeeId?.Employname || 'Unknown'}</span>
                      </div>
                    </td>
                  )}
                  <td>{formatDate(leave.startDate)}</td>
                  <td>{formatDate(leave.endDate)}</td>
                  <td>
                    <span className={`leave-type-badge ${leave.type}`}>
                      {getLeaveTypeLabel(leave.type)}
                    </span>
                  </td>
                  <td className="days-cell">{leave.duration} day(s)</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="actions-cell">
                      {leave.status === 'pending' ? (
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => openActionModal(leave, 'approve')}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => openActionModal(leave, 'reject')}
                            title="Reject"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <span className="processed-badge">Processed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} className="empty-row">
                  <div className="empty-state-small">
                    <span>📋</span>
                    <p>No leave requests found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Leave Modal (Employee) */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleApply} disabled={submitting}>
              {submitting ? <ButtonSpinner /> : null}
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </>
        }
      >
        <form onSubmit={handleApply} className="leave-form">
          <div className="input-group">
            <label>Leave Type <span className="required">*</span></label>
            <select
              className="input"
              value={applyData.type}
              onChange={(e) => setApplyData({ ...applyData, type: e.target.value })}
              required
            >
              <option value="paid">Paid Time Off</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="date-range-inputs">
            <div className="input-group">
              <label>Start Date <span className="required">*</span></label>
              <input
                type="date"
                className="input"
                value={applyData.startDate}
                onChange={(e) => setApplyData({ ...applyData, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="input-group">
              <label>End Date <span className="required">*</span></label>
              <input
                type="date"
                className="input"
                value={applyData.endDate}
                onChange={(e) => setApplyData({ ...applyData, endDate: e.target.value })}
                min={applyData.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Remarks <span className="required">*</span></label>
            <textarea
              className="input"
              rows={4}
              placeholder="Please provide a reason for your leave request..."
              value={applyData.reason}
              onChange={(e) => setApplyData({ ...applyData, reason: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Approve/Reject Modal (Admin) */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </button>
            <button 
              className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleAction}
              disabled={submitting}
            >
              {submitting ? <ButtonSpinner /> : null}
              {submitting ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
            </button>
          </>
        }
      >
        <div className="action-modal-content">
          {selectedLeave && (
            <div className="leave-details-summary">
              <div className="detail-item">
                <span className="label">Employee:</span>
                <span className="value">{selectedLeave.employeeId?.Employname || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Type:</span>
                <span className="value">{getLeaveTypeLabel(selectedLeave.type)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Duration:</span>
                <span className="value">
                  {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)} ({selectedLeave.duration} days)
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Reason:</span>
                <span className="value reason">{selectedLeave.reason}</span>
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Comments (for Employee)</label>
            <textarea
              className="input"
              rows={3}
              placeholder={actionType === 'approve' ? 'Add approval note...' : 'Reason for rejection...'}
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
