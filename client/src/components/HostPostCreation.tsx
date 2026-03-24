import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { type Property } from '../types';
import './HostPostCreation.css';



interface HostPostCreationProps {
  onPostCreated?: () => void;
}

const HostPostCreation: React.FC<HostPostCreationProps> = ({ onPostCreated }) => {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      try {
        const res = await fetch('/api/properties/owned', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMyProperties(data);
        }
      } catch (err) {
        console.error("Failed to fetch owned properties", err);
      }
    };
    if (token) fetchMyProperties();
  }, [token]);

  const handlePublish = async () => {
    if (!content.trim() && !imageUrl) {
      setError('Please add some content to your post');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          imageUrl,
          propertyId: propertyId || null,
          locationTag: myProperties.find(p => p.id === propertyId)?.name || null
        })
      });

      if (res.ok) {
        setContent('');
        setImageUrl('');
        setPropertyId('');
        if (onPostCreated) onPostCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to publish post');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="host-post-box glass-panel animate-fade-in">
      <div className="post-box-header">
        <img 
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Host')}&background=2C4C3B&color=fff`} 
          alt="Avatar" 
          className="user-mini-avatar"
        />
        <div className="post-textarea-wrapper">
          <textarea
            ref={textareaRef}
            placeholder={`What's happening at your property, ${user?.name?.split(' ')[0]}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {imageUrl && (
        <div className="post-preview-image">
          <img src={imageUrl} alt="Preview" />
          <button className="remove-img" onClick={() => setImageUrl('')}>&times;</button>
        </div>
      )}

      {error && <div className="post-error-msg">{error}</div>}

      <div className="post-box-actions">
        <div className="left-actions">
          <button className="action-tool-btn" onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) setImageUrl(url);
          }} title="Add Media">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.75 12.04c-.07-.07-.15-.14-.24-.19L17 10.67V6.5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h7.08c-.05-.33-.08-.66-.08-1 0-3.31 2.69-6 6-6 .25 0 .5.02.75.04zm-14.75-5.54h10v3.46l-2.02 1.17c-.36.21-.57.59-.57 1.01v.96L10 14.5l-2-2-4.22 4.22V6.5zM18 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm1 5h-2v2h-2v-2h-2v-2h2v-2h2v2h2v2z"/></svg>
          </button>
          
          <div className="property-tag-selector">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="tag-icon"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 8.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/></svg>
            <select 
              value={propertyId} 
              onChange={(e) => setPropertyId(e.target.value)}
              className="tag-dropdown"
            >
              <option value="">Tag a listing...</option>
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
          {isSubmitting ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </div>
  );
};

export default HostPostCreation;
