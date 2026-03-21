import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileBottomNav.css';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Do not show on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="mobile-bottom-nav">
      <div 
        className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">หน้าแรก</span>
      </div>
      
      <div 
        className={`mobile-nav-item ${isActive('/community') ? 'active' : ''}`}
        onClick={() => navigate('/community')}
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M12 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">สำหรับคุณ</span>
      </div>

      <div 
        className={`mobile-nav-item ${isActive('/saved') ? 'active' : ''}`}
        onClick={() => user ? navigate('/saved') : navigate('/login')}
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">ที่บันทึกไว้</span>
      </div>
      
      <div 
        className={`mobile-nav-item ${isActive('/profile') || isActive('/login') ? 'active' : ''}`}
        onClick={() => user ? navigate('/profile') : navigate('/login')}
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span className="mobile-nav-label">ฉัน</span>
      </div>
    </nav>
  );
};
