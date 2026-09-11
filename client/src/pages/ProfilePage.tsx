import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { type Post } from '../types';
import './ProfilePage.css';




const ProfilePage: React.FC = () => {
  const { user, logout, updateProfile, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in — stable effect, no navigate in deps
  const isLoggedIn = Boolean(user);
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      openAuthModal('login');
    }
  }, [isLoggedIn, navigate, openAuthModal]);

  const fetchUserPosts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, comments(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formatted = (data || []).map(p => ({
        ...p,
        userId: p.user_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        imageUrl: p.image_url,
        locationTag: p.location_tag,
        priceRating: p.price_rating,
        propertyId: p.property_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      setUserPosts(formatted);
    } catch (err) {
      console.error('Failed to fetch user posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePostUpdate = (updatedPost: Post) => {
    setUserPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  /** Generic photo-upload helper */
  const handlePhotoUpload = async (
    file: File,
    field: 'avatar' | 'coverPhoto',
    setUploading: (v: boolean) => void
  ) => {
    if (!user) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(file);
      await updateProfile({ [field]: url });
    } catch (err) {
      console.error(`Failed to upload ${field}:`, err);
      setUploadError(`Could not update photo. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const totalReviews = userPosts.length;
  const totalLikes = userPosts.reduce((acc, post) => acc + (post.likes?.length ?? 0), 0);

  const avatarSrc =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2C4C3B&color=fff&size=200`;

  const coverSrc =
    user.coverPhoto ||
    'https://images.unsplash.com/photo-1540932239986-30128078f3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';

  return (
    <div className="profile-page ig-profile-page">
      {/* ── Instagram-Style Mobile Top Bar ── */}
      <div className="ig-top-bar">
        <div className="ig-username">
          {user.name || user.email?.split('@')[0]}
          {user.isVerified && (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#3897f0" style={{ marginLeft: '4px' }}>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/>
            </svg>
          )}
        </div>
        <div className="ig-top-actions">
          <button onClick={() => setIsModalOpen(true)} aria-label="Create Post">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="none"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
          <button onClick={() => setIsBottomSheetOpen(true)} aria-label="Menu">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Optional Cover Banner for Desktop/Tablet ── */}
      <div className="profile-cover desktop-cover-only">
        <img
          src={coverSrc}
          alt="Cover"
          className={`cover-img${uploadingCover ? ' uploading' : ''}`}
        />
        <div className="cover-overlay" />
        <button
          className="cover-upload-btn"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
        >
          {uploadingCover ? 'Saving...' : 'Change Cover'}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(file, 'coverPhoto', setUploadingCover);
            e.target.value = '';
          }}
        />
      </div>

      <div className="ig-profile-container">
        {/* ── Instagram Header (Avatar + Stats) ── */}
        <div className="ig-header-row">
          <div className="ig-avatar-container">
            <div className="ig-story-ring">
              <img
                src={avatarSrc}
                alt={user.name}
                className={`ig-avatar${uploadingAvatar ? ' uploading' : ''}`}
              />
            </div>
            <button
              className="ig-avatar-add-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              +
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file, 'avatar', setUploadingAvatar);
                e.target.value = '';
              }}
            />
          </div>
          
          <div className="ig-stats-container">
            <div className="ig-stat-item">
              <span className="ig-stat-num">{totalReviews}</span>
              <span className="ig-stat-label">posts</span>
            </div>
            <div className="ig-stat-item">
              <span className="ig-stat-num">{totalLikes}</span>
              <span className="ig-stat-label">helpful</span>
            </div>
            <div className="ig-stat-item">
              <span className="ig-stat-num">0</span>
              <span className="ig-stat-label">following</span>
            </div>
          </div>
        </div>

        {/* ── Bio Section ── */}
        <div className="ig-bio-section">
          <h1 className="ig-display-name">{user.name}</h1>
          <div className="ig-category">Traveler • Explorer</div>
          <div className="ig-bio-text">{user.email}</div>
        </div>

        {uploadError && <p className="upload-error" style={{ margin: '8px 16px' }}>{uploadError}</p>}

        {/* ── Action Buttons Row ── */}
        <div className="ig-action-buttons">
          <button className="ig-action-btn" onClick={() => {}}>
            Edit profile
          </button>
          <button className="ig-action-btn" onClick={() => navigate('/saved')}>
            Saved places
          </button>
          {user.role === 'host' ? (
            <button className="ig-action-btn" onClick={() => navigate('/dashboard')}>
              Host dashboard
            </button>
          ) : (
            <button className="ig-action-btn" onClick={() => navigate('/become-host')}>
              Become a host
            </button>
          )}
        </div>

        {/* ── Content Tabs (Grid vs Feed) ── */}
        <div className="ig-tabs-row">
          <button 
            className={`ig-tab ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z" />
            </svg>
          </button>
          <button 
            className={`ig-tab ${viewMode === 'feed' ? 'active' : ''}`}
            onClick={() => setViewMode('feed')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
            </svg>
          </button>
        </div>

        {/* ── Post Feed / Grid Content ── */}
        <div className="ig-content-area">
          {loading ? (
            <div className="profile-loading">Loading posts…</div>
          ) : userPosts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="ig-photo-grid">
                {userPosts.map((post) => (
                  <div key={post.id} className="ig-grid-item" onClick={() => setViewMode('feed')}>
                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt="Post thumbnail" />
                    ) : (
                      <div className="ig-grid-item-text">
                        <p>{post.content?.substring(0, 40)}{post.content && post.content.length > 40 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ig-feed-list">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                ))}
              </div>
            )
          ) : (
            <div className="ig-empty-state">
              <div className="ig-empty-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <h2>No posts yet</h2>
              <p>Share your travel experiences.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Instagram-style Bottom Sheet Drawer ── */}
      {isBottomSheetOpen && (
        <>
          <div className="ig-bottom-sheet-backdrop" onClick={() => setIsBottomSheetOpen(false)} />
          <div className="ig-bottom-sheet">
            <div className="ig-bottom-sheet-handle" />
            <div className="ig-bottom-sheet-menu">
              <button className="ig-bs-item" onClick={() => { setIsBottomSheetOpen(false); }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.61 3.61 0 018.4 12c0-1.98 1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                Settings & Privacy
              </button>
              <button className="ig-bs-item" onClick={() => { setIsBottomSheetOpen(false); navigate('/saved'); }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                Saved
              </button>
              <button className="ig-bs-item" onClick={() => { setIsBottomSheetOpen(false); navigate('/community'); }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                Community Journal
              </button>
              <div className="ig-bs-divider" />
              <button className="ig-bs-item ig-bs-danger" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <CreatePostModal
          onClose={() => setIsModalOpen(false)}
          onPostCreated={() => {
            setIsModalOpen(false);
            fetchUserPosts();
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
