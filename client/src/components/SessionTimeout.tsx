import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

export const SessionTimeout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Check if current route requires strict session timeout
  const isStrictRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  // Handle idle timeout
  const handleIdle = () => {
    if (user && isStrictRoute) {
      logout();
      setShowTimeoutWarning(true);
      navigate('/'); // Redirect to home on logout
    }
  };

  // 30 minutes in milliseconds
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  
  useIdleTimeout(handleIdle, IDLE_TIMEOUT_MS);

  // Auto-hide warning after 10 seconds
  useEffect(() => {
    if (showTimeoutWarning) {
      const timer = setTimeout(() => {
        setShowTimeoutWarning(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showTimeoutWarning]);

  if (!showTimeoutWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 10000,
      border: '1px solid #fecaca',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Session Expired</span>
        <span style={{ fontSize: '0.85rem', color: '#b91c1c' }}>You were logged out due to inactivity for your security.</span>
      </div>
      <button 
        onClick={() => setShowTimeoutWarning(false)}
        style={{ 
          background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', marginLeft: '12px', padding: '4px'
        }}
      >
        &times;
      </button>
      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translate(-50%, -20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}
      </style>
    </div>
  );
};
