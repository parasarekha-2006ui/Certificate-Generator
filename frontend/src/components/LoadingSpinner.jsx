import React from 'react';

export default function LoadingSpinner({ text = 'Loading data...', size = 32 }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      gap: '0.85rem'
    }}>
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: '3px solid rgba(99, 102, 241, 0.15)',
          borderTop: '3px solid var(--secondary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {text}
        </span>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
