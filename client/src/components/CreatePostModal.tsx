import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { type Post } from '../types';
import { uploadToCloudinary } from '../utils/cloudinary';
import { supabase } from '../utils/supabase';
import { compressImage } from '../utils/imageCompression';
import PlaceSearchPicker from './PlaceSearchPicker';
import { getPostPhotos, MAX_POST_PHOTOS } from '../utils/postPhotos';
import './CreatePostModal.css';

interface PostPhoto {
  id: string;
  preview: string;
  url?: string;
  file?: File;
}

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
  postToEdit?: Post; // Use shared Post type
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated, postToEdit }) => {
  const { user } = useAuth();
  const [content, setContent] = useState(postToEdit?.content || '');
  // Each photo is either already uploaded (url) or a new file waiting to upload
  const [photos, setPhotos] = useState<PostPhoto[]>(() =>
    postToEdit ? getPostPhotos(postToEdit).map(url => ({ id: url, preview: url, url })) : []
  );
  const [rating, setRating] = useState<number>(postToEdit?.rating || 0);
  const [priceRating, setPriceRating] = useState<string>(postToEdit?.priceRating || '');
  const [priceValue, setPriceValue] = useState<number>(() => {
    const pr = postToEdit?.priceRating || '';
    if (pr === '฿฿฿฿') return 5000;
    if (pr === '฿฿฿') return 3000;
    if (pr === '฿฿') return 1500;
    if (pr === '฿') return 500;
    return 0;
  });

  const getPriceLabel = (val: number): string => {
    if (val === 0) return 'ไม่ระบุ';
    if (val <= 500) return '0 - 500 THB';
    if (val <= 1000) return '500 - 1,000 THB';
    if (val <= 1500) return '1,000 - 1,500 THB';
    if (val <= 2000) return '1,500 - 2,000 THB';
    if (val <= 3000) return '2,000 - 3,000 THB';
    return '3,000+ THB';
  };

  const getPriceSymbol = (val: number): string => {
    if (val === 0) return '';
    if (val <= 500) return '฿';
    if (val <= 1500) return '฿฿';
    if (val <= 3000) return '฿฿฿';
    return '฿฿฿฿';
  };
  const [locationTag, setLocationTag] = useState(postToEdit?.locationTag || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    postToEdit?.lat && postToEdit?.lng ? { lat: postToEdit.lat, lng: postToEdit.lng } : null
  );
  const [propertyId, setPropertyId] = useState(postToEdit?.propertyId || '');
  const [joinPotw, setJoinPotw] = useState(postToEdit?.joinPotw || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!postToEdit;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const placeInputRef = useRef<HTMLInputElement>(null);

  const handlePlaceChange = (tag: string, coords: { lat: number; lng: number } | null, propId?: string) => {
    setLocationTag(tag);
    setCoordinates(coords);
    if (propId) {
      setPropertyId(propId);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // let the same file be picked again after removing it
    if (picked.length === 0) return;

    const room = MAX_POST_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`เพิ่มรูปได้สูงสุด ${MAX_POST_PHOTOS} รูปต่อโพสต์`);
      return;
    }

    const added: PostPhoto[] = [];
    let tooBig = false;
    for (const originalFile of picked.slice(0, room)) {
      // Auto-compress the image to prevent upload limits
      const file = await compressImage(originalFile);

      // Cloudinary unsigned upload limit is usually 10MB
      if (file.size > 10 * 1024 * 1024) {
        tooBig = true;
        continue;
      }
      added.push({ id: `${file.name}-${file.size}-${Math.random()}`, preview: URL.createObjectURL(file), file });
    }

    if (tooBig) setError('บางรูปมีขนาดใหญ่เกิน 10MB จึงไม่ได้เพิ่ม');
    else if (picked.length > room) setError(`เพิ่มรูปได้สูงสุด ${MAX_POST_PHOTOS} รูปต่อโพสต์`);
    else setError('');

    setPhotos(prev => [...prev, ...added]);
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const gone = prev.find(p => p.id === id);
      if (gone?.file) URL.revokeObjectURL(gone.preview);
      return prev.filter(p => p.id !== id);
    });
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && photos.length === 0) {
      setError('Please add a photo or write something.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      // Upload new photos in parallel, keep the order the user arranged
      const imageUrls = await Promise.all(
        photos.map(p => (p.file ? uploadToCloudinary(p.file) : Promise.resolve(p.url!)))
      );

      if (!user) throw new Error('Not authenticated');

      const postData = {
        content: content.trim(),
        image_url: imageUrls[0] || null,
        images: imageUrls,
        property_id: propertyId || null,
        location_tag: locationTag.trim() || null,
        lat: coordinates?.lat || null,
        lng: coordinates?.lng || null,
        rating: rating > 0 ? rating : null,
        price_rating: priceRating || null,
        join_potw: joinPotw,
        user_id: user.id,
        author_name: user.name,
        author_avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2C4C3B&color=fff`
      };

      const save = (data: Partial<typeof postData>) => isEditing
        ? supabase.from('posts').update(data).eq('id', postToEdit.id)
        : supabase.from('posts').insert(data);

      let { error } = await save(postData);
      // Database without the images column yet (supabase/add_post_images.sql): save the first photo only
      if (error && /images/.test(error.message)) {
        ({ error } = await save({ ...postData, images: undefined }));
      }
      if (error) throw error;

      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2C4C3B&color=fff&bold=true`;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="create-post-modal">
        <div className="modal-header">
          <h2>{isEditing ? 'แก้ไขโพสต์' : 'สร้างโพสต์ใหม่'}</h2>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="user-section">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={avatarUrl} alt={user?.name || 'User'} />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <div className="visibility-badge">
                สาธารณะ
              </div>
            </div>
          </div>

          <form onSubmit={submitPost} id="fb-post-form">
            <div className="textarea-container">
              <textarea 
                className="create-post-textarea"
                placeholder={isEditing ? 'แก้ไขข้อความของคุณ...' : `คุณคิดอะไรอยู่ ${user?.name?.split(' ')[0] || ''}? เล่าประสบการณ์การเดินทางของคุณ...`}
                value={content}
                onChange={e => setContent(e.target.value)}
                autoFocus
              />
            </div>

            {photos.length > 0 && (
              <div className="photo-picker">
                <div className="photo-picker-head">
                  <span>รูปภาพ {photos.length}/{MAX_POST_PHOTOS}</span>
                  {photos.length < MAX_POST_PHOTOS && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}>
                      + เพิ่มรูป
                    </button>
                  )}
                </div>
                <ul className="photo-picker-grid">
                  {photos.map((p, i) => (
                    <li key={p.id} className="photo-picker-item">
                      <img src={p.preview} alt={`รูปที่ ${i + 1}`} />
                      {i === 0 && photos.length > 1 && <span className="photo-picker-cover">รูปปก</span>}
                      <button
                        type="button"
                        className="photo-picker-remove"
                        onClick={() => removePhoto(p.id)}
                        aria-label={`ลบรูปที่ ${i + 1}`}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="fb-location-input-container">
              <PlaceSearchPicker
                value={locationTag}
                coordinates={coordinates}
                onChange={handlePlaceChange}
                inputRef={placeInputRef}
                placeholder="เพิ่มสถานที่ / ค้นหาที่พักหรือจุดท่องเที่ยว..."
              />
            </div>

            <div className="fb-ratings-bar">
              <div className="ratings-item">
                <label>คะแนน</label>
                <div className="fb-star-selector">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      className={star <= rating ? 'fb-star active' : 'fb-star'}
                      onClick={() => setRating(star === rating ? 0 : star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="fb-price-slider-container">
              <div className="fb-price-slider-header">
                <label>ระดับราคา</label>
                <span className="fb-price-slider-value">{getPriceLabel(priceValue)}</span>
              </div>
              <input
                type="range"
                className="fb-price-slider"
                min={0}
                max={5000}
                step={500}
                value={priceValue}
                style={{ '--slider-pct': `${(priceValue / 5000) * 100}%` } as React.CSSProperties}
                onChange={e => {
                  const val = Number(e.target.value);
                  setPriceValue(val);
                  setPriceRating(getPriceSymbol(val));
                }}
              />
              <div className="fb-price-slider-labels">
                <span>ไม่ระบุ</span>
                <span>500</span>
                <span>1,000</span>
                <span>1,500</span>
                <span>2,000</span>
                <span>3,000</span>
                <span>3,000+</span>
              </div>
            </div>

            <label className="potw-compete-toggle">
              <input
                type="checkbox"
                checked={joinPotw}
                onChange={e => setJoinPotw(e.target.checked)}
              />
              <span className="potw-compete-text">
                <span className="potw-compete-title">ร่วมแข่งขันภาพแห่งสัปดาห์</span>
                <span className="potw-compete-hint">ภาพของคุณจะถูกโหวตให้ขึ้นหน้าแรกเป็น "ภาพแห่งสัปดาห์"</span>
              </span>
            </label>

            <div className="add-to-post-container">
              <span className="add-to-post-label">เพิ่มลงในโพสต์</span>
              <div className="add-to-post-options">
                <input 
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
                <button 
                  type="button" 
                  className="option-btn" 
                  title="เพิ่มรูปภาพ"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="#45BD62"><path d="M18 13v5c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2zm-4.5-1c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM4 11v6l3-3.01L10 17l4-4v4h2v-6H4zM20 4H6c-1.1 0-2 .9-2 2v2h2V6h14v12h-2v2h2c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>
                </button>
                <button type="button" className="option-btn" title="แท็กเพื่อน">
                  <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </button>
                <button type="button" className="option-btn" title="ความรู้สึก">
                  <svg viewBox="0 0 24 24" fill="#F7B928"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM7 14c1.66 2.01 3.33 3 5 3s3.34-.99 5-3H7z"/></svg>
                </button>
                <button 
                  type="button" 
                  className="option-btn" 
                  title="เช็คอินสถานที่"
                  onClick={() => placeInputRef.current?.focus()}
                >
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
            className={`fb-post-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting || (!content.trim() && photos.length === 0)}
          >
            {isSubmitting
              ? (isEditing ? 'กำลังบันทึก...' : 'กำลังโพสต์...')
              : (isEditing ? 'บันทึกการแก้ไข' : 'โพสต์')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
