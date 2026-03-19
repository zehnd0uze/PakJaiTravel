import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface PropertyForm {
  name: string;
  type: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  images: string[];
  isVerified: boolean;
  features: string[];
  amenities: string[];
  location: string;
  province: string;
  district: string;
  description: string;
  checkIn: string;
  checkOut: string;
  hostName: string;
  hostSince: string;
  phone: string;
  email: string;
  line: string;
  status: string;
}

const emptyForm: PropertyForm = {
  name: '', type: 'Homestay', pricePerNight: 0, currency: 'THB',
  rating: 0, reviews: 0, imageUrl: '', images: [],
  isVerified: true, features: [], amenities: [],
  location: '', province: 'Chiang Mai', district: 'Chiang Dao',
  description: '', checkIn: '14:00', checkOut: '11:00',
  hostName: '', hostSince: '', phone: '', email: '', line: '',
  status: 'draft',
};

export const AdminHotelEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      fetch(`/api/properties/${id}`)
        .then(r => r.json())
        .then(data => {
          setForm({
            name: data.name || '',
            type: data.type || 'Homestay',
            pricePerNight: data.pricePerNight || 0,
            currency: data.currency || 'THB',
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            imageUrl: data.imageUrl || '',
            images: data.images || [],
            isVerified: data.isVerified ?? true,
            features: data.features || [],
            amenities: data.amenities || [],
            location: data.location || '',
            province: data.province || '',
            district: data.district || '',
            description: data.description || '',
            checkIn: data.checkIn || '14:00',
            checkOut: data.checkOut || '11:00',
            hostName: data.host?.name || '',
            hostSince: data.host?.since || '',
            phone: data.contact?.phone || '',
            email: data.contact?.email || '',
            line: data.contact?.line || '',
            status: data.status || 'published',
          });
        })
        .catch(() => setAlert({ type: 'error', message: 'Failed to load property.' }));
    }
  }, [id, isNew]);

  const handleChange = (field: keyof PropertyForm, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'features' | 'amenities' | 'images', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value.split(',').map(s => s.trim()).filter(Boolean),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.pricePerNight) {
      setAlert({ type: 'error', message: 'Name and price are required.' });
      return;
    }

    setSaving(true);
    const body = {
      name: form.name,
      type: form.type,
      pricePerNight: Number(form.pricePerNight),
      currency: form.currency,
      rating: Number(form.rating),
      reviews: Number(form.reviews),
      imageUrl: form.imageUrl || form.images[0] || '',
      images: form.images,
      isVerified: form.isVerified,
      features: form.features,
      amenities: form.amenities,
      location: form.location || `${form.district}, ${form.province}`,
      province: form.province,
      district: form.district,
      description: form.description,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      host: { name: form.hostName, since: form.hostSince },
      contact: {
        phone: form.phone,
        email: form.email,
        ...(form.line ? { line: form.line } : {}),
      },
      status: form.status,
    };

    try {
      const url = isNew ? '/api/properties' : `/api/properties/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setAlert({ type: 'success', message: isNew ? 'Property created!' : 'Property updated!' });
        setTimeout(() => navigate('/admin/hotels'), 1000);
      } else {
        const errData = await res.json().catch(() => null);
        setAlert({ type: 'error', message: errData?.error || `Failed to save (${res.status}).` });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Network error — is the backend server running?' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>{isNew ? 'Add New Property' : `Edit: ${form.name}`}</h1>
        <div className="admin-topbar-actions">
          {!isNew && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => window.open(`/hotels/${id}`, '_blank')}
            >
              👁️ Preview Live
            </button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {alert && (
          <div className={`admin-alert ${alert.type}`}>
            {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
          </div>
        )}

        <div className="admin-form-container">
          {/* Basic Info */}
          <div className="admin-form-section">
            <h3>Basic Information</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Property Name</label>
                <input
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="e.g. Baan Rabiang Dao Homestay"
                />
              </div>
              <div className="admin-form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => handleChange('type', e.target.value)}>
                  <option value="Homestay">Homestay</option>
                  <option value="Resort">Resort</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Price Per Night (THB)</label>
                <input
                  type="number"
                  value={form.pricePerNight}
                  onChange={e => handleChange('pricePerNight', Number(e.target.value))}
                  placeholder="800"
                />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="admin-form-section">
            <h3>Location</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Province</label>
                <input
                  value={form.province}
                  onChange={e => handleChange('province', e.target.value)}
                  placeholder="Chiang Mai"
                />
              </div>
              <div className="admin-form-group">
                <label>District</label>
                <input
                  value={form.district}
                  onChange={e => handleChange('district', e.target.value)}
                  placeholder="Chiang Dao"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="admin-form-section">
            <h3>Description</h3>
            <div className="admin-form-grid single">
              <div className="admin-form-group">
                <label>Property Description</label>
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Describe the property, its surroundings, and what makes it special..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="admin-form-section">
            <h3>Images</h3>
            <div className="admin-form-grid single">
              <div className="admin-form-group">
                <label>Cover Image URL</label>
                <input
                  value={form.imageUrl}
                  onChange={e => handleChange('imageUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="admin-form-group">
                <label>Gallery Image URLs (comma-separated)</label>
                <textarea
                  value={form.images.join(', ')}
                  onChange={e => handleArrayChange('images', e.target.value)}
                  placeholder="https://img1.jpg, https://img2.jpg, ..."
                />
              </div>
            </div>
          </div>

          {/* Features & Amenities */}
          <div className="admin-form-section">
            <h3>Features & Amenities</h3>
            <div className="admin-form-grid single">
              <div className="admin-form-group">
                <label>Key Features (comma-separated)</label>
                <input
                  value={form.features.join(', ')}
                  onChange={e => handleArrayChange('features', e.target.value)}
                  placeholder="Doi Luang View, Breakfast Included, ..."
                />
              </div>
              <div className="admin-form-group">
                <label>Amenities (comma-separated)</label>
                <input
                  value={form.amenities.join(', ')}
                  onChange={e => handleArrayChange('amenities', e.target.value)}
                  placeholder="Wi-Fi, Parking, Hot Shower, ..."
                />
              </div>
            </div>
          </div>

          {/* Check-in/out */}
          <div className="admin-form-section">
            <h3>House Rules</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Check-in Time</label>
                <input value={form.checkIn} onChange={e => handleChange('checkIn', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>Check-out Time</label>
                <input value={form.checkOut} onChange={e => handleChange('checkOut', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Host & Contact */}
          <div className="admin-form-section">
            <h3>Host & Contact</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Host Name</label>
                <input
                  value={form.hostName}
                  onChange={e => handleChange('hostName', e.target.value)}
                  placeholder="Khun Somchai"
                />
              </div>
              <div className="admin-form-group">
                <label>Host Since (Year)</label>
                <input
                  value={form.hostSince}
                  onChange={e => handleChange('hostSince', e.target.value)}
                  placeholder="2019"
                />
              </div>
              <div className="admin-form-group">
                <label>Phone</label>
                <input
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+66 89 123 4567"
                />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="admin-form-group">
                <label>LINE ID (optional)</label>
                <input
                  value={form.line}
                  onChange={e => handleChange('line', e.target.value)}
                  placeholder="@lineid"
                />
              </div>
              <div className="admin-form-group">
                <label>Verified</label>
                <select
                  value={form.isVerified ? 'true' : 'false'}
                  onChange={e => handleChange('isVerified', e.target.value === 'true')}
                >
                  <option value="true">✅ Verified</option>
                  <option value="false">❌ Not Verified</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rating (for existing) */}
          <div className="admin-form-section">
            <h3>Rating & Reviews</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Rating (0-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={e => handleChange('rating', Number(e.target.value))}
                />
              </div>
              <div className="admin-form-group">
                <label>Number of Reviews</label>
                <input
                  type="number"
                  value={form.reviews}
                  onChange={e => handleChange('reviews', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="admin-form-actions">
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : isNew ? 'Create Property' : 'Save Changes'}
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => navigate('/admin/hotels')}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
