import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ClaimPropertyModal } from '../components/ClaimPropertyModal';
import { CHIANG_DAO_ATLAS_STAYS } from '../utils/chiangDaoStays';
import './HotelDetail.css';

interface Hotel {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  priceType?: 'per_night' | 'per_person';
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
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Fetch from API
  useEffect(() => {
    if (!id) return;
    const fetchHotel = async () => {
      const atlasMatch = CHIANG_DAO_ATLAS_STAYS.find(s => s.id === id);
      if (atlasMatch) {
        setHotel({
          id: atlasMatch.id,
          name: atlasMatch.name,
          type: atlasMatch.type,
          rating: atlasMatch.rating || 4.8,
          reviews: atlasMatch.reviews || 120,
          pricePerNight: Number(atlasMatch.pricePerNight || 800),
          priceType: atlasMatch.price_type || 'per_night',
          currency: atlasMatch.currency || 'THB',
          imageUrl: atlasMatch.imageUrl || '/doiluangbg.jpg',
          images: atlasMatch.images?.length ? atlasMatch.images : [atlasMatch.imageUrl || '/doiluangbg.jpg'],
          isVerified: atlasMatch.isVerified ?? true,
          features: atlasMatch.features || [],
          amenities: atlasMatch.amenities || [],
          location: atlasMatch.location || 'Chiang Dao, Chiang Mai',
          description: atlasMatch.description || '',
          checkIn: '14:00',
          checkOut: '11:00',
          host: atlasMatch.host || { name: 'Verified Chiang Dao Host', since: '2020' },
          contact: {
            phone: atlasMatch.contact?.phone || '',
            email: atlasMatch.contact?.email || '',
            line: atlasMatch.contact?.line || '',
          },
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles ( name, created_at )
        `)
        .eq('id', id)
        .single();
        
      if (error || !data) {
        setLoading(false);
        return;
      }
      
      const formatted: Hotel = {
        ...data,
        pricePerNight: Number(data.price_per_night || data.price || 0),
        priceType: data.price_type || 'per_night',
        imageUrl: data.image_url || data.images?.[0] || '',
        images: data.images?.length ? data.images : (data.image_url ? [data.image_url] : []),
        isVerified: data.is_verified ?? true,
        checkIn: data.check_in || '14:00',
        checkOut: data.check_out || '11:00',
        features: data.features || [],
        amenities: data.amenities || [],
        location: data.location || (data.district ? `${data.district}, ${data.province || 'Chiang Mai'}` : 'Chiang Mai, Thailand'),
        host: {
          name: data.host_info?.name || data.profiles?.name || 'Local Host',
          since: data.host_info?.since || (data.profiles?.created_at ? new Date(data.profiles.created_at).getFullYear().toString() : '2024')
        },
        contact: data.contact || {
          phone: data.phone || '',
          email: data.email || '',
          line: data.line || ''
        }
      };
      
      setHotel(formatted);
      setLoading(false);
    };
    
    fetchHotel();
  }, [id]);

  if (loading) {
    return (
      <div className="hotel-detail-page container section-padding animate-fade-in">
        <p style={{ textAlign: 'center', padding: '80px 0', color: '#8A94A6' }}>{t('hotelDetail.loading')}</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="hotel-detail-page container section-padding animate-fade-in">
        <div className="not-found">
          <h1>{t('hotelDetail.notFoundTitle')}</h1>
          <p>{t('hotelDetail.notFoundBody')}</p>
          <Button variant="primary" size="md" onClick={() => navigate('/hotels')}>
            {t('hotelDetail.browseStays')}
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
        <span className="breadcrumb-link" onClick={() => navigate('/')}>{t('hotelDetail.breadcrumbHome')}</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-link" onClick={() => navigate('/hotels')}>{t('hotelDetail.breadcrumbHotels')}</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{hotel.name}</span>
      </div>

      {/* Photo Gallery */}
      {images.length > 0 && (
        <section className="detail-gallery container">
          <div className="gallery-main">
            <img
              src={images[selectedImage]}
              alt={`${hotel.name} — ${selectedImage + 1}`}
              className="gallery-main-img"
            />
            <div className="gallery-photo-count">
              {t('hotelDetail.photoCount', { current: selectedImage + 1, total: images.length })}
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
              {hotel.reviews > 0 ? (
                <div className="detail-rating-block">
                  <span className="detail-rating-score">{hotel.rating}</span>
                  <div className="detail-rating-meta">
                    <span className="detail-rating-label">
                      {hotel.rating >= 4.8
                        ? t('hotelDetail.ratingExceptional')
                        : hotel.rating >= 4.5
                          ? t('hotelDetail.ratingExcellent')
                          : t('hotelDetail.ratingVeryGood')}
                    </span>
                    <span className="detail-reviews">{t('hotelDetail.reviewsCount', { count: hotel.reviews })}</span>
                  </div>
                </div>
              ) : (
                <div className="detail-rating-block new-property" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="detail-rating-score" style={{ fontSize: '1rem', padding: '6px 12px', background: 'var(--primary-color)', color: 'white', borderRadius: '8px', fontWeight: 600 }}>{t('hotelDetail.newBadge')}</span>
                  <div className="detail-rating-meta" style={{ marginLeft: '12px' }}>
                    <span className="detail-rating-label" style={{ fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 600 }}>{t('hotelDetail.noReviewsYet')}</span>
                  </div>
                </div>
              )}
            </div>
            {hotel.isVerified && (
              <div className="detail-verified-banner">
                <VerifiedBadge />
                <span>{t('hotelDetail.verifiedBanner')}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {hotel.description && (
            <div className="detail-section">
              <h2>{t('hotelDetail.aboutTitle')}</h2>
              <p className="detail-description">{hotel.description}</p>
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities?.length > 0 && (
            <div className="detail-section">
              <h2>{t('hotelDetail.amenitiesTitle')}</h2>
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
              <h2>{t('hotelDetail.houseRulesTitle')}</h2>
              <div className="rules-grid">
                <div className="rule-item">
                  <span className="rule-icon"></span>
                  <div>
                    <strong>{t('hotelDetail.checkIn')}</strong>
                    <span>{t('hotelDetail.checkInAfter', { time: hotel.checkIn })}</span>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-icon"></span>
                  <div>
                    <strong>{t('hotelDetail.checkOut')}</strong>
                    <span>{t('hotelDetail.checkOutBefore', { time: hotel.checkOut })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Map */}
          <div className="detail-section">
            <h2>{t('hotelDetail.locationTitle')}</h2>
            <div className="map-container" style={{ width: '100%', height: '400px', borderRadius: '20px', overflow: 'hidden', marginTop: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <iframe
                title={`Map of ${hotel.name}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?width=100%25&height=600&hl=th&q=${encodeURIComponent(hotel.name + ', ' + (hotel.location || 'Chiang Dao, Thailand'))}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
              ></iframe>
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.95rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {hotel.location}
            </p>
          </div>

          {/* Contact */}
          {hotel.contact && (
            <div className="detail-section">
              <h2>{t('hotelDetail.contactTitle')}</h2>
              <div className="contact-grid">
                {hotel.contact.phone && (
                  <div className="contact-item">
                    <span className="contact-icon"></span>
                    <div>
                      <strong>{t('hotelDetail.phone')}</strong>
                      <a href={`tel:${hotel.contact.phone}`}>{hotel.contact.phone}</a>
                    </div>
                  </div>
                )}
                {hotel.contact.email && (
                  <div className="contact-item">
                    <span className="contact-icon"></span>
                    <div>
                      <strong>{t('hotelDetail.email')}</strong>
                      <a href={`mailto:${hotel.contact.email}`}>{hotel.contact.email}</a>
                    </div>
                  </div>
                )}
                {hotel.contact.line && (
                  <div className="contact-item">
                    <span className="contact-icon" style={{ color: '#06C755', fontWeight: 700 }}>LINE</span>
                    <div>
                      <strong>{t('hotelDetail.lineId')}</strong>
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
              <span className="price-label">{t('hotelDetail.from')}</span>
              <span className="price-amount">฿{hotel.pricePerNight.toLocaleString()}</span>
              <span className="price-unit">{hotel.priceType === 'per_person' ? t('common.perPerson') : t('common.perNight')}</span>
            </div>

            {hotel.host && (
              <div className="sidebar-host">
                <div className="host-avatar">
                  {hotel.host.name.charAt(0)}
                </div>
                <div className="host-info">
                  <strong>{hotel.host.name}</strong>
                  <span>{t('hotelDetail.hostSince', { year: hotel.host.since })}</span>
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
                {t('hotelDetail.verifyToContact')}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="sidebar-book-btn"
              disabled={!!(user && !user.isVerified)}
              onClick={() => hotel.contact?.phone ? window.open(`tel:${hotel.contact.phone}`) : null}
            >
              {t('hotelDetail.callHost')} {hotel.contact?.phone ? `(${hotel.contact.phone})` : ''}
            </Button>
            {hotel.contact?.line && (
              <Button
                variant="outline"
                size="md"
                className="sidebar-line-btn"
                style={{ borderColor: '#06C755', color: '#06C755', fontWeight: 600, marginTop: '8px' }}
                disabled={!!(user && !user.isVerified)}
                onClick={() => {
                  const cleanLine = (hotel.contact?.line || '').replace('@', '');
                  window.open(`https://line.me/R/ti/p/~${cleanLine}`, '_blank');
                }}
              >
                {t('hotelDetail.chatLine')} ({hotel.contact.line})
              </Button>
            )}
            <Button
              variant="outline"
              size="md"
              className="sidebar-msg-btn"
              disabled={!!(user && !user.isVerified)}
              onClick={() => hotel.contact?.email ? window.open(`mailto:${hotel.contact.email}?subject=Booking Inquiry for ${hotel.name}`) : null}
            >
              {t('hotelDetail.sendEmail')}
            </Button>

            {/* Claim Property Banner for Owners */}
            <div style={{
              marginTop: '20px',
              padding: '14px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                {t('hotelDetail.ownerQuestion')}
              </span>
              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1.5px solid #2e7d32',
                  color: '#2e7d32',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#2e7d32';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = '#2e7d32';
                }}
              >
                {t('hotelDetail.claimListing')}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Claim Property Modal */}
      <ClaimPropertyModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        preselectedPropertyId={hotel.id}
        preselectedPropertyName={hotel.name}
      />
    </div>
  );
};
