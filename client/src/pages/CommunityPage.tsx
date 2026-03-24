import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { type Post } from '../types';
import './CommunityPage.css';

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const locationFilter = searchParams.get('location');

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

  const handlePostUpdate = (updatedPost: Post) => {
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
    <div className="community-page">
      <div className="community-header">
        <div className="community-header-content">
          <h1>Travel Community</h1>
          <p>Share your Chiang Dao experiences, reviews, and photos.</p>
          <button className="btn btn-primary create-btn" onClick={handleCreateClick}>
            + Create Post
          </button>
        </div>
      </div>

      {locationFilter && (
        <div className="filter-active-banner container" style={{ padding: '16px 20px', backgroundColor: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div>
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Showing reviews for:</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--primary-color)' }}>{locationFilter}</strong>
          </div>
          <button 
            onClick={() => setSearchParams({})} 
            style={{ padding: '6px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '20px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}
          >
            Clear Filter &times;
          </button>
        </div>
      )}

      <div className="community-feed container">
        {loading ? (
          <div className="community-loading">Loading community feed...</div>
        ) : posts.length > 0 ? (
          <div className="posts-container">
            {posts
              .filter(p => !locationFilter || p.locationTag === locationFilter)
              .map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onUpdate={handlePostUpdate} 
                onTagClick={(tag) => setSearchParams({ location: tag })}
              />
            ))}
          </div>
        ) : (
          <div className="no-posts">
            <h2>It's quiet here...</h2>
            <p>Be the first to share your travel story!</p>
            <button className="btn btn-secondary mt-4" onClick={handleCreateClick}>
              Write a Review
            </button>
          </div>
        )}
      </div>

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
