import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import './BecomeHostPage.css';

const BecomeHostPage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState('');

  const handleGetStarted = async () => {
    if (!user) {
      navigate('/register?redirect=/become-host');
      return;
    }

    if (user.role === 'host') {
      navigate('/dashboard');
      return;
    }

    // Role upgrade logic for logged-in regular users
    setIsUpgrading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/upgrade-to-host', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // We might need to refresh the local user state. 
        // For simplicity, let's ask the user to re-login or just hope the context updates 
        // if we implemented a refresh. Since we didn't implement a refresh in context yet, 
        // let's just force a reload or re-login if needed.
        // Better: Update context. But since I can't see AuthContext easily right now, I'll alert.
        alert("Congratulations! You are now a Host. Please log in again to activate your dashboard.");
        logout();
        navigate('/login?redirect=/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to upgrade account.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="become-host-page animate-fade-in">
      <section className="bh-hero">
        <div className="container bh-hero-content">
          <span className="bh-overline">Join the Community</span>
          <h1>Turn your space into a <br/><span>Nature Retreat.</span></h1>
          <p className="bh-lead">Share the beauty of Chiang Dao with travelers from around the world. List your property on PakJai today.</p>
          <Button variant="primary" size="lg" onClick={handleGetStarted} disabled={isUpgrading}>
            {isUpgrading ? 'Upgrading...' : 'Get Started'}
          </Button>
          {error && <p className="bh-error">{error}</p>}
        </div>
      </section>

      <section className="bh-steps container">
        <div className="bh-step-card">
          <div className="step-num">01</div>
          <h3>Create Account</h3>
          <p>Sign up in seconds. We only need your basic info to get you started.</p>
        </div>
        <div className="bh-step-card">
          <div className="step-num">02</div>
          <h3>List Property</h3>
          <p>Add photos, descriptions, and amenities to your professional listing.</p>
        </div>
        <div className="bh-step-card">
          <div className="step-num">03</div>
          <h3>Start Hosting</h3>
          <p>Receive bookings and promote your place directly to our community feed.</p>
        </div>
      </section>

      <section className="bh-quote container glass-panel">
        <div className="quote-content">
          <blockquote>
            "Hosting on PakJai changed how I see my own home. I've met amazing hikers and nature lovers through the community feed."
          </blockquote>
          <cite>— Mae Rim, Host since 2025</cite>
        </div>
      </section>
    </div>
  );
};

export default BecomeHostPage;
