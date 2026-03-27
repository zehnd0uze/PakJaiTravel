import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import './HotelDetail.css';

interface Hotel {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  currency: string;
  imageUrl: string;
  images: string[];
  isVerified: boolean;
  features: string[];
  amenities: string[];
  location: string;
  description: string;
  checkIn: string;
  checkOut: string;
  host: { name: string; since: string };
  contact: { phone: string; email: string; line?: string };
}

export const HotelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch from API
  useEffect(() => {
    if (!id) return;
    fetch(`/api/properties/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => {
        setHotel(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="hotel-detail-page container section-padding animate-fade-in">
        <p style={{ textAlign: 'center', padding: '80px 0', color: '#8A94A6' }}>Loading...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="hotel-detail-page container section-padding animate-fade-in">
        <div className="not-found">
          <h1>Property Not Found</h1>
          <p>The property you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/hotels')}>
            Browse Hotels
          </Button>
        </div>
      </div>
    );
  }

  const amenityIcons: Record<string, string> = {
    'Wi-Fi': '✓', 'Wifi': '✓', 'Breakfast': '✓', 'Local Breakfast': '✓', 'Mountain View': '✓',
    'Balcony': '✓', 'Terrace': '✓', 'Hot Shower': '✓', 'Parking': '✓',
    'Garden': '✓', 'Fan': '✓', 'A/C': '✓', 'Air Conditioning': '✓',
    'Pool': '✓', 'Swimming Pool': '✓', 'Restaurant': '✓', 'Bar': '✓',
    'Room Service': '✓', 'Spa': '✓', 'Gym': '✓', 'Bicycles': '✓',
    'Kitchen': '✓', 'Library': '✓', 'Bird Watching': '✓',
  };

  const images = hotel.images?.length > 0 ? hotel.images : (hotel.imageUrl ? [hotel.imageUrl] : []);

  return (
    <div className="hotel-detail-page animate-fade-in">
      {/* Breadcrumb */}
      <div className="detail-breadcrumb container">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Home</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-link" onClick={() => navigate('/hotels')}>Hotels</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{hotel.name}</span>
      </div>

      {/* Photo Gallery */}
      {images.length > 0 && (
        <section className="detail-gallery container">
          <div className="gallery-main">
            <img
              src={images[selectedImage]}
              alt={`${hotel.name} — Photo ${selectedImage + 1}`}
              className="gallery-main-img"
            />
            <div className="gallery-photo-count">
              Photo {selectedImage + 1} / {images.length}
            </div>
          </div>
          <div className="gallery-thumbs">
            {images.map((img, i) => (
              <div
                key={i}
                className={`gallery-thumb ${i === selectedImage ? 'active' : ''}`}
                onClick={() => setSelectedImage(i)}
              >
                <img src={img} alt={`Thumbnail ${i + 1}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Content */}
      <div className="detail-content container">
        {/* Left column — info */}
        <div className="detail-info">
          {/* Header */}
          <div className="detail-header">
            <div className="detail-title-row">
              <div>
                <span className="detail-type-badge">{hotel.type}</span>
                <h1 className="detail-title">{hotel.name}</h1>
                <p className="detail-location">{hotel.location}</p>
              </div>
              <div className="detail-rating-block">
                <span className="detail-rating-score">{hotel.rating}</span>
                <div className="detail-rating-meta">
                  <span className="detail-rating-label">
                    {hotel.rating >= 4.8 ? 'Exceptional' : hotel.rating >= 4.5 ? 'Excellent' : 'Very Good'}
                  </span>
                  <span className="detail-reviews">{hotel.reviews} reviews</span>
                </div>
              </div>
            </div>
            {hotel.isVerified && (
              <div className="detail-verified-banner">
                <VerifiedBadge />
                <span>This property is verified by PakJaiTravel — 100% legitimate owner</span>
              </div>
            )}
          </div>

          {/* Description */}
          {hotel.description && (
            <div className="detail-section">
              <h2>About This Property</h2>
              <p className="detail-description">{hotel.description}</p>
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities?.length > 0 && (
            <div className="detail-section">
              <h2>Amenities</h2>
              <div className="amenities-grid">
                {hotel.amenities.map((amenity) => (
                  <div key={amenity} className="amenity-item">
                    <span className="amenity-icon">{amenityIcons[amenity] || '✓'}</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Check-in / Check-out */}
          {hotel.checkIn && (
            <div className="detail-section">
              <h2>House Rules</h2>
              <div className="rules-grid">
                <div className="rule-item">
                  <span className="rule-icon"></span>
                  <div>
                    <strong>Check-in</strong>
                    <span>After {hotel.checkIn}</span>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-icon"></span>
                  <div>
                    <strong>Check-out</strong>
                    <span>Before {hotel.checkOut}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Map */}
          <div className="detail-section">
            <h2>Location & Map</h2>
            <div className="map-container" style={{ width: '100%', height: '400px', borderRadius: '20px', overflow: 'hidden', marginTop: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <iframe
                title={`Map of ${hotel.name}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodeURIComponent(hotel.name + ', ' + (hotel.location || 'Chiang Dao, Thailand'))}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
              ></iframe>
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.95rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {hotel.location}
            </p>
          </div>

          {/* Contact */}
          {hotel.contact && (
            <div className="detail-section">
              <h2>Contact Information</h2>
              <div className="contact-grid">
                {hotel.contact.phone && (
                  <div className="contact-item">
                    <span className="contact-icon"></span>
                    <div>
                      <strong>Phone</strong>
                      <a href={`tel:${hotel.contact.phone}`}>{hotel.contact.phone}</a>
                    </div>
                  </div>
                )}
                {hotel.contact.email && (
                  <div className="contact-item">
                    <span className="contact-icon"></span>
                    <div>
                      <strong>Email</strong>
                      <a href={`mailto:${hotel.contact.email}`}>{hotel.contact.email}</a>
                    </div>
                  </div>
                )}
                {hotel.contact.line && (
                  <div className="contact-item">
                    <span className="contact-icon" style={{ color: '#06C755', fontWeight: 700 }}>LINE</span>
                    <div>
                      <strong>LINE ID</strong>
                      <span>{hotel.contact.line}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column — booking sidebar */}
        <aside className="detail-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-price">
              <span className="price-label">From</span>
              <span className="price-amount">฿{hotel.pricePerNight.toLocaleString()}</span>
              <span className="price-unit">/ night</span>
            </div>

            {hotel.host && (
              <div className="sidebar-host">
                <div className="host-avatar">
                  {hotel.host.name.charAt(0)}
                </div>
                <div className="host-info">
                  <strong>{hotel.host.name}</strong>
                  <span>Host since {hotel.host.since}</span>
                </div>
              </div>
            )}

            {hotel.features?.length > 0 && (
              <div className="sidebar-features">
                {hotel.features.map((f) => (
                  <span key={f} className="feature-tag">✓ {f}</span>
                ))}
              </div>
            )}

            {user && !user.isVerified && (
              <div className="verification-lock-notice" style={{
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.85rem'
              }}>
                Verify your email to contact hosts and book this property.
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="sidebar-book-btn"
              disabled={!!(user && !user.isVerified)}
              onClick={() => hotel.contact?.phone ? window.open(`tel:${hotel.contact.phone}`) : null}
            >
              Contact Host
            </Button>
            <Button
              variant="outline"
              size="md"
              className="sidebar-msg-btn"
              disabled={!!(user && !user.isVerified)}
              onClick={() => hotel.contact?.email ? window.open(`mailto:${hotel.contact.email}`) : null}
            >
              Send Message
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};
