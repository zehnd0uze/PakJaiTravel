import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .neq('status', 'draft');
        
      if (error) {
        console.error("Failed to fetch properties:", error);
      } else {
        // Map database snake_case to frontend camelCase if needed
        const formatted = (data || []).map(p => ({
          ...p,
          pricePerNight: p.price_per_night,
          imageUrl: p.image_url,
          isVerified: p.is_verified
        }));
        setProperties(formatted);
      }
      setLoading(false);
    };
    
    fetchProperties();
  }, []);

  // Sleek, text-based mood categories replacing the cluttered emoji blocks
  const moods = [
    { label: t('home.moods.all'), path: '/hotels' },
    { label: t('home.moods.boutique'), path: '/hotels' },
    { label: t('home.moods.forest'), path: '/hotels?type=Nature' },
    { label: t('home.moods.cafe'), path: '/hotels?type=Cafe' },
    { label: t('home.moods.dining'), path: '/hotels?type=Restaurant' },
  ];

  return (
    <div className="home-page animate-fade-in">

      {/* ── Cinematic Hero Section ── */}
      <section className="hero luxury-hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <p className="hero-kicker animate-fade-in">{t('home.hero.subtitle')}</p>
          <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t('home.hero.titlePart1')}<br />{t('home.hero.titlePart2')}
          </h1>
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('home.hero.description')}
          </p>
          <button 
            className="btn-luxury-primary animate-fade-in" 
            style={{ animationDelay: '0.3s' }}
            onClick={() => navigate('/hotels')}
          >
            {t('home.hero.exploreBtn')}
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
            <h2 className="editorial-title">{t('home.curatorsEdit.title')}</h2>
            <p className="editorial-subtitle">{t('home.curatorsEdit.subtitle')}</p>
          </div>

          {loading ? (
            <div className="editorial-loading">{t('home.curatorsEdit.loading')}</div>
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
            <h2 className="editorial-title">{t('home.heritageCollection.title')}</h2>
            <p className="editorial-subtitle">{t('home.heritageCollection.subtitle')}</p>
          </div>
          
          <div className="destinations-grid">
            {properties.slice(0, 8).map(prop => (
              <AirbnbCard
                key={prop.id}
                title={prop.name}
                subtitle={`${prop.type} • ${(prop.features || []).slice(0, 2).join(' • ') || 'Local Stay'}`}
                image={prop.imageUrl || '/assets/placeholder-hotel.jpg'}
                price={`฿${Number(prop.pricePerNight || prop.price_per_night || prop.price || 0).toLocaleString()}`}
                priceType={prop.price_type || prop.priceType as any}
                rating={Number(prop.rating || 0)}
                reviews={Number(prop.reviews || 0)}
                isGuestFavorite={Number(prop.rating || 0) >= 4.8}
                onClick={() => navigate(`/hotels/${prop.id}`)}
              />
            ))}
          </div>
          
          {properties.length > 8 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
              <button 
                className="btn-luxury-primary" 
                onClick={() => navigate('/hotels')}
              >
                {t('home.heritageCollection.seeMore')}
              </button>
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
};
