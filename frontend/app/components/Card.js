export default function Card({ children, className = '', hover = true, onClick }) {
  return (
    <div 
      className={`${hover ? 'card' : 'card-static'} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {children}
    </div>
  );
}

// Stat Card variant
export function StatCard({ title, value, icon, iconColor = 'indigo', trend, trendUp }) {
  return (
    <Card className="stat-card">
      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {trend && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '13px',
            color: trendUp ? 'var(--success)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
      {icon && (
        <div className={`stat-icon ${iconColor}`}>
          {icon}
        </div>
      )}
    </Card>
  );
}
