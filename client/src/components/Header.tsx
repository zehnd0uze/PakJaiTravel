import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';
import { Button } from './Button';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={`header ${scrolled ? 'header-scrolled glass-panel' : ''}`}>
      <div className="container header-content">
        <div className="logo-container" onClick={() => navigate('/')}>
          <span className="logo-text">PakJai<span className="logo-accent">Travel</span></span>
        </div>
        
        <div className="header-right-desktop">
          <nav className="desktop-nav">
            <ul>
              <li><a href="#" className="nav-link active">Flights</a></li>
              <li><a href="#" className="nav-link">Hotels</a></li>
              <li><a href="#" className="nav-link">Activities</a></li>
              <li><a href="#" className="nav-link">Offers</a></li>
              <li><a href="#" className="nav-link">Support</a></li>
            </ul>
          </nav>

          <div className="auth-actions">
            {user ? (
              <div className="user-menu-container" ref={menuRef}>
                <button
                  className="user-avatar-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  id="user-avatar-btn"
                  aria-label="User menu"
                >
                  <span className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </button>

                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-name">{user.name}</span>
                      <span className="user-dropdown-email">{user.email}</span>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item" onClick={handleLogout} id="logout-btn">
                      <span className="dropdown-icon">↪</span>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="text" size="sm" onClick={() => navigate('/login')}>Log in</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Sign up</Button>
              </>
            )}
          </div>
        </div>

        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-content">
            <nav>
              <ul>
                <li><a href="#" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>Flights</a></li>
                <li><a href="#" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Hotels</a></li>
                <li><a href="#" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Activities</a></li>
                <li><a href="#" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Offers</a></li>
                <li><a href="#" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Support</a></li>
              </ul>
            </nav>
            <div className="mobile-auth-actions">
              {user ? (
                <div className="mobile-user-info">
                  <div className="mobile-user-header">
                     <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                     <div>
                       <span className="user-dropdown-name">{user.name}</span>
                       <span className="user-dropdown-email">{user.email}</span>
                     </div>
                  </div>
                  <button className="user-dropdown-item" onClick={handleLogout} style={{marginTop: '1rem'}}>
                    <span className="dropdown-icon">↪</span>
                    Log out
                  </button>
                </div>
              ) : (
                <div className="mobile-login-buttons">
                  <Button variant="text" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} style={{width: '100%', marginBottom: '0.5rem'}}>Log in</Button>
                  <Button variant="primary" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} style={{width: '100%'}}>Sign up</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
