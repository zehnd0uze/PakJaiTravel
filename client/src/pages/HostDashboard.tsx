import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HostPostCreation from '../components/HostPostCreation';
import PostCard from '../components/PostCard';
import HostPropertyCard from '../components/HostPropertyCard';
import PropertyEditModalComp from '../components/PropertyEditModal';
import { type Post, type Property } from '../types';
import { supabase } from '../utils/supabase';
import './HostDashboard.css';

const HostDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'properties' | 'updates'>('properties');
  const [posts, setPosts] = useState<Post[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | undefined>(undefined);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, comments(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const formattedPosts = (postsData || []).map(p => ({
        ...p,
        userId: p.user_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        imageUrl: p.image_url,
        locationTag: p.location_tag,
        priceRating: p.price_rating,
        propertyId: p.property_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        likes: p.likes || [],
        comments: (p.comments || []).map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          authorName: c.author_name,
          authorAvatar: c.author_avatar,
          text: c.text,
          createdAt: c.created_at
        })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }));
      setPosts(formattedPosts);

      // Fetch Owned Properties
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (propError) throw propError;

      const formattedProps = (propData || []).map(p => ({
        ...p,
        pricePerNight: p.price_per_night,
        imageUrl: p.image_url,
        isVerified: p.is_verified,
        checkIn: p.check_in,
        checkOut: p.check_out,
        host: {
          name: p.host_info?.name || 'Unknown',
          since: p.host_info?.since || ''
        },
        contact: {
          phone: p.contact?.phone || '',
          email: p.contact?.email || '',
          line: p.contact?.line || ''
        }
      }));
      setProperties(formattedProps);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleDeleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Failed to delete property");
    }
  };

  const handlePromote = (_property: Property) => {
    setActiveTab('updates');
    // We could potentially pass this to HostPostCreation via a ref or state
    // For now, switching the tab is the primary action
  };

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
            <p>Welcome back, {user?.name}. Manage your listings and connect with travelers.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs-bar">
        <div className="container tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            My Listings ({properties.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'updates' ? 'active' : ''}`}
            onClick={() => setActiveTab('updates')}
          >
            Community Updates ({posts.length})
          </button>
        </div>
      </div>

      <div className="container dashboard-main">
        <div className="dashboard-grid">
          <div className="dashboard-content">
            {activeTab === 'properties' ? (
              <div className="properties-section">
                <div className="section-header-row">
                  <h2 className="section-label">Your Accommodations</h2>
                  <button 
                    className="add-property-btn"
                    onClick={() => { setPropertyToEdit(undefined); setShowPropertyModal(true); }}
                  >
                    + Add New Property
                  </button>
                </div>

                {loading ? (
                  <div className="loading-state">Loading properties...</div>
                ) : properties.length > 0 ? (
                  <div className="properties-list">
                    {properties.map(prop => (
                      <HostPropertyCard 
                        key={prop.id} 
                        property={prop} 
                        onEdit={(p) => { setPropertyToEdit(p); setShowPropertyModal(true); }}
                        onDelete={handleDeleteProperty}
                        onPromote={handlePromote}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-box glass-panel">
                    <p>You haven't added any properties yet. Start your journey by listing your first accommodation!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="updates-section">
                <h2 className="section-label">Share an Update</h2>
                <HostPostCreation onPostCreated={fetchData} />

                <h2 className="section-label" style={{ marginTop: '40px' }}>Recent Posts</h2>
                {loading ? (
                  <div className="loading-state">Loading feed...</div>
                ) : posts.length > 0 ? (
                  <div className="host-posts-list">
                    {posts.map(post => (
                      <PostCard key={post.id} post={post} onUpdate={fetchData} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-box glass-panel">
                    <p>No updates yet. Share photos or news about your property to attract guests!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="dashboard-sidebar">
            <div className="sidebar-card glass-panel luxury-insight">
              <h3>Direct Booking Tip</h3>
              <p>Tagged properties receive <strong>2.5x more clicks</strong> in the community feed than untagged posts.</p>
              <button className="sidebar-action-btn" onClick={() => setActiveTab('properties')}>
                Optimize My Listings
              </button>
            </div>
            
            <div className="sidebar-card glass-panel">
              <h3>Host Resources</h3>
              <ul className="tips-list">
                <li>Photography Guide</li>
                <li>Write Better Captions</li>
                <li>Community Guidelines</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {showPropertyModal && (
        <PropertyEditModalComp 
          property={propertyToEdit}
          onClose={() => setShowPropertyModal(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
};

export default HostDashboard;

