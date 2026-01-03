'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card, { StatCard } from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

// Icons
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
  </svg>
);

export default function EmployeeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [todayStatus, setTodayStatus] = useState({
    checkedIn: false,
    checkInTime: null,
    checkedOut: false,
    checkOutTime: null,
  });
  const [stats, setStats] = useState({
    daysPresent: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setTodayStatus({
        checkedIn: false,
        checkInTime: null,
        checkedOut: false,
        checkOutTime: null,
      });

      setStats({
        daysPresent: 22,
        pendingLeaves: 1,
        approvedLeaves: 5,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      // Call API - await attendanceService.checkIn();
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTodayStatus(prev => ({
        ...prev,
        checkedIn: true,
        checkInTime: now,
      }));
    } catch (err) {
      setError('Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      // Call API - await attendanceService.checkOut();
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTodayStatus(prev => ({
        ...prev,
        checkedOut: true,
        checkOutTime: now,
      }));
    } catch (err) {
      setError('Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Welcome back!</h1>
        <p>{today} · {currentTime}</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Check In/Out Card */}
      <Card className="stat-card" style={{ marginBottom: '24px', padding: '32px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            Today's Attendance
          </h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>
            {todayStatus.checkedIn 
              ? `Checked in at ${todayStatus.checkInTime}` 
              : 'You haven\'t checked in yet'}
            {todayStatus.checkedOut && ` · Checked out at ${todayStatus.checkOutTime}`}
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {!todayStatus.checkedIn ? (
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleCheckIn}
                disabled={actionLoading}
              >
                {actionLoading ? 'Checking in...' : '🕐 Check In'}
              </button>
            ) : !todayStatus.checkedOut ? (
              <button 
                className="btn btn-danger btn-lg"
                onClick={handleCheckOut}
                disabled={actionLoading}
              >
                {actionLoading ? 'Checking out...' : '🚪 Check Out'}
              </button>
            ) : (
              <div className="badge badge-success" style={{ fontSize: '14px', padding: '12px 20px' }}>
                ✓ Attendance marked for today
              </div>
            )}
          </div>
        </div>
        <div className={`stat-icon ${todayStatus.checkedIn ? 'green' : 'yellow'}`} style={{ width: '64px', height: '64px' }}>
          {todayStatus.checkedIn ? <CheckCircleIcon /> : <ClockIcon />}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Days Present (This Month)"
          value={stats.daysPresent}
          icon={<CheckCircleIcon />}
          iconColor="green"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={<ClockIcon />}
          iconColor="yellow"
        />
        <StatCard
          title="Approved Leaves"
          value={stats.approvedLeaves}
          icon={<CalendarIcon />}
          iconColor="teal"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <a href="/profile" className="quick-action" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div className="quick-action-content">
              <h4>My Profile</h4>
              <p>View and update your profile</p>
            </div>
          </a>
          <a href="/leaves" className="quick-action" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon">
              <CalendarIcon />
            </div>
            <div className="quick-action-content">
              <h4>Apply for Leave</h4>
              <p>Submit a new leave request</p>
            </div>
          </a>
          <a href="/payroll" className="quick-action" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon">
              <WalletIcon />
            </div>
            <div className="quick-action-content">
              <h4>View Payroll</h4>
              <p>Check your salary details</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <Card hover={false} style={{ marginTop: '24px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--success)' }}>
              <CheckCircleIcon />
            </div>
            <div className="activity-content">
              <div className="activity-title">Leave request approved</div>
              <div className="activity-time">Yesterday at 2:30 PM</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-600)' }}>
              <ClockIcon />
            </div>
            <div className="activity-content">
              <div className="activity-title">Checked out at 6:15 PM</div>
              <div className="activity-time">Yesterday</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-600)' }}>
              <ClockIcon />
            </div>
            <div className="activity-content">
              <div className="activity-title">Checked in at 9:05 AM</div>
              <div className="activity-time">Yesterday</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
