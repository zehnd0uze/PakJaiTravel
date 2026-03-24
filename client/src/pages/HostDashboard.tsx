import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HostPostCreation from '../components/HostPostCreation';
import PostCard from '../components/PostCard';
import './HostDashboard.css';

const HostDashboard: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHostPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const allPosts = await res.json();
      // Filter posts by this host
      const hostPosts = allPosts.filter((p: any) => p.userId === user?.id);
      setPosts(hostPosts);
    } catch (err) {
      console.error("Failed to fetch host posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchHostPosts();
  }, [user]);

  if (user?.role !== 'host') {
    return (
      <div className="container dashboard-gate animate-fade-in" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>Host Access Required</h2>
        <p>This area is dedicated to property owners. Please contact support to upgrade your account.</p>
      </div>
    );
  }

  return (
    <div className="host-dashboard animate-fade-in">
      <div className="dashboard-hero">
        <div className="container">
          <div className="hero-content-small">
            <h1>Host Dashboard</h1>
            <p>Promote your properties and engage with the PakJai community.</p>
          </div>
        </div>
      </div>

      <div className="container dashboard-main">
        <div className="dashboard-grid">
          <div className="dashboard-content">
            <h2 className="section-label">Create an Update</h2>
            <HostPostCreation onPostCreated={fetchHostPosts} />

            <h2 className="section-label">Your Recent Posts</h2>
            {loading ? (
              <div className="loading-state">Loading your feed...</div>
            ) : posts.length > 0 ? (
              <div className="host-posts-list">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onUpdate={fetchHostPosts} />
                ))}
              </div>
            ) : (
              <div className="empty-state-box glass-panel">
                <p>You haven't shared any updates yet. Write your first post to start promoting your properties!</p>
              </div>
            )}
          </div>

          <aside className="dashboard-sidebar">
            <div className="sidebar-card glass-panel">
              <h3>Host Tips</h3>
              <ul className="tips-list">
                <li>
                  <strong>Tag your property</strong> to allow guests to book directly from your post.
                </li>
                <li>
                  <strong>Share high-quality photos</strong> of your property's unique features.
                </li>
                <li>
                  <strong>Be authentic</strong>—guests love hearing about the local experience.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
