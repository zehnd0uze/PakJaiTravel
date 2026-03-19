import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { VerifiedBadge } from '../components/VerifiedBadge';

interface Property {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  currency: string;
  imageUrl: string;
  isVerified: boolean;
  features: string[];
  location: string;
  status?: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch properties from API (same source as admin)
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        // Only show top-rated published properties on the homepage
        const topRated = data
          .filter((p: Property) => p.status !== 'draft' && p.rating >= 4.6)
          .sort((a: Property, b: Property) => b.rating - a.rating)
          .slice(0, 8);
        setProperties(topRated);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch properties:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-page animate-fade-in">

      {/* Hero Section */}
      <section className="hero chiang-dao-hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1 className="hero-title">Discover the Magic of <span style={{ color: '#ffffff' }}>Chiang Dao</span></h1>
          <p className="hero-subtitle">Misty mountains, authentic homestays, and verified local hosts.</p>

          {/* Search Widget removed to focus on a curated blog layout */}
        </div>
      </section>

      {/* Verified Destinations Section */}
      <section className="destinations section-padding">
        <div className="container">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 className="section-title">Top Rated & Recommended Stays</h2>
              <p className="section-subtitle">Exclusively featuring our highest rated, verified locations.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#E0F2F1', padding: '8px 16px', borderRadius: '8px', border: '1px solid #B2DFDB' }}>
              <VerifiedBadge />
              <span style={{ color: '#00796B', fontWeight: 600, fontSize: '0.9rem' }}>All Listings Guaranteed</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><p>Loading verified properties...</p></div>
          ) : (
            <div className="destinations-grid grid-chiang-dao">
              {properties.map(prop => (
                <Card
                  key={prop.id}
                  title={prop.name}
                  subtitle={prop.features.join(' • ')}
                  image={prop.imageUrl}
                  price={`฿${prop.pricePerNight.toLocaleString()}`}
                  rating={prop.rating}
                  badge={prop.type}
                  isVerified={prop.isVerified}
                  onClick={() => navigate(`/hotels/${prop.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Section */}
      <section className="promos section-padding" style={{ backgroundColor: 'var(--surface-color)' }}>
        <div className="container">
          <div className="promo-banner glass-panel" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1540202404-b711c0791486?q=80&w=1200&auto=format&fit=crop")', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(0,31,63,0.8)' }}>
            <div className="promo-content">
              <h2>Wake Up to Doi Luang Views</h2>
              <p>Book a verified homestay today and support the local Chiang Dao community directly.</p>
              <Button variant="secondary" size="lg">View Top Picks</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
