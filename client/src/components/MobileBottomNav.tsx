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
        className={`mobile-nav-item ${isActive('/hotels') || isActive('/hotels/search') ? 'active' : ''}`}
        onClick={() => navigate('/hotels')}
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">ค้นหา</span>
      </div>

      <div 
        className={`mobile-nav-item ${isActive('/saved') ? 'active' : ''}`}
        onClick={() => user ? navigate('/saved') : navigate('/login')}
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">ที่บันทึกไว้</span>
      </div>
      
      <div 
        className={`mobile-nav-item ${isActive('/profile') || isActive('/login') ? 'active' : ''}`}
        onClick={() => user ? navigate('/profile') : navigate('/login')}
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">ฉัน</span>
      </div>
    </nav>
  );
};
