import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

interface PropertyItem {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  rating: number;
  reviews: number;
  views: number;
  isVerified: boolean;
  status: string;
  district?: string;
  province?: string;
  imageUrl: string;
  createdAt?: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface PostItem {
  id: string;
  author_name: string;
  location_tag?: string;
  content?: string;
  image_url?: string;
  join_potw?: boolean;
  likes?: string[];
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [pendingClaimsCount, setPendingClaimsCount] = useState<number>(0);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [propsRes, usersRes, postsRes, claimsRes, commentsRes] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('property_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
      ]);

      if (propsRes.data) {
        setProperties(
          (propsRes.data as any[]).map(p => ({
            id: p.id,
            name: p.name || 'Untitled Stay',
            type: p.type || 'Homestay',
            pricePerNight: Number(p.price_per_night || 0),
            rating: Number(p.rating || 4.5),
            reviews: Number(p.reviews || 0),
            views: Number(p.views || 0),
            isVerified: Boolean(p.is_verified),
            status: p.status || 'published',
            district: p.district || 'Chiang Dao',
            province: p.province || 'Chiang Mai',
            imageUrl: p.image_url || (Array.isArray(p.images) && p.images[0]) || '/doiluangbg.jpg',
            createdAt: p.created_at,
          }))
        );
      }

      if (usersRes.data) {
        setUsers(
          (usersRes.data as any[]).map(u => ({
            id: u.id,
            name: u.name || 'User',
            email: u.email || '',
            role: u.role || 'user',
            isVerified: Boolean(u.is_verified),
            createdAt: u.created_at || new Date().toISOString(),
          }))
        );
      }

      if (postsRes.data) {
        setPosts(postsRes.data as PostItem[]);
      }

