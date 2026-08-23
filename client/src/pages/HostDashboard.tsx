import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HostPostCreation from '../components/HostPostCreation';
import PostCard from '../components/PostCard';
import HostPropertyCard from '../components/HostPropertyCard';
import PropertyEditModalComp from '../components/PropertyEditModal';
import { ClaimPropertyModal } from '../components/ClaimPropertyModal';
import { type Post, type Property } from '../types';
import { supabase } from '../utils/supabase';
import { Button } from '../components/Button';
import './HostDashboard.css';

interface UserClaim {
  id: string;
  property_id: string;
  status: string;
  created_at: string;
  property_name?: string;
}

const HostDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'properties' | 'updates'>('properties');
  const [posts, setPosts] = useState<Post[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [userClaims, setUserClaims] = useState<UserClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | undefined>(undefined);

  // Auto-open new property modal if navigated with ?new=true or ?new=1
  useEffect(() => {
    if (searchParams.get('new') === 'true' || searchParams.get('new') === '1') {
      setPropertyToEdit(undefined);
      setShowPropertyModal(true);
    }
  }, [searchParams]);

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
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (propError) throw propError;

      const formattedProps = (propData || []).map(p => ({
        ...p,
        price: p.price_per_night,
        pricePerNight: p.price_per_night,
        imageUrl: p.image_url,
        images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
        isVerified: p.is_verified,
        features: p.features || [],
        amenities: p.amenities || [],
        location: p.location || `${p.district || 'Chiang Dao'}, ${p.province || 'Chiang Mai'}`,
        province: p.province || 'Chiang Mai',
        district: p.district || 'Chiang Dao',
        description: p.description || '',
        checkIn: p.check_in || '14:00',
        checkOut: p.check_out || '11:00',
        host: {
          name: p.host_info?.name || user.name || 'Host',
          since: p.host_info?.since || ''
        },
        contact: {
          phone: p.contact?.phone || '',
          email: p.contact?.email || user.email || '',
          line: p.contact?.line || ''
        }
      }));
      setProperties(formattedProps);

      // Fetch User's Ownership Claims
      try {
        const { data: claimsData } = await supabase
          .from('property_claims')
          .select('id, property_id, status, created_at, properties(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (claimsData) {
          setUserClaims(
            claimsData.map((c: any) => ({
              id: c.id,
              property_id: c.property_id,
              status: c.status,
              created_at: c.created_at,
              property_name: c.properties?.name || 'Pre-listed Accommodation'
            }))
          );
        }
      } catch (claimErr) {
        console.warn('Could not fetch claims (table may be pending migration):', claimErr);
      }
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'host') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleActivateHost = () => {
    setShowPropertyModal(true);
  };

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
  };

  if (!user) {
    return (
      <div className="container dashboard-gate animate-fade-in" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>Sign In Required</h2>
        <p>Please sign in to access your host dashboard.</p>
      </div>
    );
  }

  if (user?.role !== 'host') {
    return (
      <div className="host-dashboard-wrapper">
        <div className="container dashboard-gate animate-fade-in" style={{ padding: '100px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🏡</span>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', marginBottom: '16px', color: 'var(--primary-color)' }}>
            Become a Verified Host
          </h2>
          <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '32px' }}>
            Welcome, {user.name}! To activate your host status and access the dashboard, you must first list an accommodation. Click below to add your property.
          </p>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleActivateHost}
            disabled={activating}
          >
            {activating ? 'Activating Host Mode...' : 'Add Property & Activate Host Mode'}
          </Button>
        </div>
        
        {showPropertyModal && (
          <PropertyEditModalComp 
            property={undefined}
            onClose={() => setShowPropertyModal(false)}
            onSave={async () => {
              setShowPropertyModal(false);
              setActivating(true);
              try {
                if (user?.role !== 'host') {
                  await updateProfile({ role: 'host' });
                }
                fetchData();
              } catch (err) {
                console.error("Failed to update profile", err);
              } finally {
                setActivating(false);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="host-dashboard animate-fade-in">
      <div className="dashboard-hero">
        <div className="container">
          <div className="hero-content-small">
            <h1>Host Dashboard</h1>
            <p>Welcome back, {user?.name}. Manage your accommodations and connect with travelers.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs-bar">
        <div className="container tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            My Accommodations ({properties.length})
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
                {/* Pending Claims Status Notification */}
                {userClaims.length > 0 && (
                  <div style={{
                    marginBottom: '24px',
                    padding: '16px 20px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '16px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🏷️</span>
                      <span>Your Property Ownership Requests ({userClaims.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {userClaims.map(claim => (
                        <div key={claim.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{claim.property_name}</span>
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: claim.status === 'approved' ? '#dcfce7' : claim.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color: claim.status === 'approved' ? '#166534' : claim.status === 'rejected' ? '#991b1b' : '#92400e',
                            textTransform: 'uppercase'
                          }}>
                            {claim.status === 'approved' ? '✓ Approved' : claim.status === 'rejected' ? '✕ Rejected' : '⏳ Pending Review'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="section-header-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 className="section-label" style={{ margin: 0 }}>Your Accommodations</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="add-property-btn"
                      style={{ background: '#ffffff', color: '#2e7d32', border: '1.5px solid #2e7d32' }}
                      onClick={() => setShowClaimModal(true)}
                    >
                      🏷️ Claim Existing Listing
                    </button>
                    <button 
                      className="add-property-btn"
                      onClick={() => { setPropertyToEdit(undefined); setShowPropertyModal(true); }}
                    >
                      + Add New Accommodation
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state">Loading accommodations...</div>
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
                  <div className="empty-state-box glass-panel" style={{ textAlign: 'center', padding: '60px 30px' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>🌿</span>
                    <h3 style={{ marginBottom: '8px' }}>No accommodations listed yet</h3>
                    <p style={{ color: '#666', maxWidth: '400px', margin: '0 auto 24px' }}>
                      Start your journey by adding your first homestay, resort, villa, or guesthouse!
                    </p>
                    <button 
                      className="add-property-btn"
                      onClick={() => { setPropertyToEdit(undefined); setShowPropertyModal(true); }}
                      style={{ padding: '12px 28px' }}
                    >
                      + List Your First Accommodation
                    </button>
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
              <p>Accommodations with high-resolution photos and detailed amenities receive <strong>3x more traveler inquiries</strong>.</p>
              <button 
                className="sidebar-action-btn" 
                onClick={() => { setPropertyToEdit(undefined); setShowPropertyModal(true); }}
              >
                + Add Accommodation
              </button>
            </div>
            
            <div className="sidebar-card glass-panel">
              <h3>Host Resources</h3>
              <ul className="tips-list">
                <li>Photography & Lighting Guide</li>
                <li>Write Compelling Descriptions</li>
                <li>Verified Owner Standards</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {showPropertyModal && (
        <PropertyEditModalComp 
          property={propertyToEdit}
          onClose={() => setShowPropertyModal(false)}
          onSave={() => {
            setShowPropertyModal(false);
            fetchData();
          }}
        />
      )}

      <ClaimPropertyModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onClaimSubmitted={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default HostDashboard;

