import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUserPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        const mine = data.filter((p: any) => p.userId === user?.id);
        setUserPosts(mine);
      }
    } catch (err) {
      console.error("Failed to fetch user posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserPosts();
  }, [user, navigate]);

  const handlePostUpdate = (updatedPost: any) => {
    setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  if (!user) return null;

  // Calculate some fun stats
  const totalReviews = userPosts.length;
  const totalLikes = userPosts.reduce((acc, post) => acc + (post.likes?.length || 0), 0);

  return (
    <div className="profile-page">
      {/* Cover Photo Area */}
      <div className="profile-cover">
        <img 
          src="https://images.unsplash.com/photo-1540932239986-30128078f3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Travel Cover" 
          className="cover-img"
        />
        <div className="cover-overlay"></div>
      </div>

      {/* Main Profile Content */}
      <div className="profile-container">
        
        {/* Profile Header Card */}
        <div className="profile-header-card">
          <div className="profile-avatar-wrapper">
            <img 
              src={(user as any).avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0ea5e9&color=fff&size=200`} 
              alt={user.name} 
              className="profile-avatar-large"
            />
            {user.isVerified && <div className="verified-badge-icon" title="Verified Traveler">✓</div>}
          </div>

          <div className="profile-info-content">
            <div className="profile-name-section">
              <h1>{user.name}</h1>
              <p className="profile-email">{user.email}</p>
              <span className="profile-level">🌟 Explorer</span>
            </div>

            <div className="profile-stats">
              <div className="stat-box">
                <span className="stat-number">{totalReviews}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-box">
                <span className="stat-number">{totalLikes}</span>
                <span className="stat-label">Helpful Votes</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-box">
                <span className="stat-number">1</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="profile-tabs" style={{ marginBottom: 0, flex: 1 }}>
            <button className="profile-tab active">My Reviews</button>
            <button className="profile-tab">Photos</button>
            <button className="profile-tab">Saved Places</button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn btn-primary" 
            style={{ marginLeft: '16px', borderRadius: '20px', padding: '10px 24px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' }}
          >
            + Create Post
          </button>
        </div>

        {/* User's Post Feed */}
        <div className="profile-feed">
          {loading ? (
            <div className="profile-loading">Loading your travels...</div>
          ) : userPosts.length > 0 ? (
            <div className="posts-container">
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <div className="empty-icon">🗺️</div>
              <h2>No reviews yet!</h2>
              <p>Share your favorite places, tips, and photos with the travel community.</p>
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
