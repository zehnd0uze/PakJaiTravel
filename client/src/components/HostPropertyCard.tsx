import React from 'react';
import { type Property } from '../types';
import './HostPropertyCard.css';

interface HostPropertyCardProps {
  property: Property;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  onPromote: (p: Property) => void;
}

const HostPropertyCard: React.FC<HostPropertyCardProps> = ({ property, onEdit, onDelete, onPromote }) => {
  return (
    <div className="host-property-card">
      <div className="property-img-wrapper">
        <img src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=300'} alt={property.name} />
        <span className={`status-badge ${property.status}`}>{property.status}</span>
      </div>
      <div className="property-info">
        <div className="info-main">
          <h3>{property.name}</h3>
          <p className="property-type">{property.type}</p>
          <div className="property-stats">
            <span className="stat-item">฿{property.price} / night</span>
            <span className="dot-sep">•</span>
            <span className="stat-item">{property.views || 0} views</span>
          </div>
        </div>
        <div className="property-actions">
          <button className="h-action-btn promote" onClick={() => onPromote(property)}>
            Promote ↗
          </button>
          <button className="h-action-btn edit" onClick={() => onEdit(property)}>
            Edit
          </button>
          <button className="h-action-btn delete" onClick={() => {
            if (window.confirm('Delete this listing?')) onDelete(property.id);
          }}>
            &times;
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostPropertyCard;
