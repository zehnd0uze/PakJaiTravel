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
        className={`mobile-nav-item ${isActive('/') && !isActive('/hotels') ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="mobile-nav-icon">🏠</span>
        <span className="mobile-nav-label">Home</span>
      </div>
      
      <div 
        className={`mobile-nav-item ${isActive('/hotels') ? 'active' : ''}`}
        onClick={() => navigate('/hotels')}
      >
        <span className="mobile-nav-icon">🏨</span>
        <span className="mobile-nav-label">Hotels</span>
      </div>

      <div 
        className={`mobile-nav-item ${(location.pathname === '/login' || location.pathname === '/register') ? 'active' : ''}`}
        onClick={() => user ? alert('Logged in!') : navigate('/login')}
      >
        <span className="mobile-nav-icon">{user ? '👤' : '🔑'}</span>
        <span className="mobile-nav-label">{user ? 'Profile' : 'Log In'}</span>
      </div>
    </nav>
  );
};
