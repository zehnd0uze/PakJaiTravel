import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { type Property } from '../types';
import { supabase } from '../utils/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';
import { compressImage } from '../utils/imageCompression';
import { TermsModal } from './TermsModal';
import './PropertyEditModal.css';

interface PropertyEditModalProps {
  property?: Property;
  onClose: () => void;
  onSave: () => void;
}

const PROPERTY_TYPES = [
  'Homestay',
  'Resort',
  'Hotel',
  'Villa',
  'Guesthouse',
  'Glamping',
  'Eco Lodge',
  'Cabin'
];

const POPULAR_DISTRICTS = [
  'Chiang Dao',
  'Mae Rim',
  'Samoeng',
  'Fang',
  'Hang Dong',
  'Mueang Chiang Mai',
  'Chom Thong',
  'Mae Taeng',
  'Pai (Mae Hong Son)'
];

const PRESET_FEATURES = [
  'Doi Luang View',
  'Mountain View',
  'Sunrise View',
  'Riverfront',
  'Breakfast Included',
  'Private Balcony',
  'Firepit / Campfire',
  'Coffee Plantation',
  'Organic Farm',
  'Stargazing',
  'Nature Trail',
  'Local Cooking'
];

const PRESET_AMENITIES = [
  'Free Wi-Fi',
  'Air Conditioning',
  'Hot Shower',
  'Free Parking',
  'Swimming Pool',
  'Private Bathroom',
  'Kitchen',
  'Fan',
  'Workspace',
  'Pet Friendly',
  'Bicycles',
  'BBQ Grill'
];

