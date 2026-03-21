import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { Card } from '../components/Card';
import { VerifiedBadge } from '../components/VerifiedBadge';

// Mock distances for Wongnai feel
const mockDistances = ['0.5 กม.', '1.2 กม.', '2.4 กม.', '3.1 กม.', '5.0 กม.', '12.4 กม.'];

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

  const categories = [
    { label: 'โรงแรม', icon: '🏨', color: '#FFB300', path: '/hotels' },
    { label: 'คาเฟ่', icon: '☕', color: '#8D6E63', path: '/hotels?type=Cafe' },
    { label: 'ที่เที่ยว', icon: '⛰️', color: '#4CAF50', path: '/hotels?type=Nature' },
    { label: 'ร้านอาหาร', icon: '🍴', color: '#FF7043', path: '/hotels?type=Restaurant' },
    { label: 'แนะนำ', icon: '⭐', color: '#1E88E5', path: '/hotels' },
  ];

  const [activeTab, setActiveTab] = useState('ร้านยอดนิยม');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const heroImages = [
    'https://images.unsplash.com/photo-1540202404-b711c0791486?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
      setScrollProgress(progress);
    }
  };

  return (
    <div className="home-page animate-fade-in">
      {/* Wongnai Hero Slider (Mobile Only) */}
      <section className="wongnai-hero mobile-only">
        <div className="hero-slider">
          {heroImages.map((img, idx) => (
            <div 
              key={idx}
              className={`hero-slide ${idx === currentHeroIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
        </div>
        <div className="hero-dots">
          {heroImages.map((_, idx) => (
            <div key={idx} className={`dot ${idx === currentHeroIndex ? 'active' : ''}`} />
          ))}
        </div>
      </section>

      {/* Desktop Hero Section */}
      <section className="hero chiang-dao-hero desktop-only">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1 className="hero-title">Discover the Magic of <span style={{ color: '#ffffff' }}>Chiang Dao</span></h1>
          <p className="hero-subtitle">Misty mountains, authentic homestays, and verified local hosts.</p>
        </div>
      </section>

      {/* Wongnai Category Grid (Mobile Primary) */}
      <section className="category-grid-section">
        <div className="category-scroll-wrapper container" onScroll={handleCategoryScroll} ref={categoryScrollRef}>
          <div className="category-grid">
            {loading ? (
               [1,2,3,4,5,6].map(i => (
                <div key={i} className="category-item">
                  <div className="category-icon-circle skeleton" style={{ background: '#eee' }}></div>
                  <div className="skeleton" style={{ height: 12, width: 40, marginTop: 4 }}></div>
                </div>
              ))
            ) : (
              [...categories, { label: 'Users\' Choice', icon: '🏆', color: '#f59e0b', path: '/hotels' }, { label: 'ทำอาหาร', icon: '👨‍🍳', color: '#ef4444', path: '/hotels' }].map((cat, i) => (
                <div key={i} className="category-item clickable" onClick={() => navigate(cat.path)}>
                  <div className="category-icon-circle" style={{ backgroundColor: cat.color }}>
                    {cat.icon}
                  </div>
                  <span className="category-label">{cat.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Scroll Progress Bar */}
        <div className="category-progress-container container mobile-only">
          <div className="category-progress-track">
            <div className="category-progress-bar" style={{ left: `${(scrollProgress / 100) * 20}px` }}></div>
          </div>
        </div>
      </section>

      {/* Recommended For You Section (2-Column Grid for Mobile) */}
      <section className="recommended-section section-padding">
        <div className="container">
          <div className="section-header-mobile">
            <h2 className="section-title">แนะนำสำหรับคุณ</h2>
            <div className="section-chips">
              {['ร้านยอดนิยม', 'ร้านใหม่มาแรง'].map(tab => (
                <button 
                  key={tab} 
                  className={`chip ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="wongnai-grid">
              {[1,2,3,4].map(i => (
                <div key={i} className="wongnai-card skeleton" style={{ height: 180 }}></div>
              ))}
            </div>
          ) : (
            <div className="wongnai-grid">
              {properties.slice(0, 6).map((prop, idx) => (
                <div key={prop.id} className="wongnai-card clickable" onClick={() => navigate(`/hotels/${prop.id}`)}>
                  <div className="wongnai-card-image">
                    <img src={prop.imageUrl} alt={prop.name} loading="lazy" />
                    <div className="distance-badge">{mockDistances[idx % mockDistances.length]}</div>
                  </div>
                  <div className="wongnai-card-content">
                    <h3 className="wongnai-card-title">{prop.name}</h3>
                    <div className="wongnai-card-meta">
                      <span className="type">{prop.type}</span>
                      {prop.isVerified && <VerifiedBadge />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Desktop Destinations Section */}
      <section className="destinations section-padding desktop-only">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Verified Destinations</h2>
          </div>
          <div className="destinations-grid grid-chiang-dao">
            {properties.slice(0, 4).map(prop => (
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
        </div>
      </section>
    </div>
  );
};
