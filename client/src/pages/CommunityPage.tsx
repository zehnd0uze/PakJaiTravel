import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import './CommunityPage.css';

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data || []);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostUpdate = (updatedPost: any) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleCreateClick = () => {
    if (!user) {
      alert("Please login to create a post.");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="community-page animate-fade-in">
      {/* Desktop Banner */}
      <div className="community-header desktop-only">
        <div className="community-header-content">
          <h1>Travel Community</h1>
          <p>Share your Chiang Dao experiences, reviews, and photos.</p>
          <button className="btn btn-primary create-btn clickable" onClick={handleCreateClick}>
            + Create Post
          </button>
        </div>
      </div>

      {/* Mobile Only Header */}
      <div className="mobile-only-header container">
        <h1 className="mobile-page-title">Community Feed</h1>
        <p className="mobile-page-subtitle">Real experiences from Chiang Dao</p>
      </div>

      <div className="community-feed container">
        {loading ? (
          <div className="posts-container">
            {[1,2,3].map(i => (
              <div key={i} className="post-card ig-style skeleton" style={{ height: 400, border: 'none' }}></div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="posts-container">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
            ))}
          </div>
        ) : (
          <div className="no-posts">
            <h2>It's quiet here...</h2>
            <p>Be the first to share your travel story!</p>
            <button className="btn btn-secondary mt-4 clickable" onClick={handleCreateClick}>
              Write a Review
            </button>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button className="mobile-fab mobile-only clickable" onClick={handleCreateClick} aria-label="Create Post">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
      </button>

      {isModalOpen && (
        <CreatePostModal 
          onClose={() => setIsModalOpen(false)} 
          onPostCreated={() => {
            setIsModalOpen(false);
            fetchPosts(); // Refresh feed
          }} 
        />
      )}
    </div>
  );
};

export default CommunityPage;