const PropertyEditModal: React.FC<PropertyEditModalProps> = ({ property, onClose, onSave }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isEditing = !!property;

  const currentYear = new Date().getFullYear().toString();

  const [name, setName] = useState(property?.name || '');
  const [type, setType] = useState(property?.type || 'Homestay');
  const [price, setPrice] = useState(
    property?.pricePerNight?.toString() || 
    property?.price_per_night?.toString() || 
    property?.price?.toString() || 
    '1500'
  );
  const [priceType, setPriceType] = useState<'per_night' | 'per_person'>(
    property?.priceType || property?.price_type || 'per_night'
  );
  const [status, setStatus] = useState<'published' | 'draft' | 'pending'>(
    property?.status === 'published' ? 'published' : (property?.status === 'draft' ? 'draft' : 'pending')
  );
  
  const [province, setProvince] = useState(property?.province || 'Chiang Mai');
  const [district, setDistrict] = useState(property?.district || 'Chiang Dao');
  const [location, setLocation] = useState(
    property?.location || (property?.district ? `${property.district}, Chiang Mai` : 'Chiang Dao, Chiang Mai')
  );
  const [description, setDescription] = useState(property?.description || '');

  const [images, setImages] = useState<string[]>(
    property?.images && property.images.length > 0 
      ? property.images 
      : property?.imageUrl || property?.image_url 
        ? [property.imageUrl || property.image_url || ''] 
        : []
  );
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(property?.features || []);
  const [customFeature, setCustomFeature] = useState('');

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property?.amenities || []);
  const [customAmenity, setCustomAmenity] = useState('');

  const [checkIn, setCheckIn] = useState(property?.checkIn || property?.check_in || '14:00');
  const [checkOut, setCheckOut] = useState(property?.checkOut || property?.check_out || '11:00');

  const [hostName, setHostName] = useState(
    property?.host?.name || property?.host_info?.name || user?.name || ''
  );
  const [hostSince, setHostSince] = useState(
    property?.host?.since || property?.host_info?.since || currentYear
  );
  const [phone, setPhone] = useState(property?.contact?.phone || '');
  const [email, setEmail] = useState(property?.contact?.email || user?.email || '');
  const [line, setLine] = useState(property?.contact?.line || '');
  const [termsAccepted, setTermsAccepted] = useState(isEditing);
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy' | null>(null);

  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'amenities' | 'contact'>('details');

  // Toggle helper
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleAddCustomFeature = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (customFeature.trim() && !selectedFeatures.includes(customFeature.trim())) {
      setSelectedFeatures([...selectedFeatures, customFeature.trim()]);
      setCustomFeature('');
    }
  };

  const handleAddCustomAmenity = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      setSelectedAmenities([...selectedAmenities, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  // Image Upload Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    setError('');
    
    try {
      const originalFiles = Array.from(e.target.files);
      const newUrls: string[] = [];

      for (const file of originalFiles) {
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(file);
          } catch (compErr) {
            console.warn('Image compression fallback:', compErr);
          }
        }

        const url = await uploadToCloudinary(fileToUpload);
        if (url) {
          newUrls.push(url);
        }
      }

      setImages(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image. You can also paste image URLs directly.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddCustomImageUrl = () => {
    if (customImageUrl.trim()) {
      setImages(prev => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveImageToCover = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const updated = [...prev];
      const [chosen] = updated.splice(index, 1);
      updated.unshift(chosen);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('propertyEditModal.errorName'));
      setActiveTab('details');
      return;
    }

    if (!termsAccepted) {
      setError('You must agree to the Terms of Service and Privacy Policy to list your property.');
      setActiveTab('contact');
      return;
    }

    const numericPrice = Number(price.toString().replace(/,/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError(t('propertyEditModal.errorPrice'));
      setActiveTab('details');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user) throw new Error('Not authenticated');

      const primaryImage = images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200';

      const dbData: any = {
        name: name.trim(),
        type,
        price_per_night: numericPrice,
        price_type: priceType,
        currency: 'THB',
        image_url: primaryImage,
        images: images.length > 0 ? images : [primaryImage],
        features: selectedFeatures,
        amenities: selectedAmenities,
        location: location.trim() || `${district}, ${province}`,
        province,
        district,
        description: description.trim(),
        check_in: checkIn,
        check_out: checkOut,
        host_info: {
          name: hostName.trim() || user.name || 'Host',
          since: hostSince.trim() || currentYear
        },
        contact: {
          phone: phone.trim(),
          email: email.trim() || user.email || '',
          line: line.trim()
        },
        status,
        owner_id: user.id
      };

      if (isEditing && property?.id) {
        const { error: updateError } = await supabase
          .from('properties')
          .update(dbData)
          .eq('id', property.id);

        if (updateError) throw updateError;
      } else {
        dbData.rating = 5.0;
        dbData.reviews = 0;
        dbData.is_verified = true;

        const { error: insertError } = await supabase
          .from('properties')
          .insert(dbData);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || t('propertyEditModal.errorSave'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="property-edit-modal animate-slide-up">
        <div className="modal-header">
          <div>
            <h2>{isEditing ? t('propertyEditModal.titleEdit', { name: property.name }) : t('propertyEditModal.titleNew')}</h2>
            <p className="modal-subtitle">{t('propertyEditModal.subtitle')}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs">
          <button 
            type="button"
            className={`modal-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            {t('propertyEditModal.tabBasic')}
          </button>
          <button 
            type="button"
            className={`modal-tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            {t('propertyEditModal.tabPhotos')}
          </button>
          <button 
            type="button"
            className={`modal-tab-btn ${activeTab === 'amenities' ? 'active' : ''}`}
            onClick={() => setActiveTab('amenities')}
          >
            {t('propertyEditModal.tabAmenities')}
          </button>
          <button 
            type="button"
            className={`modal-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            {t('propertyEditModal.tabHost')}
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} className="property-form">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'details' && (
            <div className="tab-pane animate-fade-in">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="prop-name">{t('propertyEditModal.nameLabel')}</label>
                  <input 
                    id="prop-name"
                    type="text" 
                    placeholder={t('propertyEditModal.namePlaceholder')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prop-type">{t('propertyEditModal.typeLabel')}</label>
                  <select 
                    id="prop-type"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prop-price">{t('propertyEditModal.priceLabel')}</label>
                  <div className="price-input-wrapper">
                    <span className="currency-label">฿</span>
                    <input 
                      id="prop-price"
                      type="number" 
                      min="0"
                      step="50"
                      placeholder="1500" 
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prop-price-type">{t('propertyEditModal.priceTypeLabel')}</label>
                  <select 
                    id="prop-price-type"
                    value={priceType}
                    onChange={e => setPriceType(e.target.value as 'per_night' | 'per_person')}
                  >
                    <option value="per_night">{t('propertyEditModal.perNight')}</option>
                    <option value="per_person">{t('propertyEditModal.perPerson')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prop-district">{t('propertyEditModal.districtLabel')}</label>
                  <select 
                    id="prop-district"
                    value={district}
                    onChange={e => {
                      setDistrict(e.target.value);
                      if (!location || location === `${district}, ${province}`) {
                        setLocation(`${e.target.value}, ${province}`);
                      }
                    }}
                  >
                    {POPULAR_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prop-province">{t('propertyEditModal.provinceLabel')}</label>
                  <input 
                    id="prop-province"
                    type="text"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="prop-loc">{t('propertyEditModal.locationLabel')}</label>
                  <input 
                    id="prop-loc"
                    type="text" 
                    placeholder={t('propertyEditModal.locationPlaceholder')}
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="prop-desc">{t('propertyEditModal.descriptionLabel')}</label>
                  <textarea 
                    id="prop-desc"
                    placeholder={t('propertyEditModal.descriptionPlaceholder')}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prop-status">{t('propertyEditModal.statusLabel')}</label>
                  <select 
                    id="prop-status"
                    value={status}
                    onChange={e => setStatus(e.target.value as 'published' | 'draft' | 'pending')}
                  >
                    {(user?.role === 'admin' || status === 'published') && (
                      <option value="published">{t('propertyEditModal.statusPublished')}</option>
                    )}
                    <option value="pending">{t('propertyEditModal.statusPending')}</option>
                    <option value="draft">{t('propertyEditModal.statusDraft')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS & GALLERY */}
          {activeTab === 'photos' && (
            <div className="tab-pane animate-fade-in">
              <div className="photo-upload-section">
                <div className="photo-dropzone">
                  <input 
                    type="file" 
                    id="property-file-input"
                    multiple 
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="property-file-input" className={`dropzone-label ${uploading ? 'disabled' : ''}`}>
                    <span className="dropzone-icon">📷</span>
                    <strong>{uploading ? t('propertyEditModal.uploading') : t('propertyEditModal.uploadText')}</strong>
                    <span>{t('propertyEditModal.uploadSubtext')}</span>
                  </label>
                </div>

                <div className="url-input-row">
                  <input 
                    type="text"
                    placeholder={t('propertyEditModal.urlPlaceholder')}
                    value={customImageUrl}
                    onChange={e => setCustomImageUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomImageUrl(); } }}
                  />
                  <button type="button" className="btn-add-url" onClick={handleAddCustomImageUrl}>
                    {t('propertyEditModal.addUrlBtn')}
                  </button>
                </div>

                {images.length > 0 ? (
                  <div className="photo-gallery-preview">
                    <p className="gallery-hint">
                      {t('propertyEditModal.coverHint')}
                    </p>
                    <div className="preview-grid">
                      {images.map((img, idx) => (
                        <div key={idx} className={`preview-item ${idx === 0 ? 'is-cover' : ''}`}>
                          <img src={img} alt={`Property upload ${idx + 1}`} />
                          {idx === 0 && <span className="cover-badge">{t('propertyEditModal.coverBadge')}</span>}
                          <div className="preview-actions">
                            {idx !== 0 && (
                              <button 
                                type="button" 
                                className="preview-cover-btn"
                                onClick={() => handleMoveImageToCover(idx)}
                                title="Make Cover Photo"
                              >
                                {t('propertyEditModal.setCoverBtn')}
                              </button>
                            )}
                            <button 
                              type="button" 
                              className="preview-remove-btn"
                              onClick={() => handleRemoveImage(idx)}
                              title="Delete Photo"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-photos-notice">
                    {t('propertyEditModal.noPhotos')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AMENITIES & FEATURES */}
          {activeTab === 'amenities' && (
            <div className="tab-pane animate-fade-in">
              <div className="chips-section">
                <h3>{t('propertyEditModal.highlightsTitle')}</h3>
                <p className="chips-hint">{t('propertyEditModal.highlightsHint')}</p>
                <div className="chips-grid">
                  {PRESET_FEATURES.map(feat => (
                    <button
                      key={feat}
                      type="button"
                      className={`chip-btn ${selectedFeatures.includes(feat) ? 'selected' : ''}`}
                      onClick={() => toggleItem(selectedFeatures, setSelectedFeatures, feat)}
                    >
                      {selectedFeatures.includes(feat) ? '✓ ' : '+ '} {feat}
                    </button>
                  ))}
                </div>

                <div className="custom-chip-adder">
                  <input 
                    type="text"
                    placeholder={t('propertyEditModal.addFeaturePlaceholder')}
                    value={customFeature}
                    onChange={e => setCustomFeature(e.target.value)}
                    onKeyDown={handleAddCustomFeature}
                  />
                  <button type="button" onClick={handleAddCustomFeature}>{t('propertyEditModal.addBtn')}</button>
                </div>
              </div>

              <div className="chips-section" style={{ marginTop: '32px' }}>
                <h3>{t('propertyEditModal.amenitiesTitle')}</h3>
                <p className="chips-hint">{t('propertyEditModal.amenitiesHint')}</p>
                <div className="chips-grid">
                  {PRESET_AMENITIES.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      className={`chip-btn ${selectedAmenities.includes(amenity) ? 'selected' : ''}`}
                      onClick={() => toggleItem(selectedAmenities, setSelectedAmenities, amenity)}
                    >
                      {selectedAmenities.includes(amenity) ? '✓ ' : '+ '} {amenity}
                    </button>
                  ))}
                </div>

                <div className="custom-chip-adder">
                  <input 
                    type="text"
                    placeholder={t('propertyEditModal.addAmenityPlaceholder')}
                    value={customAmenity}
                    onChange={e => setCustomAmenity(e.target.value)}
                    onKeyDown={handleAddCustomAmenity}
                  />
                  <button type="button" onClick={handleAddCustomAmenity}>{t('propertyEditModal.addBtn')}</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOST CONTACT & HOUSE RULES */}
          {activeTab === 'contact' && (
            <div className="tab-pane animate-fade-in">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="host-name">{t('propertyEditModal.hostNameLabel')}</label>
                  <input 
                    id="host-name"
                    type="text" 
                    placeholder="e.g. P'Somchai" 
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="host-since">{t('propertyEditModal.hostSinceLabel')}</label>
                  <input 
                    id="host-since"
                    type="text" 
                    placeholder="2024" 
                    value={hostSince}
                    onChange={e => setHostSince(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-phone">{t('propertyEditModal.phoneLabel')}</label>
                  <input 
                    id="contact-phone"
                    type="tel" 
                    placeholder="081-234-5678" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-line">{t('propertyEditModal.lineLabel')}</label>
                  <input 
                    id="contact-line"
                    type="text" 
                    placeholder="@homestay or line_id" 
                    value={line}
                    onChange={e => setLine(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="contact-email">{t('propertyEditModal.emailLabel')}</label>
                  <input 
                    id="contact-email"
                    type="email" 
                    placeholder="host@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="check-in-time">{t('propertyEditModal.checkInLabel')}</label>
                  <input 
                    id="check-in-time"
                    type="text" 
                    placeholder="14:00" 
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="check-out-time">{t('propertyEditModal.checkOutLabel')}</label>
                  <input 
                    id="check-out-time"
                    type="text" 
                    placeholder="11:00" 
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group full-width" style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="property-terms" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: '4px', cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <label htmlFor="property-terms" style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, cursor: 'pointer', margin: 0 }}>
                    I confirm that I am the legal owner or authorized manager of this property, and I agree to PakJai Travel's <button type="button" onClick={(e) => { e.preventDefault(); setTermsModalType('terms'); }} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</button> and <button type="button" onClick={(e) => { e.preventDefault(); setTermsModalType('privacy'); }} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</button>. I guarantee that all provided information is accurate and true.
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              {t('propertyEditModal.cancelBtn')}
            </button>
            <div className="action-buttons-right">
              {activeTab !== 'contact' ? (
                <button 
                  type="button" 
                  className="next-tab-btn"
                  onClick={() => {
                    if (activeTab === 'details') setActiveTab('photos');
                    else if (activeTab === 'photos') setActiveTab('amenities');
                    else if (activeTab === 'amenities') setActiveTab('contact');
                  }}
                >
                  {t('propertyEditModal.nextBtn')}
                </button>
              ) : null}
              <button 
                type="submit" 
                className="save-btn" 
                disabled={isSubmitting || uploading}
              >
                {isSubmitting ? t('propertyEditModal.savingBtn') : (isEditing ? t('propertyEditModal.saveChangesBtn') : t('propertyEditModal.publishBtn'))}
              </button>
            </div>
          </div>
        </form>
      </div>

      <TermsModal 
        isOpen={termsModalType !== null} 
        type={termsModalType} 
        onClose={() => setTermsModalType(null)} 
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PropertyEditModal;
