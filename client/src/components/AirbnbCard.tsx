import React from 'react';
import './AirbnbCard.css';

interface AirbnbCardProps {
  image: string;
  title: string;
  subtitle: string;
  price: string;
  rating: number;
  reviews?: number;
  isGuestFavorite?: boolean;
  onClick?: () => void;
}

export const AirbnbCard: React.FC<AirbnbCardProps> = ({
  image,
  title,
  subtitle,
  price,
  rating,
  reviews,
  isGuestFavorite,
  onClick
}) => {
  return (
    <div className="airbnb-card" onClick={onClick}>
      <div className="airbnb-card-image-wrapper">
        <img src={image} alt={title} className="airbnb-card-image" loading="lazy" />
        
        {/* Heart Icon (Favourite) */}
        <div className="airbnb-card-heart">
          <svg 
            viewBox="0 0 32 32" 
            xmlns="http://www.w3.org/2000/svg" 
            aria-hidden="true" 
            role="presentation" 
            focusable="false" 
            style={{ display: 'block', fill: 'rgba(0, 0, 0, 0.5)', height: '24px', width: '24px', stroke: 'white', strokeWidth: '2', overflow: 'visible' }}
          >
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.81 0-3.52.68-4.82 1.84L16 7.41l-2.18-1.57A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z"></path>
          </svg>
        </div>

        {/* Guest Favourite Badge */}
        {isGuestFavorite && (
          <div className="airbnb-card-badge">
            Guest favorite
          </div>
        )}
      </div>

      <div className="airbnb-card-content">
        <div className="airbnb-card-header">
          <h3 className="airbnb-card-title">{title}</h3>
          <div className="airbnb-card-rating">
            <span className="star">★</span>
            <span>{rating.toFixed(2)}</span>
            {reviews && <span className="reviews-count">({reviews})</span>}
          </div>
        </div>
        
        <p className="airbnb-card-subtitle">{subtitle}</p>
        <p className="airbnb-card-distance">Chiang Dao, Thailand</p>
        
        <div className="airbnb-card-price">
          <span>{price}</span> / night
        </div>
      </div>
    </div>
  );
};
