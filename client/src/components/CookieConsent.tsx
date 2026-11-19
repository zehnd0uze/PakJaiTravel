import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CookieConsent.css';

export const CookieConsent: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('pakjai_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pakjai_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pakjai_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <div className="cookie-info">
          <h3>{t('cookie.title')}</h3>
          <p>{t('cookie.body')}</p>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn decline-btn" onClick={handleDecline}>{t('cookie.decline')}</button>
          <button className="cookie-btn accept-btn" onClick={handleAccept}>{t('cookie.accept')}</button>
        </div>
      </div>
    </div>
  );
};
