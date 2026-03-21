import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';
import { Button } from './Button';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/hotels?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/hotels');
    }
  };

  return (
    <header className={`header ${scrolled || !isHomePage ? 'header-scrolled glass-panel' : ''}`}>
      {/* Wongnai Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="location-selector clickable" onClick={() => navigate('/hotels')}>
          <span className="location-text">ใกล้ฉัน</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#333" style={{marginLeft: 2}}><path d="M7 10l5 5 5-5z"/></svg>
        </div>
        <div className="search-bar-mobile">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#757575" className="search-icon-svg"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input 
            type="text" 
            className="search-input-mobile" 
            placeholder="ร้านอาหาร, เสริมสวย, ส..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
          )}
        </div>
        <div className="header-icons-mobile">
          <button className="icon-btn-wongnai clickable" title="Map">🗺️</button>
          <button className="icon-btn-wongnai clickable" title="History">🕒</button>
        </div>
      </div>

      <div className="container header-content desktop-only-header">
        <div className="logo-container" onClick={() => navigate('/')}>
          <span className="logo-text">PakJai<span className="logo-accent">Travel</span></span>
        </div>
        
        <div className="header-right-desktop">
          <nav className="desktop-nav">
            <ul>
              <li><a href="#" className="nav-link">Flights</a></li>
              <li><Link to="/hotels" className="nav-link active">Hotels</Link></li>
              <li><Link to="/community" className="nav-link">Community</Link></li>
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
                    {!user.isVerified && <span className="avatar-status-dot" />}
                  </span>
                </button>

                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-name">{user.name}</span>
                      <span className="user-dropdown-email">{user.email}</span>
                      {!user.isVerified && (
                        <div className="unverified-badge">
                          Unverified Account
                        </div>
                      )}
                    </div>
                    {!user.isVerified && (
                      <div className="verify-prompt-box">
                        <p>Verify your email to unlock all features.</p>
                        <button 
                          className="verify-now-btn" 
                          onClick={() => { setMenuOpen(false); navigate(`/verify-email?email=${user.email}`); }}
                        >
                          Verify Now
                        </button>
                      </div>
                    )}
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                      <span className="dropdown-icon">👤</span>
                      Profile
                    </button>
                    <button className="user-dropdown-item" onClick={() => { setMenuOpen(false); navigate('/community'); }}>
                      <span className="dropdown-icon">📸</span>
                      Community Feed
                    </button>
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
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Log in</Button>
                <Button variant="text" size="sm" onClick={() => navigate('/register')}>Sign up</Button>
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
                <li><a href="#" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Flights</a></li>
                <li><Link to="/hotels" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>Hotels</Link></li>
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
