export default function LoadingSpinner({ size = 'md', text }) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : '';
  
  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClass}`} />
      {text && <p>{text}</p>}
    </div>
  );
}

// Inline spinner for buttons
export function ButtonSpinner() {
  return (
    <div 
      className="spinner-sm" 
      style={{ 
        width: '16px', 
        height: '16px', 
        borderWidth: '2px',
        borderColor: 'rgba(255,255,255,0.3)',
        borderTopColor: 'white',
      }} 
    />
  );
}
