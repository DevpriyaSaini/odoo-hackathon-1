'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/Card';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dashboardService, attendanceService, leaveService, employeeService } from '../../services/api';

// Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

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

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    onLeaveToday: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // For now, use mock data since backend endpoints aren't all implemented
      // In production, this would call dashboardService.getAdminStats()
      
      // Mock data
      setStats({
        totalEmployees: 24,
        presentToday: 18,
        pendingLeaves: 5,
        onLeaveToday: 3,
      });

      setRecentLeaves([
        { id: 1, employee: 'John Doe', type: 'sick', startDate: '2026-01-03', endDate: '2026-01-05', status: 'pending' },
        { id: 2, employee: 'Jane Smith', type: 'paid', startDate: '2026-01-10', endDate: '2026-01-15', status: 'pending' },
        { id: 3, employee: 'Mike Johnson', type: 'unpaid', startDate: '2026-01-08', endDate: '2026-01-08', status: 'approved' },
      ]);

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const leaveColumns = [
    { header: 'Employee', accessor: 'employee' },
    { header: 'Type', render: (row) => <StatusBadge status={row.type} /> },
    { header: 'From', accessor: 'startDate' },
    { header: 'To', accessor: 'endDate' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status === 'pending' ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-success btn-sm">Approve</button>
          <button className="btn btn-danger btn-sm">Reject</button>
        </div>
      ) : null
    },
  ];

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back! Here's what's happening today, {today}</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<UsersIcon />}
          iconColor="indigo"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={<CheckIcon />}
          iconColor="green"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={<ClockIcon />}
          iconColor="yellow"
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          icon={<CalendarIcon />}
          iconColor="teal"
        />
      </div>

      {/* Recent Leave Requests */}
      <div className="card-static" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Leave Requests</h2>
          <a href="/leaves" className="btn btn-secondary btn-sm">View All</a>
        </div>
        <Table columns={leaveColumns} data={recentLeaves} emptyMessage="No pending leave requests" />
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <a href="/employees" className="quick-action" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon">
              <UsersIcon />
            </div>
            <div className="quick-action-content">
              <h4>Manage Employees</h4>
              <p>View and manage employee profiles</p>
            </div>
          </a>
          <a href="/leaves" className="quick-action" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon">
              <CalendarIcon />
            </div>
            <div className="quick-action-content">
              <h4>Manage Leaves</h4>
              <p>Review and approve requests</p>
            </div>
          </a>
          <a href="/attendance" className="quick-action" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon">
              <ClockIcon />
            </div>
            <div className="quick-action-content">
              <h4>View Attendance</h4>
              <p>Check today's attendance records</p>
            </div>
          </a>
          <a href="/payroll" className="quick-action" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
            </div>
            <div className="quick-action-content">
              <h4>Payroll Management</h4>
              <p>Process and view payroll</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
