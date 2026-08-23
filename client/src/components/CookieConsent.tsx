import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem('pakjai_cookie_consent');
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pakjai_cookie_consent', 'accepted');
    setIsVisible(false);
    // Here you would typically initialize your analytics (e.g. Google Analytics)
  };

  const handleDecline = () => {
    localStorage.setItem('pakjai_cookie_consent', 'declined');
    setIsVisible(false);
    // User declined non-essential cookies. Only essential auth cookies will be used.
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <div className="cookie-info">
          <h3>🍪 We Value Your Privacy</h3>
          <p>
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
            By clicking "Accept All", you consent to our use of cookies.
          </p>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn decline-btn" onClick={handleDecline}>Decline</button>
          <button className="cookie-btn accept-btn" onClick={handleAccept}>Accept All</button>
        </div>
      </div>
    </div>
  );
};
