'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { attendanceService } from '../services/api';

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({});
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'month'
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current month's first and last day
  const getMonthRange = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchAttendance();
      if (!isAdmin) {
        fetchTodayStatus();
      }
    }
  }, [authLoading, user, selectedDate, isAdmin]);

  const fetchTodayStatus = async () => {
    try {
      const response = await attendanceService.getToday();
      if (response.success) {
        setTodayAttendance(response);
      }
    } catch (err) {
      console.error('Error fetching today status:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let response;

      if (isAdmin) {
        // Admin sees all employees for the selected date
        response = await attendanceService.getAll({
          date: selectedDate.toISOString().split('T')[0],
        });
      } else {
        // Employee sees their own monthly attendance
        const { firstDay, lastDay } = getMonthRange(selectedDate);
        response = await attendanceService.getMy({
          startDate: firstDay.toISOString().split('T')[0],
          endDate: lastDay.toISOString().split('T')[0],
        });
      }

      if (response.success) {
        setAttendanceData(response.attendance || []);
        setSummary(response.summary || {});
      }
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
      setCheckingIn(true);
      const response = await attendanceService.checkIn();
      if (response.success) {
        fetchTodayStatus();
        fetchAttendance();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const response = await attendanceService.checkOut();
      if (response.success) {
        fetchTodayStatus();
        fetchAttendance();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
    } finally {
      setCheckingOut(false);
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (isAdmin) {
      // Navigate by day for admin
      newDate.setDate(newDate.getDate() + direction);
    } else {
      // Navigate by month for employee
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setSelectedDate(newDate);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatWorkHours = (minutes) => {
    if (!minutes) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateExtraHours = (minutes, standardHours = 8) => {
    if (!minutes) return '--:--';
    const extraMinutes = minutes - (standardHours * 60);
    if (extraMinutes <= 0) return '00:00';
    const hours = Math.floor(extraMinutes / 60);
    const mins = extraMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'half-day': return 'status-halfday';
      case 'leave': return 'status-leave';
      default: return '';
    }
  };

  const filteredData = isAdmin
    ? attendanceData.filter(a => {
        const name = a.employeeId?.Employname || '';
        const email = a.employeeId?.email || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               email.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : attendanceData;

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading attendance..." />;
  }

  // Employee counts from summary
  const daysPresent = summary.present || 0;
  const leavesCount = summary.leave || 0;
  const totalWorkingDays = daysPresent + leavesCount + (summary.absent || 0) + (summary['half-day'] || 0);

  return (
    <div className="attendance-page">
      {/* Page Header */}
      <div className="attendance-header">
        <div className="header-left">
          <h1 className="page-title">Attendance</h1>
          {isAdmin && (
            <span className="admin-badge">Admin View</span>
          )}
        </div>

        {/* Check In/Out for Employees */}
        {!isAdmin && (
          <div className="checkin-section">
            {!todayAttendance?.checkedIn ? (
              <button
                className="btn btn-success checkin-btn"
                onClick={handleCheckIn}
                disabled={checkingIn}
              >
                {checkingIn ? 'Checking In...' : '🟢 Check In'}
              </button>
            ) : !todayAttendance?.checkedOut ? (
              <button
                className="btn btn-danger checkout-btn"
                onClick={handleCheckOut}
                disabled={checkingOut}
              >
                {checkingOut ? 'Checking Out...' : '🔴 Check Out'}
              </button>
            ) : (
              <span className="checked-out-badge">✅ Day Complete</span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '16px' }}>×</button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="attendance-controls">
        <div className="date-navigation">
          <button className="nav-btn" onClick={() => navigateDate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button className="nav-btn" onClick={() => navigateDate(1)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="date-picker">
            {isAdmin ? (
              <input
                type="date"
                className="input date-input"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            ) : (
              <select
                className="input month-select"
                value={selectedDate.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(parseInt(e.target.value));
                  setSelectedDate(newDate);
                }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i, 1).toLocaleString('en-IN', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isAdmin && (
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`}
                onClick={() => setViewMode('day')}
              >
                Day
              </button>
            </div>
          )}
        </div>

        {/* Employee Summary Cards */}
        {!isAdmin && (
          <div className="summary-cards">
            <div className="summary-card present">
              <span className="summary-value">{daysPresent}</span>
              <span className="summary-label">Days Present</span>
            </div>
            <div className="summary-card leave">
              <span className="summary-value">{leavesCount}</span>
              <span className="summary-label">Leaves</span>
            </div>
            <div className="summary-card total">
              <span className="summary-value">{totalWorkingDays}</span>
              <span className="summary-label">Total Days</span>
            </div>
          </div>
        )}

        {/* Admin Search */}
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

      {/* Date Display */}
      <div className="current-date-display">
        {isAdmin ? (
          <h2>{selectedDate.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}</h2>
        ) : (
          <h2>{selectedDate.toLocaleDateString('en-IN', { 
            month: 'long', 
            year: 'numeric' 
          })}</h2>
        )}
      </div>

      {/* Attendance Table */}
      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              {isAdmin ? (
                <th>Employee</th>
              ) : (
                <th>Date</th>
              )}
              <th>Check In</th>
              <th>Check Out</th>
              <th>Work Hours</th>
              <th>Extra Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((record, index) => (
                <tr key={record._id || index}>
                  {isAdmin ? (
                    <td className="employee-cell">
                      <div className="employee-info-cell">
                        <div className="emp-avatar-small">
                          {record.employeeId?.Employname?.charAt(0) || 'E'}
                        </div>
                        <span>{record.employeeId?.Employname || 'Unknown'}</span>
                      </div>
                    </td>
                  ) : (
                    <td className="date-cell">{formatDate(record.date)}</td>
                  )}
                  <td className="time-cell checkin">{formatTime(record.checkIn?.time)}</td>
                  <td className="time-cell checkout">{formatTime(record.checkOut?.time)}</td>
                  <td className="hours-cell">{formatWorkHours(record.workHours)}</td>
                  <td className="hours-cell extra">{calculateExtraHours(record.workHours)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                      {record.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-row">
                  <div className="empty-state-small">
                    <span>📋</span>
                    <p>No attendance records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Summary Footer */}
      {isAdmin && (
        <div className="admin-summary-footer">
          <div className="summary-stat">
            <span className="stat-icon present">✓</span>
            <span className="stat-count">{summary.present || 0}</span>
            <span className="stat-text">Present</span>
          </div>
          <div className="summary-stat">
            <span className="stat-icon absent">✗</span>
            <span className="stat-count">{summary.absent || 0}</span>
            <span className="stat-text">Absent</span>
          </div>
          <div className="summary-stat">
            <span className="stat-icon halfday">½</span>
            <span className="stat-count">{summary.halfDay || 0}</span>
            <span className="stat-text">Half Day</span>
          </div>
          <div className="summary-stat">
            <span className="stat-icon leave">🏖</span>
            <span className="stat-count">{summary.onLeave || 0}</span>
            <span className="stat-text">On Leave</span>
          </div>
        </div>
      )}
    </div>
  );
}
