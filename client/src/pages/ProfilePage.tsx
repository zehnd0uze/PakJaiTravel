import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import './ProfilePage.css';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';

interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl: string | null;
  locationTag: string | null;
  rating: number | null;
  priceRating: string | null;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  lat?: number | null;
  lng?: number | null;
}

const ProfilePage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in — stable effect, no navigate in deps
  const isLoggedIn = Boolean(user);
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`);
      if (res.ok) {
        const data: Post[] = await res.json();
        setUserPosts(data.filter((p) => p.userId === user?.id));
      }
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
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { urls } = await uploadRes.json();
      const url: string = urls[0];

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
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ea5e9&color=fff&size=200`;

  const coverSrc =
    user.coverPhoto ||
    'https://images.unsplash.com/photo-1540932239986-30128078f3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';

  return (
    <div className="profile-page">
      {/* ── Cover Photo ── */}
      <div className="profile-cover">
        <img
          src={coverSrc}
          alt="Cover"
          className={`cover-img${uploadingCover ? ' uploading' : ''}`}
        />
        <div className="cover-overlay" />

        {/* Cover upload button */}
        <button
          className="cover-upload-btn"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          title="Change cover photo"
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

      {/* ── Main Content ── */}
      <div className="profile-container">

        {/* ── Profile Header Card ── */}
        <div className="profile-header-card">

          {/* Avatar with upload overlay */}
          <div className="profile-avatar-wrapper">
            <img
              src={avatarSrc}
              alt={user.name}
              className={`profile-avatar-large${uploadingAvatar ? ' uploading' : ''}`}
            />
            {user.isVerified && (
              <div className="verified-badge-icon" title="Verified Traveler">✓</div>
            )}
            <button
              className="avatar-upload-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              title="Change profile photo"
            >
              {uploadingAvatar ? '...' : '+'}
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

          {uploadError && <p className="upload-error">{uploadError}</p>}

          <div className="profile-info-content">
            <div className="profile-name-section">
              <h1>{user.name}</h1>
              <p className="profile-email">{user.email}</p>
              <span className="profile-level">Explorer</span>
            </div>

            <div className="profile-stats">
              <div className="stat-box">
                <span className="stat-number">{totalReviews}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-box">
                <span className="stat-number">{totalLikes}</span>
                <span className="stat-label">Helpful Votes</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-box">
                <span className="stat-number">0</span>
                <span className="stat-label">Following</span>
              </div>
            </div>

            {/* ── Log Out Button — always visible ── */}
            <button className="logout-btn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>

        {/* ── Tabs + Create Post ── */}
        <div className="profile-tabs-row">
          <div className="profile-tabs">
            <button className="profile-tab active">My Reviews</button>
            <button className="profile-tab">Photos</button>
            <button className="profile-tab">Saved Places</button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary create-post-btn"
          >
            + Create Post
          </button>
        </div>

        {/* ── Post Feed ── */}
        <div className="profile-feed">
          {loading ? (
            <div className="profile-loading">Loading your travels…</div>
          ) : userPosts.length > 0 ? (
            <div className="posts-container">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <h2>No reviews yet.</h2>
              <p>Share your favourite places, tips, and photos with the travel community.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary start-review-btn">
                Write a Review
              </button>
            </div>
          )}
        </div>
      </div>

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
