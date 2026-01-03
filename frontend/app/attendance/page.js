'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { StatCard } from '../components/Card';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import { attendanceService } from '../services/api';

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export default function AttendancePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [todayStatus, setTodayStatus] = useState({
    checkedIn: false,
    checkInTime: null,
    checkedOut: false,
    checkOutTime: null,
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    'half-day': 0,
    leave: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly

  useEffect(() => {
    if (!authLoading && user) {
      fetchAttendanceData();
    }
  }, [authLoading, user]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Mock data
      setTodayStatus({
        checkedIn: false,
        checkInTime: null,
        checkedOut: false,
        checkOutTime: null,
      });

      // Mock attendance history
      const mockHistory = [
        { id: 1, date: '2026-01-02', checkIn: '09:05', checkOut: '18:15', workHours: 550, status: 'present' },
        { id: 2, date: '2026-01-01', checkIn: '09:10', checkOut: '14:30', workHours: 320, status: 'half-day' },
        { id: 3, date: '2025-12-31', checkIn: null, checkOut: null, workHours: 0, status: 'leave' },
        { id: 4, date: '2025-12-30', checkIn: '08:55', checkOut: '18:00', workHours: 545, status: 'present' },
        { id: 5, date: '2025-12-29', checkIn: '09:00', checkOut: '18:30', workHours: 570, status: 'present' },
      ];

      setAttendanceHistory(mockHistory);
      setSummary({
        present: 22,
        absent: 1,
        'half-day': 2,
        leave: 3,
        totalHours: 10560,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      // API call: await attendanceService.checkIn();
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
      // API call: await attendanceService.checkOut();
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

  const formatWorkHours = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const columns = [
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    },
    { header: 'Check In', render: (row) => row.checkIn || '-' },
    { header: 'Check Out', render: (row) => row.checkOut || '-' },
    { header: 'Work Hours', render: (row) => formatWorkHours(row.workHours) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading attendance..." />;
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Attendance</h1>
        <p>{today}</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Today's Check-in Card */}
      <Card className="stat-card" style={{ marginBottom: '24px', padding: '32px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Today's Attendance</h2>
            <span style={{ fontSize: '14px', color: 'var(--gray-500)' }}>{currentTime}</span>
          </div>
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
                {actionLoading ? <ButtonSpinner /> : <ClockIcon />}
                {actionLoading ? 'Checking in...' : 'Check In'}
              </button>
            ) : !todayStatus.checkedOut ? (
              <button 
                className="btn btn-danger btn-lg"
                onClick={handleCheckOut}
                disabled={actionLoading}
              >
                {actionLoading ? <ButtonSpinner /> : null}
                {actionLoading ? 'Checking out...' : '🚪 Check Out'}
              </button>
            ) : (
              <div className="badge badge-success" style={{ fontSize: '14px', padding: '12px 20px' }}>
                <CheckIcon /> Attendance marked for today
              </div>
            )}
          </div>
        </div>
        <div className={`stat-icon ${todayStatus.checkedIn ? 'green' : 'yellow'}`} style={{ width: '64px', height: '64px' }}>
          {todayStatus.checkedIn ? <CheckIcon /> : <ClockIcon />}
        </div>
      </Card>

      {/* Monthly Summary */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatCard title="Days Present" value={summary.present} iconColor="green" icon={<CheckIcon />} />
        <StatCard title="Absent" value={summary.absent} iconColor="red" icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        } />
        <StatCard title="Half Days" value={summary['half-day']} iconColor="yellow" icon={<ClockIcon />} />
        <StatCard title="On Leave" value={summary.leave} iconColor="teal" icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        } />
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Attendance History</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['daily', 'weekly', 'monthly'].map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${viewMode === mode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <Table 
        columns={columns} 
        data={attendanceHistory} 
        emptyMessage="No attendance records found"
      />
    </div>
  );
}
