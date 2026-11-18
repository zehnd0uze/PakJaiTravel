import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { type Property } from '../types';
import { supabase } from '../utils/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';
import { compressImage } from '../utils/imageCompression';
import './HostPostCreation.css';

interface HostPostCreationProps {
  onPostCreated?: () => void;
  initialPropertyId?: string;
}

const PROMPT_SUGGESTIONS = [
  { label: 'Morning Mist & Weather', prefix: 'Morning update from our stay: ' },
  { label: 'Room Availability', prefix: 'Availability update for upcoming dates: ' },
  { label: 'Seasonal Highlight', prefix: 'Special experience at our property right now: ' }
];

const HostPostCreation: React.FC<HostPostCreationProps> = ({ onPostCreated, initialPropertyId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [propertyId, setPropertyId] = useState(initialPropertyId || '');
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPropertyId) {
      setPropertyId(initialPropertyId);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [initialPropertyId]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Fetch host's properties
  useEffect(() => {
    const fetchMyProperties = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id);
        if (error) throw error;
        if (data) {
          const formatted = (data as any[]).map(p => ({
            ...p,
            pricePerNight: p.price_per_night,
            imageUrl: p.image_url,
            isVerified: p.is_verified
          }));
          setMyProperties(formatted);
          if (!propertyId && !initialPropertyId && formatted.length === 1) {
            setPropertyId(formatted[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch owned properties", err);
      }
    };
    fetchMyProperties();
  }, [user]);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      let compressed = file;
      if (file.type.startsWith('image/')) {
        try {
          compressed = await compressImage(file);
        } catch (cErr) {
          console.warn('Compression fallback:', cErr);
        }
      }

      const url = await uploadToCloudinary(compressed);
      if (url) {
        setImageUrl(url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleApplyPrompt = (prefix: string) => {
    if (!content.trim()) {
      setContent(prefix);
    } else if (!content.includes(prefix)) {
      setContent(prev => `${prefix}${prev}`);
    }
    textareaRef.current?.focus();
  };

  const handlePublish = async () => {
    if (!content.trim() && !imageUrl) {
      setError('Please add some content or an image to your post');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!user) throw new Error("Not authenticated");
      const postData = {
        content: content.trim(),
        image_url: imageUrl || null,
        property_id: propertyId || null,
        location_tag: myProperties.find(p => p.id === propertyId)?.name || null,
        user_id: user.id,
        author_name: user.name,
        author_avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2c4c3b&color=fff`
      };

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      setContent('');
      setImageUrl('');
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProperty = myProperties.find(p => p.id === propertyId);

  return (
    <div className="host-post-box animate-fade-in">
      {selectedProperty && (
        <div className="composer-linked-stay">
          <span>Posting update linked to <strong>{selectedProperty.name}</strong></span>
        </div>
      )}

      <div className="post-box-header">
        <img 
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Host')}&background=2C4C3B&color=fff`} 
          alt="Avatar" 
          className="user-mini-avatar"
        />
        <div className="post-textarea-wrapper">
          <textarea
            ref={textareaRef}
            placeholder={`Share today's atmosphere, mountain view, or room availability at ${selectedProperty?.name || 'your property'}, ${user?.name?.split(' ')[0]}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="composer-prompt-chips">
        <span className="prompt-chips-label">Quick topics:</span>
        {PROMPT_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="prompt-chip-btn"
            onClick={() => handleApplyPrompt(item.prefix)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {imageUrl && (
        <div className="post-preview-image">
          <img src={imageUrl} alt="Preview" />
          <button className="remove-img" onClick={() => setImageUrl('')} title="Remove image">&times;</button>
        </div>
      )}

      {error && <div className="post-error-msg">{error}</div>}

      <div className="post-box-actions">
        <div className="left-actions">
          <input 
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageFile}
          />
          <button 
            type="button"
            className="action-tool-btn" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            title="Upload Photo"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>{isUploading ? 'Uploading...' : 'Add Photo'}</span>
          </button>
          
          <div className="property-tag-selector">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tag-icon">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <select 
              value={propertyId} 
              onChange={(e) => setPropertyId(e.target.value)}
              className="tag-dropdown"
            >
              <option value="">Tag an accommodation...</option>
              {myProperties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="publish-btn" 
          onClick={handlePublish} 
          disabled={isSubmitting || (!content.trim() && !imageUrl)}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Update'}
        </button>
      </div>
    </div>
  );
};

export default HostPostCreation;
