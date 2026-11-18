import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import './Header.css';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);       // desktop avatar dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // hamburger slide-out
  const { user, logout, openAuthModal, verify, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/profile';
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Inline Verify State
  const [showInlineVerify, setShowInlineVerify] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otpValues];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtpValues(newOtp);
      setVerifyOtp(newOtp.join(''));
      
      const nextFocus = Math.min(index + pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    setVerifyOtp(newOtp.join(''));

    // Move to next input if typing a digit
    if (value !== '' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleInlineVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !verifyOtp) {
      setVerifyError('Please enter the 6-digit code.');
      return;
    }
    setVerifyError('');
    setVerifyMessage('');
    setVerifyLoading(true);
    try {
      await verify(user.email, verifyOtp);
      setVerifyMessage('Verified successfully!');
      setTimeout(() => {
        setMenuOpen(false);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleInlineResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setVerifyError('');
    setVerifyMessage('');
    setVerifyLoading(true);
    try {
      await resendOtp(user.email);
      setVerifyMessage('Code resent to your email.');
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to resend code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Autocomplete fetcher
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const timer = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .neq('status', 'draft')
            .or(`name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,province.ilike.%${searchQuery}%,district.ilike.%${searchQuery}%`)
            .limit(5);

          if (error) throw error;

          if (data) {
            setSearchResults(data);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error("Autocomplete fetch failed", err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // For user menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowInlineVerify(false);
      }
      // For search dropdown
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/hotels?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/hotels');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (id: string) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigate(`/hotels/${id}`);
  };

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

  // Darken header after scrolling 50px
  // Sticky navbar search appears only once the homepage hero search card has scrolled out from under the navbar
  const [stickySearch, setStickySearch] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const card = document.querySelector('.mobile-search-card') as HTMLElement | null;
      if (card) {
        // Card is gone once its bottom edge passes the navbar (56px) — page content length doesn't matter
        setStickySearch(card.getBoundingClientRect().bottom <= 60);
      } else {
        // Non-home pages have no hero card: show the search row once scrolled
        setStickySearch(window.scrollY > 240);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    document.body.classList.add('lang-transitioning');
    
    setTimeout(() => {
      i18n.changeLanguage(i18n.language.startsWith('th') ? 'en' : 'th');
      
      setTimeout(() => {
        document.body.classList.remove('lang-transitioning');
      }, 50);
    }, 150);
  };

  return (
    <header className={`header ${scrolled || !isHomePage ? 'header-scrolled glass-panel' : ''}`}>

      {/* ── Mobile-only app bar (Trip.com-style) ── */}
      <div className={`mobile-top-bar ${stickySearch ? 'compact' : ''}`}>
        <div className="mobile-brand" onClick={() => navigate('/')} role="button" aria-label="PakJai home">
          <span className="mobile-logo-text">PAKJAI</span>
        </div>

        {/* In-bar search — appears beside the brand once the hero search card has scrolled out */}
        <form
          className="mobile-compact-search"
          onSubmit={handleSearch}
          role="search"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="rgba(255,255,255,0.7)" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('header.searchPlaceholder')}
            aria-label={t('header.searchPlaceholder')}
          />
          <button type="submit" className="mcs-btn" aria-label="Search">
            <svg viewBox="0 0 32 32" width="13" height="13" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 3 }}>
              <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
            </svg>
          </button>
        </form>

        <div className="mobile-top-actions">
          <button
            className="mobile-lang-toggle"
            onClick={toggleLanguage}
            title="Toggle Language"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
            </svg>
            {i18n.language.startsWith('th') ? 'EN' : 'TH'}
          </button>

          {user ? (
            <button
              className="mobile-avatar-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open account menu"
            >
              <span className="user-avatar mobile-avatar">
                {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </span>
              {!user.isVerified && <span className="avatar-status-dot" />}
            </button>
          ) : (
            <button className="mobile-signin-btn" onClick={() => openAuthModal('login')}>
              {t('header.login')}
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop header ── */}
      <div className="container header-content desktop-only-header">
        {/* Logo */}
        <div className="logo-container" onClick={() => navigate('/')}>
          <span className="logo-text" style={{ letterSpacing: '0.1em' }}>PAKJAI</span>
        </div>

        {/* Minimalist Editorial Search (Replaces Airbnb Pill) */}
        <div className="search-pill-container" ref={searchRef}>
          <div className="minimal-search-wrapper">
            <input
              type="text"
              className="minimal-search-input"
              placeholder={t('header.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search destinations"
              onFocus={() => searchQuery.length > 1 && setShowDropdown(true)}
            />
            <button className="minimal-search-icon-btn" onClick={handleSearch} aria-label="Search">
              <svg
                viewBox="0 0 32 32"
                aria-hidden="true"
                focusable="false"
                className="minimal-search-icon"
              >
                <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
              </svg>
            </button>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="search-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <button 
                      key={result.id} 
                      className="search-result-item"
                      onClick={() => handleResultClick(result.id)}
                    >
                      <div className="result-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      </div>
                      <div className="result-info">
                        <span className="result-name">{result.name}</span>
                        <span className="result-loc">{result.location} • {result.type}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="no-results-msg">{t('header.noResults')}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop right: nav link + auth */}
        <div className="header-right-desktop">
          <div className="auth-actions">
            <button 
              className="nav-link lang-btn" 
              onClick={toggleLanguage} 
              style={{ marginRight: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'inherit' }}
              title="Toggle Language"
            >
              {i18n.language.startsWith('th') ? 'EN' : 'TH'}
            </button>
            <Link to="/community" className="nav-link" style={{ marginRight: '1.5rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              {t('header.journal')}
            </Link>
            <Link 
              to={user?.role === 'host' ? "/dashboard?new=1" : "/become-host"} 
              className="nav-link host-link" 
              style={{ marginRight: '1.5rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600' }}
            >
              {user?.role === 'host' ? t('header.addListing') : t('header.listProperty')}
            </Link>

            {user ? (
              /* Desktop avatar dropdown */
              <div className="user-menu-container" ref={menuRef}>
                <button
                  className="user-avatar-btn"
                  onClick={() => { setMenuOpen(!menuOpen); setShowInlineVerify(false); }}
                  id="user-avatar-btn"
                  aria-label="User menu"
                  aria-expanded={menuOpen}
                >
                  <span className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || 'User'} className="user-avatar-img" />
                    ) : (
                      (user.name?.[0] || user.email?.[0] || 'U').toUpperCase()
                    )}
                  </span>
                  {!user.isVerified && <span className="avatar-status-dot" />}
                </button>

                {menuOpen && (
                  <div className="user-dropdown" role="menu">
                    {/* Profile Identity Card */}
                    <div className="user-dropdown-header">
                      <div className="udh-top-row">
                        <div className="udh-avatar-wrap">
                          <span className="udh-avatar">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name || 'User'} />
                            ) : (
                              (user.name?.[0] || user.email?.[0] || 'U').toUpperCase()
                            )}
                          </span>
                          {user.isVerified && (
                            <span className="udh-verified-tick" title="Verified Account">
                              <svg viewBox="0 0 20 20" width="11" height="11" fill="currentColor">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>

                        <div className="udh-identity">
                          <span className="user-dropdown-name">{user.name || 'User'}</span>
                          <span className="user-dropdown-email">{user.email}</span>
                        </div>
                      </div>

                      <div className="udh-role-row">
                        {user.role === 'host' ? (
                          <span className="udh-role-pill host">
                            <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                            {t('header.userMenu.certifiedHost')}
                          </span>
                        ) : user.isVerified ? (
                          <span className="udh-role-pill verified">Verified Member</span>
                        ) : (
                          <span className="udh-role-pill unverified">{t('header.userMenu.unverified', 'Unverified Account')}</span>
                        )}
                      </div>
                    </div>

                    {!user.isVerified && (
                      <div className="verify-prompt-box">
                        {!showInlineVerify ? (
                          <>
                            <p>{t('header.userMenu.verifyPrompt', 'Verify your email to unlock all features.')}</p>
                            <button
                              className="verify-now-btn"
                              onClick={async () => {
                                setShowInlineVerify(true);
                                setVerifyError('');
                                setVerifyMessage('Sending new code...');
                                try {
                                  if (user.email) await resendOtp(user.email);
                                  setVerifyMessage('Code sent to your email!');
                                } catch (err: any) {
                                  setVerifyError(err.message || 'Failed to send code.');
                                  setVerifyMessage('');
                                }
                              }}
                            >
                              {t('header.userMenu.verifyNow', 'Verify Now')}
                            </button>
                          </>
                        ) : (
                          <div className="inline-verify-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ fontSize: '0.85rem', margin: 0 }}>Enter 6-digit code:</p>
                            {verifyError && <div style={{ color: '#dc2626', fontSize: '0.75rem' }}>{verifyError}</div>}
                            {verifyMessage && <div style={{ color: '#16a34a', fontSize: '0.75rem' }}>{verifyMessage}</div>}
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
                              {otpValues.map((digit, index) => (
                                <input
                                  key={index}
                                  type="text"
                                  maxLength={1}
                                  value={digit}
                                  ref={(el) => { otpInputRefs.current[index] = el; }}
                                  onChange={(e) => handleOtpChange(index, e.target.value)}
                                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                  style={{
                                    width: '36px',
                                    height: '40px',
                                    textAlign: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                  }}
                                  onFocus={(e) => e.target.select()}
                                />
                              ))}
                            </div>
                            <button 
                              className="verify-now-btn" 
                              onClick={handleInlineVerify}
                              disabled={verifyLoading}
                              style={{ padding: '6px', fontSize: '0.9rem' }}
                            >
                              {verifyLoading ? 'Verifying...' : 'Submit'}
                            </button>
                            <button 
                              onClick={handleInlineResend}
                              disabled={verifyLoading}
                              style={{ background: 'none', border: 'none', color: '#2c4c3b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', alignSelf: 'center' }}
                            >
                              Resend code
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="user-dropdown-nav">
                      <button
                        className="user-dropdown-item"
                        role="menuitem"
                        onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                      >
                        <span className="udi-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <span className="udi-label">{t('header.userMenu.profile')}</span>
                        <span className="udi-arrow" aria-hidden="true">›</span>
                      </button>

                      {user.role === 'host' ? (
                        <button
                          className="user-dropdown-item host-item"
                          role="menuitem"
                          onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}
                        >
                          <span className="udi-icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                          </span>
                          <span className="udi-label">{t('header.userMenu.hostDashboard')}</span>
                          <span className="udi-arrow" aria-hidden="true">›</span>
                        </button>
                      ) : (
                        <button
                          className="user-dropdown-item host-item"
                          role="menuitem"
                          onClick={() => { setMenuOpen(false); navigate('/become-host'); }}
                        >
                          <span className="udi-icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <line x1="12" y1="11" x2="12" y2="17" />
                              <line x1="9" y1="14" x2="15" y2="14" />
                            </svg>
                          </span>
                          <span className="udi-label">{t('header.userMenu.becomeHost')}</span>
                          <span className="udi-arrow" aria-hidden="true">›</span>
                        </button>
                      )}

                      <button
                        className="user-dropdown-item"
                        role="menuitem"
                        onClick={() => { setMenuOpen(false); navigate('/community'); }}
                      >
                        <span className="udi-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </span>
                        <span className="udi-label">{t('header.userMenu.communityFeed')}</span>
                        <span className="udi-arrow" aria-hidden="true">›</span>
                      </button>
                    </div>

                    <div className="user-dropdown-footer">
                      <button
                        className="user-dropdown-item logout-item"
                        role="menuitem"
                        onClick={handleLogout}
                        id="logout-btn"
                      >
                        <span className="udi-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </span>
                        <span className="udi-label">{t('header.userMenu.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => openAuthModal('login')}>{t('header.login')}</Button>
                <Button variant="text" size="sm" onClick={() => openAuthModal('register')}>{t('header.signup')}</Button>
              </>
            )}
          </div>
        </div>
      </div>

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
              <li><button className="nav-link mobile-nav-link" onClick={() => mobileNavTo('/')}>{t('header.mobile.home')}</button></li>
              <li><button className="nav-link mobile-nav-link" onClick={() => mobileNavTo('/hotels')}>{t('header.mobile.hotels')}</button></li>
              <li><button className="nav-link mobile-nav-link" onClick={() => mobileNavTo('/community')}>{t('header.mobile.community')}</button></li>
              <li><button className="nav-link mobile-nav-link" onClick={() => mobileNavTo(user?.role === 'host' ? '/dashboard?new=1' : '/become-host')} style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{user?.role === 'host' ? t('header.addListing') : t('header.listProperty')}</button></li>
              <li><button className="nav-link mobile-nav-link disabled-link" disabled title="Coming soon">{t('header.mobile.flights')} <span className="coming-soon-tag">{t('header.mobile.soon')}</span></button></li>
              <li><button className="nav-link mobile-nav-link disabled-link" disabled title="Coming soon">{t('header.mobile.activities')} <span className="coming-soon-tag">{t('header.mobile.soon')}</span></button></li>
              <li><button className="nav-link mobile-nav-link" onClick={toggleLanguage} style={{ borderTop: '1px solid #eee', marginTop: '8px' }}>
                🌎 {i18n.language.startsWith('th') ? 'English' : 'ภาษาไทย'}
              </button></li>
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
                  {t('header.mobile.myProfile')}
                </button>
                {user.role === 'host' ? (
                  <button className="mobile-nav-link" onClick={() => mobileNavTo('/dashboard')} style={{ fontWeight: 600, color: '#2c4c3b' }}>
                    {t('header.userMenu.hostDashboard')}
                  </button>
                ) : (
                  <button className="mobile-nav-link" onClick={() => mobileNavTo('/become-host')} style={{ fontWeight: 600, color: 'var(--accent-color)' }}>
                    {t('header.userMenu.becomeHost')}
                  </button>
                )}
                <button className="mobile-nav-link mobile-logout-btn" onClick={handleLogout}>
                  {t('header.userMenu.logout')}
                </button>
              </div>
            ) : (
              <div className="mobile-login-buttons">
                <Button variant="text" size="md" onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }} style={{ width: '100%', marginBottom: '0.5rem' }}>
                  {t('header.login')}
                </Button>
                <Button variant="primary" size="md" onClick={() => { setMobileMenuOpen(false); openAuthModal('register'); }} style={{ width: '100%' }}>
                  {t('header.signup')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
