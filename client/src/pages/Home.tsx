import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { AirbnbCard } from '../components/AirbnbCard';
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
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        const published = data.filter((p: Property) => p.status !== 'draft');
        setProperties(published);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch properties:", err);
        setLoading(false);
      });
  }, []);

  // Sleek, text-based mood categories replacing the cluttered emoji blocks
  const moods = [
    { label: 'All Stays', path: '/hotels' },
    { label: 'Boutique Hotels', path: '/hotels' },
    { label: 'Forest Retreats', path: '/hotels?type=Nature' },
    { label: 'Artisan Cafes', path: '/hotels?type=Cafe' },
    { label: 'Fine Dining', path: '/hotels?type=Restaurant' },
  ];

  return (
    <div className="home-page animate-fade-in">

      {/* ── Cinematic Hero Section ── */}
      <section className="hero luxury-hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <p className="hero-kicker animate-fade-in">WELCOME TO PAKJAI</p>
          <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
            The Art of<br />True Serenity
          </h1>
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Discover bespoke nature retreats and authentic heritage stays in the heart of Chiang Dao.
          </p>
          <button 
            className="btn-luxury-primary animate-fade-in" 
            style={{ animationDelay: '0.3s' }}
            onClick={() => navigate('/hotels')}
          >
            Explore the Collection
          </button>
        </div>
      </section>

      <div className="mobile-only-spacing"></div>

      {/* ── Discover by Mood (Replaces Wongnai Category Grid) ── */}
      <section className="mood-navigation-section container">
        <div className="mood-scroll-track">
          {moods.map((mood, i) => (
            <button key={i} className={`mood-btn ${i === 0 ? 'active' : ''}`} onClick={() => navigate(mood.path)}>
              {mood.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Editorial Staggered Layout: The Curator's Edit (Replaces Horizontal Scroll) ── */}
      <section className="editorial-section section-padding">
        <div className="container">
          <div className="editorial-header">
            <h2 className="editorial-title">The Curator's Edit</h2>
            <p className="editorial-subtitle">A hand-selected portfolio of our most distinguished properties.</p>
          </div>

          {loading ? (
            <div className="editorial-loading">Preparing your collection...</div>
          ) : (
            <div className="editorial-mosaic">
              {properties.slice(0, 3).map((prop, idx) => (
                <div key={prop.id} className={`mosaic-item item-${idx}`} onClick={() => navigate(`/hotels/${prop.id}`)}>
                  <div className="mosaic-image-wrapper hover-scale">
                    <img src={prop.imageUrl} alt={prop.name} loading="lazy"/>
                    <div className="mosaic-overlay">
                      <div className="mosaic-text">
                        <span className="mosaic-type">{prop.type}</span>
                        <h3 className="mosaic-name">{prop.name}</h3>
                      </div>
                      {prop.isVerified && (
                        <div className="mosaic-badge">
                          <VerifiedBadge />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── The Heritage Collection (Replaces generic Airbnb Grid) ── */}
      <section className="heritage-collection section-padding">
        <div className="container">
          <div className="editorial-header centered">
            <h2 className="editorial-title">The Heritage Collection</h2>
            <p className="editorial-subtitle">Exclusively verified. Locally owned. Extraordinary experiences.</p>
          </div>
          
          <div className="destinations-grid">
            {properties.map(prop => (
              <AirbnbCard
                key={prop.id}
                title={prop.name}
                subtitle={`${prop.type} • ${(prop.features || []).slice(0, 2).join(' • ') || 'Local Stay'}`}
                image={prop.imageUrl || '/assets/placeholder-hotel.jpg'}
                price={`฿${Number(prop.pricePerNight || 0).toLocaleString()}`}
                rating={Number(prop.rating || 0)}
                reviews={Number(prop.reviews || 0)}
                isGuestFavorite={Number(prop.rating || 0) >= 4.8}
                onClick={() => navigate(`/hotels/${prop.id}`)}
              />
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
};
