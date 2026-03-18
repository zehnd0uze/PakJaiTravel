import React, { useState, useEffect } from 'react';
import './Header.css';
import { Button } from './Button';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'header-scrolled glass-panel' : ''}`}>
      <div className="container header-content">
        <div className="logo-container">
          <span className="logo-text">PakJai<span className="logo-accent">Travel</span></span>
        </div>
        
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
          <Button variant="text" size="sm">Log in</Button>
          <Button variant="primary" size="sm">Sign up</Button>
        </div>
      </div>
    </header>
  );
};
