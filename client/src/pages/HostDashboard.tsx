import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'properties' | 'updates'>('properties');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [promotedPropertyId, setPromotedPropertyId] = useState<string | undefined>(undefined);
  const [openGuideIndex, setOpenGuideIndex] = useState<number | null>(0);

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

  const handlePromote = (property: Property) => {
    setPromotedPropertyId(property.id);
    setActiveTab('updates');
    window.scrollTo({ top: 240, behavior: 'smooth' });
  };

  // Computed KPI Metrics & Readiness Checklist
  const metrics = useMemo(() => {
    const publishedCount = properties.filter(p => !p.status || p.status === 'published' || p.status === 'active').length;
    const inReviewCount = properties.length - publishedCount;
    const totalViews = properties.reduce((acc, p) => acc + (Number(p.views) || 0), 0);
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);
    const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

    const hasListing = properties.length > 0;
    const hasPhotos = properties.some(p => (p.images?.length || 0) >= 3);
    const hasContact = properties.some(p => Boolean(p.contact?.phone?.trim() || p.contact?.line?.trim()));
    const hasDetails = properties.some(
      p => Boolean(p.description && p.description.trim().length >= 30) &&
           ((p.amenities?.length || 0) + (p.features?.length || 0)) >= 4
    );
    const hasPost = posts.length > 0;

    const checklist = [
      {
        id: 'listed',
        label: t('hostDashboard.checklist.stepListed'),
        done: hasListing,
        onAction: () => { setPropertyToEdit(undefined); setShowPropertyModal(true); }
      },
      {
        id: 'photos',
        label: t('hostDashboard.checklist.stepPhotos'),
        done: hasPhotos,
        onAction: () => {
          const target = properties.find(p => (p.images?.length || 0) < 3) || properties[0];
          setPropertyToEdit(target);
          setShowPropertyModal(true);
        }
      },
      {
        id: 'contact',
        label: t('hostDashboard.checklist.stepContact'),
        done: hasContact,
        onAction: () => {
          const target = properties.find(p => !p.contact?.phone?.trim() && !p.contact?.line?.trim()) || properties[0];
          setPropertyToEdit(target);
          setShowPropertyModal(true);
        }
      },
      {
        id: 'details',
        label: t('hostDashboard.checklist.stepDetails'),
        done: hasDetails,
        onAction: () => {
          const target = properties[0];
          setPropertyToEdit(target);
          setShowPropertyModal(true);
        }
      },
      {
        id: 'post',
        label: t('hostDashboard.checklist.stepPost'),
        done: hasPost,
        onAction: () => {
          if (properties[0]) setPromotedPropertyId(properties[0].id);
          setActiveTab('updates');
        }
      }
    ];

    const doneCount = checklist.filter(c => c.done).length;
    const readinessPct = Math.round((doneCount / checklist.length) * 100);

    return {
      publishedCount,
      inReviewCount,
      totalViews,
      totalLikes,
      totalComments,
      checklist,
      doneCount,
      totalSteps: checklist.length,
      readinessPct
    };
  }, [properties, posts, t]);

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      const status = (prop.status || 'published').toLowerCase();
      if (statusFilter === 'published' && status !== 'published' && status !== 'active') {
        return false;
      }
      if (statusFilter === 'pending' && (status === 'published' || status === 'active')) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = prop.name?.toLowerCase().includes(q);
        const matchDistrict = prop.district?.toLowerCase().includes(q);
        const matchType = prop.type?.toLowerCase().includes(q);
        return matchName || matchDistrict || matchType;
      }
      return true;
    });
  }, [properties, statusFilter, searchQuery]);

  const guides = [
    {
      title: t('hostDashboard.resources.guide1Title'),
      body: t('hostDashboard.resources.guide1Body')
    },
    {
      title: t('hostDashboard.resources.guide2Title'),
      body: t('hostDashboard.resources.guide2Body')
    },
    {
      title: t('hostDashboard.resources.guide3Title'),
      body: t('hostDashboard.resources.guide3Body')
    }
  ];

  if (!user) {
    return (
      <div className="container dashboard-gate animate-fade-in">
        <div className="gate-card">
          <h2>Sign In Required</h2>
          <p>Please sign in to access your host dashboard.</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'host') {
    return (
      <div className="host-dashboard-wrapper">
        <div className="container dashboard-gate animate-fade-in">
          <div className="gate-card">
            <h2>Become a Verified Host</h2>
            <p>
              Welcome, {user.name}! To activate your host status and access the dashboard, list your first accommodation below.
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
      {/* Editorial Workspace Header */}
      <header className="dashboard-workspace-header">
        <div className="container">
          <div className="workspace-header-top">
            <div className="workspace-title-area">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ margin: 0 }}>{t('hostDashboard.title')}</h1>
                <span className="workspace-certified-pill">
                  <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {t('hostDashboard.certifiedHost')}
                </span>
              </div>
              <p>{t('hostDashboard.welcome', { name: user?.name })}</p>
            </div>

            <div className="workspace-primary-actions">
              <button
                type="button"
                className="ws-btn ws-btn-secondary"
                onClick={() => setShowClaimModal(true)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>{t('hostDashboard.claimBtn')}</span>
              </button>

              <button
                type="button"
                className="ws-btn ws-btn-primary"
                onClick={() => { setPropertyToEdit(undefined); setShowPropertyModal(true); }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>{t('hostDashboard.addBtn')}</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="dashboard-kpi-strip">
            <div className="kpi-card" onClick={() => setActiveTab('properties')}>
              <div className="kpi-card-top">
                <span className="kpi-label">{t('hostDashboard.stats.activeStays')}</span>
                <span className="kpi-icon-box">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
              </div>
              <div className="kpi-value">{properties.length}</div>
              <div className="kpi-sub">
                <span className="kpi-sub-highlight">{t('hostDashboard.stats.publishedCount', { count: metrics.publishedCount })}</span>
                {metrics.inReviewCount > 0 && (
                  <span> · {t('hostDashboard.stats.inReviewCount', { count: metrics.inReviewCount })}</span>
                )}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">{t('hostDashboard.stats.totalViews')}</span>
                <span className="kpi-icon-box">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
              </div>
              <div className="kpi-value">{metrics.totalViews.toLocaleString()}</div>
              <div className="kpi-sub">{t('hostDashboard.stats.viewsSub')}</div>
            </div>

            <div className="kpi-card" onClick={() => setActiveTab('updates')}>
              <div className="kpi-card-top">
                <span className="kpi-label">{t('hostDashboard.stats.communityUpdates')}</span>
                <span className="kpi-icon-box">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
              </div>
              <div className="kpi-value">{posts.length}</div>
              <div className="kpi-sub">
                {t('hostDashboard.stats.engagementSub', { likes: metrics.totalLikes, comments: metrics.totalComments })}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">{t('hostDashboard.stats.readiness')}</span>
                <span className="kpi-readiness-badge">{metrics.readinessPct}%</span>
              </div>
              <div className="kpi-progress-track">
                <div className="kpi-progress-fill" style={{ width: `${metrics.readinessPct}%` }} />
              </div>
              <div className="kpi-sub">
                {t('hostDashboard.stats.readinessSub', { done: metrics.doneCount, total: metrics.totalSteps })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="container dashboard-main">
        {/* Segmented Navigation & Filter Toolbar */}
        <div className="dashboard-toolbar">
          <div className="segmented-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'properties'}
              className={`seg-tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
              onClick={() => setActiveTab('properties')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span>{t('hostDashboard.tabs.accommodations')}</span>
              <span className="seg-tab-count">{properties.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'updates'}
              className={`seg-tab-btn ${activeTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveTab('updates')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{t('hostDashboard.tabs.updates')}</span>
              <span className="seg-tab-count">{posts.length}</span>
            </button>
          </div>

          {activeTab === 'properties' && properties.length > 0 && (
            <div className="toolbar-filters">
              <div className="status-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  {t('hostDashboard.filters.all')}
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === 'published' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('published')}
                >
                  {t('hostDashboard.filters.published')}
                </button>
                {metrics.inReviewCount > 0 && (
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('pending')}
                  >
                    {t('hostDashboard.filters.pending')}
                  </button>
                )}
              </div>

              {properties.length > 1 && (
                <div className="toolbar-search-box">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('hostDashboard.filters.searchPlaceholder')}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2-Column Workspace Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-content">
            {activeTab === 'properties' ? (
              <div className="properties-section">
                {/* Pending Ownership Claims Banner */}
                {userClaims.length > 0 && (
                  <div className="claims-banner">
                    <div className="claims-banner-header">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span>{t('hostDashboard.claims.title')} ({userClaims.length})</span>
                    </div>
                    <div className="claims-list">
                      {userClaims.map(claim => (
                        <div key={claim.id} className="claim-item-row">
                          <span className="claim-prop-name">{claim.property_name}</span>
                          <span className={`claim-status-badge ${claim.status}`}>
                            {claim.status === 'approved'
                              ? t('hostDashboard.claims.approved')
                              : claim.status === 'rejected'
                              ? t('hostDashboard.claims.rejected')
                              : t('hostDashboard.claims.pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="dashboard-skeleton-list">
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="empty-state-card">
                    <h3>{t('hostDashboard.empty.title')}</h3>
                    <p>{t('hostDashboard.empty.desc')}</p>
                    <div className="empty-state-actions">
                      <button
                        type="button"
                        className="ws-btn ws-btn-primary"
                        onClick={() => { setPropertyToEdit(undefined); setShowPropertyModal(true); }}
                      >
                        + {t('hostDashboard.empty.cta')}
                      </button>
                      <button
                        type="button"
                        className="ws-btn ws-btn-secondary"
                        onClick={() => setShowClaimModal(true)}
                      >
                        {t('hostDashboard.claimBtn')}
                      </button>
                    </div>
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="empty-state-card">
                    <p>{t('hostDashboard.empty.noFilterMatch')}</p>
                  </div>
                ) : (
                  <div className="properties-list">
                    {filteredProperties.map(prop => (
                      <HostPropertyCard 
                        key={prop.id} 
                        property={prop} 
                        onEdit={(p) => { setPropertyToEdit(p); setShowPropertyModal(true); }}
                        onDelete={handleDeleteProperty}
                        onPromote={handlePromote}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="updates-section">
                <div className="updates-composer-header">
                  <h2>{t('hostDashboard.updates.composerTitle')}</h2>
                  <p>{t('hostDashboard.updates.composerSub')}</p>
                </div>

                <HostPostCreation
                  onPostCreated={fetchData}
                  initialPropertyId={promotedPropertyId}
                />

                <div className="updates-feed-header">
                  <h2>{t('hostDashboard.updates.recentTitle')} ({posts.length})</h2>
                </div>

                {loading ? (
                  <div className="dashboard-skeleton-list">
                    <div className="skeleton-card" />
                  </div>
                ) : posts.length > 0 ? (
                  <div className="host-posts-list">
                    {posts.map(post => (
                      <PostCard key={post.id} post={post} onUpdate={fetchData} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <p>{t('hostDashboard.updates.emptyUpdates')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Right Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="dashboard-sidebar-sticky">
              {/* Interactive Listing Readiness Checklist */}
              <div className="sidebar-panel readiness-panel">
                <div className="sidebar-panel-header">
                  <div>
                    <h3>{t('hostDashboard.checklist.title')}</h3>
                    <p className="sidebar-panel-sub">{t('hostDashboard.checklist.subtitle')}</p>
                  </div>
                </div>

                <ul className="readiness-checklist">
                  {metrics.checklist.map(item => (
                    <li key={item.id} className={`checklist-item ${item.done ? 'done' : 'pending'}`}>
                      <span className="checklist-check" aria-hidden="true">
                        {item.done ? (
                          <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="checklist-empty-circle" />
                        )}
                      </span>
                      <span className="checklist-text">{item.label}</span>
                      {!item.done && (
                        <button
                          type="button"
                          className="checklist-action-link"
                          onClick={item.onAction}
                        >
                          {t('hostDashboard.checklist.fixNow')} →
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {metrics.doneCount === metrics.totalSteps && (
                  <div className="readiness-complete-banner">
                    <span>{t('hostDashboard.checklist.allDone')}</span>
                  </div>
                )}
              </div>

              {/* Expandable Host Handbook */}
              <div className="sidebar-panel handbook-panel">
                <h3>{t('hostDashboard.resources.title')}</h3>
                <div className="handbook-accordion">
                  {guides.map((guide, idx) => {
                    const isOpen = openGuideIndex === idx;
                    return (
                      <div key={idx} className={`handbook-item ${isOpen ? 'open' : ''}`}>
                        <button
                          type="button"
                          className="handbook-trigger"
                          onClick={() => setOpenGuideIndex(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                        >
                          <span>{guide.title}</span>
                          <svg
                            viewBox="0 0 24 24"
                            width="15"
                            height="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="handbook-chevron"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="handbook-body">
                            <p>{guide.body}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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
