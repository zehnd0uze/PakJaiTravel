import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';
import { Button } from './Button';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);       // desktop avatar dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // hamburger slide-out
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const menuRef = useRef<HTMLDivElement>(null);

  // Darken header after scrolling 50px
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close desktop dropdown when clicking outside its container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll while mobile slide-out is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Navigate + close the mobile slide-out in one call
  const mobileNavTo = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className={`header ${scrolled || !isHomePage ? 'header-scrolled glass-panel' : ''}`}>

      {/* ── Mobile-only top search bar (Wongnai-style) ── */}
      <div className="mobile-top-bar">
        <div className="location-selector" onClick={() => navigate('/hotels')}>
          <span className="location-text">ใกล้ฉัน</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>

        {/* Tapping the search bar goes straight to the hotel search page */}
        <div
          className="search-bar-mobile"
          onClick={() => navigate('/hotels')}
          role="button"
          aria-label="Search for hotels"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#757575">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <span className="search-placeholder">ค้นหาโรงแรม, คาเฟ่...</span>
        </div>

        <div className="header-icons-mobile">
          <button className="icon-btn" title="Map" onClick={() => navigate('/hotels')}>🗺️</button>
          <button className="icon-btn" title="History">🕒</button>
        </div>
      </div>

      {/* ── Desktop header ── */}
      <div className="container header-content desktop-only-header">
        {/* Logo */}
        <div className="logo-container" onClick={() => navigate('/')}>
          <span className="logo-text" style={{ letterSpacing: '0.1em' }}>PAKJAI</span>
        </div>

        {/* Minimalist Editorial Search (Replaces Airbnb Pill) */}
        <div className="search-pill-container" onClick={() => navigate('/hotels')}>
          <button className="minimal-search-btn" aria-label="Search destinations">
            Search Destinations
            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
              focusable="false"
              className="minimal-search-icon"
            >
              <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
            </svg>
          </button>
        </div>

        {/* Desktop right: nav link + auth */}
        <div className="header-right-desktop">
          <div className="auth-actions">
            <Link to="/community" className="nav-link" style={{ marginRight: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              Journal
            </Link>

            {user ? (
              /* Desktop avatar dropdown */
              <div className="user-menu-container" ref={menuRef}>
                <button
                  className="user-avatar-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  id="user-avatar-btn"
                  aria-label="User menu"
                  aria-expanded={menuOpen}
                >
                  <span className="user-avatar" style={{ position: 'relative' }}>
                    {/* Safe access — falls back to email initial or 'U' */}
                    {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    {!user.isVerified && <span className="avatar-status-dot" />}
                  </span>
                </button>

                {menuOpen && (
                  <div className="user-dropdown" role="menu">
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-name">{user.name || 'User'}</span>
                      <span className="user-dropdown-email">{user.email}</span>
                      {!user.isVerified && (
                        <div className="unverified-badge">Unverified Account</div>
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
                    <button className="user-dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                      <span className="dropdown-icon">👤</span>Profile
                    </button>
                    <button className="user-dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/community'); }}>
                      <span className="dropdown-icon">📸</span>Community Feed
                    </button>
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item logout-item" role="menuitem" onClick={handleLogout} id="logout-btn">
                      <span className="dropdown-icon">↪</span>Log out
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
      </div>

      {/* ── Hamburger button — OUTSIDE desktop-only-header so it shows on mobile ── */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
      >
        <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} />
      </button>

      {/* ── Mobile slide-out backdrop — tap to dismiss ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-out panel ── */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <div className="mobile-nav-content">
          <nav aria-label="Mobile navigation">
            <ul>
              {/* Real navigation — all use navigate() not href="#" */}
              <li><button className="nav-link mobile-nav-link" onClick={() => mobileNavTo('/')}>🏠 Home</button></li>
              <li><button className="nav-link mobile-nav-link" onClick={() => mobileNavTo('/hotels')}>🏨 Hotels</button></li>
              <li><button className="nav-link mobile-nav-link" onClick={() => mobileNavTo('/community')}>📸 Community</button></li>
              <li><button className="nav-link mobile-nav-link disabled-link" disabled title="Coming soon">✈️ Flights <span className="coming-soon-tag">Soon</span></button></li>
              <li><button className="nav-link mobile-nav-link disabled-link" disabled title="Coming soon">🎯 Activities <span className="coming-soon-tag">Soon</span></button></li>
            </ul>
          </nav>

          <div className="mobile-auth-actions">
            {user ? (
              <div className="mobile-user-info">
                <div className="mobile-user-header">
                  {/* Safe access — optional chaining prevents crash on empty name */}
                  <span className="user-avatar">{(user.name?.charAt(0) || user.email?.[0] || 'U').toUpperCase()}</span>
                  <div>
                    <span className="user-dropdown-name">{user.name}</span>
                    <span className="user-dropdown-email">{user.email}</span>
                  </div>
                </div>
                <button className="mobile-nav-link mobile-profile-btn" onClick={() => mobileNavTo('/profile')}>
                  👤 My Profile
                </button>
                <button className="mobile-nav-link mobile-logout-btn" onClick={handleLogout}>
                  ↪ Log out
                </button>
              </div>
            ) : (
              <div className="mobile-login-buttons">
                <Button variant="text" size="md" onClick={() => mobileNavTo('/login')} style={{ width: '100%', marginBottom: '0.5rem' }}>
                  Log in
                </Button>
                <Button variant="primary" size="md" onClick={() => mobileNavTo('/register')} style={{ width: '100%' }}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
