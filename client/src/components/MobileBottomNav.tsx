import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileBottomNav.css';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, openAuthModal } = useAuth();

  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Bottom navigation">

      {/* Home */}
      <div
        className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
        role="button"
        aria-label="Home"
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">หน้าแรก</span>
      </div>

      {/* Community — search lives in the navbar/hero card now */}
      <div
        className={`mobile-nav-item ${isActive('/community') ? 'active' : ''}`}
        onClick={() => navigate('/community')}
        role="button"
        aria-label="Community"
      >
        <span className="mobile-nav-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        </span>
        <span className="mobile-nav-label">คอมมูนิตี้</span>
      </div>

      {/* Profile — active ONLY on /profile, not /login (bug fix); Saved lives inside Profile now */}
      <div
        className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
        onClick={() => user ? navigate('/profile') : openAuthModal('login')}
        role="button"
        aria-label={user ? 'My profile' : 'Log in'}
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
