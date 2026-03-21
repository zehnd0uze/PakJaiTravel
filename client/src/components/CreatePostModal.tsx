import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import './CreatePostModal.css';

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '200px',
  borderRadius: '8px',
  marginTop: '12px'
};

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [priceRating, setPriceRating] = useState<string>('');
  const [locationTag, setLocationTag] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setCoordinates({ lat, lng });
        
        if (place.name) {
          setLocationTag(place.name);
        } else if (place.formatted_address) {
          setLocationTag(place.formatted_address);
        }
      }
    }
  };

  const clearLocation = () => {
    setLocationTag('');
    setCoordinates(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) {
      setError('Please add a photo or write something.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('images', imageFile); 
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        
        const uploadData = await uploadRes.json();
        if (uploadData.urls && uploadData.urls.length > 0) {
          imageUrl = uploadData.urls[0];
        } else {
          throw new Error('Image upload failed to return a URL');
        }
      }

      const postRes = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl,
          locationTag: locationTag.trim() || null,
          lat: coordinates?.lat || null,
          lng: coordinates?.lng || null,
          rating: rating > 0 ? rating : null,
          priceRating: priceRating || null
        })
      });

      if (!postRes.ok) throw new Error('Failed to create post');

      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="create-post-modal">
        <div className="modal-header">
          <h2>สร้างโพสต์</h2>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="user-section">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <div className="visibility-badge">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zM11.5 8a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"/>
                </svg>
                สาธารณะ
                <svg width="8" height="8" viewBox="0 0 10 6" fill="currentColor">
                  <path d="M0 0l5 6 5-6H0z"/>
                </svg>
              </div>
            </div>
          </div>

          <form onSubmit={submitPost} id="fb-post-form">
            <div className="textarea-container">
              <textarea 
                className="create-post-textarea"
                placeholder={`คุณคิดอะไรอยู่ ${user?.name?.split(' ')[0] || ''}?`}
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" />
                <button 
                  type="button" 
                  className="remove-image-btn" 
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                >
                  &times;
                </button>
              </div>
            )}

            <div className="fb-location-input-container">
              {isLoaded ? (
                <div className="fb-location-group">
                  <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                    <div className="fb-location-input-wrapper">
                      <span>📍</span>
                      <input 
                        type="text" 
                        placeholder="เพิ่มสถานที่..."
                        value={locationTag}
                        onChange={e => setLocationTag(e.target.value)}
                      />
                      {locationTag && (
                        <button type="button" className="clear-location-btn" onClick={clearLocation}>
                          &times;
                        </button>
                      )}
                    </div>
                  </Autocomplete>
                  
                  {coordinates && isLoaded && (
                    <div className="fb-map-preview">
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={coordinates}
                        zoom={15}
                        options={{
                          disableDefaultUI: true,
                          gestureHandling: 'cooperative'
                        }}
                      >
                        <Marker position={coordinates} />
                      </GoogleMap>
                    </div>
                  )}
                </div>
              ) : (
                <div className="fb-location-input-wrapper">
                  <span>📍</span>
                  <input 
                    type="text" 
                    placeholder="เพิ่มสถานที่..."
                    value={locationTag}
                    onChange={e => setLocationTag(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="fb-ratings-bar">
              <div className="ratings-item">
                <label>คะแนน</label>
                <div className="fb-star-selector">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      className={star <= rating ? 'fb-star active' : 'fb-star'}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="ratings-item">
                <label>ราคา</label>
                <select 
                  className="fb-price-select"
                  value={priceRating} 
                  onChange={e => setPriceRating(e.target.value)}
                >
                  <option value="">เลือก</option>
                  <option value="$">ประหยัด ($)</option>
                  <option value="$$">ทั่วไป ($$)</option>
                  <option value="$$$">แพง ($$$)</option>
                  <option value="$$$$">หรูหรา ($$$$)</option>
                </select>
              </div>
            </div>

            <div className="add-to-post-container">
              <span className="add-to-post-label">เพิ่มลงในโพสต์ของคุณ</span>
              <div className="add-to-post-options">
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
                <button 
                  type="button" 
                  className="option-btn" 
                  title="Photo/Video"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="#45BD62"><path d="M18 13v5c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2zm-4.5-1c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM4 11v6l3-3.01L10 17l4-4v4h2v-6H4zM20 4H6c-1.1 0-2 .9-2 2v2h2V6h14v12h-2v2h2c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>
                </button>
                <button type="button" className="option-btn" title="Tag Friends">
                  <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </button>
                <button type="button" className="option-btn" title="Feeling/Activity">
                  <svg viewBox="0 0 24 24" fill="#F7B928"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM7 14c1.66 2.01 3.33 3 5 3s3.34-.99 5-3H7z"/></svg>
                </button>
                <button type="button" className="option-btn" title="Check-in">
                  <svg viewBox="0 0 24 24" fill="#F3425F"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="post-btn-container">
          <button 
            type="submit" 
            form="fb-post-form" 
            className="fb-post-btn" 
            disabled={isSubmitting || (!content.trim() && !imageFile)}
          >
            {isSubmitting ? 'กำลังโพสต์...' : 'โพสต์'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
