const statusConfig = {
  // Attendance statuses
  present: { className: 'badge-present', label: 'Present' },
  absent: { className: 'badge-absent', label: 'Absent' },
  'half-day': { className: 'badge-half-day', label: 'Half Day' },
  leave: { className: 'badge-leave', label: 'On Leave' },
  
  // Leave statuses
  pending: { className: 'badge-pending', label: 'Pending' },
  approved: { className: 'badge-approved', label: 'Approved' },
  rejected: { className: 'badge-rejected', label: 'Rejected' },
  
  // Generic statuses
  success: { className: 'badge-success', label: 'Success' },
  warning: { className: 'badge-warning', label: 'Warning' },
  danger: { className: 'badge-danger', label: 'Danger' },
  info: { className: 'badge-info', label: 'Info' },
  neutral: { className: 'badge-neutral', label: '' },
  
  // Leave types
  paid: { className: 'badge-success', label: 'Paid Leave' },
  sick: { className: 'badge-warning', label: 'Sick Leave' },
  unpaid: { className: 'badge-neutral', label: 'Unpaid Leave' },
};

export default function StatusBadge({ status, customLabel }) {
  const config = statusConfig[status?.toLowerCase()] || statusConfig.neutral;
  
  return (
    <span className={`badge ${config.className}`}>
      {customLabel || config.label || status}
    </span>
  );
}

// Dot indicator for inline status
export function StatusDot({ status }) {
  const colorMap = {
    present: 'var(--success)',
    approved: 'var(--success)',
    absent: 'var(--danger)',
    rejected: 'var(--danger)',
    pending: 'var(--warning)',
    leave: 'var(--info)',
    'half-day': '#7c3aed',
  };
  
  const color = colorMap[status?.toLowerCase()] || 'var(--gray-400)';
  
  return (
    <span
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
  );
}
