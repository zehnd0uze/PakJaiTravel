import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand-group">
          <Link to="/" className="footer-logo">
            <svg className="footer-logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M5 24V15C5 8.92487 9.92487 4 16 4C22.0751 4 27 8.92487 27 15V24" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" opacity="0.85" />
              <circle cx="20.2" cy="11.8" r="2.6" fill="#E08D67" />
              <path d="M4.5 24L13.2 12.2L19.4 20.6L22.6 16.2L27.5 24" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 27.2C12 25.8 20 25.8 24.5 27.2" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" opacity="0.65" />
            </svg>
            <span>PAKJAI</span>
          </Link>
          <span className="footer-sep" aria-hidden="true">·</span>
          <p className="footer-desc">{t('home.footer.tagline')}</p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/">{t('home.footer.home')}</Link>
          <Link to="/hotels">{t('home.footer.stays')}</Link>
          <Link to="/community">{t('home.footer.journal')}</Link>
          <Link to="/become-host">{t('home.footer.host')}</Link>
          <Link to="/privacy">{t('home.footer.privacy')}</Link>
          <Link to="/terms">{t('home.footer.terms')}</Link>
        </nav>

        <div className="footer-copy">
          &copy; {new Date().getFullYear()} PakJai
        </div>
      </div>
    </footer>
  );
};
