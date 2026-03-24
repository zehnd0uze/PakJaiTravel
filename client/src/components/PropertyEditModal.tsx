import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { type Property } from '../types';
import './PropertyEditModal.css';

interface PropertyEditModalProps {
  property?: Property; // Existing property if editing
  onClose: () => void;
  onSave: () => void;
}

const PropertyEditModal: React.FC<PropertyEditModalProps> = ({ property, onClose, onSave }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: property?.name || '',
    type: property?.type || 'Guesthouse',
    price: property?.price || '',
    description: (property as any)?.description || '',
    images: property?.images?.join(', ') || '',
    amenities: property?.amenities?.join(', ') || '',
    status: property?.status || 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!property;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      ...formData,
      images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const url = isEditing ? `/api/properties/${property.id}` : '/api/properties';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save property');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="property-edit-modal animate-slide-up">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Listing' : 'List New Property'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="property-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Property Name</label>
              <input 
                type="text" 
                placeholder="e.g. Moonlight Mountain Retreat" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Guesthouse">Guesthouse</option>
                <option value="Resort">Resort</option>
                <option value="Hotel">Hotel</option>
                <option value="Villa">Villa</option>
                <option value="Homestay">Homestay</option>
              </select>
            </div>

            <div className="form-group">
              <label>Base Price (per night)</label>
              <div className="price-input-wrapper">
                <span className="currency-label">฿</span>
                <input 
                  type="text" 
                  placeholder="3,500" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea 
                placeholder="Describe the charm of your place..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={4}
              />
            </div>

            <div className="form-group full-width">
              <label>Image URLs (comma separated)</label>
              <input 
                type="text" 
                placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg" 
                value={formData.images}
                onChange={e => setFormData({...formData, images: e.target.value})}
              />
              <p className="helper-text">Add multiple URLs separated by commas.</p>
            </div>

            <div className="form-group full-width">
              <label>Amenities (comma separated)</label>
              <input 
                type="text" 
                placeholder="Free WiFi, Mountain View, Pool, Breakfast" 
                value={formData.amenities}
                onChange={e => setFormData({...formData, amenities: e.target.value})}
              />
            </div>
            
            <div className="form-group">
               <label>Listing Status</label>
               <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'draft'})}
              >
                <option value="active">Active (Visible to all)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyEditModal;
