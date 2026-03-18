import React from 'react';
import './Card.css';
import { VerifiedBadge } from './VerifiedBadge';

interface CardProps {
  image?: string;
  title: string;
  subtitle?: string;
  price?: string;
  rating?: number;
  badge?: string;
  isVerified?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  image,
  title,
  subtitle,
  price,
  rating,
  badge,
  isVerified,
  onClick,
  className = ''
}) => {
  return (
    <div className={`destination-card hover-lift ${className}`} onClick={onClick}>
      {image && (
        <div className="card-image-container">
          <img src={image} alt={title} className="card-image" />
          {badge && <div className="card-badge">{badge}</div>}
        </div>
      )}
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">
            {title}
            {isVerified && <div style={{marginTop: '8px'}}><VerifiedBadge /></div>}
          </h3>
          {rating && (
            <div className="card-rating">
              <span className="star">★</span> {rating}
            </div>
          )}
        </div>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
        {price && (
          <div className="card-price">
            From <span>{price}</span>
          </div>
        )}
      </div>
    </div>
  );
};
