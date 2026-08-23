import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { ClaimPropertyModal } from '../components/ClaimPropertyModal';
import './BecomeHostPage.css';

const BecomeHostPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleGetStarted = async () => {
    setError('');
    
    if (!user) {
      navigate('/login?redirect=/become-host');
      return;
    }

    try {
      navigate('/dashboard?new=true');
    } catch (err: any) {
      setError(err.message || 'Failed to navigate to dashboard.');
    }
  };

  return (
    <div className="become-host-page animate-fade-in">
      <section className="bh-hero">
        <div className="container bh-hero-content">
          <span className="bh-overline">Join the Community</span>
          <h1>Turn your space into a <br/><span>Nature Retreat.</span></h1>
          <p className="bh-lead">
            Share the authentic beauty of Chiang Dao and northern Thailand with travelers from around the world. List your homestay, resort, or villa on PakJai today.
          </p>

          {error && <div className="bh-error">{error}</div>}

          <div className="bh-cta-wrapper">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleGetStarted}
              className="bh-main-cta"
            >
              {!user ? 'Get Started & List Your Space' : 
                user.role === 'host' ? 'Go to Host Dashboard (+ Add Listing)' : 
                'Activate Host Mode & List Accommodation'}
            </Button>

            <button 
              type="button" 
              className="bh-secondary-link" 
              onClick={() => setShowClaimModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1.5px solid #2e7d32',
                borderRadius: '12px',
                color: '#2e7d32',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              🏷️ Is your homestay already on PakJai? Claim Ownership
            </button>

            {user && user.role === 'host' && (
              <button className="bh-secondary-link" onClick={() => navigate('/dashboard')}>
                View My Current Listings →
              </button>
            )}
          </div>

          <div className="bh-badges">
            <div className="bh-badge-item">
              <span className="badge-icon">🌿</span>
              <span>0% Listing Fee during launch</span>
            </div>
            <div className="bh-badge-item">
              <span className="badge-icon">📍</span>
              <span>Direct connection with travelers</span>
            </div>
            <div className="bh-badge-item">
              <span className="badge-icon">✨</span>
              <span>Verified Owner guarantee</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bh-steps container">
        <div className="bh-step-card">
          <div className="step-num">01</div>
          <h3>Create Account</h3>
          <p>Sign up in seconds. You only need your basic contact info to start sharing your hospitality.</p>
        </div>
        <div className="bh-step-card">
          <div className="step-num">02</div>
          <h3>List Your Accommodation</h3>
          <p>Upload photos, set your price, pick your amenities (mountain views, breakfast, Wi-Fi), and showcase your story.</p>
        </div>
        <div className="bh-step-card">
          <div className="step-num">03</div>
          <h3>Start Welcoming Guests</h3>
          <p>Receive direct inquiries, share daily updates in the community feed, and build trusted local hospitality.</p>
        </div>
      </section>

      <section className="bh-quote container glass-panel">
        <div className="quote-content">
          <blockquote>
            "Hosting on PakJai changed how I share my homestay. I connect directly with mindful travelers who love Chiang Dao nature."
          </blockquote>
          <cite>— Chiang Dao Homestay Host</cite>
        </div>
      </section>

      <ClaimPropertyModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </div>
  );
};

export default BecomeHostPage;
