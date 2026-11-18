import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Property } from '../types';
import './HostPropertyCard.css';

interface HostPropertyCardProps {
  property: Property;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  onPromote: (p: Property) => void;
}

const HostPropertyCard: React.FC<HostPropertyCardProps> = ({ property, onEdit, onDelete, onPromote }) => {
  const { t } = useTranslation();

  const imagesList = property.images && property.images.length > 0
    ? property.images
    : (property.imageUrl ? [property.imageUrl] : []);
  const displayImage = imagesList[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600';
  const photoCount = imagesList.length;

  const displayPrice = Number(property.pricePerNight || property.price || 0);
  const isPerPerson = (property as any).priceType === 'per_person' || (property as any).price_type === 'per_person';
  const statusKey = (property.status || 'published').toLowerCase();

  const hasDirectContact = Boolean(property.contact?.phone?.trim() || property.contact?.line?.trim());
  const totalFeaturesAndAmenities = (property.amenities?.length || 0) + (property.features?.length || 0);

  return (
    <article className="host-property-card">
      <div className="host-property-media" onClick={() => onEdit(property)} title={t('hostDashboard.card.edit')}>
        <img src={displayImage} alt={property.name} loading="lazy" />
        <span className={`host-status-pill ${statusKey}`}>
          <span className="status-dot" />
          {property.status || 'published'}
        </span>
        <span className="host-photo-count">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {t('hostDashboard.card.photosCount', { count: photoCount })}
        </span>
      </div>

      <div className="host-property-body">
        <div className="host-property-top">
          <div className="host-property-heading-group">
            <div className="host-property-eyebrow">
              <span>{property.type || 'Stay'}</span>
              {property.district && (
                <>
                  <span className="eyebrow-sep">·</span>
                  <span>{property.district}, {property.province || 'Chiang Mai'}</span>
                </>
              )}
              {property.isVerified && (
                <span className="host-verified-pill">
                  <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {t('hostDashboard.card.verified')}
                </span>
              )}
            </div>
            <h3 className="host-property-title">{property.name}</h3>
          </div>

          <div className="host-property-price-box">
            <span className="host-price-amount">฿{displayPrice.toLocaleString()}</span>
            <span className="host-price-unit">
              {isPerPerson ? t('common.perPerson') : t('common.perNight')}
            </span>
          </div>
        </div>

        <div className="host-property-meta-pills">
          <span className="meta-chip">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {t('hostDashboard.card.views', { count: property.views || 0 })}
          </span>

          {hasDirectContact ? (
            <span className="meta-chip meta-chip-ok">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {t('hostDashboard.card.contactReady')}
            </span>
          ) : (
            <button
              type="button"
              className="meta-chip meta-chip-warn"
              onClick={() => onEdit(property)}
              title="Click to add Phone or LINE ID"
            >
              <span>⚠ {t('hostDashboard.card.contactMissing')}</span>
            </button>
          )}

          <span className="meta-chip">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {t('hostDashboard.card.amenitiesCount', { count: totalFeaturesAndAmenities })}
          </span>

          {property.checkIn && (
            <span className="meta-chip">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {t('hostDashboard.card.checkIn', { time: property.checkIn })}
            </span>
          )}
        </div>

        <div className="host-property-footer">
          <Link
            to={`/hotels/${property.id}`}
            className="h-card-btn h-card-btn-ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t('hostDashboard.card.viewLive')}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>

          <div className="host-property-actions-right">
            <button
              type="button"
              className="h-card-btn h-card-btn-promote"
              onClick={() => onPromote(property)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{t('hostDashboard.card.postUpdate')}</span>
            </button>

            <button
              type="button"
              className="h-card-btn h-card-btn-edit"
              onClick={() => onEdit(property)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>{t('hostDashboard.card.edit')}</span>
            </button>

            <button
              type="button"
              className="h-card-btn h-card-btn-delete"
              title={t('hostDashboard.card.delete')}
              onClick={() => {
                if (window.confirm(t('hostDashboard.card.confirmDelete', { name: property.name }))) {
                  onDelete(property.id);
                }
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default HostPropertyCard;
