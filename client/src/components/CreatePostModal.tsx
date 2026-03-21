import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import './CreatePostModal.css';

const libraries: ("places")[] = ["places"];

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
  const { token } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [priceRating, setPriceRating] = useState<string>('');
  const [locationTag, setLocationTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      if (place && place.formatted_address) {
        setLocationTag(place.formatted_address);
      } else if (place && place.name) {
        setLocationTag(place.name);
      }
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
        formData.append('image', imageFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.fileUrl;
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
          rating: rating > 0 ? rating : null,
          priceRating: priceRating || null
        })
      });

      if (!postRes.ok) throw new Error('Failed to create post');

      onPostCreated();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content create-post-modal">
        <button className="close-btn" onClick={onClose} disabled={isSubmitting}>&times;</button>
        <h2>Create a Post or Review</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={submitPost}>
          <div className="form-group">
            <label>Share your experience</label>
            <textarea 
              placeholder="What did you love about your stay?"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group photo-upload">
            <label>Add a Photo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => e.target.files && setImageFile(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label>Location / Hotel (Optional)</label>
            {isLoaded ? (
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <input 
                  type="text" 
                  placeholder="Search exact location..."
                  value={locationTag}
                  onChange={e => setLocationTag(e.target.value)}
                />
              </Autocomplete>
            ) : (
              <input 
                type="text" 
                placeholder="E.g., The Chiang Dao Resort"
                value={locationTag}
                onChange={e => setLocationTag(e.target.value)}
              />
            )}
            {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
              <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                Note: Google Maps live search unavailable (API Key missing).
              </small>
            )}
          </div>

          <div className="ratings-container">
            <div className="form-group">
              <label>Star Rating</label>
              <div className="star-selector">
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star} 
                    className={star <= rating ? 'star active' : 'star'}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Price Rating</label>
              <select value={priceRating} onChange={e => setPriceRating(e.target.value)}>
                <option value="">Select (Optional)</option>
                <option value="$">Cheap ($)</option>
                <option value="$$">Moderate ($$)</option>
                <option value="$$$">Expensive ($$$)</option>
                <option value="$$$$">Luxury ($$$$)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary submit-post-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
