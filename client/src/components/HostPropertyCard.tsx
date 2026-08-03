import React from 'react';
import { Link } from 'react-router-dom';
import { type Property } from '../types';
import './HostPropertyCard.css';

interface HostPropertyCardProps {
  property: Property;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  onPromote: (p: Property) => void;
}

const HostPropertyCard: React.FC<HostPropertyCardProps> = ({ property, onEdit, onDelete, onPromote }) => {
  const displayImage = property.images?.[0] || property.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600';
  const displayPrice = Number(property.pricePerNight || property.price || 0);

  return (
    <div className="host-property-card">
      <div className="property-img-wrapper">
        <img src={displayImage} alt={property.name} />
        <span className={`status-badge ${property.status || 'active'}`}>{property.status || 'active'}</span>
      </div>
      <div className="property-info">
        <div className="info-main">
          <h3>{property.name}</h3>
          <p className="property-type">
            {property.type} {property.district ? `• ${property.district}, ${property.province || 'Chiang Mai'}` : ''}
          </p>
          <div className="property-stats">
            <span className="stat-item">฿{displayPrice.toLocaleString()} / night</span>
            <span className="dot-sep">•</span>
            <span className="stat-item">{property.views || 0} views</span>
            {property.isVerified && (
              <>
                <span className="dot-sep">•</span>
                <span className="stat-item verified-tag" style={{ color: '#2c4c3b', fontWeight: 600 }}>✓ Verified</span>
              </>
            )}
          </div>
        </div>
        <div className="property-actions">
          <Link to={`/hotels/${property.id}`} className="h-action-btn view-live" title="View Public Page" target="_blank" rel="noopener noreferrer">
            View Live ↗
          </Link>
          <button className="h-action-btn promote" onClick={() => onPromote(property)} title="Create community post for this property">
            Post Update
          </button>
          <button className="h-action-btn edit" onClick={() => onEdit(property)}>
            Edit
          </button>
          <button className="h-action-btn delete" onClick={() => {
            if (window.confirm(`Are you sure you want to delete "${property.name}"?`)) onDelete(property.id);
          }}>
            &times;
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostPropertyCard;
