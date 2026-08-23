import React from 'react';
import './Footer.css';

import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-column">
          <h3 className="footer-logo">PakJai<span>Travel</span></h3>
          <p className="footer-desc">Your ultimate companion for exploring the hidden gems and popular destinations in Thailand.</p>
        </div>
        
        <div className="footer-column">
          <h4>Discover</h4>
          <ul>
            <li><a href="#">Hotels in Bangkok</a></li>
            <li><a href="#">Flights to Phuket</a></li>
            <li><a href="#">Activities in Chiang Mai</a></li>
            <li><a href="#">Travel Guides</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} PakJaiTravel. All rights reserved.</p>
      </div>
    </footer>
  );
};
