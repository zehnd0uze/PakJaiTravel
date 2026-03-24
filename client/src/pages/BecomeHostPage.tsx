import React from 'react';
import { Button } from '../components/Button';
import './BecomeHostPage.css';

const BecomeHostPage: React.FC = () => {
  const handleGetStarted = () => {
    alert("Host registration is coming soon! We are currently in a private beta. Please check back later.");
  };

  return (
    <div className="become-host-page animate-fade-in">
      <section className="bh-hero">
        <div className="container bh-hero-content">
          <span className="bh-overline">Join the Community</span>
          <h1>Turn your space into a <br/><span>Nature Retreat.</span></h1>
          <p className="bh-lead">Share the beauty of Chiang Dao with travelers from around the world. List your property on PakJai today.</p>
          <Button variant="secondary" size="lg" onClick={handleGetStarted}>
            Coming Soon
          </Button>
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
