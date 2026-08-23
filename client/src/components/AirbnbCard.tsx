import React from 'react';
import { useTranslation } from 'react-i18next';
import './AirbnbCard.css';

interface HeritageCardProps {
  image: string;
  title: string;
  subtitle: string;
  price: string;
  priceType?: 'per_night' | 'per_person';
  rating: number;
  reviews?: number;
  isGuestFavorite?: boolean;
  onClick?: () => void;
}

export const AirbnbCard: React.FC<HeritageCardProps> = ({
  image,
  title,
  subtitle,
  price,
  priceType = 'per_night',
  rating,
  reviews,
  isGuestFavorite,
  onClick
}) => {
  const { t } = useTranslation();

  return (
    <div className="heritage-card" onClick={onClick}>
      <div className="heritage-card-image-wrapper">
        <img src={image} alt={title} className="heritage-card-image" loading="lazy" />
        
        {/* Heart Icon (Favourite) */}
        <button className="heritage-card-heart" aria-label="Save to favorites">
          <svg 
            viewBox="0 0 32 32" 
            xmlns="http://www.w3.org/2000/svg" 
            aria-hidden="true" 
            role="presentation" 
            focusable="false" 
          >
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.81 0-3.52.68-4.82 1.84L16 7.41l-2.18-1.57A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
          </svg>
        </button>

        {/* Guest Favourite Badge (Luxury styled) */}
        {isGuestFavorite && (
          <div className="heritage-card-badge">
            Curator's Pick
          </div>
        )}
      </div>

      <div className="heritage-card-content">
        <div className="heritage-card-header">
          <h3 className="heritage-card-title">{title}</h3>
          {reviews > 0 ? (
            <div className="heritage-card-rating">
              <span className="star">★</span>
              <span>{Number(rating || 0).toFixed(2)}</span>
              <span className="reviews-count">({reviews})</span>
            </div>
          ) : (
            <div className="heritage-card-rating new-badge">
              <span style={{ fontSize: '0.8rem', padding: '2px 6px', background: 'var(--primary-color)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>New</span>
            </div>
          )}
        </div>
        
        <p className="heritage-card-subtitle">{subtitle}</p>
        <p className="heritage-card-distance">Chiang Dao, Thailand</p>
        
        <div className="heritage-card-price">
          <span>{price}</span> <span className="price-suffix">{priceType === 'per_person' ? t('common.perPerson') : t('common.perNight')}</span>
        </div>
      </div>
    </div>
  );
};
