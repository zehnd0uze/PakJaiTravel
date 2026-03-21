import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
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

  return (
    <div className="home-page animate-fade-in">

      {/* Hero Section - Restored beautiful background */}
      <section className="hero chiang-dao-hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1 className="hero-title">Discover the Magic of <span style={{ color: '#ffffff' }}>Chiang Dao</span></h1>
          <p className="hero-subtitle">Misty mountains, authentic homestays, and verified local hosts.</p>
        </div>
      </section>

      {/* Mobile-Only Header Placeholder (Actual Header handled in Header.tsx) */}
      <div className="mobile-only-spacing"></div>

      {/* Wongnai Category Grid (Mobile Primary) */}
      <section className="category-grid-section container">
        <div className="category-grid">
          {categories.map((cat, i) => (
            <div key={i} className="category-item" onClick={() => navigate(cat.path)}>
              <div className="category-icon-circle" style={{ backgroundColor: cat.color }}>
                {cat.icon}
              </div>
              <span className="category-label">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended For You Section (Horizontal Scroll) */}
      <section className="recommended-section section-padding">
        <div className="container">
          <div className="section-header-mobile">
            <h2 className="section-title">แนะนำสำหรับคุณ</h2>
            <div className="section-tabs">
              <span className="tab active">ยอดนิยม</span>
              <span className="tab">เปิดใหม่</span>
            </div>
          </div>

          {loading ? (
            <div className="horizontal-scroll-loading"><p>Loading...</p></div>
          ) : (
            <div className="horizontal-scroll-container">
              {properties.slice(0, 6).map(prop => (
                <div key={prop.id} className="scroll-item" onClick={() => navigate(`/hotels/${prop.id}`)}>
                  <div className="scroll-card">
                    <img src={prop.imageUrl} alt={prop.name} />
                    <div className="scroll-card-content">
                      <h3 className="scroll-card-title">{prop.name}</h3>
                      <div className="scroll-card-meta">
                        <span className="type">{prop.type}</span>
                        {prop.isVerified && <VerifiedBadge />}
                      </div>
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
