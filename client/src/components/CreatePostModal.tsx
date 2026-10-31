import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

// Price levels stored as ฿ symbols; the range tells people what each level means
const PRICE_LEVELS = [
  { value: '฿', range: '< 500' },
  { value: '฿฿', range: '500–1,500' },
  { value: '฿฿฿', range: '1,500–3,000' },
  { value: '฿฿฿฿', range: '3,000+' },
];

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>
  </svg>
);

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated, postToEdit }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [content, setContent] = useState(postToEdit?.content || '');
  // Each photo is either already uploaded (url) or a new file waiting to upload
  const [photos, setPhotos] = useState<PostPhoto[]>(() =>
    postToEdit ? getPostPhotos(postToEdit).map(url => ({ id: url, preview: url, url })) : []
  );
  const [rating, setRating] = useState<number>(postToEdit?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [priceRating, setPriceRating] = useState<string>((postToEdit?.priceRating || '').replace(/\$/g, '฿'));
  const [reviewOpen, setReviewOpen] = useState(Boolean(postToEdit?.rating || postToEdit?.priceRating));
  const [locationTag, setLocationTag] = useState(postToEdit?.locationTag || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    postToEdit?.lat && postToEdit?.lng ? { lat: postToEdit.lat, lng: postToEdit.lng } : null
  );
  const [propertyId, setPropertyId] = useState(postToEdit?.propertyId || '');
  const [joinPotw, setJoinPotw] = useState(postToEdit?.joinPotw || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!postToEdit;
  const canPost = !isSubmitting && (content.trim().length > 0 || photos.length > 0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const placeInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Esc closes (unless a post is uploading)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSubmitting, onClose]);

  // Textarea grows with what people write
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const handlePlaceChange = (tag: string, coords: { lat: number; lng: number } | null, propId?: string) => {
    setLocationTag(tag);
    setCoordinates(coords);
    if (propId) {
      setPropertyId(propId);
    }
  };

  const addFiles = async (picked: File[]) => {
    const images = picked.filter(f => f.type.startsWith('image/'));
    if (images.length === 0) return;

    const room = MAX_POST_PHOTOS - photos.length;
    if (room <= 0) {
      setError(t('createPost.errors.maxPhotos', { max: MAX_POST_PHOTOS }));
      return;
    }

    const added: PostPhoto[] = [];
    let tooBig = false;
    for (const originalFile of images.slice(0, room)) {
      // Auto-compress the image to prevent upload limits
      const file = await compressImage(originalFile);

      // Cloudinary unsigned upload limit is usually 10MB
      if (file.size > 10 * 1024 * 1024) {
        tooBig = true;
        continue;
      }
      added.push({ id: `${file.name}-${file.size}-${Math.random()}`, preview: URL.createObjectURL(file), file });
    }

    if (tooBig) setError(t('createPost.errors.tooBig'));
    else if (images.length > room) setError(t('createPost.errors.maxPhotos', { max: MAX_POST_PHOTOS }));
    else setError('');

    setPhotos(prev => [...prev, ...added]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // let the same file be picked again after removing it
    addFiles(picked);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files || []));
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
      setError(t('createPost.errors.empty'));
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
        join_potw: imageUrls.length > 0 && joinPotw,
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
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('createPost.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2C4C3B&color=fff&bold=true`;
  const firstName = user?.name?.split(' ')[0] || '';
  const shownRating = hoverRating || rating;

  return (
    <div className="cp-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div
        className={`cp-modal ${isDragging ? 'dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-title"
        onDragOver={(e) => { e.preventDefault(); if (photos.length < MAX_POST_PHOTOS) setIsDragging(true); }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragging(false); }}
        onDrop={handleDrop}
      >
        <header className="cp-head">
          <h2 id="cp-title">{isEditing ? t('createPost.titleEdit') : t('createPost.title')}</h2>
          <button type="button" className="cp-close" onClick={onClose} disabled={isSubmitting} aria-label={t('createPost.close')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </header>

        <form onSubmit={submitPost} id="cp-form" className="cp-body">
          {error && <div className="cp-error" role="alert">{error}</div>}

          <div className="cp-author">
            <img src={avatarUrl} alt="" className="cp-avatar" />
            <div>
              <span className="cp-author-name">{user?.name || 'User'}</span>
              <span className="cp-audience">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
                {t('createPost.public')}
              </span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className={`cp-text ${content.length < 90 && photos.length === 0 ? 'cp-text--big' : ''}`}
            placeholder={isEditing ? t('createPost.placeholderEdit') : firstName ? t('createPost.placeholder', { name: firstName }) : t('createPost.placeholderNoName')}
            aria-label={t('createPost.textLabel')}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            autoFocus
          />

          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {photos.length === 0 ? (
            <button type="button" className="cp-drop" onClick={() => fileInputRef.current?.click()}>
              <span className="cp-drop-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/></svg>
              </span>
              <span className="cp-drop-title">{t('createPost.addPhotos')}</span>
              <span className="cp-drop-hint">{t('createPost.dropHint', { max: MAX_POST_PHOTOS })}</span>
            </button>
          ) : (
            <div className="cp-photos">
              <div className="cp-photos-head">
                <span>{t('createPost.photoCount', { count: photos.length, max: MAX_POST_PHOTOS })}</span>
              </div>
              <ul className="cp-photo-grid">
                {photos.map((p, i) => (
                  <li key={p.id} className="cp-photo">
                    <img src={p.preview} alt={t('post.photoN', { n: i + 1, total: photos.length })} />
                    {i === 0 && photos.length > 1 && <span className="cp-photo-cover">{t('createPost.cover')}</span>}
                    <button
                      type="button"
                      className="cp-photo-remove"
                      onClick={() => removePhoto(p.id)}
                      aria-label={t('createPost.removePhoto', { n: i + 1 })}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                  </li>
                ))}
                {photos.length < MAX_POST_PHOTOS && (
                  <li>
                    <button type="button" className="cp-photo-add" onClick={() => fileInputRef.current?.click()} aria-label={t('createPost.addMore')}>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="cp-field">
            <span className="cp-label">{t('createPost.whereLabel')}</span>
            <PlaceSearchPicker
              value={locationTag}
              coordinates={coordinates}
              onChange={handlePlaceChange}
              inputRef={placeInputRef}
              placeholder={t('createPost.wherePlaceholder')}
            />
          </div>

          {reviewOpen && (
            <section className="cp-review" aria-label={t('createPost.reviewTitle')}>
              <div className="cp-review-row">
                <span className="cp-label">{t('createPost.ratingLabel')}</span>
                <div className="cp-stars" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`cp-star ${star <= shownRating ? 'on' : ''}`}
                      onClick={() => setRating(star === rating ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      aria-label={t('createPost.rateN', { count: star })}
                      aria-pressed={star <= rating}
                    >
                      <StarIcon filled={star <= shownRating} />
                    </button>
                  ))}
                  {rating > 0 && <span className="cp-stars-word">{t(`createPost.ratingWords.${rating}`)}</span>}
                </div>
              </div>

              <div className="cp-review-row">
                <span className="cp-label">{t('createPost.priceLabel')}</span>
                <div className="cp-price" role="radiogroup" aria-label={t('createPost.priceLabel')}>
                  {PRICE_LEVELS.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      role="radio"
                      aria-checked={priceRating === level.value}
                      className={`cp-price-opt ${priceRating === level.value ? 'on' : ''}`}
                      onClick={() => setPriceRating(priceRating === level.value ? '' : level.value)}
                    >
                      <span className="cp-price-sym">{level.value}</span>
                      <span className="cp-price-range">{level.range}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {photos.length > 0 && (
            <label className="cp-switch-row">
              <span className="cp-switch-text">
                <span className="cp-switch-title">{t('createPost.potwTitle')}</span>
                <span className="cp-switch-hint">{t('createPost.potwHint')}</span>
              </span>
              <input
                type="checkbox"
                className="cp-switch"
                checked={joinPotw}
                onChange={e => setJoinPotw(e.target.checked)}
              />
            </label>
          )}
        </form>

        <footer className="cp-foot">
          <div className="cp-addbar">
            <span className="cp-addbar-label">{t('createPost.addToPost')}</span>
            <div className="cp-addbar-tools">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photos.length >= MAX_POST_PHOTOS}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2F7D4F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/></svg>
                <span>{t('createPost.toolPhoto')}</span>
              </button>
              <button type="button" onClick={() => placeInputRef.current?.focus()}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#C2563A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                <span>{t('createPost.toolPlace')}</span>
              </button>
              <button type="button" className={reviewOpen ? 'on' : ''} onClick={() => setReviewOpen(o => !o)} aria-pressed={reviewOpen}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#E0A21B" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>
                <span>{t('createPost.toolReview')}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            form="cp-form"
            className="cp-submit"
            disabled={!canPost}
          >
            {isSubmitting && <span className="cp-spinner" aria-hidden="true" />}
            {isSubmitting
              ? (photos.some(p => p.file) ? t('createPost.uploading') : t('createPost.saving'))
              : (isEditing ? t('createPost.save') : t('createPost.post'))}
          </button>
        </footer>

        {isDragging && (
          <div className="cp-dropzone-overlay" aria-hidden="true">
            <span>{t('createPost.dropHere')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;
