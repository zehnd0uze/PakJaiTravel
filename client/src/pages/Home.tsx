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
  price?: number | string;
  price_per_night?: number;
  pricePerNight: number;
  price_type?: 'per_night' | 'per_person';
  priceType?: 'per_night' | 'per_person';
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
  const [mobileQuery, setMobileQuery] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published');
        
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

  // Top-rated stays shown as swipeable deal cards on mobile
  const mobileDeals = [...properties]
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 6);

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(mobileQuery.trim() ? `/hotels?q=${encodeURIComponent(mobileQuery.trim())}` : '/hotels');
  };

  const formatPrice = (prop: Property) =>
    `฿${Number(prop.pricePerNight || prop.price_per_night || prop.price || 0).toLocaleString()}`;

  return (
    <div className="home-page animate-fade-in">

      {/* ── Mobile app-style hero + search card (Trip.com-style, hidden on desktop) ── */}
      <section className="mobile-app-hero" aria-label="Quick search">
        <div className="mobile-hero-inner">
          <p className="mobile-hero-kicker">{t('home.hero.subtitle')}</p>
          <h2 className="mobile-hero-title">
            {t('home.hero.titlePart1')} {t('home.hero.titlePart2')}
          </h2>
        </div>

        <div className="mobile-search-card">
          <div className="msc-tabs" role="tablist">
            <button className="msc-tab active" onClick={() => navigate('/hotels')}>
              {t('header.mobile.hotels')}
            </button>
            <button className="msc-tab" onClick={() => navigate('/hotels?type=Nature')}>
              {t('home.mobileSearch.nature')}
            </button>
            <button className="msc-tab" onClick={() => navigate('/hotels?type=Cafe')}>
              {t('home.mobileSearch.cafe')}
            </button>
            <button className="msc-tab" onClick={() => navigate('/community')}>
              {t('home.mobileSearch.community')}
            </button>
          </div>

          <form className="msc-search" onSubmit={handleMobileSearch}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#9aa5a0" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              aria-label={t('header.searchPlaceholder')}
            />
            <button type="submit" className="msc-search-btn" aria-label="Search">
              <svg viewBox="0 0 32 32" width="14" height="14" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 3 }}>
                <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
              </svg>
            </button>
          </form>

          <div className="msc-meta" onClick={() => navigate('/hotels')} role="button" tabIndex={0}>
            <div className="msc-meta-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#2C4C3B" aria-hidden="true">
                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
              </svg>
              <span>{t('home.mobileSearch.anyDate')}</span>
            </div>
            <div className="msc-divider"></div>
            <div className="msc-meta-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#2C4C3B" aria-hidden="true">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>{t('home.mobileSearch.anyGuest')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile deals carousel (hidden on desktop) ── */}
      {mobileDeals.length > 0 && (
        <section className="mobile-promo-section" aria-label="Top deals">
          <div className="mobile-section-head">
            <h2>{t('home.promo.title')}</h2>
          </div>
          <div className="promo-scroll">
            {mobileDeals.map(prop => (
              <div key={prop.id} className="promo-card" onClick={() => navigate(`/hotels/${prop.id}`)}>
                <div className="promo-img-wrap">
                  <img src={prop.imageUrl} alt={prop.name} loading="lazy" />
                  {Number(prop.rating || 0) >= 4.8 && (
                    <span className="promo-badge">{t('home.promo.badge')}</span>
                  )}
                </div>
                <div className="promo-info">
                  <span className="promo-name">{prop.name}</span>
                  <span className="promo-loc">{prop.location}</span>
                  <span className="promo-price">
                    {formatPrice(prop)}
                    <em> /{t('home.promo.perNight')}</em>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Cinematic Hero Section (desktop) ── */}
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
          <button className="mobile-see-all" onClick={() => navigate('/hotels')}>
            {t('home.seeAll')} <span aria-hidden="true">›</span>
          </button>
          
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