      if (claimsRes.count !== null) setPendingClaimsCount(claimsRes.count);
      if (commentsRes.count !== null) setCommentsCount(commentsRes.count);
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickPublishProperty = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: 'published', is_verified: true })
        .eq('id', id);
      if (error) throw error;
      showToast(`Published & verified "${name}"`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish property');
    }
  };

  const handleTogglePotw = async (post: PostItem) => {
    const nextVal = !post.join_potw;
    try {
      const { error } = await supabase
        .from('posts')
        .update({ join_potw: nextVal })
        .eq('id', post.id);
      if (error) throw error;
      setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, join_potw: nextVal } : p)));
      showToast(nextVal ? 'Added post to Picture of the Week' : 'Removed post from Picture of the Week');
    } catch (err: any) {
      alert(err.message || 'Failed to update post');
    }
  };

  const handleDeletePost = async (post: PostItem) => {
    if (!window.confirm(`Delete post by ${post.author_name}?`)) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== post.id));
      showToast('Post deleted');
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const publishedProperties = properties.filter(p => p.status === 'published');
  const pendingProperties = properties.filter(p => p.status !== 'published');
  const verifiedProperties = properties.filter(p => p.isVerified);
  const hostCount = users.filter(u => u.role === 'host').length;
  const potwCount = posts.filter(p => p.join_potw).length;

  const dbTables = [
    { name: 'properties', count: properties.length, desc: 'Accommodations & pricing' },
    { name: 'profiles', count: users.length, desc: 'Users, hosts & admins' },
    { name: 'posts', count: posts.length, desc: 'Community Journal posts' },
    { name: 'comments', count: commentsCount, desc: 'Post comments' },
    { name: 'property_claims', count: pendingClaimsCount, desc: 'Pending ownership claims' },
  ];

  return (
    <>
      {toast && (
        <div className="db-toast success">
          <span>{toast}</span>
        </div>
      )}

      <div className="admin-topbar">
        <div>
          <h1>Platform Command Center</h1>
          <p className="admin-topbar-sub">Manage accommodations, users, community journal, and Supabase tables</p>
        </div>

        <div className="admin-topbar-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/admin/database')}
          >
            Open Database Studio
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => navigate('/admin/hotels/new')}
          >
            + Add Property
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* KPI Metric Cards */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => navigate('/admin/hotels')}>
            <div className="stat-card-head">
              <span className="stat-label">Accommodations</span>
              <span className="stat-pill green">{publishedProperties.length} live</span>
            </div>
            <div className="stat-value">{properties.length}</div>
            <div className="stat-sub">
              {verifiedProperties.length} verified · {pendingProperties.length} pending/draft
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate('/admin/users')}>
            <div className="stat-card-head">
              <span className="stat-label">Registered Users</span>
              <span className="stat-pill">{hostCount} hosts</span>
            </div>
            <div className="stat-value">{users.length}</div>
            <div className="stat-sub">
              {users.filter(u => u.isVerified).length} verified accounts
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate('/admin/claims')}>
            <div className="stat-card-head">
              <span className="stat-label">Ownership Claims</span>
              {pendingClaimsCount > 0 && <span className="stat-pill warn">Action needed</span>}
            </div>
            <div className="stat-value">{pendingClaimsCount}</div>
            <div className="stat-sub">Pending host ownership verification</div>
          </div>

          <div className="stat-card" onClick={() => navigate('/admin/database?table=posts')}>
            <div className="stat-card-head">
              <span className="stat-label">Community Journal</span>
              <span className="stat-pill">{potwCount} in POTW</span>
            </div>
            <div className="stat-value">{posts.length}</div>
            <div className="stat-sub">{commentsCount} total comments across posts</div>
          </div>
        </div>

        {/* Supabase Tables Quick-Jump Strip */}
        <section className="admin-panel-card" style={{ marginBottom: '24px' }}>
          <div className="admin-panel-head">
            <div>
              <h2>Supabase Tables Explorer</h2>
              <p>Click any table to inspect, filter, insert, or edit raw database records directly</p>
            </div>
            <button
              type="button"
              className="admin-link-btn"
              onClick={() => navigate('/admin/database')}
            >
              Launch Database Studio →
            </button>
          </div>

          <div className="db-quick-cards">
            {dbTables.map((tbl) => (
              <button
                key={tbl.name}
                type="button"
                className="db-quick-card"
                onClick={() => navigate(`/admin/database?table=${tbl.name}`)}
              >
                <div className="db-qc-top">
                  <code>public.{tbl.name}</code>
                  <span className="db-qc-arrow">↗</span>
                </div>
                <div className="db-qc-count">{tbl.count} <small>rows</small></div>
                <div className="db-qc-desc">{tbl.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Two-Column Operations Grid */}
        <div className="admin-two-col-grid">
          {/* Left: Properties & Pending Approvals */}
          <section className="admin-panel-card">
            <div className="admin-panel-head">
              <div>
                <h2>
                  {pendingProperties.length > 0
                    ? `Pending Stays (${pendingProperties.length})`
                    : 'Recent Accommodations'}
                </h2>
                <p>Quickly publish, verify, or edit listed accommodations</p>
              </div>
              <button
                type="button"
                className="admin-link-btn"
                onClick={() => navigate('/admin/hotels')}
              >
                Manage All ({properties.length}) →
              </button>
            </div>

            {loading ? (
              <div className="admin-empty-msg">Loading properties...</div>
            ) : properties.length === 0 ? (
              <div className="admin-empty-msg">No properties found.</div>
            ) : (
              <div className="admin-compact-list">
                {(pendingProperties.length > 0 ? pendingProperties : properties.slice(0, 5)).map((prop) => (
                  <div key={prop.id} className="admin-compact-row">
                    <img src={prop.imageUrl} alt={prop.name} className="acr-thumb" />
                    <div className="acr-info">
                      <div className="acr-title-row">
                        <strong>{prop.name}</strong>
                        <span className={`status-badge ${prop.status}`}>{prop.status}</span>
                      </div>
                      <span>
                        {prop.type} · {prop.district}, {prop.province} · ฿{prop.pricePerNight.toLocaleString()}/night
                      </span>
                    </div>
                    <div className="acr-actions">
                      {prop.status !== 'published' && (
                        <button
                          type="button"
                          className="table-action-btn primary"
                          onClick={() => handleQuickPublishProperty(prop.id, prop.name)}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => navigate(`/admin/hotels/${prop.id}/edit`)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right: Community Journal & POTW Moderation */}
          <section className="admin-panel-card">
            <div className="admin-panel-head">
              <div>
                <h2>Community Journal & POTW</h2>
                <p>Feature traveler photos in Picture of the Week or moderate posts</p>
              </div>
              <button
                type="button"
                className="admin-link-btn"
                onClick={() => navigate('/admin/database?table=posts')}
              >
                All Posts in DB →
              </button>
            </div>

            {loading ? (
              <div className="admin-empty-msg">Loading community posts...</div>
            ) : posts.length === 0 ? (
              <div className="admin-empty-msg">No community posts yet.</div>
            ) : (
              <div className="admin-compact-list">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="admin-compact-row">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="acr-thumb" />
                    ) : (
                      <div className="acr-thumb placeholder">Aa</div>
                    )}
                    <div className="acr-info">
                      <div className="acr-title-row">
                        <strong>{post.author_name || 'Traveler'}</strong>
                        {post.location_tag && <small className="acr-loc">{post.location_tag}</small>}
                      </div>
                      <span className="acr-ellipsis">
                        {post.content || 'Photo shared in Community Journal'}
                      </span>
                    </div>
                    <div className="acr-actions">
                      <button
                        type="button"
                        className={`table-action-btn ${post.join_potw ? 'active-potw' : ''}`}
                        onClick={() => handleTogglePotw(post)}
                        title="Toggle Picture of the Week"
                      >
                        {post.join_potw ? '★ In POTW' : '☆ Add POTW'}
                      </button>
                      <button
                        type="button"
                        className="table-action-btn danger"
                        onClick={() => handleDeletePost(post)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
